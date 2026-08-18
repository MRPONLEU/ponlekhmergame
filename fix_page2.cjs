const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

code = code.replace(/\.page \{\n\s*width: 210mm;/g,
  `.page {
            width: 210mm;
            margin: 0 auto;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);`);

// In @media print, remove shadow and margin
code = code.replace(/@media print \{\n\s*\.no-print \{ display: none !important; \}/g,
  `@media print {
            .no-print { display: none !important; }
            .page { 
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 100% !important;
              height: 100% !important;
            }`);
            
fs.writeFileSync('src/components/Flashcards.tsx', code);
