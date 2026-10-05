import { headers } from "next/headers";
import { PolicyLayout } from "@/components/policy-layout";
import { resolveSite } from "@/lib/site-config";

export default async function ContactPage() {
  const site = resolveSite((await headers()).get("host"));
  return <PolicyLayout site={site} eyebrow="Susisiekime" title="Turite klausimą ar radote klaidą?" intro="Kiekvienam rinkos variantui prieš paleidimą turi būti nurodytas realus atsakingo valdytojo kontaktas."><h2>Kontaktų duomenys</h2><p>Šioje demonstracinėje versijoje kontaktas dar nepateiktas. Prieš viešą paleidimą savininkas turi įrašyti realų el. paštą arba kontaktinę formą, atsakymo terminą ir atsakingą juridinį subjektą.</p><h2>Ką verta nurodyti laiške?</h2><ul><li>straipsnio URL;</li><li>konkretų teiginį ar nuorodą, kurią reikia patikrinti;</li><li>šaltinį arba paaiškinimą, kodėl informacija netiksli.</li></ul><h2>Verslo pasiūlymai</h2><p>Partnerystės pasiūlymai turi būti atskirti nuo klaidų pranešimų ir redakcinio grįžtamojo ryšio.</p></PolicyLayout>;
}
