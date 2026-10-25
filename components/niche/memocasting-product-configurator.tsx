'use client';
import {useCallback,useState} from 'react';
import {MemoProductGallery} from './memocasting-product-gallery';
import {MemoAdd,type ProductImage} from './memocasting-commerce';
import s from './memocasting-site.module.css';
type Image={id:string;src:string;srcSet:string;width:number;height:number;alt:string;credit:string};
export function MemoProductConfigurator({images,sku,language,country,cartPath,children}:{images:Image[];sku:string;language:string;country:string;cartPath:string;children?:React.ReactNode}){
 const [imageId,setImageId]=useState<string>(),[catalogImages,setCatalogImages]=useState<Image[]|null>(null);
 const updateImages=useCallback((images?:ProductImage[])=>setCatalogImages(images?.length?images.map(m=>({...m,srcSet:m.src+' '+m.width+'w',credit:''})):null),[]);
 return <div className={s.configurator}><MemoProductGallery key={(imageId??'default')+':'+(catalogImages??images).map(m=>m.id).join('|')} images={catalogImages??images} language={language} selectedImageId={imageId}/><div className={s.purchase}><MemoAdd sku={sku} language={language} country={country} cartPath={cartPath} onImageChange={setImageId} onImagesChange={updateImages}/>{children}</div></div>;
}
