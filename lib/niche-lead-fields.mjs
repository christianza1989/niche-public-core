// Optional inquiry fields supplement the established name/email/message
// contract. Values are stored with the message, so no accepted field vanishes
// between a native form submission, D1 and the operator's email.
export function inquiryDetails(form) {
  const phone = String(form.get('phone') || '').trim();
  const preference = String(form.get('preference') || '').trim();
  if (phone.length > 50 || /[\r\n\x00-\x1f]/.test(phone) ||
      !['', '-Pasirinkite-', 'Telefonu', 'El. paštu'].includes(preference)) return null;
  if (preference === 'Telefonu' && !/[0-9]{3}/.test(phone.replace(/[ ()+.-]/g, ''))) return null;
  return { phone, preference: preference === '-Pasirinkite-' ? '' : preference };
}

export function inquiryMessage(message, details) {
  return [message, ...(details.phone ? [`Telefono nr.: ${details.phone}`] : []),
    ...(details.preference ? [`Susisiekti: ${details.preference}`] : [])].join('\n\n');
}

export function leadPagesReady(pkg, pages) {
  if (pkg.schemaVersion !== 2) return true;
  const contact = pkg.siteId === 'signaturepads' ? '' : 'kontaktai';
  const policy = pkg.siteId === 'signaturepads' ? 'musu-slapuku-politika' : 'privatumas';
  return pages.some(p => p.slug === contact && (contact !== '' || p.type === 'home')) &&
    pages.some(p => p.slug === policy && p.type === 'policy');
}
