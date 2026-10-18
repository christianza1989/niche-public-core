import configurations from '../config/site-languages.json' with {type:'json'};
export function languageConfig(pkg){return configurations[pkg.siteId];}
export function pageLanguage(pkg,page){const c=languageConfig(pkg);if(!c)return pkg.locale;const key=page?.slug?.split('/')[0];return c.locales[key]||c.locales[c.default];}
export function pageLanguageKey(pkg,page){const c=languageConfig(pkg);return c?Object.keys(c.locales).find(k=>c.locales[k]===pageLanguage(pkg,page)):pkg.locale.split('-')[0];}
export function pageRole(pkg,page){const c=languageConfig(pkg);if(!c)return {'gidai':'guides','redakcija':'profile','kontaktai':'contact','apie-projekta':'about','privatumas':'privacy','naudojimo-salygos':'terms'}[page?.slug];
 for(const [role,paths]of Object.entries(c.routes))if(Object.values(paths).includes(page?.slug))return role;
 return page?.type==='product'?'product':page?.type==='guide'?'article':undefined;}
export function translationKey(pkg,page){const c=languageConfig(pkg);if(!c)return page.id;for(const [role,paths]of Object.entries(c.routes))for(const slug of Object.values(paths)){if(page.slug===slug)return role;if(c.children.includes(role)&&page.slug.startsWith(slug+'/'))return role+':'+page.slug.slice(slug.length+1);}return page.id;}
export function languagePath(pkg,role,language){const c=languageConfig(pkg);const slug=c?.routes[role]?.[language];return slug===undefined?null:slug?`/${slug}`:'/';}
export function pageAlternates(pkg,page,publicPages){const c=languageConfig(pkg);if(!c||!page)return [];const key=translationKey(pkg,page);return Object.keys(c.locales).flatMap(language=>{const target=publicPages.find(p=>translationKey(pkg,p)===key&&pageLanguageKey(pkg,p)===language);return target?[{language,locale:c.locales[language],page:target,path:target.slug?`/${target.slug}`:'/'}]:[];});}
export function localizedRolePage(pkg,role,page,publicPages){const language=pageLanguageKey(pkg,page);return publicPages.find(p=>pageRole(pkg,p)===role&&pageLanguageKey(pkg,p)===language);}
