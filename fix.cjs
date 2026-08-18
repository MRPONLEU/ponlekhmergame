const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{currentWord.parts.map((p, pIdx) => (')) {
    let closed = false;
    for (let j = i + 1; j < i + 10; j++) {
      if (lines[j].includes('))}')) {
         closed = true;
         break;
      }
    }
    if (!closed) {
       for (let j = i + 1; j < i + 10; j++) {
         if (lines[j].includes('</div>')) {
            lines.splice(j, 0, '                      ))}');
            break;
         }
       }
    }
  }
}

let code2 = lines.join('\n');
code2 = code2.replace(/                        <\/span>\n                      \)\)}\n/g, '                        <\/span>\n');

fs.writeFileSync('src/components/Flashcards.tsx', code2);
