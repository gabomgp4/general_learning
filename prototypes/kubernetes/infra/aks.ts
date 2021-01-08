import * as pulumi from "@pulumi/pulumi"
import * as rancher2 from "@pulumi/rancher2"
import { azure as azureConfig } from '../config'
import * as azure from "@pulumi/azure"
import { readFileAsString } from '../utils'

export class Aks extends pulumi.ComponentResource {
    constructor(name: string, args: AksArgs, opts?: pulumi.ResourceOptions) {
        super("idemia:aks", name, args, opts,)

        const resourceGroup = new azure.core.ResourceGroup(name, {
            location: azure.Locations.CentralUS,
        }, { parent: this });

        const network = new azure.network.VirtualNetwork(name, {
            resourceGroupName: resourceGroup.name,
            addressSpaces: ["10.0.0.0/16"]
        }, { parent: this });

        const subnet = new azure.network.Subnet(name, {
            resourceGroupName: resourceGroup.name,
            addressPrefixes: ["10.0.1.0/24"],
            virtualNetworkName: network.name
        }, { parent: this });

        const fooCluster = new rancher2.Cluster("fooCluster", {
            description: "Terraform AKS cluster",
            aksConfig: {
                resourceGroup: resourceGroup.name,
                kubernetesVersion: "1.19.3",
                agentDnsPrefix: "",
                clientId: azureConfig.clientId,
                clientSecret: azureConfig.clientSecret,
                masterDnsPrefix: "",
                sshPublicKeyContents: readFileAsString("./infra/aks-rsa.rsa"),
                subnet: subnet.id,
                subscriptionId: azureConfig.subscriptionId,
                tenantId: azureConfig.tenantId,
                virtualNetwork: network.name,
                virtualNetworkResourceGroup: resourceGroup.name
            },
        }, { parent: this });

    }
}

interface AksArgs {

}