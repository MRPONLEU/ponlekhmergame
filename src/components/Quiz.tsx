import React from 'react';
import * as XLSX from 'xlsx';
import { WordItem, QuizQuestion } from '../types';
import { DEFAULT_QUIZ } from '../data';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Award,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minimize2,
  Clock,
  Trash2,
  Plus,
  Settings,
  BookOpen,
  Download,
  Upload,
  Pencil,
  X,
  Flame,
  User,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound, playFailSound, playWinSound, playTickSound } from '../utils/audio';

interface QuizTeam {
  id: number;
  name: string;
  score: number;
}

const DEFAULT_QUIZ_TEAMS: QuizTeam[] = [
  { id: 1, name: "ក្រុមទី១", score: 0 },
  { id: 2, name: "ក្រុមទី២", score: 0 },
];

const TEAM_PRESETS = [
  {
    headerBg: "bg-gradient-to-r from-rose-500 to-pink-600",
    borderClass: "border-pink-500",
    activeRing: "ring-4 ring-pink-400/40",
  },
  {
    headerBg: "bg-gradient-to-r from-indigo-500 to-blue-600",
    borderClass: "border-indigo-500",
    activeRing: "ring-4 ring-indigo-400/40",
  },
  {
    headerBg: "bg-gradient-to-r from-emerald-500 to-teal-600",
    borderClass: "border-emerald-500",
    activeRing: "ring-4 ring-emerald-400/40",
  },
  {
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-600",
    borderClass: "border-amber-500",
    activeRing: "ring-4 ring-amber-400/40",
  },
];

const khmerPrefixes = ["ក", "ខ", "គ", "ឃ"];
const englishPrefixes = ["A", "B", "C", "D"];

const getKhmerNumber = (num: number): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(digit => khmerDigits[parseInt(digit, 10)] || digit).join('');
};

const khmerToEnglishNumber = (str: string): string => {
  const map: { [key: string]: string } = {
    '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4',
    '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9'
  };
  return str.split('').map(char => map[char] || char).join('');
};

const optionStyles = [
  {
    bg: "bg-white",
    border: "border-purple-200 border-2",
    hoverBorder: "hover:border-purple-500 hover:bg-purple-50/50",
    text: "text-purple-900 font-extrabold",
    badgeBg: "bg-purple-600",
    badgeText: "text-white font-black",
  },
  {
    bg: "bg-white",
    border: "border-indigo-200 border-2",
    hoverBorder: "hover:border-indigo-500 hover:bg-indigo-50/50",
    text: "text-indigo-900 font-extrabold",
    badgeBg: "bg-indigo-600",
    badgeText: "text-white font-black",
  },
  {
    bg: "bg-white",
    border: "border-fuchsia-200 border-2",
    hoverBorder: "hover:border-fuchsia-500 hover:bg-fuchsia-50/50",
    text: "text-fuchsia-900 font-extrabold",
    badgeBg: "bg-fuchsia-600",
    badgeText: "text-white font-black",
  },
  {
    bg: "bg-white",
    border: "border-violet-200 border-2",
    hoverBorder: "hover:border-violet-500 hover:bg-violet-50/50",
    text: "text-violet-900 font-extrabold",
    badgeBg: "bg-violet-600",
    badgeText: "text-white font-black",
  },
];

interface QuizProps {
  words: WordItem[];
  questions?: QuizQuestion[];
  topicName?: string;
  onUpdateQuestions?: (questions: QuizQuestion[]) => void;
  onBack: () => void;
}

