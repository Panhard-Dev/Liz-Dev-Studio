#!/usr/bin/env bun
import { rm } from "node:fs/promises"

await Promise.all(["dist", "out"].map((dir) => rm(dir, { recursive: true, force: true })))
