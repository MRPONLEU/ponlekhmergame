import React from 'react';
import { WordItem } from '../types';
import { 
  ArrowLeft, 
  ArrowRight,
  RotateCcw, 
  Gift, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  Maximize, 
  Minimize, 
  Star, 
  ChevronDown, 
  X, 
  HelpCircle,
  Play,
  Trophy,
  History,
  BookOpen,
  Users,
  User,
  Plus,
  Minus,
  Flame,
  Settings,
  VolumeX,
  Sliders,
  Check,
  XCircle,
  Crown,
  Award
} from 'lucide-react';

interface MysteryTeam {
  id: number;
  name: string;
  badgeBg: string;
}

export interface LuckyEvent {
  id: string;
  title: string;
  description: string;
  type: 'bonus_15' | 'bonus_10' | 'bonus_30' | 'penalty_5' | 'penalty_10' | 'skip_turn';
  scoreChange: number;
  bgGradient: string;
  borderColor: string;
  icon: string;
}

const LUCKY_EVENTS: LuckyEvent[] = [
  {
    id: 'lucky_1',
    title: 'បានពិន្ទុ Free +15!',
    description: 'អបអរសាទរ! ទទួលបានពិន្ទុ Free +15 ពិន្ទុដោយសេរី!',
    type: 'bonus_15',
    scoreChange: 15,
    bgGradient: 'from-amber-400 via-yellow-500 to-amber-600',
    borderColor: 'border-amber-200',
    icon: '🎁'
  },
  {
    id: 'lucky_2',
    title: 'បានពិន្ទុ Free +10!',
    description: 'អបអរសាទរ! ទទួលបាន +10 ពិន្ទុបន្ថែម!',
    type: 'bonus_10',
    scoreChange: 10,
    bgGradient: 'from-emerald-400 via-teal-500 to-green-600',
    borderColor: 'border-emerald-200',
    icon: '🌟'
  },
  {
    id: 'lucky_3',
    title: 'សំណាងធំ ពិន្ទុឌុប +30!',
    description: 'អស្ចារ្យណាស់! ទទួលបានពិន្ទុឌុប +30 ពិន្ទុ!',
    type: 'bonus_30',
    scoreChange: 30,
    bgGradient: 'from-purple-500 via-fuchsia-600 to-pink-600',
    borderColor: 'border-purple-200',
    icon: '⚡'
  },
  {
    id: 'lucky_4',
    title: 'ដក -5 ពិន្ទុ!',
    description: 'ស៊យហើយ! ត្រូវកាត់ពិន្ទុ -5 ពិន្ទុ!',
    type: 'penalty_5',
    scoreChange: -5,
    bgGradient: 'from-rose-500 via-red-600 to-rose-700',
    borderColor: 'border-rose-300',
    icon: '💣'
  },
  {
    id: 'lucky_5',
    title: 'ដក -10 ពិន្ទុ!',
    description: 'អូហូ! ត្រូវកាត់ពិន្ទុ -10 ពិន្ទុ!',
    type: 'penalty_10',
    scoreChange: -10,
    bgGradient: 'from-rose-600 via-red-700 to-red-900',
    borderColor: 'border-red-300',
    icon: '💥'
  },
  {
    id: 'lucky_6',
    title: 'បាត់បង់វេន ១លើក!',
    description: 'ស៊យហើយ! បាត់បង់វេនលេង ១លើក!',
    type: 'skip_turn',
    scoreChange: 0,
    bgGradient: 'from-slate-600 via-slate-700 to-slate-900',
    borderColor: 'border-slate-400',
    icon: '🛑'
  }
];

