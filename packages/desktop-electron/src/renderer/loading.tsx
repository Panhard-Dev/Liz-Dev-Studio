import { MetaProvider } from "@solidjs/meta"
import { render } from "solid-js/web"
import "@liz-ai-brasil/app/index.css"
import { Font } from "@liz-ai-brasil/ui/font"
import { Progress } from "@liz-ai-brasil/ui/progress"
import "./styles.css"
import crownUrl from "./assets/liz-crown-transparent.png"
import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import type { InitStep, SqliteMigrationProgress } from "../preload/types"

const root = document.getElementById("root")!
const lines = ["Preparando a LIZ...", "Organizando seu workspace", "Isso pode levar alguns segundos"]
const delays = [3000, 9000]

render(() => {
  const [step, setStep] = createSignal<InitStep | null>(null)
  const [line, setLine] = createSignal(0)
  const [percent, setPercent] = createSignal(0)

  const phase = createMemo(() => step()?.phase)

  const value = createMemo(() => {
    if (phase() === "done") return 100
    return Math.max(25, Math.min(100, percent()))
  })

  window.api.awaitInitialization((next) => setStep(next as InitStep)).catch(() => undefined)

  onMount(() => {
    setLine(0)
    setPercent(0)

    const timers = delays.map((ms, i) => setTimeout(() => setLine(i + 1), ms))

    const listener = window.api.onSqliteMigrationProgress((progress: SqliteMigrationProgress) => {
      if (progress.type === "InProgress") setPercent(Math.max(0, Math.min(100, progress.value)))
      if (progress.type === "Done") {
        setPercent(100)
        setStep({ phase: "done" })
      }
    })

    onCleanup(() => {
      listener()
      timers.forEach(clearTimeout)
    })
  })

  createEffect(() => {
    if (phase() !== "done") return

    const timer = setTimeout(() => window.api.loadingWindowComplete(), 1000)
    onCleanup(() => clearTimeout(timer))
  })

  const status = createMemo(() => {
    if (phase() === "done") return "Tudo pronto"
    if (phase() === "sqlite_waiting") return lines[line()]
    return "Preparando a LIZ..."
  })

  return (
    <MetaProvider>
      <div class="w-screen h-screen bg-[#050309] flex items-center justify-center">
        <Font />
        <div class="flex flex-col items-center gap-8">
          <div class="flex items-center gap-7 select-none">
            <img
              src={crownUrl}
              alt=""
              class="w-24 h-auto [image-rendering:pixelated] drop-shadow-[0_0_22px_rgba(188,63,255,0.55)]"
            />
            <span class="text-[44px] leading-none font-bold tracking-normal text-[#e8e0ff] drop-shadow-[0_0_18px_rgba(168,85,247,0.22)]">
              Liz AI Brasil
            </span>
          </div>
          <div class="w-60 flex flex-col items-center gap-4" aria-live="polite">
            <span class="w-full overflow-hidden text-center text-ellipsis whitespace-nowrap text-text-strong text-14-normal">
              {status()}
            </span>
            <Progress
              value={value()}
              class="w-20 [&_[data-slot='progress-track']]:h-1 [&_[data-slot='progress-track']]:border-0 [&_[data-slot='progress-track']]:rounded-none [&_[data-slot='progress-track']]:bg-surface-weak [&_[data-slot='progress-fill']]:rounded-none [&_[data-slot='progress-fill']]:bg-icon-warning-base"
              aria-label="Database migration progress"
              getValueLabel={({ value }) => `${Math.round(value)}%`}
            />
          </div>
        </div>
      </div>
    </MetaProvider>
  )
}, root)
