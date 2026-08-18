import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { WordItem } from '../types';
import { 
  Settings, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Trophy, 
  Sparkles, 
  Check, 
  X, 
  Clock, 
  Zap, 
  ArrowRightLeft, 
  Flame,
  Star,
  ChevronRight,
  BookOpen,
  Puzzle,
  Search,
  Eye,
  Award,
  Palette,
  Crown,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  playClickSound, 
  playSuccessSound, 
  playFailSound, 
  playWinSound, 
  playTickSound,
  speakText 
} from '../utils/audio';
import { isSentenceItem, formatSentenceText } from '../utils/khmerSplit';

const DEFAULT_SENTENCES: WordItem[] = [
  { word: "សាលារៀនរបស់យើងមានសួនច្បារស្អាត និងមានដើមឈើម្លប់ត្រជាក់។", wordType: "អត្ថបទខ្លី ៖ រឿងសាលារៀន", parts: [], definition: "", example: "" },
  { word: "នៅថ្ងៃអាទិត្យ ខ្ញុំជួយម៉ាក់ប៉ាសំអាតផ្ទះ និងស្រោចទឹកផ្កា។", wordType: "អត្ថបទខ្លី ៖ រឿងថ្ងៃអាទិត្យ", parts: [], definition: "", example: "" },
  { word: "សត្វតោ និងសត្វដំរី រស់នៅក្នុងព្រៃយ៉ាងមានក្ដីសុខ។", wordType: "អត្ថបទខ្លី ៖ រឿងសត្វព្រៃ", parts: [], definition: "", example: "" },
  { word: "កូនឆ្មាតូចរត់លេងលើវាលស្មៅពណ៌បៃតងយ៉ាងសប្បាយរីករាយ។", wordType: "អត្ថបទខ្លី ៖ រឿងកូនឆ្មាតូច", parts: [], definition: "", example: "" },
  { word: "សិស្សានុសិស្សទាំងអស់ខិតខំរៀនសូត្រដើម្បីក្លាយជាកូនល្អសិស្សល្អ។", wordType: "អត្ថបទខ្លី ៖ រឿងសិស្សល្អ", parts: [], definition: "", example: "" },
];

export type TeamGameMode = 'puzzle' | 'reading' | 'sentence' | 'search' | 'mixed';
export type CardColorTheme = 'rainbow' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';

const COLOR_STYLES: Record<string, { bg: string; border: string; shadow: string; hover: string; previewBg: string }> = {
  blue: { bg: 'bg-[#3b82f6]', border: 'border-[#1d4ed8]', shadow: 'shadow-[0_8px_0_#1d4ed8,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#2563eb]', previewBg: 'bg-blue-500' },
  rose: { bg: 'bg-[#f43f5e]', border: 'border-[#be123c]', shadow: 'shadow-[0_8px_0_#be123c,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#e11d48]', previewBg: 'bg-rose-500' },
  emerald: { bg: 'bg-[#10b981]', border: 'border-[#047857]', shadow: 'shadow-[0_8px_0_#047857,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#059669]', previewBg: 'bg-emerald-500' },
  amber: { bg: 'bg-[#f59e0b]', border: 'border-[#b45309]', shadow: 'shadow-[0_8px_0_#b45309,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#d97706]', previewBg: 'bg-amber-500' },
  purple: { bg: 'bg-[#8b5cf6]', border: 'border-[#6d28d9]', shadow: 'shadow-[0_8px_0_#6d28d9,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#7c3aed]', previewBg: 'bg-purple-500' },
  cyan: { bg: 'bg-[#06b6d4]', border: 'border-[#0e7490]', shadow: 'shadow-[0_8px_0_#0e7490,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#0891b2]', previewBg: 'bg-cyan-500' },
  pink: { bg: 'bg-[#ec4899]', border: 'border-[#be185d]', shadow: 'shadow-[0_8px_0_#be185d,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#db2777]', previewBg: 'bg-pink-500' },
  indigo: { bg: 'bg-[#6366f1]', border: 'border-[#4338ca]', shadow: 'shadow-[0_8px_0_#4338ca,0_12px_16px_rgba(0,0,0,0.15)]', hover: 'hover:bg-[#4f46e5]', previewBg: 'bg-indigo-500' },
};

const RAINBOW_CYCLE = ['blue', 'rose', 'emerald', 'amber', 'purple', 'cyan', 'pink', 'indigo'];

function getCardStyle(idx: number, theme: CardColorTheme) {
  if (theme === 'rainbow') {
    const colorKey = RAINBOW_CYCLE[idx % RAINBOW_CYCLE.length];
    return COLOR_STYLES[colorKey] || COLOR_STYLES.blue;
  }
  return COLOR_STYLES[theme] || COLOR_STYLES.blue;
}

const KHMER_DECOYS = [
  '្ង', 'ុំ', 'ម', 'ធ', 'ញ', 'ុ', 'ៀ', 'ា', 'យ', 'ោ', 'ទ', 'ែ', 
  'ក', 'ខ', 'ច', 'ឆ', 'ជ', 'ឈ', 'ញ', 'ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ', 
  'ត', 'ថ', 'ទ', 'ធ', 'ន', 'ប', 'ផ', 'ព', 'ភ', 'ម', 'យ', 'រ', 
  'ល', 'វ', 'ស', 'ហ', 'ឡ', 'អ', 'ា', 'ិ', 'ី', 'ឹ', 'ឺ', 'ុ', 
  'ូ', 'ួ', 'ើ', 'ឿ', 'ៀ', 'េ', 'ែ', 'ៃ', 'ោ', 'ៅ', 'ំ', 'ះ', 
  'ុំ', 'េំ', 'ុះ', 'េះ', 'ោះ'
];

export interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
  bgClass: string;
  borderClass: string;
  badgeBg: string;
}

export const TEAM_PRESETS = [
  { 
    name: 'ក្រុមទី១', 
    color: '#ec4899', 
    headerBg: 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600', 
    badgeBg: 'bg-rose-500',
    activeRing: 'ring-4 ring-rose-400/60 shadow-rose-500/30',
    borderClass: 'border-rose-500',
    glowBg: 'bg-rose-50/90',
    scoreColor: 'text-rose-600',
    lightBorder: 'border-rose-200'
  },
  { 
    name: 'ក្រុមទី២', 
    color: '#3b82f6', 
    headerBg: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600', 
    badgeBg: 'bg-blue-600',
    activeRing: 'ring-4 ring-blue-400/60 shadow-blue-500/30',
    borderClass: 'border-blue-500',
    glowBg: 'bg-blue-50/90',
    scoreColor: 'text-blue-600',
    lightBorder: 'border-blue-200'
  },
  { 
    name: 'ក្រុមទី៣', 
    color: '#f59e0b', 
    headerBg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600', 
    badgeBg: 'bg-amber-600',
    activeRing: 'ring-4 ring-amber-400/60 shadow-amber-500/30',
    borderClass: 'border-amber-500',
    glowBg: 'bg-amber-50/90',
    scoreColor: 'text-amber-600',
    lightBorder: 'border-amber-200'
  },
  { 
    name: 'ក្រុមទី៤', 
    color: '#10b981', 
    headerBg: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600', 
    badgeBg: 'bg-emerald-600',
    activeRing: 'ring-4 ring-emerald-400/60 shadow-emerald-500/30',
    borderClass: 'border-emerald-500',
    glowBg: 'bg-emerald-50/90',
    scoreColor: 'text-emerald-600',
    lightBorder: 'border-emerald-200'
  },
];

export type SpecialCardType = 'none' | 'bonus_15' | 'bonus_25' | 'lose_10' | 'swap_score' | 'steal_10';

