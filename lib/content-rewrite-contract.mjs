// Pure shared contract: offsets are UTF-16, the same units as DOM Range and JS strings.
export function textLeaves(page) {
  return [{path:'title',text:page.title},{path:'description',text:page.description},
    ...page.body.flatMap((b,i)=>b.type==='image'?[]:b.type==='list'
      ?b.items.map((text,j)=>({path:`body.${i}.items.${j}`,text}))
      :[{path:`body.${i}.text`,text:b.text}])];
}
export function selectedText(page,selection) {
  if(!selection||Object.keys(selection).some(k=>!['from','to','start','end','quote'].includes(k)))throw Error('Netinkamas pažymėjimas.');
  const leaves=textLeaves(page),a=leaves.findIndex(l=>l.path===selection.from),z=leaves.findIndex(l=>l.path===selection.to);
  if(a<0||z<a||(!selection.from.startsWith('body.')&&a!==z)||(!selection.to.startsWith('body.')&&a!==z))throw Error('Pažymėkite antraštės, aprašymo arba pagrindinio teksto dalį.');
  const {start,end}=selection;
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>=leaves[a].text.length||end<1||end>leaves[z].text.length||(a===z&&end<=start))throw Error('Pažymėta dalis nebeatitinka teksto.');
  const quote=leaves.slice(a,z+1).map((l,i)=>l.text.slice(i===0?start:0,i===z-a?end:undefined)).join('\n\n');
  if(selection.quote!==quote)throw Error('Pažymėta dalis pasikeitė. Pažymėkite iš naujo.');
  return {quote,leaves,a,z};
}
export function selectionChanges(page,selection,replacement) {
  if(typeof replacement!=='string'||!replacement.trim()||replacement.length>3000)throw Error('Dalies atsakymas turi būti 1–3000 simbolių tekstas.');
  const {leaves,a,z}=selectedText(page,selection),copy=structuredClone(page);
  const value=leaves[a].text.slice(0,selection.start)+replacement.trim()+leaves[z].text.slice(selection.end);
  if(!selection.from.startsWith('body.'))return {[selection.from]:value};
  const remove=new Set(leaves.slice(a+1,z+1).map(l=>l.path));
  copy.body=copy.body.flatMap((b,i)=>{
    if(b.type==='image')return [b];
    if(b.type==='list') {
      b.items=b.items.flatMap((text,j)=>{const path=`body.${i}.items.${j}`;return remove.has(path)?[]:[path===selection.from?value:text]});
      return b.items.length?[b]:[];
    }
    const path=`body.${i}.text`;if(remove.has(path))return [];
    return [{...b,text:path===selection.from?value:b.text}];
  });
  return {body:copy.body};
}
