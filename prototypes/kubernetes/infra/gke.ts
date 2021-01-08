import * as pulumi from "@pulumi/pulumi"
import * as rancher2 from "@pulumi/rancher2"
import { readFileAsString } from '../utils'
import {idemia} from "../config"
import * as k8s from "@pulumi/kubernetes"

export class Gke extends pulumi.ComponentResource {
    clusterId: pulumi.Output<string>
    kubeProvider: k8s.Provider
    kubeConfig: pulumi.Output<string>

    constructor(name: string, args: GkeArgs, opts?: pulumi.ResourceOptions) {
        super("idemia:gke", name, args, opts,)

        const cluster = new rancher2.Cluster(name, {
            description: "Terraform AKS cluster",
            gkeConfig: {
                credential: idemia.gcpjsonauth,
                clusterIpv4Cidr: "",
                description: "",
                diskSizeGb: 100,
                locations: [],
                diskType: "pd-standard",
                enableAlphaFeature: false,
                enableAutoRepair: false,
                enableAutoUpgrade: false,
                enableHorizontalPodAutoscaling: false,
                enableHttpLoadBalancing: false,
                enableKubernetesDashboard: false,
                enableLegacyAbac: false,
                enableMasterAuthorizedNetwork: false,
                enableNetworkPolicyConfig: true,
                enableNodepoolAutoscaling: false,
                oauthScopes: [
                    "https://www.googleapis.com/auth/devstorage.read_only",
                    "https://www.googleapis.com/auth/logging.write",
                    "https://www.googleapis.com/auth/monitoring",
                    "https://www.googleapis.com/auth/servicecontrol",
                    "https://www.googleapis.com/auth/service.management.readonly",
                    "https://www.googleapis.com/auth/trace.append"
                ],
                enablePrivateEndpoint: false,
                enablePrivateNodes: false,
                enableStackdriverLogging: false,
                enableStackdriverMonitoring: false,
                imageType: "COS",
                ipPolicyClusterIpv4CidrBlock: "",
                ipPolicyClusterSecondaryRangeName: "",
                ipPolicyCreateSubnetwork: true,
                ipPolicyNodeIpv4CidrBlock: "",
                ipPolicyServicesIpv4CidrBlock: "",
                ipPolicyServicesSecondaryRangeName: "",
                ipPolicySubnetworkName: "",
                issueClientCertificate: true,
                kubernetesDashboard: false,
                localSsdCount: 0,
                machineType: "n1-highmem-2",
                maintenanceWindow: "",
                masterIpv4CidrBlock: "",
                masterVersion: "1.17.14-gke.400",
                maxNodeCount: 0,
                minNodeCount: 0,
                network: "default",
                nodeCount: 4,
                nodePool: "",
                nodeVersion: "",
                preemptible: false,
                projectId: "alpine-infinity-297919",
                region: "",
                serviceAccount: "104937535203892854751",
                subNetwork: "",
                useIpAliases: true,
                zone: "us-central1-f"
            },
        }, { parent: this, provider: args.rancherProvider })

        this.kubeProvider = new k8s.Provider(name, {kubeconfig: cluster.kubeConfig}, {parent: this})

        this.kubeConfig=cluster.kubeConfig
        this.clusterId = cluster.id
    }
}

interface GkeArgs {
    rancherProvider: rancher2.Provider
}