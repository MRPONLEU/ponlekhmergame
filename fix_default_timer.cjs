const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

code = code.replace(/const \[matchDuration, setMatchDuration\] = useState<number>\(0\);/, 'const [matchDuration, setMatchDuration] = useState<number>(180);');

// Let's also check if the timer logic is correct. When it mounts, resetGame sets timeLeft to matchDuration.
// It should work.
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
