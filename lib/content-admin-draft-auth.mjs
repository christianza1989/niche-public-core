import { createHash, timingSafeEqual } from 'node:crypto';
import { authError } from './content-admin-auth.mjs';

// This capability is deliberately separate from owner cookies and CSRF tokens.
// Hash both operands to a fixed length before the constant-time comparison.
export function authenticateDraftWriter(request, bindings, host) {
  const url = new URL(request.url);
  if (url.origin !== `https://${host}` || url.search || request.headers.has('origin') ||
      request.headers.has('cookie') || request.headers.has('sec-fetch-site')) {
    throw authError(403, 'Juodraščių importui reikia atskiros autentifikuotos užklausos.');
  }
  const expected = bindings.CONTENT_ADMIN_DRAFT_TOKEN;
  if (typeof expected !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(expected)) {
    throw authError(503, 'Juodraščių importas neįjungtas.');
  }
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(header);
  const hash = value => createHash('sha256').update(value).digest();
  const valid = timingSafeEqual(hash(match?.[1] || ''), hash(expected));
  if (!match || !valid) throw authError(401, 'Juodraščių importo raktas negalioja.');
  return 'automation:codex-drafts';
}

export function draftChanges(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      !Object.keys(input).length || Object.keys(input).some(k => !['title', 'description', 'body'].includes(k))) {
    throw authError(400, 'Galima keisti tik juodraščio antraštę, aprašymą ir tekstą.');
  }
  return input;
}
