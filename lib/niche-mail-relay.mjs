// Explicit HTTPS transport for platforms that cannot reach the SMTP host.
// A failed/unknown acknowledgement never falls back to another transport.
export async function sendNicheMailRelay(env, mail, fetcher = fetch) {
  const base = new URL(env.LEAD_MAIL_RELAY_URL);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || !/^\/v1\/[a-zA-Z0-9_-]{1,100}$/.test(base.pathname)) throw Error('Invalid mail relay configuration');
  if (!/^[A-Za-z0-9_-]{43}$/.test(env.LEAD_MAIL_RELAY_TOKEN || '') || !/^[a-zA-Z0-9-]{1,220}$/.test(mail.id)) throw Error('Invalid mail relay configuration');
  const sender = env.LEAD_MAIL_RELAY_SENDER;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(sender || '')) throw Error('Invalid mail relay sender');
  const storeId = base.pathname.split('/').at(-1);
  const body = {schemaVersion:1,environment:'production',storeId,id:mail.id,messageId:`<${mail.id}@${sender.split('@')[1]}>`,from:sender,to:mail.to,replyTo:mail.replyTo,subject:mail.subject,text:mail.text};
  const response = await fetcher(`${base.href}/messages/${mail.id}`, {method:'POST',redirect:'manual',headers:{authorization:`Bearer ${env.LEAD_MAIL_RELAY_TOKEN}`,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('Mail relay unavailable');
  const result = await response.json();
  if (result.id !== mail.id || result.storeId !== storeId || result.environment !== 'production' || result.from !== sender || result.to !== mail.to || result.status !== 'accepted' || result.reference !== `smtp-accepted:${body.messageId}`) throw Error('Mail relay acceptance unknown');
  return true;
}
