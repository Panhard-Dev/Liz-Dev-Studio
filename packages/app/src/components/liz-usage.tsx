import { Button } from "@liz-ai-brasil/ui/button"
import { Dialog } from "@liz-ai-brasil/ui/dialog"
import { useDialog } from "@liz-ai-brasil/ui/context/dialog"
import { ProgressCircle } from "@liz-ai-brasil/ui/progress-circle"
import { Match, Show, Switch, createMemo, createResource } from "solid-js"
import { useGlobalSDK } from "@/context/global-sdk"
import { useSync } from "@/context/sync"
import { useProviders } from "@/hooks/use-providers"
import { getSessionContextMetrics } from "@/components/session/session-context-metrics"
import { useSessionLayout } from "@/pages/session/session-layout"

type UsageView = {
  type: "reset" | "weekly" | "monthly"
  label: string
  used: number
  limit: number
  remaining: number
  percent_used: number
  percent_remaining: number
  reset_at: string | null
}

type LizUsage = {
  plan: {
    id: string
    label: string
    reset_hours: number | null
    reset_limit: number | null
    weekly_limit: number
    monthly_limit: number
  }
  active: UsageView | null
  reset: UsageView | null
  weekly: UsageView
  monthly: UsageView
  today: {
    uses: number
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_cents: number
    cost_brl: number
  }
}

type LizUsageDisconnected = {
  connected: false
  message?: string
}

const DISCONNECTED_USAGE: LizUsageDisconnected = { connected: false }

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

function isUsage(value: LizUsage | LizUsageDisconnected | undefined): value is LizUsage {
  if (!value) return false
  return "plan" in value
}

function percent(value: number | undefined) {
  return `${Math.round((value ?? 0) * 10) / 10}%`
}

function number(value: number | undefined) {
  return (value ?? 0).toLocaleString("pt-BR")
}

