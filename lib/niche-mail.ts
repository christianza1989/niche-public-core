import { connect } from "cloudflare:sockets";
import { smtpSession } from "./smtp-protocol.mjs";
export async function sendNicheLeadMail(env: Cloudflare.Env, mail: { to: string; replyTo: string; subject: string; text: string; id: string }) {
  if (env.LEAD_SMTP_ENABLED !== "1" || !env.LEAD_SMTP_USER || !env.LEAD_SMTP_PASSWORD) return false;
  const socket = connect({ hostname: "smtp.hostinger.com", port: 465 }, { secureTransport: "on", allowHalfOpen: false });
  socket.closed.catch(() => {});
  await smtpSession(socket, { user: env.LEAD_SMTP_USER, password: env.LEAD_SMTP_PASSWORD, timeoutMs: 12000 }, mail);
  return true;
}
