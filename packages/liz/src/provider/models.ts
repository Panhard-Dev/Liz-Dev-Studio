import { Global } from "@liz-ai-brasil/core/global"
import * as Log from "@liz-ai-brasil/core/util/log"
import path from "path"
import { Schema } from "effect"
import { Installation } from "../installation"
import { Flag } from "@liz-ai-brasil/core/flag/flag"
import { lazy } from "@/util/lazy"
import { Filesystem } from "@/util/filesystem"
import { Flock } from "@liz-ai-brasil/core/util/flock"
import { Hash } from "@liz-ai-brasil/core/util/hash"

// Try to import bundled snapshot (generated at build time)
// Falls back to undefined in dev mode when snapshot doesn't exist
/* @ts-ignore */

const log = Log.create({ service: "models.dev" })
const source = url()
const filepath = path.join(
  Global.Path.cache,
  source === "https://models.dev" ? "models.json" : `models-${Hash.fast(source)}.json`,
)
const ttl = 5 * 60 * 1000

const Cost = Schema.Struct({
  input: Schema.Finite,
  output: Schema.Finite,
  cache_read: Schema.optional(Schema.Finite),
  cache_write: Schema.optional(Schema.Finite),
  context_over_200k: Schema.optional(
    Schema.Struct({
      input: Schema.Finite,
      output: Schema.Finite,
      cache_read: Schema.optional(Schema.Finite),
      cache_write: Schema.optional(Schema.Finite),
    }),
  ),
})

export const Model = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  family: Schema.optional(Schema.String),
  release_date: Schema.String,
  attachment: Schema.Boolean,
  reasoning: Schema.Boolean,
  temperature: Schema.Boolean,
  tool_call: Schema.Boolean,
  interleaved: Schema.optional(
    Schema.Union([
      Schema.Literal(true),
      Schema.Struct({
        field: Schema.Literals(["reasoning_content", "reasoning_details"]),
      }),
    ]),
  ),
  cost: Schema.optional(Cost),
  limit: Schema.Struct({
    context: Schema.Finite,
    input: Schema.optional(Schema.Finite),
    output: Schema.Finite,
  }),
  modalities: Schema.optional(
    Schema.Struct({
      input: Schema.Array(Schema.Literals(["text", "audio", "image", "video", "pdf"])),
      output: Schema.Array(Schema.Literals(["text", "audio", "image", "video", "pdf"])),
    }),
  ),
  experimental: Schema.optional(
    Schema.Struct({
      modes: Schema.optional(
        Schema.Record(
          Schema.String,
          Schema.Struct({
            cost: Schema.optional(Cost),
            provider: Schema.optional(
              Schema.Struct({
                body: Schema.optional(Schema.Record(Schema.String, Schema.MutableJson)),
                headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
              }),
            ),
          }),
        ),
      ),
    }),
  ),
  status: Schema.optional(Schema.Literals(["alpha", "beta", "deprecated"])),
  provider: Schema.optional(
    Schema.Struct({ npm: Schema.optional(Schema.String), api: Schema.optional(Schema.String) }),
  ),
})
export type Model = Schema.Schema.Type<typeof Model>

export const Provider = Schema.Struct({
  api: Schema.optional(Schema.String),
  name: Schema.String,
  env: Schema.Array(Schema.String),
  id: Schema.String,
  npm: Schema.optional(Schema.String),
  models: Schema.Record(Schema.String, Model),
})

export type Provider = Schema.Schema.Type<typeof Provider>

const LIZ_CHAT_COMPLETIONS_BASE_URL = "https://liz-ai-brasil-api.studiosluxgames.workers.dev/api/v1/cli/liz/v1"

export const LIZ_PLACEHOLDER_MODEL_IDS = ["liz-2.3", "liz-2.5-pro", "liz-2.6-pro"] as const

export const LIZ_MODEL_API_IDS = {
  "liz-2.3": "kilocode/kilo-auto/free",
  "liz-2.5-pro": "codex/gpt-5.2",
  "liz-2.6-pro": "codex/gpt-5.3-codex",
} as const

