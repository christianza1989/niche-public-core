// Keep the site's existing phone/contact preference inside the shared durable
// lead message, without introducing another storage or mail implementation.
export function o3techInquiryMessage(form){
 const message=String(form.get('message')||'').trim();
 const phone=String(form.get('phone')||'').trim();
 const method=String(form.get('contact_method')||'').trim();
 // Incumbent email-only inquiries permit an omitted name/message.
 // Null is invalid; empty string is a valid email-only inquiry.
 if(message.length>2800)return null;
 if(phone.length>80||/[\r\n]/.test(phone)||!['','-Pasirinkite-','Telefonu','El. paštu'].includes(method))return null;
 const suffix=[...(phone?['Telefono nr.: '+phone]:[]),...(['Telefonu','El. paštu'].includes(method)?[method]:[])];
 return message+(suffix.length?'\n\n'+suffix.join('\n'):'');
}
