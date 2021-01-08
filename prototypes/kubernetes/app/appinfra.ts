import * as pulumi from "@pulumi/pulumi"
import * as rancher2 from "@pulumi/rancher2"
import { readFileAsString, throws, installChartInNameSpace } from '../utils'
import { idemia } from "../config"
import * as kx from '@pulumi/kubernetesx'
import * as k8s from "@pulumi/kubernetes"
import { Input } from "@pulumi/pulumi/output"
import * as yaml from "js-yaml"
import { ChartOpts, FetchOpts } from "@pulumi/kubernetes/helm/v3"
import { kafka, clickhouse } from '../infra/yaml/crds/nodejs'
import { flatMap } from 'lodash/fp'
import * as kube from '@kubernetes/client-node'
import { RxHR } from '@akanass/rx-http-request'
import * as url from 'url'
import { delay, first, repeat, retry, timeout, map, tap, filter } from "rxjs/operators"

export class AppInfra extends pulumi.ComponentResource {
    args: IdemiaAppArgs
    options: any

    constructor(name: string, args: IdemiaAppArgs, opts?: pulumi.ResourceOptions) {
        super("idemia:appinfra", name, args, opts,)
        {
            this.args = args
            this.options = { parent: this, provider: this.args.kubeProvider }

            const cluster = this.kafkaCluster()
            this.kafkaTopic(cluster)
            this.sqlpad()
            this.kowl(cluster)
            this.clickhouseDb()
        }
    }

    sqlpad() {
        const namespace = new k8s.core.v1.Namespace("sqlpad", {}, this.options)
        const pvc = new kx.PersistentVolumeClaim("data", {
            metadata: {
                namespace: namespace.metadata.name
            },
            spec: {
                accessModes: ["ReadWriteOnce"],
                resources: { requests: { storage: "1Gi" } }
            }
        }, this.options)
        const pb = new kx.PodBuilder({
            containers: [{
                image: "sqlpad/sqlpad:latest",
                ports: { http: 3000 },
                volumeMounts: [pvc.mount("/var/lib/sqlpad")],
                env: {
                    SQLPAD_ADMIN: 'admin@sqlpad.com',
                    SQLPAD_ADMIN_PASSWORD: 'admin'
                }
            }]
        })
        const deployment = new kx.Deployment("idemia-sqlpad", {
            metadata: {
                namespace: namespace.metadata.name
            },
            spec: pb.asDeploymentSpec()
        }, this.options)

        deployment.createService()
    }

    clickhouseDb() {
        // -u clickhouse_operator --password clickhouse_operator_password 
        const namespace = new k8s.core.v1.Namespace("clickhouse-idemia", {}, this.options)
        const db = new clickhouse.v1.ClickHouseInstallation("idemia", {
            metadata: {
                namespace: namespace.metadata.name
            },
            spec: {
                defaults: {
                    templates: {
                        dataVolumeClaimTemplate: "volume-template",
                        logVolumeClaimTemplate: "volume-template",
                    }
                },
                configuration: {
                    zookeeper: {
                        nodes: [{ host: "zk-cs.zookeeper.svc" }]
                    },
                    clusters: [{
                        name: "main",
                        layout: {
                            replicasCount: 3
                        }
                    }]
                },
                templates: {
                    volumeClaimTemplates: [
                        {
                            name: "volume-template",
                            spec: {
                                accessModes: [
                                    "ReadWriteOnce"
                                ],
                                resources: {
                                    requests: {
                                        storage: "100Gi"
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }, this.options)
    }

    kafkaTopic(cluster: kafka.v1beta1.Kafka) {
        const kafkaCluster = new kafka.v1beta1.KafkaTopic("idemia", {
            metadata: {
                namespace: "kafka",
                labels: {
                    "strimzi.io/cluster": cluster.metadata.name as any
                }
            },
            spec: {
                partitions: 6,
                replicas: 3,
                config: {
                    "retention.bytes": 10 * 10**9, // 10 GB
                }
            }
        }, this.options)
    }

    kafkaCluster() {
        return new kafka.v1beta1.Kafka("idemia", {
            metadata: {
                namespace: "kafka"
            },
            spec: {
                kafka: {
                    replicas: 3,
                    listeners: {
                        plain: {}
                    },
                    storage: {
                        type: "jbod",
                        volumes: [{
                            id: 1,
                            type: "persistent-claim",
                            size: "20Gi",
                            deleteClaim: false
                        }]
                    },
                    config: {
                        "offsets.topic.replication.factor": 1,
                        "transaction.state.log.replication.factor": 1,
                        "transaction.state.log.min.isr": 1
                    }
                },
                zookeeper: {
                    replicas: 1,
                    storage: {
                        type: "persistent-claim",
                        size: "100Gi",
                        deleteClaim: false
                    }
                },
                entityOperator: {
                    topicOperator: {},
                    userOperator: {}
                }
            }
        }, this.options)
    }

    kowl(cluster: kafka.v1beta1.Kafka) {
        const kowlValues = pulumi.all({ cluserName: cluster.metadata.name, kubeConfig: this.args.kubeConfig })
            .apply(async it => {
                const { cluserName, kubeConfig } = it
                const kc = new kube.KubeConfig()
                kc.loadFromString(kubeConfig!)
                const server = kc.getCurrentCluster()?.server!
                const options = {
                    uri: `${server}/apis/kafka.strimzi.io/v1beta1/namespaces/kafka/kafkas/${cluserName}`
                }
                kc.applyToRequest(options)
                // pulumi.log.warn("options: " + JSON.stringify(options), this)
                // pulumi.log.warn("this.args.kubeConfig: " + JSON.stringify(kubeConfig), this)
                const bootstrapServers = await RxHR.get<any>(options.uri, options as any)
                    .pipe(
                        timeout(500),
                        retry(),
                        delay(1500),
                        repeat(),
                        filter(it => it.response.statusCode == 200),
                        map(it => JSON.parse(it.body)),
                        // tap(it => pulumi.log.warn(`PRE: ${JSON.stringify(it)}`)),
                        map(it => flatMap(it2 => it2.bootstrapServers.split(","), it.status.listeners)),
                        // tap(it => pulumi.log.warn(`POST: ${it}`)),
                        first(it => it.length > 0),
                    ).toPromise()
                return bootstrapServers
            }).apply(it => ({
                kowl: {
                    config: {
                        kafka: {
                            brokers: it
                        }
                    }
                }
            }))

        installChartInNameSpace(this, "kowl", "kowl", {
            fetchOpts: {
                repo: "https://raw.githubusercontent.com/cloudhut/charts/master/archives"
            },
            values: kowlValues
        }, [cluster])
    }
}

interface IdemiaAppArgs {
    kubeConfig: pulumi.Input<string>,
    kubeProvider: k8s.Provider,
}