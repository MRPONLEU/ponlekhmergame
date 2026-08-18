const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

code = code.replace(/\.page \{\n\s*width: 210mm;\n\s*margin: 0 auto;\n\s*margin-bottom: 20px;\n\s*box-shadow: 0 4px 6px -1px rgb\(0 0 0 \/ 0\.1\), 0 2px 4px -2px rgb\(0 0 0 \/ 0\.1\);\n\s*display: flex;\n\s*flex-direction: column;\n\s*align-items: center;\n\s*justify-content: center;\n\s*gap: 15mm;\n\s*page-break-after: always;\n\s*height: 297mm;\n\s*box-sizing: border-box;\n\s*padding: 15mm;/g,
  `.page {
            width: 210mm;
            margin: 0 auto;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10mm;
            page-break-after: always;
            height: 297mm;
            box-sizing: border-box;
            padding: 10mm 15mm;`);

fs.writeFileSync('src/components/Flashcards.tsx', code);
