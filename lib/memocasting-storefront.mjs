import {memoAvailableProduct,memoAvailableExtra,memoMarketCurrency} from './memocasting-catalog-options.mjs';
import {imageSrcSet,visibleImageCredit} from './niche-media.mjs';
export function memoGalleryImages(media){
 const images=[];
 for(const asset of media){
  if(images.some(a=>a.alt===asset.alt&&Math.abs(a.width/a.height-asset.width/asset.height)<.01))continue;
  const family=media.filter(a=>a.alt===asset.alt&&Math.abs(a.width/a.height-asset.width/asset.height)<.01);
  const largest=family.reduce((a,b)=>a.width>=b.width?a:b,asset);
  images.push({...largest,srcSet:imageSrcSet(media,largest),credit:visibleImageCredit(largest)||''});
 }
 return images;
}
export function memoSelectionTotal(catalog,markets,sku,country,quantity,extras=[]){
 const currency=memoMarketCurrency(markets,country),base=memoAvailableProduct(catalog,sku,country);
 if(!currency||!base||!Number.isInteger(quantity)||quantity<1||quantity>100)return null;
 const selected=[base];
 for(const extra of new Set(extras)){if(extra==='white_paint')continue;const item=memoAvailableExtra(catalog,extra,sku,country);if(!item)return null;selected.push(item);}
 if(selected.some(item=>item.available<quantity))return null;
 const cents=selected.reduce((n,item)=>n+item.prices[country],0)*quantity;
 return Number.isSafeInteger(cents)?{currency,cents}:null;
}
export const memoComparisonLabels={lt:{alginate:'Alginatas',gypsum:'Gipsas',other:'Kitos priemonės',options:'Pasirenkami priedai'},pl:{alginate:'Alginat',gypsum:'Gips',other:'Pozostałe przybory',options:'Opcjonalne dodatki'},lv:{alginate:'Algināts',gypsum:'Ģipsis',other:'Citi piederumi',options:'Papildu piederumi'},et:{alginate:'Alginaat',gypsum:'Kips',other:'Muud vahendid',options:'Valikulised lisad'}};
export const memoStoreLabels={
 lt:{menu:'Atverti meniu',close:'Uždaryti',gallery:'Produkto vaizdai',view:'Apžiūrėti vaizdą',zoom:'Priartinimas',reset:'Pradinis vaizdas',imageLoading:'Įkeliamas vaizdas…',imageError:'Vaizdo nepavyko įkelti.',retry:'Bandyti dar kartą',imageHelp:'Priartinkite ir tempkite vaizdą. Klaviatūra: +, −, rodyklės; 0 — pradinis vaizdas.',comparison:'Palyginkite rinkinius',contents:'Kas yra rinkinyje?',documents:'Prieš pradedant',productInfo:'Rinkinio informacija',total:'Pasirinkimo suma',shippingExtra:'Pristatymas apskaičiuojamas krepšelyje.',checking:'Tikriname kainą ir prieinamumą…',unavailable:'Prieinamumą tikrinkite produkto puslapyje.',catalogError:'Kainos ir prieinamumo nepavyko patikrinti.',noJs:'Pirkimo pasirinkimams įjunkite JavaScript. Rinkinio informaciją ir kontaktus galite peržiūrėti žemiau.'},
 pl:{menu:'Otwórz menu',close:'Zamknij',gallery:'Zdjęcia produktu',view:'Zobacz zdjęcie',zoom:'Powiększenie',reset:'Widok początkowy',imageLoading:'Ładowanie zdjęcia…',imageError:'Nie udało się wczytać zdjęcia.',retry:'Spróbuj ponownie',imageHelp:'Powiększ i przeciągnij zdjęcie. Klawiatura: +, −, strzałki; 0 — widok początkowy.',comparison:'Porównaj zestawy',contents:'Co zawiera zestaw?',documents:'Przed rozpoczęciem',productInfo:'Informacje o zestawie',total:'Suma wyboru',shippingExtra:'Koszt dostawy jest obliczany w koszyku.',checking:'Sprawdzamy cenę i dostępność…',unavailable:'Sprawdź dostępność na stronie produktu.',catalogError:'Nie udało się sprawdzić ceny i dostępności.',noJs:'Włącz JavaScript, aby wybrać opcje zakupu. Informacje o zestawie i kontakt znajdziesz poniżej.'},
 lv:{menu:'Atvērt izvēlni',close:'Aizvērt',gallery:'Produkta attēli',view:'Apskatīt attēlu',zoom:'Tuvinājums',reset:'Sākotnējais skats',imageLoading:'Attēls tiek ielādēts…',imageError:'Attēlu neizdevās ielādēt.',retry:'Mēģināt vēlreiz',imageHelp:'Tuviniet un velciet attēlu. Tastatūra: +, −, bulttaustiņi; 0 — sākotnējais skats.',comparison:'Salīdziniet komplektus',contents:'Kas ir komplektā?',documents:'Pirms sākšanas',productInfo:'Informācija par komplektu',total:'Izvēles summa',shippingExtra:'Piegāde tiek aprēķināta grozā.',checking:'Pārbaudām cenu un pieejamību…',unavailable:'Pieejamību pārbaudiet produkta lapā.',catalogError:'Neizdevās pārbaudīt cenu un pieejamību.',noJs:'Lai izvēlētos pirkuma iespējas, ieslēdziet JavaScript. Informāciju par komplektu un kontaktus skatiet zemāk.'},
 et:{menu:'Ava menüü',close:'Sulge',gallery:'Tootepildid',view:'Vaata pilti',zoom:'Suurendus',reset:'Algvaade',imageLoading:'Pildi laadimine…',imageError:'Pilti ei õnnestunud laadida.',retry:'Proovi uuesti',imageHelp:'Suurendage ja lohistage pilti. Klaviatuur: +, −, nooled; 0 — algvaade.',comparison:'Võrdle komplekte',contents:'Mis on komplektis?',documents:'Enne alustamist',productInfo:'Komplekti teave',total:'Valiku summa',shippingExtra:'Tarnekulu arvutatakse ostukorvis.',checking:'Kontrollime hinda ja saadavust…',unavailable:'Kontrollige saadavust tootelehel.',catalogError:'Hinda ja saadavust ei õnnestunud kontrollida.',noJs:'Ostuvalikute kasutamiseks lubage JavaScript. Komplekti teabe ja kontaktid leiate allpool.'}
};
