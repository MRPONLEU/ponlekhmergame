const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const targetReset = `    setT1QuizIndex(0);
    setT2QuizIndex(1);
    setQuizSeed(prev => prev + 1);
  }, [generateQuestion]);`;

const replaceReset = `    setT1QuizIndex(0);
    setT2QuizIndex(1);
    setQuizSeed(prev => prev + 1);
    
    setTimeLeft(matchDuration);
    setIsTimerRunning(true);
  }, [generateQuestion, matchDuration]);`;

code = code.replace(targetReset, replaceReset);

// Also add a useEffect for the timer
const timerEffect = `  // Win celebration
  const triggerWinCelebration = (team: 'team1' | 'team2') => {`;

const newTimerEffect = `  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0 && !winner) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0 && !winner && matchDuration > 0) {
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
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, winner, pullBalance, matchDuration, soundEnabled, triggerWinCelebration]);

  // Win celebration
  const triggerWinCelebration = (team: 'team1' | 'team2') => {`;

// We have a problem, triggerWinCelebration is defined below the new timerEffect if we just insert it there, 
// so we need to make sure triggerWinCelebration is defined before or we put the effect after it.

// Let's put the timer effect AFTER triggerWinCelebration.
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
