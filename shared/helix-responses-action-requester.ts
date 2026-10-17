import { createHash } from "node:crypto";

/** The MCP caller and native owner share an authenticated profile, not a
 * session. The native broker separately retains and rechecks the approving
 * desktop session before releasing its one-use credential. */
export const responsesActionRequesterForProfile = (profileId: string): string => {
  if (!profileId || profileId.length > 256) throw new Error("responses_action_profile_invalid");
  return `requester:responses-action:${createHash("sha256")
    .update(`responses-action-profile\n${profileId}`, "utf8")
    .digest("hex").slice(0, 20)}`;
};

export const isApprovedResponsesActionRequester = (input: {
  requesterRef: string;
  profileId: string;
  currentSessionId: string;
  approvedOwnerSessionId?: string;
}): boolean => Boolean(input.approvedOwnerSessionId) &&
  input.currentSessionId === input.approvedOwnerSessionId &&
  input.requesterRef === responsesActionRequesterForProfile(input.profileId);
