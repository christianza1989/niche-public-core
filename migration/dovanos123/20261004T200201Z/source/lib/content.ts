import type { SiteConfig, SupportedLocale } from "./site-config";
import { NEW_ARTICLES } from "./new-articles";
import { SCHEDULED_ARTICLES_2026 } from "./scheduled-articles-2026";

export type PublicationState = "draft" | "scheduled" | "published" | "unpublished";

export type AuthorRecord = {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  experience: string;
  sameAs: string[];
  siteId: string;
  locale: SupportedLocale;
  kind?: "person" | "organization";
};

export type SourceRecord = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  /** Keep editorial/process references available internally without showing them to readers. */
  public?: boolean;
};

export type FeaturedImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit?: string;
};

export type ArticleRecord = {
  id: string;
  siteId: string;
  locale: SupportedLocale;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishAt: string;
  publicationState: PublicationState;
  readingMinutes: number;
  relatedIds: string[];
  body: string[];
  authorIds: string[];
  sourceIds: string[];
  featuredImage?: FeaturedImage;
  /** Some informational or budget guides should not show a product promotion. */
  productRecommendation?: boolean;
};

const now = Date.now();

export const DEMO_FEATURED_IMAGES = {
  handCasting: {
    src: "/images/articles/hand-casting-memory.webp",
    alt: "Poros rankose laiko baltą rankų liejinio skulptūrą ant medinio stalo",
    width: 1536,
    height: 1024,
    credit: "Sugeneruota redakcijos iliustracija",
  },
  christmas: {
    src: "/images/articles/christmas-gift-guide.webp",
    alt: "Dailiai supakuota kalėdinė dovana jaukiame žiemos interjere",
    width: 1536,
    height: 1024,
    credit: "Sugeneruota redakcijos iliustracija",
  },
} satisfies Record<string, FeaturedImage>;

