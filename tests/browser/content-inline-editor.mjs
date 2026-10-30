// Call with an owned Playwright Page on the isolated content-inline-fixture server.
export async function verifyInline(page,origin,directory){
 const check=(value,message)=>{if(!value)throw Error(message)},errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')writes.push({path:new URL(r.url()).pathname,input:r.postDataJSON()})});
 await page.setViewportSize({width:1366,height:900});
 await page.goto(origin+'/gidai');const guides=await page.locator('a[href^="/gidai/"]').evaluateAll(nodes=>[...new Set(nodes.map(node=>node.getAttribute('href')))].sort());
 check(JSON.stringify(guides)===JSON.stringify(['/gidai/iso-moduliu-sistema','/gidai/medicininio-vezimelio-pasirinkimas']),'publication pause keeps only the two published guides');
 const held=await page.goto(origin+'/gidai/medicininio-vezimelio-matmenu-patikra');check(held.status()===404,'unpublished guide is not a public page');
 const url=origin+'/produktai/infuziju-stovas-nerez1002is';await page.goto(url);await page.getByRole('button',{name:'Taisyti',exact:true}).waitFor();
 await page.locator('[data-edit-path="body.1.text"]').evaluate(node=>{const range=document.createRange();range.selectNodeContents(node);range.setEnd(node.firstChild,Math.min(40,node.firstChild.length));const s=getSelection();s.removeAllRanges();s.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
 await page.getByRole('button',{name:'Perdaryti dalį',exact:true}).click();const modal=page.getByRole('dialog');await modal.waitFor();check((await modal.locator('blockquote').innerText()).length>5,'selection preview');
 await modal.getByLabel('Kas negerai ir ką pakeisti?',{exact:true}).fill('Izoliuotas bandymas: paaiškinti trumpiau.');await modal.getByRole('button',{name:'Įrašyti į eilę',exact:true}).click();await modal.waitFor({state:'detached'});
 check(writes.some(w=>w.path.endsWith('/rewrite')&&w.input.mode==='selection'&&w.input.selection.quote.length>5),'exact selection sent');
 await page.getByRole('button',{name:'Perrašyti',exact:true}).click();await page.getByRole('dialog').getByLabel('Kas negerai ir ką pakeisti?',{exact:true}).fill('Izoliuotas bandymas: visas tekstas.');await page.getByRole('dialog').getByRole('button',{name:'Įrašyti į eilę',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});
 await page.screenshot({path:directory+'/inline-desktop.png'});
 const oldTitle=await page.locator('h1[data-edit-path]').innerText();await page.getByRole('button',{name:'Taisyti',exact:true}).click();await page.getByLabel('Pavadinimas',{exact:true}).fill('Vietinis redagavimo bandymas');
 await page.screenshot({path:directory+'/edit-desktop.png'});
 await page.getByRole('button',{name:'Išsaugoti juodraštį',exact:true}).click();await page.getByRole('link',{name:'Palyginti seną ir naują tekstą'}).waitFor();check(await page.locator('h1[data-edit-path]').innerText()===oldTitle,'live title remains');
 await page.getByRole('link',{name:'Palyginti seną ir naują tekstą'}).click();await page.locator('.comparison').waitFor();check((await page.locator('.comparison>section').count())===2,'two compared versions');
 check((await page.locator('.comparison>section').last().innerText()).includes('Vietinis redagavimo bandymas'),'new draft visible');check(!(await page.locator('.comparison>section').first().innerText()).includes('Vietinis redagavimo bandymas'),'old remains unchanged');
 await page.screenshot({path:directory+'/compare-desktop.png'});
 await page.getByRole('button',{name:'Patvirtinti',exact:true}).click();await page.getByRole('dialog').waitFor();check(await page.getByRole('dialog').getByRole('checkbox').count()===6,'owner review gates retained');await page.getByRole('dialog').getByRole('button',{name:'Atšaukti',exact:true}).click();
 await page.getByRole('button',{name:'Perrašyti dar kartą',exact:true}).click();await page.getByRole('dialog').getByLabel('Kas negerai ir ką pakeisti?',{exact:true}).fill('Tik bandomasis prašymas.');await page.getByRole('dialog').getByRole('button',{name:'Įrašyti į eilę',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});
 await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'comparison mobile overflow');await page.screenshot({path:directory+'/compare-mobile.png'});
 await page.getByRole('link',{name:'Dar nematomi tekstai',exact:true}).first().click();await page.getByRole('heading',{name:'Dar nematomi tekstai',exact:true}).waitFor();check((await page.locator('.pending-item').count())>0,'pending list contains drafts');
 await page.goto(url);await page.getByRole('button',{name:'Taisyti',exact:true}).waitFor();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'inline mobile overflow');await page.screenshot({path:directory+'/inline-mobile.png'});
 await page.getByRole('button',{name:'Taisyti',exact:true}).click();check(await page.getByLabel('Pavadinimas',{exact:true}).inputValue()==='Vietinis redagavimo bandymas','draft survives reload');
 await page.getByLabel('Pavadinimas',{exact:true}).fill('Neišsaugotas tekstas');
 // Network failure must retain the owner's fields and expose a retry, never fake success.
 await page.route('**/admin/api/texts/*/save',r=>r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Tekstas pasikeitė kitame lange.'})}));
 await page.getByRole('button',{name:'Išsaugoti juodraštį',exact:true}).click();await page.getByText('Tekstas pasikeitė kitame lange.',{exact:true}).waitFor();check(await page.getByLabel('Pavadinimas',{exact:true}).inputValue()==='Neišsaugotas tekstas','conflicting edit retained');
 await page.screenshot({path:directory+'/edit-conflict-mobile.png'});await page.unroute('**/admin/api/texts/*/save');
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Atšaukti taisymą',exact:true}).click();
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'enlarged text overflow');
 check(!writes.some(w=>/\/(publish|approve|release)$/.test(w.path)),'no automatic publication');check(errors.length===0,errors.join('\n'));
 return {passed:true,selection:1,wholeRewrites:2,manualDraftSaves:1,conflictPreservesInput:true,ownerApprovalNotSubmitted:true,viewportDesktop:1366,viewportMobile:390,errors};
}
