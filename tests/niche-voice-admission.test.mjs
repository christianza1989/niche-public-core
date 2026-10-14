import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync(new URL('../lib/niche-voice.ts',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function adapter(env){
  const exports={};
  vm.runInNewContext(code,{exports,process:{env:{}},require(name){
    if(name==='cloudflare:workers')return {env};
    if(name.endsWith('niche-sites'))return {};
    if(name.endsWith('niche-network'))return {};
    throw Error('unexpected_dependency');
  }});
  return exports;
}
test('global voice switch preserves existing pilot and does not admit a newly registered site',()=>{
  const {voiceWidgetEnabled}=adapter({VOICE_WIDGET_ENABLED:'1'});
  assert.equal(voiceWidgetEnabled({siteId:'traktoriupadangos'}),true);
  assert.equal(voiceWidgetEnabled({siteId:'parasoplansetes'}),false);
});
test('explicit StepOver admission is isolated from other businesses and still needs the switch',()=>{
  const {voiceWidgetEnabled}=adapter({VOICE_WIDGET_ENABLED:'1',VOICE_SITE_IDS:' parasoplansetes '});
  assert.equal(voiceWidgetEnabled({siteId:'parasoplansetes'}),true);
  assert.equal(voiceWidgetEnabled({siteId:'traktoriupadangos'}),false);
  assert.equal(adapter({VOICE_SITE_IDS:'parasoplansetes'}).voiceWidgetEnabled({siteId:'parasoplansetes'}),false);
});
