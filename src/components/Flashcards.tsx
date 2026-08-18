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
  AlignRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound, speakText } from '../utils/audio';

interface FlashcardsProps {
  words: WordItem[];
  onBack: () => void;
}

export interface SavedCustomFrame {
  id: string;
  name: string;
  url: string;
  titlePosition?: 'left' | 'center' | 'right';
  createdAt: number;
}

const DEFAULT_KHMER_FRAME: SavedCustomFrame = {
  id: 'frame_khmer_gold_default',
  name: 'ស៊ុមខ្មែរក្បាច់មាស (Khmer Gold Ornate)',
  url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="380" viewBox="0 0 800 380" fill="none"><rect x="10" y="10" width="780" height="360" rx="24" stroke="%23f59e0b" stroke-width="8"/><rect x="22" y="22" width="756" height="336" rx="16" stroke="%23fbbf24" stroke-width="3" stroke-dasharray="6,6"/><path d="M20,20 L80,20 C50,20 35,35 35,65 C35,35 20,20 20,20 Z" fill="%23f59e0b"/><path d="M20,20 L20,80 C20,50 35,35 65,35 C35,35 20,20 20,20 Z" fill="%23f59e0b"/><path d="M780,20 L720,20 C750,20 765,35 765,65 C765,35 780,20 780,20 Z" fill="%23f59e0b"/><path d="M780,20 L780,80 C780,50 765,35 735,35 C765,35 780,20 780,20 Z" fill="%23f59e0b"/><path d="M20,360 L80,360 C50,360 35,345 35,315 C35,345 20,360 20,360 Z" fill="%23f59e0b"/><path d="M20,360 L20,300 C20,330 35,345 65,345 C35,345 20,360 20,360 Z" fill="%23f59e0b"/><path d="M780,360 L720,360 C750,360 765,345 765,315 C765,345 20,360 20,360 Z" fill="%23f59e0b"/><path d="M780,360 L780,300 C780,330 765,345 735,345 C765,345 780,360 780,360 Z" fill="%23f59e0b"/></svg>',
  titlePosition: 'left',
  createdAt: Date.now() - 100000
};

