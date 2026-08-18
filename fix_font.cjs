const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

code = code.replace(/<h2 className=\{`text-7xl([^>]+)`\}>\n\s*\{currentWord\.word\}\n\s*<\/h2>/g, 
  "<h2 className={`text-7xl$1 font-['Kh-MPS-Temple']`}>\n                      {currentWord.word}\n                    </h2>");

fs.writeFileSync('src/components/Flashcards.tsx', code);
