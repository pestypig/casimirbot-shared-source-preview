import { describe, expect, it } from "vitest";
import {
  assessHelixEnvironmentActionChoiceProposal,
  materializeHelixEnvironmentActionChoice,
  verifiedHelixEnvironmentActionChoiceSourceSchema,
  type VerifiedHelixEnvironmentActionChoiceSource,
} from "../helix-environment-action-choice";

const h = (char: string) => `sha256:${char.repeat(64)}`;
const source = (): VerifiedHelixEnvironmentActionChoiceSource => ({
  context: {
    run_id: "run:one", reasoning_binding_id: "binding:one", binding_epoch: 2,
    environment_id: "environment:one", source_id: "source:one", subject_id: "player:one",
    goal_id: "goal:one", goal_revision: 3,
    predecessor_plan_id: "plan:previous", predecessor_plan_hash: h("a"),
    checkpoint_id: "checkpoint:one", checkpoint_event_id: "event:one",
    checkpoint_event_hash: h("b"), observation_ref: "observation:one",
    observation_revision: 4, affordance_revision: 5,
    producer_epoch: "epoch:one", authority_id: "authority:one", authority_revision: 6,
    monotonic_origin_id: "clock:one", current_unit: 100, current_monotonic_ms: 1_000,
    maximum_proposal_horizon_units: 20, maximum_proposal_lifetime_ms: 1_000,
    interruption_pending: false,
  },
  observation_summary: "health:20, hazard_count:0, next_waypoint_reachable:true",
  candidates: [
    { candidate_id: "advance:one", plan_id: "plan:advance", plan_hash: h("c"),
      action_code: "walk_to_waypoint", target_ref: "waypoint:one", estimated_units: 10 },
    { candidate_id: "turn:one", plan_id: "plan:turn", plan_hash: h("d"),
      action_code: "look_at_waypoint", target_ref: "waypoint:one", estimated_units: 3 },
  ],
});
const decide = (choice: unknown = { choice_id: "advance:one", rationale_code: "route_clear" },
  after: VerifiedHelixEnvironmentActionChoiceSource = source()) =>
  materializeHelixEnvironmentActionChoice({ untrustedChoice: choice,
    invocationSource: source(), currentSource: after, hostDecisionId: "decision:one",
    requestedHorizonUnits: 12, requestedLifetimeMs: 500 });

