// Implicit-TLS SMTP for Worker sockets and the local verifier. Errors omit private data.
const address = value => {
  if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value || '')) throw new Error('SMTP invalid address');
  return value;
};
export function utf8Base64(value) {
  let binary = '';
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function smtpMessage({ from, to, replyTo, subject, text, id }) {
  address(from); address(to); if (replyTo) address(replyTo);
  if (/[\r\n]/.test(subject) || !/^[a-z0-9-]+$/i.test(id)) throw new Error('SMTP invalid header');
  return [`From: MB Pinet <${from}>`, `To: <${to}>`, ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
    `Subject: =?UTF-8?B?${utf8Base64(subject)}?=`, `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${id}@${from.split('@')[1]}>`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64', '', utf8Base64(text).match(/.{1,76}/g)?.join('\r\n') || '', ''].join('\r\n');
}
export async function smtpSession(socket, config, message) {
  const reader = socket.readable.getReader(); const writer = socket.writable.getWriter();
  const decoder = new TextDecoder(); let pending = ''; let timer;
  const protocol = async () => {
    const response = async expected => {
      for (let count = 0; count < 150; count++) {
        while (!pending.includes('\r\n')) {
          const chunk = await reader.read(); if (chunk.done) throw new Error('SMTP disconnected');
          pending += decoder.decode(chunk.value, { stream: true });
          if (pending.length > 65536) throw new Error('SMTP response too large');
        }
        const position = pending.indexOf('\r\n'); const line = pending.slice(0, position); pending = pending.slice(position + 2);
        if (!/^\d{3}[- ]/.test(line)) throw new Error('SMTP malformed response');
        if (line[3] === '-') continue;
        if (!expected.includes(Number(line.slice(0, 3)))) throw new Error('SMTP request rejected');
        return;
      }
      throw new Error('SMTP response too long');
    };
    const command = async (value, expected) => { await writer.write(new TextEncoder().encode(`${value}\r\n`)); await response(expected); };
    await response([220]); await command('EHLO pinet.lt', [250]); await command('AUTH LOGIN', [334]);
    await command(utf8Base64(config.user), [334]); await command(utf8Base64(config.password), [235]);
    if (message) {
      await command(`MAIL FROM:<${address(config.user)}>`, [250]); await command(`RCPT TO:<${address(message.to)}>`, [250, 251]);
      await command('DATA', [354]); await writer.write(new TextEncoder().encode(`${smtpMessage({ ...message, from: config.user })}\r\n.\r\n`));
      await response([250]);
    }
    // A QUIT failure after DATA acceptance must not cause a duplicate retry.
    try { await command('QUIT', [221]); } catch { /* already accepted */ }
  };
  try { await Promise.race([protocol(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('SMTP timeout')), config.timeoutMs || 12000); })]); }
  finally { clearTimeout(timer); await socket.close().catch(() => {}); }
}
