// Local files only. dotenv-expand interpolates dollars even in quoted values.
// Keep credentials literal, and fail closed if the loader cannot represent them.
const header = '# Hostinger mail literal env v2';
const keys = ['LEAD_SMTP_ENABLED', 'LEAD_SMTP_USER', 'LEAD_SMTP_PASSWORD'];
function valid(settings) {
  if (!['0', '1'].includes(settings.LEAD_SMTP_ENABLED) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.LEAD_SMTP_USER || '') || !settings.LEAD_SMTP_PASSWORD || keys.some(key => typeof settings[key] !== 'string' || /[\r\n\x00]/.test(settings[key]))) throw Error('Local mail configuration is invalid; values suppressed.');
  return settings;
}
function literal(value) {
  const quote = ['`', "'", '"'].find(q => !value.includes(q) && (q !== '"' || !/\\[nr]/.test(value)));
  if (!quote) throw Error('Local mail value cannot be represented literally; values suppressed.');
  return quote + value.replaceAll('$', '\\$') + quote;
}
export function serializeHostingerMailEnv(settings) {
  valid(settings);
  return header + '\n' + keys.map(key => key + '=' + literal(settings[key])).join('\n') + '\n';
}
export function parseHostingerMailEnv(raw) {
  try {
    const lines = raw.trim().split(/\r?\n/);
    const version2 = lines[0] === header;
    const settings = {};
    for (const line of version2 ? lines.slice(1) : lines) {
      if (!line.trim()) continue;
      const index = line.indexOf('='), key = line.slice(0, index), encoded = line.slice(index + 1);
      if (index < 1 || !keys.includes(key) || key in settings) throw Error();
      if (!version2) settings[key] = JSON.parse(encoded); // Historical files remain readable.
      else {
        const quote = encoded[0];
        if (!['`', "'", '"'].includes(quote) || encoded.at(-1) !== quote || encoded.slice(1, -1).includes(quote)) throw Error();
        settings[key] = encoded.slice(1, -1).replace(/\\\$/g, '$');
      }
    }
    return valid(settings);
  } catch { throw Error('Local mail configuration is invalid; values suppressed.'); }
}
