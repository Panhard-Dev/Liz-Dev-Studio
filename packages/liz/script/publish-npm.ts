#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@liz-ai-brasil/script"
import { fileURLToPath } from "url"
import { cp, mkdir, rm } from "fs/promises"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

const publicPackageName = "liz-ai-brasil"
const publicHomepage = "https://liz-ai-brasil.vercel.app"

async function published(name: string, version: string) {
  return (await $`npm view ${name}@${version} version`.nothrow()).exitCode === 0
}

async function publish(dir: string, name: string, version: string) {
  if (process.platform !== "win32") await $`chmod -R 755 .`.cwd(dir)
  if (await published(name, version)) {
    console.log(`already published ${name}@${version}`)
    return
  }
  await Promise.all(Array.from(new Bun.Glob("*.tgz").scanSync({ cwd: dir })).map((file) => rm(`${dir}/${file}`)))
  await $`bun pm pack`.cwd(dir)
  const tarball = Array.from(new Bun.Glob("*.tgz").scanSync({ cwd: dir }))[0]
  if (!tarball) {
    console.error(`No npm tarball created for ${name}@${version}`)
    process.exit(1)
  }
  await $`npm publish ${tarball} --access public --tag ${Script.channel}`.cwd(dir)
}

const binaries: Record<string, string> = {}

for (const filepath of new Bun.Glob("*/package.json").scanSync({ cwd: "./dist" })) {
  const distPackage = await Bun.file(`./dist/${filepath}`).json()
  if (distPackage.name === publicPackageName) continue
  binaries[distPackage.name] = distPackage.version
}

if (Object.keys(binaries).length === 0) {
  console.error("No CLI binaries found in packages/liz/dist. Run `bun run build` from packages/liz first.")
  process.exit(1)
}

const version = Object.values(binaries)[0]

await mkdir(`./dist/${publicPackageName}`, { recursive: true })
await cp("./bin", `./dist/${publicPackageName}/bin`, { recursive: true, force: true })
await cp("./script/postinstall.mjs", `./dist/${publicPackageName}/postinstall.mjs`)

await Bun.file(`./dist/${publicPackageName}/package.json`).write(
  JSON.stringify(
    {
      name: publicPackageName,
      description: "LIZ AI BRASIL CLI",
      homepage: publicHomepage,
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

for (const [name, version] of Object.entries(binaries)) await publish(`./dist/${name}`, name, version)
await publish(`./dist/${publicPackageName}`, publicPackageName, version)
