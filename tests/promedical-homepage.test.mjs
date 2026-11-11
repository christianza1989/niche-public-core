import test from 'node:test';import assert from 'node:assert/strict';
import {promedicalHomepageModel} from '../lib/promedical-homepage.mjs';
test('new composition resolves only eligible editorial identities and retains the catalogue query',()=>{
 const media=Array.from({length:13},(_,i)=>({id:`image-${i}`,familyId:`family-${i}`,width:800,height:400,src:`/${i}.webp`,alt:'',rights:'owner'}));
 const heading=(level,text)=>({type:'heading',level,text}),image=i=>({type:'image',assetId:media[i].id}),para={type:'paragraph',text:'Approved copy'};
 const body=[heading(2,'Institutions'),para];const labels=[];
 for(let i=0;i<3;i++){labels.push(`institution${i}`);body.push(heading(3,labels.at(-1)),image(i+2),para);}
 body.push(heading(2,'Groups'));for(let i=0;i<6;i++){labels.push(`group${i}`);body.push(heading(3,labels.at(-1)),image(i+5));if(i===5)body.push(image(11));}
 body.push(heading(2,'Configuration'),image(12),para,{type:'list',items:['A','B','C']},heading(2,'Process'));for(let i=0;i<3;i++)body.push(heading(3,`step${i}`),para);
 const targets=labels.map((label,i)=>({id:`target${i}`,slug:i===3?'produktai':`category${i}`}));
 const page={type:'home',body,media,links:labels.map((label,i)=>({label,targetPageId:targets[i].id}))};
 const model=promedicalHomepageModel(page,targets);assert.equal(model.groups.rows[0].href,'/produktai?q=Mayo');assert.equal(model.hero.id,'image-0');assert.equal(model.room.id,'image-1');
 assert.equal(promedicalHomepageModel(page,targets.slice(1)),null,'Held/deleted target must not silently yield a new home link');
 assert.equal(promedicalHomepageModel({...page,media:media.slice(1)},targets),null,'Missing image cannot opt into selected layout');
 assert.equal(promedicalHomepageModel({...page,body:[para]},targets),null,'Old published homepage keeps its original renderer');
});
