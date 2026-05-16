const fs = require('fs');
const path = require('path');

const files = [
  'src/app/page.tsx',
  'src/app/api/admin/orders/route.ts',
  'src/app/api/admin/products/route.ts'
];

function score(s){
  const bad = (s.match(/Ã|Â|Ä|Ð|Æ|áº|á»|�/g)||[]).length;
  const qbad = (s.match(/Thi\?|c\?|b\?|\?u|\?i|\?ng/g)||[]).length;
  return bad + qbad;
}

for (const f of files){
  if(!fs.existsSync(f)) continue;
  const orig = fs.readFileSync(f, 'utf8');
  const repaired = Buffer.from(orig, 'latin1').toString('utf8');
  const s1 = score(orig);
  const s2 = score(repaired);
  if (s2 < s1) {
    fs.writeFileSync(f, repaired, 'utf8');
    console.log(`repaired: ${f} (${s1} -> ${s2})`);
  } else {
    console.log(`skipped: ${f} (${s1} -> ${s2})`);
  }
}
