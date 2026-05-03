import { Server } from "../../server/server"
import { cmd } from "./cmd"
import { withNetworkOptions, resolveNetworkOptions } from "../network"
import { Flag } from "@liz-ai-brasil/core/flag/flag"

export const ServeCommand = cmd({
  command: "serve",
  builder: (yargs) => withNetworkOptions(yargs),
  describe: "starts a headless liz server",
  handler: async (args) => {
    if (!Flag.LIZ_SERVER_PASSWORD) {
      console.log("Warning: LIZ_SERVER_PASSWORD is not set; server is unsecured.")
    }
    const opts = await resolveNetworkOptions(args)
    const server = await Server.listen(opts)
    console.log(`liz server listening on http://${server.hostname}:${server.port}`)

    await new Promise(() => {})
    await server.stop()
  },
})
