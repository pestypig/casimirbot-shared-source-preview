export const AGENT_ACCESS_REASONING_BRIEF = {
  title: "Reason with evidence while disconnected",
  intro:
    "An AI client can use this public brief to structure its own answer before an MCP connection exists.",
  steps: [
    "Identify the user's actual question, requested source, and intended action. Quoted, negated, historical, or hypothetical tool words are not commands.",
    "Keep source facts, tool observations, and your own inferences distinct. Name the source and uncertainty for each material claim.",
    "When an authorized MCP connection exists, inspect the admitted read tools and re-evaluate their returned evidence. A route proposes a procedure; a receipt records an observation. Neither alone is the final answer.",
    "Check missing evidence and contradictions before concluding. If the available evidence cannot support the requested conclusion, say what remains unverified.",
  ],
  boundary:
    "This public brief is guidance, not a live Helix reasoning trace. Do not claim a CasimirBot run state, tool result, proof verdict, or terminal decision without its authenticated, typed evidence.",
} as const;

export const PUBLIC_REASONING_CONTEXT = {
  title: "Use public CasimirBot context in your own AI chat",
  intro:
    "If an AI host retrieves this page, it can use the public context without an account or MCP connection. The host chooses whether to follow a pasted link and remains responsible for its answer.",
  path: "/llms.txt",
  lenses: [
    {
      title: "Civilization Bounds",
      summary:
        "For society and collective-action questions, examine affected people, social and material dependencies, collaboration, evidence gaps, and ways a proposal could fail.",
    },
    {
      title: "Theory Badge Graph",
      summary:
        "For scientific claims, trace assumptions, mechanisms, and evidence boundaries before treating a model or simulation as support.",
    },
    {
      title: "Moral Graph",
      summary:
        "For questions about welfare or obligation, identify affected beings and make value judgments and uncertainty explicit.",
    },
  ],
  example:
    "A broad question about society may benefit from all three lenses even if the user names none of them. Apply only the relevant lenses; this page does not authorize a tool call or establish real-world facts.",
} as const;
