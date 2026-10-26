import type {NichePage} from '@/lib/niche-sites';
import {memoGuideVideo} from '@/lib/memocasting-guide-videos.mjs';
import s from './memocasting-guide-video.module.css';

export function MemoGuideVideo({page,heading}:{page:NichePage;heading:string}){
 const item=memoGuideVideo(page,heading);
 if(!item)return null;
 const caption='memo-guide-video-'+item.id;
 return <figure className={s.figure} data-memo-guide-video={item.id}>
  <video controls playsInline muted preload="none" poster={item.poster} width={item.width} height={item.height} aria-label={item.alt} aria-describedby={caption}>
   <source src={item.src} type="video/mp4"/>
   Jūsų naršyklė nepalaiko vaizdo įrašo. <a href={item.src}>Atidaryti vaizdo įrašą</a>.
  </video>
  <figcaption id={caption}>
   <strong>Pažiūrėkite, kaip kuriamas bendras prisiminimas</strong>
   <span>{item.alt} Įrašas padeda įsivaizduoti veiklą; konkretaus rinkinio kiekius ir laukimo laiką rinkitės pagal jo instrukciją.</span>
   <span className={s.note}>„Memory Casting“ pateiktas vaizdo įrašas · {item.durationLabel}. Įraše minimos akcijos gali būti pasibaigusios.</span>
  </figcaption>
 </figure>;
}
