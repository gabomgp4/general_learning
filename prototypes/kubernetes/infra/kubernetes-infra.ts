import * as pulumi from "@pulumi/pulumi"
import * as rancher2 from "@pulumi/rancher2"
import {readFileAsString, installChartInNameSpace} from '../utils'
import {idemia} from "../config"
import * as kx from '@pulumi/kubernetesx'
import * as k8s from "@pulumi/kubernetes"
import {Input} from "@pulumi/pulumi/output"
import * as yaml from "js-yaml"
import {ChartOpts, FetchOpts} from "@pulumi/kubernetes/helm/v3"
import {logging} from '../infra/yaml/crds/nodejs'
import {configuration} from '../infra/yaml/crds/nodejs'

export class KubernetesInfra extends pulumi.ComponentResource {
    args: KubernetesInfraArgs;

    constructor(name: string, args: KubernetesInfraArgs, opts?: pulumi.ResourceOptions) {
        super("idemia:kubernetes-infra", name, args, opts,)
        this.args = args

        this.monitoring()
        var logging = this.logging()
        this.configureLogging(logging)
        this.clickhouseOperator()
        this.kafkaOperator()
        this.loki()
        this.kong()
        this.certManager()
    }

    private monitoring() {
        return new rancher2.AppV2("rancher-monitoring", {
            name: "rancher-monitoring",
            chartName: "rancher-monitoring",
            namespace: "cattle-monitoring-system",
            chartVersion: "9.4.201",
            clusterId: this.args.clusterId,
            repoName: "rancher-charts",
        }, {parent: this, provider: this.args.rancherProvider})
    }

    private logging() {
        return new rancher2.AppV2("rancher-logging", {
            name: "rancher-logging",
            chartName: "rancher-logging",
            namespace: "cattle-logging-system",
            chartVersion: "3.6.001",
            clusterId: this.args.clusterId,
            repoName: "rancher-charts",
        }, {parent: this, provider: this.args.rancherProvider})
    }

    private clickhouseOperator() {
        const clickhouseOperator = new k8s.yaml.ConfigFile("clickhouse-operator",
            {file: "./infra/yaml/clickhouse-operator-install.yaml"},
            {provider: this.args.kubeProvider, parent: this})
    }


    private loki() {
        installChartInNameSpace(this, "loki", "loki", {
            fetchOpts: {
                repo: "https://grafana.github.io/loki/charts"
            },
        })
    }

    private kong() {
        new k8s.yaml.ConfigFile("kong",
            {file: "./infra/yaml/kong-all-in-one-dbless.yaml"},
            {provider: this.args.kubeProvider, parent: this})
    }

    private kafkaOperator() {
        const nsName = "kafka"
        const namespace = new k8s.core.v1.Namespace(nsName,
            {metadata: {name: nsName}},
            {provider: this.args.kubeProvider, parent: this})

        const clickhouseOperator = new k8s.yaml.ConfigFile("kafka",
            {file: "./infra/yaml/strimzi.yaml"},
            {provider: this.args.kubeProvider, parent: this, dependsOn: namespace})
    }

    private certManager() {
        const clickhouseOperator = new k8s.yaml.ConfigFile("cert-manager",
            {file: "./infra/yaml/cert-manager.yaml"},
            {provider: this.args.kubeProvider, parent: this})
    }

    private configureLogging(loggingResource: pulumi.Resource) {
        const clusterOutput = new logging.v1beta1.ClusterOutput("loki", {
            metadata: {
                namespace: "cattle-logging-system"
            },
            spec: {
                loki: {
                    url: "http://loki.loki.svc:3100",
                    configure_kubernetes_labels: true
                 }
            }
        }, {provider: this.args.kubeProvider, parent: this, dependsOn: loggingResource})


        new logging.v1beta1.ClusterFlow("loki", {
            metadata: {
                namespace: "cattle-logging-system"
            },
            spec: {
                globalOutputRefs: clusterOutput.metadata.apply(it => [it!.name ?? ""]),
                match: [{
                    select: {}
                }]
            }
        }, {provider: this.args.kubeProvider, parent: this})
    }
}

interface KubernetesInfraArgs {
    rancherProvider: rancher2.Provider,
    kubeProvider: k8s.Provider,
    clusterId: pulumi.Input<string>
}