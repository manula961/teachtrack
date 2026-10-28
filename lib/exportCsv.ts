/** Escape a value for a CSV cell without permitting spreadsheet formula injection.
 * Spreadsheet programs can interpret cells beginning with = + - @ as formulas.
 * Always quote values and prefix suspicious user-supplied text with an apostrophe.
 */
export function csvCell(value: unknown): string {
 const original=String(value??'')
 const safe=typeof value==='number'?original:/^[\s]*[=+\-@]/.test(original)?"'"+original:original
 return '"'+safe.replace(/"/g,'""')+'"'
}
