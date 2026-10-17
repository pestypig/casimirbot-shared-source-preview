import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";

const BADGE_IDS = [
  "darkmatter.lz_yamashita_yukawa.jeans_maxwell_proxy",
  "darkmatter.lz_stenhouse_yamashita.pure_law_crosscheck",
  "darkmatter.bosonic_multichannel.compatibility_screen",
  "darkmatter.shared_scattering.normalization_bridge_gate",
];

describe("bosonic dark-matter screen theory badges", () => {
  it("registers the calculations and blocked shared-kernel gate in the canonical graph", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const badges = graph.badges.filter((item) => BADGE_IDS.includes(item.id));

    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(badges.map((item) => item.id)).toEqual(BADGE_IDS);
    expect(badges.every((item) => item.claimBoundary.diagnosticOnly)).toBe(true);
    expect(badges.every((item) => item.claimBoundary.physicalMechanismClaimAllowed === false)).toBe(true);
    expect(badges.every((item) => item.claimBoundary.promotionAllowed === false)).toBe(true);

    const proxy = badges[0]!;
    expect(proxy.plainMeaning).toContain("0.08886");
    expect(proxy.plainMeaning).toContain("2.40e-25");
    expect(proxy.assumptions.join(" ")).toContain("neither is a source-specific astrophysical likelihood");
    expect(proxy.sourceRefs.map((ref) => ref.path)).toContain(
      "docs/research/casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.json",
    );

    const gate = badges[3]!;
    expect(gate.status).toBe("blocked");
    expect(gate.plainMeaning).toContain("K_Xe");
    expect(gate.plainMeaning).toContain("have not yet been evaluated");
    expect(graph.edges.filter((edge) => BADGE_IDS.includes(edge.from) || BADGE_IDS.includes(edge.to)))
      .toEqual(expect.not.arrayContaining([expect.objectContaining({ observableBridge: expect.anything() })]));
  });

  it("can be retrieved through the theory-context locator using experiment and solve vocabulary", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        query: "LZ xenon 248 keV dark matter boson star Yukawa Jeans Maxwell Casimir DP shared scattering coherence loss; see docs/research/casimir-dp-lz-shared-scattering-work-program.md",
        limit: 80,
      },
    });
    const matchIds = matches.map((match) => match.badgeId);

    expect(matchIds).toEqual(expect.arrayContaining(BADGE_IDS));
    const bridge = matches.find((match) => match.badgeId === BADGE_IDS[3]);
    expect(bridge?.matchedRepoPaths).toContain("docs/research/casimir-dp-lz-shared-scattering-work-program.md");
    expect(bridge?.claimBoundaryWarnings).toContain("physical mechanism claim not allowed");
  });
});
