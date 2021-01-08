// import * as k8s from "@pulumi/kubernetes"
// import * as kx from "@pulumi/kubernetesx"
import * as rancher2 from "@pulumi/rancher2"
import { Cluster } from "@pulumi/rancher2"
import * as pulumi from "@pulumi/pulumi"
import * as azure from "@pulumi/azure"
import { Rancher } from './rancher'
import { Gke } from './gke'
import {KubernetesInfra} from './kubernetes-infra'
import * as k8s from "@pulumi/kubernetes";
import {idemia} from "../config";

export class Infra extends pulumi.ComponentResource {
    rancherFdqn!: pulumi.Output<string>
    kubeProvider: k8s.Provider
    kubeConfig: pulumi.Output<string>

    constructor(name: string, args: InfraArgs, opts?: pulumi.ResourceOptions) {
        super("idemia:infra", name, args, opts,)

        const rancher = new Rancher("rancher", {
            location: "centralus",
            username: "gabomgp4",
            password: "monaliza007!",
            vmSize: "Standard_D2s_v3"
        }, {parent: this})

        const rancherProvider = new rancher2.Provider("provider", {
            apiUrl: pulumi.interpolate`https://${rancher.fdqn}`,
            tokenKey: rancher.token
        }, {parent: this})


        const gke = new Gke("gke", { rancherProvider }, {dependsOn: rancher, parent: this})

        const kubernetesInfra = new KubernetesInfra("idemia", {
            rancherProvider,
            kubeProvider: gke.kubeProvider,
            clusterId: gke.clusterId
        }, {dependsOn: [gke], parent: this})

        this.kubeProvider= gke.kubeProvider
        this.kubeConfig= gke.kubeConfig
        this.registerOutputs({
            rancherFdqn: rancher.fdqn,
        })
    }
}

interface InfraArgs {
}

