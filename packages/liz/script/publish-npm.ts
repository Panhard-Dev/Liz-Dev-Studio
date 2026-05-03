#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@liz-ai-brasil/script"
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

const publicPackageName = "liz-ai-brasil"

async function published(name: string, version: string) {
  return (await $`npm view ${name}@${version} version`.nothrow()).exitCode === 0
}

async function publish(dir: string, name: string, version: string) {
  if (process.platform !== "win32") await $`chmod -R 755 .`.cwd(dir)
  if (await published(name, version)) {
    console.log(`already published ${name}@${version}`)
    return
  }
  await $`bun pm pack`.cwd(dir)
  await $`npm publish *.tgz --access public --tag ${Script.channel}`.cwd(dir)
}

const binaries: Record<string, string> = {}

for (const filepath of new Bun.Glob("*/package.json").scanSync({ cwd: "./dist" })) {
  const distPackage = await Bun.file(`./dist/${filepath}`).json()
  binaries[distPackage.name] = distPackage.version
}

if (Object.keys(binaries).length === 0) {
  console.error("No CLI binaries found in packages/liz/dist. Run `bun run build` from packages/liz first.")
  process.exit(1)
}

const version = Object.values(binaries)[0]

await $`mkdir -p ./dist/${publicPackageName}`
await $`cp -r ./bin ./dist/${publicPackageName}/bin`
await $`cp ./script/postinstall.mjs ./dist/${publicPackageName}/postinstall.mjs`

await Bun.file(`./dist/${publicPackageName}/package.json`).write(
  JSON.stringify(
    {
      name: publicPackageName,
      description: "LIZ AI BRASIL CLI",
      bin: {
        [pkg.name]: `./bin/${pkg.name}`,
        [publicPackageName]: `./bin/${pkg.name}`,
      },
      scripts: {
        postinstall: "bun ./postinstall.mjs || node ./postinstall.mjs",
      },
      version,
      license: "UNLICENSED",
      optionalDependencies: binaries,
    },
    null,
    2,
  ),
)

await Promise.all(Object.entries(binaries).map(([name]) => publish(`./dist/${name}`, name, binaries[name])))
await publish(`./dist/${publicPackageName}`, publicPackageName, version)
