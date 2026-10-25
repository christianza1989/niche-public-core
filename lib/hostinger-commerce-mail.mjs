// Existing Hostinger Mail account, official Mail API v1. No SMTP fallback or retry.
const mailboxId = /^[A-Za-z0-9]{1,160}$/;
const address = /^[^\s<>\r\n@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
function configuration(config) {
  if (!config?.apiKey || !mailboxId.test(config.mailboxResourceId || '') || !address.test(config.sender || '')) throw Error('mail_api_not_configured');
}
export async function checkHostingerCommerceMail(config, fetcher = fetch) {
  configuration(config);
  const response = await fetcher('https://api.mail.hostinger.com/api/v1/me', {
    headers: {Authorization: `Bearer ${config.apiKey}`, Accept: 'application/json'},
    redirect: 'manual', signal: AbortSignal.timeout(12000),
  });
  if (response.status !== 200) throw Error('mail_api_account_unavailable');
  const result = await response.json();
  if (!result?.data?.mailboxes?.some(mailbox => mailbox.resourceId === config.mailboxResourceId && mailbox.address === config.sender)) throw Error('mail_api_sender_mismatch');
  return {ready: true, stage: 'authenticated'};
}
export async function sendHostingerCommerceMail(config, message, fetcher = fetch) {
  configuration(config);
  if (message?.from !== config.sender || !address.test(message.to || '') || (message.replyTo && !address.test(message.replyTo)) || !/^[A-Za-z0-9-]{1,220}$/.test(message.id || '')) throw Error('mail_api_message_invalid');
  const displayName = config.displayName || 'Memocasting';
  if (typeof displayName !== 'string' || /[\r\n\x00-\x1f]/.test(displayName) || displayName.length > 120) throw Error('mail_api_message_invalid');
  // The API does not expose custom Message-ID/Reply-To. Keep a searchable
  // internal marker and explicit support address; do not claim those headers.
  const text = [message.text, ...(message.replyTo ? [`Pagalba: ${message.replyTo}`] : []), `Pranešimo identifikatorius: ${message.id}`].join('\n\n');
  const response = await fetcher(`https://api.mail.hostinger.com/api/v1/mailboxes/${config.mailboxResourceId}/send`, {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(12000),
    headers: {Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({to: [message.to], displayName, subject: message.subject, text}),
  });
  if (response.status !== 204) throw Error('mail_api_not_accepted');
  // This is our acceptance reference, not an invented provider ID or INBOX claim.
  return {reference: `hostinger-api-accepted:${message.id}`};
}
