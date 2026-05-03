import { execFile } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import type { Configuration } from "electron-builder"

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const signScript = path.join(rootDir, "script", "sign-windows.ps1")

async function signWindows(configuration: { path: string }) {
  if (process.platform !== "win32") return
  if (process.env.GITHUB_ACTIONS !== "true") return

  await execFileAsync(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", signScript, configuration.path],
    { cwd: rootDir },
  )
}

const channel = (() => {
  const raw = process.env.LIZ_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()

const getBase = (): Configuration => ({
  artifactName: "liz-electron-${os}-${arch}.${ext}",
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  files: ["out/**/*", "resources/**/*"],
  extraResources: [
    {
      from: "resources/icons/",
      to: "icons/",
      filter: ["**/*"],
    },
    {
      from: "native/",
      to: "native/",
      filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
    },
  ],
  mac: {
    category: "public.app-category.developer-tools",
    icon: `resources/icons/icon.icns`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "resources/entitlements.plist",
    entitlementsInherit: "resources/entitlements.plist",
    notarize: true,
    target: ["dmg", "zip"],
  },
  dmg: {
    sign: true,
  },
  protocols: {
    name: "LIZ AI BRASIL",
    schemes: ["liz"],
  },
  win: {
    icon: `resources/icons/icon.ico`,
    signtoolOptions: {
      sign: signWindows,
    },
    target: ["nsis"],
    verifyUpdateCodeSignature: false,
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: `resources/icons/icon.ico`,
    installerHeaderIcon: `resources/icons/icon.ico`,
  },
  linux: {
    icon: `resources/icons`,
    category: "Development",
    target: ["AppImage", "deb", "rpm"],
  },
})

function getConfig() {
  const base = getBase()

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId: "ai.liz.desktop.dev",
        productName: "Liz Dev Studio",
        executableName: "Liz Dev Studio",
        artifactName: "Liz Dev Studio Setup.${ext}",
        nsis: { ...base.nsis, shortcutName: "Liz Dev Studio" },
        rpm: { packageName: "liz-dev" },
      }
    }
    case "beta": {
      return {
        ...base,
        appId: "ai.liz.desktop.beta",
        productName: "LIZ AI BRASIL Beta",
        protocols: { name: "LIZ AI BRASIL Beta", schemes: ["liz"] },
        publish: { provider: "github", owner: "anomalyco", repo: "liz-beta", channel: "latest" },
        rpm: { packageName: "liz-beta" },
      }
    }
    case "prod": {
      return {
        ...base,
        appId: "ai.liz.desktop",
        productName: "LIZ AI BRASIL",
        protocols: { name: "LIZ AI BRASIL", schemes: ["liz"] },
        publish: { provider: "github", owner: "anomalyco", repo: "liz", channel: "latest" },
        rpm: { packageName: "liz" },
      }
    }
  }
}

export default getConfig()
