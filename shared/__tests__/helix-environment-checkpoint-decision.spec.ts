import { describe, expect, it } from "vitest";
import {
  assessHelixEnvironmentCheckpointDecision,
  materializeHelixEnvironmentCheckpointDecision,
  HELIX_ENVIRONMENT_CHECKPOINT_DECISION_SCHEMA,
  type HelixEnvironmentCheckpointDecision,
  type HelixEnvironmentCheckpointDecisionContext,
} from "../helix-environment-checkpoint-decision";

const HASH = `sha256:${"a".repeat(64)}`;
const base = (): HelixEnvironmentCheckpointDecision => ({
  schema: HELIX_ENVIRONMENT_CHECKPOINT_DECISION_SCHEMA,
  decision_id: "decision:1",
  environment_id: "environment:1",
  source_id: "source:1",
  subject_id: "subject:1",
  goal_id: "goal:1",
  goal_revision: 2,
  predecessor_plan_id: "plan:1",
  predecessor_plan_hash: HASH,
  checkpoint_id: "checkpoint:1",
  observation_ref: "observation:8",
  observation_revision: 8,
  affordance_revision: 5,
  producer_epoch: "epoch:1",
  authority_id: "authority:1",
  authority_revision: 3,
  monotonic_origin_id: "process:1",
  proposed_at_unit: 100,
  expires_at_unit: 110,
  proposed_at_monotonic_ms: 1_000,
  expires_at_monotonic_ms: 1_500,
  disposition: "continue_same_goal",
  evidence_refs: ["observation:8"],
  rationale_code: "course_clear",
  execution_authority: false,
  answer_authority: false,
  terminal_eligible: false,
});
const context = (): HelixEnvironmentCheckpointDecisionContext => ({
  environment_id: "environment:1",
  source_id: "source:1",
  subject_id: "subject:1",
  goal_id: "goal:1",
  goal_revision: 2,
  predecessor_plan_id: "plan:1",
  predecessor_plan_hash: HASH,
  checkpoint_id: "checkpoint:1",
  observation_ref: "observation:8",
  observation_revision: 8,
  affordance_revision: 5,
  producer_epoch: "epoch:1",
  authority_id: "authority:1",
  authority_revision: 3,
  monotonic_origin_id: "process:1",
  current_unit: 105,
  current_monotonic_ms: 1_200,
  maximum_proposal_horizon_units: 20,
  maximum_proposal_lifetime_ms: 1_000,
  interruption_pending: false,
});

