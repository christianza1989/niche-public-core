import {createCommerceMailGateway,D1CommerceMailLedger} from '../../../lib/commerce-mail-gateway.mjs';
export default {async fetch(request,env){return createCommerceMailGateway({config:{storeId:'memo-fixture',environment:'sandbox',from:'sender@example.test',enabled:true,testRecipients:['buyer@example.test']},ledger:new D1CommerceMailLedger(env.COMMERCE_MAIL_DB),send:async message=>{
 const response=await env.SMTP_FIXTURE.fetch('https://smtp-fixture.internal/'+message.id);
 if(!response.ok)throw Error('fixture_unknown');
 }})(request);}};
