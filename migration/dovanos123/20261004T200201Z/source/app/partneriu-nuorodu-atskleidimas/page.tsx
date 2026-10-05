import { headers } from "next/headers";
import { PolicyLayout } from "@/components/policy-layout";
import { resolveSite } from "@/lib/site-config";

export default async function AffiliateDisclosurePage() {
  const site = resolveSite((await headers()).get("host"));
  return <PolicyLayout site={site} eyebrow="Komercinis skaidrumas" title="Partnerių nuorodų atskleidimas" intro="Kai kuriuose giduose gali būti nuorodų, už kurias svetainė gauna komisinį, jei lankytojas įsigyja prekę."><h2>Kaip tai veikia?</h2><p>Jei nuoroda yra partnerinė, tai nurodoma prie komercinio veiksmo arba straipsnio pradžioje. Komisinis nekeičia faktų, atrankos kriterijų ar mūsų pareigos pateikti naudingą informaciją.</p><h2>Kainos ir prieinamumas</h2><p>Prekybininko kaina, likutis, pristatymas ir pasiūlymo sąlygos gali pasikeisti. Prieš pirkdami patikrinkite galutinę informaciją prekybininko puslapyje.</p><h2>Reklama ir remiamas turinys</h2><p>Jei turinys būtų remiamas, tai būtų pažymėta atskirai. Nenaudojame paslėptų reklamos tekstų kaip nepriklausomų redakcinių išvadų.</p></PolicyLayout>;
}
