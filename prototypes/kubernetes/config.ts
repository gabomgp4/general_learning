import * as pulumi from "@pulumi/pulumi";
const azureConf = new pulumi.Config("azure");

export const azure = {
    clientId: azureConf.require("clientId"),
    clientSecret: azureConf.requireSecret("clientSecret"),
    subscriptionId: azureConf.require("subscriptionId"),
    tenantId: azureConf.require("tenantId"),
}

const conf = new pulumi.Config();
export const idemia = {
    gcpjsonauth: conf.requireSecret("gcpjsonauth")
}