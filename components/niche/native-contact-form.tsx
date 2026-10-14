import styles from './native-content-site.module.css';
export function NativeContactForm({privacyHref}:{privacyHref:string}){
  return <section className={styles.inquiry} aria-labelledby="inquiry-title"><h2 id="inquiry-title">Parašykite mums</h2><p>Jūsų el. paštas skirtas atsakymui į šią žinutę.</p>
    <form method="post" action="/uzklausa" className={styles.inquiryForm}>
      <label htmlFor="inquiry-name">Vardas<input id="inquiry-name" name="name" autoComplete="name" minLength={2} maxLength={100} required/></label>
      <label htmlFor="inquiry-email">El. paštas<input id="inquiry-email" type="email" name="email" autoComplete="email" maxLength={250} required/></label>
      <label htmlFor="inquiry-message">Žinutė<textarea id="inquiry-message" name="message" rows={5} minLength={20} maxLength={3000} required aria-describedby="inquiry-hint"/></label><p id="inquiry-hint">Parašykite bent 20 ženklų ir nurodykite, kaip galime padėti.</p>
      <div className={styles.honeypot} aria-hidden="true"><label>Svetainė<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <label className={styles.inquiryConsent}><input type="checkbox" name="consent" value="yes" required/> <span>Sutinku, kad mano duomenys būtų naudojami atsakymui į užklausą. <a href={privacyHref}>Privatumo aprašas</a></span></label>
      <button type="submit">Siųsti žinutę</button>
    </form></section>;
}
