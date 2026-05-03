import { $ } from "bun"

await $`bun ./scripts/copy-icons.ts ${process.env.LIZ_CHANNEL ?? "dev"}`

await $`cd ../liz && bun script/build-node.ts`
