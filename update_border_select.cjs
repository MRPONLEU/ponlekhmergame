const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

// 1. Update :root to include --card-border-style
code = code.replace(/:root \{\n\s*--font-family: 'Kantumruy Pro', sans-serif;\n\s*--is-bw: 0;\n\s*\}/g,
`:root {
            --font-family: 'Kantumruy Pro', sans-serif;
            --card-border-style: solid;
            --is-bw: 0;
          }`);

// 2. Update .card border
code = code.replace(/\.card \{\n\s*width: 100%;\n\s*height: 85mm;\n\s*border: 10px solid var\(--card-color\);/g,
`.card {
            width: 100%;
            height: 85mm;
            border: 10px var(--card-border-style, solid) var(--card-color);`);

// 3. Update .card-inner border
code = code.replace(/\.card-inner \{\n\s*border: 2px solid var\(--card-color\);/g,
`.card-inner {
            border: 2px var(--card-border-style, solid) var(--card-color);`);

// 4. Update dropdown HTML
const oldDropdown = `<div class="control-group">
              <label>ម៉ូដអក្សរ៖</label>
              <select id="fontSelect" class="font-select">
                <option value="'Kantumruy Pro', sans-serif">កន្ត្រឹមរុយ (Kantumruy Pro)</option>
                <option value="'Siemreap', sans-serif">សៀមរាប (Siemreap)</option>
                <option value="'Battambang', sans-serif">បាត់ដំបង (Battambang)</option>
                <option value="'Kh-MPS-Temple', sans-serif">Kh-MPS Temple</option>
              </select>
            </div>`;
const newDropdown = `<div class="control-group">
              <label>ប្ដូរស៊ុមបណ្ណពាក្យ៖</label>
              <select id="borderSelect" class="font-select">
                <option value="solid">បន្ទាត់ជាប់ (Solid)</option>
                <option value="double">បន្ទាត់ពីរជាន់ (Double)</option>
                <option value="dashed">បន្ទាត់ដាច់ៗ (Dashed)</option>
                <option value="dotted">បន្ទាត់ចុចៗ (Dotted)</option>
              </select>
            </div>`;
code = code.replace(oldDropdown, newDropdown);

// 5. Update script
const oldScript = `const fontSelect = document.getElementById('fontSelect');
          const resetBtn = document.getElementById('resetBtn');
          const colorBtn = document.getElementById('colorBtn');
          const bwBtn = document.getElementById('bwBtn');
          
          fontSelect.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--font-family', e.target.value);
          });
          
          resetBtn.addEventListener('click', () => {
            fontSelect.value = "'Kantumruy Pro', sans-serif";
            document.documentElement.style.setProperty('--font-family', "'Kantumruy Pro', sans-serif");`;
            
const newScript = `const borderSelect = document.getElementById('borderSelect');
          const resetBtn = document.getElementById('resetBtn');
          const colorBtn = document.getElementById('colorBtn');
          const bwBtn = document.getElementById('bwBtn');
          
          borderSelect.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--card-border-style', e.target.value);
          });
          
          resetBtn.addEventListener('click', () => {
            borderSelect.value = "solid";
            document.documentElement.style.setProperty('--card-border-style', "solid");`;

code = code.replace(oldScript, newScript);

// 6. Hardcode font-family for .card-word
code = code.replace(/\.card-word \{\n\s*font-family: var\(--font-family\);/g,
  `.card-word {\n            font-family: 'Kh-MPS-Temple', 'Kantumruy Pro', sans-serif;`);

fs.writeFileSync('src/components/Flashcards.tsx', code);
