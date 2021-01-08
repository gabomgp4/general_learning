import * as pulumi from "@pulumi/pulumi"
import * as random from "@pulumi/random"
import * as azure from "@pulumi/azure"
import * as rancher2 from "@pulumi/rancher2"
import { readFileAsString } from '../utils'
import { entries } from 'lodash/fp'
import { untilHttpIsReadyWithPause, untilHttpIsReady } from '../utils'

export class Rancher extends pulumi.ComponentResource {
    token: pulumi.Output<string>
    fdqn: pulumi.Output<string>
    constructor(name: string, args: RancherArgs, opts?: pulumi.ResourceOptions) {
        super("idemia:rancher", name, args, opts,)

        const { username, password, vmSize } = args
        const randomPet = new random.RandomPet(name, {}, { parent: this })
        const domainNameLabel = pulumi.interpolate`${name}-${randomPet.id}`
        const script = readFileAsString("rancher.sh")

        const resourceGroup = new azure.core.ResourceGroup(name, {
            location: azure.Locations.CentralUS,
        }, { parent: this })

        const network = new azure.network.VirtualNetwork(name, {
            resourceGroupName: resourceGroup.name,
            addressSpaces: ["10.0.0.0/16"]
        }, { parent: this })

        const subnet = new azure.network.Subnet(name, {
            resourceGroupName: resourceGroup.name,
            addressPrefixes: ["10.0.1.0/24"],
            virtualNetworkName: network.name
        }, { parent: this })

        const publicIP = new azure.network.PublicIp(name, {
            resourceGroupName: resourceGroup.name,
            allocationMethod: "Dynamic",
            domainNameLabel
        }, { parent: this })

        const userData = pulumi.interpolate
            `#!/bin/bash
            dns_name=${publicIP.fqdn}
            ${script}`

        const networkInterface = new azure.network.NetworkInterface(name, {
            resourceGroupName: resourceGroup.name,
            ipConfigurations: [{
                name: "webserveripcfg",
                subnetId: subnet.id,
                privateIpAddressAllocation: "Dynamic",
                publicIpAddressId: publicIP.id,
            }]
        }, { parent: this })

        const netSecurityGroup = new azure.network.NetworkSecurityGroup(name, {
            location: resourceGroup.location,
            resourceGroupName: resourceGroup.name,
            securityRules: allowInboundTcpPorts(100, { "http": 80, "https": 443, "ssh": 22 })
        }, { parent: this })

        const netSecurityGroupAssociation = new azure.network.SubnetNetworkSecurityGroupAssociation(name, {
            subnetId: subnet.id,
            networkSecurityGroupId: netSecurityGroup.id,
        }, { parent: this })

        const vm = new azure.compute.LinuxVirtualMachine(name, {
            resourceGroupName: resourceGroup.name,
            location: resourceGroup.location,
            computerName: name,

            size: vmSize,
            adminUsername: username,
            adminPassword: password,
            customData: userData.apply(it => Buffer.from(it).toString("base64")),
            networkInterfaceIds: [networkInterface.id],
            osDisk: {
                caching: "ReadWrite",
                storageAccountType: "Standard_LRS",
            },
            sourceImageReference: {
                publisher: "Canonical",
                offer: "UbuntuServer",
                sku: "18.04-LTS",
                version: "latest",
            },
            disablePasswordAuthentication: false,
        }, { parent: this })

        const fdqn = pulumi.all({ id: vm.id, name: publicIP.name, resourceGroupName: publicIP.resourceGroupName })
            .apply(async ip => {
                const pIp = await azure.network.getPublicIP({
                    name: ip.name,
                    resourceGroupName: ip.resourceGroupName,
                }, { async: true })
                pulumi.log.info(`Esperando a que Rancher responda código 200 en ${pIp.fqdn}`, this)
                await untilHttpIsReadyWithPause(`https://${pIp.fqdn}`).toPromise()

                return pIp.fqdn
            })

        const provider = new rancher2.Provider(name, {
            apiUrl: pulumi.interpolate`https://${fdqn}`,
            bootstrap: true
        }, { parent: this })

        const bootstrap = new rancher2.Bootstrap(name, {
            password: password
        }, {
            provider,
            parent: this
        })

        //TODO: porque no funciona si se registran los outpus con regiterOutputs?
        this.token = bootstrap.token
        this.fdqn = fdqn
    }
}

function allowInboundTcpPorts(startIndex: number, ports: _.Dictionary<number>) {
    return entries(ports).map((it, i) => ({
        name: it[0],
        priority: startIndex + i,
        direction: "Inbound",
        access: "Allow",
        protocol: "Tcp",
        sourcePortRange: "*",
        destinationPortRange: it[1].toString(),
        sourceAddressPrefix: "*",
        destinationAddressPrefix: "*",
    }))
}

interface RancherArgs extends pulumi.Inputs {
    location: pulumi.Input<azure.Location>,
    username: pulumi.Input<string>,
    password: pulumi.Input<string>,
    vmSize: pulumi.Input<string>
}