const DEFAULT_TEAMS_DATA: MysteryTeam[] = [
  { id: 1, name: 'ក្រុមទី១', badgeBg: 'bg-gradient-to-r from-pink-500 to-rose-600' },
  { id: 2, name: 'ក្រុមទី២', badgeBg: 'bg-gradient-to-r from-blue-500 to-indigo-600' },
  { id: 3, name: 'ក្រុមទី៣', badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
  { id: 4, name: 'ក្រុមទី៤', badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-600' },
];
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playClickSound, playSuccessSound, playWinSound, playFailSound, speakText } from '../utils/audio';

interface MysteryBoxProps {
  words: WordItem[];
  onBack: () => void;
}

export default function MysteryBox({ words, onBack }: MysteryBoxProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ទាំងអស់');
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [isOpening, setIsOpening] = React.useState<boolean>(false);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [currentWord, setCurrentWord] = React.useState<WordItem | null>(null);
  const [openedHistory, setOpenedHistory] = React.useState<WordItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState<boolean>(false);
  const [remainingWords, setRemainingWords] = React.useState<WordItem[]>(words);

  // Individual vs Team mode states
  const [playMode, setPlayMode] = React.useState<'individual' | 'team'>('team');
  const [teamCount, setTeamCount] = React.useState<number>(2);
  const [activeTeamIndex, setActiveTeamIndex] = React.useState<number>(0);
  const [teamScores, setTeamScores] = React.useState<number[]>([0, 0, 0, 0]);
  const [individualScore, setIndividualScore] = React.useState<number>(0);

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [shakeDuration, setShakeDuration] = React.useState<number>(3000); // 3000ms default
  const [autoSpeak, setAutoSpeak] = React.useState<boolean>(true);
  const [enableSound, setEnableSound] = React.useState<boolean>(true);
  const [enableConfetti, setEnableConfetti] = React.useState<boolean>(true);

  // Total boxes per game & victory tracking
  const [totalBoxes, setTotalBoxes] = React.useState<number>(16); // 8, 16, or 24
  const [boxesOpenedCount, setBoxesOpenedCount] = React.useState<number>(0);
  const [isGameOver, setIsGameOver] = React.useState<boolean>(false);

  // Lucky Mystery Box States
  const [enableLuckyBoxes, setEnableLuckyBoxes] = React.useState<boolean>(true);
  const [luckyBoxChance, setLuckyBoxChance] = React.useState<number>(0.25); // 25% chance
  const [activeLuckyEvent, setActiveLuckyEvent] = React.useState<LuckyEvent | null>(null);

  // Available categories
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    words.forEach(w => {
      if (w.wordType) cats.add(w.wordType);
    });
    return ['ទាំងអស់', ...Array.from(cats)];
  }, [words]);

  // Filter words based on selected category
  const filteredWords = React.useMemo(() => {
    if (selectedCategory === 'ទាំងអស់') return words;
    return words.filter(w => w.wordType === selectedCategory);
  }, [words, selectedCategory]);

  // Reset/sync remaining words when category changes or manual reset
  const resetGame = React.useCallback(() => {
    const source = filteredWords.length > 0 ? filteredWords : words;
    setRemainingWords([...source].sort(() => Math.random() - 0.5));
    setOpenedHistory([]);
    setIsOpen(false);
    setIsOpening(false);
    setCurrentWord(null);
    setBoxesOpenedCount(0);
    setIsGameOver(false);
    setActiveLuckyEvent(null);
  }, [filteredWords, words]);

  // Preload images instantly on mount for zero initial lag
  React.useEffect(() => {
    ['/images/gifts/close.png', '/images/gifts/open.png', '/images/gifts/close (1).png', '/images/gifts/open (1).png'].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  React.useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#f59e0b', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
    });
  };

  // Open the Single Mystery Box - With 3s exciting shaking suspense!
  const handleOpenMysteryBox = () => {
    if (isOpening) return;

    if (isOpen) {
      // If already open, close first then start 3s shaking for next word!
      playClickSound();
      setIsOpen(false);
      setTimeout(() => {
        drawNextWord();
      }, 100);
      return;
    }

    drawNextWord();
  };

  // Close the opened box and reset to unopened state so students can click open again!
  const handleNextBox = () => {
    if (isOpening) return;
    if (enableSound) playClickSound();
    setIsOpen(false);

    const nextCount = boxesOpenedCount + 1;
    setBoxesOpenedCount(nextCount);

    if (nextCount >= totalBoxes) {
      setTimeout(() => {
        setIsGameOver(true);
        if (enableSound) playWinSound();
        if (enableConfetti) triggerConfetti();
      }, 350);
      return;
    }

    if (playMode === 'team') {
      setActiveTeamIndex(prev => (prev + 1) % teamCount);
    }
  };

  const drawNextWord = () => {
    if (enableSound) playClickSound();
    let pool = remainingWords;
    if (pool.length === 0) {
      // Refill pool if exhausted
      pool = [...filteredWords].sort(() => Math.random() - 0.5);
      setRemainingWords(pool);
    }

    const isLuckyDraw = enableLuckyBoxes && (Math.random() < luckyBoxChance);
    let luckyEvt: LuckyEvent | null = null;
    let picked: WordItem;

    if (isLuckyDraw) {
      luckyEvt = LUCKY_EVENTS[Math.floor(Math.random() * LUCKY_EVENTS.length)];
      picked = {
        word: luckyEvt.title,
        wordType: 'ប្រអប់សំណាង',
        parts: [],
        definition: luckyEvt.description,
        example: ''
      };
    } else {
      picked = pool[0];
      setRemainingWords(pool.slice(1));
    }

    if (shakeDuration <= 0) {
      setIsOpening(false);
      setIsOpen(true);
      setActiveLuckyEvent(luckyEvt);
      setCurrentWord(picked);
      if (!isLuckyDraw) {
        setOpenedHistory(prev => [picked, ...prev.filter(w => w.word !== picked.word)]);
      }
      if (enableSound) {
        if (luckyEvt && luckyEvt.scoreChange < 0) {
          playFailSound();
        } else {
          playWinSound();
          playSuccessSound();
        }
      }
      if (enableConfetti && (!luckyEvt || luckyEvt.scoreChange > 0)) triggerConfetti();
      if (autoSpeak && !isLuckyDraw) { setTimeout(() => speakText(picked.word), 150); }
      return;
    }

    // Start shaking suspense phase
    setIsOpening(true);

    // Play suspense tick sounds while shaking
    const shakeAudioTimer = setInterval(() => {
      if (enableSound) playClickSound();
    }, 280);

    // After shakeDuration (ms), pop open the box!
    setTimeout(() => {
      clearInterval(shakeAudioTimer);
      setIsOpening(false);
      setIsOpen(true);
      setActiveLuckyEvent(luckyEvt);
      setCurrentWord(picked);
      if (!isLuckyDraw) {
        setOpenedHistory(prev => [picked, ...prev.filter(w => w.word !== picked.word)]);
      }

      if (enableSound) {
        if (luckyEvt && luckyEvt.scoreChange < 0) {
          playFailSound();
        } else {
          playWinSound();
          playSuccessSound();
        }
      }
      if (enableConfetti && (!luckyEvt || luckyEvt.scoreChange > 0)) triggerConfetti();

      // Voice reading
      if (autoSpeak && !isLuckyDraw) {
        setTimeout(() => {
          speakText(picked.word);
        }, 150);
      }
    }, shakeDuration);
  };

  // Handle Spacebar to open/draw
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleOpenMysteryBox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isOpening, remainingWords, filteredWords]);

  const toggleFullscreen = () => {
    playClickSound();
    setIsFullscreen(!isFullscreen);
  };

  if (!words || words.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center font-sans">
        <HelpCircle size={48} className="text-purple-400 mb-3 animate-bounce" />
        <p className="text-slate-800 font-bold mb-4">មិនទាន់មានពាក្យសិក្សានៅក្នុងប្រព័ន្ធទេ!</p>
        <button
          onClick={() => { playClickSound(); onBack(); }}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-md"
        >
          ត្រឡប់ទៅវិញ
        </button>
      </div>
    );
  }

  return (
    <div className={`font-sans transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-auto w-screen h-screen m-0 p-3 sm:p-6' : 'min-h-screen bg-transparent py-3 px-2 sm:px-4 lg:px-6'}`}>
      <div className="w-full max-w-none flex flex-col justify-between">
        
        {/* PURPLE GRADIENT NAVIGATION BAR - FULL WIDTH & PROPORTIONALLY LARGE */}
        <div className="mb-4 w-full bg-gradient-to-r from-[#581c87] via-[#4c1d95] to-[#3b0764] py-4 px-4 sm:px-6 rounded-2xl sm:rounded-3xl border border-purple-400/30 shadow-2xl flex flex-wrap items-center justify-between gap-4 text-white">
          
          {/* LEFT: Team / Individual Score Cards (Large & Prominent) */}
          <div className="flex flex-wrap items-center gap-3.5">
            {playMode === 'team' ? (
              <div className="flex flex-wrap items-center gap-3">
                {DEFAULT_TEAMS_DATA.slice(0, teamCount).map((team, idx) => {
                  const isActive = activeTeamIndex === idx;
                  return (
                    <div
                      key={team.id}
                      onClick={() => {
                        playClickSound();
                        setActiveTeamIndex(idx);
                      }}
                      className={`relative bg-amber-50/95 text-slate-800 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'border-pink-500 ring-4 ring-pink-500/80 scale-105 z-10 bg-white'
                          : 'border-purple-300/40 opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* Active Turn Flame Badge */}
                      {isActive && (
                        <div className="absolute -top-3.5 left-3 px-2.5 py-0.5 bg-neutral-900 text-amber-400 text-xs font-black rounded-full shadow-md border border-amber-400/60 flex items-center gap-1 animate-bounce z-20">
                          <Flame size={14} className="text-orange-500 fill-amber-400" />
                          <span>វេនលេង</span>
                        </div>
                      )}

                      {/* Team Name Badge */}
                      <span className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-extrabold shadow-sm ${team.badgeBg} text-white`}>
                        {team.name}
                      </span>

                      {/* Score Display (Large Badge) */}
                      <div className="bg-slate-100/95 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-inner">
                        <span className="text-base sm:text-xl font-black text-purple-950">
                          {teamScores[idx]} <span className="text-xs sm:text-sm text-slate-500 font-bold">ពិន្ទុ</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* INDIVIDUAL MODE SCORE CARD */
              <div className="bg-amber-50/95 text-slate-800 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-xl border border-amber-300 flex items-center gap-3">
                <span className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-purple-950 shadow-xs">
                  👤 ពិន្ទុបុគ្គល
                </span>
                <div className="bg-slate-100/95 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-inner">
                  <span className="text-base sm:text-xl font-black text-purple-950">
                    {individualScore} <span className="text-xs sm:text-sm text-slate-500 font-bold">ពិន្ទុ</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Action Controls (Settings, History, Fullscreen, Close - White Pills as in reference) */}
          <div className="flex items-center gap-2.5">
            {/* Settings Modal Toggle Button */}
            <button
              onClick={() => {
                playClickSound();
                setIsSettingsOpen(true);
              }}
              className="p-3 sm:p-3.5 bg-white hover:bg-amber-50 text-purple-950 rounded-2xl sm:rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="ការកំណត់ផ្សេងៗ"
            >
              <Settings size={22} className="text-purple-950" />
            </button>

            {/* History Drawer Toggle Button */}
            <button
              onClick={() => {
                playClickSound();
                setIsHistoryOpen(!isHistoryOpen);
              }}
              className="p-3 sm:p-3.5 bg-white hover:bg-amber-50 text-purple-950 rounded-2xl sm:rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="ប្រវត្តិពាក្យ"
            >
              <History size={22} className="text-purple-950" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-3 sm:p-3.5 bg-white hover:bg-amber-50 text-purple-950 rounded-2xl sm:rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title={isFullscreen ? "បង្រួមអេក្រង់" : "ពេញអេក្រង់"}
            >
              {isFullscreen ? <Minimize size={22} className="text-purple-950" /> : <Maximize size={22} className="text-purple-950" />}
            </button>

            {/* Exit/Back Button */}
            <button
              onClick={() => { playClickSound(); onBack(); }}
              id="btn-back-dashboard"
              className="p-3 sm:p-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl sm:rounded-2xl border border-rose-300/40 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="ចាកចេញ"
            >
              <X size={22} />
            </button>
          </div>

        </div>

        {/* Main Stage Card - Purple Studio Backdrop inspired by reference image */}
        <div className={`relative rounded-[40px] p-4 sm:p-8 overflow-hidden shadow-2xl border-2 border-purple-500/30 bg-gradient-to-b from-[#6b21a8] via-[#4c1d95] to-[#2e1065] text-white flex flex-col items-center justify-between ${
          isFullscreen ? 'flex-1 my-2 min-h-[680px]' : 'min-h-[560px] sm:min-h-[640px]'
        }`}>
          
          {/* Ambient Radial Spotlight rays behind mystery box - GPU Accelerated Light Radial */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.18)_0%,_rgba(147,51,234,0.1)_50%,_transparent_80%)] pointer-events-none" />

          {/* Top Progress Badge: Box X / Total */}
          <div className="absolute top-4 left-4 sm:left-6 z-30 px-3.5 py-1.5 bg-amber-400/95 text-purple-950 font-black rounded-full text-xs sm:text-sm border border-amber-300 shadow-lg flex items-center gap-1.5">
            <Gift size={16} className="text-purple-950" />
            <span>ប្រអប់ទី {Math.min(boxesOpenedCount + 1, totalBoxes)} / {totalBoxes}</span>
          </div>

          {/* Floating Background Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-amber-300 animate-ping" />
            <div className="absolute top-20 right-16 w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
            <div className="absolute bottom-16 left-20 w-4 h-4 rounded-full bg-cyan-300 animate-pulse" />
            <div className="absolute bottom-12 right-12 w-3 h-3 rounded-full bg-yellow-200 animate-ping" />
          </div>

          {/* CENTER STAGE: ENLARGED GIFT BOX STAGE - Shifted Lower */}
          <div 
            className="relative z-10 w-full flex-1 flex flex-col items-center justify-end sm:justify-center cursor-pointer select-none pt-4 pb-2" 
            onClick={handleOpenMysteryBox}
          >
            {/* ENLARGED GIFT BOX CONTAINER USING UPLOADED TRANSPARENT PNG IMAGES */}
            <div className="relative w-[320px] sm:w-[520px] md:w-[600px] h-[360px] sm:h-[500px] md:h-[540px] flex items-center justify-center z-10 cursor-pointer transform-gpu translate-y-3 sm:translate-y-6">
              {/* GIFT BOX TRANSPARENT PNG IMAGE (OPEN / CLOSE) */}
              <AnimatePresence mode="sync">
                {isOpen ? (
                  <motion.img
                    key="open-gift-png"
                    src="/images/gifts/open (1).png"
                    alt="Opened Gift Box"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/gifts/open.png";
                    }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] transform-gpu will-change-transform"
                  />
                ) : (
                  <motion.div 
                    key="close-gift-wrapper" 
                    initial={false}
                    animate={isOpening ? { 
                      rotate: [0, -14, 14, -18, 18, -20, 20, -12, 12, 0],
                      scale: [1, 1.06, 1.12, 1.18, 1.12, 1.05, 1],
                      y: [0, -6, 0, -10, 0]
                    } : { 
                      y: [0, -8, 0] 
                    }}
                    transition={isOpening ? { 
                      repeat: Infinity, 
                      duration: 0.45, 
                      ease: "easeInOut" 
                    } : { 
                      repeat: Infinity, 
                      duration: 2.2, 
                      ease: "easeInOut" 
                    }}
                    className="relative w-full h-full flex items-center justify-center transform-gpu will-change-transform"
                  >
                    {/* Lightweight Radial Light Glow behind closed box */}
                    <div className={`absolute w-64 h-64 sm:w-96 sm:h-96 transition-all ${
                      isOpening ? 'bg-[radial-gradient(circle,_rgba(251,191,36,0.65)_0%,_transparent_70%)] scale-125 animate-pulse' : 'bg-[radial-gradient(circle,_rgba(251,191,36,0.3)_0%,_transparent_70%)]'
                    } pointer-events-none`} />

                    {/* Floating Bouncing Question Mark Above Closed Box */}
                    <motion.div
                      animate={isOpening ? {
                        scale: [1, 1.25, 1],
                        rotate: [0, -15, 15, 0]
                      } : { 
                        y: [0, -12, 0],
                        scale: [1, 1.08, 1]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: isOpening ? 0.35 : 1.8, 
                        ease: "easeInOut" 
                      }}
                      className="absolute top-2 sm:top-6 z-20 text-6xl sm:text-8xl font-black text-amber-300 drop-shadow-[0_8px_18px_rgba(245,158,11,0.8)] select-none pointer-events-none transform-gpu"
                    >
                      ?
                    </motion.div>

                    <img
                      src="/images/gifts/close (1).png"
                      alt="Closed Gift Box"
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/gifts/close.png";
                      }}
                      className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] transform-gpu"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bright Golden Radial Burst Beam Emerging From Open Box */}
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[560px] h-80 sm:h-[560px] bg-[radial-gradient(circle,_rgba(253,224,71,0.55)_0%,_rgba(245,158,11,0.3)_45%,_transparent_72%)] pointer-events-none z-20 rounded-full animate-pulse"
                />
              )}

              {/* REVEALED WORD DISPLAYED CLEANLY ABOVE THE OPEN BOX */}
              <AnimatePresence>
                {isOpen && currentWord && (
                  <motion.div
                    key={currentWord.word}
                    initial={{ y: 30, opacity: 0, scale: 0.4 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="absolute top-[12%] sm:top-[14%] inset-x-2 sm:inset-x-8 z-30 flex flex-col items-center justify-center text-center px-2 pointer-events-auto"
                  >
                    {activeLuckyEvent ? (
                      <div className="flex flex-col items-center justify-center space-y-1.5 sm:space-y-2.5 pointer-events-none select-none px-2 max-w-lg">
                        <motion.span 
                          animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8 }}
                          className="text-6xl sm:text-8xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                        >
                          {activeLuckyEvent.icon}
                        </motion.span>
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-amber-300 tracking-tight leading-tight drop-shadow-[0_8px_25px_rgba(0,0,0,0.95)] font-sans">
                          {activeLuckyEvent.title}
                        </h2>
                        <p className="text-sm sm:text-lg font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] max-w-md text-center">
                          {activeLuckyEvent.description}
                        </p>
                      </div>
                    ) : (
                      /* Word Main Text Only */
                      <h2 
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          speakText(currentWord.word);
                        }}
                        className={`font-black text-amber-300 tracking-tight leading-tight drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)] font-sans px-2 cursor-pointer hover:scale-105 active:scale-95 transition-all select-none ${
                          currentWord.word.length <= 8 
                            ? 'text-5xl sm:text-7xl md:text-8xl' 
                            : currentWord.word.length <= 20 
                              ? 'text-3xl sm:text-5xl md:text-6xl max-w-sm sm:max-w-md' 
                              : 'text-xl sm:text-3xl md:text-4xl max-w-xs sm:max-w-lg leading-snug'
                        }`}
                        title="ចុចដើម្បីស្ដាប់សំឡេងអាន"
                      >
                        {currentWord.word}
                      </h2>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floor Shadow Glow */}
              <div className="absolute bottom-2 w-64 sm:w-96 h-8 bg-black/70 rounded-full blur-xl z-0 pointer-events-none" />
            </div>
          </div>

          {/* Evaluation Action Buttons Below Box (Appears ONLY AFTER the gift box is opened) */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.8 }}
                className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-3 sm:gap-5 px-4 w-full max-w-xl"
              >
                {activeLuckyEvent ? (
                  /* Single Action Button for Lucky Event */
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (enableSound) {
                        if (activeLuckyEvent.scoreChange >= 0) playSuccessSound();
                        else playFailSound();
                      }
                      if (enableConfetti && activeLuckyEvent.scoreChange > 0) triggerConfetti();

                      // Apply score change
                      if (playMode === 'team') {
                        setTeamScores(prev => {
                          const next = [...prev];
                          next[activeTeamIndex] = Math.max(0, next[activeTeamIndex] + activeLuckyEvent.scoreChange);
                          return next;
                        });
                      } else {
                        setIndividualScore(prev => Math.max(0, prev + activeLuckyEvent.scoreChange));
                      }

                      setActiveLuckyEvent(null);
                      handleNextBox();
                    }}
                    className={`px-7 py-3.5 bg-gradient-to-r ${activeLuckyEvent.bgGradient} text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl border-2 ${activeLuckyEvent.borderColor} flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95`}
                  >
                    <Sparkles size={22} className="text-white animate-spin" />
                    <span>
                      {activeLuckyEvent.scoreChange > 0
                        ? `ទទួលយកពិន្ទុ Free (+${activeLuckyEvent.scoreChange} ពិន្ទុ)`
                        : activeLuckyEvent.scoreChange < 0
                          ? `យល់ព្រមកាត់ពិន្ទុ (${activeLuckyEvent.scoreChange} ពិន្ទុ)`
                          : 'រំលងវេន (បន្តទៅក្រុមបន្ទាប់)'}
                    </span>
                  </motion.button>
                ) : (
                  <>
                    {/* Red Button: Read Incorrectly (អានមិនត្រឹមត្រូវ) */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (enableSound) playClickSound();
                        handleNextBox(); // Close box & cycle turn to next team
                      }}
                      className="px-5 py-3 sm:px-7 sm:py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-rose-950/50 border-2 border-rose-300/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      title="អានមិនត្រឹមត្រូវ (មិនបូកពិន្ទុ)"
                    >
                      <XCircle size={22} className="text-white" />
                      <span>អានមិនត្រឹមត្រូវ</span>
                    </motion.button>

                    {/* Green Button: Read Correctly (អានបានត្រឹមត្រូវ) */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (enableSound) {
                          playSuccessSound();
                        }
                        if (enableConfetti) {
                          triggerConfetti();
                        }
                        // Award +15 score to active team or individual
                        if (playMode === 'team') {
                          setTeamScores(prev => {
                            const next = [...prev];
                            next[activeTeamIndex] = next[activeTeamIndex] + 15;
                            return next;
                          });
                        } else {
                          setIndividualScore(prev => prev + 15);
                        }
                        handleNextBox(); // Close box & cycle turn to next team
                      }}
                      className="px-5 py-3 sm:px-7 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-950/50 border-2 border-emerald-300/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      title="អានបានត្រឹមត្រូវ (បូក ១៥ ពិន្ទុ)"
                    >
                      <CheckCircle2 size={22} className="text-white" />
                      <span>អានបានត្រឹមត្រូវ</span>
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* DRAWER / HISTORY OF OPENED WORDS */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white rounded-3xl p-6 border border-purple-100 shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen size={18} className="text-purple-600" />
                  <span>បញ្ជីពាក្យដែលបានបើករួច ({openedHistory.length})</span>
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {openedHistory.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">មិនទាន់មានពាក្យបានបើកនៅឡើយទេ។</p>
              ) : (
                <div className="flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-1">
                  {openedHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playClickSound();
                        setCurrentWord(item);
                        setIsOpen(true);
                        speakText(item.word);
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>{item.word}</span>
                      <Volume2 size={13} className="text-purple-500" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SETTINGS MODAL DIALOG */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setIsSettingsOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 text-slate-800 space-y-6 max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                      <Settings size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">ការកំណត់ហ្គេម (Settings)</h2>
                      <p className="text-xs text-slate-500 font-semibold">កំណត់របៀបលេង សំឡេង និងរយៈពេលអង្រួនប្រអប់</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsSettingsOpen(false);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Settings Options */}
                <div className="space-y-5">
                  {/* Option 1: Play Mode */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                      <span>របៀបលេង (Play Mode)</span>
                      <span className="text-xs font-semibold text-purple-600">{playMode === 'team' ? 'លេងជាក្រុម' : 'លេងជាបុគ្គល'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                      <button
                        onClick={() => {
                          playClickSound();
                          setPlayMode('individual');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          playMode === 'individual'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User size={16} />
                        <span>បុគ្គល</span>
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          setPlayMode('team');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          playMode === 'team'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users size={16} />
                        <span>ជាក្រុម</span>
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Shaking Duration */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                      <span>រយៈពេលអង្រួនប្រអប់ (Shaking Time)</span>
                      <span className="text-xs font-semibold text-purple-600">{shakeDuration / 1000}s</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '3 វិនាទី', val: 3000 },
                        { label: '2 វិនាទី', val: 2000 },
                        { label: '1 វិនាទី', val: 1000 },
                        { label: 'មិនអង្រួន', val: 0 },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => {
                            playClickSound();
                            setShakeDuration(opt.val);
                          }}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                            shakeDuration === opt.val
                              ? 'bg-amber-400 text-purple-950 border-amber-300 font-extrabold shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 3: Number of Teams (if in team mode) */}
                  {playMode === 'team' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        <span>ចំនួនក្រុមសរុប</span>
                        <span className="text-xs font-semibold text-purple-600">{teamCount} ក្រុម</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[2, 3, 4].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              playClickSound();
                              setTeamCount(num);
                            }}
                            className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              teamCount === num
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                            }`}
                          >
                            {num} ក្រុម
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option 4: Total Mystery Boxes per Game Session (8, 16, 24) */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                      <span>ចំនួនប្រអប់សរុបក្នុងមួយហ្គេម</span>
                      <span className="text-xs font-semibold text-purple-600">{totalBoxes} ប្រអប់</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[8, 16, 24].map(num => (
                        <button
                          key={num}
                          onClick={() => {
                            playClickSound();
                            setTotalBoxes(num);
                            if (boxesOpenedCount >= num) {
                              setBoxesOpenedCount(0);
                            }
                          }}
                          className={`py-2.5 px-2 text-xs sm:text-sm font-extrabold rounded-xl border transition-all cursor-pointer ${
                            totalBoxes === num
                              ? 'bg-amber-400 text-purple-950 border-amber-300 shadow-sm scale-102'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                          }`}
                        >
                          {num} ប្រអប់
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 4: Category Filter Selection */}
                  {categories.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">
                        ប្រភេទពាក្យមេរៀន
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          playClickSound();
                          setSelectedCategory(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>ប្រភេទ ៖ {cat}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Option 5: Audio, Effects & Lucky Boxes Toggles */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      សំឡេង & ឥទ្ធិពលហ្គេម
                    </label>

                    {/* Lucky Box Toggle */}
                    <div className="flex items-center justify-between p-3 bg-amber-50/80 rounded-2xl border border-amber-200">
                      <div className="flex items-center gap-2.5">
                        <Gift size={18} className="text-amber-600" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">ប្រអប់សំណាង (Lucky Boxes)</p>
                          <p className="text-[10px] text-slate-500">មានឱកាសទទួលបានពិន្ទុ Free, ដកពិន្ទុ ឬរំលងវេន</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          playClickSound();
                          setEnableLuckyBoxes(!enableLuckyBoxes);
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          enableLuckyBoxes ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            enableLuckyBoxes ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Auto Read Voice Toggle */}
                    <div className="flex items-center justify-between p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                      <div className="flex items-center gap-2.5">
                        <Volume2 size={18} className="text-purple-600" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">អានពាក្យស្វ័យប្រវត្តិ</p>
                          <p className="text-[10px] text-slate-500">អានពាក្យឱ្យសិស្សស្ដាប់ពេលបើកប្រអប់</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          playClickSound();
                          setAutoSpeak(!autoSpeak);
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          autoSpeak ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            autoSpeak ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Sound Effects Toggle */}
                    <div className="flex items-center justify-between p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                      <div className="flex items-center gap-2.5">
                        {enableSound ? <Volume2 size={18} className="text-purple-600" /> : <VolumeX size={18} className="text-slate-400" />}
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">សំឡេងហ្គេម (Sound Effects)</p>
                          <p className="text-[10px] text-slate-500">សំឡេងចុច និងសំឡេងអបអរ</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          playClickSound();
                          setEnableSound(!enableSound);
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          enableSound ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            enableSound ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Confetti Effect Toggle */}
                    <div className="flex items-center justify-between p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                      <div className="flex items-center gap-2.5">
                        <Sparkles size={18} className="text-amber-500" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">ឥទ្ធិពលក្រដាសចាំង (Confetti)</p>
                          <p className="text-[10px] text-slate-500">បាញ់ក្រដាសពណ៌អបអរពេលបើកប្រអប់</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          playClickSound();
                          setEnableConfetti(!enableConfetti);
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          enableConfetti ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            enableConfetti ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Reset Scores Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        playClickSound();
                        setTeamScores([0, 0, 0, 0]);
                        setIndividualScore(0);
                        resetGame();
                        setIsSettingsOpen(false);
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={16} />
                      <span>កំណត់ពិន្ទុឡើងវិញ</span>
                    </button>

                    <button
                      onClick={() => {
                        playClickSound();
                        setIsSettingsOpen(false);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      រក្សាទុក & រួចរាល់
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VICTORY & LEADERBOARD MODAL (Triggered when all boxes in round are opened) */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 30 }}
                className="w-full max-w-xl bg-gradient-to-b from-purple-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-400/60 text-white space-y-6 text-center relative overflow-hidden"
              >
                {/* Background Golden Glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

                {/* Trophy Header */}
                <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="p-4 bg-gradient-to-tr from-amber-400 to-yellow-300 text-purple-950 rounded-3xl shadow-xl shadow-amber-500/30 border-2 border-amber-200"
                  >
                    <Trophy size={48} className="fill-purple-950" />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-md">
                    ជ័យលាភីចុងក្រោយ!
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-200 font-bold">
                    បានបើកប្រអប់កាដូសរុប {totalBoxes} / {totalBoxes} ប្រអប់រួចរាល់
                  </p>
                </div>

                {/* Team Ranking List */}
                {playMode === 'team' ? (
                  <div className="space-y-3 relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
                      <Crown size={16} />
                      <span>ចំណាត់ថ្នាក់ក្រុមទូទាំងហ្គេម</span>
                    </h3>

                    {/* Sorted Teams */}
                    <div className="space-y-2.5">
                      {DEFAULT_TEAMS_DATA.slice(0, teamCount)
                        .map((team, idx) => ({ ...team, score: teamScores[idx] }))
                        .sort((a, b) => b.score - a.score)
                        .map((team, rankIdx) => {
                          const isWinner = rankIdx === 0;
                          return (
                            <div
                              key={team.id}
                              className={`p-3 sm:p-4 rounded-2xl flex items-center justify-between transition-all border ${
                                isWinner
                                  ? 'bg-gradient-to-r from-amber-400/20 via-amber-500/30 to-amber-400/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                                  : 'bg-purple-950/60 border-purple-500/30'
                              }`}
                            >
                              {/* Rank & Team Badge */}
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                                  rankIdx === 0 ? 'bg-amber-400 text-purple-950 text-base shadow-md' :
                                  rankIdx === 1 ? 'bg-slate-300 text-slate-900' :
                                  rankIdx === 2 ? 'bg-amber-700 text-amber-100' :
                                  'bg-purple-900 text-purple-300'
                                }`}>
                                  {rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `${rankIdx + 1}`}
                                </div>
                                <span className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black ${team.badgeBg} text-white shadow-xs`}>
                                  {team.name}
                                </span>
                              </div>

                              {/* Score Badge */}
                              <div className="px-4 py-1.5 bg-white/10 rounded-xl border border-white/20">
                                <span className="text-sm sm:text-base font-black text-amber-300">
                                  {team.score} <span className="text-xs text-purple-200">ពិន្ទុ</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  /* Individual Victory Banner */
                  <div className="p-6 bg-purple-950/60 rounded-2xl border border-amber-400/40 relative z-10 space-y-2">
                    <p className="text-sm text-purple-200 font-bold">ពិន្ទុបុគ្គលសរុបទទួលបាន ៖</p>
                    <p className="text-4xl font-black text-amber-300">{individualScore} ពិន្ទុ</p>
                  </div>
                )}

                {/* Restart Game Action Button */}
                <div className="pt-2 relative z-10 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      playClickSound();
                      setTeamScores([0, 0, 0, 0]);
                      setIndividualScore(0);
                      resetGame();
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-purple-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    <span>លេងម្ដងទៀត (Play Again)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
