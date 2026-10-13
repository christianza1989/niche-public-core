export function mountMemoHomepage(root) {
  const abort = new AbortController();
  let disposed = false;
  const listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:abort.signal});
  const originals=[...root.querySelectorAll(".hero-line,.reveal-text")].map(el=>[el,el.innerHTML]);
  const body = root;
  const story = root.querySelector('.story');
  const stage = root.querySelector('.story-stage');
  const video = root.querySelector('#story-video');
  const surface = root.querySelector('.film-surface');
  const poster = root.querySelector('#film-poster');
  const toggle = root.querySelector('#motion-toggle');
  const navigation = root.querySelector('.story-navigation');
  const chapters = [...root.querySelectorAll('.chapter')];
  const chapterButtons = [...root.querySelectorAll('.chapter-navigation button')];
  const hero = root.querySelector('.hero');
  const heroVisual = root.querySelector('.hero-visual');
  const heroCopy = root.querySelector('.hero-copy');
  const meaning = root.querySelector('.meaning');
  const galleryItems = [...root.querySelectorAll('.gallery-item')];
  const dockLinks = [...root.querySelectorAll('.dock-links a')];
  const navSections = dockLinks.map(link => root.querySelector(link.getAttribute('href')));
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 700px)');
  const roomy = matchMedia('(min-height: 651px)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const expectedDuration = 20.041667;
  const frame = 1 / 24;
  let explicitMotion = new URLSearchParams(location.search).get('motion') === 'off' ? false : null;
  let enabled = false;
  let failed = false;
  let source = '';
  let raf = null;
  let progress = 0;
  let desiredTime = 0;
  let active = -1;
  let pendingSeek = false;
  let meaningValue = -1;
  let navIndex = -1;
  const duration = () => Number.isFinite(video.duration) ? video.duration : expectedDuration;
  const endTime = () => Math.max(0, duration() - frame);
  const canScrub = () => enabled && !failed && roomy.matches;

  // Original text remains the accessible name; letter spans are visual only.
  const heroTitle = root.querySelector('#hero-title');
  heroTitle.setAttribute('aria-label', 'Akimirka, kuri lieka.');
  let charIndex = 0;
  root.querySelectorAll('.hero-line').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    line.setAttribute('aria-hidden','true');
    [...text].forEach(char => {
      if (char === ' ') { line.append(document.createTextNode(' ')); return; }
      const span = document.createElement('span');
      span.className = 'hero-char';
      span.textContent = char;
      span.style.setProperty('--delay', Math.min(charIndex++ * .021, .38) + 's');
      line.append(span);
    });
  });
  const reveal = root.querySelector('.reveal-text');
  const originalReveal = reveal.textContent;
  reveal.setAttribute('aria-label', originalReveal);
  reveal.textContent = '';
  const revealChars = [];
  originalReveal.split(/(\s+)/).forEach(word => {
    if (/^\s+$/.test(word)) { reveal.append(document.createTextNode(word)); return; }
    const holder = document.createElement('span');
    holder.className = 'reveal-word';
    holder.setAttribute('aria-hidden','true');
    [...word].forEach(char => {
      const span = document.createElement('span');
      span.className = 'reveal-char';
      span.textContent = char;
      holder.append(span);
      revealChars.push(span);
    });
    reveal.append(holder);
  });

  function activate(index) {
    if (active === index) return;
    active = index;
    chapters.forEach((chapter, i) => {
      const selected = i === index;
      chapter.classList.toggle('is-active', selected);
      chapter.inert = canScrub() && !selected;
      if (canScrub()) chapter.setAttribute('aria-hidden',String(!selected));
      else chapter.removeAttribute('aria-hidden');
    });
    chapterButtons.forEach((button,i) => button.setAttribute('aria-pressed',String(i===index)));
    root.querySelector('#stage-count').textContent = String(index+1).padStart(2,'0') + ' / 06';
    stage.dataset.activeChapter = chapters[index].dataset.label;
  }
  function seekLatest() {
    if(disposed)return;
    if (!canScrub() || !source || video.readyState < 1 || video.seeking || pendingSeek) return;
    if (Math.abs(video.currentTime - desiredTime) <= frame*.7) return;
    pendingSeek = true;
    try { video.currentTime = Math.min(endTime(),Math.max(0,desiredTime)); }
    catch { pendingSeek = false; }
  }
  function chooseSource() {
    const next = small.matches ? video.dataset.mobile : video.dataset.desktop;
    if (next === source) return;
    source = next;
    pendingSeek = false;
    surface.classList.remove('is-ready');
    poster.src = progress > .03 && active >= 0 ? '/memocasting-homepage/v1/media/white-film-v1/chapter-' + (active+1) + '.webp' : '/memocasting-homepage/v1/media/white-film-v1/' + (small.matches?'mobile':'desktop') + '-poster.webp';
    video.src = next;
    video.preload = 'auto';
    video.load();
  }
  function updateNavigation() {
    let index = 0;
    navSections.forEach((section,i) => { if (section.getBoundingClientRect().top <= innerHeight*.4) index = i; });
    if (index === navIndex) return;
    navIndex = index;
    dockLinks.forEach((link,i) => { if (i===index) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
  }
  function updatePageMotion() {
    const hr = hero.getBoundingClientRect();
    const hp = clamp(-hr.top / Math.max(1,hr.height));
    if (hr.bottom > -innerHeight*.1) {
      heroVisual.style.setProperty('--hero-shift', (hp*hr.height*.24).toFixed(1)+'px');
      heroVisual.style.setProperty('--hero-scale', (1+hp*.035).toFixed(4));
      heroCopy.style.setProperty('--copy-shift', (-hp*hr.height*.18).toFixed(1)+'px');
      heroCopy.style.setProperty('--copy-opacity',String(1-clamp((hp-.15)/.7)));
      hero.dataset.scrollProgress = hp.toFixed(3);
    }
    const mr = meaning.getBoundingClientRect();
    const mp = clamp((innerHeight*.65 - mr.top) / Math.max(1,mr.height - innerHeight*.45));
    const key = Math.round(mp*300);
    if (key !== meaningValue) {
      meaningValue = key;
      revealChars.forEach((span,i) => span.style.setProperty('--char-opacity',(.18+.82*clamp((mp-i/revealChars.length*.86)/.14)).toFixed(3)));
      meaning.dataset.revealProgress = mp.toFixed(3);
    }
    galleryItems.forEach(item => {
      const r = item.getBoundingClientRect();
      const previousShift = Number.parseFloat(item.style.getPropertyValue('--photo-shift')) || 0;
      const p = clamp((innerHeight-(r.top-previousShift))/(innerHeight+r.height));
      const entrance = clamp(p/.23);
      const exit = clamp((p-.85)/.15);
      item.style.setProperty('--photo-opacity',(.15+.85*entrance*(1-exit)).toFixed(3));
      item.style.setProperty('--photo-shift',((.5-p)*Number(item.dataset.depth)).toFixed(1)+'px');
      item.style.setProperty('--photo-top',((1-entrance)*13).toFixed(2)+'%');
      item.style.setProperty('--photo-bottom',(exit*9).toFixed(2)+'%');
      item.style.setProperty('--photo-scale',(1.04-p*.035).toFixed(4));
    });
  }
  function render() {
    raf = null;
    if(disposed)return;
    updateNavigation();
    if (enabled) updatePageMotion();
    if (!canScrub()) return;
    const rect = story.getBoundingClientRect();
    const span = Math.max(1,rect.height-stage.getBoundingClientRect().height);
    progress = clamp(-rect.top/span);
    desiredTime = progress*endTime();
    stage.dataset.progress = progress.toFixed(4);
    stage.dataset.targetTime = desiredTime.toFixed(3);
    let index = 0;
    for(let i=1;i<chapters.length;i++) if(desiredTime>=Number(chapters[i].dataset.start)) index=i;
    activate(index);
    root.querySelector('.story-progress span').style.transform = 'scaleX('+progress+')';
    if(rect.top<innerHeight+160 && rect.bottom>0) chooseSource();
    seekLatest();
  }
  function schedule() { if(!disposed && raf===null && !document.hidden) raf=requestAnimationFrame(render); }
  function configure() {
    enabled = explicitMotion===null ? !preference.matches : explicitMotion;
    body.classList.toggle('motion-on',enabled);
    body.classList.toggle('motion-off',!enabled);
    body.classList.toggle('film-static',!canScrub());
    toggle.hidden=false;
    toggle.setAttribute('aria-pressed',String(!enabled));
    toggle.setAttribute('aria-label',enabled?'Išjungti judesį':'Įjungti judesį');
    toggle.querySelector('.motion-label').textContent=enabled?'Be judesio':'Įjungti judesį';
    navigation.hidden=!canScrub();

    active=-1;
    if(!canScrub()) {
      video.pause();
      pendingSeek=false;
      video.removeAttribute('src');
      video.preload='none';
      video.load();
      source='';
      surface.classList.remove('is-ready');
      chapters.forEach(chapter=>{chapter.inert=false;chapter.removeAttribute('aria-hidden');chapter.classList.remove('is-active');});
    }
    if(!enabled) {
      heroVisual.removeAttribute('style');
      heroCopy.removeAttribute('style');
      revealChars.forEach(span=>span.style.removeProperty('--char-opacity'));
      galleryItems.forEach(item=>item.removeAttribute('style'));
      meaningValue=-1;
    }
    schedule();
  }
  listen(video,'loadedmetadata',()=>{pendingSeek=false;schedule();});
  listen(video,'loadeddata',()=>{video.pause();pendingSeek=false;surface.classList.add('is-ready');schedule();});
  listen(video,'seeked',()=>{pendingSeek=false;if(video.readyState>=2)surface.classList.add('is-ready');seekLatest();});
  listen(video,'error',()=>{if(!source||!canScrub())return;failed=true;root.querySelector('#media-error').hidden=false;configure();});
  listen(video,'play',()=>video.pause());
  listen(toggle,'click',()=>{
    const inside=story.getBoundingClientRect().top<0 && story.getBoundingClientRect().bottom>0;
    explicitMotion=!enabled;
    configure();
    if(inside)story.scrollIntoView({block:'start',behavior:'instant'});
  });
  chapterButtons.forEach(button=>listen(button,'click',()=>{
    const rect=story.getBoundingClientRect();
    const span=rect.height-stage.getBoundingClientRect().height;
    scrollTo({top:scrollY+rect.top+span*clamp((Number(button.dataset.time)+.04)/endTime()),behavior:preference.matches?'instant':'smooth'});
  }));
  listen(preference,'change',configure);
  listen(roomy,'change',configure);
  listen(small,'change',()=>{if(canScrub()&&source)chooseSource();schedule();});
  listen(window,'scroll',schedule,{passive:true});
  listen(window,'resize',()=>{
    if(canScrub()&&source&&progress>0&&progress<1) {
      const rect=story.getBoundingClientRect();
      scrollTo({top:scrollY+rect.top+progress*Math.max(1,rect.height-stage.getBoundingClientRect().height),behavior:'instant'});
    }
    schedule();
  },{passive:true});
  listen(window,'pageshow',schedule);
  document.fonts.ready.then(schedule);
  listen(document,'visibilitychange',()=>{video.pause();if(!document.hidden)schedule();});
  const observer=new ResizeObserver(schedule); observer.observe(stage);
  configure();

  const quotes=[...root.querySelectorAll('.testimonial')];
  const dots=[...root.querySelectorAll('[data-slide]')];
  const quoteSection=root.querySelector('.testimonials');
  let quoteIndex=0;
  quoteSection.classList.add('has-carousel');
  root.querySelector('.testimonial-controls').hidden=false;
  function showQuote(index) {
    quoteIndex=(index+quotes.length)%quotes.length;
    quotes.forEach((quote,i)=>{const selected=i===quoteIndex;quote.classList.toggle('is-active',selected);quote.inert=!selected;quote.setAttribute('aria-hidden',String(!selected));});
    dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===quoteIndex)));
  }
  dots.forEach(dot=>listen(dot,'click',()=>showQuote(Number(dot.dataset.slide))));
  root.querySelectorAll('[data-direction]').forEach(button=>listen(button,'click',()=>showQuote(quoteIndex+Number(button.dataset.direction))));
  listen(quoteSection,'keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();showQuote(quoteIndex+1);}if(event.key==='ArrowLeft'){event.preventDefault();showQuote(quoteIndex-1);}});
  showQuote(0);
  return () => {
    disposed=true; abort.abort(); observer.disconnect();
    if(raf!==null)cancelAnimationFrame(raf);
    video.pause(); video.removeAttribute('src'); video.preload='none'; video.load();
    body.classList.remove('motion-on','motion-off','film-static');
    originals.forEach(([el,html])=>{el.innerHTML=html;});
    chapters.forEach(chapter=>{chapter.inert=false;chapter.removeAttribute('aria-hidden');});
    quotes.forEach(quote=>{quote.inert=false;quote.removeAttribute('aria-hidden');});
  };
}