export default function Quiz({ words, questions: propQuestions, topicName, onUpdateQuestions, onBack }: QuizProps) {
  const [questions, setQuestions] = React.useState<QuizQuestion[]>(() => {
    if (propQuestions && propQuestions.length > 0) {
      return propQuestions;
    }
    try {
      const saved = localStorage.getItem('khmer_quiz_questions');
      return saved ? JSON.parse(saved) : DEFAULT_QUIZ;
    } catch (e) {
      console.error("Failed to parse saved quiz questions, using default.", e);
      return DEFAULT_QUIZ;
    }
  });

  React.useEffect(() => {
    if (propQuestions) {
      setQuestions(propQuestions);
    }
  }, [propQuestions]);

  React.useEffect(() => {
    try {
      localStorage.setItem('khmer_quiz_questions', JSON.stringify(questions));
      onUpdateQuestions?.(questions);
    } catch (e) {
      console.error("Failed to save quiz questions to localStorage", e);
    }
  }, [questions]);

  const [isTeacherMode, setIsTeacherMode] = React.useState(false);
  const [prefixType, setPrefixType] = React.useState<'english' | 'khmer'>('english');
  const [quizTheme, setQuizTheme] = React.useState<'purple' | 'light'>('purple');
  const [playMode, setPlayMode] = React.useState<'team' | 'individual'>('team');
  const [teams, setTeams] = React.useState<QuizTeam[]>(DEFAULT_QUIZ_TEAMS);
  const [activeTeamIdx, setActiveTeamIdx] = React.useState(0);
  const [newQuestionText, setNewQuestionText] = React.useState('');
  const [newOptions, setNewOptions] = React.useState<string[]>(['', '', '', '']);
  const [newAnswerIdx, setNewAnswerIdx] = React.useState<number>(0);
  const [newExplanationText, setNewExplanationText] = React.useState('');
  const [teacherError, setTeacherError] = React.useState<string | null>(null);
  const [teacherSuccess, setTeacherSuccess] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const [currentQIndex, setCurrentQIndex] = React.useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = React.useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [quizFinished, setQuizFinished] = React.useState(false);

  const [isRevealed, setIsRevealed] = React.useState(false);
  const [timerDuration, setTimerDuration] = React.useState(10);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(10);

  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRevealed && !hasAnswered && timeLeft > 0) {
      timer = setInterval(() => {
        playTickSound();
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRevealed && !hasAnswered && timeLeft === 0) {
      setHasAnswered(true);
      playFailSound();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRevealed, hasAnswered, timeLeft]);

  // Spacebar to reveal question or go to next question when answered
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSettingsOpen && !isTeacherMode && !quizFinished) {
        if (!isRevealed) {
          e.preventDefault();
          playClickSound();
          setIsRevealed(true);
          setTimeLeft(timerDuration);
        } else if (hasAnswered) {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRevealed, hasAnswered, isSettingsOpen, isTeacherMode, quizFinished, currentQIndex, questions.length, timerDuration]);

  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const quizRef = React.useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    playClickSound();
    setIsFullScreen(!isFullScreen);
  };



  const handleOptionClick = (optionIdx: number) => {
    if (hasAnswered) return;
    playClickSound();
    setSelectedOptionIdx(optionIdx);
    setHasAnswered(true);

    const isCorrect = optionIdx === questions[currentQIndex].answerIndex;
    if (isCorrect) {
      setScore(prev => prev + 10);
      if (playMode === 'team') {
        setTeams(prev => prev.map((t, idx) => idx === activeTeamIdx ? { ...t, score: t.score + 10 } : t));
      }
      playSuccessSound();
    } else {
      playFailSound();
    }
  };

  const handleNext = () => {
    playClickSound();
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOptionIdx(null);
      setHasAnswered(false);
      setIsRevealed(false);
      setTimeLeft(timerDuration);
      if (playMode === 'team' && teams.length > 0) {
        setActiveTeamIdx(prev => (prev + 1) % teams.length);
      }
    } else {
      setQuizFinished(true);
      playWinSound();
    }
  };

  const handleRestart = () => {
    playClickSound();
    setCurrentQIndex(0);
    setSelectedOptionIdx(null);
    setHasAnswered(false);
    setIsRevealed(false);
    setTimeLeft(timerDuration);
    setScore(0);
    setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
    setActiveTeamIdx(0);
    setQuizFinished(false);
  };



  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setTeacherError(null);
    setTeacherSuccess(null);

    if (!newQuestionText.trim()) {
      setTeacherError('សូមបញ្ចូលសំណួរ!');
      playFailSound();
      return;
    }
    
    const filledOptions = newOptions.map(opt => opt.trim());
    if (filledOptions.some(opt => !opt)) {
      setTeacherError('សូមបំពេញជម្រើសចម្លើយទាំង ៤ ឲ្យបានគ្រប់គ្រាន់!');
      playFailSound();
      return;
    }

    const newQ: QuizQuestion = {
      question: newQuestionText.trim(),
      options: filledOptions,
      answerIndex: newAnswerIdx,
      explanation: newExplanationText.trim() || `ចម្លើយត្រឹមត្រូវគឺ ៖ ${filledOptions[newAnswerIdx]}`
    };

    if (editingIndex !== null) {
      setQuestions(prev => prev.map((q, idx) => idx === editingIndex ? newQ : q));
      setEditingIndex(null);
      setTeacherSuccess('បានកែសម្រួលសំណួរដោយជោគជ័យ!');
    } else {
      setQuestions(prev => [...prev, newQ]);
      setTeacherSuccess('បានរក្សាទុកសំណួរថ្មីដោយជោគជ័យ!');
    }
    
    // Reset form
    setNewQuestionText('');
    setNewOptions(['', '', '', '']);
    setNewAnswerIdx(0);
    setNewExplanationText('');
    setShowAddForm(false);
    
    playSuccessSound();
    setTimeout(() => setTeacherSuccess(null), 3000);
  };

  const handleStartEdit = (idx: number) => {
    playClickSound();
    const q = questions[idx];
    setNewQuestionText(q.question);
    setNewOptions([...q.options]);
    setNewAnswerIdx(q.answerIndex);
    setNewExplanationText(q.explanation || '');
    setEditingIndex(idx);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    playClickSound();
    setNewQuestionText('');
    setNewOptions(['', '', '', '']);
    setNewAnswerIdx(0);
    setNewExplanationText('');
    setEditingIndex(null);
    setShowAddForm(false);
  };

  const handleDeleteQuestion = (idxToDelete: number) => {
    playClickSound();
    if (questions.length <= 1) {
      setTeacherError('មិនអាចលុបសំណួរចុងក្រោយបានទេ! ត្រូវតែមានសំណួរយ៉ាងតិច ១។');
      playFailSound();
      return;
    }
    setQuestions(prev => prev.filter((_, idx) => idx !== idxToDelete));
    setTeacherSuccess('បានលុបសំណួររួចរាល់!');
    playSuccessSound();
    setTimeout(() => setTeacherSuccess(null), 3000);

    if (currentQIndex >= questions.length - 1) {
      setCurrentQIndex(Math.max(0, questions.length - 2));
    }
  };

  const handleResetToDefault = () => {
    playClickSound();
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់សំណួរឡើងវិញទៅកាន់សំណួរលំនាំដើមទាំងអស់មែនទេ?')) {
      setQuestions(DEFAULT_QUIZ);
      setCurrentQIndex(0);
      setTeacherSuccess('បានកំណត់សំណួរឡើងវិញជាលំនាំដើម!');
      playSuccessSound();
      setTimeout(() => setTeacherSuccess(null), 3000);
    }
  };

  const generateXLSContent = (dataRows: string[][]) => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>កម្រងសំណួរខ្មែរ</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    table {
      border-collapse: collapse;
      font-family: 'Khmer OS Battambang', 'Kantumruy Pro', 'Nokora', 'Inter', sans-serif;
    }
    th {
      background-color: #8bc34a; /* Elegant Khmer green header */
      color: #000000;
      font-weight: bold;
      border: 1px solid #7cb342;
      padding: 12px 10px;
      text-align: center;
      font-size: 11pt;
    }
    td {
      border: 1px solid #d3d3d3;
      padding: 8px 10px;
      font-size: 10pt;
    }
    .num-col {
      text-align: center;
      background-color: #f9f9f9;
      font-weight: bold;
    }
    .ans-col {
      text-align: center;
      font-weight: bold;
      background-color: #f1f8e9;
      color: #33691e;
    }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th style="width: 60px;">ល.រ</th>
        <th style="width: 380px;">សំណួរ ( Question )</th>
        <th style="width: 150px;">ចម្លើយ ក</th>
        <th style="width: 150px;">ចម្លើយ ខ</th>
        <th style="width: 150px;">ចម្លើយ គ</th>
        <th style="width: 150px;">ចម្លើយ ឃ</th>
        <th style="width: 100px;">ចម្លើយ</th>
        <th style="width: 300px;">ការពន្យល់ (Explanation)</th>
      </tr>
    </thead>
    <tbody>`;

    dataRows.forEach(row => {
      html += `
      <tr>
        <td class="num-col">${row[0] || ''}</td>
        <td>${row[1] || ''}</td>
        <td>${row[2] || ''}</td>
        <td>${row[3] || ''}</td>
        <td>${row[4] || ''}</td>
        <td>${row[5] || ''}</td>
        <td class="ans-col">${row[6] || ''}</td>
        <td>${row[7] || ''}</td>
      </tr>`;
    });

    html += `
    </tbody>
  </table>
