import React from 'react';
import { WordItem } from '../types';
import { 
  ArrowLeft, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  HelpCircle, 
  Maximize, 
  Minimize, 
  X, 
  Eye, 
  EyeOff,
  User,
  Calendar,
  Award,
  Download,
  Printer,
  Layers,
  FileText,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound, playWinSound, speakText } from '../utils/audio';
import { isSentenceItem } from '../utils/khmerSplit';

interface WordSearchProps {
  words: WordItem[];
  topicName?: string;
  onBack: () => void;
}

const GRID_SIZE = 12;

// Pool of common Khmer characters, vowels, and subscripts to fill empty cells
const KHMER_POOL = [
  'ក', 'ខ', 'គ', 'ឃ', 'ង', 'ច', 'ឆ', 'ជ', 'ឈ', 'ញ', 'ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ', 'ត', 'ថ', 'ទ', 'ធ', 'ន', 'ប', 'ផ', 'ព', 'ភ', 'ម', 'យ', 'រ', 'ល', 'វ', 'ស', 'ហ', 'ឡ', 'អ',
  'ា', 'ិ', 'ី', 'ឹ', 'ឺ', 'ុ', 'ូ', 'ួ', 'ើ', 'ឿ', 'ៀ', 'េ', 'ែ', 'ៃ', 'ោ', 'ៅ', 'ុំ', 'ំ', 'ាំ', 'ះ',
  '្ក', '្ខ', '្គ', '្ង', '្ច', '្ឆ', '្ជ', '្ញ', '្ត', '្ថ', '្ទ', '្ន', '្ប', '្ម', '្យ', '្រ', '្ល', '្វ', '្ស'
];

// Helper to split Khmer word into visual grid units (preserving co-engrossers)
function splitKhmerWordToUnits(word: string): string[] {
  const units: string[] = [];
  let i = 0;
  while (i < word.length) {
    const char = word[i];
    // If it is the subscript sign U+17D2, combine it with the next character
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

// Helper to check if a grid unit is a Khmer combining character (vowel, subscript, or diacritic) which renders smaller
function isKhmerCombining(char: string): boolean {
  if (!char) return false;
  // If it contains the subscript sign U+17D2
  if (char.includes('\u17D2')) return true;
  // If it is a combining vowel/sign (between U+17B6 and U+17D3)
  for (let i = 0; i < char.length; i++) {
    const code = char.charCodeAt(i);
    if (code >= 0x17B6 && code <= 0x17D3) {
      return true;
    }
  }
  return false;
}

// Direction vectors for placement
const DIRECTIONS = [
  { dr: 0, dc: 1, name: 'Horizontal' }, // Left to Right
  { dr: 1, dc: 0, name: 'Vertical' },   // Top to Bottom
  { dr: 1, dc: 1, name: 'Diagonal' }    // Diagonal Down-Right
];

// Distinct soft pastel background colors for found words (darker & bolder)
const PASTEL_HIGHLIGHTS = [
  'bg-emerald-300 text-emerald-950 font-bold',
  'bg-amber-300 text-amber-950 font-bold',
  'bg-sky-300 text-sky-950 font-bold',
  'bg-rose-300 text-rose-950 font-bold',
  'bg-indigo-300 text-indigo-950 font-bold',
  'bg-purple-300 text-purple-950 font-bold',
  'bg-teal-300 text-teal-950 font-bold',
  'bg-orange-300 text-orange-950 font-bold',
  'bg-lime-300 text-lime-950 font-bold',
  'bg-fuchsia-300 text-fuchsia-950 font-bold'
];

interface CellCoords {
  r: number;
  c: number;
}

interface PlacedWord {
  word: string;
  units: string[];
  coords: CellCoords[];
  colorClass: string;
}

// Single standalone grid generator helper function
function createSingleGrid(targetList: WordItem[]): { grid: string[][], placedWords: PlacedWord[] } {
  if (targetList.length === 0) return { grid: [], placedWords: [] };

  let successful = false;
  let finalGrid: string[][] = [];
  let finalPlacedWords: PlacedWord[] = [];
  let attempts = 0;

  while (!successful && attempts < 15) {
    attempts++;
    finalGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(""));
    finalPlacedWords = [];
    let fitAll = true;

    for (let i = 0; i < targetList.length; i++) {
      const item = targetList[i];
      const units = splitKhmerWordToUnits(item.word);
      let placed = false;
      let placeAttempts = 0;

      while (!placed && placeAttempts < 150) {
        placeAttempts++;
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

        const endR = r + direction.dr * (units.length - 1);
        const endC = c + direction.dc * (units.length - 1);

        if (endR >= 0 && endR < GRID_SIZE && endC >= 0 && endC < GRID_SIZE) {
          let canPlace = true;
          const wordCoords: CellCoords[] = [];

          for (let step = 0; step < units.length; step++) {
            const currR = r + direction.dr * step;
            const currC = c + direction.dc * step;
            const existingVal = finalGrid[currR][currC];
            const targetVal = units[step];

            if (existingVal !== "" && existingVal !== targetVal) {
              canPlace = false;
              break;
            }
            wordCoords.push({ r: currR, c: currC });
          }

          if (canPlace) {
            for (let step = 0; step < units.length; step++) {
              const coord = wordCoords[step];
              finalGrid[coord.r][coord.c] = units[step];
            }

            finalPlacedWords.push({
              word: item.word,
              units: units,
              coords: wordCoords,
              colorClass: PASTEL_HIGHLIGHTS[i % PASTEL_HIGHLIGHTS.length]
            });
            placed = true;
          }
        }
      }

      if (!placed) {
        fitAll = false;
        break;
      }
    }

    if (fitAll) {
      successful = true;
    }
  }

  // Fill remaining empty cells with random Khmer characters
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (finalGrid[r][c] === "") {
        const randIdx = Math.floor(Math.random() * KHMER_POOL.length);
        finalGrid[r][c] = KHMER_POOL[randIdx];
      }
    }
  }

  return { grid: finalGrid, placedWords: finalPlacedWords };
}

