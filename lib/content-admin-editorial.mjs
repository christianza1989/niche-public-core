import {authError} from './content-admin-auth.mjs';
import {textLeaves} from './content-rewrite-contract.mjs';

const fold=value=>value.normalize('NFC').toLocaleLowerCase('lt');
export async function editorialRules(db,siteId) {
  return (await db.prepare('SELECT id,term,instruction FROM content_admin_editorial_rules WHERE site_id=? AND active=1 ORDER BY created_at,id').bind(siteId).all()).results;
}
export async function saveEditorialRule(db,siteId,input,actor) {
  if(!input||Object.keys(input).some(k=>!['id','term','instruction'].includes(k))||!/^[a-z0-9-]{16,80}$/.test(input.id||'')||typeof input.term!=='string'||input.term.trim().length<3||input.term.length>160||typeof input.instruction!=='string'||!input.instruction.trim()||input.instruction.length>4000)throw authError(400,'Įrašykite ieškomą žodį ar frazę (3–160 simbolių) ir pastabą.');
  const term=input.term.trim().normalize('NFC'),instruction=input.instruction.trim();
  await db.prepare('INSERT INTO content_admin_editorial_rules(site_id,id,term,instruction,actor_email,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(site_id,id) DO NOTHING').bind(siteId,input.id,term,instruction,actor,Date.now()).run();
  const r=await db.prepare('SELECT id,term,instruction,active FROM content_admin_editorial_rules WHERE site_id=? AND id=?').bind(siteId,input.id).first();
  if(r.term!==term||r.instruction!==instruction||r.active!==1)throw authError(409,'Šiuo numeriu jau išsaugota kita taisyklė.');
  return {id:r.id,term:r.term,instruction:r.instruction};
}
export async function deactivateEditorialRule(db,siteId,id) {
  const r=await db.prepare('UPDATE content_admin_editorial_rules SET active=0 WHERE site_id=? AND id=? AND active=1').bind(siteId,id).run();return {removed:Boolean(r.meta.changes)};
}
export function matchingRanges(page,term) {
  // Literal, case-insensitive matching only. A stem is explicitly chosen by the owner;
  // the machine makes no linguistic or semantic judgement and changes no prose.
  return textLeaves(page).filter(l=>fold(l.text).includes(fold(term))).map(l=>({from:l.path,to:l.path,start:0,end:l.text.length,quote:l.text}));
}
export function editorialIssues(page,rules) {
  return rules.flatMap(rule=>{const ranges=matchingRanges(page,rule.term);return ranges.length?[{...rule,fields:ranges.map(r=>r.from)}]:[];});
}
export async function requireEditorialRules(db,siteId,page) {
  const issues=editorialIssues(page,await editorialRules(db,siteId));
  if(issues.length)throw authError(409,'Tekste liko pagal svetainės taisykles taisytinų žodžių: '+issues.map(i=>i.term).join(', ')+'. Pirmiausia pataisykite juodraštį.');
}
