const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

code = code.replace(/'ចុចជ្រើសរើស ក, ខ, គ ឬ ឃ'/g, "'-'");
code = code.replace(/'❌ ចម្លើយមិនត្រឹមត្រូវ! \(រង់ចាំ...\)'/g, "'❌ រង់ចាំ...'");

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
