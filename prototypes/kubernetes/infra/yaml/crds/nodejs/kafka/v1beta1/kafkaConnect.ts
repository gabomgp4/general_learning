// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../../types/input";
import * as outputs from "../../types/output";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

export class KafkaConnect extends pulumi.CustomResource {
    /**
     * Get an existing KafkaConnect resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): KafkaConnect {
        return new KafkaConnect(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:kafka.strimzi.io/v1beta1:KafkaConnect';

    /**
     * Returns true if the given object is an instance of KafkaConnect.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is KafkaConnect {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === KafkaConnect.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"kafka.strimzi.io/v1beta1">;
    public readonly kind!: pulumi.Output<"KafkaConnect">;
    public readonly metadata!: pulumi.Output<ObjectMeta>;
    /**
     * The specification of the Kafka Connect cluster.
     */
    public readonly spec!: pulumi.Output<outputs.kafka.v1beta1.KafkaConnectSpec>;
    /**
     * The status of the Kafka Connect cluster.
     */
    public readonly status!: pulumi.Output<outputs.kafka.v1beta1.KafkaConnectStatus>;

    /**
     * Create a KafkaConnect resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: KafkaConnectArgs, opts?: pulumi.CustomResourceOptions) {
        let inputs: pulumi.Inputs = {};
        if (!(opts && opts.id)) {
            inputs["apiVersion"] = "kafka.strimzi.io/v1beta1";
            inputs["kind"] = "KafkaConnect";
            inputs["metadata"] = args ? args.metadata : undefined;
            inputs["spec"] = args ? args.spec : undefined;
            inputs["status"] = args ? args.status : undefined;
        } else {
            inputs["apiVersion"] = undefined /*out*/;
            inputs["kind"] = undefined /*out*/;
            inputs["metadata"] = undefined /*out*/;
            inputs["spec"] = undefined /*out*/;
            inputs["status"] = undefined /*out*/;
        }
        if (!opts) {
            opts = {}
        }

        if (!opts.version) {
            opts.version = utilities.getVersion();
        }
        super(KafkaConnect.__pulumiType, name, inputs, opts);
    }
}

/**
 * The set of arguments for constructing a KafkaConnect resource.
 */
export interface KafkaConnectArgs {
    readonly apiVersion?: pulumi.Input<"kafka.strimzi.io/v1beta1">;
    readonly kind?: pulumi.Input<"KafkaConnect">;
    readonly metadata?: pulumi.Input<ObjectMeta>;
    /**
     * The specification of the Kafka Connect cluster.
     */
    readonly spec?: pulumi.Input<inputs.kafka.v1beta1.KafkaConnectSpec>;
    /**
     * The status of the Kafka Connect cluster.
     */
    readonly status?: pulumi.Input<inputs.kafka.v1beta1.KafkaConnectStatus>;
}