export default function WordSearch({ words, topicName, onBack }: WordSearchProps) {
  // Gameplay states
  const [studentName, setStudentName] = React.useState('');
  const [studentDate, setStudentDate] = React.useState(() => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  });
  
  const [filterType, setFilterType] = React.useState<string>('ទាំងអស់');
  
  const uniqueWordTypes = React.useMemo(() => {
    const types = new Set(words.map(w => w.wordType || 'មិនស្គាល់'));
    return ['ទាំងអស់', ...Array.from(types)];
  }, [words]);
  
  const [gameWords, setGameWords] = React.useState<WordItem[]>([]);
  const [grid, setGrid] = React.useState<string[][]>([]);
  const [placedWords, setPlacedWords] = React.useState<PlacedWord[]>([]);
  
  // Selection states
  const [startCell, setStartCell] = React.useState<CellCoords | null>(null);
  const [hoveredCell, setHoveredCell] = React.useState<CellCoords | null>(null);
  const [failedSelection, setFailedSelection] = React.useState<CellCoords[] | null>(null);
  
  // Manual selection states
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [isManualSelection, setIsManualSelection] = React.useState(false);
  const [manualSelectedWords, setManualSelectedWords] = React.useState<string[]>([]);
  
  // Progress states
  const [foundWords, setFoundWords] = React.useState<string[]>([]);
  const [showSolutions, setShowSolutions] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showWinModal, setShowWinModal] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Print popup modal states
  const [showPrintModal, setShowPrintModal] = React.useState(false);
  const [worksheetCount, setWorksheetCount] = React.useState(1);
  const [includeSolutionsInPrint, setIncludeSolutionsInPrint] = React.useState(false);

  const handleOpenPrintModal = () => {
    playClickSound();
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    playClickSound();
    setIsDownloading(true);
    setShowPrintModal(false);

    try {
      // 1. Open a new window/tab for a clean, non-sandboxed print experience
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("សូមអនុញ្ញាតការបើក Pop-up window ក្នុងកម្មវិធីរុករករបស់អ្នកដើម្បីបោះពុម្ពសន្លឹកកិច្ចការនេះបាន។ (Please allow popups in your browser to print the worksheet.)");
        setIsDownloading(false);
        return;
      }

      const targetList = gameWords;

      // Map the colors for solutions cleanly to high-quality pastel colors
      const colorsMap: Record<string, string> = {
        'emerald': 'background-color: #a7f3d0; color: #064e3b; font-weight: bold;',
        'amber': 'background-color: #fde68a; color: #78350f; font-weight: bold;',
        'sky': 'background-color: #bae6fd; color: #0c4a6e; font-weight: bold;',
        'rose': 'background-color: #fecdd3; color: #881337; font-weight: bold;',
        'indigo': 'background-color: #c7d2fe; color: #1e1b4b; font-weight: bold;',
        'purple': 'background-color: #f3e8ff; color: #581c87; font-weight: bold;',
        'teal': 'background-color: #99f6e4; color: #134e4a; font-weight: bold;',
        'orange': 'background-color: #fed7aa; color: #7c2d12; font-weight: bold;',
        'lime': 'background-color: #d9f99d; color: #365314; font-weight: bold;',
        'fuchsia': 'background-color: #fbcfe8; color: #701a75; font-weight: bold;'
      };

      let worksheetsHTML = '';

      // Generate N distinct worksheets
      for (let sheetIdx = 1; sheetIdx <= worksheetCount; sheetIdx++) {
        const { grid: singleGrid, placedWords: singlePlaced } = createSingleGrid(targetList);

        // 1. Student Grid HTML (Always clean without highlighted answers)
        let studentGridHTML = '<table class="grid-table"><tbody>';
        singleGrid.forEach((row) => {
          studentGridHTML += '<tr>';
          row.forEach((char) => {
            const innerStyle = 'font-size: 26px; font-weight: normal;';
            studentGridHTML += `
              <td style="background-color: #ffffff; color: #0f172a;">
                <div class="cell-content" style="${innerStyle}">${char}</div>
              </td>
            `;
          });
          studentGridHTML += '</tr>';
        });
        studentGridHTML += '</tbody></table>';

        // Words checklist
        let wordsHTML = '';
        singlePlaced.forEach((item) => {
          wordsHTML += `
            <div class="word-item">
              <div class="checkbox-box"></div>
              <span class="word-text">${item.word}</span>
            </div>
          `;
        });

        const isLastStudentPage = (sheetIdx === worksheetCount) && !includeSolutionsInPrint;

        // Add Student Worksheet Page
        worksheetsHTML += `
          <div class="worksheet-container student-page page-break">
            <div>
              <div class="header">
                <div class="logo-title">
                  <div class="logo-box">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C12 2 12.8 7.2 14.8 9.2C16.8 11.2 22 12 22 12C22 12 16.8 12.8 14.8 14.8C12.8 16.8 12 22 12 22C12 22 11.2 16.8 9.2 14.8C7.2 12.8 2 12 2 12C2 12 7.2 11.2 9.2 9.2C11.2 7.2 12 2 12 2Z" fill="white" />
                      <path d="M19 4C19 4 19.4 5.6 20 6.2C20.6 6.8 22 7 22 7C22 7 20.6 7.2 20 7.8C19.4 8.4 19 10 19 10C19 10 18.6 8.4 18 7.8C17.4 7.2 16 7 16 7C16 7 17.4 6.8 18 6.2C18.6 5.6 19 4 19 4Z" fill="white" />
                      <circle cx="5" cy="19" r="1.5" fill="white" />
                    </svg>
                  </div>
                  <div class="title-text">
                    <h1>ល្បែងស្វែងរកពាក្យខ្មែរ</h1>
                    <p>រុករកទីតាំងពាក្យដែលលាក់នៅក្នុងតារាងអក្សរ</p>
                  </div>
                </div>
                <div class="student-info">
                  <div>ឈ្មោះសិស្ស ៖ ${studentName || '...................................................'}</div>
                  <div style="margin-top: 6px;">កាលបរិច្ឆេទ ៖ ${studentDate || '....... / ........ / .........'}</div>
                </div>
              </div>

              <div class="orange-divider"></div>

              <div class="instruction-text">
                <strong>ការណែនាំ៖</strong> ចូរលោកគ្រូ-អ្នកគ្រូឱ្យសិស្សស្វែងរកពាក្យគន្លឹះខ្មែរទាំងឡាយដែលបានផ្តល់ជូនខាងក្រោម នៅក្នុងប្រអប់តារាងអក្សរ ដោយគូសរង្វង់ព័ទ្ធជុំវិញតាមទិសដៅផ្តេក (ឆ្វេងទៅស្តាំ) ឬបញ្ឈរ (លើចុះក្រោម)។
              </div>

              <div class="grid-section">
                ${studentGridHTML}
              </div>
            </div>

            <div>
              <div class="list-header">
                <span>✓ បញ្ជីពាក្យត្រូវស្វែងរកទាំង ${singlePlaced.length}៖</span>
              </div>
              <div class="words-grid">
                ${wordsHTML}
              </div>
            </div>
          </div>
        `;

        // 2. Dedicated Answer Key Page (Class: answer-key-page)
        let solutionGridHTML = '<table class="grid-table"><tbody>';
        singleGrid.forEach((row, rIdx) => {
          solutionGridHTML += '<tr>';
          row.forEach((char, cIdx) => {
            let cellStyle = "background-color: #ffffff; color: #0f172a;";
            
            const cellWord = singlePlaced.find(pw => 
              pw.coords.some(coord => coord.r === rIdx && coord.c === cIdx)
            );
            
            if (cellWord) {
              let matchedColorKey = 'emerald';
              for (const key of Object.keys(colorsMap)) {
                if (cellWord.colorClass.includes(key)) {
                  matchedColorKey = key;
                  break;
                }
              }
              cellStyle = colorsMap[matchedColorKey];
            }
            
            const innerStyle = 'font-size: 26px; font-weight: normal;';
            
            solutionGridHTML += `
              <td style="${cellStyle}">
                <div class="cell-content" style="${innerStyle}">${char}</div>
              </td>
            `;
          });
          solutionGridHTML += '</tr>';
        });
        solutionGridHTML += '</tbody></table>';

        worksheetsHTML += `
          <div class="worksheet-container answer-key-page page-break">
            <div>
              <div class="header">
                <div class="logo-title">
                  <div class="logo-box">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C12 2 12.8 7.2 14.8 9.2C16.8 11.2 22 12 22 12C22 12 16.8 12.8 14.8 14.8C12.8 16.8 12 22 12 22C12 22 11.2 16.8 9.2 14.8C7.2 12.8 2 12 2 12C2 12 7.2 11.2 9.2 9.2C11.2 7.2 12 2 12 2Z" fill="white" />
                      <path d="M19 4C19 4 19.4 5.6 20 6.2C20.6 6.8 22 7 22 7C22 7 20.6 7.2 20 7.8C19.4 8.4 19 10 19 10C19 10 18.6 8.4 18 7.8C17.4 7.2 16 7 16 7C16 7 17.4 6.8 18 6.2C18.6 5.6 19 4 19 4Z" fill="white" />
                      <circle cx="5" cy="19" r="1.5" fill="white" />
                    </svg>
                  </div>
                  <div class="title-text">
                    <h1>ល្បែងស្វែងរកពាក្យខ្មែរ</h1>
                    <p>រុករកទីតាំងពាក្យដែលលាក់នៅក្នុងតារាងអក្សរ</p>
                  </div>
                </div>
                <div class="student-info">
                  <div>ឈ្មោះសិស្ស ៖ ${studentName || '...................................................'}</div>
                  <div style="margin-top: 6px;">កាលបរិច្ឆេទ ៖ ${studentDate || '....... / ........ / .........'}</div>
                </div>
              </div>

              <div class="orange-divider"></div>

              <div class="instruction-text">
                <strong>ការណែនាំ៖</strong> ចូរលោកគ្រូ-អ្នកគ្រូឱ្យសិស្សស្វែងរកពាក្យគន្លឹះខ្មែរទាំងឡាយដែលបានផ្តល់ជូនខាងក្រោម នៅក្នុងប្រអប់តារាងអក្សរ ដោយគូសរង្វង់ព័ទ្ធជុំវិញតាមទិសដៅផ្តេក (ឆ្វេងទៅស្តាំ) ឬបញ្ឈរ (លើចុះក្រោម)។
              </div>

              <div class="grid-section">
                ${solutionGridHTML}
              </div>
            </div>

            <div>
              <div class="list-header">
                <span>✓ បញ្ជីពាក្យត្រូវស្វែងរកទាំង ${singlePlaced.length}៖</span>
              </div>
              <div class="words-grid">
                ${wordsHTML}
              </div>
            </div>
          </div>
        `;
      }

      const docContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>ល្បែងស្វែងរកពាក្យខ្មែរ - បោះពុម្ពសន្លឹកកិច្ចការ</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700;900&family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&family=Nokora:wght@100;300;400;700;900&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin-top: 10mm;
                margin-left: 10mm;
                margin-right: 10mm;
                margin-bottom: 10mm;
              }
              body {
                background-color: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
              .worksheet-container {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
            }
            
            body {
              font-family: 'Battambang', 'Kantumruy Pro', 'Nokora', sans-serif;
              color: #1c1917;
              background-color: #f5f5f4;
              margin: 0;
              padding: 24px 0;
              -webkit-font-smoothing: antialiased;
            }

            /* Print/Save floating control panel */
            .control-panel {
              background-color: #ffffff;
              border-bottom: 2px solid #e7e5e4;
              padding: 16px 24px;
              max-width: 800px;
              margin: 0 auto 20px auto;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-sizing: border-box;
            }
            .control-title {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .control-title h2 {
              margin: 0;
              font-size: 16px;
              font-weight: 800;
              color: #1c1917;
            }
            .control-title p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #78716c;
              font-weight: 600;
            }
            .control-options {
              display: flex;
              align-items: center;
              gap: 10px;
              background-color: #fffbeb;
              padding: 8px 16px;
              border-radius: 12px;
              border: 1px solid #fcd34d;
            }
            .toggle-option {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              font-weight: 800;
              color: #92400e;
              cursor: pointer;
              user-select: none;
            }
            .toggle-option input[type="checkbox"] {
              width: 18px;
              height: 18px;
              accent-color: #d97706;
              cursor: pointer;
            }
            .control-actions {
              display: flex;
              gap: 12px;
            }
            .btn-print {
              background-color: #f59e0b;
              color: #ffffff;
              border: none;
              padding: 10px 20px;
              border-radius: 12px;
              font-family: 'Kantumruy Pro', sans-serif;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .btn-print:hover {
              background-color: #d97706;
              transform: translateY(-1px);
            }
            .btn-close {
              background-color: #f5f5f4;
              color: #44403c;
              border: 1px solid #e7e5e4;
              padding: 10px 16px;
              border-radius: 12px;
              font-family: 'Kantumruy Pro', sans-serif;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .btn-close:hover {
              background-color: #e7e5e4;
            }

            /* A4 Worksheet Container */
            .worksheet-container {
              width: 100%;
              max-width: 800px;
              background-color: #ffffff;
              border: 1px solid #e7e5e4;
              border-radius: 20px;
              margin: 0 auto;
              padding: 40px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.03);
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              min-height: 1050px;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 6px;
              padding-bottom: 8px;
              overflow: visible;
            }
            .logo-title {
              display: flex;
              align-items: center;
              gap: 14px;
              overflow: visible;
            }
            .logo-box {
              width: 54px;
              height: 54px;
              background-color: #f59e0b;
              border-radius: 16px;
              box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .logo-box svg {
              width: 32px;
              height: 32px;
            }
            .title-text {
              overflow: visible;
              padding-top: 4px;
            }
            .title-text h1 {
              font-size: 25px;
              font-weight: 900;
              margin: 0;
              color: #1c1917;
              line-height: 1.6;
              padding-top: 6px;
              overflow: visible;
            }
            .title-text p {
              font-size: 13px;
              font-weight: 600;
              color: #64748b;
              margin: 4px 0 0 0;
              line-height: 1.5;
              overflow: visible;
            }
            .student-info {
              text-align: right;
              font-size: 14px;
              font-weight: 700;
              color: #334155;
              line-height: 1.6;
            }
            .orange-divider {
              height: 3px;
              background-color: #f59e0b;
              border-radius: 2px;
              margin-top: 10px;
              margin-bottom: 20px;
              width: 100%;
            }
            .instruction-text {
              font-size: 16px;
              line-height: 1.8;
              color: #1c1917;
              margin-bottom: 24px;
              text-align: center;
              font-weight: normal;
              overflow: visible;
            }
            .instruction-text strong {
              font-weight: normal;
              color: #0f172a;
            }
            .grid-section {
              display: flex;
              justify-content: center;
              margin: 20px 0 10px 0;
            }
            .grid-table {
              border-collapse: collapse;
              border: 3px solid #0f172a;
              margin: 0 auto;
            }
            .grid-table td {
              border: 1.5px solid #0f172a;
              width: 54px;
              height: 54px;
              text-align: center;
              vertical-align: middle;
              padding: 0;
              box-sizing: border-box;
            }
            .cell-content {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              font-family: 'Battambang', 'Kantumruy Pro', 'Nokora', sans-serif;
              font-weight: normal;
              font-size: 28px;
              line-height: 1.4;
              padding-top: 2px;
              overflow: visible;
            }
            .list-header {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
              margin-bottom: 18px;
              padding-top: 4px;
              line-height: 1.5;
              overflow: visible;
            }
            .words-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 16px 12px;
              margin-bottom: 24px;
            }
            .word-item {
              display: flex;
              align-items: center;
              gap: 10px;
              box-sizing: border-box;
            }
            .checkbox-box {
              width: 22px;
              height: 22px;
              border: 1.5px solid #94a3b8;
              border-radius: 4px;
              background-color: #ffffff;
              flex-shrink: 0;
            }
            .word-text {
              font-weight: normal;
              font-size: 18px;
              color: #1c1917;
              white-space: nowrap;
              line-height: 1.5;
              padding-top: 2px;
              overflow: visible;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                background-color: #ffffff;
              }
              .worksheet-container {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: none !important;
                min-height: 275mm !important;
              }
              .page-break {
                page-break-after: always;
                break-after: page;
              }
              .hidden-page {
                display: none !important;
              }
            }
            .hidden-page {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="control-panel no-print">
            <div class="control-title">
              <h2>ការមើលមុនពេលបោះពុម្ពសន្លឹកកិច្ចការខ្មែរ (${worksheetCount} សន្លឹក)</h2>
              <p>សូមជ្រើសរើស "Save as PDF" ក្នុងផ្ទាំងបោះពុម្ព ដើម្បីទាញយកជាឯកសារ PDF</p>
            </div>
            <div class="control-options">
              <label class="toggle-option">
                <input type="checkbox" id="toggleAnswerKey" ${includeSolutionsInPrint ? 'checked' : ''} onchange="toggleAnswerKey(this.checked)" />
                <span>🔑 បង្ហាញតែសន្លឹកចម្លើយ (Show Answer Key Only)</span>
              </label>
            </div>
            <div class="control-actions">
              <button class="btn-print" onclick="window.print()">
                <span id="printBtnText">🖨️ បោះពុម្ព / ទាញយក PDF (${worksheetCount} សន្លឹក)</span>
              </button>
              <button class="btn-close" onclick="window.close()">បិទផ្ទាំងនេះ</button>
            </div>
          </div>

          ${worksheetsHTML}

          <script>
            function toggleAnswerKey(checked) {
              var studentPages = document.querySelectorAll('.student-page');
              var answerPages = document.querySelectorAll('.answer-key-page');

              if (checked) {
                // Hide student exercise pages, show ONLY answer key pages
                studentPages.forEach(function(el) {
                  el.classList.add('hidden-page');
                });
                answerPages.forEach(function(el) {
                  el.classList.remove('hidden-page');
                });
              } else {
                // Show student exercise pages, hide answer key pages
                studentPages.forEach(function(el) {
                  el.classList.remove('hidden-page');
                });
                answerPages.forEach(function(el) {
                  el.classList.add('hidden-page');
                });
              }

              var count = ${worksheetCount};
              var printBtnText = document.getElementById('printBtnText');
              if (printBtnText) {
                if (checked) {
                  printBtnText.innerText = '🖨️ បោះពុម្ព / ទាញយក PDF (' + count + ' សន្លឹកចម្លើយ)';
                } else {
                  printBtnText.innerText = '🖨️ បោះពុម្ព / ទាញយក PDF (' + count + ' សន្លឹកកិច្ចការ)';
                }
              }
            }

            window.onload = function() {
              var chk = document.getElementById('toggleAnswerKey');
              if (chk) {
                toggleAnswerKey(chk.checked);
              }
              setTimeout(function() {
                window.print();
              }, 800);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(docContent);
      printWindow.document.close();

      setIsDownloading(false);
    } catch (error) {
      console.error("Error generating printable worksheet:", error);
      setIsDownloading(false);
    }
  };

  
  const generateNewGame = React.useCallback(() => {
    // Filter by type
    let filtered = words;
    if (filterType !== 'ទាំងអស់') {
      filtered = words.filter(w => (w.wordType || 'មិនស្គាល់') === filterType);
    }
    
    // Use custom words (filtering out sentences/passages)
    const singleWords = filtered.filter(w => !isSentenceItem(w));
    const sourceArray = singleWords.length > 0 ? singleWords : filtered;

    let selectedList: WordItem[] = [];

    if (isManualSelection && manualSelectedWords.length > 0) {
      // Keep only manually selected words that exist in the current source array
      selectedList = sourceArray.filter(w => manualSelectedWords.includes(w.word));
      if (selectedList.length === 0) {
        // Fallback if none of the manually selected words match the filter
        const shuffled = [...sourceArray].sort(() => Math.random() - 0.5);
        selectedList = shuffled.slice(0, 10);
      }
    } else {
      // Sort randomly to mix words each time
      const shuffled = [...sourceArray].sort(() => Math.random() - 0.5);
      selectedList = shuffled.slice(0, 10);
    }
    
    setGameWords(selectedList);
    generateGameGrid(selectedList);
  }, [filterType, words, isManualSelection, manualSelectedWords]);

  // Initial load or when filter changes
  React.useEffect(() => {
    generateNewGame();
  }, [filterType, words]); // Intentionally not including isManualSelection and manualSelectedWords here so it doesn't regenerate as user clicks checkboxes in settings.

  // Main grid generation function
  const generateGameGrid = (targetList: WordItem[]) => {
    if (targetList.length === 0) {
      setGrid([]);
      setPlacedWords([]);
      return;
    }

    const { grid: finalGrid, placedWords: finalPlacedWords } = createSingleGrid(targetList);

    setGrid(finalGrid);
    setPlacedWords(finalPlacedWords);
    setFoundWords([]);
    setStartCell(null);
    setHoveredCell(null);
    setFailedSelection(null);
    setShowWinModal(false);
  };

  const handleRestart = () => {
    playClickSound();
    generateNewGame();
  };

  const handleSaveSettings = () => {
    playClickSound();
    setShowSettingsModal(false);
    generateNewGame();
  };

  const toggleFullscreen = () => {
    playClickSound();
    setIsFullscreen(!isFullscreen);
  };

  // Check alignment between two coordinates
  const getAlignedPath = (start: CellCoords, end: CellCoords): CellCoords[] | null => {
    const dr = end.r - start.r;
    const dc = end.c - start.c;

    const isHorizontal = dr === 0 && dc !== 0;
    const isVertical = dc === 0 && dr !== 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc) && dr !== 0;

    if (!isHorizontal && !isVertical && !isDiagonal) return null;

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    const path: CellCoords[] = [];
    let currR = start.r;
    let currC = start.c;

    for (let i = 0; i <= steps; i++) {
      path.push({ r: currR, c: currC });
      currR += stepR;
      currC += stepC;
    }

    return path;
  };

  // Handle cell click / interaction
  const handleCellClick = (r: number, c: number) => {
    if (showWinModal) return;

    playClickSound();

    if (!startCell) {
      setStartCell({ r, c });
      setHoveredCell({ r, c });
    } else {
      // If clicked the exact same cell, reset selection
      if (startCell.r === r && startCell.c === c) {
        setStartCell(null);
        setHoveredCell(null);
        return;
      }

      const path = getAlignedPath(startCell, { r, c });
      if (path) {
        // Construct string from path
        const wordStr = path.map(coord => grid[coord.r][coord.c]).join("");
        const reverseStr = [...path].reverse().map(coord => grid[coord.r][coord.c]).join("");

        // Find if this string matches any of our placed words that are NOT yet found
        const matched = placedWords.find(pw => 
          (pw.word === wordStr || pw.word === reverseStr) && 
          !foundWords.includes(pw.word)
        );

        if (matched) {
          // Success match!
          const newFoundWords = [...foundWords, matched.word];
          setFoundWords(newFoundWords);
          setStartCell(null);
          setHoveredCell(null);
          playSuccessSound();
          speakText(matched.word);

          // Check win condition
          if (newFoundWords.length === placedWords.length) {
            setTimeout(() => {
              playWinSound();
              setShowWinModal(true);
            }, 600);
          }
        } else {
          // Failed selection
          setFailedSelection(path);
          setStartCell(null);
          setHoveredCell(null);
          setTimeout(() => {
            setFailedSelection(null);
          }, 500);
        }
      } else {
        // Not aligned: change start cell to current clicked cell
        setStartCell({ r, c });
        setHoveredCell({ r, c });
      }
    }
  };

  // Hover effect over cells when startCell is active
  const handleCellMouseEnter = (r: number, c: number) => {
    if (startCell) {
      setHoveredCell({ r, c });
    }
  };

  // Determine styling for cells
  const getCellClassName = (r: number, c: number) => {
    let classes = "relative flex items-center justify-center font-normal select-none text-center cursor-pointer transition-colors w-full aspect-square ";
    
    // Check if cell is in permanently found words
    let isFound = false;
    let foundColorClass = "";
    
    for (const pw of placedWords) {
      if (foundWords.includes(pw.word)) {
        const hasCoord = pw.coords.some(coord => coord.r === r && coord.c === c);
        if (hasCoord) {
          isFound = true;
          foundColorClass = pw.colorClass;
          break;
        }
      }
    }

    // Check if cell is in solutions (if toggled)
    let isSolution = false;
    let solutionColorClass = '';
    if (showSolutions) {
      for (const pw of placedWords) {
        const hasCoord = pw.coords.some(coord => coord.r === r && coord.c === c);
        if (hasCoord) {
          isSolution = true;
          solutionColorClass = pw.colorClass;
          break;
        }
      }
    }

    // Check if cell is currently in failed selection
    const isFailedCell = failedSelection?.some(coord => coord.r === r && coord.c === c);

    // Check if cell is currently in preview path
    let isPreviewCell = false;
    if (startCell && hoveredCell) {
      const path = getAlignedPath(startCell, hoveredCell);
      if (path) {
        isPreviewCell = path.some(coord => coord.r === r && coord.c === c);
      }
    }

    // Apply color layers hierarchically
    if (isFailedCell) {
      classes += "bg-rose-500 text-white z-10 animate-pulse";
    } else if (isPreviewCell) {
      classes += "bg-[#fcd34d] text-[#78350f] font-bold z-10";
    } else if (startCell && startCell.r === r && startCell.c === c) {
      classes += "bg-[#f59e0b] text-white font-bold z-10 animate-pulse";
    } else if (isFound) {
      classes += ` ${foundColorClass}`;
    } else if (isSolution) {
      classes += ` ${solutionColorClass}`;
    } else {
      classes += "bg-white text-slate-700 hover:bg-slate-50";
    }

    return classes;
  };

  return (
    <div className={`font-sans transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#FAF8F5] overflow-auto w-screen h-screen flex flex-col p-4 sm:p-8' : 'min-h-screen bg-[#FAF8F5] py-6 px-4 sm:px-6 lg:px-8'}`}>
      
      {isFullscreen && (
        <button
          onClick={() => { playClickSound(); toggleFullscreen(); }}
          className="fixed top-4 right-4 z-50 p-3 bg-white hover:bg-stone-bg border border-border-beige text-charcoal rounded-full shadow-lg cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="បង្រួមវិញ"
        >
          <Minimize size={20} />
        </button>
      )}

      <div className={`mx-auto w-full ${isFullscreen ? 'max-w-none flex flex-col h-full justify-center items-center' : 'max-w-6xl'}`}>
        
        {/* Modern Top Navigation Bar - Only show when not in fullscreen */}
        {!isFullscreen && (
          <div className="bg-white border border-border-beige rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { playClickSound(); onBack(); }}
                id="btn-back-dashboard"
                className="p-2.5 bg-stone-bg hover:bg-stone-200 text-charcoal rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">ត្រឡប់ក្រោយ</span>
              </button>
              <div className="h-6 w-[1px] bg-border-beige hidden sm:block"></div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-charcoal flex items-center gap-1.5">
                  <Sparkles size={20} className="text-sand animate-pulse" />
                  <span>ល្បែងស្វែងរកពាក្យខ្មែរ</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => { 
                  playClickSound(); 
                  setFilterType(e.target.value); 
                }}
                className="bg-white text-charcoal font-bold text-xs px-3.5 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm hover:bg-stone-50"
              >
                {uniqueWordTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <button
                onClick={() => { playClickSound(); setShowSolutions(!showSolutions); }}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  showSolutions 
                    ? 'bg-sage/15 border-sage text-sage-dark' 
                    : 'bg-white hover:bg-stone-bg border-border-beige text-charcoal'
                }`}
              >
                {showSolutions ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{showSolutions ? 'លាក់ចម្លើយ' : 'បង្ហាញចម្លើយ'}</span>
              </button>

              <button
                onClick={() => { playClickSound(); setShowSettingsModal(true); }}
                className="px-3.5 py-2.5 bg-white hover:bg-stone-bg border border-border-beige text-charcoal rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                title="ការកំណត់ពាក្យ"
              >
                <Settings size={15} />
                <span className="hidden sm:inline">ការកំណត់</span>
              </button>

              <button
                onClick={handleRestart}
                className="px-3.5 py-2.5 bg-white hover:bg-stone-bg border border-border-beige text-charcoal rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>បង្កើតថ្មី</span>
              </button>

              <button
                onClick={handleOpenPrintModal}
                disabled={isDownloading}
                className={`px-3.5 py-2.5 bg-clay hover:bg-clay-dark text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isDownloading ? 'animate-pulse' : ''
                }`}
              >
                <Printer size={15} />
                <span>{isDownloading ? 'កំពុងទាញយក...' : 'បោះពុម្ព PDF'}</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2.5 bg-white hover:bg-stone-bg border border-border-beige text-charcoal rounded-xl transition-all cursor-pointer"
                title={isFullscreen ? "បង្រួមវិញ" : "ពេញអេក្រង់"}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Main Interface: Grid on left, word list on right */}
        {gameWords.length === 0 ? (
          <div className="bg-white border border-border-beige rounded-[32px] p-12 text-center shadow-sm">
            <HelpCircle size={48} className="text-soft-gray mx-auto mb-4" />
            <p className="text-charcoal font-black text-lg mb-3">មិនមានពាក្យសិក្សានៅក្នុងបញ្ជីទេ!</p>
            <p className="text-soft-gray text-xs mb-6 max-w-md mx-auto">សូមត្រឡប់ទៅទំព័រ "បញ្ចូលពាក្យ" ដើម្បីបញ្ចូលពាក្យថ្មីៗសម្រាប់កុមារលេងល្បែងស្វែងរកពាក្យនេះ។</p>
            <button
              onClick={() => { playClickSound(); onBack(); }}
              className="px-6 py-3 bg-clay hover:bg-clay-dark text-white font-extrabold rounded-2xl transition-all cursor-pointer shadow-md"
            >
              ត្រឡប់ទៅទំព័រដើម
            </button>
          </div>
        ) : (
          <div className={isFullscreen 
            ? "flex flex-col lg:flex-row gap-8 items-center justify-center w-full flex-1 max-h-[calc(100vh-64px)]" 
            : "grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch justify-center w-full"
          }>
            
            {/* Grid display */}
            <div className={isFullscreen 
              ? "flex flex-col items-center justify-center bg-white border border-border-beige rounded-[32px] shadow-md p-4 sm:p-6 h-full aspect-square max-h-[calc(100vh-64px)] max-w-[calc(100vh-64px)] flex-1 lg:mx-0" 
              : "lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center bg-white border border-border-beige rounded-[32px] shadow-md h-full p-2 sm:p-3 md:p-4"
            }>
              
               {/* Grid Box */}
               <div className="relative w-full h-full flex justify-center items-center flex-1">
                 <div 
                   className={`grid gap-[1px] bg-slate-700 border-2 border-slate-700 rounded-[14px] sm:rounded-2xl overflow-hidden shadow-sm w-full aspect-square ${isFullscreen ? 'max-w-full max-h-full' : 'max-w-full'}`}
                   style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
                 >
                  {grid.map((row, rIdx) => 
                    row.map((char, cIdx) => {
                      return (
                        <motion.div
                          key={`${rIdx}-${cIdx}`}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                          className={getCellClassName(rIdx, cIdx)}
                          style={{ containerType: 'inline-size' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span 
                            className="leading-none select-none font-normal block text-center"
                            style={{ fontSize: '46cqw' }}
                          >
                            {char}
                          </span>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Checklist of Words to find */}
            <div className={isFullscreen 
              ? "flex flex-col h-full max-h-[calc(100vh-64px)] w-full max-w-[300px] mx-auto lg:mx-0" 
              : "lg:col-span-5 xl:col-span-4 flex flex-col h-full w-full max-w-[320px] mx-auto"
            }>
              
              {/* Words checklist card */}
              <div className="bg-white border border-border-beige rounded-[32px] p-4 sm:p-5 shadow-md flex flex-col h-full justify-between">
                <div className="flex items-center justify-between border-b border-border-beige pb-3 mb-3">
                  <h3 className="text-sm sm:text-base font-black text-charcoal flex items-center gap-2">
                    <Award size={18} className="text-sand animate-bounce" />
                    <span>បញ្ជីពាក្យត្រូវស្វែងរក ({placedWords.length})</span>
                  </h3>
                  <span className="text-[10px] sm:text-xs bg-stone-bg text-soft-gray px-2 sm:px-3 py-1 rounded-full font-bold">
                    រកឃើញ {foundWords.length}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-[320px] max-h-[540px] lg:max-h-none">
                  {placedWords.map((item, idx) => {
                    const isFound = foundWords.includes(item.word);
                    return (
                      <div
                        key={`${item.word}-${idx}`}
                        onClick={() => {
                          playClickSound();
                          speakText(item.word);
                        }}
                        className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
                          isFound 
                            ? 'bg-sage/10 border-sage/30 text-sage-dark line-through font-bold' 
                            : 'bg-[#FAF8F5] hover:bg-stone-bg border-border-beige text-charcoal'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isFound ? 'bg-sage border-sage text-white' : 'border-border-beige bg-white'}`}>
                            {isFound && <CheckCircle2 size={12} className="stroke-[3]" />}
                          </div>
                          <span className="font-bold text-sm sm:text-base tracking-tight">{item.word}</span>
                        </div>
                        
                        {/* Word type pill */}
                        {gameWords.find(gw => gw.word === item.word)?.wordType && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isFound ? 'bg-sage/20 text-sage' : 'bg-stone-bg text-soft-gray'}`}>
                            {gameWords.find(gw => gw.word === item.word)?.wordType}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Win celebratory modal */}
        <AnimatePresence>
          {showWinModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-[40px] p-10 max-w-md w-full border border-border-beige shadow-2xl text-center relative overflow-hidden"
              >
                {/* Floating ribbons behind */}
                <div className="absolute inset-0 bg-gradient-to-b from-sand/10 to-transparent pointer-events-none" />

                <button
                  onClick={() => setShowWinModal(false)}
                  className="absolute top-6 right-6 p-2 bg-[#FAF8F5] hover:bg-stone-bg text-charcoal rounded-full transition-all border border-border-beige shadow-sm"
                >
                  <X size={18} />
                </button>

                <div className="w-24 h-24 bg-sage/15 rounded-full flex items-center justify-center mx-auto mb-6 text-sage shadow-inner">
                  <Trophy size={48} className="animate-bounce" />
                </div>

                <h3 className="text-3xl font-black text-charcoal mb-2">🎉 អស្ចារ្យណាស់កូន!</h3>
                <p className="text-soft-gray text-xs font-semibold mb-6">កូនបានស្វែងរកឃើញពាក្យទាំង {placedWords.length} ត្រូវទាំងអស់គ្នាហើយ!</p>

                {studentName && (
                  <div className="bg-[#FAF8F5] border border-border-beige p-4 rounded-2xl mb-6 text-left">
                    <p className="text-[11px] text-soft-gray font-bold mb-1">វិញ្ញាបនបត្រជ័យលាភីសម្រាប់៖</p>
                    <p className="text-base font-black text-charcoal flex items-center gap-1.5">
                      🎖️ <span className="text-clay">{studentName}</span>
                    </p>
                    <p className="text-[10px] text-soft-gray mt-2 font-semibold">កាលបរិច្ឆេទ៖ {studentDate}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRestart}
                    className="w-full py-4 bg-clay hover:bg-clay-dark text-white font-extrabold rounded-2xl shadow-md transition-all scale-102 hover:scale-105 cursor-pointer"
                  >
                    លេងម្តងទៀត (Play Again)
                  </button>
                  <button
                    onClick={() => { playClickSound(); onBack(); }}
                    className="w-full py-3.5 bg-white hover:bg-stone-bg border border-border-beige text-charcoal font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
                  >
                    ត្រឡប់ទៅទំព័រដើម
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Print Options Form Popup Modal */}
        <AnimatePresence>
          {showPrintModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full border border-border-beige shadow-2xl relative overflow-hidden"
              >
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="absolute top-5 right-5 p-2 bg-[#FAF8F5] hover:bg-stone-200 text-charcoal rounded-full transition-all border border-border-beige shadow-sm cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Printer size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-charcoal">កំណត់ការបោះពុម្ពសន្លឹកកិច្ចការ</h3>
                    <p className="text-xs font-bold text-soft-gray mt-0.5">កំណត់ចំនួនសន្លឹកកិច្ចការដែលត្រូវបង្កើតផ្សេងៗគ្នាសម្រាប់សិស្ស</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Worksheet count input & presets */}
                  <div className="bg-[#FAF8F5] border border-border-beige rounded-2xl p-4">
                    <label className="block text-xs font-black text-charcoal mb-2 flex items-center gap-1.5">
                      <Layers size={16} className="text-amber-600" />
                      <span>ចំនួនសន្លឹកកិច្ចការ (បោះពុម្ពសន្លឹកផ្សេងៗគ្នា)</span>
                    </label>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={worksheetCount}
                        onChange={(e) => setWorksheetCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                        className="w-24 px-3.5 py-2.5 bg-white border border-border-beige rounded-xl font-extrabold text-charcoal text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                      />
                      <span className="text-xs font-bold text-soft-gray">សន្លឹក (១ ដល់ ៥០ សន្លឹក)</span>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 3, 5, 10, 15, 20, 30].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => { playClickSound(); setWorksheetCount(cnt); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            worksheetCount === cnt
                              ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                              : 'bg-white hover:bg-stone-100 border-border-beige text-charcoal'
                          }`}
                        >
                          {cnt} សន្លឹក
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] font-semibold text-soft-gray mt-3 leading-relaxed">
                      💡 ប្រព័ន្ធនឹងបង្កើតសន្លឹកកិច្ចការចំនួន <strong className="text-charcoal font-black">{worksheetCount}</strong> ផ្សេងៗគ្នា (random letter grid) ដោយស្វ័យប្រវត្តិ។
                    </p>
                  </div>

                  {/* Student details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-charcoal mb-1 flex items-center gap-1">
                        <User size={13} className="text-soft-gray" />
                        <span>ឈ្មោះសិស្ស (កំណត់ជាស្រេច)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ឧទាហរណ៍៖ សុខ ជា"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-border-beige rounded-xl font-bold text-charcoal text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-charcoal mb-1 flex items-center gap-1">
                        <Calendar size={13} className="text-soft-gray" />
                        <span>កាលបរិច្ឆេទ</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ថ្ងៃ/ខែ/ឆ្នាំ"
                        value={studentDate}
                        onChange={(e) => setStudentDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-border-beige rounded-xl font-bold text-charcoal text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Solution key option */}
                  <label className="flex items-center gap-3 p-3.5 bg-[#FAF8F5] border border-border-beige rounded-xl cursor-pointer hover:bg-stone-100/70 transition-all">
                    <input
                      type="checkbox"
                      checked={includeSolutionsInPrint}
                      onChange={(e) => setIncludeSolutionsInPrint(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-black text-charcoal block">បង្ហាញតែសន្លឹកចម្លើយ (Show Answer Key Only)</span>
                      <span className="text-[10px] font-semibold text-soft-gray block">បង្ហាញតែសន្លឹកចម្លើយដែលបានគូសរំលេចទីតាំងពាក្យ មិនបង្ហាញសន្លឹកកិច្ចការលំហាត់</span>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-8 pt-4 border-t border-border-beige">
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-charcoal font-bold rounded-2xl text-xs transition-all cursor-pointer border border-border-beige"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={handleExecutePrint}
                    disabled={isDownloading}
                    className={`flex-1 py-3 bg-clay hover:bg-clay-dark text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                      isDownloading ? 'opacity-70 animate-pulse' : ''
                    }`}
                  >
                    <Printer size={16} />
                    <span>បង្កើត & បោះពុម្ព ({worksheetCount} សន្លឹក)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-[32px] p-6 max-w-lg w-full shadow-2xl border border-border-beige flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Settings size={20} />
                    </div>
                    <h3 className="text-xl font-black text-charcoal">ការកំណត់ពាក្យ</h3>
                  </div>
                  <button 
                    onClick={() => setShowSettingsModal(false)}
                    className="p-2 text-soft-gray hover:text-charcoal hover:bg-stone-bg rounded-full transition-all cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                  <div className="bg-stone-50 border border-border-beige rounded-2xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isManualSelection}
                        onChange={(e) => {
                          playClickSound();
                          setIsManualSelection(e.target.checked);
                        }}
                        className="w-5 h-5 accent-sage rounded-md cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-charcoal text-sm">ជ្រើសរើសពាក្យដោយខ្លួនឯង</div>
                        <div className="text-xs text-soft-gray mt-1">ប្រសិនបើមិនជ្រើសរើស កម្មវិធីនឹងទាញយក ១០ ពាក្យដោយចៃដន្យ។</div>
                      </div>
                    </label>
                  </div>

                  {isManualSelection && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-bold text-charcoal">ជ្រើសរើសពាក្យ (អតិបរមា ១០ ពាក្យ)</span>
                        <span className="text-xs font-bold text-sage-dark bg-sage/20 px-2 py-1 rounded-md">{manualSelectedWords.length} / 10</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {(() => {
                          let filtered = words;
                          if (filterType !== 'ទាំងអស់') {
                            filtered = words.filter(w => (w.wordType || 'មិនស្គាល់') === filterType);
                          }
                          const singleWords = filtered.filter(w => !isSentenceItem(w));
                          const sourceArray = singleWords.length > 0 ? singleWords : filtered;

                          return sourceArray.map((w, i) => {
                            const isSelected = manualSelectedWords.includes(w.word);
                            return (
                              <label key={i} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                                isSelected 
                                  ? 'bg-sage/10 border-sage/40' 
                                  : 'bg-white border-border-beige hover:border-soft-gray'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    playClickSound();
                                    if (e.target.checked) {
                                      if (manualSelectedWords.length < 10) {
                                        setManualSelectedWords([...manualSelectedWords, w.word]);
                                      }
                                    } else {
                                      setManualSelectedWords(manualSelectedWords.filter(word => word !== w.word));
                                    }
                                  }}
                                  className="w-4 h-4 accent-sage cursor-pointer rounded"
                                />
                                <span className={`text-sm font-bold truncate ${isSelected ? 'text-sage-dark' : 'text-charcoal'}`}>
                                  {w.word}
                                </span>
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-beige shrink-0">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-charcoal font-bold rounded-2xl text-sm transition-all cursor-pointer border border-border-beige"
                  >
                    បោះបង់
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="flex-1 py-3.5 bg-clay hover:bg-clay-dark text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-md"
                  >
                    អនុវត្ត
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
