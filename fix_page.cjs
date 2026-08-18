const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

code = code.replace(/\.page \{\n\s*display: flex;/g,
  `.page {
            width: 210mm;
            display: flex;`);
            
fs.writeFileSync('src/components/Flashcards.tsx', code);
