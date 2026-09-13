const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const targetCheckPullWin = `  // Check Pull Win condition
  const checkPullWin = (newBalance: number) => {
    if (!winByPullGoal) return;
    if (newBalance <= -targetWinPulls) {
      setWinner('team1');
      triggerWinCelebration('team1');
    } else if (newBalance >= targetWinPulls) {
      setWinner('team2');
      triggerWinCelebration('team2');
    }
  };`;

const replaceCheckPullWin = `  // Check Pull Win condition
  const checkPullWin = (newBalance: number) => {
    if (!winByPullGoal) return;
    if (newBalance <= -targetWinPulls) {
      setWinner('team1');
      triggerWinCelebration('team1');
    } else if (newBalance >= targetWinPulls) {
      setWinner('team2');
      triggerWinCelebration('team2');
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0 && !winner) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0 && !winner && matchDuration > 0) {
      setIsTimerRunning(false);
      // Time is up, determine winner by pull balance
      if (pullBalance < 0) {
        setWinner('team1');
        triggerWinCelebration('team1');
      } else if (pullBalance > 0) {
        setWinner('team2');
        triggerWinCelebration('team2');
      } else {
        setWinner('draw');
        if (soundEnabled) playSuccessSound(); // maybe a draw sound
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, winner, pullBalance, matchDuration, soundEnabled]);`;

code = code.replace(targetCheckPullWin, replaceCheckPullWin);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
