import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { publicSiteByHost, publicSitePage, publicSitePages } from "@/lib/public-site";
import {memoLeadContext,memoLeadText} from '@/lib/memocasting-lead-response.mjs';
import { nicheLeadRecipient, nicheNetworkContact } from "@/lib/niche-network";
import { sendNicheLeadMail } from "@/lib/niche-mail";
import { inquiryDetails, inquiryMessage, leadPagesReady } from '@/lib/niche-lead-fields.mjs';
import { nicheMailTransport } from '@/lib/niche-lead-mail-api.mjs';

export const dynamic = "force-dynamic";

type Params = Promise<{ siteId: string }>;

function response(message: string, status: number, context?:{language:string;home:string}|null, json = false): Response {
  const copy=memoLeadText(message,status,context);
  if (json) return Response.json({ message: copy.message }, { status, headers: {
    'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff' } });
  const html = `<!doctype html><html lang="${copy.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${context?copy.title:"Užklausa"}</title><style>body{font:18px/1.6 system-ui,sans-serif;background:#f6faf5;color:#18302b;margin:0}main{max-width:640px;margin:10vh auto;padding:32px}a{color:#18584b}</style></head><body><main><h1>${copy.title}</h1><p>${copy.message}</p><p><a href="${copy.home}">${copy.back}</a></p></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "x-content-type-options": "nosniff" } });
}

async function limitedForm(request: Request, retainedLimit = 10000): Promise<URLSearchParams | null> {
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
    // The default retains10KB; Memo/Signaturepads retain the64KiB ceiling,
    // since URL-encoded native text can exceed10KB within its3000-char limit.
    // Drain modest rejected bodies without retaining
    // their bytes so the local proxy can deliver an error and reuse transport.
    // Stop abusive streams at 64 KB; they never reach parsing or storage.
    if (length > 65536) { await reader.cancel(); return null; }
    if (length <= retainedLimit) chunks.push(value);
  }
  if (length > retainedLimit) return null;
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new URLSearchParams(new TextDecoder().decode(bytes));
}

export async function POST(request: Request, { params }: { params: Params }): Promise<Response> {
  const json = request.headers.get('accept')?.includes('application/json') === true;
  const { siteId } = await params;
  const host = (await headers()).get("host");
  const pkg = publicSiteByHost(host);
  if (!pkg || pkg.siteId !== siteId || !publicSitePage(pkg, "")) return response("Ši svetainė nepasiekiama.", 404, null, json);
  // Consume only the bounded form before replying. The local Workers proxy can
  // poison the next request when an origin rejection leaves its body unread.
  // No storage or notification occurs until origin and field checks both pass.
  const form = await limitedForm(request,['memocasting','signaturepads'].includes(siteId)?65536:10000);
  if(siteId==='memocasting'&&!form)return response("Patikrinkite formą ir bandykite dar kartą.",400);
  const context=siteId==='memocasting'?memoLeadContext(publicSitePages(pkg),String(form?.get('source_path')||'')):null;
  const reply=(message:string,status:number)=>response(message,status,context,json);
  const receipt=(status:string)=>reply(status==='notified'
    ? 'Jūsų žinutė išsaugota ir perduota operatoriaus pašto serveriui. Atsakymui naudosime jūsų nurodytą el. paštą.'
    : status==='new' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host || '')
    ? 'Tai vietinės peržiūros bandymas: žinutė išsaugota tik šiame kompiuteryje, o tikras el. laiškas neišsiųstas.'
    : 'Jūsų žinutė išsaugota.',200);
  if(siteId==='memocasting'&&!context)return reply('Užklausos forma šiuo metu nepasiekiama. Parašykite svetainėje nurodytu el. paštu.',503);
  if(!leadPagesReady(pkg,publicSitePages(pkg))) return reply('Užklausos forma šiuo metu nepasiekiama. Parašykite svetainėje nurodytu el. paštu.',503);
  const origin = request.headers.get("origin");
  const referrer = request.headers.get("referer");
  const expected = new URL(request.url).origin;
  if (origin && origin !== expected) return reply("Neleidžiama užklausos kilmė.", 403);
  if (!origin) {
    try { if (!referrer || new URL(referrer).origin !== expected) return reply("Neleidžiama užklausos kilmė.", 403); }
    catch { return reply("Neleidžiama užklausos kilmė.", 403); }
  }
  if (!form) return reply("Patikrinkite formą ir bandykite dar kartą.", 400);
  if (form.get("website")) return reply("Užklausa gauta.", 200);
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const submittedMessage = String(form.get("message") || "").trim();
  const details = inquiryDetails(form);
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 250 || submittedMessage.length < 20 || submittedMessage.length > 3000 || form.get("consent") !== "yes") {
    return reply("Įrašykite vardą, veikiantį el. paštą, bent 20 ženklų žinutę ir pažymėkite sutikimą.", 400);
  }
  if (!details) return reply('Patikrinkite formą ir bandykite dar kartą.', 400);
  const message = inquiryMessage(submittedMessage, details);
  const inquiryId=String(form.get('inquiry_id')||'');
  if(inquiryId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(inquiryId))return reply('Patikrinkite formą ir bandykite dar kartą.',400);
  if (!env.DB) return reply("Užklausų sistema laikinai nepasiekiama. Parašykite svetainėje nurodytu el. paštu.", 503);
  let sourcePath = context ? String(form.get("source_path")) : "/";
  if (referrer && !context) {
    try { const url = new URL(referrer); if (url.origin === expected) sourcePath = url.pathname.slice(0, 300); } catch { /* no attribution */ }
  }
  const now = Date.now();
  const leadId = inquiryId || crypto.randomUUID();
  try {
    const inserted=await env.DB.prepare("INSERT INTO niche_leads (id, site_id, created_at, source_path, name, email, message, consent_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new') ON CONFLICT(id) DO NOTHING")
      .bind(leadId, siteId, now, sourcePath, name, email, message, now).run();
    if(inserted.meta.changes===0){
      const previous=await env.DB.prepare('SELECT name,email,message,source_path,status FROM niche_leads WHERE id=? AND site_id=?')
        .bind(leadId,siteId).first<{name:string;email:string;message:string;source_path:string;status:string}>();
      if(!previous||previous.name!==name||previous.email!==email||previous.message!==message||previous.source_path!==sourcePath)return reply('Patikrinkite formą ir bandykite dar kartą.',409);
      return receipt(previous.status);
    }
  } catch (error) {
    console.error(JSON.stringify({ event: "niche_lead_write_failed", siteId, error: String(error) }));
    return reply("Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.", 503);
  }
  let notified = false;
  const transport = nicheMailTransport(env, siteId);
  if (transport !== 'none') {
    // A durable claim precedes external I/O. Failed/unknown receipts are never
    // automatically retried through a second transport.
    let claimed = false;
    try {
      const claim = await env.DB.prepare("UPDATE niche_leads SET status = 'mail-sending' WHERE id = ? AND site_id = ? AND status = 'new'")
        .bind(leadId, siteId).run();
      if (claim.meta.changes !== 1) throw Error('mail_claim_unavailable');
      claimed = true;
      const mail = {
        siteId,
        id: leadId,
        to: nicheLeadRecipient(siteId, pkg.site.contact.email),
        from: `uzklausos@${pkg.canonicalHost}`,
        fromName: nicheNetworkContact(siteId).operatorName,
        replyTo: email,
        subject: `[${pkg.canonicalHost}] Poreikio užklausa ${leadId.slice(0, 8)}`,
        text: `Nauja svetainės užklausa\n\nSvetainė: ${pkg.canonicalHost}\nPuslapis: ${sourcePath}\nUžklausos ID: ${leadId}\nVardas: ${name}\nEl. paštas: ${email}\n\nŽinutė:\n${message}\n`,
      };
      notified = await sendNicheLeadMail(env, mail);
      if (!notified) throw new Error("mail not configured");
      await env.DB.prepare("UPDATE niche_leads SET status = 'notified' WHERE id = ? AND site_id = ?")
        .bind(leadId, siteId).run();
      console.log(JSON.stringify({ event: "niche_lead_notified", siteId, leadId, transport }));
    } catch {
      if (claimed) {
        try { await env.DB.prepare("UPDATE niche_leads SET status = 'mail-unknown' WHERE id = ? AND site_id = ? AND status = 'mail-sending'")
          .bind(leadId, siteId).run(); } catch { /* Keep the no-retry claim if DB is unavailable. */ }
      }
      console.error(JSON.stringify({ event: "niche_lead_notification_failed", siteId, leadId, code: "mail_failed", transport }));
    }
  }
  return receipt(notified?'notified':transport==='none'?'new':'mail-unknown');
}
