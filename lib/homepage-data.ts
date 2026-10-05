import type { SupportedLocale } from "./site-config";

export type HomeCategory = {
  slug: string;
  label: string;
  description: string;
  marker: string;
  tone: "sand" | "sage" | "lavender" | "peach";
  articleIds: string[];
};

const LT_CATEGORIES: HomeCategory[] = [
  { slug: "dovanos-porai", label: "Dovanos porai", description: "Idėjos, kurias galima patirti ir prisiminti kartu.", marker: "01", tone: "sage", articleIds: ["lt-christmas-couple", "lt-couple-ideas", "lt-hand-casting-guide", "lt-gifts-couple"] },
  { slug: "dovanos-jam", label: "Dovanos jam", description: "Rinkitės pagal jo pomėgius ir kasdienybę.", marker: "02", tone: "sand", articleIds: ["lt-christmas-man", "lt-gifts-boyfriend", "lt-gifts-father", "lt-gifts-brother"] },
  { slug: "dovanos-jai", label: "Dovanos jai", description: "Asmeniškos idėjos skirtingoms progoms.", marker: "03", tone: "lavender", articleIds: ["lt-christmas-woman-2026", "lt-gifts-girlfriend", "lt-gifts-mother", "lt-gifts-sister"] },
  { slug: "dovanos-seimai", label: "Dovanos šeimai", description: "Bendram laikui ir namų prisiminimams.", marker: "04", tone: "peach", articleIds: ["lt-hand-casting-guide", "lt-christmas-parents-2026", "lt-christmas-family-2026", "lt-gifts-grandparents"] },
  { slug: "gimtadieniui", label: "Gimtadieniui", description: "Kai norisi pradžiuginti apgalvotai.", marker: "05", tone: "sand", articleIds: [] },
  { slug: "vestuviu-metinems", label: "Vestuvių metinėms", description: "Dovanos svarbiai bendrai datai.", marker: "06", tone: "sage", articleIds: ["lt-anniversary", "lt-hand-casting-guide"] },
  { slug: "kaledoms", label: "Kalėdoms", description: "Gidai pagal žmogų, progą ir biudžetą.", marker: "07", tone: "peach", articleIds: ["lt-christmas-hub-2026", "lt-christmas-couple", "lt-christmas-man", "lt-gifts-under-20-2026", "lt-christmas-woman-2026", "lt-christmas-parents-2026", "lt-christmas-family-2026", "lt-christmas-original-2026", "lt-christmas-friends-2026"] },
  { slug: "personalizuotos-dovanos", label: "Personalizuotos dovanos", description: "Prisiminimai su jūsų pačių istorija.", marker: "08", tone: "lavender", articleIds: ["lt-hand-casting-guide", "lt-hand-casting", "lt-gifts-personalized", "lt-gifts-sentimental"] },
  { slug: "dovanos-draugei", label: "Dovanos draugei", description: "Maži gestai ir didesnės staigmenos.", marker: "09", tone: "lavender", articleIds: ["lt-gifts-female-friend", "lt-christmas-friends-2026"] },
  { slug: "dovanos-draugui", label: "Dovanos draugui", description: "Praktiškos idėjos pagal jo pomėgius.", marker: "10", tone: "sage", articleIds: ["lt-christmas-man", "lt-gifts-male-friend", "lt-christmas-friends-2026"] },
  { slug: "iki-20-euru", label: "Iki 20 €", description: "Mintis svarbesnė už sumą.", marker: "11", tone: "sand", articleIds: ["lt-gifts-under-20-2026"] },
  { slug: "25-50-euru", label: "25–50 €", description: "Apgalvotos dovanos aiškiam biudžetui.", marker: "12", tone: "peach", articleIds: [] },
];

const PL_CATEGORIES: HomeCategory[] = [
  { slug: "prezenty-dla-par", label: "Prezenty dla par", description: "Wspólny czas i trwałe wspomnienia.", marker: "01", tone: "sage", articleIds: ["pl-gift-for-couple"] },
  { slug: "prezenty-dla-niego", label: "Prezenty dla niego", description: "Pomysły dopasowane do jego zainteresowań.", marker: "02", tone: "sand", articleIds: [] },
  { slug: "prezenty-dla-niej", label: "Prezenty dla niej", description: "Uważnie wybrane upominki.", marker: "03", tone: "lavender", articleIds: [] },
  { slug: "prezenty-dla-rodziny", label: "Prezenty dla rodziny", description: "Pomysły na wspólny czas.", marker: "04", tone: "peach", articleIds: [] },
  { slug: "na-urodziny", label: "Na urodziny", description: "Na osobisty dzień.", marker: "05", tone: "sand", articleIds: [] },
  { slug: "na-rocznice", label: "Na rocznicę", description: "Na ważną wspólną datę.", marker: "06", tone: "sage", articleIds: [] },
  { slug: "na-swieta", label: "Na święta", description: "Przemyślane pomysły świąteczne.", marker: "07", tone: "peach", articleIds: [] },
  { slug: "personalizowane", label: "Personalizowane", description: "Prezenty z własną historią.", marker: "08", tone: "lavender", articleIds: ["pl-gift-for-couple"] },
];

export function getHomeCategories(locale: SupportedLocale): HomeCategory[] {
  return locale === "pl-PL" ? PL_CATEGORIES : LT_CATEGORIES;
}

