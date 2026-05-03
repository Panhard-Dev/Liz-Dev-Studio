import { Layer } from "effect"
import { TuiConfig } from "./config/tui"
import { Npm } from "@liz-ai-brasil/core/npm"
import { Observability } from "@liz-ai-brasil/core/effect/observability"

export const CliLayer = Observability.layer.pipe(Layer.merge(TuiConfig.layer), Layer.provide(Npm.defaultLayer))
