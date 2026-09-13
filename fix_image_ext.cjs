const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

code = code.replace(/src="\/images\/images\.png"/g, 'src="/images/images1.gif"');

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
