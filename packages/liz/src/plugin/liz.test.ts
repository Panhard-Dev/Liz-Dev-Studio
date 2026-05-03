import { afterEach, describe, expect, test } from "bun:test"
import { AppRuntime } from "@/effect/app-runtime"
import { LizAuthPlugin } from "./liz"

const originalFetch = globalThis.fetch
const originalRunPromise = AppRuntime.runPromise

afterEach(() => {
  globalThis.fetch = originalFetch
  ;(AppRuntime as unknown as { runPromise: typeof AppRuntime.runPromise }).runPromise = originalRunPromise
})

describe("LizAuthPlugin", () => {
  test("refreshes oauth token and retries once after a 401 response", async () => {
    const seenAuth: string[] = []
    let requestCount = 0
    let saveCount = 0

    ;(AppRuntime as unknown as { runPromise: typeof AppRuntime.runPromise }).runPromise = (async () => {
      saveCount += 1
      return undefined
    }) as typeof AppRuntime.runPromise

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestCount += 1
      const url = String(input)
      const auth = new Headers(init?.headers).get("Authorization")
      if (auth) seenAuth.push(auth)

      if (url.endsWith("/auth/refresh")) {
        return new Response(
          JSON.stringify({
            access_token: "new-access",
            refresh_token: "new-refresh",
            expires_in: 3600,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (requestCount === 1) {
        return new Response(JSON.stringify({ error: { message: "Token expirado", code: 401 } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    const plugin = await LizAuthPlugin({} as never)
    const loader = plugin.auth?.loader
    if (!loader) throw new Error("liz auth loader not available")

    const options = await loader(
      async () =>
        ({
          type: "oauth",
          access: "old-access",
          refresh: "old-refresh",
          expires: Date.now() + 60 * 60 * 1000,
          enterpriseUrl: "https://liz-ai-brasil-api.studiosluxgames.workers.dev/api/v1",
        }) as never,
      {} as never,
    )

    const customFetch = options.fetch
    if (!customFetch) throw new Error("liz auth loader did not provide custom fetch")

    const response = await customFetch("https://example.test/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hello: "world" }),
    })

    expect(response.status).toBe(200)
    expect(requestCount).toBe(3)
    expect(saveCount).toBe(1)
    expect(seenAuth).toEqual(["Bearer old-access", "Bearer new-access"])
  })
})
