import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { verifySnapshot, sha256 } from "./dovanos123-snapshot.mjs";

const paragraph = text => ({ type: "paragraph", text });
const heading = text => ({ type: "heading", level: 2, text });
const link = (text, pageId) => ({ type: "richParagraph", content: [{ type: "link", text, target: { kind: "page", pageId } }] });
export function supportPageDefinitions(author) {
  return [
    { id: "gift-home", type: "home", slug: "", title: "Gera dovana prasideda nuo žmogaus.", description: "Raskite idėją pagal progą, pomėgius ir jūsų ryšį. Aiškūs gidai padės išsirinkti tai, kuo žmogus iš tikrųjų džiaugsis.", body: [paragraph("Dovaną vertiname pagal gavėją, progą, biudžetą ir pasiruošimo laiką. Aptariame ne tik idėjos privalumus, bet ir kada jos geriau nesirinkti."), paragraph("Gidai rengiami pasitelkiant AI. Nepriskiriame jiems išgalvotos asmeninės patirties ar produktų testų. Mūsų komerciniai ryšiai nurodomi atskirai.")], homeMedia: true },
    { id: "gift-articles", type: "index", slug: "straipsniai", title: "Dovanų gidai", description: "Praktiškos dovanų idėjos pagal gavėją, progą ir biudžetą.", body: [paragraph("Rinkitės gidą pagal žmogų, kuriam dovanojate. Kategorijos rodo tik jau paskelbtus straipsnius.")] },
    { id: "gift-authors", type: "index", slug: "autoriai", title: "Redakcija ir autorystė", description: "Kas atsakingas už Dovanos123 dovanų gidus ir kaip juose naudojamas AI.", body: [paragraph("Straipsnių autorystė gali būti priskirta tikram organizacijos redakciniam projektui. AI yra turinio rengimo įrankis, ne išgalvotas žmogus ar kvalifikuotas ekspertas."), link("Apie redakcijos darbą", "gift-editorial-policy")] },
    { id: "gift-about", type: "about", slug: "apie", title: "Dovanų pasirinkimas be triukšmo.", description: "Dovanos123 — dovanų pasirinkimo informacinis portalas.", body: [heading("Ką rasite čia?"), paragraph("Apžvelgiame dovanas pagal progą, santykį, biudžetą ir pasiruošimo laiką. Gidų paskirtis — padėti susiaurinti pasirinkimą, o ne pakeisti prekybininko informaciją."), heading("Kaip rengiamas turinys"), paragraph("Naudojame AI tyrimo, juodraščio ir redakcinės patikros darbuose. Tai nereiškia, kad produktus asmeniškai išbandė žmogus. Nepriklausomą patirtį ar ekspertinę citatą nurodome tik turėdami tikrą šaltinį."), heading("Komerciniai ryšiai"), paragraph("Memory Casting yra savininko rankų liejimo rinkinių projektas. Dovanos123 nėra šio produkto checkout: produkto informacija ir pirkimas priklauso atskirai svetainei."), link("Komercinių ryšių atskleidimas", "gift-disclosure"), link("Susisiekite dėl pataisymų", "gift-contact")] },
    { id: "gift-contact", type: "contact", slug: "kontaktai", title: "Kontaktai ir pataisymai", description: "Praneškite apie netikslumą ar pasiūlykite naudingą dovanų pasirinkimo temą.", body: [paragraph("Rašydami dėl netikslumo pridėkite straipsnio adresą, konkrečią taisytiną vietą ir, jei turite, pirminio šaltinio nuorodą. Nesiųskite mokėjimo kortelės duomenų, slaptažodžių ar jautrios asmeninės informacijos."), paragraph("Dovanos123 netvarko užsakymų išorinių prekybininkų vardu. Dėl produkto užsakymo, pristatymo ar grąžinimo kreipkitės į jį parduodantį prekybininką.")], checks: ["Patikrinti tikro info@pinet.lt laiško gavimą bei operatoriaus kontaktų veikimą; tai nėra automatinės formos ar pristatymo įrodymas."] },
    { id: "gift-editorial-policy", type: "policy", slug: "redakcine-politika", title: "Kaip rengiame ir tikriname gidus.", description: "Naudingas, patikrinamas ir sąžiningai pateiktas turinys.", body: [heading("Klausimas ir atrankos kriterijai"), paragraph("Prieš rengiant gidą apibrėžiame skaitytojo klausimą, gavėją, progą, biudžetą ir praktinius apribojimus. Rekomendacija turi paaiškinti, kam idėja tinka ir kada jos nesirinkti."), heading("AI ir atsakomybė"), paragraph("Turinio rengimo bei atskiros redakcinės peržiūros darbus gali atlikti AI agentai. Organizacijos autorystė nėra žmogaus asmeninio testavimo įrodymas. Nekuriame fiktyvių žmonių, kvalifikacijų, citatų, pirkėjų ar bandymų."), heading("Šaltiniai"), paragraph("Prekės faktus siejame su aktualia pirminio šaltinio informacija. Skaitytojo šaltinių sąraše rodome temai svarbius šaltinius, o ne vidines SEO instrukcijas. Jei kainos ar prieinamumo nepatikrinome, neteigiame, kad jie galioja."), heading("Publikavimas ir pakeitimai"), paragraph("Juodraštis publikuojamas tik po atskiros jo versijos patikros ir nustatytu laiku. Grafiko data nėra senos publikacijos įrodymas. Reikšmingo atnaujinimo datą nurodome tik pakeitus ar iš naujo patikrinus turinį."), heading("Pataisymai"), link("Pranešti apie klaidą", "gift-contact")] },
    { id: "gift-disclosure", type: "policy", slug: "partneriu-nuorodu-atskleidimas", title: "Komercinių ryšių atskleidimas", description: "Kaip atskiriame dovanų rekomendacijas nuo savo produkto reklamos.", body: [heading("Mūsų produkto nuorodos"), paragraph("Memory Casting rankų liejimo rinkiniai yra šio portalo savininko projektas. Nuorodą į jį vertinkite kaip komercinę rekomendaciją, ne nepriklausomo bandymo išvadą."), heading("Kitų parduotuvių nuorodos"), paragraph("Nuoroda į kito prekybininko svetainę savaime nereiškia partnerystės ar komisinio. Jei konkrečiai nuorodai būtų taikomas komisinis arba turinys būtų remiamas, tai turėtų būti pažymėta prie rekomendacijos."), heading("Kainos ir sąlygos"), paragraph("Galutinę kainą, likutį, pristatymą, grąžinimą bei sutarties sąlygas tikrinkite prekybininko svetainėje. Šis portalas nepriima mokėjimų jo vardu."), link("Redakciniai atrankos kriterijai", "gift-editorial-policy")] },
    { id: "gift-privacy", type: "policy", slug: "privatumas", title: "Privatumo politika", description: "Privati rengiamo pranešimo versija; dar ne paleidimui paruošta politika.", body: [heading("Duomenų valdytojas"), paragraph("Dovanų informacinio portalo operatorius bendro tinklo konfigūracijoje: MB Pinet; kontaktas info@pinet.lt. Produkto pardavėjo politika nėra šio portalo politika."), heading("Faktinė tvarkymo apimtis"), paragraph("Prieš viešinimą šį pranešimą būtina susieti su realiu hostingu, saugumo žurnalais, kontaktų gavimu, saugojimu, gavėjais bei ištrynimo procesu. Naujai migruojamam portalui automatinės išorinės žinutės, balso asistentas ir reklamos integracijos nėra savaime įjungiamos."), heading("Dar nepatvirtinta"), paragraph("Tikslūs saugojimo terminai, tvarkymo pagrindai, duomenų gavėjai, perdavimai ir realus teisių įgyvendinimo kelias turi būti dokumentuoti pagal faktinę produkcijos konfigūraciją. Šis juodraštis nepatvirtina jų įgyvendinimo.")], checks: ["LAUNCH BLOCKER: užbaigti teisėtai tikslų pranešimą pagal faktinį duomenų inventorių ir aktualią pirminę teisės informaciją; jokio approval šiai juodraščio versijai."] },
    { id: "gift-cookies", type: "policy", slug: "slapukai", title: "Slapukai ir pasirinkimai", description: "Privatus konfigūracijai pritaikomos informacijos juodraštis.", body: [paragraph("Prieš publikavimą reikia inventorizuoti realiai nustatomus slapukus, saugyklas ir trečiųjų šalių skriptus, įskaitant saugumo priemones. Negalima teigti, kad svetainėje nėra slapukų, to nepatikrinus produkcijoje."), paragraph("Analitika ir reklama neturi būti įjungta vien dėl migracijos. Jei bus naudojamos nebūtinos technologijos, joms reikės faktinei geografijai ir naudojimui tinkamo pasirinkimo bei jo atšaukimo.")], checks: ["LAUNCH BLOCKER: produkcijos cookie/storage/script inventorius ir atitinkamas pranešimas nepatikrinti; šios versijos neapprove."] },
    { id: "gift-terms", type: "policy", slug: "taisykles", title: "Naudojimo taisyklės", description: "Portalo turinio paskirtis ir išorinių prekybininkų pasiūlymai.", body: [heading("Informacinė paskirtis"), paragraph("Gidai padeda rinktis dovanos idėją. Jie nėra individuali medicininė, teisinė ar finansinė konsultacija ir nežada konkretaus pirkimo rezultato."), heading("Išorinės svetainės"), paragraph("Patekę į prekybininko svetainę vadovaukitės jos taisyklėmis, privatumo informacija ir realiomis pirkimo sąlygomis. Dovanos123 nėra išorinio prekybininko užsakymų tvarkytojas."), heading("Pataisymai ir turinio naudojimas"), paragraph("Prašydami leidimo naudoti portalo turinį arba pranešdami apie klaidą susisiekite su portalo operatoriumi."), link("Kontaktai", "gift-contact")], checks: ["Prieš launch patikrinti galutinę operatoriaus informaciją ir teisinių sąlygų atitikimą faktinei veiklai."] },
    { id: "gift-editorial-profile", type: "author", slug: "autoriai/dovanos123-redakcija", title: author.name, description: author.role, body: [paragraph(author.bio), heading("Autorystės ribos"), paragraph("Redakcijos vardas nurodo portalo turinio atsakomybę. Jis nėra atskiro žmogaus, mokslinės kvalifikacijos ar produkto išbandymo teiginys."), link("Turinio rengimo politika", "gift-editorial-policy")], author: true },
    { id: "gift-retired-demo-profile", type: "policy", slug: "autoriai/aiste-redaktore", title: "Redakcijos informacija", description: "Ankstesnio demonstracinio autoriaus profilio adresas.", body: [paragraph("Šis adresas buvo naudotas demonstraciniam autoriaus profiliui. Asmens tapatybė ir jo kompetencijos nebuvo patvirtintos, todėl šis puslapis nepristato jo kaip tikro eksperto."), link("Tikra portalo redakcijos informacija", "gift-editorial-profile")], checks: ["Išlaikomas senas URL be išgalvoto asmens schema. Patikrinti ir dokumentuoti šešių senų byline korekcijas prieš viešinant susijusius straipsnius."] },
  ];
}

