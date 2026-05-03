import { cpSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"

const root = import.meta.dirname
const out = join(root, "dist")

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(join(root, "public"), out, { recursive: true })
mkdirSync(join(out, "install"), { recursive: true })
cpSync(join(out, "index.html"), join(out, "install", "index.html"))
