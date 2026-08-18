const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

// 1. Add CSS for cut-line
const cutLineCSS = `
          .cut-line {
            width: 100%;
            border-top: 2px dashed #94a3b8;
            position: relative;
            margin: 2mm 0;
            display: flex;
            align-items: center;
            justify-content: flex-start;
          }
          .cut-line::after {
            content: "✂️ ----------------------------------------------------------------------------------------------------";
            position: absolute;
            top: -10px;
            left: 0;
            right: 0;
            color: #94a3b8;
            font-size: 11px;
            letter-spacing: 2px;
            overflow: hidden;
            white-space: nowrap;
            background: white;
            padding: 0 5px;
          }`;

// Simple clean dashed line styling with scissors like in worksheets:
const cleanCutLineCSS = `
          .cut-line {
            width: 100%;
            border-top: 2px dashed #a0aec0;
            position: relative;
            margin: 1mm 0;
          }
          .cut-line::before {
            content: '✂️';
            position: absolute;
            top: -12px;
            left: 15px;
            background: white;
            padding: 0 6px;
            font-size: 14px;
            color: #718096;
          }`;

code = code.replace(
  /\.card-def \{[\s\S]*?text-align: center;\s*\} /g,
  `.card-def {
            font-size: 20pt;
            color: #334155;
            margin: 15px 0 0 0;
            text-align: center;
          }
          ${cleanCutLineCSS} `
);

// 2. Insert cut line between cards in JS loop
const oldLoop = `wordsForPage.forEach((word, idx) => {
        const color = borderColors[(i * 3 + idx) % borderColors.length];
        htmlContent += \`
          <div class="card" style="--card-color: \${color};">`;

const newLoop = `wordsForPage.forEach((word, idx) => {
        const color = borderColors[(i * 3 + idx) % borderColors.length];
        if (idx > 0) {
          htmlContent += \`<div class="cut-line"></div>\`;
        }
        htmlContent += \`
          <div class="card" style="--card-color: \${color};">`;

code = code.replace(oldLoop, newLoop);

fs.writeFileSync('src/components/Flashcards.tsx', code);
console.log('Done modifying Flashcards.tsx');