describe("checkpoint model proposal preflight", () => {
  it("stamps a bounded model choice with host-owned identity, evidence and clocks", () => {
    const verdict = materializeHelixEnvironmentCheckpointDecision(
      { disposition: "repair_same_goal", rationale_code: "route_blocked" },
      context(), context(), "decision:host", 5, 250,
    );
    expect(verdict).toMatchObject({
      accepted: true, execution_authority: false,
      proposal: {
        decision_id: "decision:host", authority_id: "authority:1",
        observation_ref: "observation:8", evidence_refs: ["observation:8"],
        proposed_at_unit: 105, expires_at_unit: 110,
        proposed_at_monotonic_ms: 1_200, expires_at_monotonic_ms: 1_450,
        disposition: "repair_same_goal", execution_authority: false,
      },
    });
  });

  it("rejects model attempts to provide keys, authority, identity or timing", () => {
    for (const injection of [
      { keypress: "W" }, { authority_id: "authority:other" },
      { expires_at_unit: 999 }, { execution_authority: true },
    ]) {
      expect(materializeHelixEnvironmentCheckpointDecision(
        { disposition: "continue_same_goal", rationale_code: "clear", ...injection },
        context(), context(), "decision:host", 5, 250,
      )).toMatchObject({ accepted: false, reason: "invalid_proposal" });
    }
  });

  it("rejects excessive horizons and interruption even for an otherwise valid model choice", () => {
    const choice = { disposition: "continue_same_goal", rationale_code: "clear" };
    expect(materializeHelixEnvironmentCheckpointDecision(choice, context(), context(), "decision:host", 21, 250))
      .toMatchObject({ accepted: false, reason: "proposal_horizon_exceeded" });
    expect(materializeHelixEnvironmentCheckpointDecision(choice, context(), context(), "decision:host", 5, 1_001))
      .toMatchObject({ accepted: false, reason: "proposal_horizon_exceeded" });
    expect(materializeHelixEnvironmentCheckpointDecision(
      choice, context(), { ...context(), interruption_pending: true }, "decision:host", 5, 250,
    )).toMatchObject({ accepted: false, reason: "interruption_pending" });
  });

  it("cannot launder a late model result into a newer checkpoint or paused-tick deadline", () => {
    const choice = { disposition: "continue_same_goal", rationale_code: "clear" };
    expect(materializeHelixEnvironmentCheckpointDecision(
      choice, context(), { ...context(), observation_revision: 9 }, "decision:host", 5, 250,
    )).toMatchObject({ accepted: false, reason: "identity_or_revision_stale" });
    expect(materializeHelixEnvironmentCheckpointDecision(
      choice, context(), { ...context(), current_monotonic_ms: 1_451 }, "decision:host", 5, 250,
    )).toMatchObject({ accepted: false, reason: "proposal_expired" });
  });

  it("accepts an exact current proposal without granting execution authority", () => {
    expect(assessHelixEnvironmentCheckpointDecision(base(), context())).toMatchObject({
      accepted: true, execution_authority: false,
    });
  });

  it.each([
    ["environment", { environment_id: "environment:other" }],
    ["source", { source_id: "source:other" }],
    ["subject", { subject_id: "subject:other" }],
    ["goal revision", { goal_revision: 1 }],
    ["plan hash", { predecessor_plan_hash: `sha256:${"b".repeat(64)}` }],
    ["checkpoint", { checkpoint_id: "checkpoint:old" }],
    ["observation ref", { observation_ref: "observation:old" }],
    ["observation", { observation_revision: 7 }],
    ["affordance", { affordance_revision: 4 }],
    ["epoch", { producer_epoch: "epoch:old" }],
    ["authority", { authority_revision: 2 }],
    ["monotonic origin", { monotonic_origin_id: "process:old" }],
  ])("rejects stale %s", (_label, change) => {
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), ...change }, context()))
      .toMatchObject({ accepted: false, reason: "identity_or_revision_stale" });
  });

  it("rejects expired and future-dated decisions", () => {
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), expires_at_unit: 104 }, context()))
      .toMatchObject({ accepted: false, reason: "proposal_expired" });
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), proposed_at_unit: 106 }, context()))
      .toMatchObject({ accepted: false, reason: "proposal_future_dated" });
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), proposed_at_monotonic_ms: 1_201 }, context()))
      .toMatchObject({ accepted: false, reason: "proposal_future_dated" });
    expect(assessHelixEnvironmentCheckpointDecision(base(), { ...context(), current_monotonic_ms: 1_501 }))
      .toMatchObject({ accepted: false, reason: "proposal_expired" });
  });

  it("rejects a horizon larger than the local profile permits", () => {
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), expires_at_unit: 125 }, context()))
      .toMatchObject({ accepted: false, reason: "proposal_horizon_exceeded" });
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), expires_at_monotonic_ms: 2_001 }, context()))
      .toMatchObject({ accepted: false, reason: "proposal_horizon_exceeded" });
  });

  it("rejects all queued model decisions during an interruption", () => {
    expect(assessHelixEnvironmentCheckpointDecision(base(), { ...context(), interruption_pending: true }))
      .toMatchObject({ accepted: false, reason: "interruption_pending" });
  });

  it("rejects direct keys, injected authority and invalid clocks", () => {
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), keypress: "W" }, context()))
      .toMatchObject({ accepted: false, reason: "invalid_proposal" });
    expect(assessHelixEnvironmentCheckpointDecision({ ...base(), execution_authority: true }, context()))
      .toMatchObject({ accepted: false, reason: "invalid_proposal" });
    expect(assessHelixEnvironmentCheckpointDecision(base(), { ...context(), current_unit: -1 }))
      .toMatchObject({ accepted: false, reason: "context_invalid" });
    expect(assessHelixEnvironmentCheckpointDecision(base(), { ...context(), current_monotonic_ms: Number.NaN }))
      .toMatchObject({ accepted: false, reason: "context_invalid" });
  });
});
