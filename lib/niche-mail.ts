import { connect } from "cloudflare:sockets";
import { EmailMessage } from "cloudflare:email";
import { smtpMessage, smtpSession } from "./smtp-protocol.mjs";
import { sendNicheHostingerMail } from './niche-lead-mail-api.mjs';
export async function sendNicheLeadMail(env: Cloudflare.Env, mail: { siteId: string; to: string; replyTo: string; subject: string; text: string; id: string; from?: string; fromName?: string }) {
  if (env.LEAD_HOSTINGER_ENABLED === '1') {
    await sendNicheHostingerMail(env, mail);
    return true;
  }
  // An explicit binding selects native delivery. Do not retry a failed send
  // through another provider: its acceptance may be unknown and duplicate mail.
  if (env.LEAD_EMAIL) {
    if (!mail.from) throw new Error("Native email sender is missing");
    const raw = smtpMessage({ ...mail, from: mail.from });
    await env.LEAD_EMAIL.send(new EmailMessage(mail.from, mail.to, raw));
    return true;
  }
  if (env.LEAD_SMTP_ENABLED !== "1" || !env.LEAD_SMTP_USER || !env.LEAD_SMTP_PASSWORD) return false;
  if (env.LEAD_SMTP_SITE_ID && env.LEAD_SMTP_SITE_ID !== mail.siteId) return false;
  const hostname=env.LEAD_SMTP_HOST || 'smtp.hostinger.com';
  if (!['smtp.hostinger.com','smtp.gmail.com'].includes(hostname) || hostname==='smtp.gmail.com'&&!env.LEAD_SMTP_SITE_ID) throw Error('mail_host_not_configured');
  const socket = connect({ hostname, port: 465 }, { secureTransport: "on", allowHalfOpen: false });
  socket.closed.catch(() => {});
  await smtpSession(socket, { user: env.LEAD_SMTP_USER, password: env.LEAD_SMTP_PASSWORD, timeoutMs: 12000 }, mail);
  return true;
}
