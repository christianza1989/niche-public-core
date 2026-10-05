import { headers } from "next/headers";
import { PolicyLayout } from "@/components/policy-layout";
import { resolveSite } from "@/lib/site-config";

export default async function TermsPage() {
  const site = resolveSite((await headers()).get("host"));
  return <PolicyLayout site={site} eyebrow="Teisinė informacija" title="Naudojimo taisyklės" intro="Šis puslapis apibrėžia, kaip galima naudoti svetainės turinį ir kaip vertinti išorinių prekybininkų pasiūlymus."><h2>Turinio paskirtis</h2><p>Gidai skirti bendrai informacinei ir pasirinkimo pagalbai. Jie nėra individualus teisinis, finansinis, medicininis ar kitas profesionalus patarimas.</p><h2>Išoriniai prekybininkai</h2><p>Paspaudus produkto nuorodą galite patekti į kito valdytojo svetainę, kuriai taikomos jos pačios taisyklės, privatumo politika, kainos ir pristatymo sąlygos.</p><h2>Turinio naudojimas</h2><p>Negalima kopijuoti viso turinio, apsimesti svetainės autoriumi ar naudoti mūsų autorių profilių kaip rekomendacijos be leidimo.</p><h2>Pakeitimai</h2><p>Taisyklės atnaujinamos kartu su realia svetainės veikla. Prieš viešą paleidimą savininkas turi įrašyti juridinio subjekto duomenis ir taikomą teisę.</p></PolicyLayout>;
}