const DEFAULT_SCHOOL_FRAME: SavedCustomFrame = {
  id: 'frame_school_star_default',
  name: 'ស៊ុមសាលារៀនមេដាយ (School Star Frame)',
  url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="380" viewBox="0 0 800 380" fill="none"><rect x="12" y="12" width="776" height="356" rx="20" stroke="%233b82f6" stroke-width="6"/><rect x="22" y="22" width="756" height="336" rx="14" stroke="%2360a5fa" stroke-width="2"/><circle cx="40" cy="40" r="14" fill="%23f59e0b"/><path d="M40,30 L43,37 L50,37 L45,41 L47,48 L40,44 L33,48 L35,41 L30,37 L37,37 Z" fill="white"/><circle cx="760" cy="40" r="14" fill="%23f59e0b"/><path d="M760,30 L763,37 L770,37 L765,41 L767,48 L760,44 L753,48 L755,41 L750,37 L757,37 Z" fill="white"/><circle cx="40" cy="340" r="14" fill="%23f59e0b"/><path d="M40,330 L43,337 L50,337 L45,341 L47,348 L40,344 L33,348 L35,341 L30,337 L37,337 Z" fill="white"/><circle cx="760" cy="340" r="14" fill="%23f59e0b"/><path d="M760,330 L763,337 L770,337 L765,341 L767,348 L760,344 L753,348 L755,341 L750,337 L757,337 Z" fill="white"/></svg>',
  titlePosition: 'left',
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

export default function Flashcards({ words, onBack }: FlashcardsProps) {
  const [filterType, setFilterType] = useState('ទាំងអស់');

  const uniqueWordTypes = React.useMemo(() => {
    const types = new Set<string>();
    words.forEach(w => {
      if (w.wordType) types.add(w.wordType);
    });
    return ['ទាំងអស់', ...Array.from(types)];
  }, [words]);

  const activeWords = React.useMemo(() => {
    if (filterType === 'ទាំងអស់') return words;
    return words.filter(w => w.wordType === filterType);
  }, [words, filterType]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fontBase64, setFontBase64] = useState<string | null>(null);

  // Saved custom frames state with localStorage persistence
  const [savedFrames, setSavedFrames] = useState<SavedCustomFrame[]>(() => {
    try {
      const saved = localStorage.getItem('khmer_flashcard_saved_frames');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved frames:', e);
    }
    return [DEFAULT_KHMER_FRAME, DEFAULT_SCHOOL_FRAME];
  });

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

  // New frame upload inputs state
  const [newFrameName, setNewFrameName] = useState<string>('');
  const [newFrameUrlInput, setNewFrameUrlInput] = useState<string>('');
  const [newFramePreview, setNewFramePreview] = useState<string>('');
  const [newFrameTitlePos, setNewFrameTitlePos] = useState<'left' | 'center' | 'right'>('left');
  const [frameSuccessMessage, setFrameSuccessMessage] = useState<string>('');

  // Persist saved frames & selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('khmer_flashcard_saved_frames', JSON.stringify(savedFrames));
    } catch (e) {
      console.error('Failed saving frames to localStorage:', e);
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

  const getFrameById = (id: string): SavedCustomFrame | undefined => {
    if (id === 'none') return undefined;
    return savedFrames.find(f => f.id === id);
  };

  const getFrameUrlById = (id: string): string => {
    const found = getFrameById(id);
    return found ? found.url : '';
  };

  const getFrameTitlePosById = (id: string): 'left' | 'center' | 'right' => {
    const found = getFrameById(id);
    return found?.titlePosition || 'left';
  };

  const handleUpdateFrameTitlePos = (frameId: string, pos: 'left' | 'center' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setSavedFrames(prev => prev.map(f => f.id === frameId ? { ...f, titlePosition: pos } : f));
  };

  const handleSaveNewFrame = (urlToSave: string, customName?: string) => {
    if (!urlToSave) return;
    
    const frameName = (customName || newFrameName).trim() || `ស៊ុមទី ${savedFrames.length + 1}`;
    const newFrameObj: SavedCustomFrame = {
      id: 'frame_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: frameName,
      url: urlToSave,
      titlePosition: newFrameTitlePos,
      createdAt: Date.now(),
    };

    setSavedFrames(prev => [newFrameObj, ...prev]);
    setActiveFrameId(newFrameObj.id);
    setNewFrameName('');
    setNewFrameUrlInput('');
    setNewFramePreview('');
    setNewFrameTitlePos('left');
    setShowUploadModal(false);
    
    playSuccessSound();
    setFrameSuccessMessage('បានរក្សាទុកស៊ុមថ្មីក្នុងបណ្ណាល័យជោគជ័យ!');
    setTimeout(() => setFrameSuccessMessage(''), 3500);
  };

  const handleDeleteFrame = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('តើអ្នកពិតជាចង់លុបស៊ុមនេះចេញពីបណ្ណាល័យមែនទេ?')) {
      playClickSound();
      setSavedFrames(prev => prev.filter(f => f.id !== idToDelete));
      if (activeFrameId === idToDelete) {
        setActiveFrameId('none');
      }
      setSlotFrameIds(prev => prev.map(id => id === idToDelete ? 'none' : id) as [string, string, string]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setNewFramePreview(result);
          playClickSound();
        }
      };
      reader.readAsDataURL(file);
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
    
    const pages = Math.ceil(activeWords.length / 3);
    const borderColors = ['#3B82F6', '#F97316', '#16A34A', '#A855F7', '#E11D48', '#0D9488'];
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>សន្លឹកបណ្ណពាក្យ</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Siemreap&family=Battambang:wght@400;700&display=swap');
          @font-face {
            font-family: 'Kh-MPS-Temple';
            src: ${fontBase64 ? `url('data:font/ttf;charset=utf-8;base64,${fontBase64}') format('truetype')` : `url('${window.location.origin}/fonts/Kh-MPS%20Temple.ttf') format('truetype')`};
            font-weight: normal;
            font-style: normal;
          }
          
          :root {
            --body-font-family: 'Kantumruy Pro', sans-serif;
            --card-font-family: 'Kh-MPS-Temple', 'Kantumruy Pro', sans-serif;
            --card-border-style: solid;
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
            background: white;
            padding: 12px 24px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          
          .no-print-left {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
          }
          
          .no-print-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }
          
          select.font-select {
            padding: 6px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-family: inherit;
            outline: none;
          }
          
          .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
            background: white;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .btn:hover {
            background: #f8fafc;
          }
          
          .btn.active-color {
            background: #f0fdf4;
            border-color: #bbf7d0;
            color: #166534;
          }
          
          .btn.print-btn {
            background-color: #0ea5e9;
            color: white;
            border: none;
            font-weight: 600;
          }
          
          .btn.print-btn:hover {
            background-color: #0284c7;
          }
          
          @media print {
            @page {
              size: A4 portrait;
              margin-top: 10mm;
              margin-left: 10mm;
              margin-right: 10mm;
              margin-bottom: 0.2cm;
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
          .card.has-frame .card-top-left {
            top: 20px !important;
          }

          .card[data-title-pos="left"] .card-top-left {
            left: 32px !important;
            right: auto !important;
            transform: none !important;
            text-align: left !important;
          }
          .card[data-title-pos="center"] .card-top-left {
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            text-align: center !important;
          }
          .card[data-title-pos="right"] .card-top-left {
            right: 32px !important;
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
            top: 15px;
            left: 20px;
            color: var(--card-color);
            font-size: 13pt;
            font-weight: 600;
            z-index: 12;
          }
          
          .card-word {
            font-family: var(--card-font-family);
            font-size: 64pt;
            font-weight: normal;
            color: var(--card-color);
            margin: 0;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
            line-height: 1.2;
            text-align: center;
            z-index: 12;
          }
          
          .card-def {
            font-size: 20pt;
            color: #334155;
            margin: 15px 0 0 0;
            text-align: center;
            z-index: 12;
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
        <div class="no-print">
          <div class="no-print-left">
            សន្លឹកបណ្ណពាក្យ៖ ពាក្យពិបាក និងពាក្យជួយ
          </div>
          <div class="no-print-right">
            <div class="control-group">
              <label>ប្ដូរស៊ុមបណ្ណពាក្យ៖</label>
              <select id="borderSelect" class="font-select">
                <option value="none" ${frameSelectionMode === 'single' && activeFrameId === 'none' ? 'selected' : ''}>⏹️ គ្មានស៊ុមរូបភាព (No Frame Image)</option>
                ${savedFrames.map(f => `<option value="${f.id}" ${frameSelectionMode === 'single' && activeFrameId === f.id ? 'selected' : ''}>🖼️ ${f.name}</option>`).join('')}
                <option value="slots" ${frameSelectionMode === 'slots' ? 'selected' : ''}>🎨 កំណត់តាមបណ្ណ 1, 2, 3 (Set per Card)</option>
              </select>
            </div>
            <button class="btn" id="resetBtn">🔄 កំណត់ឡើងវិញ</button>
            <button class="btn active-color" id="colorBtn">🎨 ពណ៌ធម្មជាតិ</button>
            <button class="btn" id="bwBtn">⚫ ស-ខ្មៅ (សន្សំថ្នាំ)</button>
            <button class="btn print-btn" onclick="window.print()">🖨 ទាញយកសន្លឹកកិច្ចការ</button>
          </div>
        </div>
    `;
    
    for (let i = 0; i < pages; i++) {
      htmlContent += `<div class="page">`;
      
      const wordsForPage = activeWords.slice(i * 3, i * 3 + 3);
      
      for (let idx = 0; idx < 3; idx++) {
        const word = wordsForPage[idx];
        const cardGlobalIndex = i * 3 + idx;
        
        // Render cut-line if idx > 0 and the previous card was visible
        if (idx > 0 && wordsForPage[idx - 1]) {
          htmlContent += `<div class="cut-line"></div>`;
        }
        
        if (word) {
          const color = borderColors[cardGlobalIndex % borderColors.length];
          
          // Avoid duplicating "អំណាន ៖" if wordType already contains it
          const typeDisplay = word.wordType 
            ? (word.wordType.includes('អំណាន') ? word.wordType : 'អំណាន ៖ ' + word.wordType)
            : 'អំណាន ៖ ពាក្យ';

          const cardFrameId = frameSelectionMode === 'slots' ? (slotFrameIds[idx] || 'none') : activeFrameId;
          const cardFrameUrl = getFrameUrlById(cardFrameId);
          const cardTitlePos = getFrameTitlePosById(cardFrameId);
          const hasFrame = Boolean(cardFrameUrl);

          let frameMarkup = '';
          if (cardFrameUrl) {
            frameMarkup = `<img src="${cardFrameUrl}" class="custom-frame-overlay" />`;
          }
            
          htmlContent += `
            <div class="card ${hasFrame ? 'has-frame' : ''}" data-frame-id="${cardFrameId}" data-title-pos="${cardTitlePos}" style="--card-color: ${color};">
              ${frameMarkup}
              <div class="card-inner">
                <div class="card-top-left">${typeDisplay}</div>
                <h2 class="card-word">${word.word}</h2>
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
            savedFrames.reduce((acc, f) => { acc[f.id] = f.titlePosition || 'left'; return acc; }, {} as Record<string, string>)
          )};
          window.slotFrameIds = ${JSON.stringify(slotFrameIds)};

          const borderSelect = document.getElementById('borderSelect');
          const resetBtn = document.getElementById('resetBtn');
          const colorBtn = document.getElementById('colorBtn');
          const bwBtn = document.getElementById('bwBtn');

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
              const pos = window.savedFramesPosMap[frameId] || 'left';
              card.setAttribute('data-title-pos', pos);

              if (url) {
                card.classList.add('has-frame');
                card.insertAdjacentHTML('afterbegin', '<img src="' + url + '" class="custom-frame-overlay" />');
              } else {
                card.classList.remove('has-frame');
              }
            });
          });
          
          resetBtn.addEventListener('click', () => {
            borderSelect.value = "none";
            document.documentElement.style.setProperty('--card-border-style', "solid");
            document.documentElement.style.setProperty('--card-font-family', "'Kh-MPS-Temple', 'Kantumruy Pro', sans-serif");
            document.documentElement.style.setProperty('--is-bw', '0');
            document.documentElement.classList.remove('bw-mode');
            colorBtn.classList.add('active-color');
            bwBtn.classList.remove('active-color');
            document.querySelectorAll('.card').forEach(c => c.classList.remove('has-frame'));
            document.querySelectorAll('.card .custom-frame-overlay').forEach(el => el.remove());
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
    if (currentIndex < activeWords.length - 1) {
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
    if (hasStarted && !isFinished && activeWords[currentIndex]) {
      // Small delay to allow flip animation to start
      const timer = setTimeout(() => {
        if (!isFlipped) {
          speakText(activeWords[currentIndex].word, 'km-KH');
        } else {
          speakText(activeWords[currentIndex].definition, 'km-KH');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFlipped, hasStarted, isFinished, activeWords]);

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

  if (activeWords.length === 0) {
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

  const currentWord = activeWords[currentIndex];

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
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-soft-gray block">ល្បឿនប្ដូរកាត (Speed)</label>
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
              {currentIndex + 1} / {activeWords.length}
            </div>
          </div>
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
                  
                  {/* Category Filter selector in start screen */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mb-10 bg-[#F9F7F2] border border-border-beige px-5 py-3 rounded-2xl w-full max-w-sm">
                    <span className="text-sm font-bold text-soft-gray shrink-0">ប្រភេទពាក្យ៖</span>
                    <select
                      value={filterType}
                      onChange={(e) => { playClickSound(); setFilterType(e.target.value); }}
                      className="w-full px-3 py-1.5 border border-border-beige bg-white rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay text-charcoal cursor-pointer"
                    >
                      {uniqueWordTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
            ))}
                
                    </select>
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
                  <div className={`absolute top-6 z-[50] text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeStudyFrameTitlePos === 'center'
                      ? 'left-1/2 -translate-x-1/2 text-center'
                      : activeStudyFrameTitlePos === 'right'
                        ? 'right-16 text-right'
                        : 'left-6 text-left'
                  } ${isFlipped ? 'bg-white/10 text-stone-200' : 'bg-amber-100/90 text-amber-900 border border-amber-300 shadow-xs'}`}>
                    {currentWord.wordType ? (currentWord.wordType.includes('អំណាន') ? currentWord.wordType : 'អំណាន ៖ ' + currentWord.wordType) : 'អំណាន ៖ ពាក្យ'}
                  </div>
                  
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
                  <div className="flex flex-col items-center gap-6 relative z-30">
                    <h2 className={`text-7xl md:text-[9rem] font-normal tracking-tight mt-2 md:mt-6 select-none ${vibrantColors[currentIndex % vibrantColors.length]} font-['Kh-MPS-Temple']`}>
                      {currentWord.word}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-6 md:mt-10">
                      {currentWord.parts.map((p, pIdx) => (
                        <span key={pIdx} className={`px-4 py-2 md:px-6 md:py-3 rounded-2xl text-xl md:text-3xl font-bold text-white shadow-sm ${vibrantBgColors[currentIndex % vibrantBgColors.length]}`}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  // BACK OF CARD
                  <div className="flex flex-col items-center gap-6 w-full px-4 relative z-30">
                    <div className="text-center w-full max-w-4xl">
                      <span className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-wide block mb-4">
                        អត្ថន័យ និងការបកស្រាយ៖
                      </span>
                      <p className="text-xl md:text-3xl text-gray-100 leading-relaxed font-semibold">
                        {currentWord.definition}
                      </p>
                    </div>

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
                    const currentPos = frame.titlePosition || 'left';
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
                        <div className="w-full h-16 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200/80 flex items-center justify-center">
                          <img src={frame.url} alt={frame.name} className="w-full h-full object-fill" />
                          <span className={`absolute top-1 z-20 text-[9px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded ${
                            currentPos === 'center' ? 'left-1/2 -translate-x-1/2' : currentPos === 'right' ? 'right-1' : 'left-1'
                          }`}>
                            អំណាន...
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

                        {/* Title Position Selector Buttons */}
                        <div className="mt-2 pt-1.5 border-t border-amber-100 flex items-center justify-between gap-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
                          <span className="font-bold text-stone-500 shrink-0">ចំណងជើង៖</span>
                          <div className="flex bg-stone-100 p-0.5 rounded-lg font-bold gap-0.5">
                            <button
                              onClick={(e) => handleUpdateFrameTitlePos(frame.id, 'left', e)}
                              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${currentPos === 'left' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                              title="តម្រឹមឆ្វេង"
                            >
                              ឆ្វេង
                            </button>
                            <button
                              onClick={(e) => handleUpdateFrameTitlePos(frame.id, 'center', e)}
                              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${currentPos === 'center' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                              title="តម្រឹមកណ្ដាល"
                            >
                              កណ្ដាល
                            </button>
                            <button
                              onClick={(e) => handleUpdateFrameTitlePos(frame.id, 'right', e)}
                              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${currentPos === 'right' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                              title="តម្រឹមស្តាំ"
                            >
                              ស្តាំ
                            </button>
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
                            <img src={getFrameUrlById(slotFrameIds[slotIdx])} alt="Slot Frame" className="w-full h-full object-fill" />
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
                    return (
                      <div key={idx} className="flex-1 h-24 sm:h-28 bg-white rounded-xl relative flex flex-col items-center justify-center p-2 shadow-sm overflow-hidden border-2 border-amber-400">
                        {frameUrl && (
                          <img src={frameUrl} alt="Frame Overlay" className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" />
                        )}
                        <span className={`text-[10px] font-bold text-amber-800 font-['Kh-MPS-Temple'] absolute top-2 z-30 ${
                          titlePos === 'center' ? 'left-1/2 -translate-x-1/2 text-center' : titlePos === 'right' ? 'right-2 text-right' : 'left-2 text-left'
                        }`}>
                          អំណាន...
                        </span>
                        <span className="text-xs font-bold text-charcoal font-['Kh-MPS-Temple'] relative z-20 mt-3">
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
                  <label className="w-full py-4 px-4 bg-amber-50/50 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                    <Upload size={24} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">ចុចដើម្បីជ្រើសរើសរូបភាព (PNG/JPG)</span>
                    <span className="text-[10px] text-soft-gray">ណែនាំ៖ រូបភាព PNG ថ្លាកណ្ដាល (Transparent PNG)</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
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

                {/* Title Position Selector */}
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1.5 flex items-center justify-between">
                    <span>ទីតាំងចំណងជើងពាក្យ (Title Position) ៖</span>
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                      {newFrameTitlePos === 'left' ? 'ឆ្វេង (Left)' : newFrameTitlePos === 'center' ? 'កណ្ដាល (Center)' : 'ស្តាំ (Right)'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setNewFrameTitlePos('left'); }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newFrameTitlePos === 'left'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <AlignLeft size={16} />
                      <span>ឆ្វេង</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setNewFrameTitlePos('center'); }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newFrameTitlePos === 'center'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <AlignCenter size={16} />
                      <span>កណ្ដាល</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setNewFrameTitlePos('right'); }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newFrameTitlePos === 'right'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <AlignRight size={16} />
                      <span>ស្តាំ</span>
                    </button>
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
                      <img src={newFramePreview} alt="Preview" className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" />
                      
                      {/* Dynamic Title Position in Live Preview */}
                      <span className={`absolute top-2 z-30 text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md ${
                        newFrameTitlePos === 'center'
                          ? 'left-1/2 -translate-x-1/2 text-center'
                          : newFrameTitlePos === 'right'
                            ? 'right-3 text-right'
                            : 'left-3 text-left'
                      }`}>
                        អំណាន ៖ ពាក្យ
                      </span>

                      <span className="text-lg font-bold text-charcoal relative z-20 font-['Kh-MPS-Temple'] mt-3">
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

    </div>
    </div>
  );
}
