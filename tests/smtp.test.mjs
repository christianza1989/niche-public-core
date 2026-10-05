import test from 'node:test';
import assert from 'node:assert/strict';
import { smtpMessage, smtpSession } from '../lib/smtp-protocol.mjs';
test('SMTP header injection is rejected; Lithuanian message uses MIME UTF-8', () => {
  const mail = { from: 'info@pinet.lt', to: 'info@pinet.lt', replyTo: 'qa@example.invalid', subject: '[traktoriupadangos.lt] Užklausa', text: 'Žinutė apie padangas.\r\n.fake command', id: 'test-123' };
  const result = smtpMessage(mail);
  assert.match(result, /Reply-To: <qa@example.invalid>/); assert.match(result, /Content-Transfer-Encoding: base64/);
  assert.equal(Buffer.from(result.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString(), mail.text);
  assert.throws(() => smtpMessage({ ...mail, subject: 'bad\r\nBcc: bad@example.invalid' }));
  assert.throws(() => smtpMessage({ ...mail, to: 'bad@example.invalid\r\nDATA' }));
});
test('fragmented multiline replies and confirmed acceptance work without exposing credentials', async () => {
  let receiver; let closed = false; const commands = [];
  const readable = new ReadableStream({ start(controller) { receiver = controller; controller.enqueue(new TextEncoder().encode('220 SMTP ready\r\n')); } });
  const responses = ['250-first\r\n250 AUTH LOGIN\r\n', '334 username\r\n', '334 password\r\n', '235 accepted\r\n', '250 sender\r\n', '250 recipient\r\n', '354 data\r\n', '250 queued\r\n', '221 bye\r\n'];
  const writable = new WritableStream({ write(data) { commands.push(new TextDecoder().decode(data)); const reply = responses.shift(); receiver.enqueue(new TextEncoder().encode(reply.slice(0, 5))); receiver.enqueue(new TextEncoder().encode(reply.slice(5))); } });
  await smtpSession({ readable, writable, close: async () => { closed = true; receiver.close(); } }, { user: 'info@pinet.lt', password: 'fake-secret', timeoutMs: 1000 }, { to: 'info@pinet.lt', replyTo: 'qa@example.invalid', subject: 'Bandymas', text: 'Tik testas', id: 'qa-test' });
  assert.equal(closed, true); assert.equal(commands.length, 9); assert.match(commands[7], /Message-ID: <qa-test@pinet.lt>/);
});
test('SMTP refusal retains a generic error and closes the socket', async () => {
  let closed = false;
  const readable = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('535 password details must stay private\r\n')); } });
  await assert.rejects(smtpSession({ readable, writable: new WritableStream(), close: async () => { closed = true; } }, { user: 'info@pinet.lt', password: 'secret' }), /SMTP request rejected/);
  assert.equal(closed, true);
});
