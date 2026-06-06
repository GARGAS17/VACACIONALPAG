const fs = require('fs');
const path = require('path');

function walk(d) {
  let r = [];
  fs.readdirSync(d).forEach(f => {
    let p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) r = r.concat(walk(p));
    else if (p.match(/\.(jsx|js|ts)$/)) r.push(p);
  });
  return r;
}

walk('./src').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let o = c;
  // This will safely replace bg-indigo-500 with bg-green-500, preserving the numbers.
  c = c.replace(/\b(indigo|blue)-(\d+)(\/\d+)?\b/g, 'green-$2$3');
  
  if (c !== o) {
    fs.writeFileSync(f, c);
    console.log('Updated ' + f);
  }
});
