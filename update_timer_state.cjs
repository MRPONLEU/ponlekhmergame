const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const targetState = `  const [targetWinPulls, setTargetWinPulls] = useState<number>(6); // 6 pulls ahead wins
  const [winByPullGoal] = useState<boolean>(true);`;

const replaceState = `  const [targetWinPulls, setTargetWinPulls] = useState<number>(6); // 6 pulls ahead wins
  const [winByPullGoal] = useState<boolean>(true);
  
  // Timer settings
  const [matchDuration, setMatchDuration] = useState<number>(0); // 0 means infinite, otherwise seconds
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);`;

code = code.replace(targetState, replaceState);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
