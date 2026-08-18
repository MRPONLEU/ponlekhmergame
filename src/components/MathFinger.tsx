import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  RefreshCw, 
  Play, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Plus, 
  Minus, 
  Sparkles,
  Trophy,
  Zap,
  ChevronLeft,
  Info,
  Maximize,
  Minimize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSuccessSound, playFailSound, playClickSound, playWinSound, speakText } from '../utils/audio';

// Interface for Equations
interface EquationStep {
  text: string;
  val: number;
}

interface Question {
  equation: string;
  correctAnswer: number;
  options: number[];
  steps: EquationStep[];
}

// Finger representation logic helper
// Returns finger states for a digit 0-9
// 5 fingers: pinky, ring, middle, index, thumb
function getFingerStates(digit: number) {
  const hasThumb = digit >= 5;
  const ones = digit % 5;
  return {
    thumb: hasThumb,
    index: ones >= 1,
    middle: ones >= 2,
    ring: ones >= 3,
    pinky: ones >= 4
  };
}

// Sub-component: Interactive SVG Hand
interface FingerHandProps {
  type: 'left' | 'right'; // left = Tens, right = Ones
  value: number; // 0-9
  interactive?: boolean;
}

export function FingerHand({ type, value, interactive = false }: FingerHandProps) {
  const digit = Math.min(Math.max(0, value), 9);
  const { thumb, index, middle, ring, pinky } = getFingerStates(digit);

  // Layout positions for fingers
  // For Right Hand (Left-to-Right layout: Thumb, Index, Middle, Ring, Pinky)
  // For Left Hand (Left-to-Right layout: Pinky, Ring, Middle, Index, Thumb)
  const isRight = type === 'right';
  const multiplier = isRight ? 1 : 10; // 1 for ones, 10 for tens

  // Coordinates mapping
  const fingers = [
    {
      name: 'pinky',
      x: isRight ? 134 : 26,
      active: pinky,
      val: 1 * multiplier,
      activeY: 35,
      inactiveY: 75,
      height: pinky ? 67 : 27,
      color: 'bg-emerald-500',
      stroke: '#059669'
    },
    {
      name: 'ring',
      x: isRight ? 107 : 53,
      active: ring,
      val: 1 * multiplier,
      activeY: 20,
      inactiveY: 75,
      height: ring ? 82 : 27,
      color: 'bg-sky-500',
      stroke: '#0284c7'
    },
    {
      name: 'middle',
      x: isRight ? 80 : 80,
      active: middle,
      val: 1 * multiplier,
      activeY: 12,
      inactiveY: 75,
      height: middle ? 90 : 27,
      color: 'bg-indigo-500',
      stroke: '#4f46e5'
    },
    {
      name: 'index',
      x: isRight ? 53 : 107,
      active: index,
      val: 1 * multiplier,
      activeY: 20,
      inactiveY: 75,
      height: index ? 82 : 27,
      color: 'bg-amber-500',
      stroke: '#d97706'
    },
    {
      name: 'thumb',
      x: isRight ? 26 : 134,
      active: thumb,
      val: 5 * multiplier,
      activeY: 55,
      inactiveY: 82,
      height: thumb ? 47 : 20,
      color: 'bg-rose-500',
      stroke: '#e11d48'
    }
  ];

  return (
    <div className="flex flex-col items-center bg-stone-bg/40 p-4 rounded-3xl border border-border-beige/40">
      <div className="text-xs font-semibold text-soft-gray mb-1 uppercase tracking-wider select-none">
        {type === 'left' ? 'ដៃឆ្វេង (ខ្ទង់ដប់)' : 'ដៃស្តាំ (ខ្ទង់រាយ)'}
      </div>
      <div className="text-2xl font-bold text-charcoal mb-3 select-none">
        {type === 'left' ? value * 10 : value}
      </div>

      <div className="relative w-[160px] h-[180px]">
        <svg viewBox="0 0 160 180" className="w-full h-full">
          {/* Background shadows and design lines */}
          <g>
            {/* Palm of the hand */}
            <path
              d="M 28,102 Q 22,148 45,158 Q 80,165 115,158 Q 138,148 132,102 Z"
              fill="#F7D6C8"
              stroke="#DB9F8B"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Palm details/lines */}
            <path
              d="M 50,115 Q 65,135 90,132 M 110,118 Q 95,140 70,140"
              fill="none"
              stroke="#C58572"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Wrist */}
            <rect
              x="50"
              y="152"
              width="60"
              height="24"
              rx="6"
              fill="#EAC5B7"
              stroke="#DB9F8B"
              strokeWidth="4"
            />
          </g>

          {/* Render fingers */}
          {fingers.map((f) => {
            const width = f.name === 'thumb' ? 24 : 20;
            const yPos = f.active ? f.activeY : f.inactiveY;
            const rx = width / 2;

            return (
              <g key={f.name} className="transition-all duration-300">
                {/* Finger body */}
                <rect
                  x={f.x - rx}
                  y={yPos}
                  width={width}
                  height={f.height + 10} // extend slightly to blend into the palm
                  rx={rx}
                  fill={f.active ? '#F8C3B1' : '#E8BBAA'}
                  stroke={f.active ? '#C06C54' : '#C58572'}
                  strokeWidth="3.5"
                  className="transition-all duration-300"
                />

                {/* Active Highlight Cap & Number */}
                {f.active && (
                  <g className="animate-fade-in">
                    {/* Highlighted fingertip overlay */}
                    <rect
                      x={f.x - rx + 1.5}
                      y={f.activeY + 1.5}
                      width={width - 3}
                      height="24"
                      rx={rx - 1.5}
                      fill={f.name === 'thumb' ? '#F43F5E' : '#3B82F6'}
                    />
                    {/* Finger Value label at top */}
                    <text
                      x={f.x}
                      y={f.activeY + 15}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      className="font-sans select-none pointer-events-none"
                    >
                      {f.val}
                    </text>
                  </g>
                )}

                {/* Inactive text helper on hover or small visual dot */}
                {!f.active && (
                  <circle
                    cx={f.x}
                    cy={f.inactiveY + 10}
                    r="3"
                    fill="#C58572"
                    opacity="0.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tiny guide beneath hand */}
      <div className="flex gap-1 mt-2">
        {fingers.map((f) => (
          <span
            key={f.name}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              f.active ? 'bg-clay scale-110' : 'bg-stone-300'
            }`}
            title={`${f.name}: ${f.val}`}
          />
        ))}
      </div>
    </div>
  );
}


export default function MathFinger({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'exam'>('learn');
  const [difficulty, setDifficulty] = useState<'level1' | 'level2' | 'level3' | 'speed'>('level1');
  
  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Tutorial State
  const [tutorialValue, setTutorialValue] = useState<number>(12);

  // Practice & Exam States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(15);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(-1); // for stepping through fingers
  
  // Flashing sequence state for exam mode
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(false);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto speak tutorial numbers
  useEffect(() => {
    if (activeTab === 'learn') {
      const timeout = setTimeout(() => {
        speakText(tutorialValue.toString(), 'km-KH');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [tutorialValue, activeTab]);

  // Handle speed and exam timers (only active when NOT showing sequence)
  useEffect(() => {
    if (isPlaying && activeTab === 'exam' && !isShowingSequence && !isAnswered) {
      if (timer === 0) {
        // Time's up! Handle incorrect answer automatic trigger
        handleAnswerSubmit(-999); // trigger wrong answer
      } else {
        timerRef.current = setTimeout(() => {
          setTimer(prev => prev - 1);
        }, 1000);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer, isPlaying, activeTab, isShowingSequence, isAnswered]);

  // Handle sequential step player/flasher for Exam mode
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (isPlaying && activeTab === 'exam' && isShowingSequence && currentQuestion) {
      const displayDuration = difficulty === 'speed' ? 1000 : 1800; // time in ms per number
      
      // Speak the current flashing step
      const stepText = currentQuestion.steps[currentSequenceIndex].text;
      speakText(stepText.replace(/\s+/g, ''), 'km-KH');

      timeoutId = setTimeout(() => {
        if (currentSequenceIndex < currentQuestion.steps.length - 1) {
          setCurrentSequenceIndex(prev => prev + 1);
        } else {
          // Finished flashing all numbers! Show the input & start the answer countdown timer
          setIsShowingSequence(false);
          setTimer(difficulty === 'speed' ? 8 : 15);
        }
      }, displayDuration);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPlaying, activeTab, isShowingSequence, currentSequenceIndex, currentQuestion, difficulty]);

  // Math Question Generator
  const generateQuestion = (diff: typeof difficulty): Question => {
    let steps: EquationStep[] = [];
    let currentVal = 0;
    let limit = diff === 'level1' ? 5 : diff === 'level2' ? 9 : 99;
    
    // Determine step count (2 or 3 operations)
    const operationCount = diff === 'level3' ? 3 : 2;

    // First number
    const startVal = diff === 'level1' 
      ? Math.floor(Math.random() * 4) + 1 // 1 to 4
      : diff === 'level2'
        ? Math.floor(Math.random() * 8) + 1 // 1 to 8
        : Math.floor(Math.random() * 40) + 10; // 10 to 50
    
    currentVal = startVal;
    steps.push({ text: `${startVal}`, val: currentVal });

    for (let i = 0; i < operationCount; i++) {
      // decide addition or subtraction
      // can we subtract? If currentVal is small, must add. If large, can subtract.
      let isPlus = Math.random() > 0.4;
      if (currentVal <= (diff === 'level3' ? 15 : 2)) isPlus = true;
      if (currentVal >= limit - 2) isPlus = false;

      let stepVal = 0;
      if (diff === 'level1') {
        stepVal = Math.floor(Math.random() * 2) + 1; // 1 or 2
        if (isPlus) {
          if (currentVal + stepVal > 5) stepVal = 5 - currentVal;
          if (stepVal > 0) {
            currentVal += stepVal;
            steps.push({ text: `+ ${stepVal}`, val: currentVal });
          }
        } else {
          if (currentVal - stepVal < 0) stepVal = currentVal;
          if (stepVal > 0) {
            currentVal -= stepVal;
            steps.push({ text: `- ${stepVal}`, val: currentVal });
          }
        }
      } else if (diff === 'level2') {
        stepVal = Math.floor(Math.random() * 4) + 1; // 1 to 4
        if (isPlus) {
          if (currentVal + stepVal > 9) stepVal = 9 - currentVal;
          if (stepVal > 0) {
            currentVal += stepVal;
            steps.push({ text: `+ ${stepVal}`, val: currentVal });
          }
        } else {
          if (currentVal - stepVal < 0) stepVal = currentVal;
          if (stepVal > 0) {
            currentVal -= stepVal;
            steps.push({ text: `- ${stepVal}`, val: currentVal });
          }
        }
      } else {
        // level 3 (two digits, up to 99)
        stepVal = Math.floor(Math.random() * 30) + 5; // 5 to 35
        // ensure no complex carry over if we want simple math, but basic is fine. Let's make it neat.
        if (isPlus) {
          if (currentVal + stepVal > 99) stepVal = 99 - currentVal;
          currentVal += stepVal;
          steps.push({ text: `+ ${stepVal}`, val: currentVal });
        } else {
          if (currentVal - stepVal < 0) stepVal = currentVal;
          currentVal -= stepVal;
          steps.push({ text: `- ${stepVal}`, val: currentVal });
        }
      }
    }

    // Format equation string
    const equation = steps.map((s, idx) => idx === 0 ? s.text : s.text).join(' ');

    // Generate 4 logical options
    const correctAnswer = currentVal;
    const optionsSet = new Set<number>([correctAnswer]);
    
    while (optionsSet.size < 4) {
      let offset = Math.floor(Math.random() * 7) - 3; // -3 to +3
      if (diff === 'level1') {
        let fake = correctAnswer + offset;
        if (fake >= 0 && fake <= 5) optionsSet.add(fake);
      } else if (diff === 'level2') {
        let fake = correctAnswer + offset;
        if (fake >= 0 && fake <= 9) optionsSet.add(fake);
      } else {
        let fake = correctAnswer + (offset * (Math.random() > 0.5 ? 10 : 1));
        if (fake >= 0 && fake <= 99) optionsSet.add(fake);
      }
    }

    const options = Array.from(optionsSet).sort((a, b) => a - b);

    return {
      equation,
      correctAnswer,
      options,
      steps
    };
  };

  const startPractice = () => {
    playClickSound();
    setIsPlaying(true);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setStepIndex(-1);
    const q = generateQuestion(difficulty);
    setCurrentQuestion(q);
  };

  const startExam = () => {
    playClickSound();

    // Automatically request fullscreen for exam mode
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    }

    setIsPlaying(true);
    setScore(0);
    setCurrentQuestionIndex(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setShowCertificate(false);
    setStepIndex(-1);

    // Generate 10 exam questions
    const qList: Question[] = [];
    for (let i = 0; i < 10; i++) {
      qList.push(generateQuestion(difficulty));
    }
    setExamQuestions(qList);
    setCurrentQuestion(qList[0]);
    
    // Trigger sequence flashing
    setIsShowingSequence(true);
    setCurrentSequenceIndex(0);
  };

  const handleKeypadPress = (key: string) => {
    playClickSound();
    if (key === 'C') {
      setTypedAnswer('');
    } else if (key === '⌫') {
      setTypedAnswer(prev => prev.slice(0, -1));
    } else if (key === '-') {
      setTypedAnswer(prev => {
        if (prev.startsWith('-')) return prev.slice(1);
        return '-' + prev;
      });
    } else {
      setTypedAnswer(prev => {
        if (prev.replace('-', '').length >= 3) return prev; // limit to 3 digits
        if (prev === '0') return key;
        return prev + key;
      });
    }
  };

  const handleAnswerSubmit = (ans: number) => {
    if (isAnswered) return;
    setSelectedAnswer(ans);
    setIsAnswered(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    const isCorrect = ans === currentQuestion?.correctAnswer;
    if (isCorrect) {
      playSuccessSound();
      setScore(prev => prev + 1);
    } else {
      playFailSound();
    }

    // Automatically set step visualizer to final answer step
    if (currentQuestion) {
      setStepIndex(currentQuestion.steps.length - 1);
    }
  };

  const handleNextQuestion = () => {
    playClickSound();
    setIsAnswered(false);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setStepIndex(-1);

    if (activeTab === 'practice') {
      const q = generateQuestion(difficulty);
      setCurrentQuestion(q);
    } else {
      // Exam navigation
      if (currentQuestionIndex < 9) {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setCurrentQuestion(examQuestions[nextIdx]);
        
        // Trigger sequence flashing
        setIsShowingSequence(true);
        setCurrentSequenceIndex(0);
      } else {
        // Finished all 10 questions
        setShowCertificate(true);
        playWinSound();
      }
    }
  };

  const resetGame = () => {
    playClickSound();

    // Automatically exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }

    setIsPlaying(false);
    setCurrentQuestion(null);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setShowCertificate(false);
    setStepIndex(-1);
    setIsShowingSequence(false);
    setCurrentSequenceIndex(0);
  };

  // Convert number to Khmer digit characters
  const toKhmerNumber = (num: number): string => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return num.toString().split('').map(digit => {
      const parsed = parseInt(digit, 10);
      return isNaN(parsed) ? digit : khmerDigits[parsed];
    }).join('');
  };

  // Split double-digit number into Tens and Ones
  const getTensOnes = (val: number) => {
    const tens = Math.floor(val / 10);
    const ones = val % 10;
    return { tens, ones };
  };

  const { tens: tutTens, ones: tutOnes } = getTensOnes(tutorialValue);
  const currentStepValue = stepIndex >= 0 && currentQuestion 
    ? currentQuestion.steps[stepIndex].val 
    : (currentQuestion?.correctAnswer ?? 0);
  const { tens: stepTens, ones: stepOnes } = getTensOnes(currentStepValue);
  const isVirtualFullscreen = activeTab === 'exam' && isPlaying;

  return (
    <div className={isVirtualFullscreen ? "fixed inset-0 w-screen h-screen bg-stone-bg z-[9999] overflow-y-auto p-4 sm:p-8 flex flex-col" : "max-w-4xl mx-auto py-8 px-4 sm:px-6"}>
      {/* Header Bar */}
      <div className={`flex items-center justify-between ${isVirtualFullscreen ? 'max-w-5xl w-full mx-auto mb-4 border-b border-border-beige/50 pb-3' : 'mb-8'}`}>
        <button 
          onClick={isPlaying ? resetGame : onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-bg/60 border border-border-beige text-charcoal font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>{isPlaying ? "ចាកចេញ" : "ត្រឡប់ក្រោយ"}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-clay/10 border border-clay/20 text-clay text-sm font-bold">
            <Zap size={14} className="animate-bounce" />
            <span>គណិតវិទ្យា គិតលេខរហ័សដោយប្រើដៃ</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {!isPlaying ? (
        <div className="bg-white border border-border-beige rounded-[32px] p-6 sm:p-10 soft-shadow">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal tracking-tight mb-3 font-sans">
              គិតលេខរហ័សដោយប្រើដៃ (Math Finger)
            </h1>
            <p className="text-sm sm:text-base text-soft-gray max-w-xl mx-auto leading-relaxed">
              អនុវត្តលំហាត់គណនាគិតលេខរហ័សបែបបុរាណដោយប្រើម្រាមដៃ (Chisanbop)។ ជំនួយដល់ការចងចាំ និងបង្កើនល្បឿនគិតលេខរបស់កុមារ!
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex p-1.5 bg-stone-bg border border-border-beige/50 rounded-2xl max-w-md mx-auto mb-10">
            <button
              onClick={() => { playClickSound(); setActiveTab('learn'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm cursor-pointer ${
                activeTab === 'learn' 
                  ? 'bg-white text-charcoal shadow-sm' 
                  : 'text-soft-gray hover:text-charcoal'
              }`}
            >
              <BookOpen size={16} />
              <span>ស្វែងយល់ / រៀន</span>
            </button>
            <button
              onClick={() => { playClickSound(); setActiveTab('practice'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm cursor-pointer ${
                activeTab === 'practice' 
                  ? 'bg-white text-charcoal shadow-sm' 
                  : 'text-soft-gray hover:text-charcoal'
              }`}
            >
              <HelpCircle size={16} />
              <span>អនុវត្តលំហាត់</span>
            </button>
            <button
              onClick={() => { playClickSound(); setActiveTab('exam'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm cursor-pointer ${
                activeTab === 'exam' 
                  ? 'bg-white text-charcoal shadow-sm' 
                  : 'text-soft-gray hover:text-charcoal'
              }`}
            >
              <Trophy size={16} />
              <span>ប្រលងវាស់សមត្ថភាព</span>
            </button>
          </div>

          {/* Difficulty Selection (For Practice & Exam) */}
          {activeTab !== 'learn' && (
            <div className="mb-10 max-w-2xl mx-auto">
              <h3 className="text-center font-bold text-charcoal mb-4">សូមជ្រើសរើសកម្រិត៖</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => { playClickSound(); setDifficulty('level1'); }}
                  className={`p-4 rounded-2xl border font-bold text-center flex flex-col justify-center items-center gap-1 transition-all cursor-pointer ${
                    difficulty === 'level1'
                      ? 'bg-sage/10 border-sage text-sage'
                      : 'bg-white border-border-beige hover:border-soft-gray text-charcoal'
                  }`}
                >
                  <span className="text-xs text-soft-gray">កម្រិត ១</span>
                  <span className="text-sm">បូកដក ០-៥</span>
                  <span className="text-[10px] opacity-75 font-normal">ដៃស្តាំ (គ្មានមេដៃ)</span>
                </button>

                <button
                  onClick={() => { playClickSound(); setDifficulty('level2'); }}
                  className={`p-4 rounded-2xl border font-bold text-center flex flex-col justify-center items-center gap-1 transition-all cursor-pointer ${
                    difficulty === 'level2'
                      ? 'bg-clay/10 border-clay text-clay'
                      : 'bg-white border-border-beige hover:border-soft-gray text-charcoal'
                  }`}
                >
                  <span className="text-xs text-soft-gray">កម្រិត ២</span>
                  <span className="text-sm">បូកដក ០-៩</span>
                  <span className="text-[10px] opacity-75 font-normal">ដៃស្តាំ (មានមេដៃ)</span>
                </button>

                <button
                  onClick={() => { playClickSound(); setDifficulty('level3'); }}
                  className={`p-4 rounded-2xl border font-bold text-center flex flex-col justify-center items-center gap-1 transition-all cursor-pointer ${
                    difficulty === 'level3'
                      ? 'bg-sand/20 border-sand text-charcoal'
                      : 'bg-white border-border-beige hover:border-soft-gray text-charcoal'
                  }`}
                >
                  <span className="text-xs text-soft-gray">កម្រិត ៣</span>
                  <span className="text-sm">លេខ ២ខ្ទង់ ០-៩៩</span>
                  <span className="text-[10px] opacity-75 font-normal">ប្រើដៃទាំងសងខាង</span>
                </button>

                <button
                  onClick={() => { playClickSound(); setDifficulty('speed'); }}
                  className={`p-4 rounded-2xl border font-bold text-center flex flex-col justify-center items-center gap-1 transition-all cursor-pointer ${
                    difficulty === 'speed'
                      ? 'bg-rose-50 border-rose-400 text-rose-600'
                      : 'bg-white border-border-beige hover:border-soft-gray text-charcoal'
                  }`}
                >
                  <span className="text-xs text-soft-gray">កម្រិត ៤</span>
                  <span className="text-sm flex items-center gap-1">គិតរហ័ស <Zap size={12} /></span>
                  <span className="text-[10px] opacity-75 font-normal">៥វិនាទី/សំណួរ</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Explore & Learn Mode */}
          {activeTab === 'learn' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-stone-bg/50 border border-border-beige/40 rounded-3xl p-6 mb-8 text-center">
                <span className="text-xs uppercase tracking-widest font-extrabold text-clay block mb-2">របៀបលេង</span>
                <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
                  <strong>ដៃស្តាំ</strong> តំណាងឱ្យខ្ទង់រាយ (១-៩) ដែលមេដៃមានតម្លៃស្មើនឹង <strong>៥</strong> និងម្រាមផ្សេងទៀតមានតម្លៃស្មើនឹង <strong>១</strong>។<br />
                  <strong>ដៃឆ្វេង</strong> តំណាងឱ្យខ្ទង់ដប់ (១០-៩០) ដែលមេដៃមានតម្លៃស្មើនឹង <strong>៥០</strong> និងម្រាមផ្សេងទៀតមានតម្លៃស្មើនឹង <strong>១០</strong>។
                </p>
              </div>

              {/* Interactive sliders & Hands display */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <FingerHand type="left" value={tutTens} />
                <FingerHand type="right" value={tutOnes} />
              </div>

              {/* Slider Controls */}
              <div className="bg-stone-bg/30 border border-border-beige/50 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-charcoal">ជ្រើសរើសលេខ៖</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { playClickSound(); setTutorialValue(prev => Math.max(0, prev - 1)); }}
                      className="p-1.5 bg-white border border-border-beige hover:bg-stone-100 rounded-lg text-charcoal cursor-pointer"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-3xl font-extrabold text-clay w-16 text-center font-sans">
                      {tutorialValue}
                    </span>
                    <button
                      onClick={() => { playClickSound(); setTutorialValue(prev => Math.min(99, prev + 1)); }}
                      className="p-1.5 bg-white border border-border-beige hover:bg-stone-100 rounded-lg text-charcoal cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="99"
                  value={tutorialValue}
                  onChange={(e) => setTutorialValue(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-clay mb-6"
                />

                {/* Preset Fast Quick Selection Buttons */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[2, 4, 5, 7, 9, 10, 24, 35, 50, 78, 99].map(num => (
                    <button
                      key={num}
                      onClick={() => { playClickSound(); setTutorialValue(num); }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        tutorialValue === num
                          ? 'bg-clay text-white border-clay shadow-sm'
                          : 'bg-white border-border-beige hover:border-soft-gray text-charcoal'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Launch Buttons for Practice & Exam */}
          {activeTab !== 'learn' && (
            <div className="text-center mt-6">
              <button
                onClick={activeTab === 'practice' ? startPractice : startExam}
                className="inline-flex items-center gap-3 px-8 py-4 bg-clay hover:bg-clay-dark text-white font-extrabold text-base rounded-2xl shadow-md transition-all scale-102 hover:scale-105 cursor-pointer"
              >
                <Play size={20} fill="white" />
                <span>ចាប់ផ្តើមធ្វើលំហាត់ឥឡូវនេះ</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        // ACTIVE PLAYING PANEL
        <div className={`bg-white border border-border-beige rounded-[32px] p-6 sm:p-10 soft-shadow relative ${
          isVirtualFullscreen ? 'w-full max-w-5xl mx-auto my-auto flex flex-col justify-center' : ''
        }`}>
          <AnimatePresence mode="wait">
            {showCertificate ? (
              // RESULT/CERTIFICATE VIEW FOR EXAM
              <motion.div 
                key="certificate"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center mx-auto ${isVirtualFullscreen ? 'py-14 max-w-2xl' : 'py-10 max-w-md'}`}
              >
                <div className={`inline-flex bg-amber-50 rounded-full border border-amber-200 text-amber-500 mb-6 ${isVirtualFullscreen ? 'p-10' : 'p-6'}`}>
                  <Trophy size={isVirtualFullscreen ? 96 : 64} className="animate-pulse" />
                </div>
                <h2 className={`font-extrabold text-charcoal mb-2 font-sans ${isVirtualFullscreen ? 'text-4xl mb-4' : 'text-2xl sm:text-3xl'}`}>
                  លទ្ធផលប្រលងគិតលេខរហ័ស
                </h2>
                <p className={`text-soft-gray mb-6 ${isVirtualFullscreen ? 'text-base' : 'text-sm'}`}>
                  អ្នកបានបញ្ចប់ការប្រលងទាំង ១០សំណួរ រួចរាល់ហើយ!
                </p>

                {/* Stars Reward Grid */}
                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3].map((star) => {
                    // 3 stars for 9-10 score, 2 stars for 6-8, 1 star for rest
                    const active = star === 1 
                      ? score >= 1 
                      : star === 2 
                      ? score >= 6 
                      : score >= 9;
                    return (
                      <motion.span
                        key={star}
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: star * 0.15 }}
                        className={`text-4xl ${active ? 'text-amber-400' : 'text-stone-200'} ${isVirtualFullscreen ? 'text-6xl mx-1' : 'text-4xl'}`}
                      >
                        ★
                      </motion.span>
                    );
                  })}
                </div>

                {/* Score Summary Box */}
                <div className={`bg-stone-bg border border-border-beige rounded-2xl mb-8 ${isVirtualFullscreen ? 'p-10' : 'p-6'}`}>
                  <div className={`text-soft-gray uppercase tracking-wider font-bold mb-1 ${isVirtualFullscreen ? 'text-sm' : 'text-xs'}`}>ពិន្ទុរបស់អ្នក</div>
                  <div className={`font-extrabold text-clay font-sans ${isVirtualFullscreen ? 'text-7xl' : 'text-5xl'}`}>
                    {toKhmerNumber(score)} <span className={`text-charcoal font-semibold ${isVirtualFullscreen ? 'text-3xl' : 'text-xl'}`}>/ ១០</span>
                  </div>
                  <div className={`text-emerald-600 font-semibold ${isVirtualFullscreen ? 'text-lg mt-4' : 'text-xs mt-2'}`}>
                    {score >= 9 ? 'ឆ្នើមបំផុត! យល់ច្បាស់ពីមេរៀន!' : score >= 6 ? 'ល្អបង្គួរ! ព្យាយាមបន្ថែមទៀត!' : 'ព្យាយាមឡើងវិញ! កុមារពូកែ!'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`flex flex-col gap-3 max-w-md mx-auto ${isVirtualFullscreen ? 'w-80' : 'w-full'}`}>
                  <button
                    onClick={startExam}
                    className={`w-full flex items-center justify-center gap-2 bg-clay hover:bg-clay-dark text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer ${isVirtualFullscreen ? 'py-4.5 text-lg' : 'py-3.5 text-base'}`}
                  >
                    <RefreshCw size={16} />
                    <span>ប្រឡងឡើងវិញ</span>
                  </button>
                  <button
                    onClick={resetGame}
                    className={`w-full bg-stone-bg hover:bg-stone-200 border border-border-beige text-charcoal font-bold rounded-xl transition-all cursor-pointer ${isVirtualFullscreen ? 'py-4 text-base' : 'py-3.5 text-sm'}`}
                  >
                    <span>ត្រឡប់ទៅមេនូដើម</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              // ACTIVE QUESTION PANEL (Practice & Exam)
              <motion.div 
                key="active-question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {activeTab === 'exam' && isShowingSequence ? (
                  // SEQUENCE FLASHING VIEW FOR EXAM MODE
                  <div className={`bg-white border border-border-beige rounded-[32px] text-center flex flex-col justify-center items-center relative overflow-hidden soft-shadow ${
                    isVirtualFullscreen ? 'p-12 sm:p-20 min-h-[450px]' : 'p-8 sm:p-12 min-h-[350px]'
                  }`}>
                    {/* Decorative Top Accent line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-clay via-amber-400 to-clay" />
                    
                    <div className={`font-bold text-soft-gray uppercase tracking-widest ${isVirtualFullscreen ? 'text-sm mb-10' : 'text-xs mb-6'}`}>
                      ត្រៀមខ្លួន... បូកដកលេខខាងក្រោម៖
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSequenceIndex}
                        initial={{ opacity: 0, scale: 0.5, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.5, y: -15 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={`font-extrabold text-clay select-none tracking-tight font-sans drop-shadow-sm my-6 ${
                          isVirtualFullscreen 
                            ? 'text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem]' 
                            : 'text-7xl sm:text-8xl md:text-9xl'
                        }`}
                      >
                        {currentQuestion?.steps[currentSequenceIndex]?.text.replace(/\s+/g, '')}
                      </motion.div>
                    </AnimatePresence>

                    <div className={`flex flex-col items-center gap-2 ${isVirtualFullscreen ? 'mt-12' : 'mt-8'}`}>
                      <div className={`flex gap-1.5 items-center bg-stone-bg border border-border-beige/50 rounded-2xl font-bold text-soft-gray ${isVirtualFullscreen ? 'px-6 py-3 text-sm' : 'px-4 py-2 text-xs'}`}>
                        <Sparkles size={isVirtualFullscreen ? 18 : 14} className="text-clay animate-spin" />
                        <span>ខ្ទង់ទី {toKhmerNumber(currentSequenceIndex + 1)} នៃ {toKhmerNumber(currentQuestion?.steps.length || 0)}</span>
                      </div>
                      <p className={`text-soft-gray animate-pulse ${isVirtualFullscreen ? 'text-xs' : 'text-[11px]'}`}>
                        គណនាដោយប្រើម្រាមដៃរបស់អ្នក!
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Status Bar */}
                    <div className={`flex justify-between items-center border-b border-stone-100 ${isVirtualFullscreen ? 'mb-10 pb-6' : 'mb-8 pb-4'}`}>
                      <div>
                        {activeTab === 'exam' ? (
                          <span className={`font-bold bg-sage/10 text-sage border border-sage/20 rounded-full uppercase ${isVirtualFullscreen ? 'text-sm px-4 py-2' : 'text-xs px-3 py-1'}`}>
                            សំណួរទី {toKhmerNumber(currentQuestionIndex + 1)} / ១០
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-clay/10 text-clay border border-clay/20 px-3 py-1 rounded-full uppercase">
                            របៀបអនុវត្តលំហាត់
                          </span>
                        )}
                      </div>

                      {activeTab === 'exam' && (
                        <div className="flex items-center gap-3">
                          <span className={`text-soft-gray font-bold ${isVirtualFullscreen ? 'text-sm' : 'text-xs'}`}>ពេលវេលា៖</span>
                          <div className={`bg-stone-200 rounded-full overflow-hidden ${isVirtualFullscreen ? 'w-36 h-3.5' : 'w-24 h-2.5'}`}>
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                timer <= 3 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(timer / (difficulty === 'speed' ? 8 : 15)) * 100}%` }}
                            />
                          </div>
                          <span className={`font-bold text-charcoal text-right font-sans ${isVirtualFullscreen ? 'text-lg w-8' : 'text-sm w-6'}`}>
                            {timer}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Equation Text Display (for both modes) */}
                    {!isAnswered && (
                      activeTab === 'exam' ? (
                        <div className={`text-center ${isVirtualFullscreen ? 'mb-10' : 'mb-8'}`}>
                          <div className={`font-bold text-soft-gray uppercase tracking-widest ${isVirtualFullscreen ? 'text-sm mb-4' : 'text-xs mb-2'}`}>
                            ដោះស្រាយលំហាត់ខាងក្រោម៖
                          </div>
                          <h2 className={`font-extrabold text-charcoal tracking-normal font-sans ${isVirtualFullscreen ? 'text-6xl sm:text-7xl mb-6' : 'text-4xl sm:text-5xl mb-4'}`}>
                            {currentQuestion?.equation} = ?
                          </h2>
                        </div>
                      ) : (
                        <div className="text-center mb-6">
                          <div className="font-bold text-soft-gray uppercase tracking-widest text-xs mb-2">
                            ដោះស្រាយលំហាត់ខាងក្រោម៖
                          </div>
                          <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal mb-4 tracking-normal font-sans">
                            {currentQuestion?.equation} = ?
                          </h2>
                        </div>
                      )
                    )}

                    {/* Visual STEP-BY-STEP finger guide for Practice Mode */}
                    {currentQuestion && activeTab === 'practice' && (
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-soft-gray flex items-center gap-1">
                            <Info size={14} className="text-clay" />
                            <span>ជំនួយការបង្ហាញម្រាមដៃ៖</span>
                          </span>

                          {/* Step-by-step buttons inside Practice Mode */}
                          <div className="flex gap-1.5">
                            <button
                              disabled={stepIndex <= 0}
                              onClick={() => { playClickSound(); setStepIndex(prev => prev - 1); }}
                              className="p-1 bg-white border border-border-beige disabled:opacity-40 rounded-lg cursor-pointer"
                              title="ជំហានមុន"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-bold text-charcoal bg-stone-bg border border-border-beige/50 px-2.5 py-1 rounded-lg">
                              ជំហានទី {toKhmerNumber(stepIndex + 1)} / {toKhmerNumber(currentQuestion.steps.length)}
                            </span>
                            <button
                              disabled={stepIndex >= currentQuestion.steps.length - 1}
                              onClick={() => { playClickSound(); setStepIndex(prev => prev + 1); }}
                              className="p-1 bg-white border border-border-beige disabled:opacity-40 rounded-lg cursor-pointer"
                              title="ជំហានបន្ទាប់"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Hands Display */}
                        <div className="grid grid-cols-2 gap-6 mb-4 p-4 bg-stone-bg/20 border border-border-beige/30 rounded-3xl">
                          <FingerHand type="left" value={stepTens} />
                          <FingerHand type="right" value={stepOnes} />
                        </div>

                        {/* Step text info */}
                        <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-2xl flex items-center gap-2">
                          <span className="text-xs font-extrabold text-amber-600 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-lg font-sans">
                            {currentQuestion.steps[stepIndex].text}
                          </span>
                          <span className="text-xs text-charcoal font-semibold">
                            ស្មើនឹង <strong className="text-sm font-extrabold text-clay font-sans">{currentQuestion.steps[stepIndex].val}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Options Input Section */}
                    <div className={`${activeTab === 'exam' && !isAnswered ? 'max-w-2xl lg:max-w-4xl' : 'max-w-md'} mx-auto w-full`}>
                      {activeTab === 'exam' ? (
                        // EXAM MODE ANSWER INPUT WITH VERIFICATION
                        <div className="flex flex-col gap-4 mb-6">
                          {!isAnswered ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-2">
                              {/* Left column: Input and submit */}
                              <div className="flex flex-col gap-4 justify-center">
                                <label className={`font-bold text-soft-gray text-center block ${isVirtualFullscreen ? 'text-lg mb-2' : 'text-sm'}`}>
                                  សូមវាយបញ្ចូលចម្លើយរបស់អ្នក៖
                                </label>
                                <input
                                  type="text"
                                  value={typedAnswer}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^-?\d*$/.test(val)) {
                                      setTypedAnswer(val);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && typedAnswer !== '' && typedAnswer !== '-') {
                                      handleAnswerSubmit(parseInt(typedAnswer, 10));
                                    }
                                  }}
                                  inputMode="none"
                                  placeholder="ចម្លើយ..."
                                  className={`w-full px-5 text-center font-extrabold border-2 border-border-beige focus:border-clay focus:outline-none rounded-2xl tracking-wider font-sans bg-stone-bg/30 text-charcoal animate-pulse ${
                                    isVirtualFullscreen ? 'text-5xl sm:text-6xl h-24 sm:h-28' : 'text-4xl h-18'
                                  }`}
                                  autoFocus
                                />
                                <button
                                  disabled={typedAnswer === '' || typedAnswer === '-'}
                                  onClick={() => handleAnswerSubmit(parseInt(typedAnswer, 10))}
                                  className={`w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-soft-gray disabled:cursor-not-allowed text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    isVirtualFullscreen ? 'py-5 text-xl' : 'py-4 text-base'
                                  }`}
                                >
                                  <CheckCircle2 size={isVirtualFullscreen ? 24 : 18} />
                                  <span>ផ្ទៀងផ្ទាត់ចម្លើយ</span>
                                </button>
                              </div>

                              {/* Right column: Compact Casio-style keypad */}
                              <div className={`bg-stone-50/80 border border-border-beige/50 rounded-3xl shadow-sm ${isVirtualFullscreen ? 'p-6' : 'p-3.5'}`}>
                                <div className={`grid grid-cols-3 ${isVirtualFullscreen ? 'gap-3.5' : 'gap-2'}`}>
                                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '⌫'].map((k) => {
                                    let btnStyle = `font-extrabold rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer select-none font-sans ${
                                      isVirtualFullscreen ? 'h-16 sm:h-20 text-3xl' : 'h-11 sm:h-13 text-xl'
                                    }`;
                                    
                                    if (k === '⌫') {
                                      btnStyle += " bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white border-b-4 border-rose-700";
                                    } else if (k === '-') {
                                      btnStyle += " bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border-b-4 border-amber-700";
                                    } else {
                                      btnStyle += " bg-white hover:bg-stone-50 active:bg-stone-100 text-charcoal border border-stone-200 border-b-4 border-stone-300";
                                    }

                                    return (
                                      <button
                                        key={k}
                                        type="button"
                                        onClick={() => handleKeypadPress(k)}
                                        className={btnStyle}
                                      >
                                        {k === '⌫' ? 'លុប' : k}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className={`grid grid-cols-1 ${isVirtualFullscreen ? 'gap-3 mt-3.5' : 'gap-2 mt-2'}`}>
                                  <button
                                    type="button"
                                    onClick={() => handleKeypadPress('C')}
                                    className={`bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-bold rounded-lg transition-all active:scale-98 cursor-pointer select-none border border-stone-300/60 border-b-2 ${
                                      isVirtualFullscreen ? 'h-14 sm:h-16 text-base' : 'h-9 text-[11px]'
                                    }`}
                                  >
                                    លុបចេញ (Clear)
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={`text-center bg-stone-bg/50 border border-border-beige rounded-2xl ${isVirtualFullscreen ? 'p-10' : 'p-6'}`}>
                              <div className={`text-soft-gray uppercase font-bold mb-2 ${isVirtualFullscreen ? 'text-sm' : 'text-xs'}`}>លទ្ធផលចម្លើយ</div>
                              <div className={`flex justify-center items-center gap-6 mb-4 ${isVirtualFullscreen ? 'gap-12 mb-6' : 'gap-6 mb-4'}`}>
                                <div>
                                  <div className={`text-soft-gray ${isVirtualFullscreen ? 'text-sm' : 'text-xs'}`}>ចម្លើយរបស់អ្នក៖</div>
                                  <div className={`font-extrabold font-sans ${selectedAnswer === currentQuestion?.correctAnswer ? 'text-emerald-600' : 'text-rose-500'} ${isVirtualFullscreen ? 'text-5xl' : 'text-3xl'}`}>
                                    {selectedAnswer === -999 ? 'ហួសពេល' : selectedAnswer}
                                  </div>
                                </div>
                                <div className={`w-px bg-stone-200 ${isVirtualFullscreen ? 'h-14' : 'h-8'}`} />
                                <div>
                                  <div className={`text-soft-gray ${isVirtualFullscreen ? 'text-sm' : 'text-xs'}`}>ចម្លើយត្រឹមត្រូវ៖</div>
                                  <div className={`font-extrabold text-emerald-600 font-sans ${isVirtualFullscreen ? 'text-5xl' : 'text-3xl'}`}>
                                    {currentQuestion?.correctAnswer}
                                  </div>
                                </div>
                              </div>
                              <div className={`font-bold ${isVirtualFullscreen ? 'text-lg' : 'text-sm'} ${selectedAnswer === currentQuestion?.correctAnswer ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {selectedAnswer === currentQuestion?.correctAnswer ? '🎉 ឆ្លើយត្រូវហើយ! ស្អែកណាស់កូន!' : '❌ មិនទាន់ត្រូវទេ! ព្យាយាមសំណួរបន្ទាប់!'}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // PRACTICE MODE MULTIPLE CHOICE OPTIONS
                        <>
                          <h4 className="text-sm font-bold text-soft-gray mb-3 text-center">ជ្រើសរើសចម្លើយត្រឹមត្រូវ៖</h4>
                          <div className="grid grid-cols-2 gap-3 mb-8">
                            {currentQuestion?.options.map((option, idx) => {
                              const isCorrectChoice = option === currentQuestion.correctAnswer;
                              const isSelected = option === selectedAnswer;
                              
                              let btnStyle = "bg-white border-border-beige hover:border-soft-gray text-charcoal";
                              if (isAnswered) {
                                if (isCorrectChoice) {
                                  btnStyle = "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20";
                                } else if (isSelected) {
                                  btnStyle = "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20";
                                } else {
                                  btnStyle = "bg-stone-50 border-stone-200 text-stone-400 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  disabled={isAnswered}
                                  onClick={() => handleAnswerSubmit(option)}
                                  className={`py-4 rounded-2xl border text-xl font-extrabold transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer ${btnStyle}`}
                                >
                                  <span className="font-sans">{option}</span>
                                  {isAnswered && isCorrectChoice && <CheckCircle2 size={18} />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Feedback Explanation */}
                          <AnimatePresence>
                            {isAnswered && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center bg-stone-bg/50 border border-border-beige p-5 rounded-2xl mb-6"
                              >
                                <h5 className={`font-bold text-sm mb-1 ${
                                  selectedAnswer === currentQuestion?.correctAnswer 
                                    ? 'text-emerald-600' 
                                    : 'text-rose-600'
                                }`}>
                                  {selectedAnswer === currentQuestion?.correctAnswer 
                                    ? '🎉 ឆ្លើយត្រូវហើយ! ស្អែកណាស់កូន!' 
                                    : `❌ មិនទាន់ត្រូវទេ! ចម្លើយត្រឹមត្រូវគឺ៖ ${currentQuestion?.correctAnswer}`
                                  }
                                </h5>
                                <p className="text-[11px] text-soft-gray leading-normal">
                                  {currentQuestion?.equation} ស្មើនឹង {currentQuestion?.correctAnswer}។ ពិនិត្យមើលរូបម្រាមដៃខាងលើដើម្បីយល់ដឹងពីរបៀបបង្ហាញ!
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      {/* Next Action Button */}
                      {isAnswered && (
                        <button
                          onClick={handleNextQuestion}
                          className={`w-full bg-clay hover:bg-clay-dark text-white font-extrabold rounded-2xl shadow-md transition-all scale-102 hover:scale-105 flex items-center justify-center gap-2 cursor-pointer ${
                            isVirtualFullscreen ? 'py-5 text-xl' : 'py-4 text-base'
                          }`}
                        >
                          <span>{currentQuestionIndex === 9 ? 'មើលលទ្ធផលប្រលង' : 'សំណួរបន្ទាប់'}</span>
                          <ChevronRight size={isVirtualFullscreen ? 24 : 18} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
