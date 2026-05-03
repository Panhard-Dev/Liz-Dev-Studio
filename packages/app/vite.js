import { readFileSync } from "node:fs"
import solidPlugin from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "url"

const theme = fileURLToPath(new URL("./public/liz-theme-preload.js", import.meta.url))

/**
 * @type {import("vite").PluginOption}
 */
export default [
  {
    name: "liz-desktop:config",
    config() {
      return {
        resolve: {
          alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
          },
        },
        worker: {
          format: "es",
        },
      }
    },
  },
  {
    name: "liz-desktop:theme-preload",
    transformIndexHtml(html) {
      return html.replace(
        '<script id="liz-theme-preload-script" src="/liz-theme-preload.js"></script>',
        `<script id="liz-theme-preload-script">${readFileSync(theme, "utf8")}</script>`,
      )
    },
  },
  tailwindcss(),
  solidPlugin(),
]