export interface GameCard {
  id: number;
  wordItem?: WordItem;
  points: number;
  isOpened: boolean;
  openedByTeamId?: string;
  specialType: SpecialCardType;
  cardMode?: 'puzzle' | 'reading' | 'sentence' | 'search';
}

interface TeamCardsProps {
  words: WordItem[];
  onBack: () => void;
}

const DEFAULT_TEAMS: Team[] = [
  { id: 'team_1', name: 'ក្រុមទី១', score: 0, color: '#ec4899', bgClass: 'bg-pink-500', borderClass: 'border-pink-500', badgeBg: 'bg-rose-500' },
  { id: 'team_2', name: 'ក្រុមទី២', score: 0, color: '#3b82f6', bgClass: 'bg-blue-500', borderClass: 'border-blue-500', badgeBg: 'bg-blue-600' },
];

// Helper to split Khmer word into visual grid units (preserving co-engrossers)
function splitKhmerWordToUnits(word: string): string[] {
  const units: string[] = [];
  let i = 0;
  while (i < word.length) {
    const char = word[i];
    if (char === '\u17D2' && i + 1 < word.length) {
      units.push('\u17D2' + word[i + 1]);
      i += 2;
    } else {
      units.push(char);
      i++;
    }
  }
  return units;
}

interface CellCoords {
  r: number;
  c: number;
}

