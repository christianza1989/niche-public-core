import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoPaymentAvailability} from '../lib/memocasting-payment-status.mjs';
const live={environment:'production',testOnly:false,paymentConnected:true,productionReady:true,publishOffers:true};
test('live payment acceptance requires explicit readiness, a connected provider and a non-test production context',()=>{
 assert.equal(memoPaymentAvailability(live),'available');
 for(const key of Object.keys(live)){const context={...live};delete context[key];assert.notEqual(memoPaymentAvailability(context),'available',key);}
 for(const context of [null,{},true,{...live,productionReady:false},{...live,publishOffers:false},{...live,environment:'unknown'}])assert.equal(memoPaymentAvailability(context),'unknown');
});
test('sandbox and unconnected providers remain unavailable even when other readiness flags appear enabled',()=>{
 for(const context of [{...live,environment:'sandbox'},{...live,testOnly:true},{...live,paymentConnected:false}])assert.equal(memoPaymentAvailability(context),'unavailable');
});
