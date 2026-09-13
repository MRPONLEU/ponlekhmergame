const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

code = code.replace(/setCurrentQuestion\(generateQuestion\(\)\);/g, function(match, offset) {
  if (offset < 20000) return 'setT1Question(generateQuestion());';
  return 'setT2Question(generateQuestion());';
});

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
