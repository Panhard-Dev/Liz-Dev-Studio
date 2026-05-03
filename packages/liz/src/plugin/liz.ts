import type { Hooks, PluginInput } from "@liz-ai-brasil/plugin"
import { Auth } from "@/auth"
import { AppRuntime } from "@/effect/app-runtime"
import { Effect } from "effect"
import { setTimeout as sleep } from "node:timers/promises"

const DEFAULT_API_BASE_URL = "https://liz-ai-brasil-api.studiosluxgames.workers.dev/api/v1"
const DEFAULT_WEB_BASE_URL = "https://liziabr.qzz.io"
type CliLoginStart = {
  apiBase: string
  deviceCode: string
  verificationUrl: string
  expiresIn: number
  intervalMs: number
}

type CliPollResult =
  | {
      status: "pending"
      intervalMs: number
    }
  | {
      status: "approved"
      accessToken: string
      refreshToken: string
      expiresIn: number
    }

type CliRefreshResult = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

type CliOauthSession = {
  apiBase: string
  access: string
  refresh: string
  expires: number
  accountId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function trimTrailingSlash(value: string | undefined) {
  const normalized = asString(value)
  return normalized ? normalized.replace(/\/+$/, "") : undefined
}

function apiBaseCandidates() {
  return [
    process.env.LIZ_AUTH_API_BASE_URL,
    process.env.LIZ_AI_BRASIL_API_BASE_URL,
    process.env.LIZ_BACKEND_API_BASE_URL,
    process.env.LIZ_API_BASE_URL,
    DEFAULT_API_BASE_URL,
  ]
    .map(trimTrailingSlash)
    .filter((item): item is string => Boolean(item))
    .filter((item, index, list) => list.indexOf(item) === index)
}

function webBaseUrl() {
  return (
    [process.env.LIZ_AUTH_WEB_BASE_URL, process.env.LIZ_WEB_BASE_URL]
      .map(trimTrailingSlash)
      .find((item): item is string => Boolean(item)) ?? DEFAULT_WEB_BASE_URL
  )
}

async function startCliLogin(apiBase: string): Promise<CliLoginStart | undefined> {
  const response = await fetch(`${apiBase}/auth/cli/start`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client: "liz-cli",
      web_base_url: webBaseUrl(),
    }),
  })
  if (!response.ok) return

  const data = (await response.json()) as unknown
  if (!isRecord(data)) return

  const deviceCode = asString(data.device_code).toLowerCase()
  const verificationUrl = asString(data.verification_url)
  if (!deviceCode || !verificationUrl) return

  return {
    apiBase,
    deviceCode,
    verificationUrl,
    expiresIn: Math.max(asNumber(data.expires_in, 900), 30),
    intervalMs: Math.max(asNumber(data.interval, 2), 1) * 1000,
  }
}

async function startFirstCliLogin() {
  for (const apiBase of apiBaseCandidates()) {
    const started = await startCliLogin(apiBase).catch(() => undefined)
    if (started) return started
  }
}

async function pollCliLogin(apiBase: string, deviceCode: string): Promise<CliPollResult | undefined> {
  const response = await fetch(`${apiBase}/auth/cli/poll?${new URLSearchParams({ device_code: deviceCode })}`, {
    headers: {
      Accept: "application/json",
    },
  })
  if (!response.ok) return

  const data = (await response.json()) as unknown
  if (!isRecord(data)) return

  if (data.status === "pending") {
    return {
      status: "pending",
      intervalMs: Math.max(asNumber(data.interval, 2), 1) * 1000,
    }
  }

  const accessToken = asString(data.access_token)
  const refreshToken = asString(data.refresh_token)
  if (data.status !== "approved" || !accessToken || !refreshToken) return

  return {
    status: "approved",
    accessToken,
    refreshToken,
    expiresIn: Math.max(asNumber(data.expires_in, 3600), 60),
  }
}

