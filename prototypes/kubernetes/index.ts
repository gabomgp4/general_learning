import {Infra} from "./infra";
import {AppInfra} from "./app";

const infra = new Infra("idemia", {})

const app = new AppInfra("idemia", {kubeProvider: infra.kubeProvider, kubeConfig: infra.kubeConfig}, {dependsOn: infra})

export const rancherFdqn = infra.rancherFdqn