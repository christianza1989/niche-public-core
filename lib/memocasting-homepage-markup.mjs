// Trusted LT narrative; its permanent text is bound to the official Studio body.
export const memoHomepageIntro="\n  <a class=\"skip-link\" href=\"#turinys\">Pereiti prie turinio</a>\n  <header class=\"site-header\"><a class=\"brand\" href=\"#pradzia\" aria-label=\"Memory Casting, pradžia\"><img src=\"/memocasting-homepage/v1/media/logo.webp\" alt=\"Memory Casting\" width=\"1000\" height=\"300\"></a></header>\n  <nav class=\"navigation-dock\" aria-label=\"Pagrindinė navigacija\">\n    <div class=\"dock-links\"><a href=\"#pradzia\" aria-current=\"location\">Pradžia</a><a href=\"#rinkiniai\">Rinkiniai</a><a href=\"#procesas\">Procesas</a><a href=\"#skulpturos\">Skulptūros</a></div>\n    <button id=\"motion-toggle\" type=\"button\" aria-pressed=\"false\" aria-label=\"Išjungti judesį\" hidden><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 7h14M5 12h14M5 17h14\"/><circle cx=\"9\" cy=\"7\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"12\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"9\" cy=\"17\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/></svg><span class=\"motion-label\">Be judesio</span></button>\n    <a class=\"dock-action\" href=\"#rinkiniai\">Sukurti prisiminimą <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a>\n  </nav>\n  ";
export const memoHomepageStory="<section class=\"hero\" id=\"pradzia\" aria-labelledby=\"hero-title\">\n      <div class=\"hero-visual\"><img class=\"hero-image\" src=\"/memocasting-homepage/v1/media/hero-egeon-wide-v3-1600.webp\" srcset=\"/memocasting-homepage/v1/media/hero-egeon-wide-v3-640.webp 640w, /memocasting-homepage/v1/media/hero-egeon-wide-v3-800.webp 800w, /memocasting-homepage/v1/media/hero-egeon-wide-v3-1200.webp 1200w, /memocasting-homepage/v1/media/hero-egeon-wide-v3-1600.webp 1600w\" sizes=\"100vw\" width=\"1600\" height=\"900\" alt=\"Memory Casting rinkinys ir balta susikibusių rankų skulptūra\" fetchpriority=\"high\" decoding=\"async\"></div>\n      <div class=\"hero-copy\">\n        <h1 id=\"hero-title\"><span class=\"hero-line\">Akimirka, kuri lieka.</span></h1>\n        <p>Rankų liejimo rinkiniai porai ir šeimai.<br>Sukurkite savo bendros akimirkos skulptūrą.</p>\n        <a class=\"text-link hero-buy\" href=\"#rinkiniai\">Pasirinkti rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a><a class=\"hero-action\" href=\"#procesas\">Pamatyti procesą <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a>\n      </div>\n      <a class=\"hero-scroll\" href=\"#procesas\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3v17m-6-6 6 6 6-6\"/></svg><span>Slinkite. Istorija prasideda čia.</span></a>\n    </section>\n<section class=\"meaning home-section\" id=\"akimirkos\" aria-labelledby=\"meaning-title\"><div class=\"meaning-inner\"><h2 id=\"meaning-title\" data-reveal=\"lines\">Ką norite<br>pasilikti?</h2><div><p class=\"reveal-text\" data-scroll-words>Diena praeina. Prisilietimas lieka. Susikibkite rankomis ir išsaugokite savo bendros akimirkos formą.</p><div class=\"home-tabs\" role=\"group\" aria-label=\"Jūsų akimirka\" hidden data-enhanced><button type=\"button\" data-moment=\"couple\" aria-pressed=\"true\">Dviese</button><button type=\"button\" data-moment=\"family\" aria-pressed=\"false\">Su šeima</button><button type=\"button\" data-moment=\"gift\" aria-pressed=\"false\">Dovanai</button></div><article data-moment-panel=\"couple\"><h3>Bendras vakaras dviese.</h3><p>Skirkite laiko vienas kitam ir sukurkite skulptūrą kartu.</p><a class=\"text-link\" href=\"@@PAIR@@\">Atrasti poros rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article><article data-moment-panel=\"family\"><h3>Akimirka su šeima.</h3><p>Pasirinkite kompoziciją, kuri primins jūsų artumą. Prieš pradėdami patikrinkite rinkinio instrukciją.</p><a class=\"text-link\" href=\"@@FAMILY@@\">Atrasti šeimos rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article><article data-moment-panel=\"gift\"><h3>Dovana, kurią kuriate kartu.</h3><p>Padovanokite progą susitikti ir išsaugoti bendrą prisiminimą.</p><a class=\"text-link\" href=\"#rinkiniai\">Pasirinkti dovaną <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article></div></div></section>\n<section class=\"products home-section\" id=\"rinkiniai\" aria-labelledby=\"products-title\"><div class=\"section-heading\"><h2 id=\"products-title\" data-reveal=\"lines\">Kam kursite<br>prisiminimą?</h2><p data-reveal=\"rise\">Pasirinkite poros ar šeimos rinkinį ir susikurkite prisiminimą kartu.</p></div><div class=\"product-grid\"><article class=\"product\" data-reveal=\"image\"><div class=\"product-visual\"><img class=\"couple-product\" src=\"/memocasting-homepage/v1/media/couple-cast-v1.webp\" alt=\"Poros susikibusių rankų skulptūros įkvėpimo iliustracija\" width=\"960\" height=\"1212\" loading=\"lazy\" decoding=\"async\"></div><div class=\"product-heading\"><h3>Rinkinys porai</h3><span class=\"home-price\" data-price-sku=\"couple\" aria-live=\"polite\">Kaina produkto puslapyje.</span></div><p>Alginato pakelis, 1 200 g gipso, kibiras ir maišymo pagaliukai.</p><a class=\"text-link\" href=\"@@PAIR@@\">Peržiūrėti poros rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a><button class=\"price-retry\" data-price-retry hidden type=\"button\">Pakartoti kainos patikrą</button></article><article class=\"product\" data-reveal=\"image\"><div class=\"product-visual\"><img class=\"\" src=\"/memocasting-homepage/v1/media/family-cast-v1.webp\" alt=\"Šeimos rankų skulptūros įkvėpimo iliustracija\" width=\"960\" height=\"1212\" loading=\"lazy\" decoding=\"async\"></div><div class=\"product-heading\"><h3>Šeimos rinkinys</h3><span class=\"home-price\" data-price-sku=\"family\" aria-live=\"polite\">Kaina produkto puslapyje.</span></div><p>Du alginato ir du gipso pakeliai bei maišymo pagaliukai.</p><a class=\"text-link\" href=\"@@FAMILY@@\">Peržiūrėti šeimos rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a><button class=\"price-retry\" data-price-retry hidden type=\"button\">Pakartoti kainos patikrą</button></article></div><p class=\"image-note\">Rinkinių vaizdai — įkvėpimo iliustracijos. Tikslią komplektaciją tikrinkite pasirinkto rinkinio apraše.</p></section>\n<section class=\"story\" id=\"procesas\" aria-label=\"Kaip gimsta jūsų rankų skulptūra\">\n      <div class=\"story-stage\">\n        <div class=\"story-copy\">\n          <article class=\"chapter is-active\" data-start=\"0\" data-label=\"Rinkinys\"><div class=\"chapter-text\"><h2><span id=\"viskas-ko-reikia-viename-rinkinyje\">Viskas, ko reikia.<br>Viename rinkinyje.</span></h2><p>Rinkinyje — alginatas, gipsas ir maišymo pagaliukai. Poros rinkinio baltus dažus galite pasirinkti papildomai. Tikslią kiekvieno rinkinio sudėtį rasite jo apraše.</p></div><img class=\"chapter-art\" src=\"/memocasting-homepage/v1/media/white-film-v1/chapter-1.webp\" width=\"800\" height=\"450\" alt=\"Liejimo rinkinio turinys virš atidaryto kibirėlio\" loading=\"lazy\"></article>\n          <article class=\"chapter\" data-start=\"5\" data-label=\"Mišinys\"><div class=\"chapter-text\"><h2><span id=\"truputis-vandens-pradzia-prisiminimui\">Truputis vandens.<br>Pradžia prisiminimui.</span></h2><p>Alginatas sumaišomas su vandeniu. Rožinė masė netrukus išsaugos jūsų rankų atspaudą.</p></div><img class=\"chapter-art\" src=\"/memocasting-homepage/v1/media/white-film-v1/chapter-2.webp\" width=\"800\" height=\"450\" alt=\"Mikseris maišo rožinį alginato mišinį\" loading=\"lazy\"></article>\n          <article class=\"chapter\" data-start=\"8.2\" data-label=\"Atspaudas\"><div class=\"chapter-text\"><h2><span id=\"jusu-gestas-jo-atspaudas\">Jūsų gestas.<br>Jo atspaudas.</span></h2><p>Susikibkite rankomis ir panardinkite jas į paruoštą alginatą. Jam sustingus, rankas atsargiai ištraukite po vieną.</p></div><img class=\"chapter-art\" src=\"/memocasting-homepage/v1/media/white-film-v1/chapter-3.webp\" width=\"800\" height=\"450\" alt=\"Rankos panardintos į rožinį alginatą\" loading=\"lazy\"></article>\n          <article class=\"chapter\" data-start=\"11.8\" data-label=\"Gipsas\"><div class=\"chapter-text\"><h2><span id=\"akimirka-igauna-forma\">Akimirka<br>įgauna formą.</span></h2><p>Į likusį atspaudą supilamas atskirai paruoštas gipso mišinys. Leiskite jam sustingti pagal rinkinio instrukciją.</p></div><img class=\"chapter-art\" src=\"/memocasting-homepage/v1/media/white-film-v1/chapter-4.webp\" width=\"800\" height=\"450\" alt=\"Alginato ertmės užpildytos baltu gipso mišiniu\" loading=\"lazy\"></article>\n          <article class=\"chapter\" data-start=\"15.2\" data-label=\"Atidengimas\"><div class=\"chapter-text\"><h2><span id=\"atidengiamas-jusu-prisiminimas\">Atidengiamas<br>jūsų prisiminimas.</span></h2><p>Nuimkite kibirėlį ir atsargiai pašalinkite alginatą dalimis. Po juo — jūsų rankų skulptūra.</p></div><img class=\"chapter-art\" src=\"/memocasting-homepage/v1/media/white-film-v1/chapter-5.webp\" width=\"800\" height=\"450\" alt=\"Rožinė alginato forma pašalinama dalimis, atidengiant rankų skulptūrą\" loading=\"lazy\"></article>\n          <article class=\"chapter\" data-start=\"19.2\" data-label=\"Prisiminimas\"><div class=\"chapter-text\"><h2><span id=\"jusu-rankos-jusu-istorija\">Jūsų rankos.<br>Jūsų istorija.</span></h2><p>Iš bendros akimirkos — prisiminimas, kuriam atsiras vieta jūsų namuose.</p><a class=\"text-link\" href=\"#skulpturos\">Apžiūrėti skulptūrų idėjas <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></div><img class=\"chapter-art\" src=\"/memocasting-homepage/v1/media/white-film-v1/chapter-6.webp\" width=\"800\" height=\"450\" alt=\"Baigta balta dviejų susikibusių rankų skulptūra\" loading=\"lazy\"></article>\n        </div>\n        <div class=\"film-surface\" aria-hidden=\"true\"><img id=\"film-poster\" src=\"/memocasting-homepage/v1/media/white-film-v1/desktop-poster.webp\" width=\"1280\" height=\"720\" alt=\"\" decoding=\"async\"><video id=\"story-video\" muted playsinline preload=\"none\" width=\"1280\" height=\"720\" tabindex=\"-1\" data-desktop=\"/memocasting-homepage/v1/media/white-film-v1/desktop.mp4\" data-mobile=\"/memocasting-homepage/v1/media/white-film-v1/mobile.mp4\"></video></div>\n        <div class=\"story-navigation\" hidden><div class=\"story-status\"><span id=\"stage-count\">01 / 06</span><span>Jūsų slinkimas kuria istoriją.</span></div><div class=\"chapter-navigation\" role=\"group\" aria-label=\"Proceso etapai\"><div class=\"story-progress\" aria-hidden=\"true\"><span></span></div><button type=\"button\" data-time=\"0\" aria-pressed=\"true\" aria-label=\"1 etapas: rinkinys\"><span>01</span><span>Rinkinys</span></button><button type=\"button\" data-time=\"5\" aria-pressed=\"false\" aria-label=\"2 etapas: mišinys\"><span>02</span><span>Mišinys</span></button><button type=\"button\" data-time=\"8.2\" aria-pressed=\"false\" aria-label=\"3 etapas: atspaudas\"><span>03</span><span>Atspaudas</span></button><button type=\"button\" data-time=\"11.8\" aria-pressed=\"false\" aria-label=\"4 etapas: gipsas\"><span>04</span><span>Gipsas</span></button><button type=\"button\" data-time=\"15.2\" aria-pressed=\"false\" aria-label=\"5 etapas: atidengimas\"><span>05</span><span>Atidengimas</span></button><button type=\"button\" data-time=\"19.2\" aria-pressed=\"false\" aria-label=\"6 etapas: prisiminimas\"><span>06</span><span>Prisiminimas</span></button></div></div>\n      </div>\n      <p id=\"media-error\" role=\"status\" hidden>Video nepavyko įkelti. Visą procesą galite peržiūrėti paveikslėliuose ir aprašymuose.</p>\n    </section>\n<section class=\"sculpture-showroom\" id=\"skulpturos\" aria-labelledby=\"sculptures-title\"><div class=\"sculpture-copy\"><h2 id=\"sculptures-title\" data-reveal=\"lines\">Jūsų ryšys.<br>Jūsų forma.</h2><p data-reveal=\"rise\">Dviejų rankų prisilietimas ar šeimos akimirka. Atraskite gestą, kurį norėtumėte išsaugoti.</p><div class=\"home-tabs\" role=\"group\" aria-label=\"Skulptūrų idėjos\" hidden data-enhanced><button type=\"button\" data-sculpture=\"couple\" aria-pressed=\"true\">Pora</button><button type=\"button\" data-sculpture=\"family\" aria-pressed=\"false\">Šeima</button></div><div class=\"sculpture-cta\" data-sculpture-link=\"couple\"><a class=\"button\" href=\"@@PAIR@@\">Atrasti poros rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></div><div class=\"sculpture-cta\" data-sculpture-link=\"family\"><a class=\"button\" href=\"@@FAMILY@@\">Atrasti šeimos rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></div></div><div class=\"sculpture-stage\" data-memo-sculpture-stage><figure data-sculpture-panel=\"couple\" data-reveal=\"image\"><img class=\"\" src=\"/memocasting-homepage/v1/media/couple-cast-v1.webp\" alt=\"Poros rankų gesto įkvėpimo iliustracija\" width=\"960\" height=\"1212\" loading=\"lazy\" decoding=\"async\"><figcaption>Poros gestas. Įkvėpimo iliustracija.</figcaption></figure><figure data-sculpture-panel=\"family\" data-reveal=\"image\"><img class=\"\" src=\"/memocasting-homepage/v1/media/family-cast-v1.webp\" alt=\"Šeimos rankų kompozicijos įkvėpimo iliustracija\" width=\"960\" height=\"1212\" loading=\"lazy\" decoding=\"async\"><figcaption>Šeimos kompozicija. Įkvėpimo iliustracija.</figcaption></figure></div></section>\n<section class=\"kit-contents home-section\" id=\"sudetis\" aria-labelledby=\"contents-title\"><div class=\"section-heading\"><h2 id=\"contents-title\" data-reveal=\"lines\">Viskas prasideda<br>nuo jūsų.</h2><p data-reveal=\"rise\">Susipažinkite su rinkinio priemonėmis ir pasiruoškite bendrai veiklai.</p></div><div class=\"contents-layout\"><div class=\"material-type\" aria-hidden=\"true\" data-reveal=\"rise\"><span>Alginatas.</span><span>Gipsas.</span><span>Prisilietimas.</span></div><div><div class=\"home-tabs\" role=\"group\" aria-label=\"Rinkinio sudėtis\" hidden data-enhanced><button type=\"button\" data-kit=\"couple\" aria-pressed=\"true\">Porai</button><button type=\"button\" data-kit=\"family\" aria-pressed=\"false\">Šeimai</button></div><article data-kit-panel=\"couple\"><h3>Poros rinkinyje</h3><ul><li>Alginato pakelis</li><li>1 200 g gipso</li><li>Kibiras</li><li>Maišymo pagaliukai</li></ul><p>Baltus dažus galima pasirinkti papildomai už 3 €.</p></article><article data-kit-panel=\"family\"><h3>Šeimos rinkinyje</h3><ul><li>Du alginato pakeliai</li><li>Du gipso pakeliai</li><li>Maišymo pagaliukai</li></ul><p>Komplektaciją ir pasiruošimą tikrinkite konkretaus rinkinio apraše.</p></article><p class=\"contents-extra\">Medinis pagrindas pasirenkamas atskirai už 10 €. Priedų prieinamumą patikrinkite produkto puslapyje.</p><a class=\"text-link\" href=\"@@INSTRUCTION@@\">Pasiruošti liejimui <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></div></div></section>\n\n<section class=\"gallery\" id=\"galerija\" aria-labelledby=\"gallery-title\">\n      <div class=\"section-heading\"><h2 id=\"gallery-title\" data-reveal=\"lines\"><span id=\"detales-kurios-priklauso-jums\">Detalės, kurios<br>priklauso jums.</span></h2><p>Pažįstamas gestas.<br>Vis naujas būdas jį pamatyti.</p></div>\n      <p class=\"image-note\">Iliustraciniai vaizdai. Jie nerodo patvirtintų klientų darbų ar visos rinkinių komplektacijos.</p><div class=\"gallery-grid\">\n        <figure class=\"gallery-item gallery-home\" data-depth=\"36\"><div class=\"gallery-frame\"><img src=\"/memocasting-homepage/v1/media/gallery-home-v1.webp\" width=\"1536\" height=\"1024\" alt=\"Dviejų rankų skulptūra ant šviesios konsolės, apšviesta dienos šviesa\" loading=\"lazy\"></div><figcaption>Vieta jūsų akimirkai.</figcaption></figure>\n        <figure class=\"gallery-item gallery-family\" data-depth=\"-30\"><div class=\"gallery-frame\"><img src=\"/memocasting-homepage/v1/media/family-cast-v1.webp\" width=\"1122\" height=\"1402\" alt=\"Keturių rankų šeimos skulptūros detalės\" loading=\"lazy\"></div><figcaption>Mažos rankos. Didelis ryšys.</figcaption></figure>\n        <figure class=\"gallery-item gallery-detail\" data-depth=\"26\"><div class=\"gallery-frame\"><img src=\"/memocasting-homepage/v1/media/couple-cast-v1.webp\" width=\"960\" height=\"1212\" alt=\"Susikibusių rankų ir žiedo detalė baltame gipso liejinyje\" loading=\"lazy\"></div><figcaption>Kiekvienas prisilietimas savas.</figcaption></figure>\n        <figure class=\"gallery-item gallery-kit\" data-depth=\"-34\"><div class=\"gallery-frame\"><img src=\"/memocasting-homepage/v1/media/hero-white-v1.webp\" width=\"1448\" height=\"1086\" alt=\"Memory Casting rinkinio priemonės ir baigta rankų skulptūra\" loading=\"lazy\"></div><figcaption>Viskas prasideda nuo jūsų.</figcaption></figure>\n      </div>\n    </section>\n<section class=\"instagram-section home-section\" id=\"instagram\" aria-labelledby=\"instagram-title\"><div class=\"section-heading\"><h2 id=\"instagram-title\" data-reveal=\"lines\">Dar daugiau<br>akimirkų.</h2><p data-reveal=\"rise\">Kūrimo procesas, skulptūrų detalės ir naujos idėjos mūsų Instagram profilyje.</p></div><div data-instagram-posts class=\"instagram-posts\"><article class=\"instagram-post\" data-reveal=\"rise\"><div class=\"instagram-post-top\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/><path d=\"m10 8 6 4-6 4V8Z\"/></svg><span>@oksanapikulll</span></div><h3>Kūrimo akimirka</h3><p>Rankų liejimo veiklos įrašas.</p><p class=\"instagram-credit\">Reklaminis bendradarbiavimas.</p><a href=\"https://www.instagram.com/oksanapikulll/reel/DDaCS6Gt97Y/\" target=\"_blank\" rel=\"noopener noreferrer\">Peržiūrėti video Instagram <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article><article class=\"instagram-post\" data-reveal=\"rise\"><div class=\"instagram-post-top\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/><path d=\"m10 8 6 4-6 4V8Z\"/></svg><span>@karolinameschino</span></div><h3>Skulptūros atidengimas</h3><p>Šeimos veiklos ir rezultato įrašas.</p><p class=\"instagram-credit\">Reklaminis bendradarbiavimas.</p><a href=\"https://www.instagram.com/karolinameschino/reel/Cl1dRUHuWLY/\" target=\"_blank\" rel=\"noopener noreferrer\">Peržiūrėti video Instagram <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article><article class=\"instagram-post\" data-reveal=\"rise\"><div class=\"instagram-post-top\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/><path d=\"m10 8 6 4-6 4V8Z\"/></svg><span>@andreja.linge</span></div><h3>Prisilietimo detalės</h3><p>Susikibusių rankų skulptūros įrašas.</p><a href=\"https://www.instagram.com/andreja.linge/reel/DIwUyuHCj8T/\" target=\"_blank\" rel=\"noopener noreferrer\">Peržiūrėti video Instagram <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article></div><div class=\"instagram-invitation\" data-reveal=\"rise\"><div><h3>@memocasting.lt</h3><p>Atraskite daugiau nuotraukų ir video.</p></div><a class=\"button\" href=\"https://www.instagram.com/memocasting.lt/\" target=\"_blank\" rel=\"noopener noreferrer\">Peržiūrėti Instagram <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></div></section>\n<section class=\"home-guides home-section\" id=\"gidai\" aria-labelledby=\"guides-title\"><div class=\"section-heading\"><h2 id=\"guides-title\" data-reveal=\"lines\">Kad pirmas liejimas<br>būtų aiškesnis.</h2><p data-reveal=\"rise\">Nuo pasiruošimo iki liejinio apdailos.</p></div><div class=\"home-guide-grid\"><article data-reveal=\"rise\"><h3>Prieš pradedant</h3><p>Rinkinio instrukcija, priemonės ir proceso eiga.</p><a class=\"text-link\" href=\"@@INSTRUCTION@@\">Pasiruošti liejimui <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article><article data-reveal=\"rise\"><h3>Kai kyla klausimų</h3><p>Ką patikrinti ir kaip tiksliai aprašyti nepavykusį liejimą.</p><a class=\"text-link\" href=\"@@HELP@@\">Rasti pagalbą <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article><article data-reveal=\"rise\"><h3>Po atidengimo</h3><p>Džiovinimas, paviršiaus sutvarkymas ir apdailos pasirinkimas.</p><a class=\"text-link\" href=\"@@FINISHING@@\">Skaityti apdailos gidą <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></article></div></section>\n<section class=\"questions home-section\" id=\"klausimai\" aria-labelledby=\"questions-title\"><h2 id=\"questions-title\" data-reveal=\"lines\">Prieš pirmąjį<br>prisilietimą.</h2><div class=\"question-list\"><details data-reveal=\"rise\"><summary>Kuo skiriasi poros ir šeimos rinkinys?<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 12h14m-7-7v14\"/></svg></summary><p>Poros rinkinyje yra alginato pakelis, 1 200 g gipso, kibiras ir maišymo pagaliukai. Šeimos rinkinyje — du alginato ir du gipso pakeliai bei maišymo pagaliukai. Visą komplektaciją tikrinkite konkretaus rinkinio apraše.</p></details><details data-reveal=\"rise\"><summary>Ar skulptūrą kuriame patys?<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 12h14m-7-7v14\"/></svg></summary><p>Taip. Rankų atspaudas suformuojamas alginate, o į jį supilamas atskirai paruoštas gipso mišinys. Sustingusį liejinį atidengiate pašalindami alginato formą.</p></details><details data-reveal=\"rise\"><summary>Ar dažai ir medinis pagrindas įeina į bazinį rinkinį?<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 12h14m-7-7v14\"/></svg></summary><p>Baltus dažus prie poros rinkinio galima pasirinkti papildomai už 3 €. Medinis pagrindas pasirenkamas atskirai už 10 €. Priedų prieinamumą tikrinkite produkto puslapyje.</p></details><details data-reveal=\"rise\"><summary>Kada galima išimti ir dažyti liejinį?<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 12h14m-7-7v14\"/></svg></summary><p>Vandens kiekius ir stingimo laiką tikrinkite savo rinkinio instrukcijoje. Pradinis stingimas ir galutinis išdžiūvimas yra skirtingi etapai. Apdailą planuokite pagal instrukciją.</p></details><details data-reveal=\"rise\"><summary>Ką daryti, jei liejinys nepavyko?<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 12h14m-7-7v14\"/></svg></summary><p>Užrašykite rinkinio ir medžiagų duomenis, proceso etapą bei pastebėtą problemą. Kreipkitės į mus — padėsime susigaudyti, ką verta patikrinti.</p></details><details data-reveal=\"rise\"><summary>Kur rasti pristatymo ir grąžinimo informaciją?<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 12h14m-7-7v14\"/></svg></summary><p>Prieš užsakydami peržiūrėkite pristatymo ir grąžinimo informaciją. Galutinę sumą tikrinkite užsakymo metu.</p></details><div class=\"home-service-links\"><a class=\"text-link\" href=\"@@DELIVERY@@\">Pristatymas <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a><a class=\"text-link\" href=\"@@RETURNS@@\">Grąžinimas <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a><a class=\"text-link\" href=\"@@CONTACT@@\">Susisiekti <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></div></div></section>\n<section class=\"closing\" aria-labelledby=\"closing-title\"><h2 id=\"closing-title\" data-reveal=\"lines\">Išsaugokite tai,<br>ką jaučiate.</h2><a class=\"button\" href=\"#rinkiniai\" data-reveal=\"rise\">Pasirinkti savo rinkinį <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg></a></section>";
export const memoHomepageBlocks=[
  {
    "type": "paragraph",
    "text": "Akimirka, kuri lieka."
  },
  {
    "type": "paragraph",
    "text": "Rankų liejimo rinkiniai porai ir šeimai. Sukurkite savo bendros akimirkos skulptūrą."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Ką norite pasilikti?"
  },
  {
    "type": "paragraph",
    "text": "Diena praeina. Prisilietimas lieka. Susikibkite rankomis ir išsaugokite savo bendros akimirkos formą."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Bendras vakaras dviese."
  },
  {
    "type": "paragraph",
    "text": "Skirkite laiko vienas kitam ir sukurkite skulptūrą kartu."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Akimirka su šeima."
  },
  {
    "type": "paragraph",
    "text": "Pasirinkite kompoziciją, kuri primins jūsų artumą. Prieš pradėdami patikrinkite rinkinio instrukciją."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Dovana, kurią kuriate kartu."
  },
  {
    "type": "paragraph",
    "text": "Padovanokite progą susitikti ir išsaugoti bendrą prisiminimą."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Kam kursite prisiminimą?"
  },
  {
    "type": "paragraph",
    "text": "Pasirinkite poros ar šeimos rinkinį ir susikurkite prisiminimą kartu."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Rinkinys porai"
  },
  {
    "type": "paragraph",
    "text": "Alginato pakelis, 1 200 g gipso, kibiras ir maišymo pagaliukai."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Šeimos rinkinys"
  },
  {
    "type": "paragraph",
    "text": "Du alginato ir du gipso pakeliai bei maišymo pagaliukai."
  },
  {
    "type": "paragraph",
    "text": "Rinkinių vaizdai — įkvėpimo iliustracijos. Tikslią komplektaciją tikrinkite pasirinkto rinkinio apraše."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Viskas, ko reikia. Viename rinkinyje."
  },
  {
    "type": "paragraph",
    "text": "Rinkinyje — alginatas, gipsas ir maišymo pagaliukai. Poros rinkinio baltus dažus galite pasirinkti papildomai. Tikslią kiekvieno rinkinio sudėtį rasite jo apraše."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Truputis vandens. Pradžia prisiminimui."
  },
  {
    "type": "paragraph",
    "text": "Alginatas sumaišomas su vandeniu. Rožinė masė netrukus išsaugos jūsų rankų atspaudą."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Jūsų gestas. Jo atspaudas."
  },
  {
    "type": "paragraph",
    "text": "Susikibkite rankomis ir panardinkite jas į paruoštą alginatą. Jam sustingus, rankas atsargiai ištraukite po vieną."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Akimirka įgauna formą."
  },
  {
    "type": "paragraph",
    "text": "Į likusį atspaudą supilamas atskirai paruoštas gipso mišinys. Leiskite jam sustingti pagal rinkinio instrukciją."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Atidengiamas jūsų prisiminimas."
  },
  {
    "type": "paragraph",
    "text": "Nuimkite kibirėlį ir atsargiai pašalinkite alginatą dalimis. Po juo — jūsų rankų skulptūra."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Jūsų rankos. Jūsų istorija."
  },
  {
    "type": "paragraph",
    "text": "Iš bendros akimirkos — prisiminimas, kuriam atsiras vieta jūsų namuose."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Jūsų ryšys. Jūsų forma."
  },
  {
    "type": "paragraph",
    "text": "Dviejų rankų prisilietimas ar šeimos akimirka. Atraskite gestą, kurį norėtumėte išsaugoti."
  },
  {
    "type": "paragraph",
    "text": "Poros gestas. Įkvėpimo iliustracija."
  },
  {
    "type": "paragraph",
    "text": "Šeimos kompozicija. Įkvėpimo iliustracija."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Viskas prasideda nuo jūsų."
  },
  {
    "type": "paragraph",
    "text": "Susipažinkite su rinkinio priemonėmis ir pasiruoškite bendrai veiklai."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Poros rinkinyje"
  },
  {
    "type": "paragraph",
    "text": "Alginato pakelis"
  },
  {
    "type": "paragraph",
    "text": "1 200 g gipso"
  },
  {
    "type": "paragraph",
    "text": "Kibiras"
  },
  {
    "type": "paragraph",
    "text": "Maišymo pagaliukai"
  },
  {
    "type": "paragraph",
    "text": "Baltus dažus galima pasirinkti papildomai už 3 €."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Šeimos rinkinyje"
  },
  {
    "type": "paragraph",
    "text": "Du alginato pakeliai"
  },
  {
    "type": "paragraph",
    "text": "Du gipso pakeliai"
  },
  {
    "type": "paragraph",
    "text": "Maišymo pagaliukai"
  },
  {
    "type": "paragraph",
    "text": "Komplektaciją ir pasiruošimą tikrinkite konkretaus rinkinio apraše."
  },
  {
    "type": "paragraph",
    "text": "Medinis pagrindas pasirenkamas atskirai už 10 €. Priedų prieinamumą patikrinkite produkto puslapyje."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Detalės, kurios priklauso jums."
  },
  {
    "type": "paragraph",
    "text": "Pažįstamas gestas. Vis naujas būdas jį pamatyti."
  },
  {
    "type": "paragraph",
    "text": "Iliustraciniai vaizdai. Jie nerodo patvirtintų klientų darbų ar visos rinkinių komplektacijos."
  },
  {
    "type": "paragraph",
    "text": "Vieta jūsų akimirkai."
  },
  {
    "type": "paragraph",
    "text": "Mažos rankos. Didelis ryšys."
  },
  {
    "type": "paragraph",
    "text": "Kiekvienas prisilietimas savas."
  },
  {
    "type": "paragraph",
    "text": "Viskas prasideda nuo jūsų."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Dar daugiau akimirkų."
  },
  {
    "type": "paragraph",
    "text": "Kūrimo procesas, skulptūrų detalės ir naujos idėjos mūsų Instagram profilyje."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Kūrimo akimirka"
  },
  {
    "type": "paragraph",
    "text": "Rankų liejimo veiklos įrašas."
  },
  {
    "type": "paragraph",
    "text": "Reklaminis bendradarbiavimas."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Skulptūros atidengimas"
  },
  {
    "type": "paragraph",
    "text": "Šeimos veiklos ir rezultato įrašas."
  },
  {
    "type": "paragraph",
    "text": "Reklaminis bendradarbiavimas."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Prisilietimo detalės"
  },
  {
    "type": "paragraph",
    "text": "Susikibusių rankų skulptūros įrašas."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "@memocasting.lt"
  },
  {
    "type": "paragraph",
    "text": "Atraskite daugiau nuotraukų ir video."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Kad pirmas liejimas būtų aiškesnis."
  },
  {
    "type": "paragraph",
    "text": "Nuo pasiruošimo iki liejinio apdailos."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Prieš pradedant"
  },
  {
    "type": "paragraph",
    "text": "Rinkinio instrukcija, priemonės ir proceso eiga."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Kai kyla klausimų"
  },
  {
    "type": "paragraph",
    "text": "Ką patikrinti ir kaip tiksliai aprašyti nepavykusį liejimą."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Po atidengimo"
  },
  {
    "type": "paragraph",
    "text": "Džiovinimas, paviršiaus sutvarkymas ir apdailos pasirinkimas."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Prieš pirmąjį prisilietimą."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Kuo skiriasi poros ir šeimos rinkinys?"
  },
  {
    "type": "paragraph",
    "text": "Poros rinkinyje yra alginato pakelis, 1 200 g gipso, kibiras ir maišymo pagaliukai. Šeimos rinkinyje — du alginato ir du gipso pakeliai bei maišymo pagaliukai. Visą komplektaciją tikrinkite konkretaus rinkinio apraše."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Ar skulptūrą kuriame patys?"
  },
  {
    "type": "paragraph",
    "text": "Taip. Rankų atspaudas suformuojamas alginate, o į jį supilamas atskirai paruoštas gipso mišinys. Sustingusį liejinį atidengiate pašalindami alginato formą."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Ar dažai ir medinis pagrindas įeina į bazinį rinkinį?"
  },
  {
    "type": "paragraph",
    "text": "Baltus dažus prie poros rinkinio galima pasirinkti papildomai už 3 €. Medinis pagrindas pasirenkamas atskirai už 10 €. Priedų prieinamumą tikrinkite produkto puslapyje."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Kada galima išimti ir dažyti liejinį?"
  },
  {
    "type": "paragraph",
    "text": "Vandens kiekius ir stingimo laiką tikrinkite savo rinkinio instrukcijoje. Pradinis stingimas ir galutinis išdžiūvimas yra skirtingi etapai. Apdailą planuokite pagal instrukciją."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Ką daryti, jei liejinys nepavyko?"
  },
  {
    "type": "paragraph",
    "text": "Užrašykite rinkinio ir medžiagų duomenis, proceso etapą bei pastebėtą problemą. Kreipkitės į mus — padėsime susigaudyti, ką verta patikrinti."
  },
  {
    "type": "heading",
    "level": 3,
    "text": "Kur rasti pristatymo ir grąžinimo informaciją?"
  },
  {
    "type": "paragraph",
    "text": "Prieš užsakydami peržiūrėkite pristatymo ir grąžinimo informaciją. Galutinę sumą tikrinkite užsakymo metu."
  },
  {
    "type": "heading",
    "level": 2,
    "text": "Išsaugokite tai, ką jaučiate."
  }
];
export function memoHomepageAdmitted(page){return page?.slug==='' && JSON.stringify(page.body?.slice(0,memoHomepageBlocks.length))===JSON.stringify(memoHomepageBlocks);}
