import React, { useState, useEffect } from 'react';
import { WordItem } from '../types';
import { 
  ArrowLeft, 
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCw,
  Play,
  Pause,
  Settings,
  XCircle,
  Maximize,
  Minimize,
  CheckCircle,
  BookOpen, 
  Printer,
  Frame,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Check,
  Palette,
  Trash2,
  Plus,
  FolderHeart,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound, speakText } from '../utils/audio';
import { 
  loadFramesFromDB, 
  saveAllFramesToDB, 
  saveFrameToDB, 
  deleteFrameFromDB, 
  compressFrameImage 
} from '../utils/frameStorage';

interface FlashcardsProps {
  words: WordItem[];
  topicName?: string;
  onBack: () => void;
}

export type FrameTitlePosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'left' | 'center' | 'right';

export interface SavedCustomFrame {
  id: string;
  name: string;
  url: string;
  titlePosition?: FrameTitlePosition;
  hideTitleBg?: boolean;
  createdAt: number;
}

export const FRAME_POSITIONS = [
  { id: 'top-left', label: 'ឆ្វេងលើ', icon: '↖' },
  { id: 'top-center', label: 'កណ្ដាលលើ', icon: '↑' },
  { id: 'top-right', label: 'ស្ដាំលើ', icon: '↗' },
  { id: 'middle-left', label: 'ឆ្វេងកណ្តាល', icon: '←' },
  { id: 'middle-center', label: 'ចំកណ្តាល', icon: '•' },
  { id: 'middle-right', label: 'ស្ដាំកណ្តាល', icon: '→' },
  { id: 'bottom-left', label: 'ឆ្វេងក្រោម', icon: '↙' },
  { id: 'bottom-center', label: 'កណ្ដាលក្រោម', icon: '↓' },
  { id: 'bottom-right', label: 'ស្ដាំក្រោម', icon: '↘' },
] as const;

export const normalizeTitlePos = (pos?: string): FrameTitlePosition => {
  if (!pos || pos === 'left') return 'top-left';
  if (pos === 'center') return 'top-center';
  if (pos === 'right') return 'top-right';
  return pos as FrameTitlePosition;
};

export const getTitlePositionClasses = (pos?: string): string => {
  const p = normalizeTitlePos(pos);
  switch (p) {
    case 'top-left': return 'top-2.5 left-2.5 text-left';
    case 'top-center': return 'top-2.5 left-1/2 -translate-x-1/2 text-center';
    case 'top-right': return 'top-2.5 right-2.5 text-right';
    case 'middle-left': return 'top-1/2 left-2.5 -translate-y-1/2 text-left';
    case 'middle-center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
    case 'middle-right': return 'top-1/2 right-2.5 -translate-y-1/2 text-right';
    case 'bottom-left': return 'bottom-2.5 left-2.5 text-left';
    case 'bottom-center': return 'bottom-2.5 left-1/2 -translate-x-1/2 text-center';
    case 'bottom-right': return 'bottom-2.5 right-2.5 text-right';
    default: return 'top-2.5 left-2.5 text-left';
  }
};

export const getStudyCardTitlePositionClasses = (pos?: string): string => {
  const p = normalizeTitlePos(pos);
  switch (p) {
    case 'top-left': return 'top-8 sm:top-9 left-6 text-left';
    case 'top-center': return 'top-8 sm:top-9 left-1/2 -translate-x-1/2 text-center';
    case 'top-right': return 'top-8 sm:top-9 right-16 text-right';
    case 'middle-left': return 'top-1/2 left-6 -translate-y-1/2 text-left';
    case 'middle-center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
    case 'middle-right': return 'top-1/2 right-6 -translate-y-1/2 text-right';
    case 'bottom-left': return 'bottom-8 left-6 text-left';
    case 'bottom-center': return 'bottom-8 left-1/2 -translate-x-1/2 text-center';
    case 'bottom-right': return 'bottom-8 right-6 text-right';
    default: return 'top-8 sm:top-9 left-6 text-left';
  }
};

export interface KhmerFontOption {
  id: string;
  name: string;
  fontFamily: string;
  fontWeight?: number | string;
  sample: string;
  description: string;
}

export const KHMER_FONTS: KhmerFontOption[] = [
  { 
    id: 'battambang', 
    name: 'បាត់ដំបង (Battambang - ដិត 700)', 
    fontFamily: "'Battambang', sans-serif",
    fontWeight: 700,
    sample: 'ដោយយល់ឃើញថា',
    description: 'អក្សរស្ដង់ដារសៀវភៅសិក្សាគោល អក្សរដិត Bold 700'
  },
  { 
    id: 'hanuman', 
    name: 'ហនុមាន (Hanuman - ដិត 700)', 
    fontFamily: "'Hanuman', serif",
    fontWeight: 700,
    sample: 'ដោយយល់ឃើញថា',
    description: 'អក្សរស្អាតបែបក្បាច់ប្រពៃណីខ្មែរ (Bold 700)'
  },
  { 
    id: 'temple', 
    name: 'អក្សរឆ្លាក់ប្រាសាទ (Kh-MPS Temple)', 
    fontFamily: "'Kh-MPS-Temple', 'Kantumruy Pro', sans-serif",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'ក្បាច់ប្រាសាទបុរាណ ស្រស់ស្អាតលេចធ្លោ'
  },
  { 
    id: 'suwannaphum', 
    name: 'សុវណ្ណភូមិ (Suwannaphum - ដិត 700)', 
    fontFamily: "'Suwannaphum', serif",
    fontWeight: 700,
    sample: 'ដោយយល់ឃើញថា',
    description: 'អក្សរខ្មែររចនាបថទន់ភ្លន់ លេចធ្លោ'
  },
  { 
    id: 'content', 
    name: 'ខន់ថិន (Content - ដិត 700)', 
    fontFamily: "'Content', cursive",
    fontWeight: 700,
    sample: 'ដោយយល់ឃើញថា',
    description: 'អក្សររាងមូលក្បាច់បែបបុរាណ'
  },
  { 
    id: 'kdamthmor', 
    name: 'ក្ដាមថ្ម ប្រូ (Kdam Thmor Pro - ដិត 700)', 
    fontFamily: "'Kdam Thmor Pro', sans-serif",
    fontWeight: 700,
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរជ្រុងបែបទំនើប ទាក់ទាញ'
  },
  { 
    id: 'notoserif', 
    name: 'ណូតូ សេរីហ្វ (Noto Serif Khmer - ដិត 700)', 
    fontFamily: "'Noto Serif Khmer', serif",
    fontWeight: 700,
    sample: 'ដោយយល់ឃើញថា',
    description: 'អក្សរផ្លូវការ ស្រឡះ ក្បាលច្បាស់'
  },
  { 
    id: 'nokora', 
    name: 'នគរា (Nokora - ដិត 700)', 
    fontFamily: "'Nokora', sans-serif",
    fontWeight: 700,
    sample: 'ដោយយល់ឃើញថា',
    description: 'អក្សររាងមូលក្បាលមូល ស្ដង់ដារ'
  },
  { 
    id: 'kantumruy', 
    name: 'កន្ទុំរុយ ប្រូ (Kantumruy Pro - ដិត 700)', 
    fontFamily: "'Kantumruy Pro', sans-serif",
    fontWeight: 700,
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរទំនើប ស្រឡះភ្នែក អានងាយស្រួល'
  },
  { 
    id: 'moul', 
    name: 'អក្សរមូល (Moul)', 
    fontFamily: "'Moul', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរមូលខ្មែរ ក្បាច់ក្បាលមូលបុរាណ'
  },
  { 
    id: 'siemreap', 
    name: 'សៀមរាប (Siemreap)', 
    fontFamily: "'Siemreap', sans-serif",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សររាងមូលស្លូត ទន់ភ្លន់'
  },
  { 
    id: 'koulen', 
    name: 'គូលែន (Koulen)', 
    fontFamily: "'Koulen', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរដិតរឹងមាំ ស័ក្តិសមធ្វើចំណងជើង'
  },
  { 
    id: 'bayon', 
    name: 'បាយ័ន (Bayon)', 
    fontFamily: "'Bayon', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សររចនាបថបាយ័ន ប្លែកភ្នែក'
  },
  { 
    id: 'preahvihear', 
    name: 'ព្រះវិហារ (Preahvihear)', 
    fontFamily: "'Preahvihear', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សររាងមូលក្រាស់ បុរាណ'
  },
  { 
    id: 'dangrek', 
    name: 'ដងរែក (Dangrek)', 
    fontFamily: "'Dangrek', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរក្បាច់ដងរែក ស្រស់ស្អាត'
  },
  { 
    id: 'bokor', 
    name: 'បូកគោ (Bokor)', 
    fontFamily: "'Bokor', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរក្បាច់បូកគោ បែបសិល្បៈ'
  },
  { 
    id: 'chenla', 
    name: 'ចេនឡា (Chenla)', 
    fontFamily: "'Chenla', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរបុរាណចេនឡា'
  },
  { 
    id: 'fasthand', 
    name: 'រហ័ស (Fasthand)', 
    fontFamily: "'Fasthand', cursive",
    fontWeight: 'normal',
    sample: 'កម្ពុជា សួស្តី',
    description: 'អក្សរដៃរស់រវើក ស្អាតប្លែក'
  }
];

const DEFAULT_KHMER_FRAME: SavedCustomFrame = {
  id: 'frame_khmer_gold_default',
  name: 'ស៊ុមខ្មែរក្បាច់មាស (Khmer Gold Ornate)',
  url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="380" viewBox="0 0 800 380" fill="none"><rect x="10" y="10" width="780" height="360" rx="24" stroke="%23f59e0b" stroke-width="8"/><rect x="22" y="22" width="756" height="336" rx="16" stroke="%23fbbf24" stroke-width="3" stroke-dasharray="6,6"/><path d="M20,20 L80,20 C50,20 35,35 35,65 C35,35 20,20 20,20 Z" fill="%23f59e0b"/><path d="M20,20 L20,80 C20,50 35,35 65,35 C35,35 20,20 20,20 Z" fill="%23f59e0b"/><path d="M780,20 L720,20 C750,20 765,35 765,65 C765,35 780,20 780,20 Z" fill="%23f59e0b"/><path d="M780,20 L780,80 C780,50 765,35 735,35 C765,35 780,20 780,20 Z" fill="%23f59e0b"/><path d="M20,360 L80,360 C50,360 35,345 35,315 C35,345 20,360 20,360 Z" fill="%23f59e0b"/><path d="M20,360 L20,300 C20,330 35,345 65,345 C35,345 20,360 20,360 Z" fill="%23f59e0b"/><path d="M780,360 L720,360 C750,360 765,345 765,315 C765,345 20,360 20,360 Z" fill="%23f59e0b"/><path d="M780,360 L780,300 C780,330 765,345 735,345 C765,345 780,360 780,360 Z" fill="%23f59e0b"/></svg>',
  titlePosition: 'top-left',
  hideTitleBg: false,
  createdAt: Date.now() - 100000
};

const DEFAULT_SCHOOL_FRAME: SavedCustomFrame = {
  id: 'frame_school_star_default',
  name: 'ស៊ុមសាលារៀនមេដាយ (School Star Frame)',
  url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="380" viewBox="0 0 800 380" fill="none"><rect x="12" y="12" width="776" height="356" rx="20" stroke="%233b82f6" stroke-width="6"/><rect x="22" y="22" width="756" height="336" rx="14" stroke="%2360a5fa" stroke-width="2"/><circle cx="40" cy="40" r="14" fill="%23f59e0b"/><path d="M40,30 L43,37 L50,37 L45,41 L47,48 L40,44 L33,48 L35,41 L30,37 L37,37 Z" fill="white"/><circle cx="760" cy="40" r="14" fill="%23f59e0b"/><path d="M760,30 L763,37 L770,37 L765,41 L767,48 L760,44 L753,48 L755,41 L750,37 L757,37 Z" fill="white"/><circle cx="40" cy="340" r="14" fill="%23f59e0b"/><path d="M40,330 L43,337 L50,337 L45,341 L47,348 L40,344 L33,348 L35,341 L30,337 L37,337 Z" fill="white"/><circle cx="760" cy="340" r="14" fill="%23f59e0b"/><path d="M760,330 L763,337 L770,337 L765,341 L767,348 L760,344 L753,348 L755,341 L750,337 L757,337 Z" fill="white"/></svg>',
  titlePosition: 'top-left',
  hideTitleBg: false,
  createdAt: Date.now() - 50000
};