export const DEMO_ARTICLES: ArticleRecord[] = [
  {
    id: "lt-hand-casting-guide",
    siteId: "dovanos123",
    locale: "lt-LT",
    slug: "ranku-liejimo-rinkinys-issamus-gidas",
    title: "Rankų liejimo rinkinys: išsamus gidas nuo pasiruošimo iki rezultato",
    excerpt: "Sužinokite, kam tinka rankų liejimo rinkinys, kaip pasiruošti, kokių klaidų vengti ir kaip išsirinkti rinkinį prasmingai dovanai.",
    category: "Personalizuotos dovanos",
    publishAt: new Date(now).toISOString(),
    publicationState: "published",
    readingMinutes: 10,
    relatedIds: ["lt-hand-casting", "lt-couple-ideas", "lt-gifts-personalized"],
    authorIds: ["aiste-redaktore"],
    sourceIds: ["source-memorycasting", "source-hand-casting", "source-gift-choice"],
    featuredImage: DEMO_FEATURED_IMAGES.handCasting,
    body: [
      "Rankų liejimo rinkinys leidžia porai, šeimai ar artimiems žmonėms kartu sukurti trimatį prisiminimą. Tai nėra įprasta dekoracija, kurią tiesiog išpakuojate ir padedate lentynoje: svarbiausia dovanos dalis yra pats procesas, o rezultatas lieka kaip bendro laiko ženklas.",
      "Šis gidas skirtas žmogui, kuris svarsto tokį rinkinį dovanoti arba nori suprasti, kaip vyksta liejimas prieš jį užsakant. Čia rasite praktinius pasiruošimo žingsnius, sąžiningus pasirinkimo kriterijus ir dažniausias klaidas, dėl kurių pirmas bandymas gali nepavykti.",
      "## Kam tinka rankų liejimo rinkinys?",
      "Geriausiai jis tinka žmonėms, kurie nori ne tik gauti daiktą, bet ir patirti ką nors kartu. Porai tai gali būti vestuvių metinių, sužadėtuvių ar bendro gyvenimo pradžios dovana. Šeimai — būdas įamžinti skirtingo amžiaus žmonių rankas vienoje kompozicijoje. Jis taip pat gali tikti kaip asmeniška dovana žmogui, kuris vertina rankų darbą ir sentimentalius objektus.",
      "• Poroms, norinčioms išsaugoti artumo gestą.",
      "• Šeimoms, kurios nori bendro savaitgalio projekto.",
      "• Vestuvių metinių, sužadėtuvių ar svarbaus jubiliejaus progai.",
      "• Žmonėms, kuriems svarbus procesas, o ne vien greitas pirkinys.",
      "Jeigu dovanos gavėjas nemėgsta rankdarbių, negali skirti laiko instrukcijai arba tikisi idealaus rezultato be jokio įsitraukimo, praktiškesnė gali būti jau pagaminta dovana. Geras pasirinkimas prasideda nuo žmogaus, o ne nuo raktažodžio.",
      "## Kas paprastai būna rinkinyje?",
      "Komplektacija priklauso nuo konkretaus gamintojo ir pasirinkto dydžio, todėl ją verta patikrinti produkto puslapyje prieš užsakant. Įprastai rankų liejimo rinkinyje būna medžiaga, kuri trumpam suformuoja rankų kontūrą, liejimo medžiaga galutinei skulptūrai, instrukcija ir priemonės procesui atlikti. Kai kuriuose rinkiniuose papildomai siūlomas stovas, padėklas ar daugiau medžiagos didesnei kompozicijai.",
      "Svarbu atskirti du etapus: pirmiausia sukuriama ne pati skulptūra, o tuščiavidurė forma, o vėliau ji užpildoma kietėjančia medžiaga. Todėl instrukcijoje nurodyti maišymo ir laukimo laikai yra proceso dalis, o ne neprivalomas patarimas.",
      "## Kaip pasiruošti prieš maišant medžiagas?",
      "Geriausias rezultatas prasideda dar neatidarius pakuotės. Skirkite sau pakankamai laiko, kad nereikėtų skubėti, ir iš anksto perskaitykite visą instrukciją. Pirmą kartą atliekant procesą verta turėti pagalbininką, kuris paduotų indą ar stebėtų laiką.",
      "• Pasirinkite vietą, kurioje galima lengvai nuvalyti paviršius.",
      "• Pasiruoškite kambario temperatūros vandenį, jei jo reikia pagal instrukciją.",
      "• Nuimkite žiedus, laikrodžius ir kitus daiktus nuo rankų.",
      "• Iš anksto nuspręskite, kokią rankų padėtį norite išsaugoti.",
      "• Susitarkite, kas matuos laiką ir kada visi turi nejudėti.",
      "Jeigu liejate kelių žmonių rankas, iš anksto pasimatuokite, ar pasirinktas indas yra pakankamai platus. Rankų padėtis turi būti patogi, nes proceso metu net maži neplanuoti judesiai gali pakeisti galutinę formą.",
      "## Kaip vyksta liejimas?",
      "### 1. Sukuriama rankų forma",
      "Formavimo medžiaga sumaišoma pagal konkretaus rinkinio instrukciją. Rankos panardinamos į masę pasirinktoje padėtyje, o dalyviai turi išlaikyti ją kuo stabiliau, kol masė sustingsta. Šiame etape nereikėtų bandyti pagreitinti proceso papildomai judinant pirštus ar tikrinant masę.",
      "### 2. Forma atsargiai atlaisvinama",
      "Kai forma paruošta, rankos ištraukiamos lėtai ir be staigių trūktelėjimų. Svarbu neplėšti medžiagos jėga: jei kuri nors vieta atrodo labai plona, vadovaukitės instrukcija ir dirbkite kantriai.",
      "### 3. Forma užpildoma liejimo medžiaga",
      "Liejimo medžiaga turi pasiekti visas formos vietas. Čia dažniausiai padeda lėtas pylimas, lengvas indo patapšnojimas ir instrukcijoje nurodytas laukimo laikas. Tikslas nėra kuo greičiau pripildyti formą, o sumažinti oro tarpų tikimybę.",
      "### 4. Skulptūra išimama ir sutvarkoma",
      "Po kietėjimo išorinė forma nuimama, o paviršius apžiūrimas. Smulkūs pataisymai gali būti įmanomi, tačiau jų apimtis priklauso nuo naudojamos medžiagos. Prieš šlifuodami, dažydami ar tvirtindami ant padėklo įsitikinkite, kad skulptūra visiškai sukietėjusi.",
      "## Dažniausios klaidos ir kaip jų išvengti",
      "• Maišymas pradedamas dar neperskaičius instrukcijos — pasiruoškite viską iš anksto.",
      "• Pasirenkamas per mažas indas — rankos turi tilpti patogiai, be spaudimo.",
      "• Dalyviai juda kietėjimo metu — susitarkite dėl pozos ir laiko prieš panardinant rankas.",
      "• Medžiaga pilama per greitai — lėtesnis procesas dažnai leidžia geriau užpildyti smulkias vietas.",
      "• Skulptūra tvarkoma per anksti — laikykitės gamintojo nurodyto kietėjimo laiko.",
      "• Tikimasi kataloginės nuotraukos rezultato — rankų liejinys yra individualus, todėl nedideli skirtumai yra jo istorijos dalis.",
      "## Kaip išsirinkti rinkinį dovanai?",
      "Pradėkite nuo žmonių skaičiaus ir norimos kompozicijos dydžio. Porai dažniausiai reikia dviejų rankų rinkinio, o šeimai verta tikrinti, kiek rankų telpa ir ar komplekte pakanka medžiagos. Jei dovana skirta kūdikiui, pasirinkite tik tą rinkinį, kurio gamintojas aiškiai aprašo naudojimą ir suaugusiųjų priežiūrą.",
      "Toliau įvertinkite instrukcijos aiškumą, medžiagų paskirtį, galutinio rezultato dydį, galimybę jį pastatyti ar pakabinti ir pristatymo terminą. Vien tik graži pakuotė nepasako, ar dovana patiks: svarbiau, ar gavėjas turės patogią vietą procesui ir norės jame dalyvauti.",
      "## Dažniausiai užduodami klausimai",
      "### Ar rankų liejimo rinkinys tinka vaikams?",
      "Tai nėra žaislas. Vaikai gali dalyvauti tik su suaugusiojo priežiūra, laikantis konkretaus gamintojo instrukcijų ir saugos informacijos. Mažos dalys bei medžiagos neturi būti dedamos į burną.",
      "### Kiek laiko reikia skirti procesui?",
      "Tikslus laikas priklauso nuo rinkinio ir medžiagų, todėl vadovaukitės jo instrukcija. Praktiškai verta planuoti ne tik maišymą, bet ir pasiruošimą, pozos išlaikymą, kietėjimą bei vėlesnį sutvarkymą. Dovanai geriau pasirinkti dieną, kai nereikia skubėti.",
      "### Ką daryti, jei liejinyje matosi oro tarpas?",
      "Mažas oro tarpas ne visada sugadina visą rezultatą, tačiau jo taisymo galimybės priklauso nuo medžiagos ir vietos. Pirmiausia leiskite skulptūrai visiškai sukietėti, tada tikrinkite gamintojo rekomenduojamus pataisymo būdus. Nenaudokite atsitiktinių cheminių priemonių, jei nežinote, kaip jos veiks paviršių.",
      "### Ar tai gera dovana vestuvių metinėms?",
      "Taip, jei porai patinka bendros patirtys ir prasmingi daiktai. Tokia dovana ypač tinka tada, kai norite įamžinti ne tik datą, bet ir konkretų ryšį — laikymąsi už rankų, šeimos augimą ar naują gyvenimo etapą.",
      "## Išvada",
      "Rankų liejimo rinkinys vertas dėmesio tada, kai dovana turi sukurti progą pabūti kartu. Rinkdamiesi vertinkite ne vien nuotrauką ar kainą: patikrinkite komplektaciją, žmonių skaičių, instrukciją, paruošimo laiką ir tai, ar gavėjai norės patys dalyvauti procese.",
      "Jei ieškote tokios dovanos porai, šeimai ar svarbiai progai, peržiūrėkite Memory Casting rinkinių aprašymus ir pasirinkite komplektą pagal savo situaciją. Plačiau apie kitus būdus suasmeninti dovaną skaitykite [[personalizuotų dovanų gide|article:lt-gifts-personalized]].",
    ],
  },
  {
    id: "lt-couple-ideas",
    siteId: "dovanos123",
    locale: "lt-LT",
    slug: "prasmingos-dovanos-porai",
    title: "Prasmingos dovanos porai, kurios išlieka ilgam",
    excerpt: "Atrinkome dovanas, kurios ne tik gražiai atrodo, bet ir sukuria bendrą prisiminimą.",
    category: "Dovanos porai",
    publishAt: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
    publicationState: "published",
    readingMinutes: 7,
    relatedIds: ["lt-hand-casting", "lt-anniversary", "lt-gifts-couple"],
    authorIds: ["aiste-redaktore"],
    sourceIds: ["source-gift-choice"],
    featuredImage: DEMO_FEATURED_IMAGES.christmas,
    body: [
      "Geriausia dovana porai nebūtinai yra brangiausia. Svarbiau, kad ji turėtų istoriją ir būtų susijusi su abiem žmonėmis.",
      "Rankų liejimo rinkinys ypač tinka tada, kai norisi įamžinti artumą namuose. Tai ne vien daiktas – tai bendra patirtis ir prisiminimas, kurį galima pasidėti matomoje vietoje.",
      "Renkantis dovaną verta įvertinti, kiek laiko pora turi ceremonijai, ar mėgsta rankdarbius ir kokio dydžio rezultatą norėtų turėti.",
    ],
  },
  {
    id: "lt-hand-casting",
    siteId: "dovanos123",
    locale: "lt-LT",
    slug: "ranku-liejimo-rinkinys-kaip-veikia",
    title: "Kaip veikia rankų liejimo rinkinys?",
    excerpt: "Trumpas ir aiškus paaiškinimas, ko tikėtis nuo pirmo žingsnio iki paruoštos skulptūros.",
    category: "Personalizuotos dovanos",
    publishAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    publicationState: "published",
    readingMinutes: 5,
    relatedIds: ["lt-couple-ideas", "lt-anniversary"],
    authorIds: ["aiste-redaktore"],
    sourceIds: ["source-hand-casting"],
    featuredImage: DEMO_FEATURED_IMAGES.handCasting,
    body: [
      "Rinkinys paprastai susideda iš formavimo mišinio, liejimo medžiagos ir aiškios instrukcijos. Procesas vyksta dviem etapais: pirmiausia sukuriama rankų forma, o vėliau ji užpildoma liejimo medžiaga.",
      "Svarbiausia neskubėti maišant mišinį ir iš anksto pasiruošti indą, kuriame patogiai tilps rankos. Instrukcijoje nurodytas laikas yra svarbesnis už bandymą procesą pagreitinti.",
      "Rezultatas priklauso nuo pasiruošimo, bet būtent todėl ši dovana tampa bendra poros patirtimi.",
    ],
  },
  {
    id: "lt-anniversary",
    siteId: "dovanos123",
    locale: "lt-LT",
    slug: "dovana-vestuviu-metinems",
    title: "Dovana vestuvių metinėms: 9 idėjos su prasme",
    excerpt: "Nuo mažo simbolinio gesto iki dovanos, kurią pora kurs kartu.",
    category: "Dovanos progai",
    publishAt: new Date(now + 1000 * 60 * 60 * 24 * 2).toISOString(),
    publicationState: "draft",
    readingMinutes: 8,
    relatedIds: ["lt-couple-ideas"],
    authorIds: ["aiste-redaktore"],
    sourceIds: ["source-gift-choice"],
    featuredImage: DEMO_FEATURED_IMAGES.christmas,
    body: [
      "Vestuvių metinių dovana turėtų priminti ne tik datą, bet ir kartu nugyventą istoriją.",
      "Šiame gide palyginsime dovanas pagal biudžetą, pasiruošimo laiką ir emocinę vertę.",
    ],
  },
  {
    id: "lt-christmas-couple",
    siteId: "dovanos123",
    locale: "lt-LT",
    slug: "kaledines-dovanos-porai",
    title: "Kalėdinės dovanos porai: kaip išrinkti tai, ką prisimins abu",
    excerpt: "Praktiškas gidas, padedantis išsirinkti kalėdinę dovaną porai pagal jų kasdienybę, biudžetą ir norą patirti ką nors kartu.",
    category: "Kalėdinės dovanos",
    publishAt: new Date(now).toISOString(),
    publicationState: "published",
    readingMinutes: 9,
    relatedIds: ["lt-couple-ideas", "lt-hand-casting-guide", "lt-christmas-man", "lt-gifts-couple"],
    authorIds: ["aiste-redaktore"],
    sourceIds: ["source-memorycasting"],
    featuredImage: DEMO_FEATURED_IMAGES.christmas,
    body: [
      "Kalėdinę dovaną porai lengva paversti dar vienu bendru daiktu namuose. Geresnis pasirinkimas prasideda nuo klausimo, ką pora iš tikrųjų norėtų veikti kartu: gaminti vakarienę, išbandyti naują veiklą, atnaujinti namų erdvę ar išsaugoti svarbų gyvenimo etapą.",
      "Šiame gide pateikiu konkretų būdą susiaurinti pasirinkimą, palyginu dovanų tipus ir paaiškinu, kada verta rinktis rankų liejimo rinkinį. Tai ne kainų reitingas — skirtingų porų poreikiai yra skirtingi, todėl svarbiausia dovanos tinkamumas, o ne kuo ilgesnis sąrašas.",
      "## Nuo ko pradėti renkant dovaną porai?",
      "Pirmiausia įvertinkite, ar dovana bus naudojama kartu, ar ją naudos vienas žmogus. Jei dovana skirta abiem, ieškokite bendro ritualo: daikto, kurį pora išbandys tą pačią dieną, arba prisiminimo, kuris turės vietą jų namuose.",
      "• Koks jų laisvalaikis — ramus vakaras namuose, kelionės, maistas ar kūrybinės veiklos?",
      "• Ar jie vertina praktiškumą, ar mieliau renkasi sentimentalius daiktus?",
      "• Kiek laiko liko iki švenčių ir ar dovana turi būti pristatyta į kitą miestą?",
      "• Ar turite biudžetą vienai kokybiškai dovanai, ar norite sudėti kelis mažus elementus?",
      "Šie klausimai apsaugo nuo dažnos klaidos: nupirkti gražiai atrodantį daiktą, kuris visiškai neatitinka poros įpročių. Jei nežinote atsakymo, paklauskite artimo žmogaus apie jų savaitgalio rutiną — vienas konkretus pavyzdys dažnai pasako daugiau nei bendras apibūdinimas.",
      "## Penki dovanų tipai, kuriuos verta palyginti",
      "### 1. Bendra patirtis",
      "Vakarienės kuponas, degustacija, kūrybinės dirbtuvės ar trumpa išvyka sukuria progą ištrūkti iš rutinos. Tokiai dovanai svarbu patikrinti galiojimo laiką, rezervavimo taisykles ir lokaciją. Patirtis puikiai tinka porai, kuri labiau vertina laiką nei naują daiktą.",
      "### 2. Naudingas daiktas namams",
      "Kokybiškas pledas, stalo serviravimo elementas ar virtuvės įrankis gali būti geras pasirinkimas, jei žinote jų skonį. Venkite labai asmeniškų spalvų ir dydžių, kurių negalite patikrinti. Praktinė dovana tampa asmeniška, kai ją susiejate su konkrečiu jų įpročiu.",
      "### 3. Personalizuota dovana",
      "Inicialai, data, nuotrauka ar trumpas palinkėjimas suteikia dovanai istoriją. Prieš užsakydami patikrinkite, ar gamintojas rodo personalizacijos maketą ir kiek laiko trunka gamyba. Kalėdiniu laikotarpiu pristatymo terminas yra toks pat svarbus kaip ir idėja.",
      "### 4. Rankų darbo prisiminimas",
      "Rankų liejimo rinkinys leidžia porai pačiai sukurti trimatį savo rankų prisiminimą. Jis tinka ne visiems: gavėjai turi norėti skirti laiko pasiruošimui, laikytis instrukcijos ir priimti tai, kad rankų liejinys bus unikalus, o ne identiškas katalogo nuotraukai.",
      "Renkantis tokį rinkinį patikrinkite, kiek žmonių rankoms jis skirtas, kas įeina į komplektą, kiek laiko reikia procesui ir ar yra aiški saugos informacija. Jei pora mėgsta bendrus projektus, tai gali būti viena prasmingiausių kalėdinių dovanų.",
      "### 5. Mažas rinkinys iš kelių daiktų",
      "Arbata, saldumynas, žvakė ir ranka parašytas laiškas veikia tada, kai elementus sieja viena tema. Pavyzdžiui, jaukaus vakaro rinkinys bus įtikinamesnis, jei pridėsite konkretų pasiūlymą, kada jį išbandyti kartu.",
      "## Kaip pasirinkti pagal biudžetą",
      "Iki 30 € dažniausiai tinka nedidelis teminis rinkinys ar simbolinė detalė, tačiau verta investuoti į pateikimą ir asmeninį palinkėjimą. 30–80 € segmente galima rinktis kokybišką namų daiktą, patirtį su kuponu arba mažesnį personalizuotą gaminį. Didesniam biudžetui verta rinktis vieną išskirtinę dovaną ir skirti laiko jos istorijai, užuot pirkus kelis atsitiktinius daiktus.",
      "Kainą lyginkite ne tik pagal prekės etiketę. Pridėkite pristatymą, personalizacijos mokestį, rezervacijos sąlygas ir laiką, kurį pora turės skirti dovanai. Taip palyginimas tampa sąžiningas.",
      "## Kada rankų liejimo rinkinys yra geras pasirinkimas?",
      "Jį verta rinktis, kai pora vertina bendras veiklas, turi patogią vietą procesui ir norės išsaugoti rezultatą namuose. Tai ypač prasminga pirmoms bendroms Kalėdoms, sužadėtiniams, jaunavedžiams arba porai, kuri švenčia naują gyvenimo etapą.",
      "Jeigu pora gyvena labai mažoje erdvėje, nemėgsta rankdarbių arba dovaną reikės panaudoti tą pačią dieną be pasiruošimo, geriau rinktis patirtį ar paruoštą daiktą. Tinkamumas gavėjui yra svarbesnis už produkto populiarumą.",
      "## Kalėdinio užsakymo kontrolinis sąrašas",
      "• Patikrinkite, ar pristatymo terminas tinka jūsų šventės datai.",
      "• Perskaitykite, kas tiksliai įeina į komplektą ir ko reikės papildomai.",
      "• Įsitikinkite, kad aprašyme yra priežiūros ir saugos informacija.",
      "• Jei dovana personalizuojama, dar kartą patikrinkite vardus ir datą.",
      "• Pridėkite trumpą paaiškinimą, kodėl pasirinkote būtent šią dovaną.",
      "## Dažniausi klausimai",
      "### Ar dovaną porai geriau įteikti vieną bendrą, ar po atskirą?",
      "Jei pora daug ką planuoja kartu, viena bendra dovana gali būti prasmingesnė. Jei jų pomėgiai labai skirtingi, galima pridėti po mažą asmeninę detalę prie pagrindinės bendros dovanos.",
      "### Ar patirtis nėra per daug neapčiuopiama?",
      "Patirtį galima padaryti konkrečią: įrašykite datą kalendoriuje, pridėkite užkandžių arba parašykite, kodėl norite, kad pora tą vakarą praleistų kartu. Taip kuponas tampa planu, o ne tik pažadu.",
      "### Ką daryti, jei nežinau jų skonio?",
      "Rinkitės neutralią, panaudojamą dovaną arba dovaną, kurioje svarbi veikla, o ne spalva ir dydis. Venkite labai specifinio interjero dekoro, jei nesate matę jų namų.",
      "## Išvada",
      "Geriausia kalėdinė dovana porai yra ta, kuri atitinka jų gyvenimą ir palieka progą pabūti kartu. Pradėkite nuo jų įpročių, palyginkite laiką, biudžetą bei pristatymą ir tik tada rinkitės konkretų produktą. Jei jie mėgsta bendrus kūrybinius projektus, Memory Casting rankų liejimo rinkinys gali tapti ne tik dovana, bet ir vakaru, kurį abu prisimins. Ne šventiniam sezonui pravers [[bendras dovanų porai gidas|article:lt-gifts-couple]].",
    ],
  },
  {
    id: "lt-christmas-man",
    siteId: "dovanos123",
    locale: "lt-LT",
    slug: "ka-dovanoti-vyrui-kaledoms",
    title: "Ką dovanoti vyrui Kalėdoms? Praktinis gidas pagal jo pomėgius",
    excerpt: "Kaip išrinkti kalėdinę dovaną vyrui ne pagal bendrą sąrašą, o pagal jo kasdienybę, pomėgius ir jūsų ryšį.",
    category: "Kalėdinės dovanos",
    publishAt: new Date(now).toISOString(),
    publicationState: "published",
    readingMinutes: 9,
    relatedIds: ["lt-christmas-couple", "lt-hand-casting-guide", "lt-couple-ideas", "lt-gifts-father"],
    authorIds: ["aiste-redaktore"],
    sourceIds: ["source-memorycasting"],
    featuredImage: DEMO_FEATURED_IMAGES.christmas,
    body: [
      "Klausimas „ką dovanoti vyrui Kalėdoms?“ dažnai tampa per plačiu paieškos sąrašu. Geriau pradėti nuo jo įpročių: ką jis daro po darbo, ką nuolat taiso, apie ką kalba ir kokią veiklą vis atideda. Tokie signalai padeda rasti dovaną, kuri bus naudojama, o ne pamiršta stalčiuje.",
      "Šis gidas padės susiaurinti pasirinkimą pagal pomėgius, santykį ir biudžetą. Įtraukiau ir dovanas, kurias galima patirti kartu, nes vyrui skirta dovana nebūtinai turi būti vien jo daiktas.",
      "## Greitas pasirinkimo metodas",
      "Užrašykite tris jo savybes arba veiklas ir prie kiekvienos pridėkite vieną realų poreikį. Pavyzdžiui: mėgsta kavą — trūksta gero rytinio ritualo; važinėja dviračiu — praverstų patogus aksesuaras; vertina šeimą — norėtųsi išsaugoti bendrą prisiminimą. Iš šių poreikių rinkitės vieną, kurio pats žmogus dar neišsprendė.",
      "• Dovana turi būti susijusi su jo gyvenimu, ne tik su tuo, kas šiuo metu reklamuojama.",
      "• Patikrinkite, ar neturi panašaus daikto, prieš pirkdami dar vieną.",
      "• Įvertinkite, ar dovaną jis galės naudoti iš karto, ar reikės papildomų priedų.",
      "• Jei dovana brangesnė, pasilikite laiko pristatymui ir grąžinimo sąlygoms.",
      "## Dovanos pagal pomėgius",
      "### Technikos ir praktiškumo mėgėjui",
      "Praktiškam vyrui tinka daiktas, kuris išsprendžia konkretų nepatogumą: kokybiškas įrankis, patogus organizatorius, įkrovimo sprendimas ar darbo vietos priedas. Venkite neaiškios paskirties „gadgetų“, jei negalite paaiškinti, kokią problemą jie išsprendžia.",
      "### Sportuojančiam vyrui",
      "Rinkitės ne pagal sporto šakos pavadinimą, o pagal jo treniruočių rutiną. Gali tikti atsistatymui skirtas aksesuaras, gertuvė, krepšys ar patogus sluoksnis lauko veiklai. Batų, šalmo ir kitų dydžiui jautrių daiktų nepirkite nežinodami tikslių parametrų.",
      "### Mėgstančiam maistą ir kavą",
      "Čia geriausiai veikia dovana su aiškiu panaudojimo scenarijumi: degustacija, kavos pupelių rinkinys, geras virtuvės įrankis arba vakarienė, kurią paruošite kartu. Jei renkatės maistą, patikrinkite galiojimo laiką ir ar nėra alergijų.",
      "### Automobilių ar kelionių entuziastui",
      "Kelionėms praverčia patvarus krepšys, dokumentų dėklas, kompaktiškas organizatorius ar patirtis. Automobilio aksesuarus rinkite tik žinodami konkretų modelį ir suderinamumą — universalus aprašymas ne visada reiškia, kad daiktas tiks.",
      "### Sentimentaliam vyrui",
      "Jei jis vertina prisiminimus, rinkitės dovaną su istorija: nuotraukų knygą, laišką, bendros datos simbolį ar kartu sukurtą objektą. Rankų liejimo rinkinys gali būti tinkamas porai ar šeimai, kuri nori įamžinti artumą ir nebijo skirti laiko procesui.",
      "## Kaip pasirinkti pagal santykį",
      "Partneriui dažniausiai tinka dovana, kuri kalba apie jūsų bendrą istoriją. Tėčiui ar broliui svarbiau jo įprotis ir praktiškumas. Kolegei ar draugui rinkitės neutralesnę dovaną, kuri nesukuria nepatogaus įsipareigojimo. Santykis padeda nustatyti, kiek asmeniška gali būti dovana.",
      "Jei dovana skirta partneriui, nebijokite rinktis ne tik jo asmeninio daikto. Bendra veikla arba objektas, kurį sukursite dviese, gali būti prasmingesnis už dar vieną daiktą, kurį jis turės prižiūrėti.",
      "## Biudžetas ir kalėdinis laikas",
      "Nedidelis biudžetas nėra problema, jei dovana turi konkretų kontekstą. Iki 30 € galima sudaryti teminį rinkinį, 30–80 € segmente rinktis kokybišką pomėgio daiktą arba patirtį, o didesniam biudžetui verta ieškoti ilgaamžio produkto ar personalizuoto prisiminimo.",
      "Kalėdų laikotarpiu būtinai patikrinkite realų pristatymo terminą, ne vien žymą „turime sandėlyje“. Jei prekė gaminama pagal užsakymą, papildomai įvertinkite personalizacijos ir kurjerio laiką. Turėkite paprastesnį atsarginį variantą, jei pagrindinė dovana vėluotų.",
      "## Ko geriau nepirkti aklai",
      "• Drabužių ir avalynės, kai nežinote tikslaus dydžio ar modelio.",
      "• Labai specifinių įrankių, jei nežinote jo turimos sistemos.",
      "• Humoro dovanų, kurios gali būti juokingos tik pirkėjui.",
      "• Prastos kokybės rinkinių, kurių aprašyme nėra komplektacijos ar saugos informacijos.",
      "• Dovanų, kurios žada greitą rezultatą, bet reikalauja daug nepaaiškinto pasiruošimo.",
      "## Dažniausiai užduodami klausimai",
      "### Ar geriau pirkti vieną brangesnę dovaną, ar kelias mažesnes?",
      "Jei žinote konkretų poreikį, viena kokybiška dovana paprastai yra aiškesnis pasirinkimas. Kelios mažesnės veikia tada, kai jos sudaro vieną temą ir nėra atsitiktinis daiktų rinkinys.",
      "### Kaip suprasti, ar dovana tikrai asmeniška?",
      "Paklauskite savęs, ar galėtumėte paaiškinti, kodėl ją pasirinkote būtent jam. Jei atsakymas tinka bet kuriam žmogui, pridėkite asmeninį elementą arba grįžkite prie jo tikro pomėgio.",
      "### Ar rankų liejimo rinkinys tinka vyrui, kuris nemėgsta rankdarbių?",
      "Jis tinka tik tada, jei žmogų domina bendra patirtis ir jis sutiks skirti laiko instrukcijai. Jei jis nori dovanos, kurią galima naudoti iš karto ir be pasiruošimo, rinkitės praktiškesnį variantą.",
      "## Išvada",
      "Gera kalėdinė dovana vyrui nėra universali — ji turi atitikti konkretų žmogų. Pradėkite nuo jo įpročių, patikrinkite suderinamumą ir pristatymo laiką, o partneriui apsvarstykite dovaną, kuri sukuria bendrą prisiminimą. Toks pasirinkimas bus naudingesnis už ilgą atsitiktinių idėjų sąrašą.",
    ],
  },
  {
    id: "pl-gift-for-couple",
    siteId: "dovanadladov",
    locale: "pl-PL",
    slug: "prezenty-dla-par",
    title: "Pomysły na osobisty prezent dla pary",
    excerpt: "Prezenty, które pomagają stworzyć wspólne wspomnienie.",
    category: "Prezenty dla par",
    publishAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    publicationState: "published",
    readingMinutes: 6,
    relatedIds: [],
    authorIds: ["kasia-redaktorka"],
    sourceIds: ["source-gift-choice"],
    featuredImage: DEMO_FEATURED_IMAGES.handCasting,
    body: [
      "Najlepszy prezent dla pary nie musi być skomplikowany. Powinien pasować do ich historii i dawać okazję do wspólnego przeżycia.",
      "Zestaw do odlewu dłoni jest dobrym wyborem, gdy chcemy zachować bliskość w formie trwałej pamiątki.",
    ],
  },
  ...NEW_ARTICLES,
  ...SCHEDULED_ARTICLES_2026,
];

