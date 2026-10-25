import {memoRoute,memoPath,memoLabels} from './memocasting-locales.mjs';
import {memoHomepageAdmitted} from './memocasting-homepage-markup.mjs';

const copy={
 lt:{discover:'Atraskite',pair:'Rinkinys porai',family:'Šeimos rinkinys',support:'Pagalba',castingHelp:'Pagalba liejant',sculptures:'Skulptūros',gallery:'Galerija',payment:'Atsiskaitymas',available:'Galimi mokėjimo būdai pateikiami atsiskaitymo metu.',test:'Įjungtas tik testinis Stripe atsiskaitymas. Tikri pinigai nenuskaitomi.',unavailable:'Mokėjimai šiuo metu neįjungti.'},
 pl:{discover:'Odkryj',pair:'Zestaw dla pary',family:'Zestaw rodzinny',support:'Pomoc',castingHelp:'Pomoc przy odlewaniu',payment:'Płatności',available:'Dostępne metody płatności są wyświetlane podczas składania zamówienia.',test:'Włączono wyłącznie testowe płatności Stripe. Prawdziwe środki nie są pobierane.',unavailable:'Płatności są obecnie niedostępne.'},
 lv:{discover:'Atklājiet',pair:'Komplekts pārim',family:'Ģimenes komplekts',support:'Palīdzība',castingHelp:'Palīdzība liešanā',payment:'Apmaksa',available:'Pieejamie maksāšanas veidi tiek parādīti pasūtījuma noformēšanas laikā.',test:'Ieslēgti tikai Stripe testa maksājumi. Nauda netiek iekasēta.',unavailable:'Maksājumi pašlaik nav pieejami.'},
 et:{discover:'Avasta',pair:'Komplekt paarile',family:'Perekomplekt',support:'Abi',castingHelp:'Abi valamisel',payment:'Maksmine',available:'Saadaolevad makseviisid kuvatakse tellimuse vormistamisel.',test:'Lubatud on ainult Stripe’i testmaksed. Päris raha ei võeta.',unavailable:'Maksed ei ole praegu saadaval.'}
};
export function memoFooterCopy(language='lt'){return copy[language]??copy.lt;}

// Only the host/time-filtered projection may supply navigation destinations.
export function memoFooterGroups(page,eligiblePages){
 const route=memoRoute(page),labels=memoLabels[route.language],text=memoFooterCopy(route.language);
 const local=eligiblePages.filter(p=>memoRoute(p).language===route.language);
 const links=entries=>entries.flatMap(([slug,label])=>local.some(p=>memoRoute(p).baseSlug===slug)?[{href:memoPath(route,slug),label}]:[]);
 const discover=links([['collections/all',labels.catalogue],['products/liejimo-rinkinys-porai',text.pair],['products/seimos-rinkinys-1',text.family]]);
 if(route.language==='lt'&&local.some(memoHomepageAdmitted))discover.push({href:'/#skulpturos',label:text.sculptures},{href:'/#galerija',label:text.gallery});
 return [
  {title:text.discover,links:discover},
  {title:text.support,links:links([['pages/instrukcija',labels.instruction],['gidai',labels.guides],['pagalba',text.castingHelp],['kontaktai',labels.contact],['pristatymas',labels.delivery],['grazinimas',labels.returns]])},
  {title:labels.information,links:links([['dovanos',labels.gifts],['apie-projekta',labels.about],['redakcija',labels.editors],['privatumas',labels.privacy],['naudojimo-salygos',labels.terms],['products/alginato-papildymas-650g-dvieju-ranku-rinkiniui',labels.refill],['products/kudikio-pedutes',labels.baby]])}
 ].filter(group=>group.links.length);
}
