#!/usr/bin/env bun
import { $ } from "bun"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

const output = path.join(dir, "dist", "npm-github")
const assets = path.join(output, "assets")
await $`rm -rf ${output}`
await $`mkdir -p ${assets}`

const built = await Array.fromAsync(new Bun.Glob("*/package.json").scan({ cwd: "./dist" }))
const packages = built.filter((file) => file.startsWith("liz-"))

if (packages.length === 0) {
  console.error("No built CLI packages found in packages/liz/dist. Run build before packing.")
  process.exit(1)
}

for (const file of packages) {
  const distPackage = await Bun.file(`./dist/${file}`).json()
  const os = distPackage.os?.[0]
  const cpu = distPackage.cpu?.[0]
  const source = path.dirname(path.join(dir, "dist", file))
  const target = path.join(output, distPackage.name)
  const bin = path.join(target, "bin")

  await $`mkdir -p ${bin}`
  await $`cp ./bin/liz ${path.join(bin, "liz")}`
  await $`cp ${path.join(source, "bin", os === "win32" ? "liz.exe" : "liz")} ${path.join(bin, os === "win32" ? ".liz.exe" : ".liz")}`

  await Bun.file(path.join(target, "package.json")).write(
    JSON.stringify(
      {
        name: "liz-ai-brasil",
        version: distPackage.version,
        description: "LIZ AI BRASIL CLI",
        license: "UNLICENSED",
        os: distPackage.os,
        cpu: distPackage.cpu,
        bin: {
          liz: "./bin/liz",
          "liz-ai-brasil": "./bin/liz",
        },
      },
      null,
      2,
    ),
  )

  const pack = Bun.spawn(["npm", "pack", target, "--pack-destination", assets], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdout = await new Response(pack.stdout).text()
  const stderr = await new Response(pack.stderr).text()
  const exitCode = await pack.exited
  if (exitCode !== 0) {
    console.error(stderr)
    process.exit(exitCode)
  }

  const packed = stdout.trim().split(/\r?\n/).at(-1)
  if (!packed) {
    console.error("npm pack did not return a tarball name.")
    process.exit(1)
  }
  await fs.rename(
    path.join(assets, packed),
    path.join(assets, `liz-ai-brasil-${distPackage.name.replace("liz-", "")}.tgz`),
  )
}