describe("Responses actor action-choice contract", () => {
  it("stamps a host-bound choice of a prebuilt plan without granting execution", () => {
    const verdict = decide();
    expect(verdict).toMatchObject({ accepted: true, execution_authority: false,
      proposal: { schema: "environment.action_choice_proposal.v1",
        context: { run_id: "run:one", reasoning_binding_id: "binding:one",
          goal_id: "goal:one", goal_revision: 3, authority_revision: 6 },
        choice_id: "advance:one", plan_id: "plan:advance", plan_hash: h("c"),
        proposed_at_unit: 100, expires_at_unit: 112,
        execution_authority: false, answer_authority: false, terminal_eligible: false } });
    expect(JSON.stringify(verdict)).not.toContain("observation_summary");
  });

  it("allows a short asynchronous decision only while its exact source remains current", () => {
    const after = source(); after.context.current_unit = 109;
    after.context.current_monotonic_ms = 1_450;
    expect(decide(undefined, after).accepted).toBe(true);
    after.context.current_unit = 113;
    expect(decide(undefined, after)).toMatchObject({ accepted: false, reason: "proposal_expired" });
    after.context.current_unit = 101;
    after.context.current_monotonic_ms = 1_501;
    expect(decide(undefined, after)).toMatchObject({ accepted: false, reason: "proposal_expired" });
    after.context.current_monotonic_ms = 900;
    expect(decide(undefined, after)).toMatchObject({ accepted: false, reason: "proposal_future_dated" });
  });

  it("rejects stale binding, goal, evidence, authority, and candidate changes", () => {
    for (const mutate of [
      (s: VerifiedHelixEnvironmentActionChoiceSource) => { s.context.binding_epoch++; },
      (s: VerifiedHelixEnvironmentActionChoiceSource) => { s.context.goal_revision++; },
      (s: VerifiedHelixEnvironmentActionChoiceSource) => { s.context.checkpoint_event_hash = h("e"); },
      (s: VerifiedHelixEnvironmentActionChoiceSource) => { s.context.authority_revision++; },
      (s: VerifiedHelixEnvironmentActionChoiceSource) => { s.context.producer_epoch = "epoch:two"; },
      (s: VerifiedHelixEnvironmentActionChoiceSource) => { s.candidates[0].plan_hash = h("f"); },
      (s: VerifiedHelixEnvironmentActionChoiceSource) => { s.observation_summary = "changed"; },
    ]) {
      const after = source(); mutate(after);
      expect(decide(undefined, after)).toMatchObject({ accepted: false, reason: "source_changed" });
    }
  });

  it("rejects manual interruption and unknown or smuggled action arguments", () => {
    const after = source(); after.context.interruption_pending = true;
    expect(decide(undefined, after)).toMatchObject({ accepted: false, reason: "interruption_pending" });
    expect(decide({ choice_id: "execute:all", rationale_code: "go" }))
      .toMatchObject({ accepted: false, reason: "candidate_unavailable" });
    expect(decide({ choice_id: "advance:one", rationale_code: "go", keys: ["W"] }))
      .toMatchObject({ accepted: false, reason: "invalid_choice" });
    expect(decide({ choice_id: "advance:one", rationale_code: "go", plan_hash: h("f") }))
      .toMatchObject({ accepted: false, reason: "invalid_choice" });
  });

  it("keeps hold and escalation free of player actions", () => {
    for (const choice_id of ["hold_safe", "escalate_to_codex"]) {
      expect(decide({ choice_id, rationale_code: "needs_review" })).toMatchObject({
        accepted: true, proposal: { choice_id, plan_id: null, plan_hash: null,
          action_code: null, target_ref: null, execution_authority: false } });
    }
  });

  it("requires distinct host candidates and a bounded dual-clock horizon", () => {
    const duplicate = source(); duplicate.candidates[1].candidate_id = "advance:one";
    expect(verifiedHelixEnvironmentActionChoiceSourceSchema.safeParse(duplicate).success).toBe(false);
    expect(materializeHelixEnvironmentActionChoice({ untrustedChoice: { choice_id: "advance:one",
      rationale_code: "route_clear" }, invocationSource: source(), currentSource: source(),
      hostDecisionId: "decision:one", requestedHorizonUnits: 21, requestedLifetimeMs: 500 }))
      .toMatchObject({ accepted: false, reason: "proposal_horizon_exceeded" });
  });

  it("rechecks a returned proposal before preflight after another asynchronous delay", () => {
    const decision = decide();
    if (!decision.accepted) throw new Error("fixture proposal missing");
    const current = source();
    current.context.current_unit = 111;
    expect(assessHelixEnvironmentActionChoiceProposal(decision.proposal, current).accepted).toBe(true);
    current.candidates[0].plan_hash = h("f");
    expect(assessHelixEnvironmentActionChoiceProposal(decision.proposal, current))
      .toMatchObject({ accepted: false, reason: "source_changed" });
    current.candidates[0].plan_hash = h("c");
    current.candidates[1].action_code = "different_option";
    expect(assessHelixEnvironmentActionChoiceProposal(decision.proposal, current))
      .toMatchObject({ accepted: false, reason: "source_changed" });
    current.candidates[1].action_code = "look_at_waypoint";
    current.context.current_unit = 113;
    expect(assessHelixEnvironmentActionChoiceProposal(decision.proposal, current))
      .toMatchObject({ accepted: false, reason: "proposal_expired" });
  });
});