const LIZ_PLACEHOLDER_MODELS = {
  "liz-2.3": {
    id: "liz-2.3",
    name: "Liz 2.3",
    family: "liz",
    release_date: "2026-05-02",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    status: "beta",
    modalities: { input: ["text"], output: ["text"] },
    cost: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
    limit: { context: 200000, output: 128000 },
    provider: { npm: "@ai-sdk/openai-compatible", api: LIZ_CHAT_COMPLETIONS_BASE_URL },
  },
  "liz-2.5-pro": {
    id: "liz-2.5-pro",
    name: "Liz 2.5 PRO",
    family: "liz-pro",
    release_date: "2026-05-02",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    status: "beta",
    modalities: { input: ["text"], output: ["text"] },
    cost: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
    limit: { context: 200000, output: 128000 },
    provider: { npm: "@ai-sdk/openai-compatible", api: LIZ_CHAT_COMPLETIONS_BASE_URL },
  },
  "liz-2.6-pro": {
    id: "liz-2.6-pro",
    name: "Liz 2.6 PRO",
    family: "liz-pro",
    release_date: "2026-05-02",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    status: "beta",
    modalities: { input: ["text"], output: ["text"] },
    cost: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
    limit: { context: 200000, output: 128000 },
    provider: { npm: "@ai-sdk/openai-compatible", api: LIZ_CHAT_COMPLETIONS_BASE_URL },
  },
} satisfies Record<string, Model>

export function isLizPlaceholderModel(id: string) {
  return LIZ_PLACEHOLDER_MODEL_IDS.some((item) => item === id)
}

export function lizModelApiID(id: string) {
  return LIZ_MODEL_API_IDS[id as keyof typeof LIZ_MODEL_API_IDS]
}

function url() {
  return Flag.LIZ_MODELS_URL || "https://models.dev"
}

function fresh() {
  return Date.now() - Number(Filesystem.stat(filepath)?.mtimeMs ?? 0) < ttl
}

function skip(force: boolean) {
  return !force && fresh()
}

const fetchApi = async () => {
  const result = await fetch(`${url()}/api.json`, {
    headers: { "User-Agent": Installation.USER_AGENT },
    signal: AbortSignal.timeout(10000),
  })
  return { ok: result.ok, text: await result.text() }
}

export const Data = lazy(async () => {
  const result = await Filesystem.readJson(Flag.LIZ_MODELS_PATH ?? filepath).catch(() => {})
  if (result) return result
  // @ts-ignore
  const snapshot = await import("./models-snapshot.js")
    .then((m) => m.snapshot as Record<string, unknown>)
    .catch(() => undefined)
  if (snapshot) return snapshot
  if (Flag.LIZ_DISABLE_MODELS_FETCH) return {}
  return Flock.withLock(`models-dev:${filepath}`, async () => {
    const result = await Filesystem.readJson(Flag.LIZ_MODELS_PATH ?? filepath).catch(() => {})
    if (result) return result
    const result2 = await fetchApi()
    if (result2.ok) {
      await Filesystem.write(filepath, result2.text).catch((e) => {
        log.error("Failed to write models cache", { error: e })
      })
    }
    return JSON.parse(result2.text)
  })
})

export async function get(): Promise<Record<string, Provider>> {
  const result = await Data()
  const providers = result as Record<string, Provider>
  const fallbackLiz = {
    id: "liz",
    name: "LIZ AI BRASIL",
    env: ["LIZ_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    api: LIZ_CHAT_COMPLETIONS_BASE_URL,
    models: {},
  } satisfies Provider
  const liz = providers.liz ?? fallbackLiz
  return {
    ...providers,
    liz: {
      id: liz.id,
      name: "LIZ AI BRASIL",
      env: liz.env,
      npm: liz.npm ?? fallbackLiz.npm,
      api: LIZ_CHAT_COMPLETIONS_BASE_URL,
      models: LIZ_PLACEHOLDER_MODELS,
    },
  }
}

export async function refresh(force = false) {
  if (skip(force)) return Data.reset()
  await Flock.withLock(`models-dev:${filepath}`, async () => {
    if (skip(force)) return Data.reset()
    const result = await fetchApi()
    if (!result.ok) return
    await Filesystem.write(filepath, result.text)
    Data.reset()
  }).catch((e) => {
    log.error("Failed to fetch models.dev", {
      error: e,
    })
  })
}

if (!Flag.LIZ_DISABLE_MODELS_FETCH && !process.argv.includes("--get-yargs-completions")) {
  void refresh()
  setInterval(
    async () => {
      await refresh()
    },
    60 * 1000 * 60,
  ).unref()
}

export * as ModelsDev from "./models"