</body>
</html>`;
    return html;
  };

  const formatCSVCell = (val: string) => {
    const clean = val.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const handleExportCSV = () => {
    playClickSound();
    try {
      const headers = ["ល.រ", "សំណួរ", "ចម្លើយ ក", "ចម្លើយ ខ", "ចម្លើយ គ", "ចម្លើយ ឃ", "ចម្លើយត្រឹមត្រូវ", "ការពន្យល់"];
      const dataRows = questions.map((q, idx) => [
        getKhmerNumber(idx + 1),
        q.question,
        q.options[0] || '',
        q.options[1] || '',
        q.options[2] || '',
        q.options[3] || '',
        khmerPrefixes[q.answerIndex] || 'ក',
        q.explanation || ''
      ]);

      const csvRows = [headers, ...dataRows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(["\uFEFF" + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `khmer_quiz_questions_${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTeacherSuccess('បានទាញយកសំណួរទាំងអស់ជាឯកសារ CSV រួចរាល់!');
      playSuccessSound();
      setTimeout(() => setTeacherSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      setTeacherError('មានបញ្ហាក្នុងការទាញយកសំណួរ!');
      playFailSound();
    }
  };

  const handleExportXLSX = () => {
    playClickSound();
    try {
      const headers = ["ល.រ", "សំណួរ", "ចម្លើយ ក", "ចម្លើយ ខ", "ចម្លើយ គ", "ចម្លើយ ឃ", "ចម្លើយត្រឹមត្រូវ", "ការពន្យល់"];
      const dataRows = questions.map((q, idx) => [
        getKhmerNumber(idx + 1),
        q.question,
        q.options[0] || '',
        q.options[1] || '',
        q.options[2] || '',
        q.options[3] || '',
        khmerPrefixes[q.answerIndex] || 'ក',
        q.explanation || ''
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "កម្រងសំណួរខ្មែរ");
      XLSX.writeFile(workbook, `khmer_quiz_questions_${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}.xlsx`);

      setTeacherSuccess('បានទាញយកសំណួរទាំងអស់ជាឯកសារ Excel (.xlsx) រួចរាល់!');
      playSuccessSound();
      setTimeout(() => setTeacherSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      setTeacherError('មានបញ្ហាក្នុងការទាញយកសំណួរ!');
      playFailSound();
    }
  };

  const handleDownloadTemplate = () => {
    playClickSound();
    try {
      const headers = ["ល.រ", "សំណួរ", "ចម្លើយ ក", "ចម្លើយ ខ", "ចម្លើយ គ", "ចម្លើយ ឃ", "ចម្លើយត្រឹមត្រូវ", "ការពន្យល់"];
      const templateData = [
        [
          "១",
          "តើផ្កាអ្វីដែលតំណាងឲ្យជាតិខ្មែរ?", 
          "ផ្ការំដួល", 
          "ផ្កាឈូក", 
          "ផ្កាម្លិះ", 
          "ផ្កាអង្គារសីល", 
          "ក", 
          "ផ្ការំដួល ត្រូវបានប្រកាសជាផ្កាតំណាងឲ្យជាតិខ្មែរដោយព្រះរាជក្រឹត្យក្នុងឆ្នាំ២០០៥។"
        ],
        [
          "២",
          "តើសត្វអ្វីដែលតំណាងឲ្យជាតិខ្មែរ?", 
          "ដំរី", 
          "តោ", 
          "គោព្រៃ", 
          "ខ្លាត្រី", 
          "គ", 
          "គោព្រៃ ជាសត្វតំណាងឲ្យជាតិកម្ពុជា។"
        ]
      ];

      const csvRows = [headers, ...templateData].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(["\uFEFF" + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "khmer_quiz_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTeacherSuccess('បានទាញយកគំរូឯកសារ CSV រួចរាល់!');
      playSuccessSound();
      setTimeout(() => setTeacherSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      setTeacherError('មានបញ្ហាក្នុងការទាញយកគំរូឯកសារ!');
      playFailSound();
    }
  };

  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    
    const cleanText = text.replace(/\r/g, '');
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];
      
      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          cell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          cell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',' || char === ';') {
          row.push(cell);
          cell = '';
        } else if (char === '\n') {
          row.push(cell);
          result.push(row);
          row = [];
          cell = '';
        } else {
          cell += char;
        }
      }
    }
    if (cell || row.length > 0) {
      row.push(cell);
      result.push(row);
    }
    return result;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();
    const fileName = file.name.toLowerCase();

    const processParsedRows = (parsed: string[][]) => {
      if (!parsed || parsed.length <= 1) {
        setTeacherError('ឯកសារគ្មានទិន្នន័យសំណួរទេ!');
        playFailSound();
        return;
      }

      let startIdx = 0;
      const firstRow = parsed[0] || [];
      const isHeader = firstRow.some(cell => 
        String(cell).includes('សំណួរ') || 
        String(cell).includes('Question') || 
        String(cell).includes('ជម្រើស') || 
        String(cell).includes('Option') ||
        String(cell).includes('ល.រ')
      );
      if (isHeader) {
        startIdx = 1;
      }

      const importedQuestions: QuizQuestion[] = [];
      const hasNoCol = isHeader && (String(firstRow[0]).includes('ល.រ') || String(firstRow[0]).includes('ល.រ.'));

      for (let i = startIdx; i < parsed.length; i++) {
        const row = parsed[i];
        if (!row || row.length === 0 || (row.length === 1 && !String(row[0]).trim())) {
          continue;
        }

        let questionText = '';
        let opt1 = '';
        let opt2 = '';
        let opt3 = '';
        let opt4 = '';
        let rawAnsIdx = '';
        let explanation = '';

        if (hasNoCol) {
          questionText = String(row[1] || '').trim();
          opt1 = String(row[2] || '').trim();
          opt2 = String(row[3] || '').trim();
          opt3 = String(row[4] || '').trim();
          opt4 = String(row[5] || '').trim();
          rawAnsIdx = String(row[6] || '').trim();
          explanation = String(row[7] || '').trim();
        } else {
          questionText = String(row[0] || '').trim();
          opt1 = String(row[1] || '').trim();
          opt2 = String(row[2] || '').trim();
          opt3 = String(row[3] || '').trim();
          opt4 = String(row[4] || '').trim();
          rawAnsIdx = String(row[5] || '').trim();
          explanation = String(row[6] || '').trim();
        }

        if (!questionText || !opt1 || !opt2) {
          continue;
        }

        const options = [opt1, opt2, opt3 || 'ជម្រើសគ', opt4 || 'ជម្រើសឃ'];

        let answerIndex = 0;
        if (rawAnsIdx) {
          const cleanRaw = rawAnsIdx.toLowerCase().trim();
          if (cleanRaw.includes('ក') || cleanRaw === 'a') answerIndex = 0;
          else if (cleanRaw.includes('ខ') || cleanRaw === 'b') answerIndex = 1;
          else if (cleanRaw.includes('គ') || cleanRaw === 'c') answerIndex = 2;
          else if (cleanRaw.includes('ឃ') || cleanRaw === 'd') answerIndex = 3;
          else {
            const convertedRaw = khmerToEnglishNumber(cleanRaw);
            const parsedIdx = parseInt(convertedRaw, 10);
            if (!isNaN(parsedIdx) && parsedIdx >= 1 && parsedIdx <= 4) {
              answerIndex = parsedIdx - 1;
            }
          }
        }

        importedQuestions.push({
          question: questionText,
          options,
          answerIndex,
          explanation: explanation || `ចម្លើយត្រឹមត្រូវគឺ ៖ ${options[answerIndex]}`
        });
      }

      if (importedQuestions.length === 0) {
        setTeacherError('មិនអាចស្វែងរកទិន្នន័យសំណួរត្រឹមត្រូវក្នុងឯកសារទេ! សូមពិនិត្យមើលគំរូទ្រង់ទ្រាយឯកសារ CSV/Excel។');
        playFailSound();
        return;
      }

      const shouldReplace = window.confirm(`បានរកឃើញសំណួរចំនួន ${importedQuestions.length}។ តើអ្នកចង់ជំនួសសំណួរចាស់ៗទាំងអស់ (ចុច យល់ព្រម) ឬចង់បន្ថែមចូលទៅក្នុងសំណួរដែលមានស្រាប់ (ចុច បោះបង់)?`);

      if (shouldReplace) {
        setQuestions(importedQuestions);
        setCurrentQIndex(0);
        setTeacherSuccess(`បានជំនួសសំណួរទាំងអស់ដោយសំណួរថ្មីចំនួន ${importedQuestions.length} ដោយជោគជ័យ!`);
      } else {
        setQuestions(prev => [...prev, ...importedQuestions]);
        setTeacherSuccess(`បានបន្ថែមសំណួរថ្មីចំនួន ${importedQuestions.length} ចូលក្នុងប្រព័ន្ធដោយជោគជ័យ!`);
      }

      playSuccessSound();
      e.target.value = '';
    };

    if (fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            setTeacherError('ឯកសារគ្មានទិន្នន័យទេ!');
            playFailSound();
            return;
          }
          let parsed: string[][] = [];
          try {
            const workbook = XLSX.read(text, { type: 'string' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: '' });
            parsed = jsonRows.map(row => (Array.isArray(row) ? row.map(cell => String(cell || '')) : []));
          } catch {
            parsed = parseCSV(text);
          }
          processParsedRows(parsed);
        } catch (err) {
          console.error(err);
          setTeacherError('មានបញ្ហាក្នុងការអានឯកសារ CSV នេះ!');
          playFailSound();
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: '' });
          const parsed = jsonRows.map(row => (Array.isArray(row) ? row.map(cell => String(cell || '')) : []));
          processParsedRows(parsed);
        } catch (err) {
          console.error(err);
          // Fallback to text reading if it was an HTML-based XLS file
          const textReader = new FileReader();
          textReader.onload = (tEvt) => {
            try {
              const text = tEvt.target?.result as string;
              let parsedHtml: string[][] = [];
              if (text && (text.includes('<table') || text.includes('<tr'))) {
                const domParser = new DOMParser();
                const doc = domParser.parseFromString(text, 'text/html');
                const trs = doc.querySelectorAll('tr');
                trs.forEach(tr => {
                  const rowData: string[] = [];
                  tr.querySelectorAll('th, td').forEach(cell => rowData.push(cell.textContent?.trim() || ''));
                  if (rowData.length > 0) parsedHtml.push(rowData);
                });
              } else if (text) {
                parsedHtml = parseCSV(text);
              }
              processParsedRows(parsedHtml);
            } catch {
              setTeacherError('មានបញ្ហាក្នុងការអានឯកសារ Excel/CSV នេះ!');
              playFailSound();
            }
          };
          textReader.readAsText(file, 'UTF-8');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col bg-slate-900/10 select-none relative font-sans">
      
      {/* Top Banner (Fixed/Sticky Edge-to-Edge Navigation Header & Scoreboard matching Card Game) */}
      <div className="sticky top-0 z-30 shrink-0 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-lg flex flex-wrap items-center justify-between border-b-4 border-amber-600/70 gap-3">
        
        {/* Teams / Individual Scoreboard Display (Left Side) */}
        <div className="flex items-center justify-start flex-1 gap-2.5 sm:gap-4 flex-wrap py-0.5">
          {playMode === 'team' ? (
            teams.map((team, idx) => {
              const isActive = activeTeamIdx === idx;
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
                  className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 cursor-pointer select-none ${
                    isActive 
                      ? `bg-white shadow-xl scale-105 border-2 ${preset.borderClass} ${preset.activeRing} z-10` 
                      : 'bg-white/85 hover:bg-white border-2 border-white/70 hover:border-amber-300 shadow-md opacity-90 hover:opacity-100'
                  }`}
                  title={isActive ? `${team.name} (កំពុងលេង)` : `ចុចដើម្បីប្តូរវេនទៅ ${team.name}`}
                >
                  {/* Active Turn Floating Badge */}
                  {isActive && (
                    <div className="absolute -top-3 left-2.5 bg-stone-900 text-amber-300 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-amber-400/50 animate-pulse">
                      <Flame size={10} className="fill-amber-400 text-amber-400" />
                      <span>វេនលេង</span>
                    </div>
                  )}

                  {/* Team Name Badge */}
                  <div className="flex flex-col">
                    <div className={`px-2.5 sm:px-3 py-1 rounded-xl text-white font-black text-xs sm:text-sm tracking-wide flex items-center gap-1 shadow-xs ${preset.headerBg}`}>
                      <span>{team.name}</span>
                    </div>
                  </div>

                  {/* Score Counter Box */}
                  <div className="flex items-center gap-1 bg-stone-100 px-2.5 sm:px-3 py-1 rounded-xl border border-stone-200/80 shadow-2xs">
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-stone-900 font-mono">
                      {team.score}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-stone-500">
                      ពិន្ទុ
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            /* Individual / Solo Score Card */
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-md border-2 border-amber-300">
              <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1">
                <User size={14} />
                <span>លេងជាបុគ្គល</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-100 px-3 py-1 rounded-xl border border-stone-200 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
                  {score}
                </span>
                <span className="text-xs font-bold text-stone-500">ពិន្ទុ</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls (Right Side - Cleaned up matching Card Game) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Settings Button */}
          <button
            onClick={() => { playClickSound(); setIsSettingsOpen(true); }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 hover:bg-white active:scale-90 text-stone-700 hover:text-amber-600 flex items-center justify-center shadow-xs transition-all cursor-pointer border border-stone-200"
            title="ការកំណត់ល្បែង"
          >
            <Settings size={18} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullScreen}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 hover:bg-white active:scale-90 text-stone-700 hover:text-amber-600 flex items-center justify-center shadow-xs transition-all cursor-pointer border border-stone-200 hidden sm:flex"
            title="ពេញអេក្រង់"
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Exit / Back Button */}
          <button
            onClick={() => { playClickSound(); onBack(); }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer border border-rose-600 ml-1"
            title="ចាកចេញទៅផ្ទាំងដើម"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area filling remaining height */}
      <div className="flex-1 overflow-y-auto w-full p-3 sm:p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full my-auto flex flex-col justify-center pb-4">



        {/* Main Content Card */}
        {isTeacherMode ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 sm:p-10 border border-border-beige soft-shadow space-y-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-clay/10 text-clay flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">គ្រប់គ្រង និងបង្កើតសំណួរ</h2>
                  <p className="text-xs text-soft-gray font-semibold">បង្កើតសំណួរថ្មីៗសម្រាប់សិស្ស ឬលុបសំណួរដែលមិនចង់បាន</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Download Template Button */}
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-extrabold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  title="ទាញយកគំរូឯកសារ CSV/Excel"
                >
                  <Download size={13} className="text-slate-500" />
                  <span>គំរូ CSV</span>
                </button>

                {/* Import Excel / CSV Button */}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-xl hover:bg-emerald-100 transition-all cursor-pointer relative">
                  <Upload size={13} className="text-emerald-600" />
                  <span>នាំចូល Excel / CSV</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleImportCSV}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-blue-200 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                  title="នាំចេញសំណួរជាឯកសារ CSV"
                >
                  <Download size={13} className="text-blue-600" />
                  <span>នាំចេញ CSV</span>
                </button>

                {/* Export Excel Button */}
                <button
                  type="button"
                  onClick={handleExportXLSX}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-clay/20 bg-clay/5 text-clay text-xs font-extrabold rounded-xl hover:bg-clay/10 transition-all cursor-pointer"
                  title="នាំចេញសំណួរជាឯកសារ Excel (.xlsx)"
                >
                  <Download size={13} className="text-clay" />
                  <span>នាំចេញ Excel</span>
                </button>

                {/* Reset to Default Button */}
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-extrabold rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
                  title="កំណត់សំណួរឡើងវិញជាលំនាំដើម"
                >
                  <span>លំនាំដើម</span>
                </button>

                {/* Add New Question Button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setEditingIndex(null);
                    setNewQuestionText('');
                    setNewOptions(['', '', '', '']);
                    setNewAnswerIdx(0);
                    setNewExplanationText('');
                    setShowAddForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-clay text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm shadow-clay/10"
                >
                  <Plus size={14} />
                  <span>បន្ថែមសំណួរថ្មី</span>
                </button>
              </div>
            </div>

            {/* Success/Error messages for teacher dashboard */}
            {teacherSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-3 text-sm shadow-xs">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>{teacherSuccess}</span>
              </div>
            )}
            {teacherError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-3 text-sm shadow-xs">
                <XCircle size={18} className="text-rose-500" />
                <span>{teacherError}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                📋 តារាងរាយសំណួរ និងចម្លើយ ({getKhmerNumber(questions.length)} សំណួរ)
              </h3>
            </div>

            {/* Pop-up Modal Form Section */}
            <AnimatePresence>
              {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleCancelEdit}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                  />

                  {/* Modal Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        {editingIndex !== null 
                          ? `✍️ កែសម្រួលព័ត៌មានសំណួរ (កែប្រែសំណួរទី ${getKhmerNumber(editingIndex + 1)})` 
                          : "✍️ បំពេញព័ត៌មានសំណួរថ្មី"}
                      </h4>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                      <form onSubmit={handleAddQuestion} className="space-y-4">
                        {/* Question Field */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                            សំណួរ (Question)*
                          </label>
                          <textarea
                            rows={2}
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            placeholder="ឧទាហរណ៍៖ តើផ្កាអ្វីដែលតំណាងឲ្យប្រទេសកម្ពុជា?"
                            className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clay/20 focus:border-clay font-bold text-sm bg-white"
                          />
                        </div>

                        {/* 4 Options Grid */}
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                            ជម្រើសចម្លើយទាំង ៤ (Options)*
                          </label>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {newOptions.map((opt, idx) => (
                              <div key={idx} className="relative flex items-center">
                                <span className="absolute left-4 text-xs font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                  {khmerPrefixes[idx]}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...newOptions];
                                    updated[idx] = e.target.value;
                                    setNewOptions(updated);
                                  }}
                                  placeholder={`បញ្ចូលជម្រើសទី ${idx + 1}`}
                                  className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-clay/20 focus:border-clay font-bold text-sm bg-white"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Correct Answer Selector & Explanation Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Correct Answer Selector */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                              ជ្រើសរើសចម្លើយត្រឹមត្រូវ (Correct Answer Index)*
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {khmerPrefixes.map((prefix, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => { playClickSound(); setNewAnswerIdx(idx); }}
                                  className={`py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                    newAnswerIdx === idx
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-sm">{prefix}</span>
                                  <span className="text-[9px] opacity-80">ជម្រើសទី {idx + 1}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Explanation Field */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                              ការពន្យល់បន្ថែម (Explanation - Optional)
                            </label>
                            <input
                              type="text"
                              value={newExplanationText}
                              onChange={(e) => setNewExplanationText(e.target.value)}
                              placeholder="ពន្យល់ពីមូលហេតុដែលចម្លើយនេះត្រឹមត្រូវ..."
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-clay/20 focus:border-clay font-bold text-sm bg-white"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                          >
                            បោះបង់
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                          >
                            {editingIndex !== null ? <Pencil size={14} /> : <Plus size={14} />}
                            <span>{editingIndex !== null ? "រក្សាទុកការកែប្រែ" : "រក្សាទុកសំណួរ"}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Questions list Table */}
            <div className="border border-slate-100 rounded-[24px] overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3.5 text-center text-xs font-extrabold text-slate-500 w-16">ល.រ</th>
                      <th className="px-6 py-3.5 text-xs font-extrabold text-slate-500 min-w-[300px]">សំណួរ (Question)</th>
                      <th className="px-4 py-3.5 text-center text-xs font-extrabold text-slate-500 w-24">ចម្លើយ</th>
                      <th className="px-4 py-3.5 text-center text-xs font-extrabold text-slate-500 w-24">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {questions.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-4 text-center text-sm font-extrabold text-slate-400">
                          {getKhmerNumber(idx + 1)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.question}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-black shadow-xs shadow-emerald-500/15">
                            {khmerPrefixes[q.answerIndex]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(idx)}
                              className="p-2 text-clay hover:text-clay/80 hover:bg-slate-100 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                              title="កែសម្រួលសំណួរ"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                              title="លុបសំណួរ"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : !quizFinished ? (
          currentQuestion ? (
            <div 
              ref={quizRef}
              className={
                isFullScreen 
                  ? `fixed inset-0 z-[999] ${quizTheme === 'purple' ? 'bg-[#8a2be2]' : 'bg-stone-bg'} p-4 sm:p-8 md:p-12 flex items-center justify-center overflow-y-auto select-none`
                  : ""
              }
            >
              <div className={
                isFullScreen 
                  ? `${quizTheme === 'purple' ? 'bg-gradient-to-br from-purple-800 via-violet-800 to-indigo-900 border-purple-500/30' : 'bg-white border-border-beige'} rounded-[36px] p-8 sm:p-12 md:p-16 border soft-shadow w-full h-full max-w-none flex flex-col justify-between overflow-y-auto space-y-8 relative`
                  : `${quizTheme === 'purple' ? 'bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 border-purple-400/30 text-white' : 'bg-white border-border-beige'} rounded-[36px] p-6 sm:p-10 border soft-shadow space-y-8 relative shadow-2xl`
              }>
                
                {/* Question Index/Score Header Bar */}
                <div className={`flex items-center justify-between font-bold tracking-wider ${
                  quizTheme === 'purple' ? 'text-purple-200' : 'text-soft-gray'
                } ${
                  isFullScreen ? "text-sm sm:text-base md:text-lg mb-2" : "text-xs"
                }`}>
                  <span className="font-extrabold uppercase">សំណួរទី {currentQIndex + 1} នៃ {questions.length}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-black ${quizTheme === 'purple' ? 'text-amber-300' : 'text-sage'}`}>ពិន្ទុ៖ {score}</span>
                    {hasAnswered && (
                      <button
                        onClick={handleNext}
                        id="btn-quiz-next-top"
                        className={`bg-amber-400 hover:bg-amber-500 text-purple-950 font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                          isFullScreen ? "px-5 py-2.5 sm:px-6 sm:py-3 text-base rounded-2xl" : "px-4 py-2 text-xs rounded-xl"
                        }`}
                      >
                        <span>{currentQIndex === questions.length - 1 ? "បញ្ចប់" : "សំណួរបន្ទាប់"}</span>
                        <ChevronRight size={isFullScreen ? 20 : 16} />
                      </button>
                    )}

                    <button
                      onClick={toggleFullScreen}
                      className={`hover:bg-purple-100/20 border border-purple-300/30 rounded-xl transition-all ${quizTheme === 'purple' ? 'text-white bg-purple-900/40' : 'text-charcoal bg-white'} cursor-pointer flex items-center justify-center shadow-xs ${
                        isFullScreen ? "p-2.5 sm:p-3" : "p-2"
                      }`}
                      title={isFullScreen ? "បង្រួមមកវិញ" : "ពង្រីកពេញអេក្រង់"}
                    >
                      {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={16} />}
                    </button>
                  </div>
                </div>

              {/* Question Pill Container (Visible only when revealed) */}
              {isRevealed && (
                <div className="relative w-full max-w-5xl mx-auto my-auto flex-grow flex items-center justify-center py-2 sm:py-4">
                  {/* White Pill Container */}
                  <div className={`w-full bg-white rounded-3xl sm:rounded-[40px] px-8 py-6 sm:px-16 sm:py-8 border-4 border-purple-200/90 shadow-2xl flex items-center justify-center min-h-[100px] sm:min-h-[120px]`}>
                    <h2 className={`font-extrabold text-purple-950 text-center leading-relaxed select-text tracking-wide ${
                      isFullScreen ? "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" : "text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                    }`}>
                      {currentQuestion.question}
                    </h2>
                  </div>
                </div>
              )}

              {/* Option Buttons Grid or Pre-reveal Button */}
              {!isRevealed ? (
                <div className="flex-grow flex flex-col items-center justify-center py-8 sm:py-14 space-y-6">
                  <div className="w-24 h-24 bg-amber-400/20 border-4 border-amber-400 text-amber-300 rounded-full flex items-center justify-center animate-bounce shadow-xl">
                    <Sparkles size={48} className="fill-amber-300" />
                  </div>
                  <div className="text-center max-w-md px-4">
                    <p className={`text-xl sm:text-2xl font-black ${quizTheme === 'purple' ? 'text-white' : 'text-slate-800'} leading-relaxed`}>
                      តើអ្នករួចរាល់ហើយឬនៅ?
                    </p>
                    <p className={`text-sm ${quizTheme === 'purple' ? 'text-purple-200' : 'text-slate-500'} mt-2 font-bold`}>
                      ចុចប៊ូតុងខាងក្រោមដើម្បីបង្ហាញសំណួរ ជម្រើសចម្លើយ និងចាប់ផ្តើមរាប់ថយក្រោយ {timerDuration} វិនាទី!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsRevealed(true);
                      setTimeLeft(timerDuration);
                    }}
                    className="px-12 py-5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 text-xl sm:text-2xl font-black rounded-full transition-all shadow-xl shadow-amber-400/20 cursor-pointer flex items-center gap-3 animate-pulse"
                  >
                    <span>បង្ហាញសំណួរ</span>
                    <ChevronRight size={28} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Countdown Timer for Mobile (Centered Circle) */}
                  {!hasAnswered && (
                    <div className="flex justify-center mb-4 sm:hidden">
                      <div className="relative flex items-center justify-center">
                        <div className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-lg ${
                          timeLeft <= 3 ? 'bg-rose-500 border-rose-200 text-white animate-bounce' : 'bg-white border-amber-400 text-purple-950'
                        }`}>
                          <span className="text-2xl font-black font-mono leading-none">{timeLeft}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider">វិនាទី</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Options container matching image.png styling */}
                  <div className="relative w-full max-w-5xl mx-auto">
                    {/* Option Buttons Grid */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${
                      isFullScreen ? "gap-6 sm:gap-8 md:gap-10 pb-6" : "gap-5 sm:gap-6"
                    }`}>
                      {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedOptionIdx === idx;
                        const isCorrect = idx === currentQuestion.answerIndex;
                        const showSuccess = hasAnswered && isCorrect;
                        const showFailure = hasAnswered && isSelected && !isCorrect;
                        
                        const prefixes = prefixType === 'english' ? englishPrefixes : khmerPrefixes;
                        const prefixLabel = prefixes[idx % prefixes.length];

                        // Distinct vibrant color themes for 4 options matching image.png
                        const optionThemes = [
                          {
                            badgeBg: "bg-sky-500",
                            border: "border-sky-300",
                            hover: "hover:border-sky-500 hover:bg-sky-50/30",
                          },
                          {
                            badgeBg: "bg-rose-500",
                            border: "border-rose-300",
                            hover: "hover:border-rose-500 hover:bg-rose-50/30",
                          },
                          {
                            badgeBg: "bg-emerald-500",
                            border: "border-emerald-300",
                            hover: "hover:border-emerald-500 hover:bg-emerald-50/30",
                          },
                          {
                            badgeBg: "bg-amber-500",
                            border: "border-amber-300",
                            hover: "hover:border-amber-500 hover:bg-amber-50/30",
                          },
                        ];

                        const theme = optionThemes[idx % optionThemes.length];

                        return (
                          <div key={idx} className="relative group">
                            <button
                              onClick={() => handleOptionClick(idx)}
                              disabled={hasAnswered}
                              id={`option-${idx}`}
                              className={`w-full transition-all text-left flex items-stretch border-3 rounded-2xl sm:rounded-3xl overflow-hidden -skew-x-12 shadow-md ${
                                isFullScreen
                                  ? "min-h-[80px] sm:min-h-[95px]"
                                  : "min-h-[65px] sm:min-h-[72px]"
                              } ${
                                showSuccess
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black ring-4 ring-emerald-400/30'
                                  : showFailure
                                    ? 'bg-rose-50 border-rose-500 text-rose-900 font-black ring-4 ring-rose-400/30'
                                    : hasAnswered
                                      ? 'bg-slate-100/60 border-slate-300/60 opacity-50 cursor-not-allowed text-slate-400'
                                      : `bg-white ${theme.border} ${theme.hover} active:scale-[0.98] cursor-pointer`
                              }`}
                            >
                              {/* Left Colored Badge for Option Prefix (A, B, C, D / ក, ខ, គ, ឃ) */}
                              <div className={`w-16 sm:w-20 shrink-0 flex items-center justify-center font-black transition-colors ${
                                showSuccess
                                  ? 'bg-emerald-500 text-white'
                                  : showFailure
                                    ? 'bg-rose-500 text-white'
                                    : hasAnswered
                                      ? 'bg-slate-400 text-white'
                                      : `${theme.badgeBg} text-white`
                              }`}>
                                <span className="skew-x-12 text-xl sm:text-2xl font-black drop-shadow-xs">
                                  {prefixLabel}
                                </span>
                              </div>

                              {/* Right White Content Area for Answer Text */}
                              <div className="flex-1 px-4 sm:px-6 py-3.5 flex items-center justify-between bg-white/90">
                                <span className={`skew-x-12 leading-relaxed select-none text-left flex-1 font-extrabold ${
                                  isFullScreen ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                                } ${
                                  showSuccess
                                    ? 'text-emerald-800'
                                    : showFailure
                                      ? 'text-rose-800'
                                      : hasAnswered
                                        ? 'text-slate-400'
                                        : 'text-slate-800'
                                }`}>
                                  {option}
                                </span>

                                {showSuccess && (
                                  <CheckCircle2 size={24} className="skew-x-12 text-emerald-600 shrink-0 ml-2" />
                                )}
                                {showFailure && (
                                  <XCircle size={24} className="skew-x-12 text-rose-600 shrink-0 ml-2" />
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Central Circular Countdown Timer for Tablet/Desktop */}
                    {!hasAnswered && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center pointer-events-none">
                        <div className="relative flex items-center justify-center pointer-events-auto">
                          {/* Outer Glow Ring */}
                          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                            timeLeft <= 3 ? 'bg-rose-500/20 scale-125 animate-ping' : 'bg-amber-400/20 scale-110'
                          }`} />
                          
                          {/* Circle Badge */}
                          <div className={`relative w-24 h-24 md:w-26 md:h-26 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-300 ${
                            timeLeft <= 3 
                              ? 'bg-rose-500 border-rose-200 text-white animate-bounce' 
                              : 'bg-white border-amber-400 text-purple-950'
                          }`}>
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                className="stroke-slate-100 fill-none"
                                strokeWidth="8"
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                className={`fill-none transition-all duration-1000 ${
                                  timeLeft <= 3 ? 'stroke-white' : 'stroke-amber-400'
                                }`}
                                strokeWidth="8"
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * timeLeft) / timerDuration}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="text-3xl md:text-4xl font-black font-mono leading-none z-10">
                              {timeLeft}
                            </span>
                            <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider z-10">
                              វិនាទី
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}



              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-200/60 shadow-sm flex flex-col items-center text-center">
              <HelpCircle size={48} className="text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold mb-4">មិនមានសំណួរនៅក្នុងបញ្ជីទេ!</p>
            </div>
          )
        ) : (
          /* Quiz Finished Results block */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/60 shadow-sm flex flex-col items-center text-center space-y-6"
          >
            <div className="w-20 h-20 bg-sage/10 text-sage rounded-full flex items-center justify-center animate-bounce">
              <Award size={44} />
            </div>

            <div>
              <span className="text-xs font-extrabold text-sage bg-sage/10 px-3.5 py-1 rounded-full uppercase tracking-widest block mb-2 w-max mx-auto">
                លទ្ធផលកម្រងសំណួរ
              </span>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                អបអរសាទរ! អ្នកបានបញ្ចប់ហើយ!
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full pt-6 border-t border-slate-100">
              <button
                onClick={handleRestart}
                id="btn-quiz-replay"
                className="inline-flex items-center gap-2 px-6 py-3 bg-clay hover:bg-clay/90 text-white font-bold rounded-2xl text-sm transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>លេងម្តងទៀត</span>
              </button>
              
              <button
                onClick={() => { playClickSound(); onBack(); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all shadow-sm"
              >
                <span>ត្រឡប់ទៅទំព័រដើម</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsSettingsOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
                      <Settings size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-stone-900">ការកំណត់ល្បែង</h2>
                      <p className="text-xs text-stone-500 font-medium">កំណត់របៀបលេង ចំនួនក្រុម និងរយៈពេលម៉ោង</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition-all cursor-pointer border border-stone-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Play Mode Selector */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-600 mb-2">
                      របៀបលេង (Play Mode)
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => { playClickSound(); setPlayMode('team'); }}
                        className={`p-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                          playMode === 'team'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-600 shadow-md scale-102'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Users size={18} />
                        <span>លេងជាក្រុម</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { playClickSound(); setPlayMode('individual'); }}
                        className={`p-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                          playMode === 'individual'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-700 shadow-md scale-102'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <User size={18} />
                        <span>លេងជាបុគ្គល</span>
                      </button>
                    </div>
                  </div>

                  {/* Team Configuration (When Team Play is active) */}
                  {playMode === 'team' && (
                    <div className="space-y-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-black uppercase tracking-wider text-amber-900">
                            ចំនួនក្រុម
                          </label>
                          <span className="text-xs font-bold text-amber-700">{teams.length} ក្រុម</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[2, 3, 4].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setTeams(prev => {
                                  if (count > prev.length) {
                                    const next = [...prev];
                                    for (let i = prev.length + 1; i <= count; i++) {
                                      next.push({ id: i, name: `ក្រុមទី${getKhmerNumber(i)}`, score: 0 });
                                    }
                                    return next;
                                  } else {
                                    return prev.slice(0, count);
                                  }
                                });
                                if (activeTeamIdx >= count) {
                                  setActiveTeamIdx(0);
                                }
                              }}
                              className={`py-2 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                                teams.length === count
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                  : 'bg-white hover:bg-amber-100/60 text-amber-900 border-amber-200'
                              }`}
                            >
                              {count} ក្រុម
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Team Name Inputs */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-bold text-amber-900">
                          កែប្រែឈ្មោះក្រុម
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {teams.map((t, idx) => (
                            <div key={t.id} className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-amber-200">
                              <span className="text-xs font-black text-amber-700 px-2">#{idx + 1}</span>
                              <input
                                type="text"
                                value={t.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTeams(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                                }}
                                className="w-full text-xs font-bold text-stone-800 bg-transparent focus:outline-none"
                                placeholder={`ឈ្មោះក្រុមទី${idx + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option Prefix Selector */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-600 mb-2">
                      ក្បាលចម្លើយ (Option Prefixes)
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => { playClickSound(); setPrefixType('english'); }}
                        className={`p-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                          prefixType === 'english'
                            ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Sparkles size={14} className={prefixType === 'english' ? 'text-amber-400 fill-amber-400' : 'text-stone-400'} />
                        <span>A, B, C, D</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { playClickSound(); setPrefixType('khmer'); }}
                        className={`p-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                          prefixType === 'khmer'
                            ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Sparkles size={14} className={prefixType === 'khmer' ? 'text-amber-400 fill-amber-400' : 'text-stone-400'} />
                        <span>ក, ខ, គ, ឃ</span>
                      </button>
                    </div>
                  </div>

                  {/* Quiz Theme Selector */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-600 mb-2">
                      ស្បែកពណ៌ (Quiz Theme)
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => { playClickSound(); setQuizTheme('purple'); }}
                        className={`p-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                          quizTheme === 'purple'
                            ? 'bg-purple-950 text-amber-300 border-purple-900 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <span>💜 ស្បែក Quiz (Purple)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { playClickSound(); setQuizTheme('light'); }}
                        className={`p-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                          quizTheme === 'light'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <span>⚪ ស្បែកស (Light)</span>
                      </button>
                    </div>
                  </div>

                  {/* Teacher Mode Toggle */}
                  <div className="pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
                      <div>
                        <div className="text-xs font-black text-stone-800">របៀបគ្រូបង្រៀន (Teacher Mode)</div>
                        <div className="text-[11px] text-stone-500 font-medium">បង្កើត ឬកែសម្រួលសំណួរ</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { playClickSound(); setIsTeacherMode(!isTeacherMode); }}
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer border ${
                          isTeacherMode
                            ? 'bg-purple-900 text-white border-purple-950'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {isTeacherMode ? "បើក" : "បិទ"}
                      </button>
                    </div>
                  </div>

                  {/* Timer Settings */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-stone-600">
                        រយៈពេលឆ្លើយសំណួរ
                      </span>
                      <span className="text-xl font-black text-amber-600">{timerDuration} វិនាទី</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-stone-200 rounded-lg"
                    />
                    <div className="flex justify-between text-xs text-stone-400 mt-1 font-bold">
                      <span>1s</span>
                      <span>15s</span>
                      <span>30s</span>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5 mt-3">
                      {[3, 5, 10, 15, 20, 30].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => { playClickSound(); setTimerDuration(sec); }}
                          className={`py-1.5 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                            timerDuration === sec 
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => { playClickSound(); setIsSettingsOpen(false); }}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl shadow-md transition-all cursor-pointer mt-2"
                  >
                    រក្សាទុកការកំណត់
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
