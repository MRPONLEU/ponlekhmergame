const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

// Change body font to static Kantumruy Pro
code = code.replace(/body \{\n\s*font-family: var\(--font-family\);/g, 
  "body {\n            font-family: 'Kantumruy Pro', sans-serif;");

// Add font-family to .card-word
code = code.replace(/\.card-word \{\n\s*font-size: 64pt;/g,
  ".card-word {\n            font-family: var(--font-family);\n            font-size: 64pt;");

fs.writeFileSync('src/components/Flashcards.tsx', code);
