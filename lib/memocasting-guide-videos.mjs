import assets from './memocasting-video-assets.json' with {type:'json'};

// Only already-public, owner-provided media from the homepage registry. A clip
// appears at its matching approved section, not as a generic article advert.
export const memoGuideVideoSections={
 'gidai/kaledines-dovanos':['Kai dovana kuriama: įteikimo diena ir užbaigimo diena','moment-282d2ce760b0'],
 'gidai/kaledines-dovanos-moterims':['Partnerė: jos noras ir jūsų abiejų laikas','moment-0c0c93d01b2d'],
 'gidai/kaledines-dovanos-mamai':['Rankų liejinys su mama: ką tiksliai dovanosite?','moment-c23ac33c4808'],
 'gidai/kaledines-dovanos-vyrams':['Asmeninė dovana partneriui: procesas ar rezultatas?','moment-bb2a60639bac'],
 'gidai/kaledines-dovanos-teciui':['Bendra rankų kompozicija','moment-95ee30e4b4bf'],
 'gidai/kaledines-dovanos-tevams':['Bendras prisiminimas: kaip parodyti abiejų tėvų istoriją?','moment-933ec44ee453'],
 'gidai/kaledines-dovanos-porai':['Neatidarytas rinkinys, bendras vakaras ar užbaigta skulptūra?','moment-2e7a942ef0b6'],
 'gidai/kaledines-dovanos-seimai':['Rankų liejimo šeimai planas: nuo idėjos iki vietos namuose','moment-cc535bb7cdfb'],
 'gidai/dovanos-moterims':['Kaip išrinkti bendrą veiklą moteriai, kuri vertina laiką kartu?','moment-b0c8222c1a41'],
 'gidai/dovanos-mamai':['Kūrybinė dovana mamai: trys skirtingi galutiniai rezultatai','moment-7199258dc355'],
 'gidai/dovana-porai':['Kaip gimsta rankų liejinys ir kiek etapų reikės suplanuoti?','moment-bb2a60639bac'],
 'gidai/dovana-seimai':['Kaip šeimai suplanuoti kūrimą ir užbaigimą?','moment-cc535bb7cdfb'],
};

export function memoGuideVideo(page,heading){
 if(page?.siteId!=='memocasting'||page.type!=='guide')return null;
 const selected=memoGuideVideoSections[page.slug];
 if(!selected||selected[0]!==heading||!page.body?.some(b=>b.type==='heading'&&b.text===heading))return null;
 const item=assets.items.find(item=>item.id===selected[1]);
 if(!item)return null;
 return {...item,poster:item.variants.find(p=>p.width===360)?.src??item.variants[0]?.src};
}
