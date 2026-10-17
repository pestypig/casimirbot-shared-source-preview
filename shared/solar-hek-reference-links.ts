/** Bounded navigation links declared by HEK, not authenticated source evidence. */
export function solarHekReferenceUrls(raw: unknown): string[] {
  const entries = Array.isArray(raw) ? raw : [raw];
  const urls: string[] = [];
  for (const entry of entries) {
    if (typeof entry !== 'string' || entry.length > 2048 || /[\r\n\u0000-\u001f]/.test(entry)) continue;
    const candidate = entry.trim();
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) continue;
      const normalized = parsed.href;
      if (!urls.includes(normalized)) urls.push(normalized);
      if (urls.length === 8) break;
    } catch { /* HER can include N/A and other non-links. */ }
  }
  return urls;
}