export const DEMO_AUTHORS: AuthorRecord[] = [
  {
    id: "dovanos123-redakcija",
    slug: "dovanos123-redakcija",
    name: "Dovanos 123 redakcija",
    role: "Turinio komanda",
    bio: "Rengiame praktiškus dovanų pasirinkimo gidus. Šie straipsniai sukurti pasitelkiant AI, todėl faktus ir prekių informaciją skaitytojams rekomenduojame pasitikrinti prieš perkant.",
    experience: "Temų planavimas, dovanų atrankos kriterijų kūrimas ir viešų šaltinių peržiūra.",
    sameAs: [],
    siteId: "dovanos123",
    locale: "lt-LT",
    kind: "organization",
  },
  {
    id: "aiste-redaktore",
    slug: "aiste-redaktore",
    name: "Aistė Petrauskaitė",
    role: "Dovanų gidų redaktorė",
    bio: "Aistė redaguoja dovanų gidus ir padeda skaitytojams išsirinkti prasmingas dovanas pagal progą, biudžetą ir santykį.",
    experience: "Dovanų idėjų atranka, vartotojo klausimų analizė ir turinio faktų patikra.",
    sameAs: [],
    siteId: "dovanos123",
    locale: "lt-LT",
  },
  {
    id: "kasia-redaktorka",
    slug: "kasia-redaktorka",
    name: "Kasia Nowak",
    role: "Redaktorka poradników prezentowych",
    bio: "Kasia opracowuje praktyczne poradniki prezentowe dla par i rodzin.",
    experience: "Analiza potrzeb odbiorców, porównywanie kryteriów wyboru i lokalizacja treści.",
    sameAs: [],
    siteId: "dovanadladov",
    locale: "pl-PL",
  },
];

