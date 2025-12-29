// Utility function hodge-podge.
// Helper functions first, then exported ones below.

'use strict'; // CommonJS (CJS) doesn't default to this like ESM does

// NON-DRY WARNING: Master copy lives in H.M.S. Parsafore in the tminder repo.
function deoctalize(s) {
  if (s.includes('Z')) return "ERROR" // Z is our sentinel
  s = s.replace(/\b0+(?!\d)/g, 'Z')   // replace NON-leading zeros with sentinel 
       .replace(/[1-9\.]0+/g, m => m.replace(/0/g, 'Z')) // save these too
       .replace(/0/g, '')             // throw away the rest of the zeros
       .replace(/Z/g, '0')            // turn sentinels back to zeros
  return s
}

// -----------------------------------------------------------------------------
module.exports = { // we're using ES2015 object method shorthand syntax here

// Singular or plural. Eg, splur(0, "cat") returns "0 cats" or for irregular 
// plurals, eg, splur(1, "child", "children") returns "1 child".
splur(n, s, p=null) { return n === 1    ? `${n} ${s}`
                           : p === null ? `${n} ${s}s`
                           :              `${n} ${p}`
},

// Turn a number like 123 into an ordinal string like "123rd"
ordain(n) {
  const s = ['th', 'st', 'nd', 'rd'];          // all possible suffixes
  const dd = Math.abs(n) % 100;                // last 2 digits determine suffix
  const d = dd % 10;                           // last digit
  return n + (dd>10 && dd<14 ? 'th' : d>0 && d<4 ? s[d] : 'th')
},

// Random integer from 1 to n inclusive
randint(n) { return Math.floor(Math.random() * n) + 1 },

// Bernoulli trial with probability p
bern(p) { return Math.random() < p },

// Eval but just return null if syntax error. Be careful!
// I'm 97% sure this is safe even server-side, that these whitelisted characters
// are not enough to allow arbitrary code execution: 
//   whitespace, digits, decimal points, arithmetic operators, parentheses
// (Plus some additions, see below.)
// Square brackets in particular are unsafe. See the infamous JSFuck: arbitrary 
// code execution using only the six characters `[]()!+`.
// Claude thinks we can allow all of the following safely:
//   0-9 . + - * / ( ) ^ & | ~ < > = ! ? : ; , % @ # whitespace
// with the main things to make sure to block being:
//   square brackets
//   any quotes -- double, single, or backticks
//   letters
//   dollar signs and underscores which are valid identifiers in javascript
// I'm yolo-ing slightly and assuming ^ and e are fine, for exponentiation and
// scientific notation.
laxeval(s) {
  if (/[^\s\d\.\+\-\*\/\^\(\)e]/.test(s)) return null    // abort if ∉ whitelist
  s = s.replace(/\^/g, '**');   // use ^ for exponentiation as alias for JS's **
  try { 
    const x = eval(deoctalize(s))
    return typeof x === 'undefined' ? null : x
  } catch(e) { return null } 
},

isnum(x) { return !isNaN(parseFloat(x)) && isFinite(x) },


} // -------------------------------------------------------- END module.exports
