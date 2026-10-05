import { headers } from "next/headers";
import { PolicyLayout } from "@/components/policy-layout";
import { resolveSite } from "@/lib/site-config";

export default async function AboutPage() {
  const site = resolveSite((await headers()).get("host"));
  return <PolicyLayout site={site} eyebrow="Apie projektą" title="Dovanų pasirinkimas be triukšmo." intro="Kuriame praktinius gidus žmonėms, kurie nori dovanoti apgalvotai, o ne tiesiog užpildyti krepšelį."><h2>Ką rasite čia?</h2><p>{site.name} apžvelgia dovanas pagal progą, santykį, biudžetą ir tai, kokią patirtį jos sukuria. Kiekvienas gidas turi konkretų tikslą: padėti susiaurinti pasirinkimą ir suprasti, į ką verta atkreipti dėmesį.</p><h2>Kaip dirbame</h2><p>Temas planuojame pagal realius žmonių klausimus, naudojame patikimus šaltinius ir aiškiai atskiriame faktą nuo redakcinės rekomendacijos. AI gali padėti tyrimo ar juodraščio etape, tačiau viešą versiją peržiūri atsakingas redaktorius.</p><h2>Komerciniai ryšiai</h2><p>Kai kuriuose puslapiuose gali būti partnerių nuorodų. Tai nurodome aiškiai ir neleidžiame komisiniam pakeisti atrankos kriterijų. Daugiau informacijos rasite <a href="/partneriu-nuorodu-atskleidimas">partnerių nuorodų atskleidime</a>.</p><h2>Kontaktas ir pataisymai</h2><p>Jei pastebėjote netikslumą arba turite patirties, kuri padėtų pagerinti gidą, susisiekite <a href="/kontaktai">kontaktų puslapyje</a>.</p></PolicyLayout>;
}
