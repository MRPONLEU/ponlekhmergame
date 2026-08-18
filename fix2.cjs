const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

// fix map
code = code.replace(/\{currentWord\.parts\.map\(\(p, pIdx\) => \(\n\s*<span([^>]+)>([^<]+)<\/span>\n\s*<\/div>/g, 
  '{currentWord.parts.map((p, pIdx) => (\n                        <span$1>$2</span>\n                      ))}\n                    </div>');

fs.writeFileSync('src/components/Flashcards.tsx', code);
