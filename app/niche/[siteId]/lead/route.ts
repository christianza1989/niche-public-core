import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { publicSiteByHost, publicSitePage } from "@/lib/public-site";
import { nicheLeadRecipient } from "@/lib/niche-network";
import { sendNicheLeadMail } from "@/lib/niche-mail";
import { notifyStoredLead } from "@/lib/niche-lead-delivery.mjs";

export const dynamic = "force-dynamic";

type Params = Promise<{ siteId: string }>;

function response(message: string, status: number): Response {
  const html = `<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Užklausa</title><style>body{font:18px/1.6 system-ui,sans-serif;background:#f6faf5;color:#18302b;margin:0}main{max-width:640px;margin:10vh auto;padding:32px}a{color:#18584b}</style></head><body><main><h1>${status === 200 ? "Užklausa gauta" : "Užklausos nepavyko priimti"}</h1><p>${message}</p><p><a href="/">Grįžti į pradžią</a></p></main></body></html>`;
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
  // Consume only the bounded form before replying. The local Workers proxy can
  // poison the next request when an origin rejection leaves its body unread.
  // No storage or notification occurs until origin and field checks both pass.
  const form = await limitedForm(request);
  if(pkg.schemaVersion===2 && (!publicSitePage(pkg,'kontaktai') || publicSitePage(pkg,'privatumas')?.type!=='policy')) return response('Užklausos forma šiuo metu nepasiekiama. Parašykite svetainėje nurodytu el. paštu.',503);
  const origin = request.headers.get("origin");
  const referrer = request.headers.get("referer");
  const expected = new URL(request.url).origin;
  if (origin && origin !== expected) return response("Neleidžiama užklausos kilmė.", 403);
  if (!origin) {
    try { if (!referrer || new URL(referrer).origin !== expected) return response("Neleidžiama užklausos kilmė.", 403); }
    catch { return response("Neleidžiama užklausos kilmė.", 403); }
  }
  if (!form) return response("Patikrinkite formą ir bandykite dar kartą.", 400);
  if (form.get("website")) return response("Užklausa gauta.", 200);
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const message = String(form.get("message") || "").trim();
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 250 || message.length < 20 || message.length > 3000 || form.get("consent") !== "yes") {
    return response("Įrašykite vardą, veikiantį el. paštą, bent 20 ženklų žinutę ir pažymėkite sutikimą.", 400);
  }
  if (!env.DB) return response("Užklausų sistema laikinai nepasiekiama. Parašykite svetainėje nurodytu el. paštu.", 503);
  let sourcePath = "/";
  if (referrer) {
    try { const url = new URL(referrer); if (url.origin === expected) sourcePath = url.pathname.slice(0, 300); } catch { /* no attribution */ }
  }
  const now = Date.now();
  const leadId = crypto.randomUUID();
  try {
    const insert=env.DB.prepare("INSERT INTO niche_leads (id, site_id, created_at, source_path, name, email, message, consent_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')").bind(leadId, siteId, now, sourcePath, name, email, message, now);
    if(env.LEAD_MAIL_RETRY_ENABLED==='1'&&env.RELEASE_SITE_ID===siteId){await env.DB.batch([insert,env.DB.prepare('INSERT INTO niche_lead_delivery(id,site_id,canonical_host,recipient) VALUES(?,?,?,?)').bind(leadId,siteId,pkg.canonicalHost,nicheLeadRecipient(siteId,pkg.site.contact.email))]);}
    else await insert.run();
  } catch (error) {
    console.error(JSON.stringify({ event: "niche_lead_write_failed", siteId, error: String(error) }));
    return response("Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.", 503);
  }
  let notified = false;
  if(env.LEAD_MAIL_RETRY_ENABLED==='1'&&env.RELEASE_SITE_ID===siteId)notified=await notifyStoredLead(env,leadId);
  else if (env.LEAD_SMTP_ENABLED === "1" || env.LEAD_EMAIL) {
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
  return response(notified ? "Jūsų žinutė išsaugota ir perduota operatoriaus pašto serveriui. Atsakymui naudosime jūsų nurodytą el. paštą."
    : /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host || "")
    ? "Tai vietinės peržiūros bandymas: žinutė išsaugota tik šiame kompiuteryje, o tikras el. laiškas neišsiųstas."
    : "Jūsų žinutė išsaugota. Pranešimo el. paštu šiuo metu nepavyko perduoti. Jei užklausa skubi, parašykite svetainėje nurodytu el. paštu.", 200);
}
