import {captureSelection,selectAllText,selectionQuote} from './selection.js';
const el=(tag,text,props={})=>Object.assign(document.createElement(tag),{textContent:text,...props});
let cleanup=()=>{};
document.addEventListener('promedical:editor-unmount',()=>cleanup());
document.addEventListener('promedical:editor-mount',()=>{cleanup();mount()});
async function mount(){
 const host=document.querySelector('[data-promedical-editor]');if(!host)return;
 let disposed=false,session,record,editors=[],dirty=false,editing=false,selection=null,dialog=null;
 const abort=new AbortController(),hidden=[],extra=[];
 function restore(){for(const [node,display]of hidden)node.style.display=display;hidden.length=0;for(const node of extra)node.remove();extra.length=0;editors=[];editing=false;dirty=false;}
 cleanup=()=>{disposed=true;abort.abort();restore();dialog?.remove();host.replaceChildren();};
 async function api(path,input){
  const r=await fetch('/admin/api/'+path,{method:input===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:abort.signal,headers:input===undefined?{}:{'content-type':'application/json','x-admin-csrf':session.csrf},...(input===undefined?{}:{body:JSON.stringify(input)})});
  const data=await r.json();if(!r.ok)throw Object.assign(Error(r.status===401?'Sesija baigėsi. Prisijunkite kitame lange; jūsų pakeitimai liko čia.':data.error||'Nepavyko atlikti veiksmo.'),{status:r.status});return data;
 }
 try{session=await api('session')}catch{return}if(disposed)return;
 const id=host.dataset.pageId,bar=el('section','',{className:'pm-owner pm-owner-bar'}),status=el('p','',{className:'pm-owner-status'});bar.setAttribute('aria-label','Teksto valdymas');status.setAttribute('role','status');
 function message(text,error=false){status.textContent=text;status.classList.toggle('pm-owner-error',error);if(error&&text.includes('Sesija'))status.append(' ',el('a','Prisijungti',{href:'/admin/login',target:'_blank',rel:'noopener'}));}
 function button(label,fn,primary=false){const b=el('button',label,{type:'button',className:primary?'pm-primary':''});b.addEventListener('click',async()=>{b.disabled=true;try{await fn()}catch(e){if(e.name!=='AbortError')message(e.message,true)}finally{b.disabled=false}},{signal:abort.signal});return b;}
 async function latest(){session=await api('session');const r=await api('texts/'+id);if(r.conflict)throw Error('Svetainės šaltinis pasikeitė. Pirmiausia reikia suderinti teksto versijas.');return r;}
 function hide(node){hidden.push([node,node.style.display]);node.style.display='none';}
 function field(path,text,label,target,parent){const box=el('label',label,{className:'pm-inline-field'}),input=el('textarea','',{value:text,rows:Math.max(2,Math.min(16,Math.ceil(text.length/75))),maxLength:path==='title'||path==='description'?300:3000});box.append(input);input.addEventListener('input',()=>{dirty=true;message('Yra neišsaugotų pakeitimų.')},{signal:abort.signal});if(target){target.before(box);hide(target)}else parent.append(box);extra.push(box);editors.push({path,input});}
 function controls(){bar.replaceChildren(el('strong','Roko redagavimas'),el('a','Dar nematomi tekstai',{href:'/admin/pending'}));
  if(editing){bar.append(button('Išsaugoti juodraštį',async()=>{
    const changes={title:record.draft.title,description:record.draft.description,body:structuredClone(record.draft.body)};
    for(const {path,input}of editors){const keys=path.split('.');let target=changes;for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)]=input.value;}
    session=await api('session');await api(`texts/${id}/save`,{etag:record.etag,changes});restore();controls();message('Juodraštis išsaugotas. Viešas tekstas liko nepakeistas.');status.append(' ',el('a','Palyginti seną ir naują tekstą',{href:`/admin/text/${id}?mode=compare`}));
   },true),button('Atšaukti taisymą',()=>{if(!dirty||confirm('Atšaukti neišsaugotus pakeitimus?')){restore();controls();message('Rodomas viešas tekstas.')}}));
  }else if(['guide','category','product'].includes(host.dataset.kind))bar.append(button('Taisyti',startEdit),button('Pažymėti visą tekstą',()=>{selection=selectAllText(document.querySelector('#turinys'));message('Pasirinktas visas tekstas. Spauskite „Perrašyti pažymėtą tekstą“.')}),button('Perrašyti pažymėtą tekstą',rewrite));
  bar.append(status);
 }
 async function startEdit(){record=await latest();if(disposed)return;editing=true;selection=null;
  const root=document.querySelector('#turinys');for(const name of ['title','description'])field(name,record.draft[name],name==='title'?'Pavadinimas':'Meta aprašymas',root.querySelector(`[data-edit-path="${name}"]`),bar.parentElement);
  let target=root.querySelector('[data-edit-body]');const body=el('section','',{className:'pm-inline-body'});body.append(el('h2','Teksto juodraštis'));if(target){target.before(body);hide(target)}else root.append(body);extra.push(body);
  record.draft.body.forEach((b,i)=>{if(b.type==='image'){body.append(el('p','Esamas vaizdas išsaugomas.'));return}if(b.type==='list')b.items.forEach((text,j)=>field(`body.${i}.items.${j}`,text,`Sąrašo punktas ${j+1}`,null,body));else field(`body.${i}.text`,b.text,b.type==='heading'?'Skyriaus antraštė':'Pastraipa',null,body)});
  controls();message('Taisote naujausią juodraštį vietoje. Išsaugojus jis lauks jūsų patvirtinimo.');editors[0]?.input.focus();
 }
 document.querySelector('#turinys')?.addEventListener('pointerdown',()=>{if(!editing)selection=null},{signal:abort.signal});
 document.addEventListener('selectionchange',()=>{
  if(editing)return;const captured=captureSelection(document.querySelector('#turinys'));if(captured)selection=captured;
 },{signal:abort.signal});
 async function rewrite(){
  const choice=structuredClone(selection);if(!choice)throw Error('Pažymėkite norimą dalį arba spauskite „Pažymėti visą tekstą“.');
  const part=choice.mode==='selection',chosen=choice.selection;
  record=await latest();if(disposed)return;
  if(record.draft.revisionHash!==host.dataset.revision)throw Error('Yra naujesnis juodraštis. Pažymėkite jo tekstą skyrelyje „Dar nematomi tekstai“.');
  dialog=el('dialog','',{className:'pm-owner pm-owner-dialog'});const title=part?'Perdaryti pažymėtą dalį':'Perrašyti visą tekstą';dialog.setAttribute('aria-label',title);
  const note=el('textarea','',{maxLength:4000}),label=el('label','Kas negerai ir ką pakeisti?'),error=el('p','');error.setAttribute('role','alert');label.append(note);
  const requestId=crypto.randomUUID(),payload={id:requestId,etag:record.etag,mode:part?'selection':'whole',selection:chosen,note:''};let sentPayload=null;
  const send=button('Įrašyti į eilę',async()=>{error.textContent='';try{
    // Retain the exact request after an ambiguous network failure for idempotent retry.
    sentPayload??={...payload,note:note.value};note.disabled=true;session=await api('session');const job=await api(`texts/${id}/rewrite`,sentPayload);
    dialog.close();message(`Užduotis įrašyta į eilę. ${job.state==='superseded'?'Ją jau pakeitė naujesnis prašymas.':'Patikrintas atsakymas bus pateiktas kaip juodraštis.'}`);
   }catch(e){error.textContent=e.message;if(e.status&&e.status<500){sentPayload=null;note.disabled=false;}}},true);
  const actions=el('div','',{className:'pm-owner-actions'});actions.append(button('Atšaukti',()=>dialog.close()),send);
  dialog.append(el('h2',title),el('p',record.draft.title),el('p',part?'Bus pakeista tik ši dalis:':'Perrašomas naujausias juodraštis. Naujas prašymas pakeis ankstesnę laukiančią šio teksto užduotį.'));
  if(chosen)dialog.append(el('blockquote',selectionQuote(choice)));dialog.append(label,error,actions);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();dialog=null},{once:true});dialog.showModal();note.focus();
 }
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}},{signal:abort.signal});
 document.addEventListener('click',e=>{if(dirty&&e.target.closest('a')&&!confirm('Palikti neišsaugotus pakeitimus?')){e.preventDefault();e.stopPropagation()}},{capture:true,signal:abort.signal});
 controls();host.replaceChildren(bar);
}
