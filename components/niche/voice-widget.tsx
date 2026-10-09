"use client";
import { useEffect, useRef, useState } from "react";
import type { Room } from "livekit-client";
import { waitForVoiceAgent } from "@/lib/voice-connection";
import { chatExpiry, clearChat, readChat, saveChat, type ChatLine } from "@/lib/chat-session";
import s from "./voice-widget.module.css";

type Session = { conversation_id: string; session_token: string; livekit_url?: string; room_token?: string };
type UI = { id: string; state: string };

class ConversationRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function parseUI(value: unknown): UI | null {
  if (!value || typeof value !== "object" || !("id" in value) || !("state" in value)
    || typeof value.id !== "string" || typeof value.state !== "string") return null;
  return { id: value.id, state: value.state };
}

function parseSession(value: Record<string, unknown>): Session {
  const { conversation_id, session_token, livekit_url, room_token } = value;
  if ([conversation_id, session_token, livekit_url, room_token].some(v => typeof v !== "string")) {
    throw new Error("Nepavyko paruošti balso sesijos.");
  }
  if (typeof conversation_id !== "string" || typeof session_token !== "string"
    || typeof livekit_url !== "string" || typeof room_token !== "string") throw new Error("Neteisinga sesija.");
  return { conversation_id, session_token, livekit_url, room_token };
}

