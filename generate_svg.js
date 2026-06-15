const fs = require('fs');
let path = "M0,30 ";
for (let i = 0; i <= 1200; i += 5) {
  let y = 15 + Math.random() * 15;
  path += `L${i},${y} `;
}
path += "L1200,30 Z";
console.log(path);
