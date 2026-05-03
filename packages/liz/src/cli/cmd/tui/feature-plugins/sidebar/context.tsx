import type { AssistantMessage } from "@liz-ai-brasil/sdk/v2"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@liz-ai-brasil/plugin/tui"
import { createMemo, createResource, Show } from "solid-js"
import { useSDK } from "@tui/context/sdk"

const id = "internal:sidebar-context"

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

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

async function fetchLizUsage(sdk: ReturnType<typeof useSDK>) {
  const response = await sdk.fetch(`${sdk.url}/liz/usage`, {
    headers: {
      Accept: "application/json",
    },
  })
  if (!response.ok) return
  return (await response.json().catch(() => undefined)) as LizUsage | undefined
}

function percent(value: number | undefined) {
  return `${Math.round((value ?? 0) * 10) / 10}%`
}

function usageFooter(usage: UsageView | null | undefined) {
  if (!usage) return "sem limite por hora"
  return `${usage.used.toLocaleString("pt-BR")}/${usage.limit.toLocaleString("pt-BR")} usos`
}

function DialogUsage(props: { api: TuiPluginApi }) {
  const sdk = useSDK()
  const theme = () => props.api.theme.current
  const [usage] = createResource(() => fetchLizUsage(sdk))
  const active = createMemo(() => usage()?.active ?? usage()?.reset ?? usage()?.weekly ?? usage()?.monthly)

  return (
    <box paddingLeft={3} paddingRight={3} paddingBottom={1} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme().text}>
          <b>Uso LIZ AI BRASIL</b>
        </text>
        <text fg={theme().textMuted} onMouseUp={() => props.api.ui.dialog.clear()}>
          esc
        </text>
      </box>
      <Show when={usage()} fallback={<text fg={theme().textMuted}>Carregando uso da sua conta LIZ...</text>}>
        {(data) => (
          <box gap={1}>
            <text fg={theme().text}>
              Plano <b>{data().plan.label}</b>
            </text>
            <text fg={theme().textMuted}>Hoje: {data().today.uses.toLocaleString("pt-BR")} usos</text>
            <text fg={theme().textMuted}>Tokens hoje: {data().today.total_tokens.toLocaleString("pt-BR")}</text>
            <text fg={theme().textMuted}>Gasto hoje: {money.format(data().today.cost_brl)}</text>
            <text fg={theme().primary}>Limite ativo: {active()?.label ?? "sem limite por hora"}</text>
            <text fg={theme().textMuted}>Usado: {percent(active()?.percent_used)}</text>
            <text fg={theme().textMuted}>Restante: {percent(active()?.percent_remaining)}</text>
            <text fg={theme().textMuted}>Reset: {usageFooter(data().reset)}</text>
            <text fg={theme().textMuted}>Semanal: {usageFooter(data().weekly)}</text>
            <text fg={theme().textMuted}>Mensal: {usageFooter(data().monthly)}</text>
          </box>
        )}
      </Show>
    </box>
  )
}

function View(props: { api: TuiPluginApi; session_id: string }) {
  const sdk = useSDK()
  const theme = () => props.api.theme.current
  const msg = createMemo(() => props.api.state.session.messages(props.session_id))
  const cost = createMemo(() => msg().reduce((sum, item) => sum + (item.role === "assistant" ? item.cost : 0), 0))
  const [usage] = createResource(
    () => `${sdk.url}:${msg().length}`,
    () => fetchLizUsage(sdk),
  )
  const activeUsage = createMemo(() => usage()?.active ?? usage()?.reset ?? usage()?.weekly ?? usage()?.monthly)

  const state = createMemo(() => {
    const last = msg().findLast((item): item is AssistantMessage => item.role === "assistant" && item.tokens.output > 0)
    if (!last) {
      return {
        tokens: 0,
        percent: null,
      }
    }

    const tokens =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = props.api.state.provider.find((item) => item.id === last.providerID)?.models[last.modelID]
    return {
      tokens,
      percent: model?.limit.context ? Math.round((tokens / model.limit.context) * 100) : null,
    }
  })

  return (
    <box gap={1}>
      <box>
        <text fg={theme().text}>
          <b>Contexto</b>
        </text>
        <text fg={theme().textMuted}>{state().tokens.toLocaleString("pt-BR")} tokens</text>
        <text fg={theme().textMuted}>{state().percent ?? 0}% usado</text>
        <text fg={theme().textMuted}>{money.format(cost())} na sessao</text>
      </box>
      <box>
        <text fg={theme().text}>
          <b>Uso LIZ</b>
        </text>
        <Show when={usage()} fallback={<text fg={theme().textMuted}>Conecte com /connect</text>}>
          {(data) => (
            <box>
              <text fg={theme().textMuted}>Plano {data().plan.label}</text>
              <text fg={theme().textMuted}>{data().today.total_tokens.toLocaleString("pt-BR")} tokens hoje</text>
              <text fg={theme().textMuted}>{money.format(data().today.cost_brl)} hoje</text>
              <text fg={theme().textMuted}>{percent(activeUsage()?.percent_used)} usado</text>
              <text fg={theme().textMuted}>{percent(activeUsage()?.percent_remaining)} restante</text>
            </box>
          )}
        </Show>
      </box>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.command.register(() => [
    {
      title: "Uso da LIZ AI BRASIL",
      value: "liz.usage",
      category: "LIZ AI BRASIL",
      slash: {
        name: "usage",
      },
      onSelect: () => {
        api.ui.dialog.setSize("medium")
        api.ui.dialog.replace(() => <DialogUsage api={api} />)
      },
    },
  ])
  api.slots.register({
    order: 100,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
