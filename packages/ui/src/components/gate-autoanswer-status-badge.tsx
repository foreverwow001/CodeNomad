import { Show, createSignal, onCleanup, onMount } from "solid-js"
import { serverApi } from "../lib/api-client"

const GATE_AUTOANSWER_STATE_PATH = ".workflow-core/state/gate-autoanswer/mode-state.json"
const REFRESH_INTERVAL_MS = 5000

type GateAutoanswerMode = "manual" | "semi-auto" | "autopilot"

interface GateAutoanswerState {
  mode: GateAutoanswerMode
  paused?: boolean
  permanent?: boolean
}

interface GateAutoanswerStatusBadgeProps {
  instanceId: string
}

function isGateAutoanswerMode(value: unknown): value is GateAutoanswerMode {
  return value === "manual" || value === "semi-auto" || value === "autopilot"
}

function parseGateAutoanswerState(contents: string): GateAutoanswerState | null {
  try {
    const parsed = JSON.parse(contents) as Partial<GateAutoanswerState>
    if (!isGateAutoanswerMode(parsed.mode)) return null
    return {
      mode: parsed.mode,
      paused: parsed.paused === true,
      permanent: parsed.permanent === true,
    }
  } catch {
    return null
  }
}

export default function GateAutoanswerStatusBadge(props: GateAutoanswerStatusBadgeProps) {
  const [state, setState] = createSignal<GateAutoanswerState | null>(null)

  const refresh = async () => {
    try {
      const response = await serverApi.readWorkspaceFile(props.instanceId, GATE_AUTOANSWER_STATE_PATH)
      setState(parseGateAutoanswerState(response.contents))
    } catch {
      setState(null)
    }
  }

  onMount(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (!document.hidden) void refresh()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    onCleanup(() => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    })
  })

  const modeLabel = () => {
    const current = state()
    if (!current) return ""
    if (current.paused) return "paused"
    return current.mode
  }

  const title = () => {
    const current = state()
    if (!current) return ""
    const mode = current.paused ? `${current.mode} (paused)` : current.mode
    const permanence = current.permanent ? "permanent" : "session/local"
    return `Gate Auto-answer: ${mode}; ${permanence}; use /gate-mode to change`
  }

  return (
    <Show when={state()}>
      {(current) => (
        <span
          class={`status-indicator session-status session-status-list session-gate-autoanswer session-gate-autoanswer-${current().mode}${current().paused ? " session-gate-autoanswer-paused" : ""}`}
          aria-label={title()}
          title={title()}
        >
          <span class="status-dot" />
          {modeLabel()}
        </span>
      )}
    </Show>
  )
}
