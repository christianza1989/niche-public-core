"use client";
import { useEffect, useRef, useState } from "react";
import type { Room } from "livekit-client";
import s from "./voice-widget.module.css";

type Session = { conversation_id: string; session_token: string; livekit_url: string; room_token: string };
type UI = { id: string; state: string };

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

export function VoiceWidget() {
  const [open, setOpen] = useState(false), [state, setState] = useState("ready");
  const [contactOpen, setContactOpen] = useState(false), [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""), [contactChannel, setContactChannel] = useState<"email" | "phone">("email");
  const [message, setMessage] = useState(""), [muted, setMuted] = useState(false);
  const [ui, setUI] = useState<UI | null>(null), [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [remember, setRemember] = useState(false), [recognized, setRecognized] = useState(false);
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
    if (!response.ok) throw new Error("Paslauga laikinai nepasiekiama. Pateikite užklausą įprasta forma.");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Neteisingas serverio atsakymas.");
    return data as Record<string, unknown>;
  }

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; void room.current?.disconnect(); }; }, []);
  useEffect(() => {
    if (open) {
      closer.current?.focus();
      sdk.current ||= import("livekit-client");
      void sdk.current.catch(() => { sdk.current = null; });
    }
    else if (wasOpen.current) launcher.current?.focus();
    wasOpen.current = open;
  }, [open]);

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
      if (result.state === "finalized" && state === "active") { void room.current?.disconnect(); setState("ended"); setContactOpen(true); }
    }).catch(() => setMessage("Ryšio būsena laikinai nepasiekiama.")); }, state === "active" ? 750 : 3000);
    return () => clearInterval(timer);
  // Session is held privately in a ref; state owns this poller's lifecycle.
  }, [state]);

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
    setBusy(true); setState("connecting"); setMessage("");
    try {
      sdk.current ||= import("livekit-client");
      const { Room, RoomEvent, Track } = await sdk.current;
      const nextRoom = new Room(); room.current = nextRoom;
      nextRoom.on(RoomEvent.TrackSubscribed, track => { if (track.kind === Track.Kind.Audio) audioElements.current?.appendChild(track.attach()); });
      nextRoom.on(RoomEvent.TrackUnsubscribed, track => track.detach().forEach(element => element.remove()));
      nextRoom.on(RoomEvent.Disconnected, () => { if (mounted.current && room.current === nextRoom) {
        setState("ended"); setContactOpen(true);
        if (session.current) void request("baigti").catch(() => {});
      } });
      await nextRoom.startAudio();
      startRequest.current ||= crypto.randomUUID();
      const created = parseSession(await request("sesija", { consent: true, remember, request_id: startRequest.current }));
      session.current = created;
      if (remember) setRecognized(true);
      setHasSession(true);
      await nextRoom.connect(created.livekit_url, created.room_token);
      await nextRoom.localParticipant.setMicrophoneEnabled(true);
      setState("active");
    } catch (error) {
      if (session.current) { try { await request("baigti"); } catch { /* expiry reaper closes the slot */ } }
      await room.current?.disconnect();
      setState("failed"); setMessage(error instanceof Error ? error.message : "Nepavyko prisijungti.");
    } finally { setBusy(false); }
  }

  async function end() {
    setBusy(true);
    try { if (session.current) await request("baigti"); }
    catch { setMessage("Pokalbio pabaigą serveris sutikrins atkūręs ryšį."); }
    await room.current?.disconnect(); setState("ended"); setContactOpen(true); setBusy(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try { const receipt = await request("kontaktas", { channel: contactChannel, value: contactChannel === "email" ? email : phone,
      consent: true, base_revision: contactRevisions.current[contactChannel] });
      if (typeof receipt.revision === "number") contactRevisions.current[contactChannel] = receipt.revision;
      setMessage(contactChannel === "email" ? "El. paštas išsaugotas. Atsakymo pristatymas dar tikrinamas."
        : "Telefono numeris išsaugotas. Automatinis atsakymas telefonu dar neprieinamas; atsakymui galite palikti el. paštą."); setContactOpen(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kontakto išsaugoti nepavyko."); }
    finally { setBusy(false); }
  }

  function resetCall() {
    session.current = null; startRequest.current = null; room.current = null;
    contactRevisions.current = {};
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
    if (event.key === "Escape" && !["active", "connecting"].includes(state)) setOpen(false);
  }}>
    <div ref={audioElements} hidden />
    <div className={s.heading}><strong>Padangų AI konsultantas</strong><button ref={closer} aria-label="Uždaryti" disabled={state === "active" || state === "connecting"} onClick={() => setOpen(false)}>×</button></div>
    <p>Kalbėsite su virtualiu AI. Pokalbio tekstą naudosime jūsų užklausai ir kokybės peržiūrai. <a href="/privatumas">Privatumas</a></p>
    <p role="status">{state === "active" ? "Pokalbis vyksta" : state === "connecting" ? "Jungiamasi…" : state === "ended" ? "Pokalbis baigtas" : "Pokalbis nepradėtas"}</p>
    {state === "ready" && <>
      <label className={s.memoryChoice}><input type="checkbox" checked={remember} disabled={busy} onChange={e => {
        memoryChoiceTouched.current = true; setRemember(e.target.checked);
        if (!e.target.checked && recognized) void forget();
      }} />Prisiminti pokalbius šioje naršyklėje 30 dienų</label>
      {recognized && <p className={s.memoryNote}>Galime tęsti ankstesnį pokalbį. <button onClick={() => void forget()} disabled={busy}>Pamiršti šį įrenginį</button></p>}
    </>}
    {state === "ready" && <button onClick={() => void start()} disabled={busy}>{recognized ? "Sutinku ir tęsiu pokalbį" : "Sutinku ir pradedu pokalbį"}</button>}
    {state === "active" && <div className={s.actions}>
      <button onClick={() => { void room.current?.localParticipant.setMicrophoneEnabled(muted); setMuted(!muted); }}>{muted ? "Įjungti mikrofoną" : "Nutildyti"}</button>
      <button onClick={() => setContactOpen(true)}>Palikti kontaktą</button><button onClick={() => void end()} disabled={busy}>Baigti</button>
    </div>}
    {state === "ended" && hasSession && !contactOpen && <button onClick={() => setContactOpen(true)}>Palikti kontaktą</button>}
    {state === "ended" && <button onClick={() => { resetCall(); void start(); }} disabled={busy}>Perskambinti</button>}
    {contactOpen && hasSession && <form onSubmit={submit} aria-label="Kontaktas prašytam atsakymui">
      <label htmlFor="voice-channel">Kokį kontaktą norite palikti?</label>
      <select id="voice-channel" value={contactChannel} onChange={e => setContactChannel(e.target.value === "phone" ? "phone" : "email")}>
        <option value="email">El. paštą atsakymui</option><option value="phone">Telefono numerį</option>
      </select>
      <label htmlFor="voice-contact">{contactChannel === "email" ? "El. paštas atsakymui" : "Telefono numeris"}</label>
      <input ref={input} id="voice-contact" type={contactChannel === "email" ? "email" : "tel"}
        autoComplete={contactChannel === "email" ? "email" : "tel"} maxLength={contactChannel === "email" ? 254 : 25}
        required value={contactChannel === "email" ? email : phone} onChange={e => contactChannel === "email" ? setEmail(e.target.value) : setPhone(e.target.value)} />
      <p>Naudosime tik šio pokalbio užklausai. Automatinį atsakymą šiuo metu galime pateikti el. paštu; tęsinys telefonu dar neprieinamas.</p>
      <button disabled={busy} type="submit">Išsaugoti kontaktą</button>
      <button type="button" onClick={() => { setContactOpen(false); if (ui) void request("ui", { request_id: ui.id, state: "dismissed" }).catch(() => {}); }}>Praleisti</button>
    </form>}
    {message && <p role="status">{message}</p>}
    {state === "failed" && <div className={s.actions}>
      <button onClick={resetCall}>Bandyti dar kartą</button>
      <a href="/kontaktai">Pateikti užklausą forma</a>
    </div>}
  </aside>;
}
