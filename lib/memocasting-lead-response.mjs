import {memoRoute} from './memocasting-locales.mjs';
export function memoLeadContext(pages,sourcePath) {
 const page=pages.find(p=>'/'+p.slug===sourcePath&&memoRoute(p).baseSlug==='kontaktai');
 if(!page)return null;
 const route=memoRoute(page);
 if(!pages.some(p=>memoRoute(p).country===route.country&&memoRoute(p).baseSlug==='privatumas'))return null;
 return {language:route.language,home:route.prefix?'/'+route.prefix:'/'};
}
const translations={
 'Užklausos forma šiuo metu nepasiekiama. Parašykite svetainėje nurodytu el. paštu.':[
  'Formularz jest obecnie niedostępny. Napisz na adres e-mail podany na stronie.',
  'Forma pašlaik nav pieejama. Rakstiet uz vietnē norādīto e-pasta adresi.',
  'Vorm pole praegu saadaval. Kirjutage lehel toodud e-posti aadressile.'],
 'Neleidžiama užklausos kilmė.':[
  'Nie można przyjąć pytania z tej strony. Otwórz formularz kontaktowy w naszym sklepie.',
  'No šīs lapas jautājumu nevar pieņemt. Atveriet kontaktformu mūsu veikalā.',
  'Sellelt lehelt ei saa küsimust vastu võtta. Avage meie poe kontaktvorm.'],
 'Patikrinkite formą ir bandykite dar kartą.':[
  'Sprawdź formularz i spróbuj ponownie.','Pārbaudiet formu un mēģiniet vēlreiz.','Kontrollige vormi ja proovige uuesti.'],
 'Užklausa gauta.':['Pytanie zostało przyjęte.','Jautājums saņemts.','Küsimus on vastu võetud.'],
 'Įrašykite vardą, veikiantį el. paštą, bent 20 ženklų žinutę ir pažymėkite sutikimą.':[
  'Podaj imię, prawidłowy adres e-mail i wiadomość o długości co najmniej 20 znaków oraz zaznacz zgodę.',
  'Ievadiet vārdu, derīgu e-pasta adresi un vismaz 20 rakstzīmju ziņu, kā arī atzīmējiet piekrišanu.',
  'Sisestage nimi, kehtiv e-posti aadress ja vähemalt 20 märgi pikkune sõnum ning märkige nõusolek.'],
 'Užklausų sistema laikinai nepasiekiama. Parašykite svetainėje nurodytu el. paštu.':[
  'System pytań jest chwilowo niedostępny. Napisz na adres e-mail podany na stronie.',
  'Jautājumu sistēma īslaicīgi nav pieejama. Rakstiet uz vietnē norādīto e-pasta adresi.',
  'Küsimuste süsteem pole ajutiselt saadaval. Kirjutage lehel toodud e-posti aadressile.'],
 'Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.':[
  'Nie udało się zapisać pytania. Napisz na adres e-mail podany na stronie.',
  'Jautājumu neizdevās saglabāt. Rakstiet uz vietnē norādīto e-pasta adresi.',
  'Küsimust ei õnnestunud salvestada. Kirjutage lehel toodud e-posti aadressile.'],
 'Jūsų žinutė išsaugota ir perduota operatoriaus pašto serveriui. Atsakymui naudosime jūsų nurodytą el. paštą.':[
  'Wiadomość została zapisana i przekazana do serwera pocztowego obsługi sklepu. Odpowiedź wyślemy na podany adres e-mail.',
  'Ziņa saglabāta un nodota veikala apkalpošanas pasta serverim. Atbildei izmantosim jūsu norādīto e-pasta adresi.',
  'Sõnum on salvestatud ja edastatud poe teeninduse meiliserverile. Vastamiseks kasutame teie antud e-posti aadressi.'],
 'Tai vietinės peržiūros bandymas: žinutė išsaugota tik šiame kompiuteryje, o tikras el. laiškas neišsiųstas.':[
  'To test lokalnej wersji: wiadomość zapisano tylko na tym komputerze. Prawdziwy e-mail nie został wysłany.',
  'Tas ir vietējās versijas tests: ziņa saglabāta tikai šajā datorā. Īsts e-pasts nav nosūtīts.',
  'See on kohaliku versiooni test: sõnum on salvestatud ainult sellesse arvutisse. Tegelikku e-kirja ei saadetud.'],
 'Jūsų žinutė išsaugota. Pranešimo el. paštu šiuo metu nepavyko perduoti. Jei užklausa skubi, parašykite svetainėje nurodytu el. paštu.':[
  'Wiadomość została zapisana. Powiadomienia e-mail nie udało się przekazać. Jeśli sprawa jest pilna, napisz na adres e-mail podany na stronie.',
  'Ziņa saglabāta. E-pasta paziņojumu neizdevās nosūtīt. Ja jautājums ir steidzams, rakstiet uz vietnē norādīto e-pasta adresi.',
  'Sõnum on salvestatud. E-posti teadet ei õnnestunud edastada. Kui küsimus on kiire, kirjutage lehel toodud e-posti aadressile.']
};
export function memoLeadText(message,status,context) {
 const language=context?.language??'lt',index=['pl','lv','et'].indexOf(language);
 const titles={lt:['Užklausa gauta','Užklausos nepavyko priimti','Grįžti į pradžią'],pl:['Pytanie zostało przyjęte','Nie udało się przyjąć pytania','Wróć do strony głównej'],lv:['Jautājums saņemts','Jautājumu neizdevās pieņemt','Atgriezties sākumā'],et:['Küsimus on vastu võetud','Küsimust ei õnnestunud vastu võtta','Tagasi avalehele']};
 const copy=titles[language]??titles.lt;
 return {language,home:context?.home??'/',title:copy[status===200?0:1],back:copy[2],message:index<0?message:translations[message]?.[index]??message};
}
