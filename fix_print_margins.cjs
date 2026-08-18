const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

// Replace @media print and @page and .page styles
const oldCSSPattern = /@media print \{\n\s*\.no-print \{ display: none !important; \}\n\s*\.page \{[\s\S]*?\}\n\s*body \{ background-color: white; \}\n\s*\}\n\s*@page \{\n\s*size: A4;\n\s*margin: 0\.5cm;\n\s*\}\n\s*\.page \{[\s\S]*?padding: 10mm 15mm;[\s\S]*?\}/;

const newCSS = `@media print {
            .no-print { display: none !important; }
            body { 
              background-color: white !important; 
              margin: 0 !important;
              padding: 0 !important;
            }
            .page { 
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 100% !important;
              height: 100% !important;
              padding: 0 !important;
              gap: 5mm !important;
              page-break-after: always;
            }
          }
          
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto 20px auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5mm;
            page-break-after: always;
            box-sizing: border-box;
            padding: 5mm;
            background-color: white;
          }`;

if (code.match(oldCSSPattern)) {
  code = code.replace(oldCSSPattern, newCSS);
  console.log('Successfully replaced CSS');
} else {
  console.log('Pattern not matched, checking alternative replacement');
  // fallback replacement
  code = code.replace(/margin: 0\.5cm;\n\s*\}/g, "margin: 0.5cm;\n          }");
  code = code.replace(/padding: 10mm 15mm;/g, "padding: 5mm;");
  code = code.replace(/width: 100% !important;\n\s*height: 100% !important;\n\s*\}/g,
    "width: 100% !important;\n              height: 100% !important;\n              padding: 0 !important;\n              gap: 5mm !important;\n            }");
}

fs.writeFileSync('src/components/Flashcards.tsx', code);
