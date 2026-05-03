import { Auth } from "@/auth"
import { AppRuntime } from "@/effect/app-runtime"
import { Effect } from "effect"
import { Hono } from "hono"
import { readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const DEFAULT_API_BASE_URL = "https://liz-ai-brasil-api.studiosluxgames.workers.dev/api/v1"

type LizSession = {
  apiBase: string
  access: string
  refresh?: string
  expires: number
  accountId?: string
}

type LizStoredAuth =
  | {
      type: "oauth"
      access: string
      refresh: string
      expires: number
      enterpriseUrl?: string
      accountId?: string
    }
  | {
      type: "api"
      key: string
    }

type RefreshResult = {
  access_token: string
  refresh_token: string
  expires_in: number
}

type LizRemoteUser = {
  id?: string
  email?: string
  displayName?: string
  username?: string
  avatarUrl?: string
}

function trimTrailingSlash(value: string | undefined) {
  const normalized = String(value || "").trim()
  return normalized ? normalized.replace(/\/+$/, "") : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseJwtClaims(token: string) {
  const parts = token.split(".")
  if (parts.length !== 3 || !parts[1]) return
  try {
    const parsed = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as unknown
    if (!isRecord(parsed)) return
    return parsed
  } catch {
    return
  }
}

function sessionEmail(session: LizSession) {
  const claims = parseJwtClaims(session.access)
  if (!claims) return
  return (
    asString(claims.email) ||
    asString(claims.preferred_username) ||
    asString(claims.upn) ||
    asString(claims.unique_name) ||
    undefined
  )
}

function readLizRemoteUser(value: unknown): LizRemoteUser | undefined {
  if (!isRecord(value)) return
  return {
    id: asString(value.id) || undefined,
    email: asString(value.email) || undefined,
    displayName: asString(value.display_name) || asString(value.displayName) || undefined,
    username: asString(value.username) || undefined,
    avatarUrl: asString(value.avatar_url) || asString(value.avatarUrl) || asString(value.picture) || undefined,
  }
}

async function fetchLizRemoteUser(apiBase: string, access: string): Promise<{ status: number; user?: LizRemoteUser }> {
  const response = await fetch(`${apiBase}/users/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${access}`,
    },
  })

  if (!response.ok) return { status: response.status }
  const data = (await response.json().catch(() => undefined)) as unknown
  return {
    status: response.status,
    user: readLizRemoteUser(data),
  }
}

function readOAuth(value: Record<string, unknown>): LizStoredAuth | undefined {
  const access = asString(value.access)
  const refresh = asString(value.refresh)
  if (value.type !== "oauth" || !access || !refresh) return
  return {
    type: "oauth",
    access,
    refresh,
    expires: asNumber(value.expires, 0),
    enterpriseUrl: trimTrailingSlash(asString(value.enterpriseUrl)),
    accountId: asString(value.accountId) || undefined,
  }
}

function readApi(value: Record<string, unknown>): LizStoredAuth | undefined {
  const key = asString(value.key)
  if (value.type !== "api" || !key) return
  return {
    type: "api",
    key,
  }
}

async function readCliLizAuth(): Promise<LizStoredAuth | undefined> {
  const data = (await readFile(path.join(os.homedir(), ".local", "share", "liz", "auth.json"), "utf8")
    .then((content) => JSON.parse(content) as unknown)
    .catch(() => undefined)) as unknown
  if (!isRecord(data)) return

  const liz = data.liz
  if (!isRecord(liz)) return

  return readOAuth(liz) ?? readApi(liz)
}

async function refreshLizToken(apiBase: string, refreshToken: string): Promise<RefreshResult | undefined> {
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
  const nextRefreshToken = asString(data.refresh_token)
  if (!accessToken || !nextRefreshToken) return

  return {
    access_token: accessToken,
    refresh_token: nextRefreshToken,
    expires_in: Math.max(asNumber(data.expires_in, 900), 60),
  }
}

async function getLizSession(): Promise<LizSession | undefined> {
  return AppRuntime.runPromise(
    Effect.gen(function* () {
      const auth = yield* Auth.Service
      const info = (yield* auth.get("liz")) ?? (yield* Effect.promise(() => readCliLizAuth()))
      if (!info) return

      if (info.type === "api") {
        return {
          apiBase: DEFAULT_API_BASE_URL,
          access: info.key,
          expires: Number.MAX_SAFE_INTEGER,
        }
      }
      if (info.type !== "oauth") return

      const apiBase = trimTrailingSlash(info.enterpriseUrl) ?? DEFAULT_API_BASE_URL
      if (info.expires > Date.now() + 60_000) {
        return {
          apiBase,
          access: info.access,
          refresh: info.refresh,
          expires: info.expires,
          accountId: info.accountId,
        }
      }

      const refreshed = yield* Effect.promise(() => refreshLizToken(apiBase, info.refresh).catch(() => undefined))
      if (!refreshed) {
        return {
          apiBase,
          access: info.access,
          refresh: info.refresh,
          expires: info.expires,
          accountId: info.accountId,
        }
      }

      const next = {
        type: "oauth" as const,
        access: refreshed.access_token,
        refresh: refreshed.refresh_token,
        expires: Date.now() + refreshed.expires_in * 1000,
        accountId: info.accountId,
        enterpriseUrl: apiBase,
      }
      yield* auth.set("liz", next)
      return {
        apiBase,
        access: next.access,
        refresh: next.refresh,
        expires: next.expires,
        accountId: next.accountId,
      }
    }),
  )
}

