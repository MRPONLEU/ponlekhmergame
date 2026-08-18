const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

const newOption = `<option value="'Kh-MPS-Temple', sans-serif">Kh-MPS Temple</option>`;
if (code.includes('បាត់ដំបង (Battambang)</option>')) {
  code = code.replace(
    /(\<option value="'Battambang', sans-serif">បាត់ដំបង \(Battambang\)<\/option>)/,
    `$1\n                ${newOption}`
  );
}

const fontFace = `@font-face {
            font-family: 'Kh-MPS-Temple';
            src: url('${'${window.location.origin}'}/fonts/Kh-MPS-Temple.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }`;
if (code.includes('@import url(')) {
  code = code.replace(
    /(\@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Kantumruy\+Pro.*?'\);)/,
    `$1\n          ${fontFace}`
  );
}

fs.writeFileSync('src/components/Flashcards.tsx', code);
