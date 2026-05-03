export * from "./client.js"
export * from "./server.js"

import { createLizClient } from "./client.js"
import { createLizServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createLiz(options?: ServerOptions) {
  const server = await createLizServer({
    ...options,
  })

  const client = createLizClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