async function saveLizSession(session: {
  access: string
  refresh: string
  expires: number
  accountId?: string
  enterpriseUrl?: string
}) {
  await AppRuntime.runPromise(
    Effect.gen(function* () {
      const auth = yield* Auth.Service
      yield* auth.set("liz", {
        type: "oauth",
        access: session.access,
        refresh: session.refresh,
        expires: session.expires,
        accountId: session.accountId,
        enterpriseUrl: trimTrailingSlash(session.enterpriseUrl) ?? DEFAULT_API_BASE_URL,
      })
    }),
  ).catch(() => {})
}

async function clearLizSession() {
  await AppRuntime.runPromise(
    Effect.gen(function* () {
      const auth = yield* Auth.Service
      yield* auth.remove("liz")
    }),
  ).catch(() => {})
}

async function proxyLizJsonResponse(response: Response) {
  const headers = new Headers(response.headers)
  headers.delete("content-encoding")
  headers.delete("content-length")
  headers.delete("transfer-encoding")
  const body = await response.text()
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const LizRoutes = () => {
  const app = new Hono()

  app.get("/account", async (c) => {
    const session = await getLizSession()
    if (!session) {
      return c.json(
        {
          connected: false,
          message: "Conecte a LIZ AI BRASIL com /connect.",
        },
        401,
      )
    }

    let active = session
    let profile = await fetchLizRemoteUser(active.apiBase, active.access).catch(() => ({
      status: 0,
      user: undefined as LizRemoteUser | undefined,
    }))

    if (profile.status === 401 && active.refresh) {
      const refreshed = await refreshLizToken(active.apiBase, active.refresh).catch(() => undefined)
      if (refreshed) {
        const next = {
          access: refreshed.access_token,
          refresh: refreshed.refresh_token,
          expires: Date.now() + refreshed.expires_in * 1000,
          accountId: active.accountId,
          enterpriseUrl: active.apiBase,
        }
        await saveLizSession(next)
        active = {
          apiBase: active.apiBase,
          access: next.access,
          refresh: next.refresh,
          expires: next.expires,
          accountId: next.accountId,
        }
        profile = await fetchLizRemoteUser(active.apiBase, active.access).catch(() => ({
          status: 0,
          user: undefined as LizRemoteUser | undefined,
        }))
      }
    }

    if (profile.status === 401) {
      await clearLizSession()
      return c.json(
        {
          connected: false,
          message: "Sessao LIZ expirada. Conecte a LIZ AI BRASIL novamente.",
        },
        401,
      )
    }

    return c.json({
      connected: true,
      email: profile.user?.email || sessionEmail(active),
      accountId: active.accountId || profile.user?.id,
      displayName: profile.user?.displayName,
      username: profile.user?.username,
      avatarUrl: profile.user?.avatarUrl,
    })
  })

  return app.get("/usage", async (c) => {
    const session = await getLizSession()
    if (!session) {
      return c.json(
        {
          connected: false,
          message: "Conecte a LIZ AI BRASIL com /connect.",
        },
        401,
      )
    }

    const response = await fetch(`${session.apiBase}/cli/usage`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.access}`,
      },
    })
    if (response.status !== 401) return proxyLizJsonResponse(response)
    if (!session.refresh) {
      await clearLizSession()
      return proxyLizJsonResponse(response)
    }

    const refreshed = await refreshLizToken(session.apiBase, session.refresh).catch(() => undefined)
    if (!refreshed) {
      await clearLizSession()
      return proxyLizJsonResponse(response)
    }

    const next = {
      access: refreshed.access_token,
      refresh: refreshed.refresh_token,
      expires: Date.now() + refreshed.expires_in * 1000,
      accountId: session.accountId,
      enterpriseUrl: session.apiBase,
    }
    await saveLizSession(next)

    const retry = await fetch(`${session.apiBase}/cli/usage`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${next.access}`,
      },
    })

    if (retry.status === 401) await clearLizSession()

    return proxyLizJsonResponse(retry)
  })
}
