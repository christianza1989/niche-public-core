// Capture the exact rendered version, not a subsequently fetched live/draft mix.
export function captureSelection(root) {
  const selected=window.getSelection();if(!selected?.rangeCount||selected.isCollapsed)return null;
  const range=selected.getRangeAt(0);
  const leaf=node=>(node.nodeType===Node.ELEMENT_NODE?node:node.parentElement)?.closest('[data-edit-path]');
  const a=leaf(range.startContainer),z=leaf(range.endContainer);
  if(!a||!z||!root.contains(a)||!root.contains(z))return null;
  const leaves=[...root.querySelectorAll('[data-edit-path]')],first=leaves.indexOf(a),last=leaves.indexOf(z);
  if(first<0||last<first)return null;
  const offset=(node,end,at)=>{const r=document.createRange();r.selectNodeContents(node);r.setEnd(end,at);return r.toString().length;};
  const start=offset(a,range.startContainer,range.startOffset),end=offset(z,range.endContainer,range.endOffset);
  if(first===0&&last===leaves.length-1&&start===0&&end===z.textContent.length)return {mode:'whole',selection:null};
  // Cross-field selections remain structured: one bounded replacement per leaf.
  const ranges=leaves.slice(first,last+1).map((n,i)=>{
    const from=n.dataset.editPath,s=i===0?start:0,e=i===last-first?end:n.textContent.length;
    return {from,to:from,start:s,end:e,quote:n.textContent.slice(s,e)};
  }).filter(r=>r.end>r.start);
  if(!ranges.length)return null;
  return {mode:'selection',selection:ranges.length===1?ranges[0]:{ranges}};
}
export function selectAllText(root) {
  const leaves=[...root.querySelectorAll('[data-edit-path]')];if(!leaves.length)return null;
  const range=document.createRange();range.setStart(leaves[0],0);range.setEnd(leaves.at(-1),leaves.at(-1).childNodes.length);
  const s=window.getSelection();s.removeAllRanges();s.addRange(range);return {mode:'whole',selection:null};
}
export const selectionQuote=choice=>choice?.mode==='whole'?'Visas tekstas':choice?.selection?.ranges?.map(r=>r.quote).join('\n\n')||choice?.selection?.quote||'';
