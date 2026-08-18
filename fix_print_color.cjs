const fs = require('fs');
let code = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

// 1. Update borderColors to vibrant colors matching screen
code = code.replace(
  "const borderColors = ['#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#F87171'];",
  "const borderColors = ['#3B82F6', '#F97316', '#16A34A', '#A855F7', '#E11D48', '#0D9488'];"
);

// 2. Add print-color-adjust: exact to body and * in print style
code = code.replace(
  "body {\n            font-family: 'Kantumruy Pro', sans-serif;\n            margin: 0;\n            padding: 0;\n            background-color: #cbd5e1;\n            color: #333;\n          }",
  `* {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Kantumruy Pro', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #cbd5e1;
            color: #333;
          }`
);

fs.writeFileSync('src/components/Flashcards.tsx', code);
