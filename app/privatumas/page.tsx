import { headers } from "next/headers";
import { PolicyLayout } from "@/components/policy-layout";
import { resolveSite } from "@/lib/site-config";

export default async function PrivacyPage() {
  const site = resolveSite((await headers()).get("host"));
  return <PolicyLayout site={site} eyebrow="Teisinė informacija" title="Privatumo politika" intro="Šis puslapis yra paruoštas kaip struktūra, tačiau prieš viešą paleidimą turi būti užpildytas tikrais valdytojo ir naudojamų paslaugų duomenimis."><h2>Kas valdo duomenis?</h2><p>Demo versijoje juridinis duomenų valdytojas ir kontaktas sąmoningai nenurodyti, kad nebūtų išgalvotų rekvizitų. Savininkas prieš paleidimą turi įrašyti pavadinimą, adresą, kontaktą ir duomenų apsaugos kontaktą, jei taikoma.</p><h2>Kokie duomenys gali būti tvarkomi?</h2><p>Pagal faktinę integraciją gali būti tvarkomi serverio žurnalai, kontaktinių užklausų duomenys, analitikos įvykiai, affiliate paspaudimai ir consent įrašai. Tikslus sąrašas turi atitikti realų kodą ir tiekėjų sutartis.</p><h2>Tikslai, pagrindai ir saugojimas</h2><p>Prieš paleidimą reikia dokumentuoti kiekvieno tikslo teisinį pagrindą, duomenų gavėjus, perdavimus už EEE ribų, saugojimo terminą ir ištrynimo procesą.</p><h2>Jūsų teisės</h2><p>Politikoje turi būti aiškiai nurodyta, kaip pateikti prieigos, taisymo, ištrynimo, apribojimo, nesutikimo ar duomenų perkeliamumo prašymą bei kaip kreiptis į priežiūros instituciją.</p></PolicyLayout>;
}
