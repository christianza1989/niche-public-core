// A connected test provider never represents live payment acceptance.
export function memoPaymentAvailability(context){
 if(!context||typeof context!=='object')return 'unknown';
 if(context.paymentConnected===false||context.environment==='sandbox'||context.testOnly===true)return 'unavailable';
 return context.environment==='production'&&context.testOnly===false&&context.paymentConnected===true&&context.productionReady===true&&context.publishOffers===true?'available':'unknown';
}
