// This optional form contract never changes the legacy email-only forms.
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function contactMethodFields(form){
 const method=String(form.get('contact_method')||'');
 const phone=String(form.get('phone')||'').trim();
 const email=String(form.get('email')||'').trim();
 const name=String(form.get('name')||'').trim();
 const message=String(form.get('message')||'').trim();
 const digits=phone.replace(/\D/g,'');
 const phoneValid=/^\+?[\d ()-]+$/.test(phone)&&digits.length>=7&&digits.length<=15&&phone.length<=40;
 if(!['phone','email'].includes(method)||name.length<2||name.length>100||message.length>3000||email.length>250||
    (email!==''&&!emailPattern.test(email))||(phone!==''&&!phoneValid)||
    (method==='phone'&&!phoneValid)||(method==='email'&&!emailPattern.test(email))||form.get('consent')!=='yes')return null;
 return {name,email,phone,method,
  // Preserve the existing durable schema. Optional contact data is retained
  // with the message, not fabricated into an email address or customer name.
  storedMessage:[`Pageidaujamas atsakymas: ${method==='phone'?'telefonu':'el. paštu'}`,phone?`Telefonas: ${phone}`:'',message].filter(Boolean).join('\n\n')};
}
