import { describe, expect, it } from "vitest";
import { projectDiscordFloatActivityEvent } from "../discord-float-activity";
import type { HelixMessageCloudFrame } from "../helix-message-cloud";

describe("public Float activity identity", () => {
  const turn = {
    id: "codex:turn:one:update:0", lane: "codex_task" as const,
    kind: "update" as const, author: "codex_task" as const,
    prompt: "", delivery: "picked_up" as const,
    report: { status: "completed" as const, text: "A harmless public update" },
    sourceChat: { helixConversationId: "chat:owner", title: "Owner task",
      taskId: "task:one", status: "live" as const },
  };
  const frame: HelixMessageCloudFrame = {
    schema: "helix.message_cloud_frame.v1", source: "session_activity",
    helixConversationId: "chat:owner", turns: [turn],
  };

  it("keeps one delivery key when a Codex update shifts in the visible tail", async () => {
    const first = await projectDiscordFloatActivityEvent(frame, turn);
    const shifted = await projectDiscordFloatActivityEvent(frame,
      { ...turn, id: "codex:turn:one:update:2" });
    expect(shifted?.event_key).toBe(first?.event_key);
  });

  it("preserves distinct update text and source chats", async () => {
    const first = await projectDiscordFloatActivityEvent(frame, turn);
    const differentText = await projectDiscordFloatActivityEvent(frame,
      { ...turn, report: { ...turn.report, text: "Another public update" } });
    const differentChat = await projectDiscordFloatActivityEvent(frame,
      { ...turn, sourceChat: { ...turn.sourceChat, helixConversationId: "chat:second" } });
    expect(differentText?.event_key).not.toBe(first?.event_key);
    expect(differentChat?.event_key).not.toBe(first?.event_key);
  });
});
