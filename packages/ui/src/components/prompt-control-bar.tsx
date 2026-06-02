import AgentSelector from "./agent-selector"
import ModelSelector from "./model-selector"
import ThinkingSelector from "./thinking-selector"

interface PromptControlBarProps {
  instanceId: string
  sessionId: string
  currentAgent?: string | null
  currentModel?: { providerId?: string; modelId?: string } | null
  onAgentChange: (agent: string) => Promise<void>
  onModelChange: (model: { providerId: string; modelId: string }) => Promise<void>
}

export default function PromptControlBar(props: PromptControlBarProps) {
  const currentAgent = () => props.currentAgent ?? ""
  const currentModel = () => ({
    providerId: props.currentModel?.providerId ?? "",
    modelId: props.currentModel?.modelId ?? "",
  })

  return (
    <div class="prompt-control-bar" aria-label="Prompt controls">
      <AgentSelector
        instanceId={props.instanceId}
        sessionId={props.sessionId}
        currentAgent={currentAgent()}
        onAgentChange={props.onAgentChange}
        triggerVariant="icon"
        autoSelectFallback={false}
      />

      <ModelSelector
        instanceId={props.instanceId}
        sessionId={props.sessionId}
        currentModel={currentModel()}
        onModelChange={props.onModelChange}
        triggerVariant="prompt"
      />

      <ThinkingSelector instanceId={props.instanceId} currentModel={currentModel()} triggerVariant="icon" />
    </div>
  )
}
