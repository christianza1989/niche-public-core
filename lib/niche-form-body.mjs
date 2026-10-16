// One bounded reader for the shared inquiry route. Rejected modest bodies must
// be consumed too: returning early can poison the local proxy's next request.
export async function readNicheFormBody(request) {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  const acceptedType = type === 'application/x-www-form-urlencoded';
  const declaredSize = request.headers.get('content-length');
  const declaredTooLarge = declaredSize && /^\d+$/.test(declaredSize) && Number(declaredSize) > 65536;
  if (!request.body) return null;
  const reader = request.body.getReader(), chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 65536) { await reader.cancel(); return null; }
    if (acceptedType && !declaredTooLarge && length <= 10000) chunks.push(value);
  }
  if (!acceptedType || declaredTooLarge || length > 10000) return null;
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new URLSearchParams(new TextDecoder().decode(bytes));
}