async function refreshCliLogin(apiBase: string, refreshToken: string): Promise<CliRefreshResult | undefined> {
  const response = await fetch(`${apiBase}/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  })
  if (!response.ok) return

  const data = (await response.json()) as unknown
  if (!isRecord(data)) return

  const accessToken = asString(data.access_token)
  const refreshTokenNext = asString(data.refresh_token)
  if (!accessToken || !refreshTokenNext) return

  return {
    accessToken,
    refreshToken: refreshTokenNext,
    expiresIn: Math.max(asNumber(data.expires_in, 900), 60),
  }
}

async function saveOauthSession(session: CliOauthSession) {
  await AppRuntime.runPromise(
    Effect.gen(function* () {
      const auth = yield* Auth.Service
      yield* auth.set("liz", {
        type: "oauth",
        access: session.access,
        refresh: session.refresh,
        expires: session.expires,
        accountId: session.accountId,
        enterpriseUrl: session.apiBase,
      })
    }),
  ).catch(() => {})
}

async function refreshOauthSession(session: CliOauthSession) {
  const refreshed = await refreshCliLogin(session.apiBase, session.refresh).catch(() => undefined)
  if (!refreshed) return

  const next = {
    ...session,
    access: refreshed.accessToken,
    refresh: refreshed.refreshToken,
    expires: Date.now() + refreshed.expiresIn * 1000,
  } satisfies CliOauthSession
  await saveOauthSession(next)
  return next
}

async function resolveOauthSession(info: {
  access: string
  refresh: string
  expires: number
  accountId?: string
  enterpriseUrl?: string
}) {
  const session = {
    apiBase: trimTrailingSlash(info.enterpriseUrl) ?? DEFAULT_API_BASE_URL,
    access: info.access,
    refresh: info.refresh,
    expires: info.expires,
    accountId: info.accountId,
  } satisfies CliOauthSession
  if (session.expires > Date.now() + 60_000) return session

  const refreshed = await refreshOauthSession(session)
  if (refreshed) return refreshed
  return session
}

export async function LizAuthPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "liz",
      async loader(auth) {
        const info = await auth()
        if (!info || info.type !== "oauth") return {}
        let session = await resolveOauthSession(info)

        const requestWithBearer = (token: string, input: RequestInfo | URL, init?: RequestInit) => {
          if (input instanceof Request) {
            const headers = new Headers(input.headers)
            if (init?.headers) {
              new Headers(init.headers).forEach((value, key) => headers.set(key, value))
            }
            headers.set("Authorization", `Bearer ${token}`)
            return fetch(new Request(input, { ...init, headers }))
          }
          const headers = new Headers(init?.headers)
          headers.set("Authorization", `Bearer ${token}`)
          return fetch(input, {
            ...init,
            headers,
          })
        }

        return {
          apiKey: session.access,
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
          fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const response = await requestWithBearer(session.access, input, init)
            if (response.status !== 401) return response

            const refreshed = await refreshOauthSession(session)
            if (!refreshed) return response
            session = refreshed
            return requestWithBearer(session.access, input, init)
          },
        }
      },
      methods: [
        {
          label: "Entrar com LIZ AI BRASIL",
          type: "oauth",
          authorize: async () => {
            const started = await startFirstCliLogin()
            if (!started) {
              throw new Error("Nao foi possivel iniciar o login da LIZ AI BRASIL.")
            }

            return {
              url: started.verificationUrl,
              instructions: "Abra o link, entre na sua conta LIZ AI BRASIL e volte para este terminal.",
              method: "auto" as const,
              async callback() {
                const deadline = Date.now() + started.expiresIn * 1000
                let intervalMs = started.intervalMs

                while (Date.now() < deadline) {
                  const result = await pollCliLogin(started.apiBase, started.deviceCode).catch(() => undefined)

                  if (result?.status === "approved") {
                    return {
                      type: "success" as const,
                      provider: "liz",
                      refresh: result.refreshToken,
                      access: result.accessToken,
                      expires: Date.now() + result.expiresIn * 1000,
                      enterpriseUrl: started.apiBase,
                    }
                  }

                  if (result?.status === "pending") intervalMs = result.intervalMs
                  await sleep(intervalMs)
                }

                return { type: "failed" as const }
              },
            }
          },
        },
      ],
    },
  }
}