export async function addSupportPages({ capture, studioRoot, dataDir }) {
  const manifest = verifySnapshot(capture);
  const data = JSON.parse(await fs.readFile(path.join(capture, "legacy-data.json"), "utf8"));
  const originalAuthor = data.authors.find(author => author.kind === "organization");
  if (!originalAuthor) throw new Error("A real organizational editorial attribution is required.");
  const { id, slug, name, role, bio, kind, sameAs, siteId, locale } = originalAuthor;
  const author = { id, slug, name, role, bio, kind, sameAs, siteId, locale };
  const model = await import(pathToFileURL(path.join(studioRoot, "src/model.mjs")).href);
  if (path.resolve(model.DATA) !== path.resolve(dataDir)) throw new Error("Unexpected studio DATA.");
  const receiptFile = path.join(dataDir, "gift-migrations/dovanos123-support.json");
  const lockFile = path.join(dataDir, "gift-migrations/dovanos123.lock");
  await fs.mkdir(path.dirname(lockFile), { recursive: true });
  const lock = await fs.open(lockFile, "wx").catch(() => { throw new Error("Gift migration already locked; inspect the owning process before retry."); });
  await lock.writeFile(JSON.stringify({ pid: process.pid, kind: "support-pages", capture, createdAt: new Date().toISOString() }));
  try {
  let receipt;
  try { receipt = JSON.parse(await fs.readFile(receiptFile, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  receipt ??= { siteId: "dovanos123", capture: manifest.capturedAt, approved: false, activated: false, assets: {}, pages: {} };
  if (receipt.capture !== manifest.capturedAt) throw new Error("Support pages belong to a different capture.");
  const save = async () => { await fs.writeFile(receiptFile + ".tmp", JSON.stringify(receipt, null, 2) + "\n"); await fs.rename(receiptFile + ".tmp", receiptFile); };
  const site = await model.getSite("dovanos123");
  if (site.schemaVersion !== 2 || site.renderer !== "gift") throw new Error("Gift v2 site required.");
  for (const definition of supportPageDefinitions(author)) {
    const collision = site.pages.find(page => page.id === definition.id || page.slug === definition.slug);
    if (collision && !receipt.pages[definition.id]) throw new Error(`Unreceipted support-page collision: ${definition.id}`);
  }
  const results = [];
  for (const definition of supportPageDefinitions(author)) {
    if (receipt.pages[definition.id]) {
      const current = (await model.getSite("dovanos123")).pages.find(page => page.id === definition.id);
      if (!current) throw new Error(`Support page disappeared: ${definition.id}`);
      if (!current.intent && model.revisionHash(current) === receipt.pages[definition.id].revisionHash && !current.approval && !current.publishedRevision) {
        const repaired = await model.editPage("dovanos123", current.id, { intent: definition.title });
        receipt.pages[current.id].repairs ??= [];
        receipt.pages[current.id].repairs.push({ reason: "missing-required-draft-intent", previousRevisionHash: receipt.pages[current.id].revisionHash });
        receipt.pages[current.id].revisionHash = model.revisionHash(repaired);
        await save();
        results.push({ id: current.id, status: "repaired-private-intent" });
        continue;
      }
      results.push({ id: definition.id, status: model.revisionHash(current) === receipt.pages[definition.id].revisionHash ? "unchanged" : "preserved-edited-revision" });
      continue;
    }
    let imageIds = [];
    if (definition.homeMedia) for (const [src, alt] of [["/images/home/hand-casting-together.webp", "Pora kartu kuria rankų liejinį prie namų stalo"], ["/images/home/thoughtful-gift.webp", "Apgalvotai supakuota dovana su atviruku"]]) {
      if (!receipt.assets[src]) {
        const bytes = await fs.readFile(path.join(capture, "media", src));
        const asset = await model.saveResponsiveAsset("dovanos123", { mime: "image/webp", alt, credit: "", rights: "Esama projekto redakcinė iliustracija; kilmę ir teises patikrinti prieš approval.", prompt: `Išsaugota originali homepage iliustracija ${src}; capture ${manifest.capturedAt}; originalus prompt nepatvirtintas.` }, bytes);
        receipt.assets[src] = { id: asset.id, sourceHash: sha256(bytes), variants: asset.variants.map(item => item.id) };
        await save();
      }
      imageIds.push(receipt.assets[src].id);
    }
    const editorial = { category: "Svetainės informacija", readingMinutes: 2, authors: definition.author ? [author] : [], sources: [], datePublished: null, dateModified: null, productRecommendation: false, featuredImageId: imageIds[0] ?? null, relatedPageIds: [], commerceTargets: [] };
    const body = [...definition.body, ...(imageIds[1] ? [{ type: "image", assetId: imageIds[1] }] : [])];
    const page = await model.addPage("dovanos123", { ...definition, intent: definition.title, publishAt: manifest.capturedAt, body, editorial });
    const final = await model.editPage("dovanos123", page.id, { editorial, media: imageIds.map(id => ({ id })), factChecks: ["Privatus migracijos juodraštis: atskira teksto ir faktų patikra prieš approval.", ...(definition.checks || []), ...(definition.homeMedia ? ["Patikrinti dviejų homepage iliustracijų kilmę, teises, vizualų tinkamumą ir mobilius crop."] : [])] });
    receipt.pages[page.id] = { revisionHash: model.revisionHash(final), slug: page.slug, public: false };
    await save();
    results.push({ id: page.id, status: "created-private-draft" });
  }
  return { siteId: "dovanos123", approved: false, activated: false, pages: results, receiptFile };
  } finally {
    await lock.close();
    await fs.unlink(lockFile);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), value = flag => args[args.indexOf(flag) + 1];
  for (const flag of ["--capture", "--studio-root", "--data-dir"]) if (!args.includes(flag)) throw new Error(`Required ${flag}`);
  const dataDir = path.resolve(value("--data-dir"));
  process.env.STUDIO_DATA_DIR = dataDir;
  console.log(JSON.stringify(await addSupportPages({ capture: path.resolve(value("--capture")), studioRoot: path.resolve(value("--studio-root")), dataDir }), null, 2));
}
