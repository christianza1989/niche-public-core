// Optional first-party provider adapter. The SMTP transport remains available.
export async function sendHostingerMail(env,message,fetcher=fetch){
 if(!env.HOSTINGER_MAIL_API_KEY||!env.HOSTINGER_MAILBOX_ID)return false;
 if(!/^[A-Za-z0-9]+$/.test(env.HOSTINGER_MAILBOX_ID))throw Error('Invalid mailbox configuration');
 const result=await fetcher(`https://api.mail.hostinger.com/api/v1/mailboxes/${env.HOSTINGER_MAILBOX_ID}/send`,{method:'POST',headers:{Authorization:`Bearer ${env.HOSTINGER_MAIL_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({to:[message.to],displayName:message.displayName||'MB Pinet',subject:message.subject,text:message.text}),signal:AbortSignal.timeout(12000)});
 if(!result.ok)throw Error('Mail provider did not accept the message');
 return true;
}
