import { headers } from "next/headers";
import { PolicyLayout } from "@/components/policy-layout";
import { resolveSite } from "@/lib/site-config";

export default async function EditorialPolicyPage() {
  const site = resolveSite((await headers()).get("host"));
  return <PolicyLayout site={site} eyebrow="Skaidri redakcija" title="Kaip rengiame ir tikriname gidus." intro="Mūsų tikslas – naudingas, patikrinamas ir sąžiningai pateiktas turinys."><h2>Temos ir šaltiniai</h2><p>Kiekvienam straipsniui prieš rašymą apibrėžiame skaitytojo klausimą, atrankos kriterijus ir reikalingus šaltinius. Faktiniai teiginiai turi būti susieti su šaltiniu arba pažymėti kaip redakcinė rekomendacija.</p><h2>Autoriai ir peržiūra</h2><p>Straipsniai turi matomą autoriaus profilį. Autorius, jo vaidmuo ir patirtis turi būti tikri. AI naudojimas gali pagreitinti tyrimą, tačiau negali sukurti išgalvotų citatų, testų ar asmeninės patirties. Prieš planuojant publikaciją redaktorius patikrina faktus, nuorodas, lokalizaciją ir komercinius teiginius.</p><h2>Atnaujinimai</h2><p>Atnaujinimo data keičiama tada, kai turinys iš tiesų peržiūrėtas. Keičiantis kainai, prieinamumui ar svarbiam faktui, atnaujiname atitinkamą versiją ir auditą.</p><h2>Klaidų taisymas</h2><p>Apie klaidą praneškite per <a href="/kontaktai">kontaktų puslapį</a>. Svarbūs pataisymai įrašomi į redakcinę istoriją, o ne slepiami tyliai pakeičiant tekstą.</p></PolicyLayout>;
}
