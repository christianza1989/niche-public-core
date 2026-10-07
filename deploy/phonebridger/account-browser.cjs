// Disposable loopback acceptance. Never seeds a remote database or uses production secrets.
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const origin=process.argv[2]||'http://127.0.0.1:4195';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('This acceptance seeds only the dedicated loopback fixture database.');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/phonebridger-account');
const run=Date.now().toString(36),email=`workspace-${run}@example.invalid`,password='Disposable UI fixture '+run+'!';
const reports=[],errors=[];
async function runChecks(){
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:process.env.PHONEBRIDGER_BROWSER_CHANNEL||'chrome'});const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const api=async(route,data,headers={})=>{const r=await context.request[ data===undefined?'get':'post'](origin+route,{headers:{Origin:origin,...headers},...(data===undefined?{}:{data})});return r;};
 try{
  await page.goto(origin+'/account');await page.getByRole('heading',{name:'Sign in to your workspace'}).waitFor();reports.push('guest denied with sign-in action');
  await page.goto(origin+'/register');await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('[data-auth] button[type=submit]').click();await page.waitForURL('**/account');await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
  await page.screenshot({path:path.join(out,'customer-empty-desktop.png'),fullPage:true});
  assert.equal(await page.locator('[data-nav] a[href="/creator"]').count(),0);reports.push('registration uses real existing auth and customer has no creator navigation');
  await page.locator('[data-setup="windows"]').check();await page.getByText('Checklist saved.',{exact:true}).waitFor();await page.reload();await page.locator('[data-setup="windows"]:checked').waitFor();reports.push('checklist persists without claiming device status');
  await page.goto(origin+'/account/settings');await page.getByRole('heading',{name:'Account settings',exact:true}).waitFor();await page.locator('input[name=name]').fill('Alex');await page.getByRole('button',{name:'Save profile'}).click();await page.getByText('Saved.',{exact:true}).waitFor();reports.push('profile persists');
  await page.goto(origin+'/account/support');await page.locator('input[name=subject]').fill('Local setup fixture');await page.locator('textarea[name=message]').fill('This is a disposable local setup request.');await page.getByRole('button',{name:'Save support request'}).click();await page.getByText(/Your support request was saved/).waitFor();await page.reload();await page.getByText('Local setup fixture',{exact:true}).waitFor();reports.push('support saves a real owned ticket');
  await page.goto(origin+'/creator');await page.getByRole('heading',{name:'Your creator journey starts here'}).waitFor();reports.push('unapproved creator denied');
  await page.goto(origin+'/creators/apply');await page.locator('textarea[name=channels]').fill('https://example.invalid/'+run);await page.locator('input[name=audience]').fill('Local fixture '+run);await page.locator('input[name=consent]').check();await page.getByRole('button',{name:'Submit application'}).click();await page.getByText(/Your application is/).waitFor();
  const apps=await(await api('/api/creator/operator',{action:'applications'},{Authorization:'Bearer disposable-local-operator-fixture'})).json(),app=apps.applications.find(a=>a.audience==='Local fixture '+run);assert.ok(app);
  assert.equal((await api('/api/creator/operator',{action:'review',userId:app.user_id,status:'approved'},{Authorization:'Bearer disposable-local-operator-fixture'})).status(),200);
  await page.goto(origin+'/creator/settings');await page.locator('input[name=consent]').check();await page.getByRole('button',{name:'Acknowledge proposal'}).click();await page.getByText('Proposal acknowledged',{exact:true}).waitFor();
  await page.goto(origin+'/creator/links');await page.locator('input[name=tag]').fill('YouTube · local fixture');await page.getByRole('button',{name:'Create link',exact:true}).click();await page.getByText('Referral link created.',{exact:true}).waitFor();reports.push('application, separate operator approval, proposal acknowledgement and own link creation');
  await page.goto(origin+'/creator');await page.getByRole('heading',{name:'Creator overview',exact:true}).waitFor();await page.getByRole('button',{name:'Copy link',exact:true}).click();await page.getByText(/Copied to clipboard|Clipboard unavailable/).waitFor();
  await page.screenshot({path:path.join(out,'creator-empty-desktop.png'),fullPage:true});
  // Nonzero records are isolated visual fixtures, inserted only in the local D1 by exact user ID.
  const partnerQuery=`SELECT id FROM creator_partners WHERE user_id='${app.user_id}'`;
  const now=Date.now(),id='a1'+run.padEnd(30,'0').replace(/[^a-f0-9]/g,'e').slice(0,30);
  const sql=`INSERT INTO affiliate_commissions VALUES ('${id}','${id}',(${partnerQuery}),'fixture-buyer-${run}','usd',12000,2500,3000,'proposal-20261007-v1',${now-3*86400000},0);\nINSERT INTO affiliate_ledger (id,commission_id,bucket,amount,reason,created_at) VALUES ('fixture-${run}','${id}','Available',3000,'Isolated visual fixture',${now});\n`;
  const fixture=path.join(root,'.sites-runtime/phonebridger-account-local','visual-fixture.sql');await fs.writeFile(fixture,sql);
  execFileSync(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'d1','execute','phonebridger-account-local','--local','--config','deploy/phonebridger/account-local/wrangler.jsonc','--persist-to','.sites-runtime/phonebridger-account-local','--file',fixture],{cwd:root,stdio:'pipe'});
  await page.reload();await page.getByText('$30.00',{exact:true}).first().waitFor();await page.locator('svg.chart').waitFor();await page.screenshot({path:path.join(out,'creator-records-desktop.png'),fullPage:true});
  const routes=['/account','/account/downloads','/account/licences','/account/orders','/account/support','/account/settings','/account/integrations','/creators/apply','/creator','/creator/links','/creator/performance','/creator/referrals','/creator/earnings','/creator/payouts','/creator/media-kit','/creator/content','/creator/settings'];
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:1000});
   for(const route of routes){await page.goto(origin+route);await page.locator('main[aria-busy="false"]').waitFor();assert.equal(await page.getByRole('heading',{name:'We couldn’t load this page'}).count(),0,route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} overflow at ${width}`);assert.deepEqual(await page.locator('main img').evaluateAll(images=>images.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)),[],`${route} broken image`);assert.equal((await page.request.get(origin+route)).headers()['x-robots-tag'],'noindex, nofollow');}
   if(width===390||width===320){await page.goto(origin+'/creator');await page.getByRole('heading',{name:'Creator overview',exact:true}).waitFor();await page.screenshot({path:path.join(out,`creator-${width}.png`),fullPage:true});await page.getByRole('button',{name:'Open navigation'}).click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'Open navigation'}).getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-menu')),true);reports.push(`drawer Escape/focus at ${width}`);await page.goto(origin+'/account');await page.getByRole('heading',{name:'Welcome back, Alex.'}).waitFor();await page.screenshot({path:path.join(out,`customer-${width}.png`),fullPage:true});}
  }
  // Real API isolation against another independently authenticated account.
  const other=await browser.newContext(),r=await other.request.post(origin+'/api/account/register',{headers:{Origin:origin},data:{email:`other-${run}@example.invalid`,password}});assert.equal(r.status(),201);
  const otherCookie=r.headers()['set-cookie'].split(';')[0];const otherTickets=await(await other.request.get(origin+'/api/workspace/support',{headers:{Cookie:otherCookie}})).json();assert.equal(otherTickets.tickets.length,0);assert.equal((await other.request.get(origin+'/api/creator/overview',{headers:{Cookie:otherCookie}})).status(),403);await other.close();reports.push('two actual sessions cannot read each other’s tickets or creator data');
  await page.setViewportSize({width:1440,height:1000});await page.route('**/api/workspace/summary',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary acceptance outage.'})}));await page.goto(origin+'/account');await page.getByRole('heading',{name:'We couldn’t load this page'}).waitFor();await page.screenshot({path:path.join(out,'service-error.png'),fullPage:true});await page.unroute('**/api/workspace/summary');await page.getByRole('button',{name:'Try again'}).click();await page.getByRole('heading',{name:'Welcome back, Alex.'}).waitFor();reports.push('visible service error and retry recover');
  assert.deepEqual(errors,[]);reports.push('17 routes at 4 widths; no body overflow, broken images or uncaught page errors');
  await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify({status:'PASS',mode:'local-disposable-fixtures',reports},null,2));console.log(JSON.stringify({status:'PASS',reports,screenshots:out}));
 }finally{await browser.close();}
}
runChecks().catch(e=>{console.error(e.message);process.exitCode=1;});
