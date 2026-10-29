import test from 'node:test';
import assert from 'node:assert/strict';
import {contactMethodFields} from '../lib/niche-contact-method.mjs';
const form=overrides=>new URLSearchParams({name:'Vietinis bandymas',contact_method:'phone',phone:'+370 600 00000',email:'',message:'',consent:'yes',...overrides});
test('telephone requests persist a real phone without inventing an email',()=>{
 const v=contactMethodFields(form());assert.ok(v);assert.equal(v.email,'');assert.match(v.storedMessage,/Telefonas: \+370 600 00000/);assert.equal(v.method,'phone');
});
test('chosen contact channel is validated on the server',()=>{
 assert.equal(contactMethodFields(form({phone:''})),null);
 assert.equal(contactMethodFields(form({contact_method:'email'})),null);
 assert.ok(contactMethodFields(form({contact_method:'email',phone:'',email:'synthetic@example.com'})));
 assert.equal(contactMethodFields(form({contact_method:'other'})),null);
});
test('malformed optional fields and absent notice acknowledgement are rejected',()=>{
 assert.equal(contactMethodFields(form({email:'not an email'})),null);
 assert.equal(contactMethodFields(form({phone:'+370\nInjected: value'})),null);
 assert.equal(contactMethodFields(form({consent:''})),null);
 assert.equal(contactMethodFields(form({message:'x'.repeat(3001)})),null);
});
