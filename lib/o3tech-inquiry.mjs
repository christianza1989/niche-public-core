// Keep the site's existing phone/contact preference inside the shared durable
// lead message, without introducing another storage or mail implementation.
export function o3techInquiryMessage(form){
 const message=String(form.get('message')||'').trim();
 const phone=String(form.get('phone')||'').trim();
 const method=String(form.get('contact_method')||'').trim();
 if(message.length<20||message.length>2800||(method==='Telefonu'&&!phone))return '';
 if(phone.length>80||/[\r\n]/.test(phone)||!['','-Pasirinkite-','Telefonu','El. paštu'].includes(method))return '';
 const suffix=[...(phone?['Telefono nr.: '+phone]:[]),...(['Telefonu','El. paštu'].includes(method)?[method]:[])];
 return message+(suffix.length?'\n\n'+suffix.join('\n'):'');
}
