import { Select } from "@kobalte/core/select"
import { Show, createEffect, createMemo } from "solid-js"
import { agents, fetchAgents, sessions } from "../stores/sessions"
import { Bot, ChevronDown } from "lucide-solid"
import { getSelectableAgentsForSession, type Agent } from "../types/session"
import { useI18n } from "../lib/i18n"
import { getLogger } from "../lib/logger"
const log = getLogger("session")


interface AgentSelectorProps {
  instanceId: string
  sessionId: string
  currentAgent: string
  onAgentChange: (agent: string) => Promise<void>
  triggerVariant?: "default" | "icon"
  autoSelectFallback?: boolean
}

export default function AgentSelector(props: AgentSelectorProps) {
  const { t } = useI18n()
  const instanceAgents = () => agents().get(props.instanceId) || []
  const compactTrigger = () => props.triggerVariant === "icon"

  const session = createMemo(() => {
    const instanceSessions = sessions().get(props.instanceId)
    return instanceSessions?.get(props.sessionId)
  })

  const isChildSession = createMemo(() => {
    return session()?.parentId !== null && session()?.parentId !== undefined
  })

  const availableAgents = createMemo(() => {
    return getSelectableAgentsForSession(instanceAgents(), props.currentAgent, isChildSession())
  })

  createEffect(() => {
    if (props.autoSelectFallback === false) return
    const list = availableAgents()
    if (list.length === 0) return
    if (!list.some((agent) => agent.name === props.currentAgent)) {
      void props.onAgentChange(list[0].name)
    }
  })

  createEffect(() => {
    if (instanceAgents().length === 0) {
      fetchAgents(props.instanceId).catch((error) => log.error("Failed to fetch agents", error))
    }
  })

  const handleChange = async (value: Agent | null) => {
    if (value && value.name !== props.currentAgent) {
      await props.onAgentChange(value.name)
    }
  }

  return (
    <div class="sidebar-selector">
      <Select
        value={availableAgents().find((a) => a.name === props.currentAgent)}
        onChange={handleChange}
        options={availableAgents()}
        optionValue="name"
        optionTextValue="name"
        placeholder={t("agentSelector.placeholder")}
        itemComponent={(itemProps) => (
          <Select.Item
            item={itemProps.item}
            class="selector-option"
          >
            <div class="flex flex-col flex-1 min-w-0">
              <Select.ItemLabel class="selector-option-label flex items-center gap-2">
                <span>{itemProps.item.rawValue.name}</span>
                <Show when={itemProps.item.rawValue.mode === "subagent"}>
                  <span class="neutral-badge">{t("agentSelector.badge.subagent")}</span>
                </Show>
              </Select.ItemLabel>
              <Show when={itemProps.item.rawValue.description}>
                <Select.ItemDescription class="selector-option-description">
                  {itemProps.item.rawValue.description.length > 50
                    ? itemProps.item.rawValue.description.slice(0, 50) + "..."
                    : itemProps.item.rawValue.description}
                </Select.ItemDescription>
              </Show>
            </div>
          </Select.Item>
        )}
      >
        <Select.Trigger
          data-agent-selector
          class={compactTrigger() ? "selector-trigger selector-trigger--prompt-icon" : "selector-trigger"}
          aria-label={t("agentSelector.trigger.primary", { agent: props.currentAgent || t("agentSelector.none") })}
          title={t("agentSelector.trigger.primary", { agent: props.currentAgent || t("agentSelector.none") })}
        >
          <Show when={compactTrigger()}>
            <Bot class="w-4 h-4" aria-hidden="true" />
          </Show>
          <div class={compactTrigger() ? "sr-only" : "flex-1 min-w-0"}>
            <Select.Value<Agent>>
              {() => (
                <div class="selector-trigger-label selector-trigger-label--stacked">
                  <span class="selector-trigger-primary selector-trigger-primary--align-left">
                    {t("agentSelector.trigger.primary", { agent: props.currentAgent || t("agentSelector.none") })}
                  </span>
                </div>
              )}
            </Select.Value>
          </div>
          <Show when={!compactTrigger()}>
            <Select.Icon class="selector-trigger-icon">
              <ChevronDown class="w-3 h-3" />
            </Select.Icon>
          </Show>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content class="selector-popover max-h-80 overflow-auto p-1">
            <Select.Listbox class="selector-listbox" />
          </Select.Content>
        </Select.Portal>
      </Select>
    </div>
  )
}