function resetLabel(usage: UsageView | null | undefined) {
  if (!usage) return "Sem reset por hora"
  if (!usage.reset_at) return `${number(usage.remaining)} usos restantes`
  return `${number(usage.remaining)} restantes ate ${new Date(usage.reset_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

function limitLine(usage: UsageView | null | undefined) {
  if (!usage) return "Nao tem"
  return `${number(usage.used)}/${number(usage.limit)} usos`
}

function openLizConnect(dialog: ReturnType<typeof useDialog>) {
  void import("@/components/dialog-connect-provider").then((x) => {
    dialog.show(() => <x.DialogConnectProvider provider="liz" />)
  })
}

export async function fetchLizUsage(sdk: ReturnType<typeof useGlobalSDK>) {
  const response = await sdk.fetch("/liz/usage", {
    headers: {
      Accept: "application/json",
    },
  })
  const data = (await response.json().catch(() => undefined)) as LizUsage | LizUsageDisconnected | undefined
  if (!response.ok) return data ?? { connected: false, message: "Conecte a LIZ AI BRASIL com /connect." }
  return data
}

function Stat(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div class="min-w-0 rounded-md border border-border-weaker-base bg-background-stronger px-3 py-2">
      <div class="text-11-regular text-text-weak truncate">{props.label}</div>
      <div
        class="mt-1 text-12-medium text-text-strong truncate"
        classList={{ "text-text-interactive-base": props.strong }}
      >
        {props.value}
      </div>
    </div>
  )
}

function LimitRow(props: { label: string; usage: UsageView | null | undefined }) {
  return (
    <div class="flex items-center justify-between gap-3 text-12-regular">
      <span class="text-text-weak">{props.label}</span>
      <span class="text-text-base text-right truncate">{limitLine(props.usage)}</span>
    </div>
  )
}

function UsageDetails(props: { usage: LizUsage }) {
  const active = createMemo(() => props.usage.active ?? props.usage.reset ?? props.usage.weekly ?? props.usage.monthly)

  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4 rounded-md border border-border-weaker-base bg-background-stronger px-4 py-3">
        <div class="min-w-0">
          <div class="text-12-regular text-text-weak">Plano</div>
          <div class="mt-1 text-20-medium text-text-strong truncate">{props.usage.plan.label}</div>
          <div class="mt-1 text-12-regular text-text-weak truncate">{resetLabel(props.usage.reset)}</div>
        </div>
        <ProgressCircle size={52} strokeWidth={5} percentage={active()?.percent_used ?? 0} />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <Stat label="Usos hoje" value={number(props.usage.today.uses)} />
        <Stat label="Tokens hoje" value={number(props.usage.today.total_tokens)} />
        <Stat label="Gasto hoje" value={money.format(props.usage.today.cost_brl)} strong />
        <Stat label="Restante" value={percent(active()?.percent_remaining)} />
      </div>

      <div class="rounded-md border border-border-weaker-base bg-background-stronger px-4 py-3 flex flex-col gap-2">
        <LimitRow label="Reset" usage={props.usage.reset} />
        <LimitRow label="Semanal" usage={props.usage.weekly} />
        <LimitRow label="Mensal" usage={props.usage.monthly} />
      </div>
    </div>
  )
}

export function DialogLizUsage() {
  const sdk = useGlobalSDK()
  const dialog = useDialog()
  const [usage] = createResource(() => fetchLizUsage(sdk), { initialValue: DISCONNECTED_USAGE })
  const usageValue = createMemo(() => usage.latest ?? DISCONNECTED_USAGE)

  return (
    <Dialog title="Uso LIZ AI BRASIL" description="Plano, limites, tokens e gasto da sua conta LIZ.">
      <Switch>
        <Match when={usage.loading}>
          <div class="px-1 py-8 text-center text-13-regular text-text-weak">Carregando uso da sua conta LIZ...</div>
        </Match>
        <Match when={isUsage(usageValue())}>
          <UsageDetails usage={usageValue() as LizUsage} />
        </Match>
        <Match when={true}>
          <div class="rounded-md border border-border-weaker-base bg-background-stronger px-4 py-4 text-14-regular text-text-base flex flex-col items-start gap-4">
            <span>
              {(usageValue() as LizUsageDisconnected | undefined)?.message ??
                "Entre na LIZ AI BRASIL para ver plano, tokens e limites."}
            </span>
            <Button variant="primary" size="large" onClick={() => openLizConnect(dialog)}>
              Conectar LIZ AI BRASIL
            </Button>
          </div>
        </Match>
      </Switch>
    </Dialog>
  )
}

export function LizUsageSidebar() {
  const sdk = useGlobalSDK()
  const dialog = useDialog()
  const sync = useSync()
  const providers = useProviders()
  const { params } = useSessionLayout()
  const messages = createMemo(() => (params.id ? (sync.data.message[params.id] ?? []) : []))
  const [usage] = createResource(
    () => `${sdk.url}:${params.id ?? "global"}:${messages().length}`,
    () => fetchLizUsage(sdk),
    { initialValue: DISCONNECTED_USAGE },
  )
  const usageValue = createMemo(() => usage.latest ?? DISCONNECTED_USAGE)
  const metrics = createMemo(() => getSessionContextMetrics(messages(), providers.all()))
  const data = createMemo(() => {
    const next = usageValue()
    if (!isUsage(next)) return
    return next
  })
  const active = createMemo(() => {
    const next = data()
    if (!next) return
    return next.active ?? next.reset ?? next.weekly ?? next.monthly
  })

  return (
    <div class="m-3 mb-2 rounded-md border border-border-weaker-base bg-background-stronger px-3 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-12-medium text-text-strong">Uso LIZ</div>
          <div class="text-11-regular text-text-weak truncate">
            <Show when={data()} fallback="Conecte com /connect">
              {(next) => `Plano ${next().plan.label}`}
            </Show>
          </div>
        </div>
        <ProgressCircle size={28} strokeWidth={3} percentage={active()?.percent_used ?? 0} />
      </div>

      <div class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-11-regular">
        <span class="text-text-weak">Hoje</span>
        <span class="text-right text-text-base">
          <Show when={data()} fallback="0 usos">
            {(next) => `${number(next().today.uses)} usos`}
          </Show>
        </span>
        <span class="text-text-weak">Tokens</span>
        <span class="text-right text-text-base">
          <Show when={data()} fallback={number(metrics().context?.total)}>
            {(next) => number(next().today.total_tokens)}
          </Show>
        </span>
        <span class="text-text-weak">Gasto</span>
        <span class="text-right text-text-interactive-base">
          <Show when={data()} fallback={money.format(metrics().totalCost)}>
            {(next) => money.format(next().today.cost_brl)}
          </Show>
        </span>
        <span class="text-text-weak">Usado</span>
        <span class="text-right text-text-base">{percent(active()?.percent_used)}</span>
        <span class="text-text-weak">Restante</span>
        <span class="text-right text-text-base">{percent(active()?.percent_remaining)}</span>
      </div>
      <Show when={!data() && !usage.loading}>
        <Button class="mt-3 w-full" variant="primary" onClick={() => openLizConnect(dialog)}>
          Conectar LIZ
        </Button>
      </Show>
    </div>
  )
}
