const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

const newFunc = `  const handlePrintCards = () => {
    playClickSound();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const pages = Math.ceil(activeWords.length / 3);
    
    let htmlContent = \`
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>បណ្ណពាក្យ (Flashcards)</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap');
          
          :root {
            --card-border: #1C60F4;
            --card-bg: #F8FAFC;
            --card-text: #1E293B;
          }
          
          body {
            font-family: 'Kantumruy Pro', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            color: #333;
          }
          
          .no-print {
            background: white;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 30px;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          
          .control-group {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
          }
          
          .color-picker {
            width: 40px;
            height: 40px;
            padding: 0;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            overflow: hidden;
          }
          
          .color-picker::-webkit-color-swatch-wrapper {
            padding: 0;
          }
          .color-picker::-webkit-color-swatch {
            border: none;
          }
          
          .print-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Kantumruy Pro', sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .print-btn:hover {
            background-color: #45a049;
          }
          
          @media print {
            .no-print { display: none !important; }
            body { background-color: white; }
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          .page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 15mm;
            page-break-after: always;
            height: 277mm;
            box-sizing: border-box;
            padding-top: 5mm;
            background-color: white;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .card {
            width: 190mm;
            height: 88mm;
            border: 4px solid var(--card-border);
            border-radius: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
            box-sizing: border-box;
            background-color: var(--card-bg);
            position: relative;
            overflow: hidden;
          }
          
          .card::before {
             content: '';
             position: absolute;
             top: 0; left: 0; right: 0;
             height: 12px;
             background-color: var(--card-border);
          }
          
          .card-word {
            font-size: 56pt;
            font-weight: 700;
            color: var(--card-text);
            margin: 0 0 15px 0;
          }
          
          .card-type {
            font-size: 20pt;
            color: var(--card-border);
            margin: 0 0 20px 0;
            font-weight: 600;
            background-color: white;
            border: 2px solid var(--card-border);
            padding: 6px 24px;
            border-radius: 30px;
            display: inline-block;
          }
          
          .card-def {
            font-size: 26pt;
            color: #334155;
            margin: 0;
            line-height: 1.5;
            max-width: 90%;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div class="control-group">
            <label>ពណ៌ស៊ុម៖</label>
            <input type="color" id="borderColor" class="color-picker" value="#1C60F4">
          </div>
          <div class="control-group">
            <label>ពណ៌ផ្ទៃកាត៖</label>
            <input type="color" id="bgColor" class="color-picker" value="#F8FAFC">
          </div>
          <div class="control-group">
            <label>ពណ៌អក្សរ៖</label>
            <input type="color" id="textColor" class="color-picker" value="#1E293B">
          </div>
          <button class="print-btn" onclick="window.print()">បោះពុម្ពឥឡូវនេះ (Print)</button>
        </div>
    \`;
    
    for (let i = 0; i < pages; i++) {
      htmlContent += \`<div class="page">\`;
      
      const wordsForPage = activeWords.slice(i * 3, i * 3 + 3);
      wordsForPage.forEach((word) => {
        htmlContent += \`
          <div class="card">
            <h2 class="card-word">\${word.word}</h2>
            <div class="card-type">\${word.wordType || 'អំណាន'}</div>
            <p class="card-def">\${word.definition}</p>
          </div>
        \`;
      });
      
      htmlContent += \`</div>\`;
    }
    
    htmlContent += \`
        <script>
          document.getElementById('borderColor').addEventListener('input', function(e) {
            document.documentElement.style.setProperty('--card-border', e.target.value);
          });
          document.getElementById('bgColor').addEventListener('input', function(e) {
            document.documentElement.style.setProperty('--card-bg', e.target.value);
          });
          document.getElementById('textColor').addEventListener('input', function(e) {
            document.documentElement.style.setProperty('--card-text', e.target.value);
          });
        </script>
      </body>
      </html>
    \`;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };`;

// replace between `const handlePrintCards = () => {` and `  const handleNext = () => {`
const startIdx = code.indexOf('  const handlePrintCards = () => {');
const endIdx = code.indexOf('  const handleNext = () => {');
if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newFunc + '\n\n' + code.substring(endIdx);
  fs.writeFileSync('src/components/Flashcards.tsx', code);
  console.log('Replaced handlePrintCards');
} else {
  console.log('Could not find boundaries');
}
