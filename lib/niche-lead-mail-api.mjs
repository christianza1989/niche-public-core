import { checkHostingerCommerceMail, sendHostingerCommerceMail } from './hostinger-commerce-mail.mjs';

export function nicheMailTransport(env, siteId) {
  if (env.LEAD_HOSTINGER_ENABLED === '1') {
    return env.LEAD_HOSTINGER_SITE_ID === siteId ? 'hostinger-api' : 'none';
  }
  return env.LEAD_EMAIL ? 'cloudflare_email' : env.LEAD_SMTP_ENABLED === '1' ? 'smtp' : 'none';
}

export async function sendNicheHostingerMail(env, mail, fetcher = fetch) {
  if (nicheMailTransport(env, mail.siteId) !== 'hostinger-api') throw Error('mail_site_not_configured');
  const config = { apiKey: env.LEAD_HOSTINGER_API_KEY, mailboxResourceId: env.LEAD_HOSTINGER_MAILBOX_ID,
    sender: env.LEAD_HOSTINGER_SENDER, displayName: mail.fromName };
  if (!config.displayName) throw Error('mail_sender_name_required');
  await checkHostingerCommerceMail(config, fetcher);
  // Hostinger Mail v1 cannot set Reply-To. The already validated client
  // address is in the message body; do not label it as the operator's helpdesk.
  return sendHostingerCommerceMail(config, { id: mail.id, from: config.sender,
    to: mail.to, subject: mail.subject, text: mail.text }, fetcher);
}
