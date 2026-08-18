const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

const target = `.card-def {
            font-size: 20pt;
            color: #334155;
            margin: 15px 0 0 0;
            text-align: center;
          }`;

const replacement = `.card-def {
            font-size: 20pt;
            color: #334155;
            margin: 15px 0 0 0;
            text-align: center;
          }
          
          .cut-line {
            width: 100%;
            border-top: 2px dashed #64748b;
            position: relative;
            margin: 1mm 0;
            box-sizing: border-box;
          }
          
          .cut-line::before {
            content: '✂️';
            position: absolute;
            top: -11px;
            left: 20px;
            background: white;
            padding: 0 8px;
            font-size: 14px;
          }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  console.log('Successfully added .cut-line CSS');
} else {
  console.log('Target not found');
}

fs.writeFileSync('src/components/Flashcards.tsx', code);
