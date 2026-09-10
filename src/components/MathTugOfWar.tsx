import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home, 
  Settings, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Trophy, 
  Check, 
  X, 
  Delete,
  Flame,
  Award,
  Sparkles,
  Zap,
  Crown,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playSuccessSound, playFailSound, playClickSound, playWinSound, playTickSound } from '../utils/audio';

interface MathTugOfWarProps {
  onBack: () => void;
}

type MathOperation = 'mul' | 'add' | 'sub' | 'div' | 'decimal' | 'mixed';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type Language = 'kh' | 'en';

interface MathQuestion {
  num1: number;
  num2: number;
  op: '×' | '+' | '-' | '÷';
  answer: number;
  text: string;
}

export default function MathTugOfWar({ onBack }: MathTugOfWarProps) {
  // Sound & Screen & Language controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>('kh');

  // Game Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [operation, setOperation] = useState<MathOperation>('mul');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [targetWinPulls, setTargetWinPulls] = useState<number>(6); // 6 pulls ahead wins
  const [winByPullGoal] = useState<boolean>(true);

  // Gameplay State
  const [pullBalance, setPullBalance] = useState<number>(0); // -target to +target
  const [winner, setWinner] = useState<'team1' | 'team2' | 'draw' | null>(null);

  // Single Shared Question for both teams
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [lastWinnerTeam, setLastWinnerTeam] = useState<'team1' | 'team2' | null>(null);

  // Team 1 State (Blue / Left)
  const [t1Score, setT1Score] = useState<number>(0);
  const [t1Input, setT1Input] = useState<string>('');
  const [t1Shake, setT1Shake] = useState<boolean>(false);
  const [t1SuccessFlash, setT1SuccessFlash] = useState<boolean>(false);

  // Team 2 State (Red / Right)
  const [t2Score, setT2Score] = useState<number>(0);
  const [t2Input, setT2Input] = useState<string>('');
  const [t2Shake, setT2Shake] = useState<boolean>(false);
  const [t2SuccessFlash, setT2SuccessFlash] = useState<boolean>(false);

  // Pull effort animation trigger
  const [lastPullTeam, setLastPullTeam] = useState<'team1' | 'team2' | null>(null);

  // Generate a math question based on current settings
  const generateQuestion = useCallback((targetOp = operation, targetDiff = difficulty): MathQuestion => {
    let chosenOp: '×' | '+' | '-' | '÷' = '×';
    if (targetOp === 'mixed') {
      const ops: ('×' | '+' | '-' | '÷')[] = ['×', '+', '-', '÷'];
      chosenOp = ops[Math.floor(Math.random() * ops.length)];
    } else if (targetOp === 'mul') chosenOp = '×';
    else if (targetOp === 'add') chosenOp = '+';
    else if (targetOp === 'sub') chosenOp = '-';
    else if (targetOp === 'div') chosenOp = '÷';
    else if (targetOp === 'decimal') {
      const decOps: ('×' | '+' | '-' | '÷')[] = ['+', '-', '×', '÷'];
      chosenOp = decOps[Math.floor(Math.random() * decOps.length)];
    }

    let n1 = 1;
    let n2 = 1;
    let ans = 1;

    if (targetOp === 'decimal') {
      if (chosenOp === '+') {
        const a = (Math.floor(Math.random() * 40) + 5) * 0.5;
        const b = (Math.floor(Math.random() * 30) + 5) * 0.5;
        n1 = parseFloat(a.toFixed(1));
        n2 = parseFloat(b.toFixed(1));
        ans = parseFloat((n1 + n2).toFixed(1));
      } else if (chosenOp === '-') {
        const b = (Math.floor(Math.random() * 20) + 5) * 0.5;
        const diff = (Math.floor(Math.random() * 20) + 5) * 0.5;
        n1 = parseFloat((b + diff).toFixed(1));
        n2 = parseFloat(b.toFixed(1));
        ans = parseFloat(diff.toFixed(1));
      } else if (chosenOp === '×') {
        const decMultiplier = [0.5, 1.5, 2.5, 0.2, 0.4, 1.2][Math.floor(Math.random() * 6)];
        const whole = Math.floor(Math.random() * 6) + 2;
        n1 = decMultiplier;
        n2 = whole;
        ans = parseFloat((n1 * n2).toFixed(1));
      } else {
        const divPairs = [
          [5, 2, 2.5],
          [7, 2, 3.5],
          [3, 2, 1.5],
          [9, 2, 4.5],
          [1, 2, 0.5],
          [6, 4, 1.5],
          [7.5, 3, 2.5],
          [4.5, 3, 1.5],
          [2.4, 2, 1.2],
          [3.6, 3, 1.2],
          [8, 5, 1.6],
          [4, 5, 0.8]
        ];
        const chosen = divPairs[Math.floor(Math.random() * divPairs.length)];
        n1 = chosen[0];
        n2 = chosen[1];
        ans = chosen[2];
      }
    } else if (chosenOp === '×') {
      if (targetDiff === 'easy') {
        n1 = Math.floor(Math.random() * 5) + 1; // 1-5
        n2 = Math.floor(Math.random() * 5) + 1; // 1-5
      } else if (targetDiff === 'medium') {
        n1 = Math.floor(Math.random() * 8) + 2; // 2-9
        n2 = Math.floor(Math.random() * 8) + 2; // 2-9
      } else {
        n1 = Math.floor(Math.random() * 11) + 2; // 2-12
        n2 = Math.floor(Math.random() * 11) + 2; // 2-12
      }
      ans = n1 * n2;
    } else if (chosenOp === '+') {
      if (targetDiff === 'easy') {
        n1 = Math.floor(Math.random() * 10) + 1;
        n2 = Math.floor(Math.random() * 10) + 1;
      } else if (targetDiff === 'medium') {
        n1 = Math.floor(Math.random() * 30) + 5;
        n2 = Math.floor(Math.random() * 30) + 5;
      } else {
        n1 = Math.floor(Math.random() * 60) + 10;
        n2 = Math.floor(Math.random() * 60) + 10;
      }
      ans = n1 + n2;
    } else if (chosenOp === '-') {
      if (targetDiff === 'easy') {
        n2 = Math.floor(Math.random() * 10) + 1;
        n1 = n2 + Math.floor(Math.random() * 10) + 1;
      } else if (targetDiff === 'medium') {
        n2 = Math.floor(Math.random() * 25) + 5;
        n1 = n2 + Math.floor(Math.random() * 25) + 1;
      } else {
        n2 = Math.floor(Math.random() * 50) + 10;
        n1 = n2 + Math.floor(Math.random() * 50) + 1;
      }
      ans = n1 - n2;
    } else if (chosenOp === '÷') {
      let divisor = 2;
      let quotient = 2;
      if (targetDiff === 'easy') {
        divisor = Math.floor(Math.random() * 4) + 2; // 2-5
        quotient = Math.floor(Math.random() * 5) + 1; // 1-5
      } else if (targetDiff === 'medium') {
        divisor = Math.floor(Math.random() * 8) + 2; // 2-9
        quotient = Math.floor(Math.random() * 8) + 2; // 2-9
      } else {
        divisor = Math.floor(Math.random() * 10) + 2; // 2-11
        quotient = Math.floor(Math.random() * 11) + 2; // 2-12
      }
      n1 = divisor * quotient;
      n2 = divisor;
      ans = quotient;
    }

    return {
      num1: n1,
      num2: n2,
      op: chosenOp,
      answer: ans,
      text: `${n1} ${chosenOp} ${n2} = ?`
    };
  }, [operation, difficulty]);

  // Start / Reset Game
  const resetGame = useCallback(() => {
    setPullBalance(0);
    setWinner(null);
    setT1Score(0);
    setT2Score(0);
    setT1Input('');
    setT2Input('');
    setLastPullTeam(null);
    setLastWinnerTeam(null);
    setCurrentQuestion(generateQuestion());
  }, [generateQuestion]);

  // Initial question on mount
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Win celebration
  const triggerWinCelebration = (team: 'team1' | 'team2') => {
    if (soundEnabled) playWinSound();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: team === 'team1' ? ['#0284c7', '#38bdf8', '#fbbf24', '#f59e0b'] : ['#e11d48', '#fb7185', '#fbbf24', '#f59e0b']
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.5 }
        });
      }, 350);
    } catch (e) {
      console.warn("Confetti error", e);
    }
  };

  // Check Pull Win condition
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

  // Submit Answer for Team 1 (Left / Blue)
  const submitTeam1 = () => {
    if (!currentQuestion || winner) return;
    const raw = t1Input.trim();
    if (!raw) return;
    const userVal = parseFloat(raw);
    if (isNaN(userVal)) return;

    if (Math.abs(userVal - currentQuestion.answer) < 0.001) {
      if (soundEnabled) playSuccessSound();
      setT1Score(prev => prev + 1);
      setT1SuccessFlash(true);
      setTimeout(() => setT1SuccessFlash(false), 500);
      setLastPullTeam('team1');
      setLastWinnerTeam('team1');
      setTimeout(() => setLastWinnerTeam(null), 1200);
      
      const newBalance = Math.max(-targetWinPulls, pullBalance - 1);
      setPullBalance(newBalance);
      checkPullWin(newBalance);

      setT1Input('');
      setT2Input('');
      setCurrentQuestion(generateQuestion());
    } else {
      if (soundEnabled) playFailSound();
      setT1Shake(true);
      setTimeout(() => setT1Shake(false), 500);
      setT1Input('');
    }
  };

  // Submit Answer for Team 2 (Right / Red)
  const submitTeam2 = () => {
    if (!currentQuestion || winner) return;
    const raw = t2Input.trim();
    if (!raw) return;
    const userVal = parseFloat(raw);
    if (isNaN(userVal)) return;

    if (Math.abs(userVal - currentQuestion.answer) < 0.001) {
      if (soundEnabled) playSuccessSound();
      setT2Score(prev => prev + 1);
      setT2SuccessFlash(true);
      setTimeout(() => setT2SuccessFlash(false), 500);
      setLastPullTeam('team2');
      setLastWinnerTeam('team2');
      setTimeout(() => setLastWinnerTeam(null), 1200);

      const newBalance = Math.min(targetWinPulls, pullBalance + 1);
      setPullBalance(newBalance);
      checkPullWin(newBalance);

      setT1Input('');
      setT2Input('');
      setCurrentQuestion(generateQuestion());
    } else {
      if (soundEnabled) playFailSound();
      setT2Shake(true);
      setTimeout(() => setT2Shake(false), 500);
      setT2Input('');
    }
  };

  // Keypad Click Handlers
  const handleT1Key = (val: string) => {
    if (soundEnabled) playClickSound();
    if (val === 'C') {
      setT1Input('');
    } else if (val === 'backspace') {
      setT1Input(prev => prev.slice(0, -1));
    } else if (val === '.') {
      setT1Input(prev => {
        if (prev.includes('.')) return prev;
        if (!prev) return '0.';
        return prev + '.';
      });
    } else if (val === 'submit') {
      submitTeam1();
    } else {
      if (t1Input.length < 8) {
        setT1Input(prev => prev === '0' ? val : prev + val);
      }
    }
  };

  const handleT2Key = (val: string) => {
    if (soundEnabled) playClickSound();
    if (val === 'C') {
      setT2Input('');
    } else if (val === 'backspace') {
      setT2Input(prev => prev.slice(0, -1));
    } else if (val === '.') {
      setT2Input(prev => {
        if (prev.includes('.')) return prev;
        if (!prev) return '0.';
        return prev + '.';
      });
    } else if (val === 'submit') {
      submitTeam2();
    } else {
      if (t2Input.length < 8) {
        setT2Input(prev => prev === '0' ? val : prev + val);
      }
    }
  };

  // Physical Keyboard Listener (Team 2: Numpad, Team 1: Top digits & Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen || winner) return;

      // Numpad is reserved for Team 2
      if (e.code.startsWith('Numpad')) {
        e.preventDefault();
        const digit = e.code.replace('Numpad', '');
        if (/^[0-9]$/.test(digit)) {
          handleT2Key(digit);
        } else if (e.code === 'NumpadEnter') {
          submitTeam2();
        } else if (e.code === 'NumpadDecimal') {
          handleT2Key('.');
        } else if (e.code === 'Delete') {
          handleT2Key('C');
        } else if (e.code === 'Backspace') {
          handleT2Key('backspace');
        }
        return;
      }

      // Top row digits and Enter can be used by Team 1
      if (e.code.startsWith('Digit')) {
        const digit = e.code.replace('Digit', '');
        if (/^[0-9]$/.test(digit)) {
          handleT1Key(digit);
        }
      } else if (e.code === 'Period' || e.key === '.') {
        handleT1Key('.');
      } else if (e.code === 'Enter') {
        submitTeam1();
      } else if (e.code === 'KeyC') {
        handleT1Key('C');
      } else if (e.code === 'Backspace') {
        handleT1Key('backspace');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, winner, t1Input, t2Input, currentQuestion]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (soundEnabled) playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Calculate pixel displacement for the rope and characters
  // pullBalance ranges from -targetWinPulls to +targetWinPulls (e.g. -6 to +6)
  // Max pixel offset = approx 160px left or right
  const maxDisplacementPx = 160;
  const displacementPx = (pullBalance / targetWinPulls) * maxDisplacementPx;

  return (
    <div 
      id="math-tug-of-war-container"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/30 text-slate-800 flex flex-col justify-between font-sans select-none overflow-hidden"
    >
      {/* 1. Header Toolbar */}
      <header className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs flex items-center justify-between z-30">
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              onBack();
            }}
            id="btn-tug-home"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 font-bold rounded-full text-sm transition-all shadow-xs cursor-pointer"
            title="ត្រឡប់ទៅទំព័រដើម"
          >
            <Home size={17} className="text-amber-600" />
            <span className="hidden sm:inline">ដើម</span>
          </button>

          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setIsSettingsOpen(true);
            }}
            id="btn-tug-settings"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 font-bold rounded-full text-sm transition-all shadow-xs cursor-pointer"
            title="ការកំណត់ល្បែង"
          >
            <Settings size={17} className="text-indigo-600" />
            <span className="hidden sm:inline">ការកំណត់</span>
          </button>
        </div>

        {/* Center Title */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-900 tracking-tight flex items-center justify-center gap-2">
            <span>ទាញព្រ័ត្រ គណិតវិទ្យា</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-normal hidden sm:block">
            ល្បែងប្រកួតប្រជែងគណិតវិទ្យាជាក្រុម
          </p>
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playClickSound();
            }}
            id="btn-tug-sound"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 font-bold rounded-full text-sm transition-all shadow-xs cursor-pointer"
            title={soundEnabled ? "បិទសំឡេង" : "បើកសំឡេង"}
          >
            {soundEnabled ? <Volume2 size={17} className="text-emerald-600" /> : <VolumeX size={17} className="text-rose-500" />}
            <span className="hidden md:inline">{soundEnabled ? 'សំឡេង' : 'បិទ'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            id="btn-tug-fullscreen"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 font-bold rounded-full text-sm transition-all shadow-xs cursor-pointer"
            title={isFullscreen ? "បង្រួមអេក្រង់" : "ពេញអេក្រង់"}
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            <span className="hidden md:inline">ពេញអេក្រង់</span>
          </button>

          {/* Language pill toggle */}
          <div className="bg-slate-100 p-0.5 rounded-full flex items-center border border-slate-200">
            <button
              onClick={() => {
                setLang('kh');
                if (soundEnabled) playClickSound();
              }}
              className={`px-2 py-0.5 text-xs font-black rounded-full transition-all cursor-pointer ${
                lang === 'kh' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              KH ខ្មែរ
            </button>
            <button
              onClick={() => {
                setLang('en');
                if (soundEnabled) playClickSound();
              }}
              className={`px-2 py-0.5 text-xs font-black rounded-full transition-all cursor-pointer ${
                lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GB English
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Arena & Dual Panels Layout: Top = Tug of War Arena, Bottom = 2-Row Keypads */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-2 sm:p-4 flex flex-col gap-3 sm:gap-4 items-stretch justify-between relative overflow-hidden">
        
        {/* ================= TOP: TUG-OF-WAR ARENA (Full Width) ================= */}
        <div 
          id="arena-tug-field"
          className="flex-1 bg-white border-2 border-slate-200/90 rounded-3xl p-3 sm:p-5 shadow-xs flex flex-col justify-between overflow-hidden relative min-h-[280px] sm:min-h-[340px]"
        >
          {/* Arena Top: Central Big Exercise Card */}
          <div className="flex items-center justify-center pb-2 border-b border-slate-100">
            {/* Central Big Exercise Card (ផ្ទាំងលំហាត់ ធំ) */}
            <motion.div 
              key={currentQuestion ? currentQuestion.text : 'empty'}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`w-full max-w-xl bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/20 border-2 rounded-2xl sm:rounded-3xl py-3 sm:py-4 px-6 sm:px-10 text-center shadow-md relative overflow-hidden transition-all ${
                lastWinnerTeam === 'team1' 
                  ? 'border-sky-500 shadow-sky-200 ring-4 ring-sky-200' 
                  : lastWinnerTeam === 'team2'
                  ? 'border-rose-500 shadow-rose-200 ring-4 ring-rose-200'
                  : 'border-indigo-200'
              }`}
            >
              {/* Small indicator badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] sm:text-xs font-black mb-0.5">
                <Sparkles size={13} className="text-indigo-600" />
                <span>លំហាត់ប្រកួតរួម</span>
              </div>

              {/* Big Question Formula */}
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-wider font-mono drop-shadow-xs">
                {currentQuestion ? currentQuestion.text : '...'}
              </div>

              {/* Flash Banner when a team answers correctly */}
              <AnimatePresence>
                {lastWinnerTeam && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 flex items-center justify-center font-black text-lg sm:text-2xl text-white backdrop-blur-xs z-10 ${
                      lastWinnerTeam === 'team1' ? 'bg-sky-600/95' : 'bg-rose-600/95'
                    }`}
                  >
                    {lastWinnerTeam === 'team1' ? '🎉 ក្រុមទី ១ ឆ្លើយត្រូវ! (+1)' : '🎉 ក្រុមទី ២ ឆ្លើយត្រូវ! (+1)'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Tug of War Interactive Stage */}
          <div className="flex-1 flex items-center justify-center my-2 sm:my-3 relative min-h-[170px] sm:min-h-[220px] md:min-h-[260px] overflow-hidden">
            {/* Background Lines & Markers */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Neutral Center Dotted Line */}
              <div className="absolute top-2 bottom-4 w-0 border-r-2 border-dotted border-slate-300/80 left-1/2 -translate-x-1/2 z-0" />
              
              {/* Team 1 Win Threshold Line (Left) */}
              <div 
                style={{ left: `calc(50% - ${maxDisplacementPx}px)` }}
                className="absolute top-3 bottom-6 w-0 border-r-2 border-dashed border-sky-400 opacity-60 z-0"
              />

              {/* Team 2 Win Threshold Line (Right) */}
              <div 
                style={{ left: `calc(50% + ${maxDisplacementPx}px)` }}
                className="absolute top-3 bottom-6 w-0 border-r-2 border-dashed border-rose-400 opacity-60 z-0"
              />

              {/* Dynamic Directional Pull Chevrons on ground */}
              <AnimatePresence>
                {lastWinnerTeam === 'team1' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: [0, 1, 0], x: [-10, -50] }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="absolute bottom-7 left-[30%] flex items-center gap-1 text-sky-500 font-black text-sm z-0"
                  >
                    <span>«««</span>
                    <span className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-bold">ទាញទៅឆ្វេង!</span>
                  </motion.div>
                )}
                {lastWinnerTeam === 'team2' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: [0, 1, 0], x: [10, 50] }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="absolute bottom-7 right-[30%] flex items-center gap-1 text-rose-500 font-black text-sm z-0"
                  >
                    <span className="text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">ទាញទៅស្តាំ!</span>
                    <span>»»»</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Match Point Alert Tension Badge */}
            {Math.abs(pullBalance) >= targetWinPulls - 1 && !winner && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute top-1 z-20 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[11px] sm:text-xs font-black shadow-md flex items-center gap-1 border border-amber-300"
              >
                <Flame size={13} className="animate-bounce" />
                <span>ស្វិតស្វាញណាស់! ជិតដល់បន្ទាត់ឈ្នះហើយ!</span>
              </motion.div>
            )}

            {/* Dynamic Tug of War Rig with smooth spring score displacement */}
            <motion.div 
              animate={{ x: displacementPx }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative z-10 flex items-center justify-center w-full max-w-[850px] px-2 select-none"
            >
              {/* Inner Continuous Tug of War Animation: Purely horizontal forward and backward tugging (ទៅមុខ មកក្រោយ ទៅមក ដដែលៗ គ្មានចលនាលើក្រោម) */}
              <motion.div
                animate={winner ? {
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1
                } : {
                  // Strictly horizontal back-and-forth tugging motion (pull left, pull right)
                  x: [-20, 20, -20],
                  y: 0,
                  rotate: 0,
                  scale: 1
                }}
                transition={winner ? {
                  duration: 0.3
                } : {
                  x: { repeat: Infinity, duration: 1.1, ease: "easeInOut" }
                }}
                className="relative w-full flex items-center justify-center"
              >
                {/* Student Tug of War Image */}
                <img 
                  src="/images/images1.png" 
                  alt="សិស្សទាញព្រ័ត្រ (Student Tug of War)" 
                  className={`w-full max-h-[160px] sm:max-h-[210px] md:max-h-[250px] object-contain select-none pointer-events-none transition-all duration-300 ${
                    lastWinnerTeam ? 'drop-shadow-xl brightness-105' : 'drop-shadow-md'
                  }`}
                  draggable={false}
                />

                {/* Center Red Ribbon Knot on Rope */}
                <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-20">
                  {/* Fluttering Red Ribbon Cloth */}
                  <motion.div 
                    animate={{ 
                      rotate: [-10, 10, -10],
                      skewX: [-6, 6, -6]
                    }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                    className="w-4 h-6 sm:w-5 sm:h-8 bg-gradient-to-b from-rose-500 to-red-600 rounded-b-md shadow-md border-t-2 border-amber-300 relative flex items-center justify-center"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-xs" />
                  </motion.div>
                  {/* Downward Indicator Arrow */}
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-red-600 drop-shadow-xs -mt-0.5" />
                </div>
              </motion.div>

              {/* Team 1 Strain / Dust Puffs & Muscle Sparks (Left) */}
              <AnimatePresence>
                {lastWinnerTeam === 'team1' && (
                  <>
                    {/* Floating Effort Badges over Team 1 */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.7 }}
                      animate={{ opacity: 1, y: -25, scale: 1 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ duration: 0.65 }}
                      className="absolute top-[8%] left-[20%] z-30 flex items-center gap-1 bg-sky-600 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-sky-300"
                    >
                      <Zap size={14} className="fill-amber-300 text-amber-300" />
                      <span>កម្លាំងខ្លាំង! +1</span>
                    </motion.div>

                    {/* Cartoon Sweat / Strain drop */}
                    <motion.span 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], y: [-5, -25], x: [-10, -20] }}
                      transition={{ duration: 0.8 }}
                      className="absolute top-[18%] left-[28%] text-lg sm:text-2xl z-30 select-none"
                    >
                      💦
                    </motion.span>

                    {/* Dust Puffs behind Team 1's feet */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, x: 10 }}
                      animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.4, 1.8], x: [0, -35, -60], y: [0, -10, -18] }}
                      transition={{ duration: 0.7 }}
                      className="absolute bottom-[10%] left-[10%] text-xl sm:text-2xl z-20 pointer-events-none select-none"
                    >
                      💨
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Team 2 Strain / Dust Puffs & Muscle Sparks (Right) */}
              <AnimatePresence>
                {lastWinnerTeam === 'team2' && (
                  <>
                    {/* Floating Effort Badges over Team 2 */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.7 }}
                      animate={{ opacity: 1, y: -25, scale: 1 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ duration: 0.65 }}
                      className="absolute top-[8%] right-[20%] z-30 flex items-center gap-1 bg-rose-600 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-rose-300"
                    >
                      <Zap size={14} className="fill-amber-300 text-amber-300" />
                      <span>កម្លាំងខ្លាំង! +1</span>
                    </motion.div>

                    {/* Cartoon Sweat / Strain drop */}
                    <motion.span 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], y: [-5, -25], x: [10, 20] }}
                      transition={{ duration: 0.8 }}
                      className="absolute top-[18%] right-[28%] text-lg sm:text-2xl z-30 select-none"
                    >
                      💦
                    </motion.span>

                    {/* Dust Puffs behind Team 2's feet */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, x: -10 }}
                      animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.4, 1.8], x: [0, 35, 60], y: [0, -10, -18] }}
                      transition={{ duration: 0.7 }}
                      className="absolute bottom-[10%] right-[10%] text-xl sm:text-2xl z-20 pointer-events-none select-none"
                    >
                      💨
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Winner Victory Aura & Golden Crown */}
              <AnimatePresence>
                {winner === 'team1' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: [1, 1.1, 1], y: [-5, -15, -5] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute -top-6 left-[18%] z-30 flex flex-col items-center pointer-events-none"
                  >
                    <Crown size={34} className="text-amber-400 fill-amber-400 drop-shadow-md" />
                    <span className="bg-amber-400 text-amber-950 font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                      👑 ក្រុមទី ១ ឈ្នះ!
                    </span>
                  </motion.div>
                )}
                {winner === 'team2' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: [1, 1.1, 1], y: [-5, -15, -5] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute -top-6 right-[18%] z-30 flex flex-col items-center pointer-events-none"
                  >
                    <Crown size={34} className="text-amber-400 fill-amber-400 drop-shadow-md" />
                    <span className="bg-amber-400 text-amber-950 font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                      👑 ក្រុមទី ២ ឈ្នះ!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Arena Bottom: Position Progress Slider */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-sky-600 font-black">ក្រុមទី ១ (ឆ្វេង)</span>
              <span className="text-slate-500 font-mono font-bold">
                {pullBalance < 0 ? `← ទាញបាន ${Math.abs(pullBalance)} ជំហាន` : pullBalance > 0 ? `ទាញបាន ${pullBalance} ជំហាន →` : 'កណ្តាលស្មើគ្នា'}
              </span>
              <span className="text-rose-600 font-black">ក្រុមទី ២ (ស្តាំ)</span>
            </div>

            {/* Visual Balance Track */}
            <div className="relative w-full h-2.5 bg-slate-200/90 rounded-full flex items-center px-1">
              {/* Center indicator line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 -translate-x-1/2" />
              
              {/* Moving Purple Bead */}
              <motion.div 
                style={{ left: `${50 + (pullBalance / targetWinPulls) * 46}%` }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="absolute w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-md -translate-x-1/2"
              />
            </div>
          </div>
        </div>


        {/* ================= BOTTOM: DUAL TEAM KEYPADS (2-ROW COMPACT LAYOUT) ================= */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 shrink-0">
          
          {/* ================= TEAM 1 PANEL (Left / Sky) ================= */}
          <div 
            id="panel-team-1"
            className="bg-sky-50/80 border-2 border-sky-200/90 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-xs flex flex-col justify-between transition-all"
          >
            {/* Header Tag & Answer Display in 1 compact row */}
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              {/* Team 1 Badge */}
              <div className="bg-sky-600 text-white font-bold py-1.5 px-3 sm:px-4 rounded-xl flex items-center gap-2 shadow-xs shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-sm sm:text-base font-black tracking-wide whitespace-nowrap">ក្រុមទី ១</span>
                <span className="bg-white text-sky-700 font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-inner ml-1">
                  {t1Score}
                </span>
              </div>

              {/* Answer Display Box (ប្រអប់ចម្លើយ) */}
              <motion.div 
                animate={
                  t1Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t1SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#e0f2fe', '#ffffff'] }
                    : {}
                }
                className={`flex-1 min-h-[44px] sm:min-h-[48px] bg-white border-2 rounded-xl py-1 px-3 text-center flex items-center justify-center transition-colors shadow-xs ${
                  t1Shake 
                    ? 'border-rose-400 text-rose-600 bg-rose-50' 
                    : t1SuccessFlash
                    ? 'border-sky-500 ring-2 ring-sky-300'
                    : 'border-slate-200/90 text-slate-800'
                }`}
              >
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-widest ${t1Input ? 'text-slate-800' : 'text-slate-300'}`}>
                  {t1Input || 0}
                </span>
              </motion.div>
            </div>

            {/* 2-Row Compact Keypad: 7 columns x 2 rows */}
            {/* Row 1: 1, 2, 3, 4, 5, 6, ✕ (Clear All) */}
            {/* Row 2: 7, 8, 9, 0, . (Dot), ⌫ (Backspace), ✓ (Submit) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6].map((digit) => (
                <button
                  key={`t1-${digit}`}
                  onClick={() => handleT1Key(digit.toString())}
                  className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-black text-lg sm:text-xl py-2 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}

              {/* Clear Button (Red X) */}
              <button
                onClick={() => handleT1Key('C')}
                className="bg-[#f43f5e] hover:bg-[#e11d48] active:scale-95 text-white font-black py-2 sm:py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                title="លុបទាំងអស់"
              >
                <X size={20} strokeWidth={3.5} />
              </button>

              {[7, 8, 9, 0].map((digit) => (
                <button
                  key={`t1-${digit}`}
                  onClick={() => handleT1Key(digit.toString())}
                  className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-black text-lg sm:text-xl py-2 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}

              {/* Decimal Dot Button (.) */}
              <button
                onClick={() => handleT1Key('.')}
                className="bg-white hover:bg-sky-50 active:scale-95 text-sky-700 font-black text-2xl sm:text-3xl py-2 sm:py-2.5 rounded-xl border border-sky-200/90 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none leading-none pb-1"
                title="ចុចទសភាគ"
              >
                .
              </button>

              {/* Backspace Button (Delete 1 char) */}
              <button
                onClick={() => handleT1Key('backspace')}
                className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                title="លុបថយក្រោយ ១ ខ្ទង់"
              >
                <Delete size={18} strokeWidth={2.5} />
              </button>

              {/* Submit Button (Vibrant Blue Checkmark) */}
              <button
                onClick={() => handleT1Key('submit')}
                className="bg-[#0080dd] hover:bg-blue-600 active:scale-95 text-white font-black py-2 sm:py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                title="ផ្ទៀងផ្ទាត់ចម្លើយ"
              >
                <Check size={20} strokeWidth={3.5} />
              </button>
            </div>

            {/* Bottom Team Hint */}
            <div className="text-center text-[10px] sm:text-xs font-semibold text-slate-400 pt-1.5">
              ក្រុមទី ១៖ ចុចប៊ូតុង ឬ keyboard (1-9, 0, ., Enter)
            </div>
          </div>


          {/* ================= TEAM 2 PANEL (Right / Rose) ================= */}
          <div 
            id="panel-team-2"
            className="bg-rose-50/80 border-2 border-rose-200/90 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-xs flex flex-col justify-between transition-all"
          >
            {/* Header Tag & Answer Display in 1 compact row */}
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              {/* Team 2 Badge */}
              <div className="bg-rose-600 text-white font-bold py-1.5 px-3 sm:px-4 rounded-xl flex items-center gap-2 shadow-xs shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-sm sm:text-base font-black tracking-wide whitespace-nowrap">ក្រុមទី ២</span>
                <span className="bg-white text-rose-700 font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-inner ml-1">
                  {t2Score}
                </span>
              </div>

              {/* Answer Display Box (ប្រអប់ចម្លើយ) */}
              <motion.div 
                animate={
                  t2Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t2SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#ffe4e6', '#ffffff'] }
                    : {}
                }
                className={`flex-1 min-h-[44px] sm:min-h-[48px] bg-white border-2 rounded-xl py-1 px-3 text-center flex items-center justify-center transition-colors shadow-xs ${
                  t2Shake 
                    ? 'border-rose-400 text-rose-600 bg-rose-50' 
                    : t2SuccessFlash
                    ? 'border-rose-500 ring-2 ring-rose-300'
                    : 'border-slate-200/90 text-slate-800'
                }`}
              >
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-widest ${t2Input ? 'text-slate-800' : 'text-slate-300'}`}>
                  {t2Input || 0}
                </span>
              </motion.div>
            </div>

            {/* 2-Row Compact Keypad: 7 columns x 2 rows */}
            {/* Row 1: 1, 2, 3, 4, 5, 6, ✕ (Clear All) */}
            {/* Row 2: 7, 8, 9, 0, . (Dot), ⌫ (Backspace), ✓ (Submit) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6].map((digit) => (
                <button
                  key={`t2-${digit}`}
                  onClick={() => handleT2Key(digit.toString())}
                  className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-black text-lg sm:text-xl py-2 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}

              {/* Clear Button (Red X) */}
              <button
                onClick={() => handleT2Key('C')}
                className="bg-[#f43f5e] hover:bg-[#e11d48] active:scale-95 text-white font-black py-2 sm:py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                title="លុបទាំងអស់"
              >
                <X size={20} strokeWidth={3.5} />
              </button>

              {[7, 8, 9, 0].map((digit) => (
                <button
                  key={`t2-${digit}`}
                  onClick={() => handleT2Key(digit.toString())}
                  className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-black text-lg sm:text-xl py-2 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}

              {/* Decimal Dot Button (.) */}
              <button
                onClick={() => handleT2Key('.')}
                className="bg-white hover:bg-rose-50 active:scale-95 text-rose-700 font-black text-2xl sm:text-3xl py-2 sm:py-2.5 rounded-xl border border-rose-200/90 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none leading-none pb-1"
                title="ចុចទសភាគ"
              >
                .
              </button>

              {/* Backspace Button (Delete 1 char) */}
              <button
                onClick={() => handleT2Key('backspace')}
                className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                title="លុបថយក្រោយ ១ ខ្ទង់"
              >
                <Delete size={18} strokeWidth={2.5} />
              </button>

              {/* Submit Button (Vibrant Blue Checkmark) */}
              <button
                onClick={() => handleT2Key('submit')}
                className="bg-[#0080dd] hover:bg-blue-600 active:scale-95 text-white font-black py-2 sm:py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer select-none"
                title="ផ្ទៀងផ្ទាត់ចម្លើយ"
              >
                <Check size={20} strokeWidth={3.5} />
              </button>
            </div>

            {/* Bottom Team Hint */}
            <div className="text-center text-[10px] sm:text-xs font-semibold text-slate-400 pt-1.5">
              ក្រុមទី ២៖ ចុចប៊ូតុង ឬ keyboard (Numpad)
            </div>
          </div>

        </div>
      </main>


      {/* ================= 3. SETTINGS MODAL ================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Settings size={22} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">ការកំណត់ល្បែងទាញព្រ័ត្រ</h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-4 space-y-4">
                {/* Math Operations Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                    ប្រមាណវិធីគណិតវិទ្យា
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mul', label: 'គុណ (×)' },
                      { id: 'add', label: 'បូក (+)' },
                      { id: 'sub', label: 'ដក (-)' },
                      { id: 'div', label: 'ចែក (÷)' },
                      { id: 'decimal', label: 'ទសភាគ (.)' },
                      { id: 'mixed', label: 'លាយបញ្ចូលគ្នា' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOperation(item.id as MathOperation)}
                        className={`py-2 px-3 rounded-xl font-extrabold text-sm border transition-all cursor-pointer ${
                          operation === item.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Levels */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                    កម្រិតលំបាក
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'easy', label: 'ងាយស្រួល (១-១០)' },
                      { id: 'medium', label: 'មធ្យម (២-២៥)' },
                      { id: 'hard', label: 'លំបាក (២-១០០)' }
                    ].map(lvl => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setDifficulty(lvl.id as DifficultyLevel)}
                        className={`py-2 px-2.5 rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer ${
                          difficulty === lvl.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Win Pulls ahead */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                    ចំនួនជំហានទាញឈ្នះផ្តាច់
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 4, label: '៤ ជំហាន' },
                      { val: 6, label: '៦ ជំហាន (ស្តង់ដារ)' },
                      { val: 8, label: '៨ ជំហាន' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setTargetWinPulls(opt.val)}
                        className={`py-2 px-2.5 rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer ${
                          targetWinPulls === opt.val 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playClickSound();
                    resetGame();
                    setIsSettingsOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow-md transition-all cursor-pointer"
                >
                  អនុវត្ត & ចាប់ផ្តើមថ្មី
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ================= 4. VICTORY CELEBRATION MODAL ================= */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-300 relative overflow-hidden"
            >
              {/* Header Trophy */}
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Trophy size={42} className="animate-bounce" />
              </div>

              {/* Winner Title */}
              {winner === 'team1' ? (
                <div>
                  <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-extrabold rounded-full mb-2">
                    អបអរសាទរជ័យជម្នះ!
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-sky-600 mb-2">
                    ក្រុមទី ១ ឈ្នះ! 🎉
                  </h2>
                  <p className="text-slate-600 text-sm font-semibold mb-6">
                    ក្រុមទី ១ បានទាញខ្សែព្រ័ត្រឈ្នះផ្តាច់ដោយឆ្លើយត្រូវ {t1Score} សំណួរ!
                  </p>
                </div>
              ) : winner === 'team2' ? (
                <div>
                  <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 text-xs font-extrabold rounded-full mb-2">
                    អបអរសាទរជ័យជម្នះ!
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-rose-600 mb-2">
                    ក្រុមទី ២ ឈ្នះ! 🎉
                  </h2>
                  <p className="text-slate-600 text-sm font-semibold mb-6">
                    ក្រុមទី ២ បានទាញខ្សែព្រ័ត្រឈ្នះផ្តាច់ដោយឆ្លើយត្រូវ {t2Score} សំណួរ!
                  </p>
                </div>
              ) : (
                <div>
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-extrabold rounded-full mb-2">
                    លទ្ធផលស្មើគ្នា!
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-amber-600 mb-2">
                    លទ្ធផលស្មើគ្នា! 🤝
                  </h2>
                  <p className="text-slate-600 text-sm font-semibold mb-6">
                    ក្រុមទាំងពីរមានពិន្ទុ និងកម្លាំងទាញស្មើគ្នា {t1Score} ស្មើ {t2Score}!
                  </p>
                </div>
              )}

              {/* Match Stats Box */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-xs font-bold text-sky-600 block mb-1">ក្រុមទី ១</span>
                  <span className="text-2xl font-black text-sky-700 font-mono">{t1Score}</span>
                  <span className="text-[11px] text-slate-500 block">ចម្លើយត្រូវ</span>
                </div>
                <div className="pl-2">
                  <span className="text-xs font-bold text-rose-600 block mb-1">ក្រុមទី ២</span>
                  <span className="text-2xl font-black text-rose-700 font-mono">{t2Score}</span>
                  <span className="text-[11px] text-slate-500 block">ចម្លើយត្រូវ</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (soundEnabled) playClickSound();
                    resetGame();
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={18} />
                  <span>លេងម្តងទៀត</span>
                </button>
                <button
                  onClick={() => {
                    if (soundEnabled) playClickSound();
                    onBack();
                  }}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                >
                  ទំព័រដើម
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
