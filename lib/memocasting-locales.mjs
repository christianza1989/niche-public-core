// Locale comes from an approved route, never from a query parameter or cookie.
export const memoMarkets=[{country:'LT',language:'lt',locale:'lt-LT',prefix:''},{country:'PL',language:'pl',locale:'pl-PL',prefix:'pl'},{country:'LV',language:'lv',locale:'lv-LV',prefix:'lv'},{country:'EE',language:'et',locale:'et-EE',prefix:'et'}];
export function memoRoute(page){
 const parts=page.slug.split('/'),market=memoMarkets.find(m=>m.prefix&&m.prefix===parts[0])??memoMarkets[0];
 return {...market,baseSlug:market.prefix?parts.slice(1).join('/'):page.slug};
}
export function memoPath(route,slug=''){return '/'+[route.prefix,slug].filter(Boolean).join('/');}
export function memoPageRole(page){return memoRoute(page).baseSlug===''?'home':page.type;}
export function memoAlternates(pkg,page,eligiblePages){
 const route=memoRoute(page);if(['cart','checkout','uzsakymas'].includes(route.baseSlug))return [];
 const equivalent=eligiblePages.filter(p=>memoPageRole(p)===memoPageRole(page)&&memoRoute(p).baseSlug===route.baseSlug);
 if(new Set(equivalent.map(p=>memoRoute(p).language)).size<2)return [];
 const links=equivalent.map(p=>({language:memoRoute(p).locale,url:`https://${pkg.canonicalHost}/${p.slug}`}));
 const fallback=equivalent.find(p=>!memoRoute(p).prefix);if(fallback)links.push({language:'x-default',url:`https://${pkg.canonicalHost}/${fallback.slug}`});
 return links;
}
export const memoLabels={
 lt:{catalogue:'Rinkiniai',instruction:'Instrukcija',guides:'Gidai',contact:'Kontaktai',cart:'Krepšelis',skip:'Pereiti prie turinio',trail:'Puslapio kelias',related:'Naudinga toliau',contents:'Šiame gide',sources:'Šaltiniai ir jų taikymo ribos',author:'Parengė',published:'Publikavimo data',reviewed:'Turinys peržiūrėtas',editorial:'Informacinis turinys, rengiamas su AI pagal nurodytus šaltinius.'},
 pl:{catalogue:'Zestawy',instruction:'Instrukcja',guides:'Poradniki',contact:'Kontakt',cart:'Koszyk',skip:'Przejdź do treści',trail:'Ścieżka strony',related:'Czytaj dalej',contents:'W tym poradniku',sources:'Źródła i zakres ich zastosowania',author:'Autor',published:'Data publikacji',reviewed:'Ostatnia weryfikacja treści',editorial:'Treści informacyjne opracowane z pomocą AI na podstawie wskazanych źródeł.'},
 lv:{catalogue:'Komplekti',instruction:'Instrukcija',guides:'Ceļveži',contact:'Kontakti',cart:'Grozs',skip:'Pāriet uz saturu',trail:'Lapas ceļš',related:'Lasiet tālāk',contents:'Šajā ceļvedī',sources:'Avoti un to piemērošanas robežas',author:'Autors',published:'Publicēšanas datums',reviewed:'Saturs pārskatīts',editorial:'Informatīvs saturs, kas sagatavots ar AI palīdzību, izmantojot norādītos avotus.'},
 et:{catalogue:'Komplektid',instruction:'Juhend',guides:'Teabematerjalid',contact:'Kontakt',cart:'Ostukorv',skip:'Mine sisu juurde',trail:'Lehe asukoht',related:'Loe edasi',contents:'Selles juhendis',sources:'Allikad ja nende kohaldamise piirid',author:'Autor',published:'Avaldamise kuupäev',reviewed:'Sisu üle vaadatud',editorial:'Teabesisu, mis on koostatud tehisintellekti abil viidatud allikate põhjal.'}
};