const vibrantColors = [
  'text-blue-500',
  'text-orange-500',
  'text-green-500',
  'text-purple-500',
  'text-rose-500',
  'text-teal-500',
];

const vibrantColorsLight = [
  'text-blue-400',
  'text-orange-400',
  'text-green-400',
  'text-purple-400',
  'text-rose-400',
  'text-teal-400',
];

const vibrantBorderColors = [
  'border-blue-500',
  'border-orange-500',
  'border-green-500',
  'border-purple-500',
  'border-rose-500',
  'border-teal-500',
];

const vibrantBorderColorsLight = [
  'border-blue-400',
  'border-orange-400',
  'border-green-400',
  'border-purple-400',
  'border-rose-400',
  'border-teal-400',
];

const vibrantBgColors = [
  'bg-blue-500',
  'bg-orange-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
];

const ANTONYM_SEP_REGEX = /\s*(?:≠|=\/|\/=|!=|><|<>|\\neq)\s*/;

export function parseAntonymPair(wordStr: string): { isAntonym: boolean; w1: string; w2: string } {
  if (!wordStr) return { isAntonym: false, w1: '', w2: '' };
  const parts = wordStr.split(ANTONYM_SEP_REGEX).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { isAntonym: true, w1: parts[0], w2: parts[1] };
  }
  return { isAntonym: false, w1: wordStr, w2: '' };
}

