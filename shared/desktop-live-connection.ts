/** Public status only. API keys are accepted by native IPC and never returned. */
export type LiveConnectionState = {
  configured: boolean;
  source: "saved" | "launcher" | "none";
};
export type ManagedConversationView = {
  active: boolean;
  messages: Array<{ role: "user" | "assistant"; text: string; turnId?: string;
    nativeToolObservation?: NativeHarnessToolObservation;
    publicContextMcpTools?: PublicContextMcpToolName[];
    codexHandoffProposal?: ManagedCodexHandoffProposal }>;
};
/** Completed anonymous public-context calls reported by the Agents API stream. */
export type PublicContextMcpToolName = "casimir_civilization_bounds_reflect" |
  "casimir_theory_badges_reflect" | "casimir_moral_graph_reflect";
export type GeminiPublicContextComparison = Readonly<{
  model: string; question: string;
  baseline: { answer: string; status: string; toolCalls: PublicContextMcpToolName[];
    toolResults: PublicContextMcpToolName[] };
  withContext: { answer: string; status: string; toolCalls: PublicContextMcpToolName[];
    toolResults: PublicContextMcpToolName[] };
}>;
/** A model-requested advisory handoff. The desktop has not delivered it yet. */
export type ManagedCodexHandoffProposal = Readonly<{
  schema: "casimirbot.personal_codex_handoff_proposal.v1";
  proposalId: string;
  instructionText: string;
}>;
/** A completed, read-only native function call in this exact personal turn. */
export type NativeHarnessToolObservation = Readonly<{
  schema: "casimirbot.personal_native_clock_observation.v1";
  evidenceRef: string;
  observedAt: string;
  timezone: string;
  source: "desktop_native_clock";
}>;
/** Content-free native stream outcome for a failed managed turn. */
export type ManagedStreamDiagnostic = "stream_ended" | "stream_interrupted" |
  "provider_terminal_event" | "missing_session_id" | "missing_answer_text";
/** Opaque provider IDs for retrieving the saved MCP item during attended review. */
export type RoomMcpStatusCallReceipt = Readonly<{
  eventId: string; itemId: string; turnId: string;
}>;
export const MANAGED_CONVERSATION_TURN_PATTERN = /^managed-turn:[0-9a-f-]{36}$/i;
export type LiveConnectionResult = {
  ok: boolean;
  code: "saved" | "disconnected" | "gemini_saved" | "gemini_disconnected" |
    "gemini_invalid_key_format" | "gemini_test_confirmed" | "gemini_missing_key" |
    "gemini_authentication_failed" | "gemini_permission_denied" |
    "gemini_rate_limited" | "gemini_provider_error" | "gemini_network_error" |
    "gemini_reflection_confirmed" | "gemini_reflection_invalid_response" |
    "gemini_reflection_interrupted" | "gemini_reflection_busy" |
    "model_access_confirmed" | "missing_key" |
    "invalid_key_format" | "authentication_failed" | "model_access_denied" |
    "rate_limited" | "network_error" | "provider_error" | "storage_unavailable" |
    "account_changed" | "sign_in_required" | "request_rejected" |
    "agent_chat_confirmed" | "agents_permission_denied" | "agent_incomplete" |
    "conversation_ready" | "conversation_cleared" | "conversation_busy" |
    "conversation_incomplete" | "conversation_permission_denied" | "conversation_stopped" |
    "room_interpreter_configured" | "room_interpreter_configuration_rejected" |
    "room_interpreter_configuration_unconfirmed" | "room_hosted_interpreter_key_selected" |
    "room_hosted_interpreter_completed" | "room_hosted_interpreter_unconfirmed" |
    "room_hosted_interpreter_busy" | "room_hosted_interpreter_not_enabled" |
    "room_hosted_interpreter_stop_requested" | "room_hosted_interpreter_not_running" |
    "room_hosted_interpreter_evaluation_completed" |
    "room_hosted_interpreter_evaluation_unconfirmed" |
    "room_hosted_interpreter_evaluation_not_ready";
  state?: LiveConnectionState;
  geminiComparison?: GeminiPublicContextComparison;
  geminiReflectionProbeEnabled?: boolean;
  geminiProviderHttpStatus?: number;
  conversation?: ManagedConversationView;
  cleanupConfirmed?: boolean;
  diagnostic?: ManagedStreamDiagnostic;
  roomHostedInterpreterCanaryEnabled?: boolean;
  roomHostedInterpreterEvaluationEnabled?: boolean;
  /** Content-free paid-canary status. True means a provider request may have
   * been submitted; it does not assert that a charge settled. */
  providerRequestMayHaveBeenSent?: boolean;
  /** Positive provider-stream evidence for the exact room-status MCP call.
   * Absence means unconfirmed, not that the tool was unused. */
  roomMcpStatusCallObserved?: boolean;
  roomMcpStatusCallReceipt?: RoomMcpStatusCallReceipt;
  /** The same completed MCP item was found in provider-saved session items. */
  roomMcpSavedItemConfirmed?: boolean;
};
export const LIVE_CONNECTION_MODELS = ["gpt-realtime-2.1", "gpt-realtime-2.1-mini"] as const;
export type LiveConnectionModel = typeof LIVE_CONNECTION_MODELS[number];
export type LiveConnectionRequest =
  | { action: "inspect" | "disconnect" | "gemini_inspect" | "gemini_disconnect" | "gemini_test" |
      "gemini_reflection_probe" |
      "test_chat" | "conversation_inspect" | "conversation_clear" }
  | { action: "save"; key: string }
  | { action: "gemini_save"; key: string }
  | { action: "test"; model: LiveConnectionModel }
  | { action: "conversation_send"; prompt: string; turn_id: string }
  | { action: "conversation_stop"; turn_id: string }
  | { action: "room_interpreter_configure" | "room_hosted_interpreter_key_select";
      room_id: string; interpreter_session_id: string; generation: number }
  | { action: "room_hosted_interpreter_run";
      room_id: string; interpreter_session_id: string; generation: number; request_id: string }
  | { action: "room_hosted_interpreter_evaluation_run";
      room_id: string; interpreter_session_id: string; generation: number;
      request_id: string; turn_ordinal: 1 | 2 }
  | { action: "room_hosted_interpreter_stop"; room_id: string; request_id: string };
