const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

const newFunc = `  const handlePrintCards = () => {
    playClickSound();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const pages = Math.ceil(activeWords.length / 3);
    const borderColors = ['#F4B41A', '#22C55E', '#3B82F6', '#A855F7', '#EF4444', '#14B8A6'];
    
    let htmlContent = \\\`
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>សន្លឹកបណ្ណពាក្យ</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Siemreap&family=Battambang:wght@400;700&display=swap');
          
          :root {
            --font-family: 'Kantumruy Pro', sans-serif;
            --is-bw: 0;
          }
          
          body {
            font-family: var(--font-family);
            margin: 0;
            padding: 0;
            background-color: #cbd5e1;
            color: #333;
          }
          
          .no-print {
            background: white;
            padding: 12px 24px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          
          .no-print-left {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
          }
          
          .no-print-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }
          
          select.font-select {
            padding: 6px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-family: inherit;
            outline: none;
          }
          
          .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
            background: white;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .btn:hover {
            background: #f8fafc;
          }
          
          .btn.active-color {
            background: #f0fdf4;
            border-color: #bbf7d0;
            color: #166534;
          }
          
          .btn.print-btn {
            background-color: #0ea5e9;
            color: white;
            border: none;
            font-weight: 600;
          }
          
          .btn.print-btn:hover {
            background-color: #0284c7;
          }
          
          @media print {
            .no-print { display: none !important; }
            body { background-color: white; }
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          .page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15mm;
            page-break-after: always;
            height: 297mm;
            box-sizing: border-box;
            padding: 15mm;
            background-color: white;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .card {
            width: 100%;
            height: 85mm;
            border: 10px solid var(--card-color);
            background-color: white;
            padding: 6px;
            box-sizing: border-box;
            filter: grayscale(var(--is-bw));
          }
          
          .card-inner {
            border: 2px solid var(--card-color);
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 20px;
          }
          
          .card-top-left {
            position: absolute;
            top: 15px;
            left: 20px;
            color: var(--card-color);
            font-size: 18pt;
            font-weight: 600;
          }
          
          .card-word {
            font-size: 64pt;
            font-weight: 700;
            color: var(--card-color);
            margin: 0;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
            line-height: 1.2;
            text-align: center;
          }
          
          .card-def {
            font-size: 20pt;
            color: #334155;
            margin: 15px 0 0 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div class="no-print-left">
            សន្លឹកបណ្ណពាក្យ៖ ពាក្យពិបាក និងពាក្យជួយ
          </div>
          <div class="no-print-right">
            <div class="control-group">
              <label>ម៉ូដអក្សរ៖</label>
              <select id="fontSelect" class="font-select">
                <option value="'Kantumruy Pro', sans-serif">កន្ត្រឹមរុយ (Kantumruy Pro)</option>
                <option value="'Siemreap', sans-serif">សៀមរាប (Siemreap)</option>
                <option value="'Battambang', sans-serif">បាត់ដំបង (Battambang)</option>
              </select>
            </div>
            <button class="btn" id="resetBtn">🔄 កំណត់ឡើងវិញ</button>
            <button class="btn active-color" id="colorBtn">🎨 ពណ៌ធម្មជាតិ</button>
            <button class="btn" id="bwBtn">⚫ ស-ខ្មៅ (សន្សំថ្នាំ)</button>
            <button class="btn print-btn" onclick="window.print()">🖨 ទាញយកសន្លឹកកិច្ចការ</button>
          </div>
        </div>
    \\\`;
    
    for (let i = 0; i < pages; i++) {
      htmlContent += \\\`<div class="page">\\\`;
      
      const wordsForPage = activeWords.slice(i * 3, i * 3 + 3);
      wordsForPage.forEach((word, idx) => {
        const color = borderColors[(i * 3 + idx) % borderColors.length];
        htmlContent += \\\`
          <div class="card" style="--card-color: \\\${color};">
            <div class="card-inner">
              <div class="card-top-left">អំណាន ៖ \\\${word.wordType || 'ពាក្យ'}</div>
              <h2 class="card-word">\\\${word.word}</h2>
              <p class="card-def">\\\${word.definition}</p>
            </div>
          </div>
        \\\`;
      });
      
      htmlContent += \\\`</div>\\\`;
    }
    
    htmlContent += \\\`
        <script>
          const fontSelect = document.getElementById('fontSelect');
          const resetBtn = document.getElementById('resetBtn');
          const colorBtn = document.getElementById('colorBtn');
          const bwBtn = document.getElementById('bwBtn');
          
          fontSelect.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--font-family', e.target.value);
          });
          
          resetBtn.addEventListener('click', () => {
            fontSelect.value = "'Kantumruy Pro', sans-serif";
            document.documentElement.style.setProperty('--font-family', "'Kantumruy Pro', sans-serif");
            document.documentElement.style.setProperty('--is-bw', '0');
            colorBtn.classList.add('active-color');
            bwBtn.classList.remove('active-color');
          });
          
          colorBtn.addEventListener('click', () => {
            document.documentElement.style.setProperty('--is-bw', '0');
            colorBtn.classList.add('active-color');
            bwBtn.classList.remove('active-color');
          });
          
          bwBtn.addEventListener('click', () => {
            document.documentElement.style.setProperty('--is-bw', '1');
            bwBtn.classList.add('active-color');
            colorBtn.classList.remove('active-color');
          });
        </script>
      </body>
      </html>
    \\\`;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };`;

const startIdx = code.indexOf('  const handlePrintCards = () => {');
const endIdx = code.indexOf('  const handleNext = () => {');
if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newFunc + '\n\n' + code.substring(endIdx);
  fs.writeFileSync('src/components/Flashcards.tsx', code);
  console.log('Replaced handlePrintCards');
} else {
  console.log('Could not find boundaries');
}
