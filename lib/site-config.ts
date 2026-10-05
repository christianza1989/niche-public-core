export type SupportedLocale = "lt-LT" | "lv-LV" | "et-EE" | "pl-PL";

export type LocaleConfig = {
  code: SupportedLocale;
  label: string;
  hreflang: string;
  pathPrefix: string;
  enabled: boolean;
};

export type SiteConfig = {
  id: string;
  name: string;
  domains: string[];
  defaultLocale: SupportedLocale;
  currency: "EUR" | "PLN";
  timezone: string;
  languageName: string;
  locales: LocaleConfig[];
  accent: string;
  productUrl: string;
  productName: string;
  description: string;
};

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  dovanos123: {
    id: "dovanos123",
    name: "Dovanos 123",
    domains: ["dovanos123.lt", "www.dovanos123.lt", "localhost"],
    defaultLocale: "lt-LT",
    currency: "EUR",
    timezone: "Europe/Vilnius",
    languageName: "Lietuvių",
    locales: [
      { code: "lt-LT", label: "Lietuvių", hreflang: "lt-LT", pathPrefix: "", enabled: true },
      { code: "lv-LV", label: "Latviešu", hreflang: "lv-LV", pathPrefix: "lv", enabled: false },
      { code: "pl-PL", label: "Polski", hreflang: "pl-PL", pathPrefix: "pl", enabled: false },
    ],
    accent: "#f06f4f",
    productUrl: "https://memorycasting.lt/",
    productName: "Rankų liejimo rinkinys",
    description: "Prasmingų dovanų pasirinkimo vadovas poroms, šeimai ir artimiems žmonėms.",
  },
  dovanuletas: {
    id: "dovanuletas",
    name: "Dovanėlės",
    domains: ["dovaneles.lt", "www.dovaneles.lt"],
    defaultLocale: "lt-LT",
    currency: "EUR",
    timezone: "Europe/Vilnius",
    languageName: "Lietuvių",
    locales: [
      { code: "lt-LT", label: "Lietuvių", hreflang: "lt-LT", pathPrefix: "", enabled: true },
    ],
    accent: "#4d7cfe",
    productUrl: "https://memorycasting.lt/",
    productName: "Rankų liejimo rinkinys",
    description: "Idėjos dovanoms, kurios turi istoriją ir išlieka ilgiau nei viena proga.",
  },
  dovanadladov: {
    id: "dovanadladov",
    name: "Dovana dla Dov",
    domains: ["dovanadladov.pl", "www.dovanadladov.pl"],
    defaultLocale: "pl-PL",
    currency: "PLN",
    timezone: "Europe/Warsaw",
    languageName: "Polski",
    locales: [
      { code: "pl-PL", label: "Polski", hreflang: "pl-PL", pathPrefix: "", enabled: true },
      { code: "lt-LT", label: "Lietuvių", hreflang: "lt-LT", pathPrefix: "lt", enabled: false },
    ],
    accent: "#bd3d67",
    productUrl: "https://memorycasting.lt/",
    productName: "Zestaw do odlewu dłoni",
    description: "Pomysły na osobiste prezenty dla par i rodzin.",
  },
};

export function resolveSite(host?: string | null): SiteConfig {
  const normalized = (host ?? "").toLowerCase().split(":")[0];
  return (
    Object.values(SITE_CONFIGS).find((site) => site.domains.includes(normalized)) ??
    SITE_CONFIGS.dovanos123
  );
}

export function siteOrigin(site: SiteConfig, forwardedHost?: string | null): string {
  const requestHost = forwardedHost?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (requestHost.startsWith("localhost") || requestHost.startsWith("127.0.0.1")) {
    return `http://${requestHost}`;
  }
  return `https://${site.domains[0]}`;
}

export function localeToHtmlLang(locale: SupportedLocale): string {
  return locale.slice(0, 2).toLowerCase();
}

export function localizedPath(site: SiteConfig, locale: SupportedLocale, path = "/"): string {
  const localeConfig = site.locales.find((item) => item.code === locale);
  const prefix = localeConfig?.pathPrefix ? `/${localeConfig.pathPrefix}` : "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${normalizedPath === "/" ? "/" : normalizedPath}`;
}

export function localeAlternates(site: SiteConfig, origin: string, path = "/"): Record<string, string> {
  return Object.fromEntries(
    site.locales
      .filter((locale) => locale.enabled)
      .map((locale) => [locale.hreflang, `${origin}${localizedPath(site, locale.code, path)}`]),
  );
}
