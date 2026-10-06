import { sendHostingerMail } from "./hostinger-transport.mjs";
export async function sendNicheLeadMail(env: Cloudflare.Env, mail: { to: string; replyTo: string; subject: string; text: string; id: string }) {
  if (env.LEAD_SMTP_ENABLED !== "1" || (!env.MAIL_RELAY_URL && (!env.LEAD_SMTP_USER || !env.LEAD_SMTP_PASSWORD))) return false;
  await sendHostingerMail(env, mail);
  return true;
}
