const key=Symbol('content-admin-request-projection');
export function attachAdminProjection(pkg,settings,at){Object.defineProperty(pkg,key,{value:{settings,at},enumerable:false});return pkg;}
export const adminProjectionContext=pkg=>pkg[key];
export function publicationSettings(settings,siteId,pausedAt){
 const result={...settings,guidePublicationPausedAtBySite:{...(settings.guidePublicationPausedAtBySite||{})}};
 if(pausedAt===null)delete result.guidePublicationPausedAtBySite[siteId];else result.guidePublicationPausedAtBySite[siteId]=pausedAt;
 return result;
}
export const contentAdminEnabled=(bindings,siteId)=>siteId==='promedical'&&bindings.CONTENT_ADMIN_ENABLED==='1';
