import { describe, expect, it } from "vitest";
import { buildHelixAgentClientReadiness } from "../helix-agent-client-readiness";
import {
  deriveHelixAgentSetupNextAction,
  HELIX_AGENT_SETUP_PROCEDURE,
  projectHelixAgentMcpSetupProgress,
} from "../helix-agent-setup-procedure";

const readiness = (overrides: Partial<Parameters<typeof buildHelixAgentClientReadiness>[0]> = {}) =>
  buildHelixAgentClientReadiness({
    agentSelected: true,
    provider_application: "available",
    client_authorization: "active",
    client_presence: "offline",
    catalog_sync: "current",
    thread_attachment: "not_attached",
    continuation_readiness: "unavailable",
    environment_readiness: "not_selected",
    ...overrides,
  });

describe("shared Agent Access setup route", () => {
  it("keeps account, catalog, transport, and first task call in owner-action order", () => {
    expect(deriveHelixAgentSetupNextAction({
      profileSelected: true, statusFresh: false,
    })).toMatchObject({ checkpoint: "status", actor: "owner", state: "unknown" });

    expect(deriveHelixAgentSetupNextAction({
      profileSelected: true, statusFresh: true,
      readiness: readiness({ client_authorization: "expired" }),
      transport: "ready",
    })).toMatchObject({ checkpoint: "authorization", actor: "owner" });

    expect(deriveHelixAgentSetupNextAction({
      profileSelected: true, statusFresh: true,
      readiness: readiness({ catalog_sync: "stale" }),
      transport: "ready",
    })).toMatchObject({ checkpoint: "catalog", actor: "owner" });

    const stalePresence = deriveHelixAgentSetupNextAction({
      profileSelected: true, statusFresh: true,
      readiness: readiness({ provider_application: "unknown", catalog_sync: "stale" }),
      transport: "ready",
    });
    expect(stalePresence.title).toBe("Check the same AI task");
    expect(stalePresence.instruction).toContain("Keep any accepted pairing");

    expect(deriveHelixAgentSetupNextAction({
      profileSelected: true, statusFresh: true, readiness: readiness(),
      transport: "not_ready",
    })).toMatchObject({ checkpoint: "transport", actor: "owner", state: "action_required" });

    expect(deriveHelixAgentSetupNextAction({
      profileSelected: true, statusFresh: true, readiness: readiness(),
      transport: "ready",
    })).toMatchObject({ checkpoint: "first_read_only_call", actor: "owner", state: "action_required" });
  });

  it("does not treat stale/missing MCP evidence as startup, and stops pairing from blocking personal MCP", () => {
    expect(deriveHelixAgentSetupNextAction({
      profileSelected: true, statusFresh: true, readiness: readiness(),
      transport: "ready", authenticatedMcpCallObserved: true,
    })).toMatchObject({ checkpoint: "first_read_only_call", actor: null, state: "verified" });
    expect(HELIX_AGENT_SETUP_PROCEDURE.steps.find(step => step.id === "registration")?.route)
      .toBe("task_pairing");
    expect(HELIX_AGENT_SETUP_PROCEDURE.task_pairing_fast_path).toContain("id helix-chat:<exact Helix chat ID>");
    expect(HELIX_AGENT_SETUP_PROCEDURE.steps.find(step => step.id === "accept")?.next)
      .toContain("use a public pairing ID only if that selector is unsupported");
    expect(HELIX_AGENT_SETUP_PROCEDURE.completion).toContain("separate optional routes");
    expect(HELIX_AGENT_SETUP_PROCEDURE.source_failure_recovery).toContain("429 requires bounded backoff");
    expect(HELIX_AGENT_SETUP_PROCEDURE.source_failure_recovery).toContain("Connect this app with OAuth");
    expect(HELIX_AGENT_SETUP_PROCEDURE.source_failure_recovery).toContain("not authorized for this tunnel resource");
    expect(HELIX_AGENT_SETUP_PROCEDURE.steps.find(step => step.id === "authorization")?.evidence)
      .toContain("this exact AI task");
  });

  it("projects exact-task MCP state without returning its continuation reference", () => {
    expect(projectHelixAgentMcpSetupProgress({
      procedureToolCallSucceeded: true, exactTaskPresence: "unknown",
    })).toMatchObject({ checkpoint: "first_read_only_call", actor: "agent", state: "unknown" });
    expect(projectHelixAgentMcpSetupProgress({
      procedureToolCallSucceeded: true, exactTaskPresence: "active",
    })).toMatchObject({ checkpoint: "first_read_only_call", actor: null, state: "verified" });
  });
});
