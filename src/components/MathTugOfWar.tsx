import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
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
  HelpCircle,
  Layers,
  ChevronDown,
  BookOpen,
  FileQuestion,
  Smartphone,
  QrCode,
  Copy,
  Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { playSuccessSound, playFailSound, playClickSound, playWinSound, playTickSound } from '../utils/audio';
import { Topic, QuizQuestion } from '../types';
import { DEFAULT_TOPICS } from '../data';

interface MathTugOfWarProps {
  onBack: () => void;
  topics?: Topic[];
  activeTopicId?: string;
  onSelectTopic?: (id: string) => void;
  onAddTopic?: (topic: Topic) => void;
  onUpdateTopic?: (topic: Topic) => void;
}

export type GameMode = 'math' | 'quiz';
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

export default function MathTugOfWar({ onBack, topics = DEFAULT_TOPICS, activeTopicId, onSelectTopic, onAddTopic, onUpdateTopic }: MathTugOfWarProps) {
  // Mode selection: 'math' (លេខ) or 'quiz' (សំណួរពហុជម្រើស ក ខ គ ឃ)
  const [gameMode, setGameMode] = useState<GameMode>('quiz');

  // Topic selection for Quiz mode (pulled from pre-existing topics)
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeTopicId || topics[0]?.id || DEFAULT_TOPICS[0].id);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState<boolean>(false);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState<boolean>(false);

  // Derive current topic & questions
  const currentTopic = useMemo(() => {
    return topics.find(t => t.id === selectedTopicId) || topics[0] || DEFAULT_TOPICS[0];
  }, [topics, selectedTopicId]);

  const [quizSeed, setQuizSeed] = useState<number>(0);

  const availableQuizQuestions = useMemo(() => {
    const questions = [...(currentTopic?.quizQuestions || [])];
    // Fisher-Yates shuffle algorithm to randomise question order
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  }, [currentTopic, quizSeed]);

  const [t1QuizIndex, setT1QuizIndex] = useState<number>(0);
  const [t2QuizIndex, setT2QuizIndex] = useState<number>(1);
  const t1QuizQuestion = availableQuizQuestions[t1QuizIndex] || null;
  const t2QuizQuestion = availableQuizQuestions[t2QuizIndex] || null;

  // Sound & Screen & Language controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExpandedFullscreen, setIsExpandedFullscreen] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>('kh');

  // Game Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [operation, setOperation] = useState<MathOperation>('mul');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [targetWinPulls, setTargetWinPulls] = useState<number>(6); // 6 pulls ahead wins
  const [winByPullGoal] = useState<boolean>(true);
  
  // Timer settings
  const [matchDuration, setMatchDuration] = useState<number>(180); // 0 means infinite, otherwise seconds
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Gameplay State
  const [pullBalance, setPullBalance] = useState<number>(0); // -target to +target
  const [winner, setWinner] = useState<'team1' | 'team2' | 'draw' | null>(null);

  // Room Sync & QR Code Controller State
  const [roomId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('tug_room_id');
      if (saved) return saved;
      const newId = 'TUG-' + Math.floor(1000 + Math.random() * 9000);
      sessionStorage.setItem('tug_room_id', newId);
      return newId;
    } catch {
      return 'TUG-' + Math.floor(1000 + Math.random() * 9000);
    }
  });

  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrT1, setQrT1] = useState<string>('');
  const [qrT2, setQrT2] = useState<string>('');
  const [t1Connected, setT1Connected] = useState<boolean>(false);
  const [t2Connected, setT2Connected] = useState<boolean>(false);
  const [copiedT1, setCopiedT1] = useState<boolean>(false);
  const [copiedT2, setCopiedT2] = useState<boolean>(false);
  const lastSubRef = useRef<number>(Date.now());

  // Separate questions for each team
  const [t1Question, setT1Question] = useState<MathQuestion | null>(null);
  const [t2Question, setT2Question] = useState<MathQuestion | null>(null);
  const [lastWinnerTeam, setLastWinnerTeam] = useState<'team1' | 'team2' | null>(null);

  // Team 1 State (Blue / Left)
  const [t1Score, setT1Score] = useState<number>(0);
  const [t1Input, setT1Input] = useState<string>('');
  const [t1Shake, setT1Shake] = useState<boolean>(false);
  const [t1SuccessFlash, setT1SuccessFlash] = useState<boolean>(false);
  const [t1Choice, setT1Choice] = useState<number | null>(null);
  const [t1Locked, setT1Locked] = useState<boolean>(false);

  // Team 2 State (Red / Right)
  const [t2Score, setT2Score] = useState<number>(0);
  const [t2Input, setT2Input] = useState<string>('');
  const [t2Shake, setT2Shake] = useState<boolean>(false);
  const [t2SuccessFlash, setT2SuccessFlash] = useState<boolean>(false);
  const [t2Choice, setT2Choice] = useState<number | null>(null);
  const [t2Locked, setT2Locked] = useState<boolean>(false);

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
    setT1Choice(null);
    setT2Choice(null);
    setT1Locked(false);
    setT2Locked(false);
    setLastPullTeam(null);
    setLastWinnerTeam(null);
    setT1Question(generateQuestion());
    setT2Question(generateQuestion());
    setT1QuizIndex(0);
    setT2QuizIndex(1);
    setQuizSeed(prev => prev + 1);
    
    setTimeLeft(matchDuration);
    setIsTimerRunning(true);
  }, [generateQuestion, matchDuration]);

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
  }, [isTimerRunning, timeLeft, winner, pullBalance, matchDuration, soundEnabled]);

  // Submit Answer for Team 1 in Quiz Mode (ក, ខ, គ, ឃ => 0, 1, 2, 3)
  const submitQuizTeam1 = (choiceIdx: number) => {
    if (winner || t1Locked || !t1QuizQuestion) return;
    if (soundEnabled) playClickSound();
    setT1Choice(choiceIdx);

    if (choiceIdx === t1QuizQuestion.answerIndex) {
      if (soundEnabled) playSuccessSound();
      setT1Score(prev => prev + 1);
      setT1SuccessFlash(true);
      setLastPullTeam('team1');
      setLastWinnerTeam('team1');

      const newBalance = Math.max(-targetWinPulls, pullBalance - 1);
      setPullBalance(newBalance);
      checkPullWin(newBalance);

      setTimeout(() => {
        setT1SuccessFlash(false);
        setLastWinnerTeam(null);
        setT1Choice(null);
        if (availableQuizQuestions.length > 0) {
          setT1QuizIndex(prev => (prev + 2) % availableQuizQuestions.length);
        }
      }, 850);
    } else {
      if (soundEnabled) playFailSound();
      setT1Shake(true);
      setT1Locked(true);
      setTimeout(() => {
        setT1Shake(false);
        setT1Locked(false);
        setT1Choice(null);
      }, 1000);
    }
  };

  // Submit Answer for Team 2 in Quiz Mode (ក, ខ, គ, ឃ => 0, 1, 2, 3)
  const submitQuizTeam2 = (choiceIdx: number) => {
    if (winner || t2Locked || !t2QuizQuestion) return;
    if (soundEnabled) playClickSound();
    setT2Choice(choiceIdx);

    if (choiceIdx === t2QuizQuestion.answerIndex) {
      if (soundEnabled) playSuccessSound();
      setT2Score(prev => prev + 1);
      setT2SuccessFlash(true);
      setLastPullTeam('team2');
      setLastWinnerTeam('team2');

      const newBalance = Math.min(targetWinPulls, pullBalance + 1);
      setPullBalance(newBalance);
      checkPullWin(newBalance);

      setTimeout(() => {
        setT2SuccessFlash(false);
        setLastWinnerTeam(null);
        setT2Choice(null);
        if (availableQuizQuestions.length > 0) {
          setT2QuizIndex(prev => (prev + 2) % availableQuizQuestions.length);
        }
      }, 850);
    } else {
      if (soundEnabled) playFailSound();
      setT2Shake(true);
      setT2Locked(true);
      setTimeout(() => {
        setT2Shake(false);
        setT2Locked(false);
        setT2Choice(null);
      }, 1000);
    }
  };

  // Generate QR Code images on mount or when roomId changes
  useEffect(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const url1 = `${origin}${pathname}?mode=controller&room=${roomId}&team=1`;
    const url2 = `${origin}${pathname}?mode=controller&room=${roomId}&team=2`;

    QRCode.toDataURL(url1, { width: 240, margin: 2, color: { dark: '#1d4ed8', light: '#ffffff' } })
      .then(url => setQrT1(url))
      .catch(err => console.error(err));

    QRCode.toDataURL(url2, { width: 240, margin: 2, color: { dark: '#be123c', light: '#ffffff' } })
      .then(url => setQrT2(url))
      .catch(err => console.error(err));
  }, [roomId]);

  const processedSubIdsRef = useRef<Set<string>>(new Set());

  // Helper to normalize numbers (converts Khmer numerals like ០១២៣៤៥៦៧៨៩ to 0123456789)
  const parseNormalizedFloat = (str: string): number => {
    if (!str) return NaN;
    const khmerDigits = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
    let normalized = String(str).trim();
    khmerDigits.forEach((kDigit, index) => {
      normalized = normalized.split(kDigit).join(index.toString());
    });
    return parseFloat(normalized);
  };

  // Helper to parse quiz choice index from Tablet/keypad input
  const parseQuizChoiceIndex = useCallback((rawVal: string, options?: string[]): number => {
    if (rawVal === undefined || rawVal === null) return -1;
    const s = String(rawVal).trim().toLowerCase();

    if (s === '០' || s === '0' || s === 'a' || s === 'ក') return 0;
    if (s === '១' || s === '1' || s === 'b' || s === 'ខ') return 1;
    if (s === '២' || s === '2' || s === 'c' || s === 'គ') return 2;
    if (s === '៣' || s === '3' || s === 'd' || s === 'ឃ') return 3;

    const num = parseInt(s, 10);
    if (!isNaN(num) && num >= 0 && num < 4) return num;

    if (options && options.length > 0) {
      const idx = options.findIndex(opt => opt.trim().toLowerCase() === s);
      if (idx !== -1) return idx;
    }
    return -1;
  }, []);

  // Sync Room state to server every 1 second
  useEffect(() => {
    const syncState = () => {
      const activeT1Q = gameMode === 'math' ? t1Question : t1QuizQuestion;
      const activeT2Q = gameMode === 'math' ? t2Question : t2QuizQuestion;

      fetch('/api/tug/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          gameMode,
          t1Question: activeT1Q,
          t2Question: activeT2Q
        })
      }).catch(() => {});
    };

    syncState();
    const interval = setInterval(syncState, 1000);
    return () => clearInterval(interval);
  }, [roomId, gameMode, t1Question, t2Question, t1QuizQuestion, t2QuizQuestion]);

  // Submit Answer for Team 1 from Tablet Controller or Keypad
  const submitTeam1WithVal = useCallback((rawVal: string) => {
    if (!t1Question || winner) return;
    const userVal = parseNormalizedFloat(rawVal);
    if (isNaN(userVal)) return;

    if (Math.abs(userVal - t1Question.answer) < 0.001) {
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
      setT1Question(generateQuestion());
    } else {
      if (soundEnabled) playFailSound();
      setT1Shake(true);
      setTimeout(() => setT1Shake(false), 500);
      setT1Input('');
    }
  }, [t1Question, winner, soundEnabled, pullBalance, targetWinPulls, checkPullWin, generateQuestion]);

  // Submit Answer for Team 2 from Tablet Controller or Keypad
  const submitTeam2WithVal = useCallback((rawVal: string) => {
    if (!t2Question || winner) return;
    const userVal = parseNormalizedFloat(rawVal);
    if (isNaN(userVal)) return;

    if (Math.abs(userVal - t2Question.answer) < 0.001) {
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

      setT2Input('');
      setT2Question(generateQuestion());
    } else {
      if (soundEnabled) playFailSound();
      setT2Shake(true);
      setTimeout(() => setT2Shake(false), 500);
      setT2Input('');
    }
  }, [t2Question, winner, soundEnabled, pullBalance, targetWinPulls, checkPullWin, generateQuestion]);

  // Poll for incoming tablet submissions every 250ms
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tug/submissions?roomId=${roomId}&since=${lastSubRef.current}`);
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;

          setT1Connected(!!data.t1Connected);
          setT2Connected(!!data.t2Connected);

          if (Array.isArray(data.submissions) && data.submissions.length > 0) {
            data.submissions.forEach((sub: { id: string; team: 1 | 2; answer: string; timestamp: number }) => {
              if (processedSubIdsRef.current.has(sub.id)) return;
              processedSubIdsRef.current.add(sub.id);
              if (processedSubIdsRef.current.size > 200) {
                const arr = Array.from(processedSubIdsRef.current);
                processedSubIdsRef.current = new Set(arr.slice(100));
              }

              if (sub.timestamp > lastSubRef.current) {
                lastSubRef.current = sub.timestamp;
              }

              if (sub.team === 1) {
                if (gameMode === 'math') {
                  submitTeam1WithVal(sub.answer);
                } else if (gameMode === 'quiz') {
                  const choiceIdx = parseQuizChoiceIndex(sub.answer, t1QuizQuestion?.options);
                  if (choiceIdx !== -1) submitQuizTeam1(choiceIdx);
                }
              } else if (sub.team === 2) {
                if (gameMode === 'math') {
                  submitTeam2WithVal(sub.answer);
                } else if (gameMode === 'quiz') {
                  const choiceIdx = parseQuizChoiceIndex(sub.answer, t2QuizQuestion?.options);
                  if (choiceIdx !== -1) submitQuizTeam2(choiceIdx);
                }
              }
            });
          }
        }
      } catch {
        // Ignore background poll errors
      }
    }, 250);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, gameMode, submitTeam1WithVal, submitTeam2WithVal, submitQuizTeam1, submitQuizTeam2, t1QuizQuestion, t2QuizQuestion, parseQuizChoiceIndex]);

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
      submitTeam1WithVal(t1Input);
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
      submitTeam2WithVal(t2Input);
    } else {
      if (t2Input.length < 8) {
        setT2Input(prev => prev === '0' ? val : prev + val);
      }
    }
  };

  // Physical Keyboard Listener (Quiz: Team 1 keys 1-4/A-D, Team 2 keys Numpad 1-4 / Arrows; Math: Team 2 Numpad, Team 1 Top digits)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape exits expanded fullscreen mode
      if (e.key === 'Escape' && isExpandedFullscreen) {
        toggleExpandedFullscreen();
        return;
      }

      if (isSettingsOpen || isTopicModalOpen || winner) return;

      // QUIZ MODE SHORTCUTS
      if (gameMode === 'quiz') {
        // Team 2 shortcuts (Numpad 1-4, Arrow Keys: Left=0, Up=1, Down=2, Right=3)
        if (e.code === 'Numpad1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          submitQuizTeam2(0);
          return;
        } else if (e.code === 'Numpad2' || e.key === 'ArrowUp') {
          e.preventDefault();
          submitQuizTeam2(1);
          return;
        } else if (e.code === 'Numpad3' || e.key === 'ArrowDown') {
          e.preventDefault();
          submitQuizTeam2(2);
          return;
        } else if (e.code === 'Numpad4' || e.key === 'ArrowRight') {
          e.preventDefault();
          submitQuizTeam2(3);
          return;
        }

        // Team 1 shortcuts (Keys 1-4, A, B, C, D)
        const lower = e.key.toLowerCase();
        if (e.code === 'Digit1' || lower === 'a' || e.key === '1') {
          e.preventDefault();
          submitQuizTeam1(0);
          return;
        } else if (e.code === 'Digit2' || lower === 'b' || e.key === '2') {
          e.preventDefault();
          submitQuizTeam1(1);
          return;
        } else if (e.code === 'Digit3' || lower === 'c' || e.key === '3') {
          e.preventDefault();
          submitQuizTeam1(2);
          return;
        } else if (e.code === 'Digit4' || lower === 'd' || e.key === '4') {
          e.preventDefault();
          submitQuizTeam1(3);
          return;
        }
        return;
      }

      // MATH MODE SHORTCUTS
      // Numpad is reserved for Team 2
      if (e.code.startsWith('Numpad')) {
        e.preventDefault();
        const digit = e.code.replace('Numpad', '');
        if (/^[0-9]$/.test(digit)) {
          handleT2Key(digit);
        } else if (e.code === 'NumpadEnter') {
          submitTeam2WithVal(t2Input);
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
        submitTeam1WithVal(t1Input);
      } else if (e.code === 'KeyC') {
        handleT1Key('C');
      } else if (e.code === 'Backspace') {
        handleT1Key('backspace');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isTopicModalOpen, winner, t1Input, t2Input, t1Question, t2Question, gameMode, t1QuizQuestion, t2QuizQuestion, t1Locked, t2Locked, isExpandedFullscreen]);

  // Fullscreen & Expanded Mode toggle (Hides Nav, Maximizes Playing Arena)
  const toggleExpandedFullscreen = useCallback(() => {
    if (soundEnabled) playClickSound();
    setIsExpandedFullscreen((prev) => {
      const next = !prev;
      if (next) {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            // If iframe rejects requestFullscreen, CSS full-screen viewport still works 100%
          });
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
      return next;
    });
  }, [soundEnabled]);

  // Sync with browser native fullscreen exit (e.g. user pressed Esc via browser)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setIsExpandedFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate pixel displacement for the rope and characters
  // pullBalance ranges from -targetWinPulls to +targetWinPulls (e.g. -6 to +6)
  // Max pixel offset = approx 160px left or right
  const maxDisplacementPx = 160;
  const displacementPx = (pullBalance / targetWinPulls) * maxDisplacementPx;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Assume row 0 is header.
        // Columns: Question, Option 1, Option 2, Option 3, Option 4, Answer Index (1-4)
        const newQuestions: QuizQuestion[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;
          
          const question = row[0]?.toString() || '';
          if (!question) continue;
          
          const opt1 = row[1]?.toString() || '';
          const opt2 = row[2]?.toString() || '';
          const opt3 = row[3]?.toString() || '';
          const opt4 = row[4]?.toString() || '';
          
          const options = [opt1, opt2, opt3, opt4].filter(Boolean);
          if (options.length < 2) continue;
          
          let answerIndex = parseInt(row[5]?.toString()) - 1;
          if (isNaN(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
            answerIndex = 0;
          }
          
          newQuestions.push({
            question,
            options,
            answerIndex,
            explanation: row[6]?.toString() || ''
          });
        }
        
        if (newQuestions.length > 0) {
          const newTopic: Topic = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            difficultWords: [],
            shortPassages: [],
            quizQuestions: newQuestions,
            createdAt: Date.now()
          };
          onAddTopic?.(newTopic);
          setSelectedTopicId(newTopic.id);
          setIsTopicDropdownOpen(false);
          alert(`នាំចូលបាន ${newQuestions.length} សំណួរដោយជោគជ័យ!`);
          if (soundEnabled) playSuccessSound();
        } else {
          alert("មិនមានសំណួរត្រឹមត្រូវក្នុងឯកសារនេះទេ! សូមពិនិត្យទម្រង់ Excel។ (សំណួរ, ជម្រើស១-៤, លេខរៀងចម្លើយត្រូវ ១-៤)");
        }
      } catch (error) {
        console.error(error);
        alert("មានបញ្ហាក្នុងការអានឯកសារ Excel!");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div 
      id="math-tug-of-war-container"
      className={`bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/30 text-slate-800 flex flex-col justify-between font-sans select-none overflow-hidden transition-all ${
        isExpandedFullscreen 
          ? 'fixed inset-0 z-50 w-screen h-screen p-1.5 sm:p-2.5' 
          : 'min-h-screen'
      }`}
    >
      {/* 1. Header Toolbar (Hidden when in Fullscreen/Expanded mode) */}
      {!isExpandedFullscreen && (
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
          </div>

          {/* Center Title & Timer */}
          <div className="flex flex-col items-center gap-0.5 text-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-indigo-900 tracking-tight flex items-center justify-center gap-2">
              <span>{gameMode === 'quiz' ? `ទាញព្រ័ត្រ ៖ ${currentTopic?.name || 'សំណួរពហុជម្រើស'}` : 'ទាញព្រ័ត្រ គណិតវិទ្យា'}</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                {gameMode === 'quiz' 
                  ? `សំណួរពហុជម្រើស (${availableQuizQuestions.length} សំណួរ)` 
                  : `ប្រមាណវិធី ${operation === 'mul' ? 'គុណ (×)' : operation === 'add' ? 'បូក (+)' : operation === 'sub' ? 'ដក (-)' : operation === 'div' ? 'ចែក (÷)' : operation === 'decimal' ? 'ទសភាគ' : 'ចម្រុះ'}`
                }
              </span>

            </div>
          </div>

          {/* Right Toolbar - QR Tablet button & Settings button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (soundEnabled) playClickSound();
                setIsQrModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-black rounded-full text-xs sm:text-sm transition-all border border-emerald-200 shadow-xs cursor-pointer"
              title="ភ្ជាប់ Tablet A និង B សម្រាប់ចុចចម្លើយបញ្ជាពីចម្ងាយ (QR Code)"
            >
              <QrCode size={18} className="text-emerald-600" />
              <span className="hidden sm:inline">ភ្ជាប់ Tablet (QR)</span>
              <span className="sm:hidden">QR</span>
            </button>

            <button
              onClick={() => {
                if (soundEnabled) playClickSound();
                setIsSettingsOpen(true);
              }}
              id="btn-tug-settings"
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-black rounded-full text-xs sm:text-sm transition-all border border-indigo-200 shadow-xs cursor-pointer"
              title="ការកំណត់ល្បែង"
            >
              <Settings size={18} className="text-indigo-600" />
              <span>ការកំណត់</span>
            </button>
          </div>
        </header>
      )}

      {/* 2. Main Arena & Dual Panels Layout: Top = Tug of War Arena, Bottom = 2-Row Keypads */}
      <main className={`flex-1 w-full mx-auto flex flex-col justify-between relative overflow-hidden transition-all max-w-[1500px] p-0 gap-0 sm:gap-0`}>
        
        {/* ================= TOP: TUG-OF-WAR ARENA (Full Width) ================= */}
        <div 
          id="arena-tug-field"
          className={`bg-white border-none rounded-none shadow-none flex flex-col justify-between overflow-hidden relative transition-all ${
            isExpandedFullscreen
              ? 'flex-1 min-h-[350px] p-0'
              : 'flex-1 min-h-[280px] sm:min-h-[340px] p-0'
          }`}
        >


          {/* Giant Timer always visible at the top of arena */}
          {matchDuration > 0 && (
            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
               <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl shadow-lg border-2 backdrop-blur-md transition-colors ${
                 timeLeft <= 10 && isTimerRunning 
                   ? 'bg-rose-600/90 text-white border-rose-400 animate-pulse shadow-rose-500/50' 
                   : 'bg-slate-900/80 text-white border-slate-700'
               }`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${timeLeft <= 10 ? 'text-white' : 'text-emerald-400'}`}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 <span className="text-xl sm:text-3xl font-black font-mono tracking-widest drop-shadow-md">
                   {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
               </div>
            </div>
          )}

          {/* Giant Timer always visible at the top of arena */}
          {matchDuration > 0 && (
            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
               <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl shadow-lg border-2 backdrop-blur-md transition-colors ${
                 timeLeft <= 10 && isTimerRunning 
                   ? 'bg-rose-600/90 text-white border-rose-400 animate-pulse shadow-rose-500/50' 
                   : 'bg-slate-900/80 text-white border-slate-700'
               }`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${timeLeft <= 10 ? 'text-white' : 'text-emerald-400'}`}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 <span className="text-xl sm:text-3xl font-black font-mono tracking-widest drop-shadow-md">
                   {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
               </div>
            </div>
          )}

          {/* Dedicated Full Screen Button (Icon full Screen ដាច់ដោយឡែក) */}
          <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-30 flex items-center gap-1.5">
            {isExpandedFullscreen && (
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playClickSound();
                }}
                className="p-1.5 sm:p-2 bg-white/95 hover:bg-white active:scale-95 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer backdrop-blur-xs"
                title={soundEnabled ? "បិទសំឡេង" : "បើកសំឡេង"}
              >
                {soundEnabled ? <Volume2 size={16} className="text-emerald-600" /> : <VolumeX size={16} className="text-rose-500" />}
              </button>
            )}

            <button
              type="button"
              onClick={toggleExpandedFullscreen}
              id="btn-tug-dedicated-fullscreen"
              className={`w-9 h-9 sm:w-10 sm:h-10 active:scale-95 rounded-xl border transition-all cursor-pointer flex items-center justify-center backdrop-blur-xs shadow-xs hover:shadow-md ${
                isExpandedFullscreen
                  ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 ring-2 ring-indigo-200'
                  : 'bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 border-slate-200/90'
              }`}
              title={isExpandedFullscreen ? "បង្រួមអេក្រង់ / បង្ហាញ Nav ឡើងវិញ (Esc)" : "ពង្រីកពេញអេក្រង់ (បិទ Nav)"}
            >
              {isExpandedFullscreen ? (
                <Minimize size={18} strokeWidth={2.5} className="text-white" />
              ) : (
                <Maximize size={18} strokeWidth={2.5} className="text-indigo-600" />
              )}
            </button>
          </div>

          {/* Tug of War Interactive Stage */}
          <div className="flex-1 flex items-center justify-center relative min-h-[170px] sm:min-h-[220px] md:min-h-[260px] overflow-hidden">
            {/* Flash Banner when a team answers correctly */}
            <AnimatePresence>
              {lastWinnerTeam && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`absolute top-2 left-1/2 -translate-x-1/2 font-black text-sm sm:text-base md:text-lg text-white px-4 py-1.5 rounded-full shadow-lg z-50 ${
                    lastWinnerTeam === 'team1' ? 'bg-sky-600/90' : 'bg-rose-600/90'
                  }`}
                >
                  {lastWinnerTeam === 'team1' ? '🎉 ក្រុមទី ១ ឆ្លើយត្រូវ! (+1)' : '🎉 ក្រុមទី ២ ឆ្លើយត្រូវ! (+1)'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom Background Image */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat pointer-events-none" 
              style={{ backgroundImage: "url('/images/background2.png')" }} 
            />

            {/* Background Lines & Markers */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              {/* Neutral Center Dotted Line */}
              <div className="absolute top-2 bottom-4 w-0 border-r-2 border-dotted border-slate-400 left-1/2 -translate-x-1/2" />
              
              {/* Team 1 Win Threshold Line (Left) */}
              <div 
                style={{ left: `calc(50% - ${maxDisplacementPx}px)` }}
                className="absolute top-3 bottom-6 w-0 border-r-2 border-dashed border-sky-500 opacity-60"
              />

              {/* Team 2 Win Threshold Line (Right) */}
              <div 
                style={{ left: `calc(50% + ${maxDisplacementPx}px)` }}
                className="absolute top-3 bottom-6 w-0 border-r-2 border-dashed border-rose-500 opacity-60"
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
              {/* Tug of War Image Container (Static position without idle swaying since the GIF has built-in animation) */}
              <div className="relative w-full flex items-center justify-center">
                {/* Student Tug of War Image */}
                <img 
                  src="/images/images3.gif" 
                  alt="សិស្សទាញព្រ័ត្រ (Student Tug of War)" 
                  className={`w-full max-h-[160px] sm:max-h-[210px] md:max-h-[250px] object-contain select-none pointer-events-none transition-all duration-300 ${
                    lastWinnerTeam ? 'drop-shadow-xl brightness-105' : 'drop-shadow-md'
                  }`}
                  draggable={false}
                />
              </div>

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
            
            {/* Arena Bottom: Position Progress Slider (Moved inside Arena) */}
            <div className="absolute bottom-2 left-4 right-4 z-40 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-bold px-1">
                <span className="text-sky-700 font-black drop-shadow-md bg-white/40 px-2 py-0.5 rounded-full">ក្រុមទី ១ (ឆ្វេង)</span>
                <span className="text-slate-800 font-mono font-bold drop-shadow-md bg-white/40 px-2 py-0.5 rounded-full">
                  {pullBalance < 0 ? `← ទាញបាន ${Math.abs(pullBalance)} ជំហាន` : pullBalance > 0 ? `ទាញបាន ${pullBalance} ជំហាន →` : 'កណ្តាលស្មើគ្នា'}
                </span>
                <span className="text-rose-700 font-black drop-shadow-md bg-white/40 px-2 py-0.5 rounded-full">ក្រុមទី ២ (ស្តាំ)</span>
              </div>

              {/* Visual Balance Track */}
              <div className="relative w-full h-2.5 bg-white/80 rounded-full flex items-center px-1 shadow-md border border-slate-300">
                {/* Center indicator line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500 -translate-x-1/2" />
                
                {/* Moving Purple Bead */}
                <motion.div 
                  style={{ left: `${50 + (pullBalance / targetWinPulls) * 46}%` }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="absolute w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-md -translate-x-1/2"
                />
              </div>
            </div>
          </div>
        </div>


        {/* ================= BOTTOM: DUAL TEAM KEYPADS / QUIZ BUTTONS ================= */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 shrink-0 px-2 sm:px-4 pb-2 sm:pb-4 mt-2 sm:mt-3">
          
          {/* ================= TEAM 1 PANEL (Left / Sky) ================= */}
          <div 
            id="panel-team-1"
            className="bg-sky-50/80 border-2 border-sky-200/90 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-xs flex flex-col justify-between transition-all"
          >
            {/* Header Tag, Question, & Answer Display in 1 row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-2">
              {/* Team 1 Badge */}
              <div className="bg-sky-600 text-white font-bold py-1.5 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-sm sm:text-base font-black tracking-wide whitespace-nowrap">ក្រុមទី ១</span>
                <span className="bg-white text-sky-700 font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-inner ml-1">
                  {t1Score}
                </span>
              </div>

              {/* Individual Question Card */}
              <motion.div 
                animate={
                  t1Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t1SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#e0f2fe', '#ffffff'] }
                    : {}
                }
                className={`border-2 rounded-xl py-1 px-3 text-center shadow-xs flex-1 flex flex-col items-center justify-center min-h-[44px] sm:min-h-[48px] transition-colors ${
                  t1Shake 
                    ? 'border-rose-400 bg-rose-50' 
                    : t1SuccessFlash
                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-300'
                    : 'border-sky-100 bg-white'
                }`}
              >
                {gameMode === 'math' ? (
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-800 drop-shadow-xs flex items-center justify-center flex-wrap gap-2">
                    <span>{t1Question ? t1Question.text.replace('?', '') : '...'}</span>
                    <span className={`min-w-[40px] px-2 py-0.5 rounded border-b-4 ${
                      t1Shake ? 'border-rose-500 text-rose-600 bg-rose-100/50' 
                      : t1SuccessFlash ? 'border-emerald-500 text-emerald-600 bg-emerald-100/50' 
                      : t1Input ? 'border-sky-400 text-sky-700 bg-sky-50'
                      : 'border-slate-300 text-slate-400 bg-slate-50'
                    }`}>
                      {t1Input || '?'}
                    </span>
                  </span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2">
                      {t1QuizQuestion ? t1QuizQuestion.question : 'មិនទាន់មានសំណួរ'}
                    </span>
                    {t1Locked && (
                       <span className="text-rose-600 text-xs sm:text-sm font-black animate-pulse mt-1">
                         ❌ ចម្លើយមិនត្រឹមត្រូវ! រង់ចាំបន្តិច...
                       </span>
                    )}
                    {!t1Locked && t1Choice !== null && (
                       <span className="text-sky-700 text-sm sm:text-base font-black mt-1">
                         បានជ្រើសរើស៖ [ ${['ក', 'ខ', 'គ', 'ឃ'][t1Choice]} ]
                       </span>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Controls: Math 2-Row Keypad OR Quiz 4 Choice Buttons */}
            {gameMode === 'math' ? (
              <>
                {/* 2-Row Compact Keypad: 7 columns x 2 rows */}
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
              </>
            ) : (
              <>
                {/* 4 Rich Quiz Choice Cards: [ ក ] [ ខ ] [ គ ] [ ឃ ] with actual answer text */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {t1QuizQuestion?.options.map((optText, optIdx) => {
                    const khmerLabels = ['ក', 'ខ', 'គ', 'ឃ'];
                    const keyHints = ['A / 1', 'B / 2', 'C / 3', 'D / 4'];
                    const isSelected = t1Choice === optIdx;
                    return (
                      <button
                        key={`t1-choice-${optIdx}`}
                        type="button"
                        disabled={t1Locked || !t1QuizQuestion}
                        onClick={() => submitQuizTeam1(optIdx)}
                        className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer select-none shadow-xs active:scale-[0.98] min-h-[54px] sm:min-h-[62px] ${
                          t1Locked
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-sky-600 border-sky-700 text-white shadow-md ring-2 ring-sky-300'
                            : 'bg-white hover:bg-sky-50/90 text-slate-800 border-sky-200 hover:border-sky-400 hover:shadow-sm'
                        }`}
                      >
                        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                          isSelected 
                            ? 'bg-white text-sky-700' 
                            : 'bg-sky-600 text-white'
                        }`}>
                          {khmerLabels[optIdx]}
                        </span>
                        <div className="flex-1 min-w-0 pr-1">
                          <div className={`text-xs sm:text-sm font-black leading-tight line-clamp-2 ${
                            isSelected ? 'text-white' : 'text-slate-800'
                          }`}>
                            {optText}
                          </div>
                          <div className={`text-[9px] font-bold mt-0.5 ${
                            isSelected ? 'text-sky-100' : 'text-slate-400'
                          }`}>
                            ({keyHints[optIdx]})
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Team Hint */}
                <div className="text-center text-[10px] sm:text-xs font-semibold text-slate-500 pt-1.5">
                  ក្រុមទី ១៖ ចុចលើចម្លើយ ឬចុចឃី (A, B, C, D ឬ 1, 2, 3, 4)
                </div>
              </>
            )}
          </div>


          {/* ================= TEAM 2 PANEL (Right / Rose) ================= */}
          <div 
            id="panel-team-2"
            className="bg-rose-50/80 border-2 border-rose-200/90 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-xs flex flex-col justify-between transition-all"
          >
            {/* Header Tag, Question, & Answer Display in 1 row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-2">
              {/* Team 2 Badge */}
              <div className="bg-rose-600 text-white font-bold py-1.5 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-sm sm:text-base font-black tracking-wide whitespace-nowrap">ក្រុមទី ២</span>
                <span className="bg-white text-rose-700 font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-inner ml-1">
                  {t2Score}
                </span>
              </div>

              {/* Individual Question Card */}
              <motion.div 
                animate={
                  t2Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t2SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#ffe4e6', '#ffffff'] }
                    : {}
                }
                className={`border-2 rounded-xl py-1 px-3 text-center shadow-xs flex-1 flex flex-col items-center justify-center min-h-[44px] sm:min-h-[48px] transition-colors ${
                  t2Shake 
                    ? 'border-rose-400 bg-rose-50' 
                    : t2SuccessFlash
                    ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300'
                    : 'border-rose-100 bg-white'
                }`}
              >
                {gameMode === 'math' ? (
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-800 drop-shadow-xs flex items-center justify-center flex-wrap gap-2">
                    <span>{t2Question ? t2Question.text.replace('?', '') : '...'}</span>
                    <span className={`min-w-[40px] px-2 py-0.5 rounded border-b-4 ${
                      t2Shake ? 'border-rose-500 text-rose-600 bg-rose-100/50' 
                      : t2SuccessFlash ? 'border-emerald-500 text-emerald-600 bg-emerald-100/50' 
                      : t2Input ? 'border-rose-400 text-rose-700 bg-rose-50'
                      : 'border-slate-300 text-slate-400 bg-slate-50'
                    }`}>
                      {t2Input || '?'}
                    </span>
                  </span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2">
                      {t2QuizQuestion ? t2QuizQuestion.question : 'មិនទាន់មានសំណួរ'}
                    </span>
                    {t2Locked && (
                       <span className="text-rose-600 text-xs sm:text-sm font-black animate-pulse mt-1">
                         ❌ ចម្លើយមិនត្រឹមត្រូវ! រង់ចាំបន្តិច...
                       </span>
                    )}
                    {!t2Locked && t2Choice !== null && (
                       <span className="text-rose-700 text-sm sm:text-base font-black mt-1">
                         បានជ្រើសរើស៖ [ ${['ក', 'ខ', 'គ', 'ឃ'][t2Choice]} ]
                       </span>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Controls: Math 2-Row Keypad OR Quiz 4 Choice Buttons */}
            {gameMode === 'math' ? (
              <>
                {/* 2-Row Compact Keypad: 7 columns x 2 rows */}
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
              </>
            ) : (
              <>
                {/* 4 Rich Quiz Choice Cards: [ ក ] [ ខ ] [ គ ] [ ឃ ] with actual answer text */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {t2QuizQuestion?.options.map((optText, optIdx) => {
                    const khmerLabels = ['ក', 'ខ', 'គ', 'ឃ'];
                    const keyHints = ['Num 1 / ←', 'Num 2 / ↑', 'Num 3 / ↓', 'Num 4 / →'];
                    const isSelected = t2Choice === optIdx;
                    return (
                      <button
                        key={`t2-choice-${optIdx}`}
                        type="button"
                        disabled={t2Locked || !t2QuizQuestion}
                        onClick={() => submitQuizTeam2(optIdx)}
                        className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer select-none shadow-xs active:scale-[0.98] min-h-[54px] sm:min-h-[62px] ${
                          t2Locked
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-rose-600 border-rose-700 text-white shadow-md ring-2 ring-rose-300'
                            : 'bg-white hover:bg-rose-50/90 text-slate-800 border-rose-200 hover:border-rose-400 hover:shadow-sm'
                        }`}
                      >
                        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                          isSelected 
                            ? 'bg-white text-rose-700' 
                            : 'bg-rose-600 text-white'
                        }`}>
                          {khmerLabels[optIdx]}
                        </span>
                        <div className="flex-1 min-w-0 pr-1">
                          <div className={`text-xs sm:text-sm font-black leading-tight line-clamp-2 ${
                            isSelected ? 'text-white' : 'text-slate-800'
                          }`}>
                            {optText}
                          </div>
                          <div className={`text-[9px] font-bold mt-0.5 ${
                            isSelected ? 'text-rose-100' : 'text-slate-400'
                          }`}>
                            ({keyHints[optIdx]})
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Team Hint */}
                <div className="text-center text-[10px] sm:text-xs font-semibold text-slate-500 pt-1.5">
                  ក្រុមទី ២៖ ចុចលើចម្លើយ ឬ Numpad (1, 2, 3, 4) / ព្រួញ (← ↑ ↓ →)
                </div>
              </>
            )}
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

              <div className="py-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {/* 1. Game Mode Selection (របៀបលេង) */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                    របៀបលេង (Game Mode)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGameMode('math');
                        if (soundEnabled) playClickSound();
                      }}
                      className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        gameMode === 'math'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">🧮</span>
                      <span>លេងលេខ (គណិតវិទ្យា)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGameMode('quiz');
                        if (soundEnabled) playClickSound();
                      }}
                      className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        gameMode === 'quiz'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">❓</span>
                      <span>សំណួរពហុជម្រើស</span>
                    </button>
                  </div>
                </div>

                {/* 2. If Quiz Mode: Topic Selection */}
                {gameMode === 'quiz' && (
                  <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen size={14} className="text-amber-700" />
                        <span>ប្រធានបទសំណួរ (Quiz Topic)</span>
                      </label>
                      <div>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleExcelUpload}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (soundEnabled) playClickSound();
                            fileInputRef.current?.click();
                          }}
                          className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer flex items-center gap-1"
                          title="Excel Format: ជួរទី១: សំណួរ, ទី២-៥: ជម្រើស, ទី៦: លេខចម្លើយត្រូវ(១-៤)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          នាំចូល Excel
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {!isTopicDropdownOpen ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTopicDropdownOpen(true);
                            if (soundEnabled) playClickSound();
                          }}
                          className="p-2.5 rounded-xl text-left font-bold text-xs sm:text-sm border transition-all flex items-center justify-between cursor-pointer bg-white text-amber-950 border-amber-400 shadow-xs ring-2 ring-amber-300"
                        >
                          <div className="flex items-center justify-between flex-1 pr-2 border-r border-amber-200 mr-2">
                             <span className="truncate">{currentTopic.name}</span>
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0 ml-2">
                               {currentTopic.quizQuestions.length} សំណួរ
                             </span>
                          </div>
                          <ChevronDown size={18} className="text-amber-700 shrink-0" />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTopicDropdownOpen(false);
                              if (soundEnabled) playClickSound();
                            }}
                            className="w-full flex items-center justify-center p-1.5 mb-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
                          >
                            <ChevronDown size={16} className="rotate-180" />
                          </button>
                          {topics.map((topic) => (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setSelectedTopicId(topic.id);
                                setIsTopicDropdownOpen(false);
                                if (soundEnabled) playClickSound();
                              }}
                              className={`p-2.5 rounded-xl text-left font-bold text-xs sm:text-sm border transition-all flex items-center justify-between cursor-pointer ${
                                selectedTopicId === topic.id
                                  ? 'bg-white text-amber-950 border-amber-400 shadow-xs ring-2 ring-amber-300'
                                  : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                              }`}
                            >
                              <span className="truncate">{topic.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0 ml-2">
                                {topic.quizQuestions.length} សំណួរ
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. If Math Mode: Operations and Difficulty */}
                {gameMode === 'math' && (
                  <>
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
                  </>
                )}

                {/* 4. Target Win Pulls ahead */}
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

                {/* Match Duration Settings */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    កំណត់ពេលប្រកួត (Match Duration)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 0, label: 'គ្មានកំណត់' },
                      { val: 60, label: '១ នាទី' },
                      { val: 180, label: '៣ នាទី' },
                      { val: 300, label: '៥ នាទី' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setMatchDuration(opt.val)}
                        className={`py-2 px-2.5 rounded-xl font-extrabold text-[11px] sm:text-xs border transition-all cursor-pointer ${
                          matchDuration === opt.val 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Sound, Language & Screen System */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
                    ប្រព័ន្ធសំឡេង & ភាសា & អេក្រង់
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Sound Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setSoundEnabled(!soundEnabled);
                        playClickSound();
                      }}
                      className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        soundEnabled 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {soundEnabled ? <Volume2 size={17} className="text-emerald-600" /> : <VolumeX size={17} className="text-rose-500" />}
                      <span>{soundEnabled ? 'សំឡេង ៖ បើក' : 'សំឡេង ៖ បិទ'}</span>
                    </button>

                    {/* Language Toggle */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setLang('kh');
                          if (soundEnabled) playClickSound();
                        }}
                        className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
                          lang === 'kh' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        KH ខ្មែរ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLang('en');
                          if (soundEnabled) playClickSound();
                        }}
                        className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
                          lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        GB English
                      </button>
                    </div>
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleExpandedFullscreen();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl font-black text-xs sm:text-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Maximize size={16} className="text-indigo-600" />
                    <span>{isExpandedFullscreen ? 'បង្រួមអេក្រង់ធម្មតា' : 'ពង្រីកពេញអេក្រង់ (បិទ Nav)'}</span>
                  </button>
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


      {/* ================= 3.5 TOPIC PICKER MODAL (FOR QUIZ MODE) ================= */}
      <AnimatePresence>
        {isTopicModalOpen && (
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
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">ជ្រើសរើសប្រធានបទសំណួរ</h2>
                    <p className="text-xs text-slate-500 font-semibold">ជ្រើសពីប្រធានបទដែលបានបញ្ចូលស្រាប់ក្នុងកម្មវិធី</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTopicModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Topics List */}
              <div className="py-4 space-y-2.5 overflow-y-auto flex-1 pr-1">
                {topics.map(topic => {
                  const isCurrent = topic.id === selectedTopicId;
                  const qCount = topic.quizQuestions?.length || 0;
                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        if (soundEnabled) playClickSound();
                        setSelectedTopicId(topic.id);
                        onSelectTopic?.(topic.id);
                        setT1QuizIndex(0);
                        setT2QuizIndex(1);
                        setT1Choice(null);
                        setT2Choice(null);
                        setT1Locked(false);
                        setT2Locked(false);
                        setIsTopicModalOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs' 
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">{topic.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                              ❓ {qCount} សំណួរ MCQ
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              • {topic.difficultWords.length} ពាក្យពិបាក
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCurrent ? (
                          <span className="px-3 py-1 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-2xs">
                            កំពុងលេង
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-indigo-600 hover:text-white transition-colors">
                            ជ្រើសរើស
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm transition-colors cursor-pointer"
                >
                  បិទ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 3.5 TABLET CONTROLLER QR CODE CONNECT MODAL ================= */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-2 border-slate-200 overflow-hidden relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black shrink-0">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-800">
                      តភ្ជាប់ Tablet បញ្ជាពីចម្ងាយ (QR Code Controllers)
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      ស្កែន QR Code ដោយប្រើកាមេរ៉ា Tablet A សម្រាប់ក្រុមទី១ និង Tablet B សម្រាប់ក្រុមទី២
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* QR Codes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Team 1 / Tablet A */}
                <div className="bg-blue-50/60 rounded-2xl p-4 border-2 border-blue-200 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-black">
                      ក្រុមទី ១ (Tablet A)
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      t1Connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${t1Connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {t1Connected ? 'បានតភ្ជាប់' : 'រង់ចាំ...'}
                    </span>
                  </div>

                  {qrT1 ? (
                    <img src={qrT1} alt="QR Team 1" className="w-44 h-44 rounded-xl border-2 border-blue-300 shadow-md bg-white p-1" />
                  ) : (
                    <div className="w-44 h-44 rounded-xl bg-slate-200 animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">
                      កំពុងបង្កើត QR...
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?mode=controller&room=${roomId}&team=1`;
                      navigator.clipboard.writeText(url);
                      setCopiedT1(true);
                      setTimeout(() => setCopiedT1(false), 2000);
                    }}
                    className="w-full py-2 bg-white hover:bg-blue-100 active:scale-95 text-blue-700 font-bold text-xs rounded-xl border border-blue-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Copy size={14} />
                    <span>{copiedT1 ? 'បានចម្លង Link!' : 'ចម្លង Link ក្រុមទី ១'}</span>
                  </button>
                </div>

                {/* Team 2 / Tablet B */}
                <div className="bg-rose-50/60 rounded-2xl p-4 border-2 border-rose-200 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black">
                      ក្រុមទី ២ (Tablet B)
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      t2Connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${t2Connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {t2Connected ? 'បានតភ្ជាប់' : 'រង់ចាំ...'}
                    </span>
                  </div>

                  {qrT2 ? (
                    <img src={qrT2} alt="QR Team 2" className="w-44 h-44 rounded-xl border-2 border-rose-300 shadow-md bg-white p-1" />
                  ) : (
                    <div className="w-44 h-44 rounded-xl bg-slate-200 animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">
                      កំពុងបង្កើត QR...
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?mode=controller&room=${roomId}&team=2`;
                      navigator.clipboard.writeText(url);
                      setCopiedT2(true);
                      setTimeout(() => setCopiedT2(false), 2000);
                    }}
                    className="w-full py-2 bg-white hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Copy size={14} />
                    <span>{copiedT2 ? 'បានចម្លង Link!' : 'ចម្លង Link ក្រុមទី ២'}</span>
                  </button>
                </div>

              </div>

              {/* Footer Note */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500 font-bold">
                💡 គន្លឹះ ៖ ពេល Tablet A និង B ស្កែន QR ខាងលើ សិស្សអាចចុចចម្លើយនៅលើ Tablet រៀងៗខ្លួន ហើយចម្លើយនឹងត្រូវទាញព្រ័ត្រនៅលើអេក្រង់ធំភ្លាមៗ!
              </div>
            </motion.div>
          </div>
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