export function VoiceWidget({ title = "Padangų AI konsultantas", chatAvailable = false, voiceAvailable = true }: { title?: string; chatAvailable?: boolean; voiceAvailable?: boolean } = {}) {
  const [open, setOpen] = useState(false), [state, setState] = useState("ready");
  const [contactOpen, setContactOpen] = useState(false), [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""), [contactChannel, setContactChannel] = useState<"email" | "phone">("email");
  const [message, setMessage] = useState(""), [muted, setMuted] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [chatFailed, setChatFailed] = useState(false);
  const [ui, setUI] = useState<UI | null>(null), [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [remember, setRemember] = useState(false), [recognized, setRecognized] = useState(false);
  const [channel, setChannel] = useState<"voice" | "chat">("chat"), [text, setText] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([]);
  const expiresAt = useRef(0);
  const pendingMessage = useRef<{ id: string; text: string } | null>(null);
  const chatLog = useRef<HTMLDivElement>(null);
  const room = useRef<Room | null>(null), session = useRef<Session | null>(null);
  const input = useRef<HTMLInputElement>(null), shown = useRef(new Set<string>());
  const audioElements = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const startRequest = useRef<string | null>(null);
  const memoryChoiceTouched = useRef(false);
  const contactRevisions = useRef<Partial<Record<"email" | "phone", number>>>({});
  const launcher = useRef<HTMLButtonElement>(null), closer = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const sdk = useRef<Promise<typeof import("livekit-client")> | null>(null);

  async function request(action: string, body: Record<string, unknown> = {}, method = "POST") {
    const active = session.current;
    const query = method === "GET" && action === "busena" ? `?conversation_id=${active?.conversation_id}` : "";
    const response = await fetch(`/pokalbis/${action}${query}`, { method,
      headers: { "Content-Type": "application/json", "x-voice-session": active?.session_token || "" },
      ...(method === "POST" ? { body: JSON.stringify({ ...body, conversation_id: active?.conversation_id }) } : {}) });
    if (!response.ok) {
      console.warn(JSON.stringify({ event: "conversation_request_failed", action, status: response.status }));
      throw new ConversationRequestError("Paslauga laikinai nepasiekiama. Pateikite užklausą įprasta forma.", response.status);
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Neteisingas serverio atsakymas.");
    return data as Record<string, unknown>;
  }

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; void room.current?.disconnect(); }; }, []);
  useEffect(() => {
    if (!chatAvailable) return;
    let cancelled = false;
    let checkpoint;
    try { checkpoint = readChat(window.sessionStorage, window.location.host); } catch { return; }
    if (!checkpoint) return;
    const saved = checkpoint;
    session.current = saved.session;
    setBusy(true); setState("connecting"); setOpen(saved.open);
    void request("busena", {}, "GET").then(result => {
      if (cancelled) return;
      if (!["created", "active"].includes(String(result.state))) {
        clearChat(window.sessionStorage, window.location.host); session.current = null; setState("ready"); return;
      }
      expiresAt.current = saved.expiresAt;
      contactRevisions.current = saved.contactRevisions;
      if (Array.isArray(result.contacts)) for (const contact of result.contacts) {
        if (contact && (contact.channel === "email" || contact.channel === "phone") && Number.isInteger(contact.revision)) {
          contactRevisions.current[contact.channel as "email" | "phone"] = contact.revision;
        }
      }
      pendingMessage.current = saved.pending;
      setLines(saved.lines); setText(saved.pending?.text || ""); setHasSession(true); setChannel("chat"); setState("active");
      const nextUI = parseUI(result.ui);
      if (nextUI?.state === "requested") { setUI(nextUI); setContactOpen(true); }
    }).catch(error => {
      if (cancelled) return;
      session.current = null; setState("ready");
      if (error instanceof ConversationRequestError && [401, 403, 404, 409, 410].includes(error.status)) clearChat(window.sessionStorage, window.location.host);
      setMessage("Pokalbio tęsti nepavyko. Galite pradėti naują pokalbį arba pateikti užklausą forma.");
    }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [chatAvailable]);

  useEffect(() => {
    if (channel !== "chat" || state !== "active" || !session.current || !expiresAt.current) return;
    try { saveChat(window.sessionStorage, window.location.host, { version: 1, expiresAt: expiresAt.current,
      session: session.current, open, lines, pending: pendingMessage.current, contactRevisions: contactRevisions.current }); } catch { /* Storage optional. */ }
  }, [channel, state, open, lines, busy, message]);
  useEffect(() => {
    if (open) {
      closer.current?.focus();
    }
    else if (wasOpen.current) launcher.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => { chatLog.current?.scrollTo({ top: chatLog.current.scrollHeight }); }, [lines]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void request("atmintis", {}, "GET").then(result => {
      if (!cancelled) { setRecognized(result.remembered === true);
        if (!memoryChoiceTouched.current) setRemember(result.remembered === true); }
    }).catch(() => { /* Optional memory does not block calling. */ });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!session.current || !["active", "ended"].includes(state)) return;
    const timer = setInterval(() => { const expected = session.current?.conversation_id;
      void request("busena", {}, "GET").then(result => {
      if (!mounted.current || expected !== session.current?.conversation_id) return;
      const nextUI = parseUI(result.ui);
      if (Array.isArray(result.contacts)) for (const contact of result.contacts) {
        if (contact && (contact.channel === "email" || contact.channel === "phone") && Number.isInteger(contact.revision)) {
          const channel = contact.channel as "email" | "phone";
          contactRevisions.current[channel] = Math.max(contactRevisions.current[channel] || 0, contact.revision);
        }
      }
      if (nextUI?.state === "requested") { setUI(nextUI); setContactOpen(true); }
      if (result.state === "finalized" && state === "active") { void room.current?.disconnect();
        if (channel === "chat") try { clearChat(window.sessionStorage, window.location.host); } catch { /* Storage optional. */ }
        setState("ended"); setContactOpen(Object.keys(contactRevisions.current).length === 0); }
    }).catch(() => setMessage("Ryšio būsena laikinai nepasiekiama.")); }, state === "active" ? 750 : 3000);
    return () => clearInterval(timer);
  // Session is held privately in a ref; state owns this poller's lifecycle.
  }, [state, channel]);

  useEffect(() => {
    if (state !== "active") return;
    const timer = setInterval(() => { void request("zinios").catch(() => {
      setMessage("Informacijos atnaujinimas laikinai neprieinamas.");
    }); }, 60000);
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (!contactOpen) return;
    input.current?.focus();
    if (ui && !shown.current.has(ui.id)) {
      void request("ui", { request_id: ui.id, state: "shown" }).then(() => shown.current.add(ui.id)).catch(() => {});
    }
  }, [contactOpen, ui]);

  async function start() {
    if (busy) return;
    setChannel("voice"); setBusy(true); setState("connecting"); setMessage("");
    let microphone: MediaStream | null = null;
    let starting = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Balso pokalbiui reikia saugaus HTTPS ryšio ir naršyklės su mikrofono palaikymu.");
      // Obtain permission before allocating a provider session or dispatching an agent.
      microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      sdk.current ||= import("livekit-client");
      const { Room, RoomEvent, Track, LocalAudioTrack } = await sdk.current;
      const nextRoom = new Room(); room.current = nextRoom;
      nextRoom.on(RoomEvent.AudioPlaybackStatusChanged, () => setSoundBlocked(!nextRoom.canPlaybackAudio));
      nextRoom.on(RoomEvent.TrackSubscribed, track => { if (track.kind === Track.Kind.Audio) audioElements.current?.appendChild(track.attach()); });
      nextRoom.on(RoomEvent.TrackUnsubscribed, track => track.detach().forEach(element => element.remove()));
      nextRoom.on(RoomEvent.Disconnected, () => { if (!starting && mounted.current && room.current === nextRoom) {
        setState("ended"); setContactOpen(Object.keys(contactRevisions.current).length === 0);
        if (session.current) void request("baigti").catch(() => {});
      } });
      await nextRoom.startAudio();
      startRequest.current ||= crypto.randomUUID();
      const created = parseSession(await request("sesija", { consent: true, remember, request_id: startRequest.current }));
      session.current = created;
      if (remember) setRecognized(true);
      setHasSession(true);
      await nextRoom.connect(created.livekit_url!, created.room_token!);
      await waitForVoiceAgent(nextRoom, RoomEvent);
      await nextRoom.localParticipant.publishTrack(new LocalAudioTrack(microphone.getAudioTracks()[0]), { source: Track.Source.Microphone });
      microphone = null; // The room now owns this track and releases it on disconnect.
      setMuted(false);
      setState("active");
    } catch (error) {
      if (session.current) { try { await request("baigti"); } catch { /* expiry reaper closes the slot */ } }
      await room.current?.disconnect();
      setState("failed"); setMessage(error instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(error.name)
        ? "Leiskite naršyklei naudoti mikrofoną ir bandykite dar kartą."
        : error instanceof DOMException && error.name === "NotFoundError" ? "Mikrofonas nerastas. Prijunkite jį ir bandykite dar kartą."
        : error instanceof Error ? error.message : "Nepavyko prisijungti.");
    } finally { starting = false; microphone?.getTracks().forEach(track => track.stop()); setBusy(false); }
  }

  async function startChat() {
    if (busy) return;
    setChannel("chat"); setBusy(true); setState("connecting"); setMessage("");
    try {
      startRequest.current ||= crypto.randomUUID();
      const created = await request("sesija", { consent: true, remember, mode: "chat", request_id: startRequest.current });
      if (typeof created.conversation_id !== "string" || typeof created.session_token !== "string") throw new Error("Nepavyko pradėti pokalbio.");
      session.current = { conversation_id: created.conversation_id, session_token: created.session_token };
      expiresAt.current = chatExpiry();
      setHasSession(true); setState("active"); if (remember) setRecognized(true);
      setLines([{ id: "welcome", speaker: "agent", text: "Sveiki, esu virtualus AI konsultantas. Aprašykite savo poreikį arba užduokite klausimą." }]);
    } catch (error) { setState("failed"); setMessage(error instanceof Error ? error.message : "Nepavyko pradėti pokalbio."); }
    finally { setBusy(false); }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !text.trim()) return;
    const pending = pendingMessage.current || { id: crypto.randomUUID(), text: text.trim() };
    pendingMessage.current = pending;
    setBusy(true); setMessage("");
    setLines(old => old.some(x => x.id === pending.id) ? old : [...old, { id: pending.id, speaker: "client", text: pending.text }]);
    try {
      const receipt = await request("zinute", { request_id: pending.id, text: pending.text });
      if (typeof receipt.reply !== "string") throw new Error("Atsakymas nepasiekiamas.");
      setLines(old => [...old, { id: `reply-${pending.id}`, speaker: "agent", text: receipt.reply as string }]);
      const nextUI = parseUI(receipt.ui);
      if (nextUI?.state === "requested") { setUI(nextUI); setContactOpen(true); }
      pendingMessage.current = null; setText(""); setChatFailed(false);
    } catch (error) {
      const rejected = error instanceof ConversationRequestError;
      setChatFailed(rejected);
      setMessage(rejected ? "Atsakymo gauti nepavyko. Pradėkite naują pokalbį arba pateikite užklausą forma."
        : "Ryšys nutrūko. Galite dar kartą išsiųsti tą pačią žinutę.");
    }
    finally { setBusy(false); }
  }

  async function end() {
    setBusy(true);
    try { if (session.current) await request("baigti"); }
    catch { setMessage("Pokalbio pabaigą serveris sutikrins atkūręs ryšį."); }
    if (channel === "chat") try { clearChat(window.sessionStorage, window.location.host); } catch { /* Storage optional. */ }
    expiresAt.current = 0;
    await room.current?.disconnect(); setState("ended"); setContactOpen(Object.keys(contactRevisions.current).length === 0); setBusy(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try { const receipt = await request("kontaktas", { channel: contactChannel, value: contactChannel === "email" ? email : phone,
      consent: true, base_revision: contactRevisions.current[contactChannel] });
      if (typeof receipt.revision === "number") contactRevisions.current[contactChannel] = receipt.revision;
      setMessage(contactChannel === "email" ? "El. paštas išsaugotas. Atsakymo pristatymas dar tikrinamas."
        : "Telefono numeris išsaugotas."); setContactOpen(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kontakto išsaugoti nepavyko."); }
    finally { setBusy(false); }
  }

  function resetCall() {
    try { clearChat(window.sessionStorage, window.location.host); } catch { /* Storage optional. */ }
    expiresAt.current = 0;
    session.current = null; startRequest.current = null; room.current = null;
    contactRevisions.current = {};
    pendingMessage.current = null; setLines([]); setText(""); setChatFailed(false);
    setHasSession(false); setUI(null); setContactOpen(false); setState("ready"); setMessage("");
  }

  async function forget() {
    setBusy(true);
    try { await request("pamirsti"); setRecognized(false); setRemember(false);
      setMessage("Šios naršyklės atmintis išjungta.");
    } catch { setMessage("Atminties išjungti nepavyko. Bandykite dar kartą."); }
    finally { setBusy(false); }
  }

  if (!open) return <button ref={launcher} className={s.launch} onClick={() => setOpen(true)}>Kalbėtis su AI konsultantu</button>;
  return <aside className={s.panel} aria-label="AI konsultantas" onKeyDown={event => {
    if (event.key === "Escape" && (channel === "chat" || !["active", "connecting"].includes(state))) setOpen(false);
  }}>
    <div ref={audioElements} hidden />
    <div className={s.heading}><strong>{title}</strong><button ref={closer} aria-label="Uždaryti" disabled={channel === "voice" && (state === "active" || state === "connecting")} onClick={() => setOpen(false)}>×</button></div>
    <p>Bendrausite su virtualiu AI. Pokalbio tekstą naudosime jūsų užklausai ir kokybės peržiūrai. <a href="/privatumas">Privatumas</a></p>
    {chatAvailable && <p>Pokalbį šiame skirtuke galite tęsti pereidami į kitą svetainės puslapį iki 30 minučių. Ilgesnė atmintis pasirenkama atskirai.</p>}
    <p role="status">{state === "active" ? "Pokalbis vyksta" : state === "connecting" ? "Jungiamasi…" : state === "ended" ? "Pokalbis baigtas" : "Pokalbis nepradėtas"}</p>
    {state === "ready" && <>
      <label className={s.memoryChoice}><input type="checkbox" checked={remember} disabled={busy} onChange={e => {
        memoryChoiceTouched.current = true; setRemember(e.target.checked);
        if (!e.target.checked && recognized) void forget();
      }} />Prisiminti pokalbius šioje naršyklėje 30 dienų</label>
      {recognized && <p className={s.memoryNote}>Galime tęsti ankstesnį pokalbį. <button onClick={() => void forget()} disabled={busy}>Pamiršti šį įrenginį</button></p>}
    </>}
    {state === "ready" && <div className={s.actions}>
      {chatAvailable && <button onClick={() => void startChat()} disabled={busy}>Sutinku ir rašau</button>}
      {voiceAvailable && <button onClick={() => void start()} disabled={busy}>{recognized ? "Sutinku ir tęsiu balso pokalbį" : "Sutinku ir skambinu"}</button>}
    </div>}
    {lines.length > 0 && <div ref={chatLog} className={s.chatLog} role="log" aria-label="Pokalbio žinutės" aria-live="polite" aria-relevant="additions">
      {lines.map(line => <p key={line.id} className={line.speaker === "client" ? s.clientLine : s.agentLine}><strong>{line.speaker === "client" ? "Jūs" : "AI konsultantas"}</strong><span>{line.text}</span></p>)}
    </div>}
    {state === "active" && channel === "chat" && <form className={s.composer} onSubmit={sendMessage} aria-label="Parašyti konsultantui">
      <label htmlFor="chat-message">Jūsų žinutė</label>
      <textarea id="chat-message" value={text} maxLength={1800} disabled={busy || chatFailed} rows={3} onChange={e => setText(e.target.value)} placeholder="Aprašykite dokumentą, darbo vietas ar užduokite klausimą…" />
      <button type="submit" disabled={busy || chatFailed || !text.trim()}>{busy ? "Konsultantas atsako…" : "Siųsti žinutę"}</button>
    </form>}
    {state === "active" && <div className={s.actions}>
      {channel === "voice" && soundBlocked && <button onClick={() => void room.current?.startAudio()}>Įjungti garsą</button>}
      {channel === "voice" && <button onClick={() => { void room.current?.localParticipant.setMicrophoneEnabled(muted); setMuted(!muted); }}>{muted ? "Įjungti mikrofoną" : "Nutildyti"}</button>}
      <button onClick={() => setContactOpen(true)}>Palikti kontaktą</button><button onClick={() => void end()} disabled={busy}>Baigti</button>
    </div>}
    {state === "ended" && hasSession && !contactOpen && <button onClick={() => setContactOpen(true)}>Palikti kontaktą</button>}
    {state === "ended" && <button onClick={resetCall} disabled={busy}>Naujas pokalbis</button>}
    {contactOpen && hasSession && <form onSubmit={submit} aria-label="Kontaktas prašytam atsakymui">
      <label htmlFor="voice-channel">Kokį kontaktą norite palikti?</label>
      <select id="voice-channel" value={contactChannel} onChange={e => setContactChannel(e.target.value === "phone" ? "phone" : "email")}>
        <option value="email">El. paštą atsakymui</option><option value="phone">Telefono numerį</option>
      </select>
      <label htmlFor="voice-contact">{contactChannel === "email" ? "El. paštas atsakymui" : "Telefono numeris"}</label>
      <input ref={input} id="voice-contact" type={contactChannel === "email" ? "email" : "tel"}
        autoComplete={contactChannel === "email" ? "email" : "tel"} maxLength={contactChannel === "email" ? 254 : 25}
        required value={contactChannel === "email" ? email : phone} onChange={e => contactChannel === "email" ? setEmail(e.target.value) : setPhone(e.target.value)} />
      <p>Naudosime tik šio pokalbio užklausai. El. paštą naudosime prašytam atsakymui. Paliktas telefono numeris nesukuria automatinio skambučio ar SMS.</p>
      <button disabled={busy} type="submit">Išsaugoti kontaktą</button>
      <button type="button" onClick={() => { setContactOpen(false); if (ui) void request("ui", { request_id: ui.id, state: "dismissed" }).catch(() => {}); }}>Praleisti</button>
    </form>}
    {message && <p role="status">{message}</p>}
    {chatFailed && state === "active" && channel === "chat" && <button disabled={busy} onClick={() => { void end().then(resetCall); }}>Pradėti naują pokalbį</button>}
    {state === "failed" && <div className={s.actions}>
      <button onClick={resetCall}>Bandyti dar kartą</button>
      <a href="/kontaktai">Pateikti užklausą forma</a>
    </div>}
  </aside>;
}
