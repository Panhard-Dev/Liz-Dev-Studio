// @ts-nocheck

import { Global as LizCore } from "@liz-ai-brasil/core/global"
import { ReadTool } from "@liz-ai-brasil/core/tools"

const liz = LizCore.make({})

liz.tool.add(ReadTool)

liz.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

liz.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

liz.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await liz.session.create({
  agent: "build",
})

liz.subscribe((event) => {
  console.log(event)
})

await liz.session.prompt({
  sessionID,
  text: "hey what is up",
})

await liz.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await liz.session.wait()

console.log(await liz.session.messages(sessionID))
