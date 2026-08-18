const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

code = code.replace(/\.card-word \{\n\s*font-size: 64pt;\n\s*font-weight: 700;/g, 
  '.card-word {\n            font-size: 64pt;\n            font-weight: normal;');

fs.writeFileSync('src/components/Flashcards.tsx', code);
