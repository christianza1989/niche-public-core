import type { SupportedLocale } from "./site-config";

export type UiCopy = {
  navGuides: string;
  navCategories: string;
  navAuthors: string;
  navAbout: string;
  headerCta: string;
  homeEyebrow: string;
  homeTitle: string;
  homeLead: string;
  browseGuides: string;
  editorialLink: string;
  trustAuthors: string;
  trustSources: string;
  trustDisclosure: string;
  featuredKicker: string;
  featuredHeading: string;
  allArticles: string;
  editorialSelection: string;
  ideasHeading: string;
  primaryRecommendation: string;
  productLine: string;
  viewProduct: string;
  readGuide: string;
  readMore: string;
  homeFooter: string;
  allGuides: string;
  aboutProject: string;
  home: string;
  sources: string;
  readNext: string;
  quickFind: string;
  categoriesEyebrow: string;
  categoriesHeading: string;
  categoriesNote: string;
  editorialEyebrow: string;
  editorialHeading: string;
  editorialLead: string;
  editorialPolicyLink: string;
  editorialCriteriaTitle: string;
  editorialCriteriaBody: string;
  editorialAuthorsTitle: string;
  editorialAuthorsBody: string;
  editorialDisclosureTitle: string;
  editorialDisclosureBody: string;
};

const LT: UiCopy = {
  navGuides: "Gidai", navCategories: "Kategorijos", navAuthors: "Autoriai", navAbout: "Apie projektą", headerCta: "Mūsų rekomendacija",
  homeEyebrow: "Dovanų idėjos su prasme", homeTitle: "Raskite dovaną, kuri taps prisiminimu.", homeLead: "Atrinkti gidai progoms, žmonėms ir biudžetams. Mažiau atsitiktinių daiktų, daugiau dovanų, kurias norisi prisiminti.", browseGuides: "Naršyti gidus", editorialLink: "Kaip atrenkame rekomendacijas", trustAuthors: "Realūs autoriai", trustSources: "Patikrinti šaltiniai", trustDisclosure: "Aiškus atskleidimas",
  featuredKicker: "Nuo ko pradėti", featuredHeading: "Šios savaitės gidas", allArticles: "Visi straipsniai", editorialSelection: "Atrinkta redakcijos", ideasHeading: "Dovanų idėjos pagal progą", primaryRecommendation: "Pagrindinė rekomendacija", productLine: "Ritualas, kurį atliekate kartu, ir daiktas, kuris primena tą vakarą dar ilgai.", viewProduct: "Peržiūrėti rinkinį", readGuide: "Skaityti gidą", readMore: "Skaityti daugiau", homeFooter: "Dovanų gidai, kurie padeda pasirinkti apgalvotai.", allGuides: "Visi gidai", aboutProject: "Apie projektą", home: "Pradžia", sources: "Šaltiniai", readNext: "Skaitykite toliau",
  quickFind: "Greitai rasti", categoriesEyebrow: "Pagal progą, žmogų ir biudžetą", categoriesHeading: "Raskite kryptį nuo pirmo paspaudimo", categoriesNote: "Kategorijos padeda greitai susiaurinti pasirinkimą, kai žinote kam dovanojate, bet dar nežinote ką.", editorialEyebrow: "Kodėl verta pasitikėti", editorialHeading: "Gidai, kuriuos galima perskaityti prieš perkant.", editorialLead: "Neperrašome parduotuvių katalogų. Kiekviename gide paaiškiname, kam dovana tinka, kada jos geriau nesirinkti ir kokius kriterijus verta pasitikrinti.", editorialPolicyLink: "Skaityti redakcinę politiką", editorialCriteriaTitle: "Aiškūs kriterijai", editorialCriteriaBody: "Biudžetas, santykis, proga ir pasiruošimo laikas — ne migloti pažadai.", editorialAuthorsTitle: "Realūs autoriai", editorialAuthorsBody: "Gidai turi autorių, kontekstą ir atnaujinimo istoriją.", editorialDisclosureTitle: "Skaidrūs ryšiai", editorialDisclosureBody: "Partnerių nuorodos pažymėtos, o rekomendacijos turi savo argumentą.",
};

const PL: UiCopy = {
  navGuides: "Poradniki", navCategories: "Kategorie", navAuthors: "Autorzy", navAbout: "O projekcie", headerCta: "Nasza rekomendacja",
  homeEyebrow: "Pomysły na prezenty z sercem", homeTitle: "Znajdź prezent, który stanie się wspomnieniem.", homeLead: "Praktyczne poradniki na różne okazje, dla różnych osób i budżetów. Mniej przypadkowych zakupów, więcej prezentów z historią.", browseGuides: "Przeglądaj poradniki", editorialLink: "Jak wybieramy rekomendacje", trustAuthors: "Prawdziwi autorzy", trustSources: "Sprawdzone źródła", trustDisclosure: "Jasne ujawnienia",
  featuredKicker: "Na początek", featuredHeading: "Poradnik tygodnia", allArticles: "Wszystkie poradniki", editorialSelection: "Wybrane przez redakcję", ideasHeading: "Pomysły na prezent według okazji", primaryRecommendation: "Główna rekomendacja", productLine: "Wspólne doświadczenie i pamiątka, która przypomina o tym wieczorze przez długi czas.", viewProduct: "Zobacz zestaw", readGuide: "Czytaj poradnik", readMore: "Czytaj więcej", homeFooter: "Poradniki prezentowe, które pomagają wybierać świadomie.", allGuides: "Wszystkie poradniki", aboutProject: "O projekcie", home: "Strona główna", sources: "Źródła", readNext: "Czytaj dalej",
  quickFind: "Znajdź szybko", categoriesEyebrow: "Według okazji, osoby i budżetu", categoriesHeading: "Znajdź kierunek od pierwszego kliknięcia", categoriesNote: "Kategorie pomagają zawęzić wybór, gdy wiesz dla kogo szukasz prezentu, ale nie wiesz jeszcze czego.", editorialEyebrow: "Dlaczego warto nam zaufać", editorialHeading: "Poradniki, które warto przeczytać przed zakupem.", editorialLead: "Nie przepisujemy katalogów sklepów. W każdym poradniku wyjaśniamy, dla kogo prezent pasuje, kiedy lepiej go nie wybierać i jakie kryteria sprawdzić.", editorialPolicyLink: "Przeczytaj politykę redakcyjną", editorialCriteriaTitle: "Jasne kryteria", editorialCriteriaBody: "Budżet, relacja, okazja i czas przygotowania — bez mglistych obietnic.", editorialAuthorsTitle: "Prawdziwi autorzy", editorialAuthorsBody: "Poradniki mają autora, kontekst i historię aktualizacji.", editorialDisclosureTitle: "Jasne relacje", editorialDisclosureBody: "Linki partnerskie są oznaczone, a rekomendacje mają swoje uzasadnienie.",
};

export function getCopy(locale: SupportedLocale): UiCopy {
  return locale === "pl-PL" ? PL : LT;
}
