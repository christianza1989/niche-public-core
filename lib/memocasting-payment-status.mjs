// A connected test provider never represents live payment acceptance.
export function memoPaymentAvailability(context){
 if(!context||typeof context!=='object')return 'unknown';
 if(context.schemaVersion===1&&context.environment==='sandbox'&&context.testOnly===true&&context.paymentConnected===true&&context.paymentProvider==='stripe'&&context.paymentEnvironment==='test'&&context.paymentAccountVerified===true&&context.productionReady===false&&context.publishOffers===false)return 'test';
 if(context.paymentConnected===false||context.environment==='sandbox'||context.testOnly===true)return 'unavailable';
 return context.environment==='production'&&context.testOnly===false&&context.paymentConnected===true&&context.productionReady===true&&context.publishOffers===true?'available':'unknown';
}

export function memoPaymentBrandMarks(state){
 return state==='available'?['visa','mastercard','stripe']:[];
}
