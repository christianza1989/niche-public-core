// Business-independent option arithmetic; all amounts remain integer euro cents internally.
export function selectedItems(model,selections){return model.sections.flatMap(s=>s.items.filter(i=>Number(selections[s.id]?.[i.id])>0));}
export function availableItems(model,section,selections){
 const selected=selectedItems(model,selections);
 const electric=selected.some(i=>i.heaterType==='electric'||i.supportsWifi);
 if(section.visibleWhen?.bowlMaterial&&!selected.some(i=>i.materialType===section.visibleWhen.bowlMaterial))return [];
 const parent=model.sections.find(s=>s.id===section.tagFilterChildOf);const parentItems=parent?.items.filter(i=>Number(selections[parent.id]?.[i.id])>0)||[];
 if(parent&&!parentItems.length)return [];
 const tags=new Set(parentItems.flatMap(i=>i.tags||[]));
 return section.items.filter(i=>(!parent||!i.tags?.length||i.tags.some(t=>tags.has(t)))&&(!i.requiresHeaterWithWifi||electric)&&(!i.automaticWithElectricHeater||electric)&&(!i.requiresElectricHeater||electric)&&(!i.forNonElectricHeater||!electric)&&(!i.parentId||Number(selections[section.id]?.[i.parentId])>0));
}
export function normalizeConfiguration(model,input={}){
 const value={};for(const s of model.sections){value[s.id]={};for(const i of s.items){const q=Number(input[s.id]?.[i.id]);if(Number.isInteger(q)&&q>0)value[s.id][i.id]=Math.min(q,i.maxQty||1);}}
 for(let pass=0;pass<model.sections.length+2;pass++){const before=JSON.stringify(value);
 for(const s of model.sections){const items=availableItems(model,s,value),allowed=new Set(items.map(i=>i.id));for(const id of Object.keys(value[s.id]))if(!allowed.has(id))delete value[s.id][id];
 const groups=new Set();for(const i of items){if(!value[s.id][i.id])continue;const group=i.exclusiveGroup?`exclusive:${i.exclusiveGroup}`:!['multi','quantifiable'].includes(s.type)&&!i.renderAsCheckbox?`choice:${i.parentId||'root'}`:null;if(group&&groups.has(group)){delete value[s.id][i.id];continue;}if(group)groups.add(group);}
 if(Object.keys(value[s.id]).length>1)for(const i of items)if(value[s.id][i.id]&&(i.isNoneOption||/^(No |None$|Without )/i.test(i.label.en)))delete value[s.id][i.id];
 const auto=s.autoSelectWhenAny?.length? s.autoSelectWhenAny.some(id=>Object.entries(value[id]||{}).some(([key,q])=>q>0&&!model.sections.find(x=>x.id===id)?.items.find(i=>i.id===key)?.isNoneOption)):undefined;
 if(auto===false)value[s.id]={};
 if(s.autoSelectByTags){const tags=new Set(model.sections.filter(x=>x.tagFilterParent&&!x.autoSelectByTags&&!x.autoSelectWhenAny?.length).flatMap(x=>x.items.filter(i=>value[x.id]?.[i.id]).flatMap(i=>i.tags||[])));const i=items.filter(i=>i.tags?.length&&i.tags.every(t=>tags.has(t))).sort((a,b)=>b.tags.length-a.tags.length)[0];value[s.id]=i?{[i.id]:1}:{};}
 else if(auto===true){const i=items[0];value[s.id]=i?{[i.id]:1}:{};}
 for(const i of items.filter(i=>i.automaticWithElectricHeater)){for(const candidate of s.items)if(candidate.isNoneOption||/^(No |None$|Without )/i.test(candidate.label.en))delete value[s.id][candidate.id];value[s.id][i.id]=1;}
 }
 if(before===JSON.stringify(value))break;}
 return value;
}
export function initialConfiguration(model){return normalizeConfiguration(model);}
export function chooseOption(model,current,sectionId,itemId,quantity=1){const s=model.sections.find(s=>s.id===sectionId);const item=s?.items.find(i=>i.id===itemId);if(!item||!Number.isInteger(quantity)||quantity<0||quantity>(item.maxQty||1))throw Error('Invalid configuration option or quantity');
 const next=structuredClone(current);const multi=['multi','quantifiable'].includes(s.type)||item.renderAsCheckbox;
 next[s.id]=multi?{...next[s.id]}:Object.fromEntries(Object.entries(next[s.id]||{}).filter(([id])=>{const candidate=s.items.find(i=>i.id===id);return candidate?.renderAsCheckbox||candidate?.parentId!==item.parentId;}));
 if(quantity){if(item.isNoneOption||/^(No |None$|Without )/i.test(item.label.en)){next[s.id]={};}else for(const candidate of s.items)if(candidate.isNoneOption||/^(No |None$|Without )/i.test(candidate.label.en)||item.exclusiveGroup&&item.exclusiveGroup===candidate.exclusiveGroup)delete next[s.id][candidate.id];next[s.id][item.id]=quantity;}else delete next[s.id][item.id];
 return normalizeConfiguration(model,next);}
export function configurationQuote(model,input,locale='en'){
 const selections=normalizeConfiguration(model,input);const lines=[];const missing=[];
 for(const s of model.sections){const available=availableItems(model,s,selections);const entries=Object.entries(selections[s.id]||{});if(available.length&&!entries.length&&!s.autoSelectWhenAny?.length&&!s.autoSelectByTags&&!s.optional)missing.push(s.id);
 for(const [id,qty]of entries){const i=s.items.find(i=>i.id===id);if(!i||!Number.isFinite(i.price))throw Error('Invalid price');lines.push({sectionId:s.id,itemId:id,section:s.label[locale],label:i.label[locale],quantity:qty,unitCents:Math.round(i.price*100),amountCents:Math.round(i.price*100)*qty,automatic:!!(s.autoSelectByTags||s.autoSelectWhenAny?.length)});}}
 const totalCents=model.referencePrice===null?null:Math.max(0,Math.round(model.referencePrice*100)+lines.reduce((n,l)=>n+l.amountCents,0));
 return {version:1,siteId:model.siteId,productId:model.id,catalogueHash:model.dataHash,locale,currency:'EUR',priceBasis:model.priceBasis,baseCents:model.referencePrice===null?null:Math.round(model.referencePrice*100),totalCents,complete:missing.length===0,missing,lines,selections};
}
