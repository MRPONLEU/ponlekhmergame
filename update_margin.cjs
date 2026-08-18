const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

// Replace @page margin
code = code.replace(/@page \{\n\s*size: A4;\n\s*margin: 0;\n\s*\}/g,
`@page {
            size: A4;
            margin: 0.5cm;
          }`);

fs.writeFileSync('src/components/Flashcards.tsx', code);