export default function Flashcards({ words, topicName, onBack }: FlashcardsProps) {
  const [filterType, setFilterType] = useState('ទាំងអស់');

  const isAntonymWord = (w: WordItem) => Boolean(
    (w.word && ANTONYM_SEP_REGEX.test(w.word)) || 
    w.wordType?.includes('ផ្ទុយ')
  );
  const isPassageWord = (w: WordItem) => Boolean(w.wordType?.includes('អត្ថបទខ្លី') || w.word.length > 28);
  const isDifficultWord = (w: WordItem) => !isAntonymWord(w) && !isPassageWord(w);

  const categoryStats = React.useMemo(() => {
    const total = words.length;
    const difficultCount = words.filter(isDifficultWord).length;
    const antonymCount = words.filter(isAntonymWord).length;
    const passageCount = words.filter(isPassageWord).length;
    return { total, difficultCount, antonymCount, passageCount };
  }, [words]);

  const uniqueWordTypes = React.useMemo(() => {
    const base = ['ទាំងអស់'];
    if (categoryStats.difficultCount > 0) base.push('ពាក្យពិបាក');
    if (categoryStats.antonymCount > 0) base.push('ពាក្យផ្ទុយ');
    if (categoryStats.passageCount > 0) base.push('អត្ថបទខ្លី');

    // Also collect any specific custom types
    const otherTypes = new Set<string>();
    words.forEach(w => {
      if (
        w.wordType &&
        !['ពាក្យពិបាក', 'ពាក្យផ្ទុយ', 'អត្ថបទខ្លី'].includes(w.wordType) &&
        !w.wordType.includes('អត្ថបទខ្លី') &&
        !w.wordType.includes('ផ្ទុយ')
      ) {
        otherTypes.add(w.wordType);
      }
    });
    return [...base, ...Array.from(otherTypes)];
  }, [words, categoryStats]);

  const [includeTitleCard, setIncludeTitleCard] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('khmer_flashcard_include_title_card');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('khmer_flashcard_include_title_card', includeTitleCard ? 'true' : 'false');
    } catch (e) {}
  }, [includeTitleCard]);

  const activeWords = React.useMemo(() => {
    if (filterType === 'ទាំងអស់') return words;
    if (filterType === 'ពាក្យពិបាក') return words.filter(isDifficultWord);
    if (filterType === 'ពាក្យផ្ទុយ') return words.filter(isAntonymWord);
    if (filterType === 'អត្ថបទខ្លី') return words.filter(isPassageWord);
    return words.filter(w => w.wordType === filterType);
  }, [words, filterType]);

  const isTitleCardWord = (w?: WordItem) => Boolean(w && (w.wordType === 'ចំណងជើងមេរៀន' || w.definition?.startsWith('ចំណងជើងមេរៀន ៖')));

  const detectedLessonTitle = React.useMemo(() => {
    if (filterType !== 'ទាំងអស់' && !['ពាក្យពិបាក', 'ពាក្យផ្ទុយ', 'អត្ថបទខ្លី'].includes(filterType)) {
      return filterType;
    }
    const customTypeWord = words.find(w => 
      w.wordType && 
      !['ពាក្យពិបាក', 'ពាក្យផ្ទុយ', 'អត្ថបទខ្លី', 'ចំណងជើងមេរៀន'].includes(w.wordType.trim()) &&
      !w.wordType.includes('អត្ថបទខ្លី') &&
      !w.wordType.includes('ផ្ទុយ')
    );
    if (customTypeWord?.wordType) {
      return customTypeWord.wordType.trim();
    }
    return topicName || 'មេរៀនភាសាខ្មែរ';
  }, [words, filterType, topicName]);

  const displayWords = React.useMemo(() => {
    if (includeTitleCard && (detectedLessonTitle || topicName) && filterType === 'ទាំងអស់') {
      const titleCardItem: WordItem = {
        word: detectedLessonTitle,
        wordType: topicName && topicName !== detectedLessonTitle ? topicName : 'ចំណងជើងមេរៀន',
        parts: [],
        definition: `ចំណងជើងមេរៀន ៖ ${detectedLessonTitle}`,
        example: topicName && topicName !== detectedLessonTitle ? `ប្រធានបទ ៖ ${topicName}` : ''
      };
      return [titleCardItem, ...activeWords];
    }
    return activeWords;
  }, [activeWords, includeTitleCard, topicName, detectedLessonTitle, filterType]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fontBase64, setFontBase64] = useState<string | null>(null);

  // Saved custom frames state with IndexedDB & localStorage persistence
  const [savedFrames, setSavedFrames] = useState<SavedCustomFrame[]>(() => {
    try {
      const saved = localStorage.getItem('khmer_flashcard_saved_frames');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved frames from localStorage:', e);
    }
    return [DEFAULT_KHMER_FRAME, DEFAULT_SCHOOL_FRAME];
  });

  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Load custom frames from IndexedDB on component mount (unlimited storage)
  useEffect(() => {
    let isMounted = true;
    async function initFrames() {
      try {
        const dbFrames = await loadFramesFromDB();
        if (isMounted && dbFrames && dbFrames.length > 0) {
          setSavedFrames(dbFrames);
        } else if (isMounted) {
          // If IndexedDB is empty, migrate current savedFrames into IndexedDB
          saveAllFramesToDB(savedFrames);
        }
      } catch (err) {
        console.error('Failed loading frames from IndexedDB:', err);
      }
    }
    initFrames();
    return () => { isMounted = false; };
  }, []);

  const [activeFrameId, setActiveFrameId] = useState<string>(() => {
    try {
      return localStorage.getItem('khmer_flashcard_active_frame_id') || 'frame_khmer_gold_default';
    } catch (e) {
      return 'frame_khmer_gold_default';
    }
  });

  const [slotFrameIds, setSlotFrameIds] = useState<[string, string, string]>(() => {
    try {
      const saved = localStorage.getItem('khmer_flashcard_slot_frame_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed as [string, string, string];
      }
    } catch (e) {}
    return ['frame_khmer_gold_default', 'frame_school_star_default', 'frame_khmer_gold_default'];
  });

  const [frameSelectionMode, setFrameSelectionMode] = useState<'single' | 'slots'>(() => {
    try {
      return (localStorage.getItem('khmer_flashcard_frame_mode') as 'single' | 'slots') || 'single';
    } catch (e) {
      return 'single';
    }
  });

  const [showFrameModal, setShowFrameModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showFontModal, setShowFontModal] = useState<boolean>(false);

  // Font state for flashcards
  const [selectedFontId, setSelectedFontId] = useState<string>(() => {
    try {
      return localStorage.getItem('khmer_flashcard_font_id') || 'battambang';
    } catch (e) {
      return 'battambang';
    }
  });

  // New frame upload inputs state
  const [newFrameName, setNewFrameName] = useState<string>('');
  const [newFrameUrlInput, setNewFrameUrlInput] = useState<string>('');
  const [newFramePreview, setNewFramePreview] = useState<string>('');
  const [newFrameTitlePos, setNewFrameTitlePos] = useState<FrameTitlePosition>('top-left');
  const [newFrameHideTitleBg, setNewFrameHideTitleBg] = useState<boolean>(false);
  const [frameSuccessMessage, setFrameSuccessMessage] = useState<string>('');

  // Persist saved frames to IndexedDB (and attempt safe localStorage backup)
  useEffect(() => {
    saveAllFramesToDB(savedFrames);
    try {
      localStorage.setItem('khmer_flashcard_saved_frames', JSON.stringify(savedFrames));
    } catch (e) {
      // If localStorage is full, IndexedDB reliably stores all frames
      console.warn('LocalStorage full, frames stored safely in IndexedDB');
    }
  }, [savedFrames]);

  useEffect(() => {
    try {
      localStorage.setItem('khmer_flashcard_active_frame_id', activeFrameId);
    } catch (e) {}
  }, [activeFrameId]);

  useEffect(() => {
    try {
      localStorage.setItem('khmer_flashcard_slot_frame_ids', JSON.stringify(slotFrameIds));
    } catch (e) {}
  }, [slotFrameIds]);

  useEffect(() => {
    try {
      localStorage.setItem('khmer_flashcard_frame_mode', frameSelectionMode);
    } catch (e) {}
  }, [frameSelectionMode]);

  useEffect(() => {
    try {
      localStorage.setItem('khmer_flashcard_font_id', selectedFontId);
    } catch (e) {}
  }, [selectedFontId]);

  const currentFont = KHMER_FONTS.find(f => f.id === selectedFontId) || KHMER_FONTS[0];

  const getFrameById = (id: string): SavedCustomFrame | undefined => {
    if (id === 'none') return undefined;
    return savedFrames.find(f => f.id === id);
  };

  const getFrameUrlById = (id: string): string => {
    const found = getFrameById(id);
    return found ? found.url : '';
  };

  const getFrameTitlePosById = (id: string): FrameTitlePosition => {
    const found = getFrameById(id);
    return normalizeTitlePos(found?.titlePosition);
  };

  const getFrameHideTitleBgById = (id: string): boolean => {
    const found = getFrameById(id);
    return Boolean(found?.hideTitleBg);
  };

  const handleUpdateFrameTitlePos = (frameId: string, pos: FrameTitlePosition, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setSavedFrames(prev => prev.map(f => f.id === frameId ? { ...f, titlePosition: pos } : f));
  };

  const handleToggleFrameTitleBg = (frameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setSavedFrames(prev => prev.map(f => f.id === frameId ? { ...f, hideTitleBg: !f.hideTitleBg } : f));
  };

  const handleSaveNewFrame = async (urlToSave: string, customName?: string) => {
    if (!urlToSave) return;
    
    const frameName = (customName || newFrameName).trim() || `ស៊ុមទី ${savedFrames.length + 1}`;
    const newFrameObj: SavedCustomFrame = {
      id: 'frame_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: frameName,
      url: urlToSave,
      titlePosition: newFrameTitlePos,
      hideTitleBg: newFrameHideTitleBg,
      createdAt: Date.now(),
    };

    // Save to IndexedDB
    await saveFrameToDB(newFrameObj);

    setSavedFrames(prev => [newFrameObj, ...prev]);
    setActiveFrameId(newFrameObj.id);
    setNewFrameName('');
    setNewFrameUrlInput('');
    setNewFramePreview('');
    setNewFrameTitlePos('top-left');
    setNewFrameHideTitleBg(false);
    setShowUploadModal(false);
    
    playSuccessSound();
    setFrameSuccessMessage('បានរក្សាទុកស៊ុមថ្មីក្នុងបណ្ណាល័យជោគជ័យ!');
    setTimeout(() => setFrameSuccessMessage(''), 3500);
  };

  const handleDeleteFrame = async (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    await deleteFrameFromDB(idToDelete);
    setSavedFrames(prev => prev.filter(f => f.id !== idToDelete));
    if (activeFrameId === idToDelete) {
      setActiveFrameId('none');
    }
    setSlotFrameIds(prev => prev.map(id => id === idToDelete ? 'none' : id) as [string, string, string]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        const compressedDataUrl = await compressFrameImage(file, 1200, 1600, 0.85);
        setNewFramePreview(compressedDataUrl);
        playClickSound();
      } catch (err) {
        console.error('Error compressing image, falling back to raw reader:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setNewFramePreview(result);
            playClickSound();
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  useEffect(() => {
    fetch('/fonts/Kh-MPS%20Temple.ttf')
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        const chunk = 8192;
        for (let i = 0; i < len; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
        }
        const base64 = btoa(binary);
        setFontBase64(base64);
      })
      .catch((err) => {
        console.error('Error preloading Kh-MPS-Temple font:', err);
      });
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filterType]);

  useEffect(() => {
    if (!isAutoPlay || !hasStarted) return;

    const timer = setTimeout(() => {
      setIsFlipped(false);
      if (currentIndex < activeWords.length - 1) {
        playClickSound();
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsAutoPlay(false);
        setIsFinished(true);
        playSuccessSound();
      }
    }, autoPlayInterval);

    return () => clearTimeout(timer);
  }, [isAutoPlay, hasStarted, currentIndex, autoPlayInterval, activeWords.length]);

  const handleFullscreenToggle = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handlePrintCards = () => {
    playClickSound();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printCards: WordItem[] = [
      ...(includeTitleCard && (detectedLessonTitle || topicName) ? [{
        word: detectedLessonTitle,
        wordType: topicName && topicName !== detectedLessonTitle ? topicName : 'ចំណងជើងមេរៀន',
        parts: [],
        definition: `ចំណងជើងមេរៀន ៖ ${detectedLessonTitle}`,
        example: topicName && topicName !== detectedLessonTitle ? `ប្រធានបទ ៖ ${topicName}` : ''
      }] : []),
      ...activeWords
    ];
    
    const totalCards = printCards.length;
    const pages = Math.ceil(totalCards / 3);
    const borderColors = ['#3B82F6', '#F97316', '#16A34A', '#A855F7', '#E11D48', '#0D9488'];
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>សន្លឹកបណ្ណពាក្យ</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700;900&family=Bayon&family=Bokor&family=Chenla&family=Content:wght@400;700&family=Dangrek&family=Fasthand&family=Hanuman:wght@400;700;900&family=Kantumruy+Pro:wght@400;500;600;700&family=Kdam+Thmor+Pro:wght@400;700&family=Koulen&family=Moul&family=Nokora:wght@400;700;900&family=Noto+Sans+Khmer:wght@400;700;900&family=Noto+Serif+Khmer:wght@400;700;900&family=Preahvihear&family=Siemreap&family=Suwannaphum:wght@400;700;900&display=swap');
          @font-face {
            font-family: 'Kh-MPS-Temple';
            src: ${fontBase64 ? `url('data:font/ttf;charset=utf-8;base64,${fontBase64}') format('truetype')` : `url('${window.location.origin}/fonts/Kh-MPS%20Temple.ttf') format('truetype')`};
            font-weight: normal;
            font-style: normal;
          }
          
          :root {
            --body-font-family: 'Kantumruy Pro', sans-serif;
            --card-font-family: ${currentFont.fontFamily};
            --card-font-weight: ${currentFont.fontWeight || 700};
            --card-font-size: 70pt;
            --card-border-style: solid;
            --title-top-offset: 25px;
            --is-bw: 0;
          }
          
          .bw-mode {
            --is-bw: 1;
          }
          
          .bw-mode .card {
            --card-color: #000000 !important;
          }
          
          .bw-mode .card-def {
            color: #000000 !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: var(--body-font-family);
            margin: 0;
            padding: 0;
            background-color: #cbd5e1;
            color: #333;
          }
          
          .no-print {
            background: #ffffff;
            padding: 10px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid #e2e8f0;
            flex-wrap: wrap;
            gap: 12px;
          }
          
          .no-print-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .sheet-title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }

          .sheet-badge {
            font-size: 11px;
            background: #e0f2fe;
            color: #0369a1;
            padding: 3px 10px;
            border-radius: 9999px;
            font-weight: 700;
            border: 1px solid #bae6fd;
          }
          
          .no-print-right {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          
          .btn {
            padding: 8px 14px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            cursor: pointer;
            font-family: inherit;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            transition: all 0.15s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            user-select: none;
          }
          
          .btn:hover {
            background: #f8fafc;
            border-color: #94a3b8;
          }
          
          .btn.btn-settings {
            background: #f0fdf4;
            border-color: #86efac;
            color: #166534;
            font-weight: 700;
          }

          .btn.btn-settings:hover {
            background: #dcfce7;
            border-color: #4ade80;
          }

          .btn.active-color {
            background: #eff6ff;
            border-color: #93c5fd;
            color: #1d4ed8;
          }
          
          .btn.print-btn {
            background-color: #0284c7;
            color: #ffffff;
            border: 1px solid #0284c7;
            font-weight: 700;
            box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);
          }
          
          .btn.print-btn:hover {
            background-color: #0369a1;
          }

          /* Settings Modal Styles */
          .modal-backdrop {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            animation: modalFadeIn 0.15s ease-out;
          }

          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }

          .modal-dialog {
            background: #ffffff;
            border-radius: 20px;
            max-width: 580px;
            width: 100%;
            max-height: 88vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
            border: 1px solid #e2e8f0;
            overflow: hidden;
            font-family: inherit;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            background: #f8fafc;
          }

          .modal-header-icon {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            background: #e0f2fe;
            color: #0284c7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
          }

          .modal-title {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }

          .modal-subtitle {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #64748b;
          }

          .modal-close-btn {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            font-size: 14px;
            font-weight: 700;
            color: #64748b;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .modal-close-btn:hover {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #b91c1c;
          }

          .modal-body {
            padding: 16px 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .setting-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .setting-card-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
          }

          .setting-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .setting-field-label {
            font-size: 12px;
            font-weight: 600;
            color: #334155;
          }

          .setting-val-badge {
            font-size: 11px;
            font-weight: 700;
            color: #0284c7;
            background: #e0f2fe;
            padding: 2px 8px;
            border-radius: 6px;
          }

          .form-control {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-family: inherit;
            font-size: 13px;
            background: #ffffff;
            color: #1e293b;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .form-control:focus {
            border-color: #0284c7;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
          }

          .range-slider {
            width: 100%;
            cursor: pointer;
            accent-color: #0284c7;
            height: 6px;
            border-radius: 3px;
          }

          .modal-footer {
            padding: 12px 20px;
            border-top: 1px solid #f1f5f9;
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .btn-primary {
            background: #0284c7;
            color: #ffffff;
            border: 1px solid #0284c7;
            font-weight: 700;
          }

          .btn-primary:hover {
            background: #0369a1;
          }

          @media print {
            .modal-backdrop { display: none !important; }
            @page {
              size: A4 portrait;
              margin-top: 10mm;
              margin-left: 10mm;
              margin-right: 10mm;
              margin-bottom: 10mm;
            }
            .no-print { display: none !important; }
            body { 
              background-color: white !important; 
              margin: 0 !important;
              padding: 0 !important;
            }
            .page { 
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 200mm !important;
              height: 287mm !important;
              padding: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
              box-sizing: border-box !important;
              background-color: white !important;
              page-break-after: always !important;
            }
            .page:last-child {
              page-break-after: auto !important;
            }
          }
          
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto 20px auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            page-break-after: always;
            box-sizing: border-box;
            padding: 5mm;
            background-color: white;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .card {
            width: 100%;
            height: 89mm;
            border: 8px var(--card-border-style, solid) var(--card-color);
            background-color: white;
            padding: 6px;
            margin: 0;
            box-sizing: border-box;
            filter: grayscale(var(--is-bw));
            position: relative;
            overflow: hidden;
          }

          .card[data-frame="double"] {
            border: 10px double var(--card-color);
          }
          .card[data-frame="school"] {
            border: 8px double #d97706;
          }
          .card[data-frame="nature"] {
            border: 6px solid #10b981;
          }
          .card[data-frame="ornate"] {
            border: 6px solid #f59e0b;
          }
          .card.has-frame {
            border: none !important;
            padding: 0 !important;
          }
          .card.has-frame .card-inner {
            border: none !important;
            padding: 24px 32px !important;
            background: transparent !important;
          }

          /* Hide white background behind title */
          .card[data-hide-title-bg="true"] .card-top-left {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 2px 4px !important;
            text-shadow: 0 1px 2px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.9) !important;
          }

          /* 9 Alignments: Top row */
          .card[data-title-pos="top-left"] .card-top-left,
          .card[data-title-pos="left"] .card-top-left {
            top: var(--title-top-offset, 25px) !important;
            left: 28px !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            text-align: left !important;
          }
          .card[data-title-pos="top-center"] .card-top-left,
          .card[data-title-pos="center"] .card-top-left {
            top: var(--title-top-offset, 25px) !important;
            left: 50% !important;
            right: auto !important;
            bottom: auto !important;
            transform: translateX(-50%) !important;
            text-align: center !important;
          }
          .card[data-title-pos="top-right"] .card-top-left,
          .card[data-title-pos="right"] .card-top-left {
            top: var(--title-top-offset, 25px) !important;
            right: 28px !important;
            left: auto !important;
            bottom: auto !important;
            transform: none !important;
            text-align: right !important;
          }

          /* 9 Alignments: Middle row */
          .card[data-title-pos="middle-left"] .card-top-left {
            top: 50% !important;
            left: 28px !important;
            right: auto !important;
            bottom: auto !important;
            transform: translateY(-50%) !important;
            text-align: left !important;
          }
          .card[data-title-pos="middle-center"] .card-top-left {
            top: 50% !important;
            left: 50% !important;
            right: auto !important;
            bottom: auto !important;
            transform: translate(-50%, -50%) !important;
            text-align: center !important;
          }
          .card[data-title-pos="middle-right"] .card-top-left {
            top: 50% !important;
            right: 28px !important;
            left: auto !important;
            bottom: auto !important;
            transform: translateY(-50%) !important;
            text-align: right !important;
          }

          /* 9 Alignments: Bottom row */
          .card[data-title-pos="bottom-left"] .card-top-left {
            bottom: 18px !important;
            left: 28px !important;
            top: auto !important;
            right: auto !important;
            transform: none !important;
            text-align: left !important;
          }
          .card[data-title-pos="bottom-center"] .card-top-left {
            bottom: 18px !important;
            left: 50% !important;
            top: auto !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            text-align: center !important;
          }
          .card[data-title-pos="bottom-right"] .card-top-left {
            bottom: 18px !important;
            right: 28px !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
            text-align: right !important;
          }

          .corner-svg {
            position: absolute;
            width: 44px;
            height: 44px;
            z-index: 2;
            pointer-events: none;
          }
          .corner-tl { top: 6px; left: 6px; }
          .corner-tr { top: 6px; right: 6px; transform: rotate(90deg); }
          .corner-br { bottom: 6px; right: 6px; transform: rotate(180deg); }
          .corner-bl { bottom: 6px; left: 6px; transform: rotate(-90deg); }

          .inner-frame-line {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px dashed #f59e0b;
            border-radius: 12px;
            pointer-events: none;
            z-index: 2;
          }
          
          .card-inner {
            border: 2px var(--card-border-style, solid) var(--card-color);
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 20px;
            z-index: 10;
            background: transparent;
          }
          
          .card-top-left {
            position: absolute;
            top: var(--title-top-offset, 25px);
            left: 24px;
            color: var(--card-color);
            background: rgba(255, 255, 255, 0.8);
            border: none;
            border-radius: 9999px;
            padding: 4px 14px;
            font-size: 12pt;
            font-weight: 700;
            line-height: 1.5;
            z-index: 12;
            box-shadow: none;
            overflow: visible;
          }
          
          .card-word {
            font-family: var(--card-font-family);
            font-size: var(--card-font-size, 70pt);
            font-weight: var(--card-font-weight, 700);
            color: var(--card-color);
            margin: 0;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
            line-height: 1.35;
            padding: 6px 0;
            text-align: center;
            z-index: 12;
            overflow: visible;
          }

          .card-word-title-card {
            font-family: var(--card-font-family);
            font-size: calc(var(--card-font-size, 70pt) * 0.58);
            font-weight: var(--card-font-weight, 700);
            color: var(--card-color);
            margin: 0;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.08);
            line-height: 1.35;
            padding: 6px 18px;
            text-align: center;
            z-index: 12;
            overflow: visible;
            max-width: 95%;
            word-break: break-word;
          }

          .card-word-antonym {
            font-family: var(--card-font-family);
            font-size: calc(var(--card-font-size, 70pt) * 0.9);
            font-weight: var(--card-font-weight, 700);
            color: var(--card-color);
            margin: 0;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.08);
            line-height: 1.3;
            padding: 6px 0;
            text-align: center;
            z-index: 12;
            overflow: visible;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }

          .antonym-sign {
            color: #ea580c;
            font-size: 0.36em;
            font-weight: 700;
            line-height: 1;
            padding: 0 4px;
            user-select: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
            transform: translateY(-1px);
            opacity: 0.95;
          }

          .antonym-sign svg {
            display: inline-block;
            width: 0.85em;
            height: 0.85em;
          }

          .antonym-w1, .antonym-w2 {
            color: var(--card-color);
            white-space: nowrap;
          }

          .card-word-passage {
            font-family: var(--card-font-family);
            font-size: calc(var(--card-font-size, 70pt) * 0.42);
            font-weight: var(--card-font-weight, 700);
            color: var(--card-color);
            margin: 0;
            text-shadow: 1px 1px 0px rgba(0,0,0,0.08);
            line-height: 1.5;
            padding: 8px 16px;
            text-align: center;
            z-index: 12;
            overflow: visible;
            max-width: 92%;
            word-break: break-word;
          }
          
          .card-def {
            font-size: 20pt;
            color: #334155;
            margin: 15px 0 0 0;
            line-height: 1.5;
            text-align: center;
            z-index: 12;
            overflow: visible;
          }
          
          .cut-line {
            width: 100%;
            height: 10mm;
            position: relative;
            box-sizing: border-box;
          }
          
          .cut-line::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            border-top: 2px dashed #64748b;
            transform: translateY(-50%);
          }

          .custom-frame-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            object-fit: fill;
            pointer-events: none;
            z-index: 1;
          }
        </style>
      </head>
      <body>
        <!-- Top Action Bar -->
        <div class="no-print">
          <div class="no-print-left">
            <span class="sheet-title">សន្លឹកបណ្ណពាក្យ៖ ពាក្យពិបាក និងពាក្យជួយ</span>
            <span class="sheet-badge">${totalCards} បណ្ណ (${pages} ទំព័រ A4)</span>
          </div>
          <div class="no-print-right">
            <button class="btn btn-settings" id="openSettingsBtn" title="បើកផ្ទាំងការកំណត់រូបរាងបណ្ណ">
              <span style="font-size: 15px;">⚙️</span>
              <span>ការកំណត់ (Settings)</span>
            </button>
            <button class="btn active-color" id="colorBtn" title="របៀបពណ៌ធម្មជាតិ">🎨 ពណ៌ធម្មជាតិ</button>
            <button class="btn" id="bwBtn" title="របៀបស-ខ្មៅ សម្រាប់សន្សំថ្នាំ">⚫ ស-ខ្មៅ</button>
            <button class="btn" id="resetBtn" title="កំណត់ជម្រើសទាំងអស់ឡើងវិញ">🔄 កំណត់ឡើងវិញ</button>
            <button class="btn print-btn" onclick="window.print()">🖨️ ទាញយកសន្លឹកកិច្ចការ</button>
          </div>
        </div>

        <!-- Unified Settings Modal -->
        <div id="settingsModalBackdrop" class="modal-backdrop" style="display: none;">
          <div class="modal-dialog">
            <!-- Modal Header -->
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="modal-header-icon">⚙️</div>
                <div>
                  <h3 class="modal-title">ការកំណត់រួមសម្រាប់សន្លឹកបណ្ណពាក្យ</h3>
                  <p class="modal-subtitle">Card Settings & Customization</p>
                </div>
              </div>
              <button class="modal-close-btn" id="closeSettingsBtn" title="បិទ (Close)">✕</button>
            </div>

            <!-- Modal Body with 3 Grouped Sections -->
            <div class="modal-body">
              <!-- Section 1: Frames & Layout -->
              <div class="setting-card">
                <div class="setting-card-title">
                  <span>🖼️</span> ស៊ុម និងទីតាំងចំណងជើង (Frame & Layout)
                </div>
                
                <div class="setting-field">
                  <label class="setting-field-label">ប្ដូរស៊ុមបណ្ណពាក្យ (Select Frame)៖</label>
                  <select id="borderSelect" class="form-control">
                    <option value="none" ${frameSelectionMode === 'single' && activeFrameId === 'none' ? 'selected' : ''}>⏹️ គ្មានស៊ុមរូបភាព (No Frame Image)</option>
                    ${savedFrames.map(f => `<option value="${f.id}" ${frameSelectionMode === 'single' && activeFrameId === f.id ? 'selected' : ''}>🖼️ ${f.name}</option>`).join('')}
                    <option value="slots" ${frameSelectionMode === 'slots' ? 'selected' : ''}>🎨 កំណត់តាមបណ្ណ 1, 2, 3 (Set per Card)</option>
                  </select>
                </div>

                <div class="setting-field">
                  <label class="setting-field-label">ផ្ទៃសចំណងជើង (Title Background)៖</label>
                  <select id="titleBgSelect" class="form-control">
                    <option value="default">⚙️ តាមស៊ុមនីមួយៗ (Default per Frame)</option>
                    <option value="hide">🚫 លុបផ្ទៃស (ថ្លា) គ្រប់បណ្ណ</option>
                    <option value="show">⬜ បង្ហាញផ្ទៃស គ្រប់បណ្ណ</option>
                  </select>
                </div>

                <div class="setting-field">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <label class="setting-field-label">រំកិលចំណងជើងចុះក្រោម (Vertical Offset)៖</label>
                    <span id="titleTopVal" class="setting-val-badge">25px</span>
                  </div>
                  <input type="range" id="titleTopSlider" min="14" max="65" value="25" class="range-slider" />
                </div>
              </div>

              <!-- Section 2: Typography & Size -->
              <div class="setting-card">
                <div class="setting-card-title">
                  <span>✍️</span> ពុម្ពអក្សរ និងទំហំ (Font & Typography)
                </div>

                <div class="setting-field">
                  <label class="setting-field-label">ពុម្ពអក្សរខ្មែរ (Khmer Font)៖</label>
                  <select id="fontFamilySelect" class="form-control">
                    ${KHMER_FONTS.map(f => `<option value="${f.fontFamily}" data-weight="${f.fontWeight || 700}" ${f.id === selectedFontId ? 'selected' : ''}>${f.name}</option>`).join('')}
                  </select>
                </div>

                <div class="setting-field">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <label class="setting-field-label">ទំហំពាក្យ (Word Font Size)៖</label>
                    <span id="fontSizeVal" class="setting-val-badge">70pt</span>
                  </div>
                  <input type="range" id="fontSizeSlider" min="30" max="100" value="70" class="range-slider" />
                </div>
              </div>

              <!-- Section 3: Color Options -->
              <div class="setting-card">
                <div class="setting-card-title">
                  <span>🎨</span> ពណ៌ពាក្យ (Word Color Options)
                </div>

                <div class="setting-field">
                  <label class="setting-field-label">របៀបពណ៌ពាក្យ៖</label>
                  <select id="colorModeSelect" class="form-control">
                    <option value="multi">🎨 ពណ៌ចម្រុះតាមបណ្ណ (Multi-color per card)</option>
                    <option value="uniform">📌 ពណ៌ដូចគ្នាគ្រប់បណ្ណ (Uniform single color)</option>
                  </select>
                </div>

                <div id="uniformColorContainer" class="setting-field" style="display: none;">
                  <label class="setting-field-label">ជ្រើសរើសពណ៌ដូចគ្នា៖</label>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                    <button class="color-dot" data-color="#3B82F6" style="background: #3B82F6; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); outline: none;"></button>
                    <button class="color-dot" data-color="#F97316" style="background: #F97316; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); outline: none;"></button>
                    <button class="color-dot" data-color="#16A34A" style="background: #16A34A; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); outline: none;"></button>
                    <button class="color-dot" data-color="#A855F7" style="background: #A855F7; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); outline: none;"></button>
                    <button class="color-dot" data-color="#E11D48" style="background: #E11D48; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); outline: none;"></button>
                    <button class="color-dot" data-color="#0D9488" style="background: #0D9488; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); outline: none;"></button>
                    <div style="display: flex; align-items: center; gap: 6px; margin-left: 6px;">
                      <input type="color" id="customColorPicker" value="#3B82F6" style="width: 28px; height: 28px; border: none; cursor: pointer; border-radius: 50%; background: none;" title="ជ្រើសរើសពណ៌ផ្ទាល់ខ្លួន" />
                      <span style="font-size: 11px; color: #64748b;">ពណ៌ផ្ទាល់ខ្លួន</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button class="btn" id="modalResetBtn">🔄 កំណត់ឡើងវិញ (Reset Defaults)</button>
              <button class="btn btn-primary" id="modalDoneBtn">✓ រួចរាល់ (Done)</button>
            </div>
          </div>
        </div>
    `;
    
    for (let i = 0; i < pages; i++) {
      htmlContent += `<div class="page">`;
      
      for (let idx = 0; idx < 3; idx++) {
        const globalCardIndex = i * 3 + idx;
        
        // Render cut-line if idx > 0 and the previous card on this page exists
        if (idx > 0 && globalCardIndex < totalCards) {
          htmlContent += `<div class="cut-line"></div>`;
        }
        
        if (globalCardIndex < totalCards) {
          const color = borderColors[globalCardIndex % borderColors.length];
          const cardFrameId = frameSelectionMode === 'slots' ? (slotFrameIds[idx] || 'none') : activeFrameId;
          const cardFrameUrl = getFrameUrlById(cardFrameId);
          const cardTitlePos = getFrameTitlePosById(cardFrameId);
          const cardHideBg = getFrameHideTitleBgById(cardFrameId);
          const hasFrame = Boolean(cardFrameUrl);

          let frameMarkup = '';
          if (cardFrameUrl) {
            frameMarkup = `<img src="${cardFrameUrl}" class="custom-frame-overlay" />`;
          }

          const word = printCards[globalCardIndex];
          const isTitleCard = isTitleCardWord(word) || word.wordType === 'ចំណងជើងមេរៀន' || (includeTitleCard && globalCardIndex === 0 && word.word === detectedLessonTitle);
          const antonymData = parseAntonymPair(word.word);
          const isAntonym = isAntonymWord(word);
          const isPassage = isPassageWord(word);
          const typeDisplay = word.wordType ? word.wordType.trim() : (isAntonym ? 'ពាក្យផ្ទុយ' : (isPassage ? 'អត្ថបទខ្លី' : 'ពាក្យពិបាក'));

          let wordMarkup = '';
          if (isTitleCard) {
            wordMarkup = `<h2 class="card-word card-word-title-card">${word.word}</h2>`;
          } else if (antonymData.isAntonym) {
            wordMarkup = `
              <h2 class="card-word card-word-antonym">
                <span class="antonym-w1">${antonymData.w1}</span>
                <span class="antonym-sign">
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
                    <line x1="4" y1="8" x2="20" y2="8" />
                    <line x1="4" y1="16" x2="20" y2="16" />
                    <line x1="18" y1="3" x2="6" y2="21" />
                  </svg>
                </span>
                <span class="antonym-w2">${antonymData.w2}</span>
              </h2>
            `;
          } else if (isPassage) {
            wordMarkup = `<h2 class="card-word card-word-passage">${word.word}</h2>`;
          } else {
            wordMarkup = `<h2 class="card-word">${word.word}</h2>`;
          }

          const topLeftMarkup = isTitleCard ? '' : `<div class="card-top-left">${typeDisplay}</div>`;

          htmlContent += `
            <div class="card ${hasFrame ? 'has-frame' : ''}" data-frame-id="${cardFrameId}" data-title-pos="${cardTitlePos}" data-hide-title-bg="${cardHideBg ? 'true' : 'false'}" data-original-color="${color}" style="--card-color: ${color};">
              ${frameMarkup}
              <div class="card-inner">
                ${topLeftMarkup}
                ${wordMarkup}
              </div>
            </div>
          `;
        } else {
          // Render an invisible placeholder card to preserve the exact same layout spacing
          htmlContent += `
            <div class="card" style="visibility: hidden;"></div>
          `;
        }
      }
      
      htmlContent += `</div>`;
    }
    
    htmlContent += `
        <script>
          window.savedFramesMap = ${JSON.stringify(
            savedFrames.reduce((acc, f) => { acc[f.id] = f.url; return acc; }, {} as Record<string, string>)
          )};
          window.savedFramesPosMap = ${JSON.stringify(
            savedFrames.reduce((acc, f) => { acc[f.id] = normalizeTitlePos(f.titlePosition); return acc; }, {} as Record<string, string>)
          )};
          window.savedFramesHideBgMap = ${JSON.stringify(
            savedFrames.reduce((acc, f) => { acc[f.id] = Boolean(f.hideTitleBg); return acc; }, {} as Record<string, boolean>)
          )};
          window.slotFrameIds = ${JSON.stringify(slotFrameIds)};

          const openSettingsBtn = document.getElementById('openSettingsBtn');
          const closeSettingsBtn = document.getElementById('closeSettingsBtn');
          const modalDoneBtn = document.getElementById('modalDoneBtn');
          const modalResetBtn = document.getElementById('modalResetBtn');
          const settingsModalBackdrop = document.getElementById('settingsModalBackdrop');

          function openSettingsModal() {
            if (settingsModalBackdrop) {
              settingsModalBackdrop.style.display = 'flex';
            }
          }

          function closeSettingsModal() {
            if (settingsModalBackdrop) {
              settingsModalBackdrop.style.display = 'none';
            }
          }

          if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettingsModal);
          if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
          if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeSettingsModal);

          if (settingsModalBackdrop) {
            settingsModalBackdrop.addEventListener('click', (e) => {
              if (e.target === settingsModalBackdrop) {
                closeSettingsModal();
              }
            });
          }

          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              closeSettingsModal();
            }
          });

          const borderSelect = document.getElementById('borderSelect');
          const titleBgSelect = document.getElementById('titleBgSelect');
          const colorModeSelect = document.getElementById('colorModeSelect');
          const uniformColorContainer = document.getElementById('uniformColorContainer');
          const colorDots = document.querySelectorAll('.color-dot');
          const customColorPicker = document.getElementById('customColorPicker');
          const fontSizeSlider = document.getElementById('fontSizeSlider');
          const fontSizeVal = document.getElementById('fontSizeVal');
          const resetBtn = document.getElementById('resetBtn');
          const colorBtn = document.getElementById('colorBtn');
          const bwBtn = document.getElementById('bwBtn');

          function handleFullReset() {
            borderSelect.value = "none";
            if (titleBgSelect) titleBgSelect.value = "default";
            if (titleTopSlider && titleTopVal) {
              titleTopSlider.value = "25";
              titleTopVal.textContent = "25px";
              document.documentElement.style.setProperty('--title-top-offset', '25px');
            }
            colorModeSelect.value = "multi";
            uniformColorContainer.style.display = 'none';
            fontSizeSlider.value = "70";
            fontSizeVal.textContent = "70pt";
            document.documentElement.style.setProperty('--card-font-size', '70pt');
            document.documentElement.style.setProperty('--card-border-style', "solid");
            if (fontFamilySelect) {
              fontFamilySelect.value = "${currentFont.fontFamily}";
            }
            document.documentElement.style.setProperty('--card-font-family', "${currentFont.fontFamily}");
            document.documentElement.style.setProperty('--card-font-weight', "${currentFont.fontWeight || 700}");
            document.documentElement.style.setProperty('--is-bw', '0');
            document.documentElement.classList.remove('bw-mode');
            colorBtn.classList.add('active-color');
            bwBtn.classList.remove('active-color');
            document.querySelectorAll('.card').forEach(c => {
              c.classList.remove('has-frame');
              c.removeAttribute('data-hide-title-bg');
              c.setAttribute('data-title-pos', 'top-left');
              const orig = c.getAttribute('data-original-color');
              if (orig) c.style.setProperty('--card-color', orig);
            });
            document.querySelectorAll('.card .custom-frame-overlay').forEach(el => el.remove());
          }

          resetBtn.addEventListener('click', handleFullReset);
          if (modalResetBtn) modalResetBtn.addEventListener('click', handleFullReset);

          let currentUniformColor = '#3B82F6';

          fontSizeSlider.addEventListener('input', (e) => {
            const val = e.target.value + 'pt';
            fontSizeVal.textContent = val;
            document.documentElement.style.setProperty('--card-font-size', val);
          });

          borderSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            const cards = document.querySelectorAll('.card');

            cards.forEach((card, idx) => {
              let frameId = val;
              if (val === 'slots') {
                frameId = window.slotFrameIds[idx % 3] || 'none';
              }

              card.querySelectorAll('.custom-frame-overlay').forEach(el => el.remove());
              const url = window.savedFramesMap[frameId];
              const pos = window.savedFramesPosMap[frameId] || 'top-left';
              const hideBg = window.savedFramesHideBgMap[frameId] || false;
              card.setAttribute('data-frame-id', frameId);
              card.setAttribute('data-title-pos', pos);

              if (titleBgSelect && titleBgSelect.value === 'hide') {
                card.setAttribute('data-hide-title-bg', 'true');
              } else if (titleBgSelect && titleBgSelect.value === 'show') {
                card.setAttribute('data-hide-title-bg', 'false');
              } else {
                card.setAttribute('data-hide-title-bg', hideBg ? 'true' : 'false');
              }

              if (url) {
                card.classList.add('has-frame');
                card.insertAdjacentHTML('afterbegin', '<img src="' + url + '" class="custom-frame-overlay" />');
              } else {
                card.classList.remove('has-frame');
              }
            });
          });

          const fontFamilySelect = document.getElementById('fontFamilySelect');
          if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
              const selectedOpt = e.target.options[e.target.selectedIndex];
              document.documentElement.style.setProperty('--card-font-family', e.target.value);
              if (selectedOpt && selectedOpt.dataset && selectedOpt.dataset.weight) {
                document.documentElement.style.setProperty('--card-font-weight', selectedOpt.dataset.weight);
              }
            });
          }

          if (titleBgSelect) {
            titleBgSelect.addEventListener('change', (e) => {
              const val = e.target.value;
              const cards = document.querySelectorAll('.card');
              cards.forEach(card => {
                if (val === 'hide') {
                  card.setAttribute('data-hide-title-bg', 'true');
                } else if (val === 'show') {
                  card.setAttribute('data-hide-title-bg', 'false');
                } else {
                  const frameId = card.getAttribute('data-frame-id') || 'none';
                  const hide = window.savedFramesHideBgMap[frameId] || false;
                  card.setAttribute('data-hide-title-bg', hide ? 'true' : 'false');
                }
              });
            });
          }

          const titleTopSlider = document.getElementById('titleTopSlider');
          const titleTopVal = document.getElementById('titleTopVal');
          if (titleTopSlider && titleTopVal) {
            titleTopSlider.addEventListener('input', (e) => {
              const val = e.target.value + 'px';
              titleTopVal.textContent = val;
              document.documentElement.style.setProperty('--title-top-offset', val);
            });
          }

          colorModeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            const cards = document.querySelectorAll('.card');
            if (mode === 'uniform') {
              uniformColorContainer.style.display = 'flex';
              cards.forEach(card => {
                card.style.setProperty('--card-color', currentUniformColor);
              });
            } else {
              uniformColorContainer.style.display = 'none';
              cards.forEach(card => {
                const orig = card.getAttribute('data-original-color');
                if (orig) {
                  card.style.setProperty('--card-color', orig);
                }
              });
            }
            document.documentElement.style.setProperty('--is-bw', '0');
            document.documentElement.classList.remove('bw-mode');
            bwBtn.classList.remove('active-color');
            colorBtn.classList.add('active-color');
          });

          colorDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
              colorDots.forEach(d => d.style.borderColor = 'white');
              e.target.style.borderColor = '#000';
              currentUniformColor = e.target.getAttribute('data-color');
              customColorPicker.value = currentUniformColor;
              if (colorModeSelect.value === 'uniform') {
                const cards = document.querySelectorAll('.card');
                cards.forEach(card => {
                  card.style.setProperty('--card-color', currentUniformColor);
                });
              }
            });
          });

          customColorPicker.addEventListener('input', (e) => {
            currentUniformColor = e.target.value;
            colorDots.forEach(d => d.style.borderColor = 'white');
            if (colorModeSelect.value === 'uniform') {
              const cards = document.querySelectorAll('.card');
              cards.forEach(card => {
                card.style.setProperty('--card-color', currentUniformColor);
              });
            }
          });
          
          colorBtn.addEventListener('click', () => {
            document.documentElement.style.setProperty('--is-bw', '0');
            document.documentElement.classList.remove('bw-mode');
            colorBtn.classList.add('active-color');
            bwBtn.classList.remove('active-color');
          });
          
          bwBtn.addEventListener('click', () => {
            document.documentElement.style.setProperty('--is-bw', '1');
            document.documentElement.classList.add('bw-mode');
            bwBtn.classList.add('active-color');
            colorBtn.classList.remove('active-color');
          });
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  const handleNext = () => {
    playClickSound();
    setIsFlipped(false);
    if (currentIndex < displayWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      playSuccessSound();
    }
  };

  const handlePrev = () => {
    playClickSound();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleFlip = () => {
    playClickSound();
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted || isFinished) return;

      if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (e.code === 'Space') {
        e.preventDefault();
        playClickSound();
        setIsAutoPlay((prev) => !prev);
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    if (hasStarted && !isFinished && displayWords[currentIndex]) {
      // Small delay to allow flip animation to start
      const timer = setTimeout(() => {
        if (!isFlipped) {
          speakText(displayWords[currentIndex].word, 'km-KH');
        } else {
          speakText(displayWords[currentIndex].definition, 'km-KH');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFlipped, hasStarted, isFinished, displayWords]);

  if (isFinished) {
    return (
      <div className={`font-sans flex flex-col items-center justify-center min-h-screen p-6 text-center ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F9F7F2]' : 'bg-transparent'}`}>
        <div className="bg-white p-10 rounded-[40px] border border-border-beige soft-shadow max-w-md w-full">
          <div className="w-24 h-24 mx-auto bg-sage/10 text-sage rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-normal text-charcoal mb-4 tracking-tight">អ្នកបានបញ្ចប់ហើយ!</h2>
          <p className="text-soft-gray mb-8 font-semibold">អ្នកបានរៀនពាក្យទាំងអស់នៅក្នុងបញ្ជីនេះ។</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                playClickSound();
                setIsFinished(false);
                setCurrentIndex(0);
                setIsAutoPlay(false);
              }}
              className="w-full py-4 bg-sage text-white font-bold rounded-2xl hover:bg-[#768a63] transition-all cursor-pointer shadow-md text-lg"
            >
              លេងម្ដងទៀត (Play Again)
            </button>
            <button
              onClick={() => { 
                playClickSound(); 
                if (document.fullscreenElement && document.exitFullscreen) {
                  document.exitFullscreen();
                }
                setIsFullscreen(false);
                onBack(); 
              }}
              className="w-full py-4 bg-white border border-border-beige text-charcoal font-bold rounded-2xl hover:bg-stone-bg transition-all cursor-pointer shadow-sm text-lg"
            >
              ត្រឡប់ទៅវិញ (Go Back)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (displayWords.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center font-sans">
        <HelpCircle size={48} className="text-border-beige mb-3" />
        <p className="text-charcoal font-bold mb-2">មិនមានពាក្យសិក្សានៅក្នុងបញ្ជីប្រភេទនេះទេ!</p>
        <p className="text-sm text-soft-gray mb-6">សូមជ្រើសរើសប្រភេទផ្សេងទៀត ឬត្រឡប់ទៅវិញ</p>
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => { playClickSound(); setFilterType(e.target.value); }}
            className="px-4 py-2.5 border border-border-beige bg-white rounded-2xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay text-charcoal cursor-pointer shadow-sm"
          >
            {uniqueWordTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
      
          </select>
          <button
            onClick={() => { playClickSound(); onBack(); }}
            className="px-6 py-2.5 bg-sage hover:bg-[#768a63] text-white font-bold rounded-2xl transition-all cursor-pointer shadow-sm"
          >
            ត្រឡប់ទៅវិញ
          </button>
        </div>
      </div>
    );
  }

  const currentWord = displayWords[currentIndex];

  return (
    <div className={`font-sans transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F9F7F2] p-8 md:p-12 lg:p-16 flex items-center justify-center' : 'min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8'}`}>
      <div className={`w-full mx-auto flex flex-col h-full items-center justify-center transition-all duration-300 ${isFullscreen ? 'max-w-full' : 'max-w-7xl'}`}>
        
        {/* Header bar */}
        {!isFullscreen && (
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { playClickSound(); onBack(); }}
              className="p-3 bg-white hover:bg-stone-bg border border-border-beige rounded-full shadow-sm transition-all text-charcoal hover:text-black cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">បណ្ណពាក្យ (Flashcards)</h1>
              <p className="text-soft-gray text-sm mt-0.5 font-semibold">រៀនពាក្យម្តងមួយៗ</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <button
               onClick={() => { playClickSound(); setShowFontModal(true); }}
               className="px-3.5 py-2.5 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
               title="ប្ដូរពុម្ពអក្សរបណ្ណពាក្យ (Change Font)"
             >
               <Type size={20} className="text-blue-600" />
               <span className="text-xs font-bold hidden md:inline">ពុម្ពអក្សរ</span>
             </button>
             <button
               onClick={() => { playClickSound(); setShowFrameModal(true); }}
               className="px-3.5 py-2.5 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
               title="ជ្រើសរើសរូបភាពស៊ុម / ម៉ូដស៊ុម"
             >
               <Frame size={20} className="text-amber-500" />
               <span className="text-xs font-bold hidden md:inline">ម៉ូដស៊ុម</span>
             </button>
             <button
               onClick={handlePrintCards}
               className="p-2.5 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
               title="បោះពុម្ពជា PDF"
             >
               <Printer size={20} />
             </button>
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2.5 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-sm transition-all cursor-pointer"
                >
                  <Settings size={20} />
                </button>
                {showSettings && (
                  <div className="absolute top-full mt-2 right-0 bg-white border border-border-beige p-4 rounded-xl shadow-lg z-10 w-64">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-charcoal">ការកំណត់ (Settings)</h3>
                      <button onClick={() => setShowSettings(false)} className="text-soft-gray hover:text-clay cursor-pointer"><XCircle size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-soft-gray block mb-1.5">ពុម្ពអក្សរ (Font Style)</label>
                        <select
                          value={selectedFontId}
                          onChange={(e) => { playClickSound(); setSelectedFontId(e.target.value); }}
                          className="w-full px-2.5 py-2 border border-border-beige bg-white rounded-lg text-xs font-bold text-charcoal cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {KHMER_FONTS.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>

                      {topicName && (
                        <div className="pt-2 border-t border-border-beige">
                          <label className="flex items-center gap-2 text-xs font-bold text-charcoal cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeTitleCard}
                              onChange={(e) => {
                                playClickSound();
                                setIncludeTitleCard(e.target.checked);
                                setCurrentIndex(0);
                                setIsFlipped(false);
                              }}
                              className="w-4 h-4 text-amber-600 rounded border-border-beige cursor-pointer accent-amber-600"
                            />
                            <span>បណ្ណចំណងជើងមេរៀន (Title Card)</span>
                          </label>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border-beige">
                        <label className="text-xs font-bold text-soft-gray block mb-1.5">ល្បឿនប្ដូរកាត (Speed)</label>
                        <div className="flex gap-2">
                          {[3000, 5000, 10000].map(time => (
                            <button
                              key={time}
                              onClick={() => { playClickSound(); setAutoPlayInterval(time); }}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${autoPlayInterval === time ? 'bg-sage text-white border-sage' : 'bg-white text-soft-gray border-border-beige hover:bg-stone-bg'}`}
                            >
                              {time / 1000}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>

            <button
              onClick={() => { playClickSound(); setIsAutoPlay(!isAutoPlay); }}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-full border transition-all shadow-sm cursor-pointer ${
                isAutoPlay ? 'bg-clay text-white border-clay' : 'bg-white text-charcoal border-border-beige hover:bg-stone-bg'
              }`}
            >
              {isAutoPlay ? <Pause size={18} /> : <Play size={18} />}
              <span className="text-sm hidden sm:inline">{isAutoPlay ? 'បញ្ឈប់ (Pause)' : 'លេង (Auto)'}</span>
            </button>
            
            <button
              onClick={handleFullscreenToggle}
              className="p-2.5 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-sm transition-all cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullscreen ? "បិទពេញអេក្រង់" : "ពេញអេក្រង់"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            <div className="text-sm font-bold text-soft-gray bg-white px-4 py-2 rounded-full border border-border-beige shadow-sm">
              {currentIndex + 1} / {displayWords.length}
            </div>
          </div>
        </div>
        )}

        {/* Category Filter Pills (When playing) */}
        {!isFullscreen && (
          <div className="w-full flex items-center justify-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none flex-wrap">
            {uniqueWordTypes.map((type) => {
              const isSelected = filterType === type;
              let count = words.length;
              if (type === 'ពាក្យពិបាក') count = categoryStats.difficultCount;
              else if (type === 'ពាក្យផ្ទុយ') count = categoryStats.antonymCount;
              else if (type === 'អត្ថបទខ្លី') count = categoryStats.passageCount;
              else if (type !== 'ទាំងអស់') count = words.filter(w => w.wordType === type).length;

              return (
                <button
                  key={type}
                  onClick={() => {
                    playClickSound();
                    setFilterType(type);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md scale-102 ring-2 ring-amber-400/40'
                      : 'bg-white text-slate-700 hover:bg-amber-50/60 border border-border-beige'
                  }`}
                >
                  <span>{type}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Flashcard Area */}
        <div className={`w-full relative perspective-1000 transition-all duration-300 ${isFullscreen ? 'h-full max-w-full flex-1 min-h-[60vh]' : 'h-[60vh] md:h-[70vh] mt-4'}`}>
          {isFullscreen && (
            <button
              onClick={handleFullscreenToggle}
              className="absolute -top-4 -right-4 md:-right-6 md:-top-6 p-3 md:p-4 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-md transition-all cursor-pointer z-[60]"
              title="បិទពេញអេក្រង់"
            >
              <Minimize size={24} />
            </button>
          )}

          {isFullscreen && hasStarted && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-2 md:-left-8 lg:-left-16 top-1/2 -translate-y-1/2 p-3 md:p-5 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-md transition-all cursor-pointer z-[60] active:scale-95"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-2 md:-right-8 lg:-right-16 top-1/2 -translate-y-1/2 p-3 md:p-5 bg-white border border-border-beige text-charcoal hover:bg-stone-bg rounded-full shadow-md transition-all cursor-pointer z-[60] active:scale-95"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            {!hasStarted ? (
              <motion.div
                key="start-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full"
              >
                <div className="w-full h-full border-4 sm:border-8 rounded-[40px] p-8 sm:p-10 soft-shadow flex flex-col items-center justify-center text-center relative overflow-hidden bg-white border-border-beige">
                  <div className="w-24 h-24 mx-auto bg-orange-500 text-white rounded-[28px] flex items-center justify-center mb-8 shadow-md">
                    <BookOpen size={48} />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-normal text-charcoal mb-4 tracking-tight">ប័ណ្ណពាក្យ (Flashcards)</h2>
                  <p className="text-xl text-soft-gray mb-6 font-semibold">រៀនពាក្យតាមរយៈប័ណ្ណពាក្យ (Flip cards) ចំនួន {activeWords.length} ពាក្យ</p>
                  
                  {/* Category Filter and Font selector in start screen */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 w-full max-w-lg">
                    <div className="flex flex-col gap-1.5 bg-[#F9F7F2] border border-border-beige px-4 py-2.5 rounded-2xl text-left">
                      <span className="text-xs font-bold text-soft-gray">ប្រភេទពាក្យ (Category)៖</span>
                      <select
                        value={filterType}
                        onChange={(e) => { playClickSound(); setFilterType(e.target.value); }}
                        className="w-full px-2.5 py-1.5 border border-border-beige bg-white rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay text-charcoal cursor-pointer"
                      >
                        {uniqueWordTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-[#F9F7F2] border border-border-beige px-4 py-2.5 rounded-2xl text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-soft-gray">ពុម្ពអក្សរ (Font Style)៖</span>
                        <button
                          type="button"
                          onClick={() => { playClickSound(); setShowFontModal(true); }}
                          className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          ជ្រើសរើស
                        </button>
                      </div>
                      <select
                        value={selectedFontId}
                        onChange={(e) => { playClickSound(); setSelectedFontId(e.target.value); }}
                        className="w-full px-2.5 py-1.5 border border-border-beige bg-white rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-charcoal cursor-pointer"
                      >
                        {KHMER_FONTS.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playClickSound();
                      setHasStarted(true);
                    }}
                    className="w-full max-w-sm py-4 bg-sage text-white font-bold rounded-2xl hover:bg-[#768a63] transition-all cursor-pointer shadow-md text-lg active:scale-95"
                  >
                    ចាប់ផ្ដើមលេង (Start)
                  </button>
                </div>
              </motion.div>
            ) : (() => {
              const activeStudyFrameId = frameSelectionMode === 'slots' ? (slotFrameIds[currentIndex % 3] || 'none') : activeFrameId;
              const activeStudyFrameUrl = getFrameUrlById(activeStudyFrameId);
              const activeStudyFrameTitlePos = getFrameTitlePosById(activeStudyFrameId);
              const activeStudyFrameHideBg = getFrameHideTitleBgById(activeStudyFrameId);

              return (
                <motion.div
                  key={currentIndex + (isFlipped ? '-back' : '-front')}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 w-full h-full cursor-pointer"
                  onClick={handleFlip}
                >
                  <div className={`w-full h-full rounded-[40px] p-8 sm:p-10 soft-shadow flex flex-col items-center justify-center text-center relative overflow-hidden group transition-colors duration-500 ${
                    activeStudyFrameUrl 
                      ? 'border-2 border-amber-300 bg-white' 
                      : (isFlipped 
                          ? 'border-4 sm:border-8 border-border-beige bg-charcoal text-white' 
                          : `border-4 sm:border-8 ${vibrantBorderColors[currentIndex % vibrantBorderColors.length]} bg-white`)
                  }`}>
                  
                  {/* Custom Frame Overlay Image */}
                  {activeStudyFrameUrl && (
                    <img 
                      src={activeStudyFrameUrl} 
                      alt="Custom Card Frame" 
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" 
                    />
                  )}

                  {/* Title Position Label on Card */}
                  {!isTitleCardWord(currentWord) && (
                    <div className={`absolute z-[50] text-xs font-bold px-4 py-1.5 transition-all ${
                      getStudyCardTitlePositionClasses(activeStudyFrameTitlePos)
                    } ${
                      activeStudyFrameHideBg
                        ? 'bg-transparent text-[var(--card-color)] border-0 shadow-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]'
                        : isFlipped 
                          ? 'bg-white/10 text-stone-200 border-0 rounded-full' 
                          : 'bg-white/85 text-[var(--card-color)] border border-amber-300/60 shadow-xs rounded-full'
                    }`}>
                      {(() => {
                        const isAntonym = isAntonymWord(currentWord);
                        return currentWord.wordType ? currentWord.wordType.trim() : (isAntonym ? 'ពាក្យផ្ទុយ' : 'ពាក្យពិបាក');
                      })()}
                    </div>
                  )}
                  
                  {/* Flip Indicator and Play (Fullscreen) */}
                  <div className="absolute top-6 right-6 flex items-center gap-4 z-[60]">
                  {isFullscreen && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound();
                        setIsAutoPlay(!isAutoPlay);
                      }}
                      className={`transition-colors cursor-pointer ${isAutoPlay ? 'text-clay' : (isFlipped ? 'text-gray-400 hover:text-white' : 'text-border-beige hover:text-sage')}`}
                      title={isAutoPlay ? "បញ្ឈប់ (Pause)" : "លេង (Auto)"}
                    >
                      {isAutoPlay ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                  )}
                  <div className={`transition-colors ${isFlipped ? 'text-gray-400 group-hover:text-white' : 'text-border-beige group-hover:text-sage'}`}>
                    <RotateCw size={24} />
                  </div>
                </div>

                {!isFlipped ? (
                  // FRONT OF CARD
                  isTitleCardWord(currentWord) ? (
                    <div className="flex flex-col items-center justify-center gap-4 relative z-30 w-full px-4 sm:px-8 max-w-4xl text-center">
                      <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs sm:text-sm font-bold border border-amber-200 shadow-xs">
                        🏷️ បណ្ណចំណងជើងមេរៀន
                      </span>
                      <h2 
                        style={{ 
                          fontFamily: currentFont.fontFamily,
                          fontWeight: currentFont.fontWeight || 700 
                        }}
                        className={`text-3xl sm:text-5xl md:text-6xl font-black leading-relaxed tracking-normal text-center select-none ${vibrantColors[currentIndex % vibrantColors.length]}`}
                      >
                        {currentWord.word}
                      </h2>
                      <span className="text-xs sm:text-sm text-soft-gray font-medium">
                        (ចុចដើម្បីមើលព័ត៌មាន ឬបន្តទៅបណ្ណបន្ទាប់)
                      </span>
                    </div>
                  ) : parseAntonymPair(currentWord.word).isAntonym ? (
                    (() => {
                      const antonymInfo = parseAntonymPair(currentWord.word);
                      return (
                        <div className="flex flex-col items-center justify-center gap-4 relative z-30 w-full">
                          <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8 flex-wrap">
                            <span 
                              style={{ 
                                fontFamily: currentFont.fontFamily,
                                fontWeight: currentFont.fontWeight || 700 
                              }}
                              className={`text-5xl sm:text-7xl md:text-8xl tracking-tight select-none ${vibrantColors[currentIndex % vibrantColors.length]}`}
                            >
                              {antonymInfo.w1}
                            </span>
                            <span className="flex items-center justify-center text-amber-600 select-none px-2 self-center opacity-90">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="8" x2="20" y2="8" />
                                <line x1="4" y1="16" x2="20" y2="16" />
                                <line x1="18" y1="3" x2="6" y2="21" />
                              </svg>
                            </span>
                            <span 
                              style={{ 
                                fontFamily: currentFont.fontFamily,
                                fontWeight: currentFont.fontWeight || 700 
                              }}
                              className={`text-5xl sm:text-7xl md:text-8xl tracking-tight select-none ${vibrantColors[(currentIndex + 1) % vibrantColors.length]}`}
                            >
                              {antonymInfo.w2}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  ) : isPassageWord(currentWord) ? (
                    <div className="flex flex-col items-center justify-center gap-4 relative z-30 w-full px-4 sm:px-8 max-w-4xl">
                      <h2 
                        style={{ 
                          fontFamily: currentFont.fontFamily,
                          fontWeight: currentFont.fontWeight || 700 
                        }}
                        className={`text-2xl sm:text-4xl md:text-5xl font-bold leading-relaxed tracking-normal text-center select-none ${vibrantColors[currentIndex % vibrantColors.length]}`}
                      >
                        {currentWord.word}
                      </h2>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 relative z-30">
                      <h2 
                        style={{ 
                          fontFamily: currentFont.fontFamily,
                          fontWeight: currentFont.fontWeight || 700 
                        }}
                        className={`text-7xl md:text-[9rem] tracking-tight mt-2 md:mt-6 select-none ${vibrantColors[currentIndex % vibrantColors.length]}`}
                      >
                        {currentWord.word}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-6 md:mt-10">
                        {currentWord.parts.map((p, pIdx) => (
                          <span 
                            key={pIdx} 
                            style={{ 
                              fontFamily: currentFont.fontFamily,
                              fontWeight: currentFont.fontWeight || 700 
                            }}
                            className={`px-4 py-2 md:px-6 md:py-3 rounded-2xl text-xl md:text-3xl text-white shadow-sm ${vibrantBgColors[currentIndex % vibrantBgColors.length]}`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  // BACK OF CARD
                  <div className="flex flex-col items-center gap-6 w-full px-4 relative z-30">
                    <div className="text-center w-full max-w-4xl">
                      <span className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-wide block mb-4">
                        {isTitleCardWord(currentWord) ? 'ចំណងជើងមេរៀន ៖' : (isAntonymWord(currentWord) ? 'ពាក្យផ្ទុយ និងអត្ថន័យ ៖' : (isPassageWord(currentWord) ? 'អត្ថបទខ្លី និងការបកស្រាយ ៖' : 'អត្ថន័យ និងការបកស្រាយ៖'))}
                      </span>
                      <p className="text-xl md:text-3xl text-gray-100 leading-relaxed font-semibold">
                        {currentWord.definition}
                      </p>
                    </div>

                    {isTitleCardWord(currentWord) && (
                      <div className="mt-2 px-5 py-2.5 bg-white/10 rounded-2xl border border-white/20 text-stone-200 text-sm md:text-base font-medium">
                        ចំនួនពាក្យក្នុងមេរៀននេះ ៖ <span className="font-bold text-amber-300">{words.length} បណ្ណ</span>
                      </div>
                    )}

                    {currentWord.example && (
                      <div className="text-center w-full max-w-4xl mt-6">
                        <span className="text-sm md:text-base font-bold text-[#A0BCA0] uppercase tracking-wide block mb-3">
                          ល្បះគំរូ៖
                        </span>
                        <p className="text-lg md:text-2xl text-[#8BA888] leading-relaxed font-bold italic">
                          {currentWord.example}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
        
        {/* Navigation Controls */}
        {!isFullscreen && hasStarted && (
        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            onClick={handlePrev}
            className="p-4 bg-white border border-border-beige text-charcoal hover:bg-stone-bg hover:text-black rounded-full shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <ChevronLeft size={32} />
          </button>
          
          <button
            onClick={handleFlip}
            className="px-8 py-4 bg-sage hover:bg-[#768a63] text-white font-bold rounded-full transition-all cursor-pointer shadow-md shadow-sage/20 active:scale-95"
          >
            ត្រឡប់កាត (Flip)
          </button>

          <button
            onClick={handleNext}
            className="p-4 bg-white border border-border-beige text-charcoal hover:bg-stone-bg hover:text-black rounded-full shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <ChevronRight size={32} />
          </button>
        </div>
        )}

        {/* Frame Selection Modal */}
        {showFrameModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-border-beige max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                    <FolderHeart size={26} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-charcoal">បណ្ណាល័យស៊ុមបណ្ណពាក្យ (Custom Frames Library)</h2>
                    <p className="text-xs text-soft-gray">បញ្ចូល រក្សាទុក និងជ្រើសរើសរូបភាពស៊ុមសម្រាប់ប្រើប្រាស់លើបណ្ណពាក្យបោះពុម្ព</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFrameModal(false)}
                  className="p-2 text-soft-gray hover:text-charcoal rounded-full hover:bg-stone-bg transition-all cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* Toast Success Message */}
              {frameSuccessMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span>{frameSuccessMessage}</span>
                </div>
              )}

              {/* Mode Selection Tabs & Gallery Header */}
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <h3 className="text-sm font-bold text-charcoal">
                    🖼️ ស៊ុមក្នុងបណ្ណាល័យ ({savedFrames.length})
                  </h3>
                  
                  {/* Button to Open Upload Popup Modal */}
                  <button
                    onClick={() => {
                      playClickSound();
                      setShowUploadModal(true);
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={16} />
                    <span>បញ្ចូលស៊ុមថ្មី (Add Frame)</span>
                  </button>
                </div>

                {/* Selection Mode Switcher */}
                <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
                  <button
                    onClick={() => { playClickSound(); setFrameSelectionMode('single'); }}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      frameSelectionMode === 'single'
                        ? 'bg-white text-amber-700 shadow-sm'
                        : 'text-soft-gray hover:text-charcoal'
                    }`}
                  >
                    ប្រើស៊ុមតែមួយគ្រប់បណ្ណ
                  </button>
                  <button
                    onClick={() => { playClickSound(); setFrameSelectionMode('slots'); }}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      frameSelectionMode === 'slots'
                        ? 'bg-white text-amber-700 shadow-sm'
                        : 'text-soft-gray hover:text-charcoal'
                    }`}
                  >
                    កំណត់តាមបណ្ណ 1, 2, 3
                  </button>
                </div>
              </div>

              {/* Single Mode Gallery Grid */}
              {frameSelectionMode === 'single' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {/* No Frame Option */}
                  <div
                    onClick={() => { playClickSound(); setActiveFrameId('none'); }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-32 transition-all cursor-pointer relative ${
                      activeFrameId === 'none'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/30'
                        : 'border-border-beige bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-2xl">⏹️</span>
                      {activeFrameId === 'none' && (
                        <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-charcoal">គ្មានស៊ុមរូបភាព (No Frame)</div>
                      <div className="text-[10px] text-soft-gray mt-0.5">បន្ទាត់ធម្មតា សាមញ្ញ</div>
                    </div>
                  </div>

                  {/* Saved Custom Frames Cards */}
                  {savedFrames.map((frame) => {
                    const isSelected = activeFrameId === frame.id;
                    const currentPos = normalizeTitlePos(frame.titlePosition);
                    const hideBg = Boolean(frame.hideTitleBg);
                    return (
                      <div
                        key={frame.id}
                        onClick={() => { playClickSound(); setActiveFrameId(frame.id); }}
                        className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/30'
                            : 'border-border-beige bg-white hover:bg-stone-50'
                        }`}
                      >
                        {/* Frame Thumbnail Preview */}
                        <div className="w-full h-18 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200/80 flex items-center justify-center">
                          <img src={frame.url} alt={frame.name} className="w-full h-full object-fill" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                          <span className={`absolute z-20 text-[9px] font-bold transition-all px-1.5 py-0.5 rounded-full ${
                            getTitlePositionClasses(currentPos)
                          } ${
                            hideBg 
                              ? 'bg-transparent text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]' 
                              : 'text-amber-900 bg-white/90 border border-amber-300 shadow-2xs'
                          }`}>
                            ចំណងជើង
                          </span>
                        </div>

                        {/* Text and Actions */}
                        <div className="flex items-center justify-between mt-1.5 gap-1">
                          <div className="text-xs font-bold text-charcoal truncate flex-1">{frame.name}</div>
                          
                          <div className="flex items-center gap-1">
                            {isSelected && (
                              <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs shrink-0">
                                <Check size={12} />
                              </span>
                            )}
                            <button
                              onClick={(e) => handleDeleteFrame(frame.id, e)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0"
                              title="លុបស៊ុមនេះ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Title Background Toggle & Position Selector */}
                        <div className="mt-2 pt-1.5 border-t border-amber-100 flex flex-col gap-1.5 text-[10px]" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-600">ផ្ទៃស៖</span>
                            <button
                              type="button"
                              onClick={(e) => handleToggleFrameTitleBg(frame.id, e)}
                              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer text-[10px] flex items-center gap-1 ${
                                hideBg 
                                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200' 
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                              }`}
                              title={hideBg ? "ចុចដើម្បីបង្ហាញផ្ទៃស" : "ចុចដើម្បីលុបផ្ទៃស"}
                            >
                              {hideBg ? '🚫 គ្មានផ្ទៃស' : '⬜ មានផ្ទៃស'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-stone-600 shrink-0">តម្រឹម ៩ ៖</span>
                            <select
                              value={currentPos}
                              onChange={(e) => handleUpdateFrameTitlePos(frame.id, e.target.value as FrameTitlePosition, e)}
                              className="p-1 text-[10px] font-bold border border-stone-200 bg-stone-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer w-32"
                            >
                              {FRAME_POSITIONS.map(p => (
                                <option key={p.id} value={p.id}>{p.label.split(' ')[0]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Slot Mode Selection Box (Card 1, 2, 3) */}
              {frameSelectionMode === 'slots' && (
                <div className="mb-6 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                  <h3 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
                    <Palette size={16} className="text-amber-600" />
                    ជ្រើសរើសស៊ុមសម្រាប់បណ្ណទី 1, 2, 3 លើទំព័រតែមួយ ៖
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map((slotIdx) => (
                      <div key={slotIdx} className="p-3 bg-white border border-amber-200 rounded-xl">
                        <label className="text-xs font-bold text-amber-900 block mb-1.5">
                          📌 បណ្ណទី{slotIdx + 1} (Card {slotIdx + 1})
                        </label>
                        <select
                          value={slotFrameIds[slotIdx]}
                          onChange={(e) => {
                            playClickSound();
                            const updated = [...slotFrameIds] as [string, string, string];
                            updated[slotIdx] = e.target.value;
                            setSlotFrameIds(updated);
                          }}
                          className="w-full p-2 border border-border-beige rounded-lg text-xs bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                        >
                          <option value="none">⏹️ គ្មានស៊ុម (No Frame)</option>
                          {savedFrames.map(f => (
                            <option key={f.id} value={f.id}>🖼️ {f.name}</option>
                          ))}
                        </select>

                        {/* Mini Slot Preview */}
                        <div className="mt-2 h-14 bg-slate-50 border rounded-lg relative overflow-hidden flex items-center justify-center">
                          {getFrameUrlById(slotFrameIds[slotIdx]) ? (
                            <img src={getFrameUrlById(slotFrameIds[slotIdx])} alt="Slot Frame" className="w-full h-full object-fill" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">គ្មានស៊ុម</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sheet Live Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-200">
                <span className="text-xs font-bold text-soft-gray block mb-3">មើលគំរូសន្លឹកបណ្ណពាក្យក្នុង ១ទំព័រមាន ៣បណ្ណ (Live Sheet Preview)</span>
                
                <div className="flex gap-2 justify-center items-center max-w-lg mx-auto">
                  {[0, 1, 2].map((idx) => {
                    const currentFrameId = frameSelectionMode === 'slots' ? slotFrameIds[idx] : activeFrameId;
                    const frameUrl = getFrameUrlById(currentFrameId);
                    const titlePos = getFrameTitlePosById(currentFrameId);
                    const hideBg = getFrameHideTitleBgById(currentFrameId);
                    return (
                      <div key={idx} className="flex-1 h-24 sm:h-28 bg-white rounded-xl relative flex flex-col items-center justify-center p-2 shadow-sm overflow-hidden border-2 border-amber-400">
                        {frameUrl && (
                          <img src={frameUrl} alt="Frame Overlay" className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                        )}
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 absolute z-30 transition-all ${
                          getTitlePositionClasses(titlePos)
                        } ${
                          hideBg
                            ? 'bg-transparent text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]'
                            : 'text-amber-900 bg-white/90 border border-amber-300 shadow-2xs'
                        }`}>
                          ចំណងជើង
                        </span>
                        <span 
                          style={{ fontFamily: currentFont.fontFamily }}
                          className="text-xs font-bold text-charcoal relative z-20 mt-3"
                        >
                          បណ្ណទី{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close / Apply Footer Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    playClickSound();
                    setShowFrameModal(false);
                  }}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md text-sm flex items-center gap-2"
                >
                  <Check size={18} />
                  <span>រក្សាទុក និងអនុវត្ត (Apply Custom Frame)</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Upload New Frame Popup Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                    <Plus size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal">បញ្ចូល និងរក្សាទុកស៊ុមថ្មី</h3>
                    <p className="text-xs text-soft-gray">Upload & Save New Custom Frame Image</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    setShowUploadModal(false);
                  }}
                  className="p-1.5 text-soft-gray hover:text-charcoal rounded-full hover:bg-stone-bg transition-all cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-4">
                {/* Frame Name */}
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    ឈ្មោះស៊ុម (Frame Name) ៖
                  </label>
                  <input
                    type="text"
                    placeholder="ឧទាហរណ៍៖ ស៊ុមភ្ញីផ្កាខ្មែរ..."
                    value={newFrameName}
                    onChange={(e) => setNewFrameName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>

                {/* Browse File Drop Area */}
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    ជ្រើសរើសរូបភាពពីឧបករណ៍ (Browse Image File) ៖
                  </label>
                  <label className={`w-full py-4 px-4 bg-amber-50/50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    isUploadingImage ? 'border-amber-400 bg-amber-100/50 pointer-events-none' : 'border-amber-300 hover:border-amber-500'
                  }`}>
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2 py-1">
                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-amber-900">កំពុងដំណើរការ និងបង្រួមរូបភាពស្វ័យប្រវត្តិ...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-900">ចុចដើម្បីជ្រើសរើសរូបភាព (PNG/JPG/WebP)</span>
                        <span className="text-[10px] text-soft-gray">ណែនាំ៖ រូបភាព PNG ថ្លាកណ្ដាល • ផ្ទុកលើ IndexedDB បានច្រើនមិនកំណត់</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploadingImage} className="hidden" />
                  </label>
                </div>

                {/* Image URL Input Option */}
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    ឬ បញ្ចូល Link រូបភាព (Image URL) ៖
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/frame.png"
                    value={newFrameUrlInput}
                    onChange={(e) => {
                      setNewFrameUrlInput(e.target.value);
                      if (e.target.value) setNewFramePreview(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>

                {/* Title Background Toggle (Remove White Background) */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-charcoal">ផ្ទៃសនៅពីក្រោយចំណងជើង ៖</div>
                    <div className="text-[10px] text-stone-500">លុបផ្ទៃសដើម្បីឲ្យថ្លា បង្ហាញក្បូរក្បាច់ស៊ុមសុទ្ធ</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setNewFrameHideTitleBg(!newFrameHideTitleBg); }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      newFrameHideTitleBg
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {newFrameHideTitleBg ? '🚫 លុបផ្ទៃស (ថ្លា)' : '⬜ មានផ្ទៃស (ធម្មតា)'}
                  </button>
                </div>

                {/* 9 Title Position Selector Grid */}
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1.5 flex items-center justify-between">
                    <span>តម្រឹមទីតាំងចំណងជើង (៩ ទីតាំង) ៖</span>
                    <span className="text-[11px] text-amber-800 font-bold bg-amber-100 px-2.5 py-0.5 rounded-md">
                      {FRAME_POSITIONS.find(p => p.id === newFrameTitlePos)?.label || 'ឆ្វេងលើ'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-stone-100/90 p-2 rounded-2xl border border-stone-200">
                    {FRAME_POSITIONS.map((pos) => {
                      const isSelected = newFrameTitlePos === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => { playClickSound(); setNewFrameTitlePos(pos.id); }}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-1 ring-amber-400'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50/70'
                          }`}
                        >
                          <span className="leading-tight">{pos.label.split(' ')[0]}</span>
                          <span className="text-[9px] opacity-75 font-medium">{pos.label.split(' ')[1]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview Box inside Popup */}
                {newFramePreview && (
                  <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col gap-2">
                    <div className="text-xs font-bold text-amber-900 flex justify-between items-center">
                      <span>មើលគំរូស៊ុម និងទីតាំងចំណងជើង ៖</span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check size={12} /> រួចរាល់
                      </span>
                    </div>
                    <div className="w-full h-28 bg-white rounded-xl border border-amber-300 overflow-hidden relative flex items-center justify-center p-3 shadow-inner">
                      <img src={newFramePreview} alt="Preview" className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                      
                      {/* Dynamic Title Position and Background in Live Preview */}
                      <span className={`absolute z-30 text-[11px] font-bold px-2.5 py-0.5 transition-all ${
                        getTitlePositionClasses(newFrameTitlePos)
                      } ${
                        newFrameHideTitleBg
                          ? 'bg-transparent text-amber-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]'
                          : 'text-amber-900 bg-white/95 border border-amber-300 rounded-full shadow-xs'
                      }`}>
                        ពាក្យ
                      </span>

                      <span 
                        style={{ fontFamily: currentFont.fontFamily }}
                        className="text-lg font-bold text-charcoal relative z-20 mt-3"
                      >
                        {newFrameName || 'ស៊ុមថ្មី'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-stone-50 rounded-xl border text-[11px] text-stone-600 leading-relaxed">
                  💡 <strong>ទំហំស៊ុមណែនាំ (Ratio) ៖</strong> <strong>2.13 : 1</strong> ឬ <strong>2244 × 1051 px</strong> ជាមួយផ្ទៃកណ្ដាលថ្លា (Transparent Center) ដើម្បីកុំឲ្យបាំងអក្សរបណ្ណ។
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    playClickSound();
                    setShowUploadModal(false);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-soft-gray hover:text-charcoal rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>

                <button
                  disabled={!newFramePreview && !newFrameUrlInput}
                  onClick={() => handleSaveNewFrame(newFramePreview || newFrameUrlInput)}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl flex items-center gap-2 shadow transition-all cursor-pointer ${
                    newFramePreview || newFrameUrlInput
                      ? 'bg-amber-500 hover:bg-amber-600 cursor-pointer'
                      : 'bg-stone-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Save size={16} />
                  <span>រក្សាទុកក្នុងបណ្ណាល័យ (Save Frame)</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Font Selection Modal */}
        {showFontModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-border-beige flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <Type size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-charcoal">ជ្រើសរើសពុម្ពអក្សរបណ្ណពាក្យ</h3>
                    <p className="text-xs text-soft-gray font-medium">ផ្លាស់ប្ដូរម៉ូដអក្សរសម្រាប់បណ្ណរៀន និងសន្លឹកកិច្ចការ (Font Style)</p>
                  </div>
                </div>
                <button
                  onClick={() => { playClickSound(); setShowFontModal(false); }}
                  className="text-soft-gray hover:text-clay p-1 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* Live Preview of Current Selected Font */}
              <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-indigo-50/70 border border-blue-100 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-blue-800 mb-1 tracking-wide uppercase">
                  គំរូអក្សរជាក់ស្ដែង (Live Preview) — {currentFont.name}
                </span>
                <div 
                  style={{ 
                    fontFamily: currentFont.fontFamily,
                    fontWeight: currentFont.fontWeight || 700 
                  }} 
                  className="text-4xl sm:text-5xl text-blue-600 py-2 select-none tracking-normal"
                >
                  {currentWord?.word || 'កម្ពុជា'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {currentWord?.parts && currentWord.parts.length > 0 ? (
                    currentWord.parts.map((p, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          fontFamily: currentFont.fontFamily,
                          fontWeight: currentFont.fontWeight || 700 
                        }} 
                        className="px-3 py-1 bg-white text-blue-700 text-sm font-bold rounded-lg shadow-2xs border border-blue-100"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span 
                      style={{ 
                        fontFamily: currentFont.fontFamily,
                        fontWeight: currentFont.fontWeight || 700 
                      }} 
                      className="text-xs text-blue-700/80"
                    >
                      {currentFont.sample}
                    </span>
                  )}
                </div>
              </div>

              {/* Font Options Grid */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-2.5 max-h-[48vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {KHMER_FONTS.map(font => {
                    const isSelected = font.id === selectedFontId;
                    return (
                      <button
                        key={font.id}
                        onClick={() => {
                          playClickSound();
                          setSelectedFontId(font.id);
                        }}
                        className={`text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between group ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/40 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-stone-50/70'
                        }`}
                      >
                        {/* Active check indicator */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}

                        <div>
                          <span className="text-xs font-bold text-charcoal block line-clamp-1 pr-6">
                            {font.name}
                          </span>
                          <span className="text-[11px] text-soft-gray block mt-0.5 mb-2 line-clamp-1">
                            {font.description}
                          </span>
                        </div>

                        <div 
                          style={{ 
                            fontFamily: font.fontFamily,
                            fontWeight: font.fontWeight || 700 
                          }} 
                          className={`text-2xl pt-1 select-none transition-transform group-hover:scale-105 ${
                            isSelected ? 'text-blue-700 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {font.sample}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    playClickSound();
                    setSelectedFontId('battambang');
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-soft-gray hover:text-charcoal rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
                >
                  កំណត់ឡើងវិញ (Reset to Battambang 700)
                </button>

                <button
                  onClick={() => {
                    playSuccessSound();
                    setShowFontModal(false);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Check size={16} />
                  <span>ជ្រើសរើសរួចរាល់ (Apply)</span>
                </button>
              </div>

            </div>
          </div>
        )}

    </div>
    </div>
  );
}
