"use client";
import {useState} from 'react';

export function KvapunaikinimasForm({styles}:{styles:Record<'form'|'fieldLabel'|'trap'|'notice'|'button',string>}){
 const [method,setMethod]=useState('');
 return <form action="/uzklausa" method="post" className={styles.form}>
  <label className={styles.fieldLabel} htmlFor="kv-contact">Atsakymo būdas</label>
  <select id="kv-contact" name="contact_method" required value={method} onChange={e=>setMethod(e.target.value)}>
   <option value="">-Pasirinkite-</option><option value="phone">Telefonu</option><option value="email">El. paštu</option>
  </select>
  <label className={styles.fieldLabel} htmlFor="kv-name">Vardas / Įmonės pavadinimas</label>
  <input id="kv-name" name="name" placeholder="Vardas / Įmonės pavadinimas" autoComplete="name" minLength={2} maxLength={100} required />
  <label className={styles.fieldLabel} htmlFor="kv-phone">Telefono nr.{method==='phone'?' *':''}</label>
  <input id="kv-phone" name="phone" placeholder="Telefono nr." type="tel" autoComplete="tel" maxLength={40} required={method==='phone'} />
  <label className={styles.fieldLabel} htmlFor="kv-email">El. paštas{method==='email'?' *':''}</label>
  <input id="kv-email" name="email" placeholder="El. paštas" type="email" autoComplete="email" maxLength={250} required={method==='email'} />
  <label className={styles.fieldLabel} htmlFor="kv-message">Žinutė</label>
  <textarea id="kv-message" name="message" placeholder="Žinutė" rows={5} maxLength={3000} />
  <div className={styles.trap} aria-hidden="true"><label htmlFor="kv-website">Svetainė</label><input id="kv-website" name="website" tabIndex={-1} autoComplete="off" /></div>
  <label className={styles.notice}><input type="checkbox" name="consent" value="yes" required />
   <span>Susipažinau su <a href="/musu-slapuku-politika">privatumo informacija</a>.</span>
  </label>
  <button className={styles.button} type="submit">SIŲSTI ŽINUTĘ</button>
 </form>;
}
