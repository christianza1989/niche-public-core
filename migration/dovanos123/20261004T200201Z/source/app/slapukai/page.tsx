import { headers } from "next/headers";
import { PolicyLayout } from "@/components/policy-layout";
import { resolveSite } from "@/lib/site-config";

export default async function CookiesPage() {
  const site = resolveSite((await headers()).get("host"));
  return <PolicyLayout site={site} eyebrow="Teisinė informacija" title="Slapukai ir pasirinkimai" intro="Naudojame tik tuos slapukus ir panašias technologijas, kurių reikia faktiniam svetainės veikimui arba kuriems lankytojas davė sutikimą."><h2>Inventorizacija prieš paleidimą</h2><p>Savininkas turi surašyti visus naudojamus slapukus pagal pavadinimą, tiekėją, tikslą, kategoriją ir galiojimo laiką. Analitikos, reklamos ir nebūtini affiliate slapukai neturi būti aktyvuojami prieš sutikimą, jei to reikalauja taikomos taisyklės.</p><h2>Valdymas</h2><p>Consent sąsajoje turi būti galima priimti, atmesti ir vėliau pakeisti nebūtinų kategorijų pasirinkimą. „Atmesti“ neturi būti paslėpta ar sudėtingesnė už „Priimti“.</p><h2>Kas svarbu</h2><p>Šis tekstas nėra teisinė konsultacija. Galutinė versija turi atitikti realų skriptų sąrašą, analitikos konfigūraciją ir lankytojų geografiją.</p></PolicyLayout>;
}
