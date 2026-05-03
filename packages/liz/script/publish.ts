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
  // GitHub artifact downloads can drop the executable bit, and Docker uses the
  // unpacked dist binaries directly rather than the published tarball.
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
  const pkg = await Bun.file(`./dist/${filepath}`).json()
  binaries[pkg.name] = pkg.version
}
console.log("binaries", binaries)

if (Object.keys(binaries).length === 0) {
  console.error("No CLI binaries found in packages/liz/dist. Run the CLI build before publishing.")
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
      version: version,
      license: "UNLICENSED",
      optionalDependencies: binaries,
    },
    null,
    2,
  ),
)

const tasks = Object.entries(binaries).map(async ([name]) => {
  await publish(`./dist/${name}`, name, binaries[name])
})
await Promise.all(tasks)
await publish(`./dist/${publicPackageName}`, publicPackageName, version)

const repo = process.env.GH_REPO ?? "Panhard-Dev/Liz-Dev-Studio"
const releaseBase = `https://github.com/${repo}/releases/download/v${Script.version}`
const image = `ghcr.io/${repo.toLowerCase()}`
const platforms = "linux/amd64,linux/arm64"
const tags = [`${image}:${version}`, `${image}:${Script.channel}`]
const tagFlags = tags.flatMap((t) => ["-t", t])

// registries
if (!Script.preview) {
  if (process.env.PUBLISH_CONTAINER === "true") {
    await $`docker buildx build --platform ${platforms} ${tagFlags} --push .`
  } else {
    console.log("Skipping container publish. Set PUBLISH_CONTAINER=true to enable it.")
  }

  // Calculate SHA values
  const arm64Sha = await $`sha256sum ./dist/liz-linux-arm64.tar.gz | cut -d' ' -f1`.text().then((x) => x.trim())
  const x64Sha = await $`sha256sum ./dist/liz-linux-x64.tar.gz | cut -d' ' -f1`.text().then((x) => x.trim())
  const macX64Sha = await $`sha256sum ./dist/liz-darwin-x64.zip | cut -d' ' -f1`.text().then((x) => x.trim())
  const macArm64Sha = await $`sha256sum ./dist/liz-darwin-arm64.zip | cut -d' ' -f1`.text().then((x) => x.trim())

  const [pkgver, _subver = ""] = Script.version.split(/(-.*)/, 2)

  // arch
  const binaryPkgbuild = [
    "# Maintainer: dax",
    "# Maintainer: adam",
    "",
    "pkgname='liz-bin'",
    `pkgver=${pkgver}`,
    `_subver=${_subver}`,
    "options=('!debug' '!strip')",
    "pkgrel=1",
    "pkgdesc='LIZ AI BRASIL CLI'",
    `url='https://github.com/${repo}'`,
    "arch=('aarch64' 'x86_64')",
    "license=('custom')",
    "provides=('liz')",
    "conflicts=('liz')",
    "depends=('ripgrep')",
    "",
    `source_aarch64=("\${pkgname}_\${pkgver}_aarch64.tar.gz::${releaseBase}/liz-linux-arm64.tar.gz")`,
    `sha256sums_aarch64=('${arm64Sha}')`,

    `source_x86_64=("\${pkgname}_\${pkgver}_x86_64.tar.gz::${releaseBase}/liz-linux-x64.tar.gz")`,
    `sha256sums_x86_64=('${x64Sha}')`,
    "",
    "package() {",
    '  install -Dm755 ./liz "${pkgdir}/usr/bin/liz"',
    "}",
    "",
  ].join("\n")

  if (process.env.AUR_KEY) {
    for (const [pkg, pkgbuild] of [["liz-bin", binaryPkgbuild]]) {
      for (let i = 0; i < 30; i++) {
        try {
          await $`rm -rf ./dist/aur-${pkg}`
          await $`git clone ssh://aur@aur.archlinux.org/${pkg}.git ./dist/aur-${pkg}`
          await $`cd ./dist/aur-${pkg} && git checkout master`
          await Bun.file(`./dist/aur-${pkg}/PKGBUILD`).write(pkgbuild)
          await $`cd ./dist/aur-${pkg} && makepkg --printsrcinfo > .SRCINFO`
          await $`cd ./dist/aur-${pkg} && git add PKGBUILD .SRCINFO`
          if ((await $`cd ./dist/aur-${pkg} && git diff --cached --quiet`.nothrow()).exitCode === 0) break
          await $`cd ./dist/aur-${pkg} && git commit -m "Update to v${Script.version}"`
          await $`cd ./dist/aur-${pkg} && git push`
          break
        } catch {
          continue
        }
      }
    }
  } else {
    console.log("Skipping AUR publish because AUR_KEY is not configured.")
  }

  // Homebrew formula
  const homebrewFormula = [
    "# typed: false",
    "# frozen_string_literal: true",
    "",
    "# This file was generated by GoReleaser. DO NOT EDIT.",
    "class Liz < Formula",
    `  desc "LIZ AI BRASIL CLI"`,
    `  homepage "https://github.com/${repo}"`,
    `  version "${Script.version.split("-")[0]}"`,
    "",
    `  depends_on "ripgrep"`,
    "",
    "  on_macos do",
    "    if Hardware::CPU.intel?",
    `      url "${releaseBase}/liz-darwin-x64.zip"`,
    `      sha256 "${macX64Sha}"`,
    "",
    "      def install",
    '        bin.install "liz"',
    "      end",
    "    end",
    "    if Hardware::CPU.arm?",
    `      url "${releaseBase}/liz-darwin-arm64.zip"`,
    `      sha256 "${macArm64Sha}"`,
    "",
    "      def install",
    '        bin.install "liz"',
    "      end",
    "    end",
    "  end",
    "",
    "  on_linux do",
    "    if Hardware::CPU.intel? and Hardware::CPU.is_64_bit?",
    `      url "${releaseBase}/liz-linux-x64.tar.gz"`,
    `      sha256 "${x64Sha}"`,
    "      def install",
    '        bin.install "liz"',
    "      end",
    "    end",
    "    if Hardware::CPU.arm? and Hardware::CPU.is_64_bit?",
    `      url "${releaseBase}/liz-linux-arm64.tar.gz"`,
    `      sha256 "${arm64Sha}"`,
    "      def install",
    '        bin.install "liz"',
    "      end",
    "    end",
    "  end",
    "end",
    "",
    "",
  ].join("\n")

  const token = process.env.GITHUB_TOKEN
  const tapRepo = process.env.HOMEBREW_TAP_REPO
  if (tapRepo && !token) {
    console.error("GITHUB_TOKEN is required to update homebrew tap")
    process.exit(1)
  }
  if (tapRepo) {
    await $`rm -rf ./dist/homebrew-tap`
    await $`git clone ${`https://x-access-token:${token}@github.com/${tapRepo}.git`} ./dist/homebrew-tap`
    await Bun.file("./dist/homebrew-tap/liz.rb").write(homebrewFormula)
    await $`cd ./dist/homebrew-tap && git add liz.rb`
    if ((await $`cd ./dist/homebrew-tap && git diff --cached --quiet`.nothrow()).exitCode !== 0) {
      await $`cd ./dist/homebrew-tap && git commit -m "Update to v${Script.version}"`
      await $`cd ./dist/homebrew-tap && git push`
    }
  } else {
    console.log("Skipping Homebrew publish because HOMEBREW_TAP_REPO is not configured.")
  }
}
