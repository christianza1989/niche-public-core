export type StepOverIconName = "document" | "eye" | "pen" | "archive" | "arrow" | "check" | "mail";
const paths: Record<StepOverIconName, string> = {
  document: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5M9 12h6m-6 4h4",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  pen: "m14.5 5.5 4 4M4 20l1.5-6.5L16 3a2.8 2.8 0 0 1 4 4L9.5 17.5 4 20Zm1.5-6.5 4 4M13 21h8",
  archive: "M20 6c0 2-3.6 3-8 3S4 8 4 6s3.6-3 8-3 8 1 8 3ZM4 6v12c0 2 3.6 3 8 3s8-1 8-3V6M4 12c0 2 3.6 3 8 3s8-1 8-3",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m6 12 4 4 8-8",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 1 9 7 9-7",
};
export function StepOverIcon({ name, className }: { name: StepOverIconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none"><path d={paths[name]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
