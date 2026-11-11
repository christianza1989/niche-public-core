"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Native full-page navigation preserves the existing host-aware catalogue and fragment target. */

import { useEffect, useId, useState } from "react";
import s from "./promedical-site.module.css";
import { migrateInquiryItems } from "@/lib/promedical-inquiry-paths.mjs";

type Item = { sku: string; title: string; path: string; quantity: number };
const key = "promedical-request-v1";
const eventName = "promedical-request-change";
const noAliases: Record<string, string> = {};
function read(aliases = noAliases): Item[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    const valid: Item[] = Array.isArray(data) ? data.filter(v => v && typeof v.sku === "string" && v.sku.length<=100 && typeof v.title === "string" && v.title.length<=300 && /^\/produktai\/[a-z0-9-]+$/.test(v.path) && Number.isInteger(v.quantity) && v.quantity > 0 && v.quantity <= 999).slice(0, 20) : [];
    const items = migrateInquiryItems(valid, aliases);
    if (JSON.stringify(items) !== JSON.stringify(valid)) {
      try { localStorage.setItem(key, JSON.stringify(items)); window.dispatchEvent(new Event(eventName)); } catch { /* Keep the readable in-memory selection if storage is full/read-only. */ }
    }
    return items;
  } catch { return []; }
}
function write(items: Item[]) { localStorage.setItem(key, JSON.stringify(items)); window.dispatchEvent(new Event(eventName)); }
function useItems(aliases = noAliases) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { const update = () => setItems(read(aliases)); update(); window.addEventListener(eventName, update); window.addEventListener("storage", update); return () => { window.removeEventListener(eventName, update); window.removeEventListener("storage", update); }; }, [aliases]);
  return items;
}
export function InquiryCount() { const items = useItems(); return <span className={s.count} aria-label={`${items.length} produktų užklausos sąraše`}>{items.length}</span>; }
export function InquiryLink({ className }: { className?: string }) {
  const items = useItems();
  return <a href="/#uzklausa" className={className}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3h2l2.4 12h11.4l2-8H6M9 20h.01M18 20h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Krepšelis</span><span className={s.basketCount} aria-label={`${items.length} produktų užklausos sąraše`}>{items.length}</span></a>;
}
export function AddToInquiry({ sku, title, path, aliases = noAliases }: Omit<Item, "quantity"> & { aliases?: Record<string, string> }) {
  const items = useItems(aliases); const [quantity, setQuantity] = useState(1); const [notice, setNotice] = useState("");
  const present = items.some(v => v.path === path);
  function add() {
    const current = read(aliases); const found = current.find(v => v.path === path);
    if (!found && current.length >= 20) { setNotice("Sąraše galima pasirinkti iki 20 produktų. Didesnį poreikį aprašykite užklausoje."); return; }
    if (found) found.quantity = Math.min(999, found.quantity + quantity); else current.push({ sku, title, path, quantity });
    try { write(current); setNotice("Produktas įtrauktas. Kiekį galite keisti užklausos sąraše."); } catch { setNotice("Naršyklė neleidžia išsaugoti sąrašo. Nukopijuokite katalogo kodą į užklausą."); }
  }
  return <div className={s.addProduct}><div className={s.addRow}><label>Kiekis<input type="number" min="1" max="999" value={quantity} onChange={e => setQuantity(Math.min(999, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))} /></label><button className={s.primary} onClick={add}>{present ? "Pridėti kiekį į užklausą" : "Įtraukti į užklausą"}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8"/></svg></button></div><p className={s.notice} role="status">{notice}</p>{present && <a className={s.textLink} href="/kontaktai">Peržiūrėti užklausos sąrašą</a>}</div>;
}
export function InquiryForm({ email, aliases = noAliases }: { email: string; aliases?: Record<string, string> }) {
  const helpId = useId();
  const items = useItems(aliases); const [message, setMessage] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  function change(path: string, quantity: number) { try { write(read(aliases).map(v => v.path === path ? { ...v, quantity: Math.min(999, Math.max(1, Math.trunc(quantity) || 1)) } : v)); } catch { setStatus("Sąrašo išsaugoti nepavyko. Produktų kodus įrašykite į žinutę."); } }
  function remove(path: string) { try { write(read(aliases).filter(v => v.path !== path)); } catch { setStatus("Sąrašo išsaugoti nepavyko."); } }
  const selection = items.length ? "Pasirinkti produktai:\n" + items.map(v => `${v.sku} — ${v.quantity} vnt. — ${v.title}`).join("\n") + "\n\n" : "";
  const combined = selection + message;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget;
    if (combined.trim().length < 20 || combined.length > 3000) { setStatus("Pateikite 20–3000 ženklų užklausą, įskaitant pasirinktus produktus."); return; }
    setBusy(true); setStatus("");
    const body = new URLSearchParams(); new FormData(form).forEach((v, k) => body.append(k, String(v))); body.set("message", combined);
    try {
      const response = await fetch("/uzklausa", { method: "POST", body });
      const html = await response.text(); const parsed = new DOMParser().parseFromString(html, "text/html");
      setStatus(parsed.querySelector("main p")?.textContent || (response.ok ? "Užklausa išsaugota." : `Užklausos nepavyko priimti (${response.status}). Bandykite dar kartą arba rašykite el. paštu.`));
      if (response.ok && parsed.querySelector("main p")) { setSaved(true); }
    } catch { setStatus("Ryšys nutrūko. Duomenų išsaugojimo patvirtinimo negavome. Bandykite dar kartą arba rašykite el. paštu."); } finally { setBusy(false); }
  }
  return <div id="uzklausa" className={`${s.shell} ${s.inquiryForm}`}>
    {items.length > 0 && <section className={s.shortlist} aria-label="Pasirinkti produktai"><h2>Jūsų pasirinkti produktai</h2><p>Šis sąrašas saugomas šioje naršyklėje. Jis dar nėra užsakymas.</p>{items.map(v => <div className={s.shortlistRow} key={v.path}><div><a href={v.path}>{v.title}</a><span>{v.sku}</span></div><label><span className={s.srOnly}>{v.title}: {v.sku} kiekis</span><input type="number" min="1" max="999" value={v.quantity} onChange={e => change(v.path, Number(e.target.value))}/><span>vnt.</span></label><button type="button" className={s.remove} onClick={() => remove(v.path)} aria-label={`Pašalinti ${v.title} (${v.sku})`}>Pašalinti</button></div>)}</section>}
    <form action="/uzklausa" method="post" onSubmit={submit} className={s.form}>
      <h2>Pateikite poreikį</h2><div className={s.formGrid}><label>Kontaktinis asmuo<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label><label>El. paštas<input name="email" type="email" autoComplete="email" maxLength={250} required /></label></div>
      <label>Įstaiga, skyrius ir papildomi reikalavimai<textarea name="message" rows={6} value={message} onChange={e => setMessage(e.target.value)} maxLength={3000} minLength={items.length ? undefined : 20} required={!items.length} placeholder="Įstaigos pavadinimas, skyrius, įrangos paskirtis, norimi matmenys ar priedai, pageidaujamas terminas..." aria-describedby={helpId} /></label>
      <p id={helpId}>Pasirinkti produktai ir kiekiai bus pridėti prie žinutės. {combined.length}/3000 ženklų. Pacientų duomenų nepateikite.</p>
      <label className={s.consent}><input name="consent" type="checkbox" value="yes" required/>Sutinku, kad šie duomenys būtų naudojami atsakyti į mano užklausą. <a href="/privatumas">Privatumo informacija</a>.</label>
      <div className={s.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className={s.submitRow}><button className={s.primary} type="submit" disabled={busy || saved}>{busy ? "Siunčiama..." : saved ? "Užklausa išsaugota" : "Siųsti užklausą"}</button><a href={`mailto:${email}?subject=${encodeURIComponent("Promedical · Įrangos užklausa")}&body=${encodeURIComponent(combined)}`}>Rašyti el. paštu</a></div>
      <p className={s.formStatus} tabIndex={-1} role="status" aria-live="polite">{status}</p>
      <p className={s.formNote}>Užklausa skirta poreikiui ir kainos pasiūlymui aptarti. Kainos, komplektacija ir tiekimo sąlygos suderinamos atskirai.</p>
    </form>
  </div>;
}
