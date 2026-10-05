/** Compare scope selections; this never evaluates price, quality or safety.
 * @param {string[]} labels
 * @param {Array<[string,string]>} choices
 */
export function summarizeQuoteCheck(labels, choices) {
  if (labels.length !== choices.length || choices.some(pair => pair.length !== 2 || pair.some(value => !['unknown','included','excluded'].includes(value)))) throw new Error('Invalid quote-scope selections.');
  return {
    unknownA: labels.filter((_,i)=>choices[i][0]==='unknown'),
    unknownB: labels.filter((_,i)=>choices[i][1]==='unknown'),
    different: labels.filter((_,i)=>choices[i][0]!=='unknown'&&choices[i][1]!=='unknown'&&choices[i][0]!==choices[i][1]),
  };
}