export const DEMO_SOURCES: SourceRecord[] = [
  {
    id: "source-memorycasting",
    title: "Memory Casting rankų liejimo rinkinių puslapis",
    publisher: "Memory Casting",
    url: "https://memorycasting.lt/",
    accessedAt: "2026-09-19",
  },
  {
    id: "source-ikea-frame",
    title: "RÖDALM 13×18 cm rėmelis",
    publisher: "IKEA Lietuva",
    url: "https://www.ikea.com/lt/lt/p/roedalm-remelis-berzo-rastas-30548866/",
    accessedAt: "2026-09-23",
  },
  {
    id: "source-ikea-mug",
    title: "DINERA puodelis",
    publisher: "IKEA Lietuva",
    url: "https://www.ikea.com/lt/lt/p/dinera-puodelis-art-60350646/",
    accessedAt: "2026-09-23",
  },
  {
    id: "source-skonis-dovanos",
    title: "Dovanų rinkiniai su arbata ir kava",
    publisher: "Skonis ir kvapas",
    url: "https://www.skonis-kvapas.lt/dovanos",
    accessedAt: "2026-09-23",
  },
  {
    id: "source-pegasas-kuponas",
    title: "Elektroninis dovanų kuponas",
    publisher: "Pegasas",
    url: "https://www.pegasas.lt/dovanu-kuponai/el-dovanu-kuponas-21001319/",
    accessedAt: "2026-09-23",
  },
  {
    id: "source-gift-choice",
    title: "People-first content guidance",
    publisher: "Google Search Central",
    url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    accessedAt: "2026-09-18",
    public: false,
  },
  {
    id: "source-hand-casting",
    title: "Article structured data documentation",
    publisher: "Google Search Central",
    url: "https://developers.google.com/search/docs/appearance/structured-data/article",
    accessedAt: "2026-09-18",
    public: false,
  },
];