export default function TeamCards({ words, onBack }: TeamCardsProps) {
  // Game Mode: 'puzzle' | 'reading' | 'search'
  const [gameMode, setGameMode] = useState<TeamGameMode>('puzzle');

  // Game Configuration
  const [teamCount, setTeamCount] = useState<number>(2);
  const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
  const [activeTeamIdx, setActiveTeamIdx] = useState<number>(0);
  const [cardGridCount, setCardGridCount] = useState<number>(16);
  const [defaultPoints, setDefaultPoints] = useState<number>(15);
  const [enableSurprises, setEnableSurprises] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ទាំងអស់');
  const [difficulty, setDifficulty] = useState<'ងាយស្រួល' | 'មធ្យម' | 'លំបាក'>('មធ្យម');
  const [searchGridSize, setSearchGridSize] = useState<number>(10);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cardTheme, setCardTheme] = useState<CardColorTheme>('rainbow');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Active Game State
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Common Card State
  const [resultState, setResultState] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mode 1: Word Puzzle State
  const [pool, setPool] = useState<string[]>([]);
  const [assembled, setAssembled] = useState<string[]>([]);
  const [prefilledIndices, setPrefilledIndices] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showError, setShowError] = useState<boolean>(false);
  const [lastFilledIdx, setLastFilledIdx] = useState<number | null>(null);

  // Mode 3: Mini Word Search State
  const [searchGrid, setSearchGrid] = useState<string[][]>([]);
  const [wordCoords, setWordCoords] = useState<CellCoords[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<CellCoords[]>([]);
  const [revealedSearch, setRevealedSearch] = useState<boolean>(false);

  // Filtered source words
  const eligibleWords = useMemo(() => {
    if (filterType === 'ទាំងអស់') return words;
    return words.filter(w => w.wordType === filterType);
  }, [words, filterType]);

  // Generate Deck of Cards
  const initGame = useCallback((customCardCount = cardGridCount, customTeams = teams) => {
    if (eligibleWords.length === 0) return;

    const resetTeams = customTeams.map(t => ({ ...t, score: 0 }));
    setTeams(resetTeams);
    setActiveTeamIdx(0);
    setGameOver(false);
    setSelectedCard(null);

    // Filter single words vs sentences strictly
    const allSingleWords = words.filter(w => !isSentenceItem(w));
    const allSentenceWords = words.filter(w => isSentenceItem(w));

    const singleWordList = eligibleWords.filter(w => !isSentenceItem(w));
    const sentenceList = eligibleWords.filter(w => isSentenceItem(w));

    // Strict non-crossing fallbacks!
    const validSingleWords = singleWordList.length > 0 ? singleWordList : (allSingleWords.length > 0 ? allSingleWords : words);
    const validSentenceWords = sentenceList.length > 0 ? sentenceList : (allSentenceWords.length > 0 ? allSentenceWords : DEFAULT_SENTENCES);

    const strictSingleWords = validSingleWords.filter(w => !isSentenceItem(w));
    const finalSingleWords = strictSingleWords.length > 0 ? strictSingleWords : words;

    const strictSentenceWords = validSentenceWords.filter(w => isSentenceItem(w));
    const finalSentenceWords = strictSentenceWords.length > 0 ? strictSentenceWords : DEFAULT_SENTENCES;

    const shuffledSingle = [...finalSingleWords].sort(() => Math.random() - 0.5);
    const shuffledSentence = [...finalSentenceWords].sort(() => Math.random() - 0.5);

    const newCards: GameCard[] = [];

    const surprisePool: SpecialCardType[] = ['bonus_15', 'steal_10', 'lose_10', 'swap_score', 'bonus_25'];
    const surpriseSlots = new Set<number>();
    
    if (enableSurprises && customCardCount >= 6) {
      const numSurprises = Math.max(1, Math.floor(customCardCount / 6));
      while (surpriseSlots.size < numSurprises) {
        const rSlot = Math.floor(Math.random() * customCardCount);
        surpriseSlots.add(rSlot);
      }
    }

    const subModes: ('puzzle' | 'reading' | 'sentence' | 'search')[] = ['puzzle', 'reading', 'sentence', 'search'];
    const mixedModesPattern: ('puzzle' | 'reading' | 'sentence' | 'search')[] = [];
    for (let i = 0; i < customCardCount; i++) {
      mixedModesPattern.push(subModes[i % subModes.length]);
    }
    // Shuffle the sequence for unexpected fun in mixed mode
    mixedModesPattern.sort(() => Math.random() - 0.5);

    let singleIdx = 0;
    let sentenceIdx = 0;

    for (let i = 0; i < customCardCount; i++) {
      const isSurprise = surpriseSlots.has(i);
      let specialType: SpecialCardType = 'none';
      if (isSurprise) {
        specialType = surprisePool[Math.floor(Math.random() * surprisePool.length)];
      }

      const assignedCardMode = gameMode === 'mixed' 
        ? mixedModesPattern[i] 
        : gameMode;

      let assignedWord: WordItem;
      if (assignedCardMode === 'sentence') {
        // Sentence mode strictly gets sentence items!
        assignedWord = shuffledSentence[sentenceIdx % shuffledSentence.length];
        sentenceIdx++;
      } else {
        // Word modes (puzzle, reading, search) strictly get single words!
        assignedWord = shuffledSingle[singleIdx % shuffledSingle.length];
        singleIdx++;
      }

      newCards.push({
        id: i + 1,
        wordItem: assignedWord,
        points: defaultPoints,
        isOpened: false,
        specialType,
        cardMode: assignedCardMode
      });
    }

    setCards(newCards);
    if (soundEnabled) playSuccessSound();
  }, [eligibleWords, enableSurprises, cardGridCount, defaultPoints, teams, soundEnabled, gameMode, words]);

  useEffect(() => {
    initGame();
  }, [filterType, enableSurprises, cardGridCount, defaultPoints, gameMode]);

  // Adjust Teams Array when count changes
  useEffect(() => {
    setTeams(prev => {
      const nextTeams: Team[] = [];
      for (let i = 0; i < teamCount; i++) {
        const existing = prev[i];
        if (existing) {
          nextTeams.push(existing);
        } else {
          const c = TEAM_PRESETS[i % TEAM_PRESETS.length];
          nextTeams.push({
            id: `team_${i + 1}`,
            name: c.name,
            score: 0,
            color: c.color,
            bgClass: 'bg-pink-500',
            borderClass: c.borderClass,
            badgeBg: c.badgeBg
          });
        }
      }
      return nextTeams;
    });
    setActiveTeamIdx(0);
  }, [teamCount]);

  // Countdown timer per card
  useEffect(() => {
    if (selectedCard && timerSeconds > 0 && resultState === 'unanswered' && selectedCard.specialType === 'none') {
      setTimeLeft(timerSeconds);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (soundEnabled) playFailSound();
            // Time out: reveal correct answer and mark as wrong (0 points)
            if (selectedCard?.wordItem) {
              setAssembled([...selectedCard.wordItem.parts]);
            }
            setResultState('wrong');
            return 0;
          }
          if (soundEnabled && prev <= 6) {
            playTickSound();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedCard, timerSeconds, resultState, soundEnabled]);

  // Initialize Word Puzzle for current card
  const initCardPuzzle = useCallback((card: GameCard) => {
    if (!card.wordItem) return;
    const currentWord = card.wordItem;
    const parts = [...currentWord.parts];
    const targetLength = Math.max(11, parts.length + 3);
    const decoys: string[] = [];
    while (parts.length + decoys.length < targetLength) {
      const randomChar = KHMER_DECOYS[Math.floor(Math.random() * KHMER_DECOYS.length)];
      decoys.push(randomChar);
    }
    const combined = [...parts, ...decoys].sort(() => Math.random() - 0.5);

    // Pre-fill logic based on difficulty
    const initialAssembled = new Array(parts.length).fill('');
    let prefillPercentage = 0;
    if (difficulty === 'ងាយស្រួល') prefillPercentage = 0.7;
    else if (difficulty === 'មធ្យម') prefillPercentage = 0.2;

    const prefillCount = Math.floor(parts.length * prefillPercentage);

    let indicesToPrefill: number[] = [];
    if (prefillCount > 0) {
      const indices = Array.from({ length: parts.length }, (_, i) => i);
      const shuffledIndices = indices.sort(() => Math.random() - 0.5);
      indicesToPrefill = shuffledIndices.slice(0, prefillCount);

      indicesToPrefill.forEach(idx => {
        initialAssembled[idx] = parts[idx];
        const poolIndex = combined.indexOf(parts[idx]);
        if (poolIndex > -1) {
          combined.splice(poolIndex, 1);
        }
      });
    }

    setPool(combined);
    setAssembled(initialAssembled);
    setPrefilledIndices(indicesToPrefill);
    setLastFilledIdx(null);

    const firstEmpty = initialAssembled.findIndex(x => x === '');
    setSelectedIndex(firstEmpty !== -1 ? firstEmpty : 0);
    setResultState('unanswered');
    setShowError(false);
  }, [difficulty]);

  // Initialize Word Search Grid for current card (Mode 3)
  const initCardWordSearch = useCallback((card: GameCard) => {
    if (!card.wordItem) return;
    const units = splitKhmerWordToUnits(card.wordItem.word);
    // Minimum 10x10 (or searchGridSize), can expand if word length exceeds it
    const size = Math.max(searchGridSize, units.length);
    
    // Create empty grid
    const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal
    ];

    let placed = false;
    let placedCoords: CellCoords[] = [];
    let attempts = 0;

    while (!placed && attempts < 100) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const maxR = size - (dir.dr * units.length);
      const maxC = size - (dir.dc * units.length);

      if (maxR > 0 && maxC > 0) {
        const r = Math.floor(Math.random() * maxR);
        const c = Math.floor(Math.random() * maxC);

        placedCoords = [];
        for (let i = 0; i < units.length; i++) {
          const currR = r + dir.dr * i;
          const currC = c + dir.dc * i;
          grid[currR][currC] = units[i];
          placedCoords.push({ r: currR, c: currC });
        }
        placed = true;
      }
    }

    // Fill remaining with random Khmer characters
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) {
          grid[r][c] = KHMER_DECOYS[Math.floor(Math.random() * KHMER_DECOYS.length)];
        }
      }
    }

    setSearchGrid(grid);
    setWordCoords(placedCoords);
    setSelectedCoords([]);
    setRevealedSearch(false);
    setResultState('unanswered');
  }, []);

  // Open Card
  const handleCardClick = (card: GameCard) => {
    if (card.isOpened || selectedCard) return;
    if (soundEnabled) playClickSound();

    setSelectedCard(card);
    setResultState('unanswered');

    if (card.specialType === 'none') {
      const modeToPlay = card.cardMode || gameMode;
      if (modeToPlay === 'puzzle') {
        initCardPuzzle(card);
      } else if (modeToPlay === 'search') {
        initCardWordSearch(card);
      } else if (modeToPlay === 'reading' || modeToPlay === 'sentence') {
        // Auto pronounce softly if sound is enabled
        if (soundEnabled && card.wordItem?.word) {
          speakText(card.wordItem.word);
        }
      }
    } else {
      if (soundEnabled) playWinSound();
    }
  };

  // Mode 1: Letter clicked from pool
  const handlePoolClick = (letter: string) => {
    if (resultState !== 'unanswered') return;
    if (soundEnabled) playClickSound();

    if (selectedIndex < assembled.length) {
      const currentFillTarget = selectedIndex;
      const newAssembled = [...assembled];
      newAssembled[currentFillTarget] = letter;
      setAssembled(newAssembled);
      setLastFilledIdx(currentFillTarget);

      let nextIndex = currentFillTarget + 1;
      while (nextIndex < newAssembled.length && newAssembled[nextIndex] !== '') {
        nextIndex++;
      }
      if (nextIndex >= newAssembled.length) {
        const firstEmpty = newAssembled.findIndex(x => x === '');
        if (firstEmpty !== -1) {
          setSelectedIndex(firstEmpty);
        } else {
          setSelectedIndex(newAssembled.length);
        }
      } else {
        setSelectedIndex(nextIndex);
      }
      setShowError(false);
    }
  };

  // Mode 1: Box clicked
  const handleBoxClick = (index: number) => {
    if (resultState !== 'unanswered' || prefilledIndices.includes(index)) return;
    if (soundEnabled) playClickSound();
    setSelectedIndex(index);
    setShowError(false);
  };

  // Mode 3: Cell Click in Word Search Grid
  const handleSearchCellClick = (r: number, c: number) => {
    if (resultState !== 'unanswered') return;
    if (soundEnabled) playClickSound();

    const alreadyIdx = selectedCoords.findIndex(coord => coord.r === r && coord.c === c);
    let nextCoords: CellCoords[];
    if (alreadyIdx > -1) {
      nextCoords = selectedCoords.filter((_, i) => i !== alreadyIdx);
    } else {
      nextCoords = [...selectedCoords, { r, c }];
    }
    setSelectedCoords(nextCoords);

    // Check if user has selected all coordinates of the target word
    if (wordCoords.length > 0 && nextCoords.length === wordCoords.length) {
      const allMatch = wordCoords.every(wc => 
        nextCoords.some(sc => sc.r === wc.r && sc.c === wc.c)
      );
      if (allMatch) {
        if (soundEnabled) playSuccessSound();
        setResultState('correct');
      }
    }
  };

  const handleVerifyWordSearch = () => {
    if (wordCoords.length === 0) return;
    const allMatch = wordCoords.length === selectedCoords.length && wordCoords.every(wc => 
      selectedCoords.some(sc => sc.r === wc.r && sc.c === wc.c)
    );
    if (allMatch) {
      if (soundEnabled) playSuccessSound();
      setResultState('correct');
    } else {
      if (soundEnabled) playFailSound();
      setResultState('wrong');
    }
  };

  // Award Points and advance turn
  const handleAwardResult = (isCorrect: boolean) => {
    if (!selectedCard) return;

    const currentTeam = teams[activeTeamIdx];
    let scoreChange = 0;

    if (selectedCard.specialType !== 'none') {
      if (selectedCard.specialType === 'bonus_15') scoreChange = 15;
      else if (selectedCard.specialType === 'bonus_25') scoreChange = 25;
      else if (selectedCard.specialType === 'lose_10') scoreChange = -10;
      else if (selectedCard.specialType === 'steal_10') {
        const otherTeams = teams.filter((_, i) => i !== activeTeamIdx);
        if (otherTeams.length > 0) {
          const maxOther = otherTeams.reduce((prev, curr) => (prev.score > curr.score ? prev : curr));
          setTeams(prev => prev.map(t => {
            if (t.id === maxOther.id) return { ...t, score: Math.max(0, t.score - 10) };
            return t;
          }));
          scoreChange = 10;
        }
      } else if (selectedCard.specialType === 'swap_score') {
        const otherIdx = (activeTeamIdx + 1) % teams.length;
        setTeams(prev => {
          const newT = [...prev];
          const temp = newT[activeTeamIdx].score;
          newT[activeTeamIdx].score = newT[otherIdx].score;
          newT[otherIdx].score = temp;
          return newT;
        });
      }
    } else {
      if (isCorrect) {
        scoreChange = selectedCard.points;
      }
    }

    if (scoreChange > 0 || isCorrect) {
      if (soundEnabled) playSuccessSound();
    } else {
      if (soundEnabled) playFailSound();
    }

    setTeams(prev => prev.map((t, idx) => {
      if (idx === activeTeamIdx && scoreChange !== 0) {
        return { ...t, score: Math.max(0, t.score + scoreChange) };
      }
      return t;
    }));

    setCards(prev => prev.map(c => {
      if (c.id === selectedCard.id) {
        return { ...c, isOpened: true, openedByTeamId: currentTeam.id };
      }
      return c;
    }));

    setSelectedCard(null);
    setResultState('unanswered');
    setActiveTeamIdx(prev => (prev + 1) % teams.length);

    const remainingUnopened = cards.filter(c => c.id !== selectedCard.id && !c.isOpened).length;
    if (remainingUnopened === 0) {
      setGameOver(true);
      if (soundEnabled) playWinSound();
    }
  };

  // Check action for Word Puzzle (ផ្ទៀងផ្ទាត់ចម្លើយ)
  const handleCheck = () => {
    if (!selectedCard?.wordItem) return;

    if (assembled.includes('')) {
      if (soundEnabled) playFailSound();
      setShowError(true);
      return;
    }

    const isMatch = assembled.join('') === selectedCard.wordItem.parts.join('');
    if (isMatch) {
      if (soundEnabled) playSuccessSound();
      setResultState('correct');
      setShowError(false);
      setSelectedIndex(-1);
    } else {
      if (soundEnabled) playFailSound();
      // Reveal correct word in the boxes for clear learning
      setAssembled([...selectedCard.wordItem.parts]);
      setResultState('wrong');
      setShowError(true);
      setSelectedIndex(-1);
    }
  };

  // Adjust score manually (+ / -)
  const adjustTeamScore = (teamId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundEnabled) playClickSound();
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t));
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (soundEnabled) playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.score - a.score);
  }, [teams]);

  const winningTeam = sortedTeams[0];

  const getGameModeLabel = (mode: TeamGameMode) => {
    switch (mode) {
      case 'puzzle': return { title: 'ល្បែងផ្គុំពាក្យ', icon: Puzzle, color: 'text-amber-500', bg: 'bg-amber-100' };
      case 'reading': return { title: 'ល្បែងអានពាក្យ', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'sentence': return { title: 'ល្បែងអានល្បះ', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' };
      case 'search': return { title: 'ល្បែងស្វែងរកពាក្យ', icon: Search, color: 'text-emerald-500', bg: 'bg-emerald-100' };
      case 'mixed': return { title: 'ល្បែងចម្រុះ', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100' };
    }
  };

  const activeModeConfig = getGameModeLabel(gameMode);
  const ModeIcon = activeModeConfig.icon;

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#f39c12]/20 select-none relative font-sans">
      
      {/* Top Banner (Modern Dynamic Header & Team Scoreboard - Fixed at Top) */}
      <div className="sticky top-0 z-30 shrink-0 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-lg flex items-center justify-between border-b-4 border-amber-600/70">
        
        {/* Teams and Scores Display (Aligned to Left) */}
        <div className="flex items-center justify-start flex-1 gap-2.5 sm:gap-4 md:gap-5 flex-wrap py-1">
          {teams.map((team, idx) => {
            const isActive = activeTeamIdx === idx;
            const isLeader = winningTeam && winningTeam.id === team.id && team.score > 0;
            const preset = TEAM_PRESETS[idx % TEAM_PRESETS.length];

            return (
              <div 
                key={team.id}
                onClick={() => {
                  if (!isActive) {
                    playClickSound();
                    setActiveTeamIdx(idx);
                  }
                }}
                className={`relative flex items-center gap-2 sm:gap-3.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-200 cursor-pointer select-none ${
                  isActive 
                    ? `bg-white shadow-xl scale-105 sm:scale-110 border-2 ${preset.borderClass} ${preset.activeRing} z-10` 
                    : 'bg-white/85 hover:bg-white border-2 border-white/70 hover:border-amber-300 shadow-md hover:scale-102 opacity-90 hover:opacity-100'
                }`}
                title={isActive ? `${team.name} (កំពុងលេង)` : `ចុចដើម្បីប្តូរវេនទៅ ${team.name}`}
              >
                {/* Active Turn Floating Badge */}
                {isActive && (
                  <div className="absolute -top-3 left-3 bg-stone-900 text-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-amber-400/50 animate-pulse">
                    <Flame size={11} className="fill-amber-400 text-amber-400" />
                    <span>វេនលេង</span>
                  </div>
                )}

                {/* Leading Team Crown */}
                {isLeader && (
                  <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 p-1 rounded-full shadow-md border-2 border-white animate-bounce" title="ក្រុមនាំមុខគេ">
                    <Crown size={12} className="fill-amber-950 text-amber-950" />
                  </div>
                )}

                {/* Team Name Pill */}
                <div className="flex flex-col">
                  <div className={`px-3 sm:px-4 py-1.5 rounded-xl text-white font-black text-xs sm:text-sm tracking-wide flex items-center gap-1 shadow-xs ${preset.headerBg}`}>
                    <span>{team.name}</span>
                  </div>
                </div>

                {/* Score Counter Box (Clean & Modern, No +/- buttons) */}
                <div className="flex items-center gap-1.5 bg-stone-100/95 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 font-mono tracking-tight">
                    {team.score}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-stone-500">
                    ពិន្ទុ
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => { playClickSound(); setShowSettingsModal(true); }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 hover:bg-white active:scale-90 text-stone-700 hover:text-amber-600 flex items-center justify-center shadow-sm hover:shadow transition-all duration-150 cursor-pointer border border-stone-200/80"
            title="ការកំណត់ល្បែង"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 hover:bg-white active:scale-90 text-stone-700 hover:text-amber-600 flex items-center justify-center shadow-sm hover:shadow transition-all duration-150 cursor-pointer border border-stone-200/80 hidden sm:flex"
            title="ពេញអេក្រង់"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          <button
            onClick={() => { playClickSound(); onBack(); }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center shadow-sm hover:shadow transition-all duration-150 cursor-pointer border border-rose-600 ml-1"
            title="ចាកចេញទៅផ្ទាំងដើម"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Scrollable View of Numbered Cards */}
      <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 md:p-8 flex flex-col items-center">
        <div className="max-w-7xl w-full mx-auto my-auto flex flex-col justify-center pb-8">
        
        {/* Active Turn Notification Pill */}
        <div className="text-center mb-4 flex items-center justify-center gap-2 flex-wrap">
          <div className="bg-amber-100 border-2 border-amber-300 text-stone-800 px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2">
            <span>វេនជ្រើសរើសកាត ៖</span>
            <span className={`px-2.5 py-0.5 rounded-full text-white font-black ${teams[activeTeamIdx]?.badgeBg || 'bg-pink-500'}`}>
              {teams[activeTeamIdx]?.name}
            </span>
            <span className="text-stone-500 text-xs hidden sm:inline"> (ចុចលើលេខកាតដើម្បីបើក)</span>
          </div>
        </div>

        {/* The Card Grid - Fast CSS Hardware-Accelerated 60/120fps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {cards.map((card, idx) => {
            const isOpened = card.isOpened;
            const openedTeam = teams.find(t => t.id === card.openedByTeamId);
            const style = getCardStyle(idx, cardTheme);

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={isOpened}
                className={`h-28 sm:h-36 md:h-44 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center font-black relative overflow-hidden cursor-pointer will-change-transform transform-gpu transition-all duration-150 ${
                  isOpened
                    ? 'bg-stone-200 border-4 border-stone-300 opacity-60 cursor-not-allowed shadow-none scale-[0.98]'
                    : `${style.bg} ${style.hover} hover:-translate-y-1.5 hover:scale-[1.02] active:scale-95 active:translate-y-1 border-4 ${style.border} text-white ${style.shadow}`
                }`}
              >
                {!isOpened && (
                  <div className="absolute top-2 left-4 right-4 h-6 bg-white/20 rounded-full pointer-events-none" />
                )}

                {isOpened ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl text-stone-400 font-bold">#{card.id}</span>
                    {openedTeam && (
                      <span className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full mt-1.5 shadow-xs ${openedTeam.badgeBg}`}>
                        {openedTeam.name}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl sm:text-6xl md:text-7xl text-white font-['Impact',sans-serif] tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                      {card.id}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-6 flex items-center justify-between text-xs sm:text-sm font-bold text-stone-700 bg-white/80 p-3 rounded-2xl border border-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-extrabold">កាតដែលនៅសល់ ៖</span>
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg font-mono">
              {cards.filter(c => !c.isOpened).length} / {cards.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => initGame()}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer border border-stone-300"
            >
              <RotateCcw size={14} />
              <span>ចែកកាតថ្មី</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* POPUP / MODAL: FAST, SNAPPY & CRISP POPPING ANIMATION (No X button) */}
      <AnimatePresence>
        {selectedCard && (() => {
          const cardModeToRender = selectedCard.cardMode || gameMode;
          const modalWidthClass = cardModeToRender === 'reading' 
            ? 'w-full max-w-6xl lg:max-w-7xl mx-auto' 
            : cardModeToRender === 'search' 
            ? 'w-full max-w-5xl lg:max-w-6xl mx-auto' 
            : 'w-full max-w-6xl lg:max-w-7xl mx-auto';

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/65">
              {resultState === 'unanswered' ? (
                <motion.div
                  key="card-modal"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.88, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col relative max-h-[95vh] transform-gpu will-change-transform ${modalWidthClass}`}
                >
                {/* Minimal Top Header info */}
              <div className="px-5 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between border-b border-stone-100 gap-3 w-full">
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-black text-xs sm:text-sm rounded-full">
                    កាតលេខ #{selectedCard.id}
                  </span>
                  <span className={`px-3 py-1 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs ${teams[activeTeamIdx].badgeBg}`}>
                    {teams[activeTeamIdx].name}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                  {/* Target Word or Mode Badge displayed on the right */}
                  {selectedCard.specialType === 'none' && selectedCard.wordItem && (() => {
                    if (cardModeToRender === 'puzzle') {
                      return (
                        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-amber-50 border-2 border-amber-400 text-amber-900 rounded-full text-xs sm:text-sm md:text-base font-bold shadow-2xs">
                          <Sparkles size={16} className="text-amber-500 shrink-0" strokeWidth={2.5} />
                          <span>ផ្គុំពាក្យ</span>
                        </div>
                      );
                    }
                    return (
                      <div className={`flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 border-2 rounded-full text-xs sm:text-sm md:text-base font-bold shadow-2xs ${
                        cardModeToRender === 'sentence'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                          : cardModeToRender === 'search'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : 'bg-blue-50 border-blue-400 text-blue-900'
                      }`}>
                        {cardModeToRender === 'search' ? (
                          <Search size={16} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                        ) : cardModeToRender === 'sentence' ? (
                          <FileText size={16} className="text-indigo-600 shrink-0" strokeWidth={2.5} />
                        ) : (
                          <BookOpen size={16} className="text-blue-500 shrink-0" strokeWidth={2.5} />
                        )}
                        <span>
                          {cardModeToRender === 'search' ? 'ស្វែងរកពាក្យ ៖ ' : cardModeToRender === 'sentence' ? '' : 'អានពាក្យ ៖ '}
                          <span className="font-black text-sm sm:text-base md:text-lg ml-0.5">
                            {cardModeToRender === 'sentence' ? formatSentenceText(selectedCard.wordItem.word) : `« ${selectedCard.wordItem.word} »`}
                          </span>
                        </span>
                      </div>
                    );
                  })()}

                  {timerSeconds > 0 && selectedCard.specialType === 'none' && resultState === 'unanswered' && (
                    <div className="flex items-center gap-1.5 bg-stone-100 text-stone-700 px-3 py-1 rounded-full font-mono font-bold text-xs">
                      <Clock size={14} className={timeLeft <= 5 ? 'text-red-500 animate-spin' : 'text-stone-500'} />
                      <span className={timeLeft <= 5 ? 'text-red-600 font-black' : ''}>{timeLeft}s</span>
                    </div>
                  )}

                  {/* Close / Forfeit Button (X) */}
                  <button
                    onClick={() => {
                      if (soundEnabled) playFailSound();
                      setResultState('wrong');
                    }}
                    title="បោះបង់ (ទទួលបាន ០ ពិន្ទុ)"
                    aria-label="បោះបង់ (០ ពិន្ទុ)"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 hover:bg-rose-100 active:scale-95 text-stone-500 hover:text-rose-600 border border-stone-200 hover:border-rose-300 flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Card Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center gap-4 bg-white">
                
                {/* CASE 0: SPECIAL SURPRISE CARD */}
                {selectedCard.specialType !== 'none' ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl p-6">
                    <motion.div 
                      initial={{ scale: 0.5, rotate: -15 }}
                      animate={{ scale: [0.5, 1.15, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.35 }}
                      className="w-24 h-24 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shadow-inner border-4 border-amber-300"
                    >
                      {selectedCard.specialType.includes('bonus') && <Sparkles size={48} className="text-amber-500" />}
                      {selectedCard.specialType === 'lose_10' && <Flame size={48} className="text-rose-500" />}
                      {selectedCard.specialType === 'steal_10' && <Zap size={48} className="text-indigo-500" />}
                      {selectedCard.specialType === 'swap_score' && <ArrowRightLeft size={48} className="text-cyan-500" />}
                    </motion.div>

                    <div className="space-y-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
                        {selectedCard.specialType === 'bonus_15' && '🎉 ទទួលបាន ១៥ ពិន្ទុឥតគិតថ្លៃ!'}
                        {selectedCard.specialType === 'bonus_25' && '🌟 មហាអំណោយ ២៥ ពិន្ទុ!'}
                        {selectedCard.specialType === 'lose_10' && '💥 អូហូ! ដក ១០ ពិន្ទុ!'}
                        {selectedCard.specialType === 'steal_10' && '⚡ លួច ១០ ពិន្ទុពីក្រុមនាំមុខ!'}
                        {selectedCard.specialType === 'swap_score' && '🔄 ប្ដូរពិន្ទុជាមួយក្រុមបន្ទាប់!'}
                      </h3>
                      <p className="text-sm font-bold text-stone-600">
                        កាតសំណាងពិសេស បានធ្លាក់លើ {teams[activeTeamIdx].name}
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => handleAwardResult(true)}
                        className="px-8 py-3 bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 text-white rounded-2xl font-black text-base shadow-lg transition-transform duration-150 cursor-pointer"
                      >
                        យល់ព្រមទទួល (Accept & Continue)
                      </button>
                    </div>
                  </div>
                ) : cardModeToRender === 'puzzle' ? (
                  /* ======================================================== */
                  /* CASE 1: WORD PUZZLE VIEW (ល្បែងផ្គុំពាក្យ) */
                  /* ======================================================== */
                  <div className="flex flex-col gap-4 sm:gap-6 w-full">
                    
                    {/* Top Boxes Area */}
                    <div className="flex flex-wrap justify-center content-center gap-2 sm:gap-3.5 py-3 sm:py-5 min-h-[110px]">
                      {assembled.map((char, idx) => {
                        const isSelected = selectedIndex === idx;
                        const isFilled = char !== '';
                        const isPrefilled = prefilledIndices.includes(idx);
                        const correctChar = selectedCard.wordItem?.parts[idx];
                        const isJustFilled = lastFilledIdx === idx;

                        let sizeClasses = "w-14 h-18 sm:w-16 sm:h-22 md:w-20 md:h-26 xl:w-24 xl:h-28 text-2xl sm:text-3xl md:text-4xl";
                        if (assembled.length >= 12) {
                          sizeClasses = "w-9 h-13 sm:w-11 sm:h-16 md:w-13 md:h-18 lg:w-15 lg:h-22 text-lg sm:text-xl md:text-2xl lg:text-3xl";
                        } else if (assembled.length >= 10) {
                          sizeClasses = "w-10 h-14 sm:w-12 sm:h-18 md:w-14 md:h-20 lg:w-17 lg:h-24 text-xl sm:text-2xl md:text-3xl lg:text-4xl";
                        } else if (assembled.length >= 7) {
                          sizeClasses = "w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-22 lg:w-20 lg:h-26 text-xl sm:text-2xl md:text-3xl lg:text-4xl";
                        }

                        let boxClasses = `${sizeClasses} rounded-2xl flex items-center justify-center font-bold cursor-pointer will-change-transform transform-gpu transition-colors duration-150 `;

                        if (resultState === 'correct') {
                          boxClasses += " bg-[#E8F5E9] border-2 border-[#4CAF50] border-b-[6px] text-[#4CAF50] shadow-md shadow-green-100";
                        } else if (resultState === 'wrong') {
                          boxClasses += " bg-rose-50 border-2 border-rose-500 border-b-[6px] text-rose-600 shadow-md shadow-rose-100";
                        } else if (showError && isFilled && char !== correctChar) {
                          boxClasses += " bg-red-50 border-2 border-red-500 border-b-[6px] text-red-500";
                        } else if (isFilled) {
                          if (isPrefilled) {
                            boxClasses += " bg-white border-2 border-gray-200 border-b-[#1C60F4] border-b-[6px] text-[#1C60F4]";
                          } else {
                            boxClasses += " bg-white border-2 border-[#FDBF47] border-b-[#F59E0B] border-b-[6px] text-[#FF6600]";
                          }
                        } else if (isSelected) {
                          boxClasses += " bg-[#FFF3D6] border-2 border-[#FDBF47] border-b-[6px] border-b-[#F59E0B] shadow-sm";
                        } else {
                          boxClasses += " bg-white border-2 border-dashed border-[#FDBF47] hover:border-amber-400";
                        }

                        return (
                          <motion.div 
                            key={idx} 
                            onClick={() => handleBoxClick(idx)} 
                            className={boxClasses}
                            animate={
                              showError && isFilled && char !== correctChar
                                ? { x: [-8, 8, -6, 6, -3, 3, 0] }
                                : isJustFilled
                                ? { scale: [0.85, 1.12, 1] }
                                : resultState === 'correct'
                                ? { scale: [1, 1.12, 1], y: [0, -6, 0] }
                                : resultState === 'wrong'
                                ? { scale: [0.95, 1.05, 1] }
                                : {}
                            }
                            transition={{ duration: resultState !== 'unanswered' ? 0.28 : 0.18, ease: 'easeOut' }}
                          >
                            {char}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Middle Character Pool Area */}
                    {resultState === 'unanswered' && (
                      <div className="bg-[#F8FAFC] rounded-[24px] p-4 sm:p-5 border border-gray-100">
                        <div className="flex justify-between items-center mb-3 px-1">
                          <span className="text-gray-500 font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-500" />
                            <span>ផ្ទាំងអក្សរសម្រាប់បំពេញ:</span>
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                          {pool.map((char, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => handlePoolClick(char)}
                              className="w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 lg:w-16 lg:h-16 bg-white border border-gray-200 border-b-[4px] border-b-gray-300 rounded-xl flex items-center justify-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#1C60F4] hover:bg-blue-50/50 hover:border-b-blue-300 hover:-translate-y-0.5 active:border-b-0 active:translate-y-1 active:scale-95 transition-all duration-100 cursor-pointer shadow-xs will-change-transform transform-gpu"
                            >
                              {char}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Action / Verify / Continue Button */}
                    <div className="pt-2 flex flex-col items-center justify-center gap-3">
                      {resultState === 'unanswered' && (
                        <button 
                          onClick={handleCheck}
                          className="w-full max-w-xl bg-[#00B47A] hover:bg-[#009A68] active:scale-95 text-white font-bold text-base sm:text-lg rounded-2xl py-3.5 sm:py-4 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer will-change-transform transform-gpu"
                        >
                          <Check size={22} strokeWidth={2.5} />
                          <span>ផ្ទៀងផ្ទាត់ចម្លើយ</span>
                        </button>
                      )}

                      {/* Quick Overrides */}
                      {resultState === 'unanswered' && (
                        <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
                          <button
                            onClick={() => {
                              if (selectedCard?.wordItem) {
                                setAssembled([...selectedCard.wordItem.parts]);
                              }
                              setResultState('wrong');
                              if (soundEnabled) playFailSound();
                            }}
                            className="hover:text-rose-600 active:scale-95 underline cursor-pointer transition-colors"
                          >
                            សម្គាល់ថាខុស (០ ពិន្ទុ)
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => {
                              if (selectedCard?.wordItem) {
                                setAssembled([...selectedCard.wordItem.parts]);
                              }
                              setResultState('correct');
                              if (soundEnabled) playSuccessSound();
                            }}
                            className="hover:text-emerald-600 active:scale-95 underline cursor-pointer transition-colors"
                          >
                            សម្គាល់ថាត្រូវ (+{selectedCard.points})
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ) : cardModeToRender === 'reading' ? (
                  /* ======================================================== */
                  /* CASE 2: WORD READING VIEW (ល្បែងអានពាក្យ) */
                  /* ======================================================== */
                  <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 w-full py-8 px-4 sm:px-8">
                    
                    {/* Big Clean Word Card Display (Word Only) */}
                    <div className="w-full max-w-4xl bg-stone-50/70 rounded-3xl py-12 px-6 sm:py-16 sm:px-10 border-2 border-stone-200/80 shadow-xs flex items-center justify-center min-h-[220px] sm:min-h-[280px]">
                      {(() => {
                        const wordText = selectedCard.wordItem?.word || '';
                        const fontSizeClass = wordText.length > 30 ? "text-2xl sm:text-3xl md:text-4xl" : "text-4xl sm:text-5xl md:text-6xl";
                        return (
                          <h2 className={`${fontSizeClass} font-black text-stone-900 tracking-wide font-sans select-text text-center break-words leading-tight`}>
                            {wordText}
                          </h2>
                        );
                      })()}
                    </div>

                    {/* Result / Decision Action Buttons */}
                    <div className="w-full max-w-xl flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => {
                          handleAwardResult(false);
                        }}
                        className="flex-1 py-4 bg-stone-100 hover:bg-rose-50 hover:border-rose-300 active:scale-95 text-stone-700 hover:text-rose-700 font-black text-base sm:text-lg rounded-2xl border-2 border-stone-300 flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer"
                      >
                        <X size={22} className="text-rose-500" strokeWidth={3} />
                        <span>អានមិនទាន់ត្រូវ (០ ពិន្ទុ)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleAwardResult(true);
                        }}
                        className="flex-1 py-4 bg-[#00B47A] hover:bg-[#009A68] active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                      >
                        <Check size={24} strokeWidth={3} />
                        <span>អានបានត្រឹមត្រូវ (+{selectedCard.points} ពិន្ទុ)</span>
                      </button>
                    </div>

                  </div>
                ) : cardModeToRender === 'sentence' ? (
                  /* ======================================================== */
                  /* CASE 3: SENTENCE READING VIEW (ល្បែងអានល្បះ) */
                  /* ======================================================== */
                  <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 w-full py-8 px-4 sm:px-8">
                    
                    {/* Sentence Reading Card Display */}
                    <div className="w-full max-w-4xl bg-indigo-50/70 rounded-3xl py-12 px-6 sm:py-16 sm:px-10 border-2 border-indigo-200/80 shadow-xs flex flex-col items-center justify-center gap-5 min-h-[220px] sm:min-h-[280px] relative">
                      {(() => {
                        const rawSentence = selectedCard.wordItem?.word || '';
                        const formattedSentence = formatSentenceText(rawSentence);
                        const fontSizeClass = rawSentence.length > 50 ? "text-2xl sm:text-3xl md:text-4xl" : "text-4xl sm:text-5xl md:text-6xl";
                        return (
                          <h2 className={`${fontSizeClass} font-black text-slate-900 tracking-wide font-sans select-text text-center break-words leading-relaxed py-2`}>
                            {formattedSentence}
                          </h2>
                        );
                      })()}
                    </div>

                    {/* Result / Decision Action Buttons */}
                    <div className="w-full max-w-xl flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => {
                          handleAwardResult(false);
                        }}
                        className="flex-1 py-4 bg-stone-100 hover:bg-rose-50 hover:border-rose-300 active:scale-95 text-stone-700 hover:text-rose-700 font-black text-base sm:text-lg rounded-2xl border-2 border-stone-300 flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer"
                      >
                        <X size={22} className="text-rose-500" strokeWidth={3} />
                        <span>អានមិនទាន់ត្រូវ (០ ពិន្ទុ)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleAwardResult(true);
                        }}
                        className="flex-1 py-4 bg-[#00B47A] hover:bg-[#009A68] active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                      >
                        <Check size={24} strokeWidth={3} />
                        <span>អានបានត្រឹមត្រូវ (+{selectedCard.points} ពិន្ទុ)</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  /* ======================================================== */
                  /* CASE 4: WORD SEARCH VIEW (ល្បែងស្វែងរកពាក្យ) */
                  /* ======================================================== */
                  <div className="flex flex-col items-center justify-center gap-4 w-full">
                    
                    {/* Mini Word Search Interactive Grid */}
                    <div className="bg-white p-2 sm:p-4 rounded-3xl border-2 border-stone-200 shadow-md flex flex-col items-center justify-center max-w-full overflow-x-auto">
                      <div 
                        className="grid gap-1 sm:gap-1.5 justify-center"
                        style={{ gridTemplateColumns: `repeat(${searchGrid.length}, minmax(0, 1fr))` }}
                      >
                        {searchGrid.map((row, r) => 
                          row.map((cellChar, c) => {
                            const isSelected = selectedCoords.some(coord => coord.r === r && coord.c === c);
                            const isCorrectWordCell = wordCoords.some(wc => wc.r === r && wc.c === c);
                            const isRevealed = revealedSearch && isCorrectWordCell;
                            const isFoundSuccess = resultState === 'correct' && isCorrectWordCell;

                            let cellStyle = "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-sm sm:text-base md:text-xl cursor-pointer select-none transition-all duration-100 will-change-transform transform-gpu ";

                            if (isFoundSuccess) {
                              cellStyle += "bg-emerald-500 text-white font-black scale-105 shadow-md shadow-emerald-200 ring-2 ring-emerald-300";
                            } else if (isRevealed) {
                              cellStyle += "bg-amber-400 text-stone-900 font-black scale-105 shadow-sm ring-2 ring-amber-500";
                            } else if (isSelected) {
                              cellStyle += "bg-[#3b82f6] text-white font-black scale-105 shadow-md ring-2 ring-blue-300";
                            } else {
                              cellStyle += "bg-stone-50 hover:bg-blue-50 text-stone-700 border border-stone-200 hover:border-blue-300";
                            }

                            return (
                              <button
                                key={`${r}-${c}`}
                                onClick={() => handleSearchCellClick(r, c)}
                                className={cellStyle}
                              >
                                {cellChar}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </motion.div>
            ) : (
              /* Unified Animated Result Popup Form (Replaces card modal when answering) */
              <motion.div
                key="result-modal"
                initial={{ scale: 0.82, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`w-full max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl border-4 flex flex-col items-center gap-4 bg-white ${
                  resultState === 'correct' ? 'border-emerald-400' : 'border-rose-400'
                }`}
              >
                {resultState === 'correct' ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                      <Check size={48} strokeWidth={3.5} className="animate-bounce" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-emerald-700">ត្រឹមត្រូវ!</h3>
                      <p className="text-lg sm:text-xl font-extrabold text-stone-800">
                        ទទួលបាន <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">+{selectedCard.points}</span> ពិន្ទុ
                      </p>
                      {selectedCard.wordItem && (
                        <div className="mt-3 py-2 px-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-bold text-sm">
                          ពាក្យ ៖ <span className="font-black text-base">« {selectedCard.wordItem.word} »</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAwardResult(true)}
                      className="w-full py-3.5 sm:py-4 bg-[#00B47A] hover:bg-[#009A68] active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
                    >
                      <Star size={20} className="text-yellow-300 fill-yellow-300 animate-spin" />
                      <span>បន្តទៅមុខ</span>
                      <ChevronRight size={22} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                      <X size={48} strokeWidth={3.5} className="animate-pulse" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-rose-700">មិនត្រឹមត្រូវទេ!</h3>
                      <p className="text-lg sm:text-xl font-extrabold text-stone-800">
                        ទទួលបាន <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">០</span> ពិន្ទុ
                      </p>
                      {selectedCard.wordItem && (
                        <div className="mt-3 py-2 px-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 font-bold text-sm">
                          ពាក្យត្រឹមត្រូវគឺ ៖ <span className="font-black text-base">« {selectedCard.wordItem.word} »</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAwardResult(false)}
                      className="w-full py-3.5 sm:py-4 bg-stone-800 hover:bg-stone-900 active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
                    >
                      <span>បន្តទៅវេនបន្ទាប់</span>
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        );
      })()}
      </AnimatePresence>

      {/* GAME OVER / VICTORY MODAL CELEBRATION */}
      <AnimatePresence>
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6 border-4 border-amber-400 transform-gpu will-change-transform"
            >
              <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-500 mx-auto flex items-center justify-center border-4 border-amber-300 shadow-inner">
                <Trophy size={48} className="text-amber-500 animate-bounce" />
              </div>

              <div>
                <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  ចប់ការប្រកួត
                </span>
                <h2 className="text-3xl font-black text-charcoal mt-2">
                  🏆 {winningTeam?.name} ឈ្នះការប្រកួត!
                </h2>
                <p className="text-sm font-bold text-stone-500 mt-1">
                  សូមអបអរសាទរដល់ក្រុមទាំងអស់ដែលបានចូលរួម!
                </p>
              </div>

              {/* Leaderboard Rankings */}
              <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                {sortedTeams.map((team, rank) => (
                  <div 
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-xl font-bold ${
                      rank === 0 ? 'bg-amber-100 border-2 border-amber-300 text-amber-950' : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 text-xs flex items-center justify-center font-black">
                        #{rank + 1}
                      </span>
                      <span className="font-extrabold">{team.name}</span>
                    </div>
                    <span className="text-xl font-black font-mono">
                      {team.score} <span className="text-xs font-sans text-stone-500 font-bold">ពិន្ទុ</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => initGame()}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform duration-150 cursor-pointer"
                >
                  <RotateCcw size={18} />
                  <span>លេងម្ដងទៀត</span>
                </button>

                <button
                  onClick={onBack}
                  className="py-3.5 px-5 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 rounded-2xl font-bold text-sm sm:text-base transition-all duration-150 cursor-pointer border border-stone-300"
                >
                  ផ្ទាំងដើម
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GAME SETTINGS / CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="bg-white w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl rounded-3xl shadow-2xl overflow-hidden border-2 border-stone-200 transform-gpu will-change-transform"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-charcoal text-base sm:text-lg">
                  <Settings size={20} className="text-amber-500" />
                  <span>ការកំណត់ល្បែងបើកកាត</span>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 active:scale-90 text-stone-700 flex items-center justify-center cursor-pointer transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Settings Form */}
              <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
                
                {/* 1. GAME MODE SELECTOR (ល្បែងទាំង ៤) */}
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border-2 border-amber-200">
                  <label className="font-black text-stone-900 block mb-2 text-sm flex items-center gap-1.5">
                    <Award size={16} className="text-amber-600" />
                    <span>ជ្រើសរើសប្រភេទល្បែង ៖</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {(['puzzle', 'reading', 'sentence', 'search', 'mixed'] as const).map(mode => {
                      const modeInfo = getGameModeLabel(mode);
                      const Icon = modeInfo.icon;
                      const isSelected = gameMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => {
                            setGameMode(mode);
                            if (soundEnabled) playClickSound();
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 font-black text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <Icon size={20} className={isSelected ? 'text-white' : modeInfo.color} />
                          <span className="text-xs sm:text-sm">{modeInfo.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. CARD COLOR THEME SELECTOR (ប្ដូរពណ៌កាតចម្រុះ) */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <label className="font-black text-stone-900 block mb-2 text-sm flex items-center gap-1.5">
                    <Palette size={16} className="text-indigo-600" />
                    <span>ពណ៌កាតលើក្ដារ ៖</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {[
                      { id: 'rainbow', label: '🌈 ចម្រុះពណ៌', preview: 'bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500' },
                      { id: 'blue', label: '🔵 ពណ៌ខៀវ', preview: 'bg-blue-500' },
                      { id: 'emerald', label: '🟢 ពណ៌បៃតង', preview: 'bg-emerald-500' },
                      { id: 'amber', label: '🟡 ពណ៌ទឹកក្រូច', preview: 'bg-amber-500' },
                      { id: 'purple', label: '🟣 ពណ៌ស្វាយ', preview: 'bg-purple-500' },
                      { id: 'rose', label: '🔴 ពណ៌ផ្កាឈូក/ក្រហម', preview: 'bg-rose-500' },
                      { id: 'cyan', label: '🌊 ពណ៌ផ្ទៃមេឃ', preview: 'bg-cyan-500' },
                    ].map(item => {
                      const isSelected = cardTheme === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCardTheme(item.id as CardColorTheme);
                            if (soundEnabled) playClickSound();
                          }}
                          className={`p-2.5 rounded-xl border-2 flex items-center gap-2 font-bold text-left transition-all duration-150 cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${item.preview} shrink-0 shadow-xs border border-white/60`} />
                          <span className="text-xs truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team Count */}
                <div>
                  <label className="font-bold text-charcoal block mb-1.5">ចំនួនក្រុម ៖</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setTeamCount(num)}
                        className={`py-2 px-3 rounded-xl border font-bold text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                          teamCount === num
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {num} ក្រុម
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Names Customization */}
                <div>
                  <label className="font-bold text-charcoal block mb-1.5">កែសម្រួលឈ្មោះក្រុម ៖</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {teams.map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setTeams(prev => prev.map((item, i) => i === idx ? { ...item, name: newName } : item));
                          }}
                          className="w-full bg-transparent font-bold text-stone-800 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Count */}
                <div>
                  <label className="font-bold text-charcoal block mb-1.5">ចំនួនកាតលើក្ដារ ៖</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[8, 12, 16, 24].map(count => (
                      <button
                        key={count}
                        onClick={() => { setCardGridCount(count); initGame(count); }}
                        className={`py-2 px-2 rounded-xl border font-bold text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                          cardGridCount === count
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {count} កាត
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty (Shown for Puzzle and Mixed) */}
                {(gameMode === 'puzzle' || gameMode === 'mixed') && (
                  <div>
                    <label className="font-bold text-charcoal block mb-1.5">កម្រិតលំបាកផ្គុំពាក្យ ៖</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['ងាយស្រួល', 'មធ្យម', 'លំបាក'] as const).map(diff => (
                        <button
                          key={diff}
                          onClick={() => setDifficulty(diff)}
                          className={`py-2 px-3 rounded-xl border font-bold text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                            difficulty === diff
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid Size (Shown for Word Search and Mixed) */}
                {(gameMode === 'search' || gameMode === 'mixed') && (
                  <div>
                    <label className="font-bold text-charcoal block mb-1.5">ទំហំតារាងស្វែងរកពាក្យ ៖</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[8, 10, 12].map(size => (
                        <button
                          key={size}
                          onClick={() => {
                            setSearchGridSize(size);
                            if (soundEnabled) playClickSound();
                          }}
                          className={`py-2 px-3 rounded-xl border font-bold text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                            searchGridSize === size
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {size}x{size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Timer */}
                <div>
                  <label className="font-bold text-charcoal block mb-1.5">នាឡិការាប់ថយក្រោយក្នុងកាត ៖</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 15, 30, 45].map(sec => (
                      <button
                        key={sec}
                        onClick={() => setTimerSeconds(sec)}
                        className={`py-2 px-2 rounded-xl border font-bold text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                          timerSeconds === sec
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {sec === 0 ? 'គ្មាន' : `${sec} វិនាទី`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound Effects Toggle */}
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? <Volume2 size={20} className="text-amber-500" /> : <VolumeX size={20} className="text-stone-400" />}
                    <div>
                      <div className="font-bold text-charcoal">សំឡេងក្នុងហ្គេម (Sound Effects)</div>
                      <div className="text-[11px] text-stone-500">បើក ឬបិទសំឡេងពេលចុច និងឆ្លើយត្រូវ/ខុស</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => {
                      setSoundEnabled(e.target.checked);
                      if (e.target.checked) playClickSound();
                    }}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Surprises Toggle */}
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <div className="font-bold text-charcoal">កាតសំណាងពិសេស (ប្រអប់អាថ៌កំបាំង)</div>
                    <div className="text-[11px] text-stone-500">ពិន្ទុបន្ថែម, ដកពិន្ទុ, លួចពិន្ទុ ឬដូរពិន្ទុ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableSurprises}
                    onChange={(e) => setEnableSurprises(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl transition-all duration-150 cursor-pointer"
                >
                  រួចរាល់
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
