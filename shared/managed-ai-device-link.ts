export const MANAGED_AI_DEVICE_LINK_SCHEMA = "casimirbot.managed_ai_device_link.v1" as const;
export const MANAGED_AI_NATIVE_STATUS_PATH = "/api/managed-ai/native/status" as const;
export const MANAGED_AI_NATIVE_REVOKE_PATH = "/api/managed-ai/native/device-grants/current/revoke" as const;
export const MANAGED_AI_NATIVE_TEXT_PATH = "/api/managed-ai/native/text-turn" as const;

// Exact byte strings signed by the installation's Ed25519 key. The key stays
// in the native host; browser account approval never sees it or a provider key.
export const managedAiClaimMessage = (input: {
  requestId: string; signedAt: string; nonce: string;
}): string => [
  "casimirbot.managed-ai.claim.v1", input.requestId, input.signedAt, input.nonce,
].join("\n");

export const managedAiRequestMessage = (input: {
  method: string; path: string; bodySha256: string; signedAt: string; nonce: string;
}): string => [
  "casimirbot.managed-ai.request.v1", input.method.toUpperCase(), input.path,
  input.bodySha256, input.signedAt, input.nonce,
].join("\n");