export function isLive(article: ArticleRecord, at = Date.now()): boolean {
  // File-backed curated articles reveal at their fixed time without a deploy.
  // Database-backed scheduled articles continue to use publish jobs instead.
  return (article.publicationState === "published" || article.publicationState === "scheduled") && Date.parse(article.publishAt) <= at;
}

export function publishedArticles(
  site: SiteConfig,
  at = Date.now(),
  locale: SupportedLocale = site.defaultLocale,
): ArticleRecord[] {
  return DEMO_ARTICLES.filter(
    (article) => article.siteId === site.id && article.locale === locale && isLive(article, at),
  );
}

export function findArticle(
  site: SiteConfig,
  slug: string,
  at = Date.now(),
  locale: SupportedLocale = site.defaultLocale,
): ArticleRecord | undefined {
  return publishedArticles(site, at, locale).find((article) => article.slug === slug);
}

export function resolveInternalLink(
  site: SiteConfig,
  articleId: string,
  at = Date.now(),
  locale: SupportedLocale = site.defaultLocale,
): { href: string; label: string } | null {
  const target = publishedArticles(site, at, locale).find((article) => article.id === articleId);
  return target ? { href: `/straipsniai/${target.slug}`, label: target.title } : null;
}

export function authorsForArticle(article: ArticleRecord): AuthorRecord[] {
  return article.authorIds
    .map((authorId) => DEMO_AUTHORS.find((author) => author.id === authorId))
    .filter((author): author is AuthorRecord => Boolean(author));
}

export function authorBySlug(site: SiteConfig, slug: string): AuthorRecord | undefined {
  return DEMO_AUTHORS.find((author) => author.siteId === site.id && author.slug === slug);
}

export function articlesForAuthor(site: SiteConfig, authorId: string): ArticleRecord[] {
  return publishedArticles(site).filter((article) => article.authorIds.includes(authorId));
}

export function sourcesForArticle(article: ArticleRecord): SourceRecord[] {
  return article.sourceIds
    .map((sourceId) => DEMO_SOURCES.find((source) => source.id === sourceId))
    .filter((source): source is SourceRecord => Boolean(source && source.public !== false))
}
