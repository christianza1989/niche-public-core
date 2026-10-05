import type { ProjectedContentPageV2 } from "@/lib/content-model-v2";
import { giftPath } from "@/lib/gift-content";

/** Only mounted when the reviewed privacy page is part of the same public projection. */
export function GiftContactForm({ privacy }: { privacy: ProjectedContentPageV2 }) {
  return <section className="gift-contact-panel" aria-labelledby="gift-contact-heading"><h2 id="gift-contact-heading">Parašykite redakcijai</h2><form action="/uzklausa" method="post" acceptCharset="utf-8" className="gift-contact-form">
    <label>Jūsų vardas<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
    <label>El. paštas atsakymui<input name="email" type="email" autoComplete="email" maxLength={250} required /></label>
    <label>Žinutė<textarea name="message" rows={6} minLength={20} maxLength={3000} required aria-describedby="gift-message-help" /></label>
    <p id="gift-message-help">Bent 20 ženklų. Nurodykite straipsnio adresą ir konkretų klausimą. Nesiųskite jautrių asmens ar mokėjimo duomenų.</p>
    <label className="gift-contact-consent"><input name="consent" type="checkbox" value="yes" required /><span>Susipažinau su <a href={giftPath(privacy)}>privatumo informacija</a> ir prašau naudoti mano vardą, el. paštą ir žinutę atsakyti į šią užklausą.</span></label>
    <p>Ši užklausa nėra prekių užsakymas ar sutikimas gauti reklaminį naujienlaiškį.</p>
    <div hidden aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <button className="button button-dark" type="submit">Siųsti žinutę</button>
  </form></section>;
}
