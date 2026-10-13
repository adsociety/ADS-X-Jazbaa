#!/usr/bin/env node
// Enumerates all 4^8 answer combinations using the SAME scoring code as the site.
// Usage: node scripts/check-distribution.js
const data = require('../quiz-data.js');
const { score } = require('../scoring.js');

const nQ = data.questions.length;
const nOpt = data.questions.map((q) => q.options.length);
const total = nOpt.reduce((a, b) => a * b, 1);
const counts = data.colours.map(() => 0);
const answers = new Array(nQ).fill(0);

for (let n = 0; n < total; n++) {
  let x = n;
  for (let i = 0; i < nQ; i++) { answers[i] = x % nOpt[i]; x = Math.floor(x / nOpt[i]); }
  counts[score(answers).index]++;
}

// Spec band is "roughly 13.5%-15%"; allow 0.1pt of slack on each side.
const LOW = 13.5, HIGH = 15, SLACK = 0.1;
let ok = true;
console.log(`Combinations checked: ${total.toLocaleString()}\n`);
data.colours.forEach((c, i) => {
  const pct = (counts[i] / total) * 100;
  const pass = pct >= LOW - SLACK && pct <= HIGH + SLACK;
  if (!pass) ok = false;
  console.log(`${c.name.padEnd(7)} ${String(counts[i]).padStart(6)}  ${pct.toFixed(2).padStart(6)}%  ${pass ? 'ok' : 'OUT OF RANGE'}`);
});
console.log(`\n${ok ? 'PASS' : 'FAIL'}: every colour should be roughly between ${LOW}% and ${HIGH}% (±${SLACK}).`);
process.exit(ok ? 0 : 1);
