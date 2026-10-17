import { describe, expect, it } from "vitest";
import { plausibleDiscordVoiceBridgeTicketExpiry } from "../discord-voice-bridge";

describe("Discord voice bridge ticket expiry", () => {
  const now = Date.parse("2026-10-12T20:00:00.000Z");

  it("accepts a fresh site ticket when the workstation clock is 20 seconds slow", () => {
    expect(plausibleDiscordVoiceBridgeTicketExpiry(new Date(now + 50_000).toISOString(), now)).toBe(true);
  });

  it("allows bounded clock skew while the worker enforces the signed expiry", () => {
    expect(plausibleDiscordVoiceBridgeTicketExpiry(new Date(now - 20_000).toISOString(), now)).toBe(true);
    expect(plausibleDiscordVoiceBridgeTicketExpiry(new Date(now - 60_000).toISOString(), now)).toBe(false);
    expect(plausibleDiscordVoiceBridgeTicketExpiry(new Date(now + 90_001).toISOString(), now)).toBe(false);
  });

  it("rejects malformed expiry", () => {
    expect(plausibleDiscordVoiceBridgeTicketExpiry("invalid", now)).toBe(false);
  });
});
