/** A display-only projection of an app-server `thread/turns/list` result.
 * Only user-visible message items cross into the cloud. */
export type CodexMirrorTurn = Readonly<{
  id: string;
  user: string;
  assistant: string | null;
  assistantPhase: "commentary" | "final_answer" | null;
  updates?: string[];
  status: "completed" | "working" | "interrupted";
}>;

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value : null;
const safeId = (value: unknown): string | null => {
  const id = text(value);
  return id && id.length <= 160 ? id : null;
};

/** Codex stores answers to its question control in a transport envelope. Show
 * the answer the person chose, never the internal question IDs or JSON. */
const visibleUserText = (value: string): string | null => {
  const input = value.trim();
  if (input.startsWith('<codex_internal_context')) return null;
  const open = '<send_user_message_question_reply>';
  const close = '</send_user_message_question_reply>';
  if (input.startsWith(open)) {
    if (!input.endsWith(close)) return null;
    try {
      const replies = JSON.parse(input.slice(open.length, -close.length));
      if (!Array.isArray(replies)) return null;
      const answers = replies.map(record).map(reply => text(reply?.answer)).filter((answer): answer is string => answer !== null);
      return answers.length ? answers.join('\n') : null;
    } catch {
      return null;
    }
  }
  // The browser context is ambient metadata injected ahead of the user's
  // request. Keep only the actual request when this exact wrapper is present.
  if (input.startsWith('<in-app-browser-context ')) {
    const end = input.indexOf('</in-app-browser-context>');
    if (end < 0) return null;
    const remainder = input.slice(end + '</in-app-browser-context>'.length).trim();
    return text(remainder.replace(/^## My request:\s*/u, ''));
  }
  // Attached files are rendered as cards by Codex Desktop. Its stored text
  // contains local attachment paths and transport guidance, which are neither
  // the person's message nor useful in a small conversation preview.
  if (input.startsWith('# Files mentioned by the user:')) {
    const request = input.match(/(?:^|\n)## My request:\s*\n([\s\S]*)$/u);
    return request ? text(request[1]) : null;
  }
  return input || null;
};

/** `turns` may contain commands, MCP results, reasoning and attachments.
 * Those fields must never become overlay text, even if they contain strings. */
export function projectCodexConversationMirror(turns: unknown, limit = 3): CodexMirrorTurn[] {
  if (!Array.isArray(turns)) return [];
  const visibleLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const selected: CodexMirrorTurn[] = [];
  const seen = new Set<string>();
  for (const candidate of turns.slice(0, 160)) {
    if (selected.length === visibleLimit) break;
    const turn = record(candidate);
    const id = safeId(turn?.id);
    if (!id || seen.has(id) || !Array.isArray(turn?.items)) continue;
    seen.add(id);
    const items = turn.items.map(record).filter((item): item is RecordValue => item !== null);
    const userItem = items.find(item => item.type === "userMessage");
    const user = Array.isArray(userItem?.content)
      ? userItem.content.map(record).filter((part): part is RecordValue => part !== null && part.type === "text")
        .map(part => text(part.text)).map(part => part ? visibleUserText(part) : null)
        .filter((part): part is string => part !== null).join("\n")
      : "";
    const assistants = items.filter(item => item.type === "agentMessage" &&
      (item.phase === "commentary" || item.phase === "final_answer") && text(item.text));
    const final = [...assistants].reverse().find(item => item.phase === "final_answer");
    const latest = final ?? assistants.at(-1);
    // A Codex task started by delegation can have visible assistant replies
    // without a userMessage in the bounded summary view. Keep those replies,
    // but never expose a user item whose content was intentionally filtered.
    if (!user && (userItem || !latest)) continue;
    selected.push({
      id,
      user: user.slice(0, 8_000),
      assistant: latest ? text(latest.text)?.slice(0, 16_000) ?? null : null,
      assistantPhase: latest ? latest.phase as "commentary" | "final_answer" : null,
      status: turn.status === "completed" ? "completed"
        : turn.status === "interrupted" ? "interrupted" : "working",
    });
  }
  return selected.reverse();
}
