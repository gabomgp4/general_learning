import * as fs from 'fs'
import { RxHR } from '@akanass/rx-http-request'
import { retry, timeout, delay, repeat, first } from 'rxjs/operators'
import * as date from 'date-fns'
import * as pulumi from "@pulumi/pulumi"
import * as rancher2 from "@pulumi/rancher2"
import * as kx from '@pulumi/kubernetesx'
import * as k8s from "@pulumi/kubernetes"
import { Input } from "@pulumi/pulumi/output"
import * as yaml from "js-yaml"
import { ChartOpts, FetchOpts } from "@pulumi/kubernetes/helm/v3"

export async function readFileAsString(fileName: string) {
    const buffer = await fs.promises.readFile(fileName)
    return buffer.toString()
}

export function untilHttpIsReady(url: string) {
    return RxHR.get(url).pipe(
        timeout(500),
        retry(),
        delay(1500),
        repeat(),
        first(it => it.response.statusCode == 200),
        timeout(date.addMinutes(Date.now(), 15))
    )
}

export function untilHttpIsReadyWithPause(url: string) {
    return untilHttpIsReady(url).pipe(
        // delay(date.addMinutes(new Date(), 3)),
        // repeat(2)
    )
}

export function throws(): never {
    throw Error("Código inaccesible ha sido ejecutado")
}

export function installChartInNameSpace(
    parent: IWithKubeProvider,
    namespace: string, chartName: string,
    chartConfig: Partial<ChartOpts>,
    dependsOn: Input<pulumi.Resource>[] = []
) {
    const namespace_ = new k8s.core.v1.Namespace(namespace,
        { metadata: { name: namespace } },
        { parent, provider: parent.args.kubeProvider })

    const chart = new k8s.helm.v3.Chart(namespace, {
        chart: chartName,
        namespace: namespace_.metadata.name,
        ...chartConfig
    }, { parent, provider: parent.args.kubeProvider, dependsOn: dependsOn })

    return chart
}

interface IWithKubeProvider extends pulumi.Resource {
    args: {
        kubeProvider: k8s.Provider,
    }
}