import { beforeEach, describe, expect, test } from "bun:test"

const src = await Bun.file(new URL("../public/liz-theme-preload.js", import.meta.url)).text()

const run = () => Function(src)()

beforeEach(() => {
  document.head.innerHTML = ""
  document.documentElement.removeAttribute("data-theme")
  document.documentElement.removeAttribute("data-color-scheme")
  localStorage.clear()
  Object.defineProperty(window, "matchMedia", {
    value: () =>
      ({
        matches: false,
      }) as MediaQueryList,
    configurable: true,
  })
})

describe("theme preload", () => {
  test("migrates legacy oc-1 to oc-2 before mount", () => {
    localStorage.setItem("liz-theme-id", "oc-1")
    localStorage.setItem("liz-theme-css-light", "--background-base:#fff;")
    localStorage.setItem("liz-theme-css-dark", "--background-base:#000;")

    run()

    expect(document.documentElement.dataset.theme).toBe("oc-2")
    expect(document.documentElement.dataset.colorScheme).toBe("light")
    expect(localStorage.getItem("liz-theme-id")).toBe("oc-2")
    expect(localStorage.getItem("liz-theme-css-light")).toBeNull()
    expect(localStorage.getItem("liz-theme-css-dark")).toBeNull()
    expect(document.getElementById("liz-theme-preload")).toBeNull()
  })

  test("keeps cached css for non-default themes", () => {
    localStorage.setItem("liz-theme-id", "nightowl")
    localStorage.setItem("liz-theme-css-light", "--background-base:#fff;")

    run()

    expect(document.documentElement.dataset.theme).toBe("nightowl")
    expect(document.getElementById("liz-theme-preload")?.textContent).toContain("--background-base:#fff;")
  })
})
