'use client';

export function MemoPrintInstructions(){
 return <button type="button" onClick={()=>window.print()}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7zM17 11h.01"/></svg>
  Spausdinti instrukciją
 </button>;
}
