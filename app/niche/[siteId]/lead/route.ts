import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { publicSiteByHost, publicSitePage } from "@/lib/public-site";
import { nicheLeadRecipient } from "@/lib/niche-network";
import { sendNicheLeadMail } from "@/lib/niche-mail";

export const dynamic = "force-dynamic";

type Params = Promise<{ siteId: string }>;

function response(message: string, status: number, stepover = false): Response {
  const style = stepover
    ? "@font-face{font-family:'StepOver Manrope';font-style:normal;font-weight:400 800;font-display:swap;src:url('/fonts/parasoplansetes/manrope-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+2000-206F}@font-face{font-family:'StepOver Manrope';font-style:normal;font-weight:400 800;font-display:swap;src:url('/fonts/parasoplansetes/manrope-latin-ext.woff2') format('woff2');unicode-range:U+0100-02FF,U+1E00-1EFF}body{font:400 17px/1.65 'StepOver Manrope',Arial,sans-serif;background:#f7f9fc;color:#344862;margin:0}main{box-sizing:border-box;max-width:640px;margin:10vh auto;padding:24px}h1{font-size:clamp(26px,5vw,32px);font-weight:650;line-height:1.25;letter-spacing:-.02em;color:#172b49;margin:0 0 24px}p{margin:0 0 18px}a{color:#185de5;text-underline-offset:.23em}a:focus-visible{outline:3px solid #185de5;outline-offset:4px}@media(max-width:700px){body{font-size:16px}}"
    : "body{font:18px/1.6 system-ui,sans-serif;background:#f6faf5;color:#18302b;margin:0}main{max-width:640px;margin:10vh auto;padding:32px}a{color:#18584b}";
  const html = `<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Užklausa</title><style>${style}</style></head><body><main><h1>${status === 200 ? "Užklausa gauta" : "Užklausos nepavyko priimti"}</h1><p>${message}</p><p><a href="/">Grįžti į pradžią</a></p></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "x-content-type-options": "nosniff" } });
}

async function limitedForm(request: Request): Promise<URLSearchParams | null> {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return null;
  const declaredSize = request.headers.get("content-length");
  if (declaredSize && /^\d+$/.test(declaredSize) && Number(declaredSize) > 65536) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    // Retain at most 10 KB. Drain modest rejected bodies without retaining
    // their bytes so the local proxy can deliver an error and reuse transport.
    // Stop abusive streams at 64 KB; they never reach parsing or storage.
    if (length > 65536) { await reader.cancel(); return null; }
    if (length <= 10000) chunks.push(value);
  }
  if (length > 10000) return null;
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new URLSearchParams(new TextDecoder().decode(bytes));
}

export async function POST(request: Request, { params }: { params: Params }): Promise<Response> {
  const { siteId } = await params;
  const host = (await headers()).get("host");
  const pkg = publicSiteByHost(host);
  if (!pkg || pkg.siteId !== siteId || !publicSitePage(pkg, "")) return response("Ši svetainė nepasiekiama.", 404);
  const reply = (message: string, status: number) => response(message, status, pkg.siteId === "parasoplansetes");
  // Consume only the bounded form before replying. The local Workers proxy can
  // poison the next request when an origin rejection leaves its body unread.
  // No storage or notification occurs until origin and field checks both pass.
  const form = await limitedForm(request);
  if(pkg.schemaVersion===2 && (!publicSitePage(pkg,'kontaktai') || publicSitePage(pkg,'privatumas')?.type!=='policy')) return reply((pkg.siteId === "parasoplansetes" ? "Užklausos forma šiuo metu neveikia. Prašome susisiekti svetainėje nurodytu el. paštu." : "Užklausos forma šiuo metu nepasiekiama. Parašykite svetainėje nurodytu el. paštu."),503);
  const origin = request.headers.get("origin");
  const referrer = request.headers.get("referer");
  const expected = new URL(request.url).origin;
  if (origin && origin !== expected) return reply((pkg.siteId === "parasoplansetes" ? "Formos pateikti nepavyko. Atverkite ją šioje svetainėje ir bandykite dar kartą." : "Neleidžiama užklausos kilmė."), 403);
  if (!origin) {
    try { if (!referrer || new URL(referrer).origin !== expected) return reply((pkg.siteId === "parasoplansetes" ? "Formos pateikti nepavyko. Atverkite ją šioje svetainėje ir bandykite dar kartą." : "Neleidžiama užklausos kilmė."), 403); }
    catch { return reply((pkg.siteId === "parasoplansetes" ? "Formos pateikti nepavyko. Atverkite ją šioje svetainėje ir bandykite dar kartą." : "Neleidžiama užklausos kilmė."), 403); }
  }
  if (!form) return reply((pkg.siteId === "parasoplansetes" ? "Patikrinkite įvestus duomenis ir bandykite dar kartą." : "Patikrinkite formą ir bandykite dar kartą."), 400);
  if (form.get("website")) return reply("Užklausa gauta.", 200);
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const message = String(form.get("message") || "").trim();
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 250 || message.length < 20 || message.length > 3000 || form.get("consent") !== "yes") {
    return reply((pkg.siteId === "parasoplansetes" ? "Nurodykite vardą ir galiojantį el. pašto adresą. Žinutę turi sudaryti bent 20 simbolių, taip pat būtina pažymėti sutikimą." : "Įrašykite vardą, veikiantį el. paštą, bent 20 ženklų žinutę ir pažymėkite sutikimą."), 400);
  }
  if (!env.DB) return reply((pkg.siteId === "parasoplansetes" ? "Užklausų sistema laikinai nepasiekiama. Rašykite tiesiogiai svetainėje nurodytu el. pašto adresu." : "Užklausų sistema laikinai nepasiekiama. Parašykite svetainėje nurodytu el. paštu."), 503);
  let sourcePath = "/";
  if (referrer) {
    try { const url = new URL(referrer); if (url.origin === expected) sourcePath = url.pathname.slice(0, 300); } catch { /* no attribution */ }
  }
  const now = Date.now();
  const leadId = crypto.randomUUID();
  try {
    await env.DB.prepare("INSERT INTO niche_leads (id, site_id, created_at, source_path, name, email, message, consent_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')")
      .bind(leadId, siteId, now, sourcePath, name, email, message, now).run();
  } catch (error) {
    console.error(JSON.stringify({ event: "niche_lead_write_failed", siteId, error: String(error) }));
    return reply((pkg.siteId === "parasoplansetes" ? "Užklausos išsaugoti nepavyko. Prašome kreiptis svetainėje nurodytu el. paštu." : "Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu."), 503);
  }
  let notified = false;
  if (env.LEAD_SMTP_ENABLED === "1" || env.LEAD_EMAIL) {
    try {
      const mail = {
        id: leadId,
        to: nicheLeadRecipient(siteId, pkg.site.contact.email),
        replyTo: email,
        subject: `[${pkg.canonicalHost}] Poreikio užklausa ${leadId.slice(0, 8)}`,
        text: `Nauja svetainės užklausa\n\nSvetainė: ${pkg.canonicalHost}\nPuslapis: ${sourcePath}\nUžklausos ID: ${leadId}\nVardas: ${name}\nEl. paštas: ${email}\n\nŽinutė:\n${message}\n`,
      };
      notified = await sendNicheLeadMail(env, mail);
      if (!notified && env.LEAD_EMAIL) { await env.LEAD_EMAIL.send({ ...mail, from: `uzklausos@${pkg.canonicalHost}` }); notified = true; }
      if (!notified) throw new Error("mail not configured");
      await env.DB.prepare("UPDATE niche_leads SET status = 'notified' WHERE id = ? AND site_id = ?")
        .bind(leadId, siteId).run();
    } catch {
      console.error(JSON.stringify({ event: "niche_lead_notification_failed", siteId, leadId, code: "smtp_failed" }));
    }
  }
  return reply(notified ? (pkg.siteId === "parasoplansetes" ? "Žinutė gauta ir pranešimas perduotas mūsų pašto sistemai. Atsakymui naudosime jūsų nurodytą el. pašto adresą." : "Jūsų žinutė išsaugota ir perduota operatoriaus pašto serveriui. Atsakymui naudosime jūsų nurodytą el. paštą.")
    : /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host || "")
    ? (pkg.siteId === "parasoplansetes" ? "Tai vietinės peržiūros bandymas. Žinutė išsaugota šiame kompiuteryje. El. laiškas neišsiųstas." : "Tai vietinės peržiūros bandymas: žinutė išsaugota tik šiame kompiuteryje, o tikras el. laiškas neišsiųstas.")
    : (pkg.siteId === "parasoplansetes" ? "Žinutė išsaugota, tačiau pranešimas administratoriui nebuvo išsiųstas. Jei norite susisiekti tiesiogiai, rašykite svetainėje nurodytu el. paštu." : "Jūsų žinutė išsaugota. Pranešimo el. paštu šiuo metu nepavyko perduoti. Jei užklausa skubi, parašykite svetainėje nurodytu el. paštu."), 200);
}
