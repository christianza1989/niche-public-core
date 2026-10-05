// Reviewed source revisions for a private candidate. No approval or deployment occurs here.
const p = text => ({ type: "paragraph", text });
const h = (text, level = 2) => ({ type: "heading", level, text });
const list = (...items) => ({ type: "list", items });
const text = value => ({ type: "text", text: value });
const pageLink = (label, pageId) => ({ type: "link", text: label, target: { kind: "page", pageId } });
const external = (label, url) => ({ type: "link", text: label, target: { kind: "external", url } });
const rich = (...content) => ({ type: "richParagraph", content });
export const INITIAL_GIFT_ARTICLES = ["lt-hand-casting-guide", "lt-christmas-couple", "lt-christmas-man"];
export const INITIAL_GIFT_SUPPORT = ["gift-home", "gift-articles", "gift-authors", "gift-about", "gift-contact", "gift-editorial-policy", "gift-disclosure", "gift-editorial-profile"];
export const GIFT_REVIEW_IDS = [...INITIAL_GIFT_ARTICLES, ...INITIAL_GIFT_SUPPORT];
export const SOURCES = {
  memory: { id: "source-memorycasting", title: "Memory Casting: rankų liejimo rinkinių informacija", publisher: "Memory Casting", url: "https://memorycasting.lt/" },
  frame: { id: "source-ikea-rodalm", title: "IKEA RÖDALM: rėmelis, 13 × 18 cm", publisher: "IKEA Lietuva", url: "https://www.ikea.com/lt/lt/p/roedalm-remelis-berzo-rastas-30548866/" },
  mug: { id: "source-ikea-dinera", title: "IKEA DINERA: puodelis, 30 cl", publisher: "IKEA Lietuva", url: "https://www.ikea.com/lt/lt/p/dinera-puodelis-smeline-60350646/" },
  books: { id: "source-pegasas-giftcards", title: "Pegasas: dovanų kuponų kategorija", publisher: "Pegasas", url: "https://www.pegasas.lt/dovanu-kuponai/" },
};
const disclosure = () => p("Komercinis ryšys: Memory Casting yra šio portalo savininko rankų liejimo rinkinių projektas. Nuorodos į jį yra komercinės rekomendacijos, ne nepriklausomo produkto bandymo išvados. Nuorodos į kitas parduotuves savaime nereiškia partnerystės.");
const limits = () => p("Atranka paremta dovanos tinkamumo kriterijais ir nurodytais pirminiais puslapiais, ne asmeniniu produktų testu. Kainų, likučių, šventinių pristatymo terminų ir kuponų sąlygų čia nefiksuojame: tikrinkite juos pas pardavėją prieš užsakydami. Iliustracijos yra teminės, ne konkrečių prekybininkų prekių nuotraukos.");
function handGuide() {
  return [
    p("Rankų liejimo rinkinys gali būti gera dovana porai, kuri norėtų ką nors sukurti kartu ir pasilikti bendrą prisiminimą. Tačiau tai nėra paruošta skulptūra: dovanos gavėjai turės perskaityti instrukciją, pasiruošti darbo vietą ir dalyvauti procese. Jei jiems tokia veikla nepatinka, geriau rinktis kitą idėją."),
    p("Šis gidas padeda apsispręsti prieš perkant: ką tikrinti rinkinio aprašyme, kaip suplanuoti bendrą veiklą ir kokius klausimus užduoti pardavėjui. Tai nėra konkretaus rinkinio darbo ar saugos instrukcija. Nepriskiriame jam patirties, kurios neturime, ir nežadame tokio rezultato, kokį rodo iliustracija."),
    disclosure(),
    h("Trumpas sprendimas: rinktis ar nerinktis?"),
    list("Svarstyti verta, jei abu gavėjai nori bendro kūrybinio projekto ir turi kur laikyti rezultatą.", "Nerinkite vien dėl romantiškos išvaizdos, jei vienas žmogus nemėgsta rankdarbių ar nenori liesti formavimo medžiagų.", "Atidėkite pirkimą, jei aprašyme nėra komplektacijos, aiškių instrukcijų ar konkretaus produkto naudojimo ribų.", "Jei dovaną būtina panaudoti iškart po išpakavimo, paprastesnis pasirinkimas gali būti paruošta nuotrauka, knyga ar iš anksto suderinta patirtis."),
    h("Kas yra rankų liejimas — ir kuo skiriasi du jo etapai?"),
    p("Produkto informacijos puslapyje Memory Casting aprašo du skirtingus dalykus: rankų formos paruošimą ir jos užpildymą liejimo medžiaga. Pirmame etape gaunama forma, kitame — būsimas liejinys. Šis skirtumas svarbus skaitant komplektaciją: vien formavimo medžiaga dar nėra visa dovana."),
    p("Skirtingų rinkinių medžiagos, jų kiekiai, naudojimo tvarka ir laikai gali skirtis. Mūsų aprašymas yra bendras orientyras, todėl neperkelkite vieno gamintojo recepto kitam rinkiniui. Tikslūs santykiai, vandens temperatūra ir visi darbo žingsniai turi būti imami iš jūsų konkretaus produkto instrukcijos."),
    h("Septyni dalykai, kuriuos patikrinti prieš užsakant"),
    list("Kompozicija. Kiek ir kokių rankų telpa į gamintojo nurodytą talpą? „Porai“ ar „šeimai“ nėra pakankamai tikslus atsakymas kiekvienai situacijai.", "Komplektacija. Atskirai išsirašykite, kas įeina į pakuotę ir ką reikės pasiruošti patiems. Talpa, maišymo priemonės ar pagrindas ne visada būna komplekte.", "Instrukcija. Ar prieš pirkimą galite sužinoti darbo eigą ir pasiruošimo poreikius? Ar gavėjai supras jos kalbą?", "Naudojimo ribos. Paprašykite konkretaus produkto saugos informacijos ir amžiaus apribojimų. Šis gidas nevertina tinkamumo vaikams, kūdikiams ar jautriai odai.", "Vieta ir laikas. Ar gavėjai galės ramiai atlikti procesą, sutvarkyti darbo vietą ir palikti rezultatą gamintojo nurodytam laikui?", "Galutinio objekto vieta. Ar liejinys bus pastatomas, ar jam reikės atskiro pagrindo? Įvertinkite jų namų erdvę, ne tik pakuotės dydį.", "Visa dovanos kaina. Įtraukite pristatymą ir reikalingus papildomus daiktus. Nepirkite remdamiesi vien senoje nuotraukoje nurodyta nuolaida."),
    h("Pasiruošimo planas be spėjamų instrukcijų"),
    p("Pirmiausia perskaitykite visą komplekte pateiktą instrukciją. Ant lapo susirašykite reikalingas priemones ir užduotis: darbo vieta, rankų padėtis, pagalba, laiko stebėjimas ir vieta rezultatui. Tokia tvarka leidžia pastebėti trūkstamą daiktą dar nepradėjus darbo."),
    list("Pasitikrinkite, kad gavėjai iš tikrųjų nori dalyvauti: bendra veikla nėra gera staigmena, jei vienas žmogus jaučiasi spaudžiamas.", "Pasirinkite dieną be skubėjimo. Planuokite ne tik darbą, bet ir pasiruošimą, tvarkymą bei gamintojo nurodytus laukimo etapus.", "Instrukcijoje susiraskite, ką būtina paruošti prieš atidarant medžiagas. Neimprovizuokite proporcijų ar darbo laiko.", "Jeigu kuri nors naudojimo ar saugos sąlyga neaiški, išsiaiškinkite ją su pardavėju prieš pradedant, o ne proceso viduryje."),
    h("Kaip suprasti proceso eigą"),
    p("Bendra logika — paruošti formą, ją atlaisvinti gamintojo numatytu būdu, užpildyti ir sulaukti nurodyto kietėjimo bei džiūvimo. Tai nėra keturi savarankiški mūsų siūlomi darbo žingsniai: konkretaus rinkinio instrukcija gali turėti papildomų etapų. Jei jos neturite, iš šio straipsnio darbo nepradėkite."),
    p("Nusprendę dovanoti rinkinį, įteikite jį su trumpu asmeniniu paaiškinimu: kodėl pasirinkote bendrą veiklą ir kada būtų smagu ją išbandyti. Nepaverskite siūlomos datos įsipareigojimu — gavėjai turi galėti pasirinkti sau patogų laiką."),
    h("Klaidų prevencija: ką galima nuspręsti dar prieš liejimą"),
    list("Per mažai informacijos: rinkinio nuotrauka nepakeičia tikslaus aprašymo ir instrukcijos. Trūkstamus atsakymus gaukite prieš pirkimą.", "Netinkama kompozicija: norimą rankų padėtį sulyginkite su gamintojo pateiktais dydžio apribojimais, o ne su kito rinkinio reklama.", "Per anksti suplanuotas įteikimas: rinkinio gavimas ir paruoštos skulptūros įteikimas yra du skirtingi terminai.", "Neaptarta pagalba: jei instrukcijoje reikalingas pagalbininkas, iš anksto susitarkite, kas padės.", "Kataloginio rezultato lūkestis: individualios rankos ir procesas reiškia individualų rezultatą. Teminė iliustracija nėra kokybės ar tikslaus panašumo pažadas."),
    h("Alternatyvos, jei rankų liejimas netinka"),
    p("Jei gavėjai vertina prisiminimus, bet nenori kūrybinio proceso, galima įrėminti bendrą nuotrauką su trumpu laišku. Jei jiems trūksta laiko, apsvarstykite veiklą, kurios datą galės pasirinkti patys. Skirtumas nėra „geresnė“ ar „blogesnė“ dovana — skiriasi įsitraukimas, erdvė ir pasiruošimas."),
    rich(text("Šventinei progai palyginkite "), pageLink("kalėdinių dovanų porai pasirinkimus", "lt-christmas-couple"), text(". Jei dovanojate partneriui, "), pageLink("dovanų vyrui Kalėdoms gidas", "lt-christmas-man"), text(" padės įvertinti ir praktiškesnes alternatyvas.")),
    h("Dažniausi pasirinkimo klausimai"),
    h("Ar tokia dovana tinka metinėms?", 3), p("Gali tikti, jei abu žmonės vertina bendrą kūrybinę veiklą ir norės saugoti rezultatą. Vien metinių proga nepasako, ar rinkinys jiems tinkamas — patikrinkite šiuos du dalykus prieš pirkdami."),
    h("Ar galima dovanoti dar nežinant, kada jie liejimą atliks?", 3), p("Taip svarstyti galima, bet prieš užsakydami pasiteiraukite apie konkrečių medžiagų laikymo sąlygas ir naudojimo terminus. Nerašome universalaus galiojimo laiko, nes jis priklauso nuo produkto."),
    h("Kiek užtruks ir ar medžiagos tinka visiems?", 3), p("Šiame gide to konkrečiam rinkiniui nepatvirtinome. Reikalinga gamintojo instrukcija ir saugos informacija. Nelaikykite bendro „saugu“ reklaminio sakinio individualaus tinkamumo įrodymu."),
    h("Kur skaityti apie savininko rinkinį?", 3), rich(text("Rinkinių informaciją rasite "), { type: "link", text: "Memory Casting puslapyje", target: { kind: "commerce", targetId: "memorycasting-information" } }, text(". Sprendimą dėl konkretaus rinkinio priimkite perskaitę jo komplektaciją bei naudojimo informaciją.")),
    limits(),
  ];
}
function rewriteText(body, replacements) {
  const visit = value => Array.isArray(value) ? value.map(visit) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === "text" && typeof item === "string" ? replacements.reduce((result, [from, to]) => result.replaceAll(from, to), item) : visit(item)])) : value;
  return visit(body);
}
function stripPending(body, allowed, losses) {
  return body.map((block, blockIndex) => {
    const nodes = (content, itemIndex = null) => content.map((node, nodeIndex) => {
      if (node.type === "link" && node.target.kind === "page" && !allowed.has(node.target.pageId)) {
        losses.push({ reason: "candidate-excludes-unreviewed-page", blockIndex, itemIndex, nodeIndex, label: node.text, target: node.target.pageId });
        return text(node.text);
      }
      return node;
    });
    return block.content ? { ...block, content: nodes(block.content) } : block.type === "richList" ? { ...block, items: block.items.map((item, i) => nodes(item, i)) } : block;
  });
}
export function makeGiftEditorialCandidate(site, { assets, reviewedAt, commerce }) {
  const allowed = new Set(GIFT_REVIEW_IDS), result = [], losses = [];
  const author = site.pages.find(page => page.id === "gift-editorial-profile")?.editorial.authors[0];
  if (!author || author.kind !== "organization" || author.siteId !== "dovanos123") throw new Error("Actual organizational editorial profile required.");
  const source = key => ({ ...SOURCES[key], accessedAt: reviewedAt, public: true });
  for (const id of GIFT_REVIEW_IDS) {
    const page = site.pages.find(item => item.id === id);
    if (!page) throw new Error(`Missing candidate page: ${id}`);
    let body = structuredClone(page.body), editorial = structuredClone(page.editorial), media = page.media.map(item => ({ id: item.id }));
    const externalLinks = [], metadata = {};
    editorial.datePublished = null;
    editorial.dateModified = reviewedAt;
    editorial.commerceTargets = [];
    editorial.productRecommendation = false;
    editorial.relatedPageIds = editorial.relatedPageIds.filter(target => allowed.has(target));
    editorial.sources = [];
    if (INITIAL_GIFT_ARTICLES.includes(id)) {
      editorial.authors = [structuredClone(author)];
      editorial.sources = [source("memory")];
      editorial.commerceTargets = [structuredClone(commerce)];
      editorial.productRecommendation = true;
      editorial.relatedPageIds = INITIAL_GIFT_ARTICLES.filter(target => target !== id);
      const image = assets[id === "lt-hand-casting-guide" ? "hand" : id === "lt-christmas-couple" ? "couple" : "man"];
      media = [{ id: image.id }]; editorial.featuredImageId = image.id;
      if (id === "lt-hand-casting-guide") {
        body = handGuide();
        metadata.title = "Rankų liejimo rinkinys dovanai: kaip išsirinkti ir kam jis tinka";
        metadata.description = "Praktinis pasirinkimo gidas: kam tinka rankų liejimo dovana, ką tikrinti komplektacijoje ir kaip suplanuoti bendrą veiklą. Ne gamintojo darbo instrukcija.";
        metadata.intent = "Padėti prieš pirkimą įvertinti rankų liejimo rinkinio tinkamumą gavėjui ir pasirinkimo kriterijus; nepakeisti konkretaus produkto naudojimo ar saugos instrukcijos.";
      }
      else {
        body = rewriteText(body, [
          ["Šiame gide pateikiu konkretų būdą susiaurinti pasirinkimą, palyginu dovanų tipus ir paaiškinu", "Šiame gide pateikiame konkretų būdą susiaurinti pasirinkimą, palyginame dovanų tipus ir paaiškiname"],
          ["Įtraukiau ir dovanas", "Įtraukiame ir dovanas"], ["Kolegei ar draugui", "Kolegai ar draugui"],
          ["konkretaus prekės", "konkrečios prekės"],
          ["Patirtį galima padaryti konkrečią: įrašykite datą kalendoriuje, pridėkite užkandžių arba parašykite, kodėl norite, kad pora tą vakarą praleistų kartu. Taip kuponas tampa planu, o ne tik pažadu.", "Patirtį galima padaryti asmenišką: pridėkite palinkėjimą ir parašykite, kodėl ją pasirinkote. Datą įrašykite tik iš anksto suderinę su pora, arba leiskite ją pasirinkti patiems gavėjams."],
          ["viena prasmingiausių kalėdinių dovanų", "svarstytina kalėdinė dovana"],
          ["Iki 30 € dažniausiai tinka nedidelis teminis rinkinys ar simbolinė detalė, tačiau verta investuoti į pateikimą ir asmeninį palinkėjimą. 30–80 € segmente galima rinktis kokybišką namų daiktą, patirtį su kuponu arba mažesnį personalizuotą gaminį.", "Pirmiausia nusistatykite savo ribą, pavyzdžiui, 30 € arba 80 €, ir iš jos atimkite pristatymo bei pateikimo išlaidas. Tai planavimo pavyzdžiai, ne pažadas, kad konkretus produktas tilps į šias sumas."],
          ["Iki 30 € galima sudaryti teminį rinkinį, 30–80 € segmente rinktis kokybišką pomėgio daiktą arba patirtį, o didesniam biudžetui verta ieškoti ilgaamžio produkto ar personalizuoto prisiminimo.", "Nusistatykite savo kainos ribą ir į ją įtraukite pristatymą bei reikalingus priedus. 30 € ar 80 € gali būti jūsų planavimo ribos, tačiau jos negarantuoja konkrečios prekės ar patirties pasiūlymo."],
        ]);
        // Remove obsolete closing paragraph rather than invite readers to an unreviewed guide.
        if (id === "lt-christmas-couple") body = body.filter(block => !block.content?.some(node => node.type === "link" && node.target?.pageId === "lt-gifts-couple") && !(block.type === "richHeading" && block.content.map(node => node.text).join("") === "Išvada"));
        body.splice(2, 0, disclosure());
        body.push(h("Konkretūs pavyzdžiai, kuriuos galima palyginti"));
        if (id === "lt-christmas-couple") {
          body.push(rich(external("IKEA RÖDALM 13 × 18 cm rėmelis", SOURCES.frame.url), text(" — pavyzdys porai, kuri norėtų išsaugoti bendrą nuotrauką be rankdarbių proceso. Prieš spausdindami patikrinkite nuotraukos dydį ir pasparto naudojimą konkrečiame aprašyme. Nepirkite, jei jų namuose jau nėra vietos dar vienam rėmeliui.")));
          editorial.sources.push(source("frame")); externalLinks.push({ url: SOURCES.frame.url, label: "IKEA RÖDALM rėmelis", reason: "Pirminis konkretaus 13 × 18 cm nuotraukos rėmelio aprašymas; kainos ir likučio netvirtiname.", verified: true });
        } else {
          body.push(rich(external("IKEA DINERA 30 cl puodelis", SOURCES.mug.url), text(" — paprasto kavos ritualo pavyzdys, ne mūsų išbandytas ar universalus „geriausias“ puodelis. Pirmiau įvertinkite, ar jis naudoja tokios talpos puodelį ir ar dar vienas daiktas iš tiesų reikalingas. Kavos pasirinkimą derinkite prie jo įpročių, ne prie gražios pakuotės.")));
          editorial.sources.push(source("mug")); externalLinks.push({ url: SOURCES.mug.url, label: "IKEA DINERA puodelis", reason: "Pirminis konkretaus 30 cl puodelio aprašymas; nefiksuojame kainų, akcijų ir likučių.", verified: true });
        }
        body.push(rich(external("Pegaso dovanų kuponų pasirinkimas", SOURCES.books.url), text(" — alternatyva skaitytojui, kurio norimos knygos nežinote. Tai kategorijos, ne vieno konkretaus kupono nuoroda. Prieš pirkimą atskirai patikrinkite sumą, galiojimą, panaudojimo vietą ir gavimo būdą; negalime pažadėti momentinio pristatymo.")));
        editorial.sources.push(source("books")); externalLinks.push({ url: SOURCES.books.url, label: "Pegaso dovanų kuponai", reason: "Pirminė kuponų kategorija; konkretaus kupono sąlygos šiame gide nepatvirtintos.", verified: true });
        body.push(rich(text("Jei svarstote bendrą kūrybinį prisiminimą, prieš užsakydami perskaitykite "), pageLink("rankų liejimo rinkinio pasirinkimo gidą", "lt-hand-casting-guide"), text(". Kitam gavėjui gali praversti "), pageLink(id === "lt-christmas-couple" ? "dovanų vyrui Kalėdoms atranka" : "kalėdinių dovanų porai palyginimas", id === "lt-christmas-couple" ? "lt-christmas-man" : "lt-christmas-couple"), text(".")), limits());
      }
      editorial.readingMinutes = Math.max(1, Math.ceil(JSON.stringify(body).split(/\s+/).length / 200));
    } else if (id === "gift-home") {
      body = body.filter(block => block.type !== "image");
      body.push(disclosure(), { type: "image", assetId: assets.man.id });
      media = [{ id: assets.hand.id }, { id: assets.man.id }];
      editorial.featuredImageId = assets.hand.id;
      editorial.commerceTargets = [structuredClone(commerce)]; editorial.productRecommendation = true;
    } else if (id === "gift-articles") {
      body.push(p("Pradėkite nuo gavėjo, progos ir pasiruošimo laiko. Giduose lyginame idėjų tinkamumą, nurodome, kada jų nesirinkti, ir pateikiame klausimus, kuriuos verta užduoti prieš užsakant. Atranka nėra produktų bandymų ar kainų reitingas."));
    } else if (id === "gift-about") {
      body = rewriteText(body, [["Dovanos123 nėra šio produkto checkout: produkto informacija ir pirkimas priklauso atskirai svetainei.", "Dovanos123 nėra šio produkto atsiskaitymo svetainė. Memory Casting puslapį laikome informacijos šaltiniu; tai nėra patvirtinimas, kad parduotuvė šiuo metu priima užsakymus."]]);
    }
    const pageLosses = [];
    body = stripPending(body, allowed, pageLosses); losses.push(...pageLosses.map(loss => ({ id, ...loss })));
    for (const target of page.editorial.relatedPageIds) if (!allowed.has(target)) losses.push({ id, reason: "unreviewed-related-page-withdrawn", target });
    for (const link of page.links) if (!allowed.has(link.targetPageId)) losses.push({ id, reason: "unreviewed-link-table-target-withdrawn", target: link.targetPageId, label: link.label });
    // Old body replaced completely: record all excluded original references as well.
    for (const block of page.body) for (const node of block.content || (block.type === "richList" ? block.items.flat() : [])) if (node.type === "link" && node.target.kind === "page" && !allowed.has(node.target.pageId) && !losses.some(loss => loss.id === id && loss.target === node.target.pageId && loss.label === node.text)) losses.push({ id, reason: "old-unreviewed-reference-withdrawn-in-reviewed-revision", target: node.target.pageId, label: node.text });
    result.push({ id, previousTitle: page.title, input: { ...metadata, body, editorial, media, links: [], externalLinks, factChecks: ["Laukiama atskiro kito AI agento būtent šios teksto, šaltinių ir medijos revizijos peržiūros; šis kandidatas dar nepatvirtintas publikavimui."] } });
  }
  return { changes: result, losses, author, candidateIds: GIFT_REVIEW_IDS };
}
