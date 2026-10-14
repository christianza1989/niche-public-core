/** Same-tab continuity, separate from optional long-lived device memory. */
export type ChatLine = { id: string; speaker: "client" | "agent"; text: string };
export type ChatSession = { conversation_id: string; session_token: string };
export type SavedChat = { version: 1; expiresAt: number; session: ChatSession; open: boolean; lines: ChatLine[];
  pending: { id: string; text: string } | null; contactRevisions: Partial<Record<"email" | "phone", number>> };
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
const TTL = 30 * 60 * 1000;
const key = (host: string) => `pinet:active-chat:${host}`;
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
export function clearChat(storage: Storage, host: string) {
  try { storage.removeItem(key(host)); } catch { /* Storage may be disabled. */ }
}
export function readChat(storage: Storage, host: string, now = Date.now()): SavedChat | null {
  try {
    const raw = storage.getItem(key(host));
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value.version !== 1 || !Number.isFinite(value.expiresAt) || value.expiresAt <= now || value.expiresAt > now + TTL
      || !text(value.session?.conversation_id, 128) || !text(value.session?.session_token, 4096) || typeof value.open !== "boolean"
      || !Array.isArray(value.lines) || value.lines.length > 80
      || value.lines.some((line: ChatLine) => !line || !text(line.id, 160) || !["client", "agent"].includes(line.speaker) || !text(line.text, 12000))
      || !value.contactRevisions || Object.entries(value.contactRevisions).some(([channel, revision]) =>
        !["email", "phone"].includes(channel) || !Number.isInteger(revision) || Number(revision) < 1)
      || (value.pending !== null && (!text(value.pending?.id, 128) || !text(value.pending?.text, 1800)))) {
      clearChat(storage, host); return null;
    }
    return { version: 1, expiresAt: value.expiresAt,
      session: { conversation_id: value.session.conversation_id, session_token: value.session.session_token },
      open: value.open, lines: value.lines.map((line: ChatLine) => ({ id: line.id, speaker: line.speaker, text: line.text })),
      pending: value.pending === null ? null : { id: value.pending.id, text: value.pending.text },
      contactRevisions: { ...value.contactRevisions } };
  } catch { clearChat(storage, host); return null; }
}
export function saveChat(storage: Storage, host: string, value: SavedChat) {
  try {
    storage.setItem(key(host), JSON.stringify({ version: 1, expiresAt: value.expiresAt,
      session: { conversation_id: value.session.conversation_id, session_token: value.session.session_token },
      open: value.open, lines: value.lines.slice(-80).map(line => ({ id: line.id, speaker: line.speaker, text: line.text })),
      pending: value.pending ? { id: value.pending.id, text: value.pending.text } : null,
      contactRevisions: { ...value.contactRevisions } }));
  } catch { /* A working in-memory chat does not depend on browser storage. */ }
}
export function chatExpiry(now = Date.now()) { return now + TTL; }
