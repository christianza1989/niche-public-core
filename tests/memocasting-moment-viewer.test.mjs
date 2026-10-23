import test from 'node:test';
import assert from 'node:assert/strict';
import {momentImageGeometry,constrainMomentView,focusMomentDetail} from '../lib/memocasting-moment-viewer.mjs';
test('portrait and landscape viewports fit the whole image without stretching',()=>{
 assert.deepEqual(momentImageGeometry(800,500,1448,1086),{width:800,height:500,fittedWidth:2000/3,fittedHeight:500});
 const phone=momentImageGeometry(280,400,1448,1086);assert.equal(phone.fittedWidth,280);assert.equal(phone.fittedHeight,210);
});
test('bounded dragging cannot move the entire detail image out of view',()=>{
 for(const dimensions of [[800,500],[280,400],[1600,400]]){
  const g=momentImageGeometry(...dimensions,1448,1086),v=constrainMomentView({scale:3,x:1e6,y:-1e6},g);
  assert.ok(Math.abs(v.x)<=Math.max(0,(g.fittedWidth*v.scale-g.width)/2));assert.ok(Math.abs(v.y)<=Math.max(0,(g.fittedHeight*v.scale-g.height)/2));
  assert.deepEqual(constrainMomentView({scale:1,x:1e6,y:-1e6},g),{scale:1,x:0,y:0});
 }
});
test('hotspot centers the requested detail when bounds permit and stays safe on phones',()=>{
 const g=momentImageGeometry(600,450,1448,1086),point={x:.4,y:.53},v=focusMomentDetail(point,g);
 assert.ok(Math.abs(v.x-132)<1e-8);assert.ok(Math.abs(v.y+29.7)<1e-8);assert.equal(v.scale,2.2);
 const edge=focusMomentDetail({x:0,y:1},g,99);assert.equal(edge.scale,3);assert.equal(edge.x,600);assert.equal(edge.y,-450);
});
test('invalid transform input and repeated zoom reset cannot produce NaN',()=>{
 const g=momentImageGeometry(0,NaN,0,Infinity);
 assert.deepEqual(constrainMomentView({scale:NaN,x:Infinity,y:NaN},g),{scale:1,x:0,y:0});
 assert.deepEqual(constrainMomentView({scale:-5,x:500,y:500},g),{scale:1,x:0,y:0});
});
