import React from 'react';
import * as XLSX from 'xlsx';
import { WordItem } from '../types';
import { TOPIC_PRESETS } from '../data';
import { 
  Sparkles, 
  Trash2, 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  RefreshCw,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Pencil,
  Download,
  Upload,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { playClickSound, playSuccessSound, playFailSound } from '../utils/audio';
import { splitKhmerWord } from '../utils/khmerSplit';

const SHORT_TEXT_SAMPLES = [
  { title: "រឿងកូនឆ្មាតូច", text: "កូនឆ្មាតូចរត់លេងលើវាលស្មៅពណ៌បៃតងយ៉ាងសប្បាយរីករាយ។" },
  { title: "រឿងសួនច្បារសាលា", text: "សាលារៀនរបស់យើងមានសួនច្បារស្អាត និងមានដើមឈើម្លប់ត្រជាក់។" },
  { title: "រឿងថ្ងៃអាទិត្យ", text: "នៅថ្ងៃអាទិត្យ ខ្ញុំជួយម៉ាក់ប៉ាសំអាតផ្ទះ និងស្រោចទឹកផ្កា។" },
  { title: "រឿងសត្វព្រៃ", text: "សត្វតោ និងសត្វដំរី រស់នៅក្នុងព្រៃយ៉ាងមានក្ដីសុខ។" }
];

interface AddWordsProps {
  words: WordItem[];
  onAddWord: (word: WordItem) => void;
  onRemoveWord: (index: number) => void;
  onSetWords: (words: WordItem[]) => void;
  onBack: () => void;
}

export default function AddWords({ words, onAddWord, onRemoveWord, onSetWords, onBack }: AddWordsProps) {
  // Manual word form state
  const [wordInput, setWordInput] = React.useState('');
  const [wordTypeInput, setWordTypeInput] = React.useState(() => {
    try {
      return localStorage.getItem('last_word_type') || 'អំណាន ៖ រឿងបងប្រុស';
    } catch {
      return 'អំណាន ៖ រឿងបងប្រុស';
    }
  });
  const [partsInput, setPartsInput] = React.useState('');

  // Filtering state
  const [filterType, setFilterType] = React.useState('ទាំងអស់');

  const uniqueWordTypes = React.useMemo(() => {
    const types = new Set<string>();
    words.forEach(w => {
      if (w.wordType) types.add(w.wordType);
    });
    return Array.from(types);
  }, [words]);

  const filteredWords = React.useMemo(() => {
    if (filterType === 'ទាំងអស់') return words;
    return words.filter(w => w.wordType === filterType);
  }, [words, filterType]);

  // AI Generation state
  const [customTopic, setCustomTopic] = React.useState('');
  const [selectedPreset, setSelectedPreset] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  // Short Text Modal state
  const [isShortTextModalOpen, setIsShortTextModalOpen] = React.useState(false);
  const [shortTextInput, setShortTextInput] = React.useState('');
  const [shortTextTypeInput, setShortTextTypeInput] = React.useState('អត្ថបទខ្លី ៖ អំណាន');
  const [shortTextMode, setShortTextMode] = React.useState<'passages' | 'words'>('passages');

  const handleAddShortText = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!shortTextInput.trim()) {
      alert("សូមបញ្ចូលខ្លឹមសារអត្ថបទខ្លី!");
      return;
    }

    const typeVal = shortTextTypeInput.trim() || 'អត្ថបទខ្លី';
    const rawText = shortTextInput.trim();

    if (shortTextMode === 'passages') {
      // Split by full stop / line break into short sentences
      const sentences = rawText
        .split(/(?:[។\n\r]+)/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const itemsToAdd: WordItem[] = (sentences.length > 0 ? sentences : [rawText]).map(sentence => {
        const spaceWords = sentence.split(/\s+/).filter(Boolean);
        return {
          word: sentence,
          wordType: typeVal,
          parts: spaceWords.length > 1 ? spaceWords : splitKhmerWord(sentence),
          definition: sentence,
          example: sentence
        };
      });

      onSetWords([...itemsToAdd, ...words]);
      playSuccessSound();
      setSuccessMessage(`បានបញ្ចូលអត្ថបទខ្លីចំនួន ${itemsToAdd.length} ល្បះដោយជោគជ័យ!`);
    } else {
      // Auto-extract individual words from text
      const extractedWords = rawText
        .split(/[\s។,!?“”()«»\n\r]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 1);

      const uniqueExtracted: string[] = Array.from(new Set(extractedWords));

      const itemsToAdd: WordItem[] = uniqueExtracted.map((w: string) => ({
        word: w,
        wordType: typeVal,
        parts: splitKhmerWord(w),
        definition: `${w} គឺជាពាក្យក្នុងអត្ថបទ`,
        example: `ខ្ញុំស្គាល់ពាក្យ ${w}។`
      }));

      onSetWords([...itemsToAdd, ...words]);
      playSuccessSound();
      setSuccessMessage(`បានទាញយក និងបញ្ចូលពាក្យចំនួន ${itemsToAdd.length} ពាក្យពីអត្ថបទខ្លីដោយជោគជ័យ!`);
    }

    setShortTextInput('');
    setIsShortTextModalOpen(false);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleEditClick = (item: WordItem, originalIndex: number) => {
    playClickSound();
    setWordInput(item.word);
    setWordTypeInput(item.wordType || 'អំណាន ៖ រឿងបងប្រុស');
    setPartsInput(item.parts ? item.parts.join(', ') : '');
    setEditingIndex(originalIndex);
    setIsModalOpen(true);
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!wordInput || !wordTypeInput) {
      alert("សូមបំពេញចន្លោះទិន្នន័យចាំបាច់!");
      return;
    }

    // Process parts: if empty, split into individual characters, otherwise split by comma
    let finalParts: string[] = [];
    if (partsInput.trim()) {
      finalParts = partsInput.split(',').map(p => p.trim()).filter(Boolean);
    } else {
      // split characters
      finalParts = splitKhmerWord(wordInput);
    }

    const finalWordType = wordTypeInput.trim();

    const updatedWord: WordItem = {
      word: wordInput.trim(),
      wordType: finalWordType,
      parts: finalParts,
      definition: `${wordInput.trim()} គឺជាពាក្យខ្មែរប្រភេទ${finalWordType}`,
      example: `ខ្ញុំស្គាល់ពាក្យ ${wordInput.trim()}។`
    };

    if (editingIndex !== null) {
      const newWords = [...words];
      newWords[editingIndex] = updatedWord;
      onSetWords(newWords);
      playSuccessSound();
      setSuccessMessage('បានកែប្រែពាក្យដោយជោគជ័យ!');
    } else {
      onAddWord(updatedWord);
      playSuccessSound();
      setSuccessMessage('បានបញ្ចូលពាក្យថ្មីដោយជោគជ័យ!');
    }

    // Clear word and parts but keep remembered wordTypeInput
    setWordInput('');
    setPartsInput('');
    setEditingIndex(null);
    setIsModalOpen(false);
    try {
      localStorage.setItem('last_word_type', finalWordType);
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleGenerateAI = async (topicName: string) => {
    if (!topicName) return;
    playClickSound();
    setIsLoading(true);
    setAiError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/ai/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicName }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'មានបញ្ហាក្នុងការបង្កើតពាក្យជាមួយ AI');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        onSetWords(data);
        playSuccessSound();
        setSuccessMessage(`បានបង្កើតពាក្យចំនួន ${data.length} ពាក្យដោយជោគជ័យអំពី "${topicName}"!`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        throw new Error('ទិន្នន័យដែលទទួលបានមិនត្រឹមត្រូវ!');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ AI។ សូមព្យាយាមម្តងទៀត។');
      playFailSound();
    } finally {
      setIsLoading(false);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    playClickSound();
    let csvContent = "\uFEFFពាក្យ,ប្រភេទពាក្យ,បំណែកអក្សរ,ឧទាហរណ៍\n";
    words.forEach(item => {
      const word = `"${(item.word || '').replace(/"/g, '""')}"`;
      const wordType = `"${(item.wordType || '').replace(/"/g, '""')}"`;
      const parts = `"${(item.parts ? item.parts.join(',') : '').replace(/"/g, '""')}"`;
      const example = `"${(item.example || '').replace(/"/g, '""')}"`;
      csvContent += `${word},${wordType},${parts},${example}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `khmer_words_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMessage('បានទាញយកបញ្ជីពាក្យជាឯកសារ Excel (CSV) ដោយជោគជ័យ!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();
    const fileName = file.name.toLowerCase();

    const processWordRows = (rows: string[][]) => {
      if (!rows || rows.length === 0) {
        throw new Error('រកមិនឃើញទិន្នន័យពាក្យក្នុងឯកសារទេ។');
      }

      const startIndex = (rows[0] && (String(rows[0][0]).includes('ពាក្យ') || String(rows[0][0]).includes('word'))) ? 1 : 0;
      const newWords: WordItem[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const rowCols = rows[i];
        if (!rowCols || rowCols.length === 0 || !String(rowCols[0] || '').trim()) continue;

        const wordVal = String(rowCols[0]).trim();
        const typeVal = String(rowCols[1] || 'អំណាន').trim();
        const partsVal = rowCols[2] ? String(rowCols[2]).split(',').map(p => p.trim()).filter(Boolean) : splitKhmerWord(wordVal);
        const exampleVal = String(rowCols[3] || `ខ្ញុំស្គាល់ពាក្យ ${wordVal}។`).trim();

        newWords.push({
          word: wordVal,
          wordType: typeVal,
          parts: partsVal,
          definition: exampleVal,
          example: exampleVal
        });
      }

      if (newWords.length > 0) {
        const combined = [...newWords, ...words];
        onSetWords(combined);
        playSuccessSound();
        setSuccessMessage(`បាននាំចូលពាក្យចំនួន ${newWords.length} ដោយជោគជ័យ!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        throw new Error('រកមិនឃើញទិន្នន័យពាក្យក្នុងឯកសារទេ។');
      }
    };

    if (fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) return;
          let parsed: string[][] = [];
          try {
            const workbook = XLSX.read(text, { type: 'string' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: '' });
            parsed = jsonRows.map(row => (Array.isArray(row) ? row.map(c => String(c || '')) : []));
          } catch {
            const lines = text.split(/\r?\n/);
            parsed = lines.map(line => {
              let cols = [];
              let inQuotes = false;
              let currentCol = '';
              for (let cIdx = 0; cIdx < line.length; cIdx++) {
                const char = line[cIdx];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                  cols.push(currentCol.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                  currentCol = '';
                } else {
                  currentCol += char;
                }
              }
              cols.push(currentCol.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
              return cols;
            });
          }
          processWordRows(parsed);
        } catch (err: any) {
          console.error(err);
          playFailSound();
          setAiError(err.message || 'បរាជ័យក្នុងការអានឯកសារ CSV');
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: '' });
          const parsed = jsonRows.map(row => (Array.isArray(row) ? row.map(c => String(c || '')) : []));
          processWordRows(parsed);
        } catch (err: any) {
          console.error(err);
          playFailSound();
          setAiError(err.message || 'បរាជ័យក្នុងការអានឯកសារ Excel (.xlsx / .xls)');
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleResetDefault = () => {
    playClickSound();
    if (confirm("តើអ្នកចង់កំណត់បញ្ជីពាក្យដើមឡើងវិញឬទេ?")) {
      localStorage.removeItem('khmer_words');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 border-b border-border-beige pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { playClickSound(); onBack(); }}
              id="btn-back-dashboard"
              className="p-3 bg-white hover:bg-stone-bg border border-border-beige rounded-full shadow-sm transition-all text-charcoal hover:text-black cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-charcoal">បញ្ចូលនិងគ្រប់គ្រងពាក្យ</h1>
              <p className="text-soft-gray text-sm mt-0.5">បន្ថែមបញ្ជីពាក្យសម្រាប់ការផ្គុំ និងការលេងល្បែងរបស់កុមារ</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 self-start sm:self-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              accept=".csv,.xlsx,.xls,.txt" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-charcoal bg-white border border-border-beige hover:border-sage hover:text-sage rounded-2xl transition-all shadow-sm cursor-pointer"
              title="នាំចូលពី Excel / CSV"
            >
              <Upload size={15} />
              <span>នាំចូល Excel</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-charcoal bg-white border border-border-beige hover:border-sage hover:text-sage rounded-2xl transition-all shadow-sm cursor-pointer"
              title="ទាញយកជា Excel / CSV"
            >
              <Download size={15} />
              <span>ទាញយក Excel</span>
            </button>
            <button
              onClick={() => { playClickSound(); setEditingIndex(null); setWordInput(''); setPartsInput(''); setIsModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-clay hover:bg-[#b86d47] rounded-2xl transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>បញ្ចូលពាក្យថ្មី</span>
            </button>
            <button
              onClick={() => { playClickSound(); setIsShortTextModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-sm cursor-pointer"
              title="បញ្ចូលអត្ថបទខ្លី ឬប្រយោគអំណាន"
            >
              <FileText size={16} />
              <span>បញ្ចូលអត្ថបទខ្លី</span>
            </button>
            <button
              onClick={handleResetDefault}
              id="btn-reset-default"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-clay bg-clay/10 border border-clay/20 rounded-2xl hover:bg-clay/20 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>កំណត់ដើម</span>
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-sage/10 border border-sage/20 text-sage flex items-center gap-3 shadow-sm text-sm font-semibold"
          >
            <CheckCircle2 size={18} className="text-sage shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {aiError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 shadow-sm text-sm font-semibold"
          >
            <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
            <span>{aiError}</span>
          </motion.div>
        )}

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#F9F7F2] rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto soft-shadow border border-border-beige p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-soft-gray hover:bg-border-beige/50 rounded-full transition-all cursor-pointer"
              >
                <Trash2 size={20} className="hidden" /> {/* Placeholder for close icon, using a simple X below */}
                <span className="font-bold text-xl leading-none block w-5 h-5 flex items-center justify-center text-charcoal">✕</span>
              </button>

              <h2 className="text-2xl font-bold text-charcoal mb-6">{editingIndex !== null ? 'កែប្រែពាក្យ' : 'បញ្ចូលពាក្យថ្មី'}</h2>

              <div className="space-y-8">
                {/* Manual Add Form */}
                <div className="bg-white rounded-[24px] p-6 border border-border-beige soft-shadow">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="p-2 bg-clay/10 rounded-xl text-clay">
                      {editingIndex !== null ? <Pencil size={20} /> : <Plus size={20} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-charcoal">{editingIndex !== null ? 'កែប្រែពាក្យក្នុងបញ្ជី' : 'បញ្ចូលពាក្យដោយដៃផ្ទាល់'}</h3>
                      <p className="text-xs text-soft-gray">{editingIndex !== null ? 'កែសម្រួលព័ត៌មានពាក្យ' : 'សម្រាប់បញ្ចូលពាក្យជាក់លាក់តាមតម្រូវការ'}</p>
                    </div>
                  </div>

                  <form onSubmit={(e) => {
                    handleAddManual(e);
                    if (wordInput) {
                      setIsModalOpen(false);
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal mb-1.5">
                          ពាក្យខ្មែរ <span className="text-clay font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={wordInput}
                          onChange={(e) => setWordInput(e.target.value)}
                          placeholder="ឧ. សត្វតោ"
                          className="w-full px-4 py-3 border border-border-beige bg-[#F9F7F2] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-clay/15 focus:border-clay transition-all text-charcoal"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-charcoal mb-1.5">
                          ប្រភេទពាក្យ <span className="text-clay font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={wordTypeInput}
                          onChange={(e) => setWordTypeInput(e.target.value)}
                          placeholder="ឧ. អំណាន ៖ រឿងបងប្រុស"
                          className="w-full px-4 py-3 border border-border-beige bg-[#F9F7F2] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-clay/15 focus:border-clay transition-all text-charcoal"
                        />
                        {uniqueWordTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {uniqueWordTypes.slice(0, 5).map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  setWordTypeInput(type);
                                }}
                                className="text-[11px] px-2 py-0.5 bg-[#F9F7F2] hover:bg-clay/10 text-charcoal hover:text-clay border border-border-beige rounded-lg transition-all"
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-charcoal">
                          បំណែកអក្សរសម្រាប់ផ្គុំ (ស្រេចចិត្ត)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            if (wordInput.trim()) {
                              const chars = splitKhmerWord(wordInput.trim());
                              setPartsInput(chars.join(', '));
                            }
                          }}
                          className="text-xs text-sage hover:text-sage/80 font-bold flex items-center gap-1 cursor-pointer bg-leaf-1/60 px-2 py-0.5 rounded-lg border border-sage/20 transition-all"
                        >
                          ✂️ បំបែកអក្សរ
                        </button>
                      </div>
                      <p className="text-soft-gray text-[11px] mb-1.5">ប្រើប្រាស់សញ្ញាក្បៀស (,) ដើម្បីញែកតួអក្សរ ឧ. <span className="font-mono text-sage font-bold">ស,ត,្វ</span> ។ បើទុកចំហរ វានឹងញែកតួអក្សរដោយស្វ័យប្រវត្ត។</p>
                      <input
                        type="text"
                        value={partsInput}
                        onChange={(e) => setPartsInput(e.target.value)}
                        placeholder="ស,ត,្វ"
                        className="w-full px-4 py-3 border border-border-beige bg-[#F9F7F2] rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-clay/15 focus:border-clay transition-all text-charcoal"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        id="btn-add-manual"
                        className="flex-1 py-3 bg-clay hover:bg-[#b86d47] text-white font-bold rounded-2xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
                      >
                        {editingIndex !== null ? <Pencil size={16} /> : <Plus size={16} />}
                        <span>{editingIndex !== null ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូលទៅក្នុងបញ្ជីពាក្យ'}</span>
                      </button>
                      {editingIndex !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setEditingIndex(null);
                            setWordInput('');
                            setPartsInput('');
                            setIsModalOpen(false);
                          }}
                          className="py-3 px-5 bg-border-beige/50 hover:bg-border-beige text-charcoal font-bold rounded-2xl text-sm transition-all cursor-pointer mt-4"
                        >
                          បោះបង់
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Short Text Modal Overlay */}
        {isShortTextModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#F9F7F2] rounded-[32px] max-w-2xl w-full max-h-[92vh] overflow-y-auto soft-shadow border border-border-beige p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setIsShortTextModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-soft-gray hover:bg-border-beige/50 rounded-full transition-all cursor-pointer font-bold text-xl leading-none w-8 h-8 flex items-center justify-center text-charcoal"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-charcoal">បញ្ចូលអត្ថបទខ្លី / ល្បះអំណាន</h2>
                  <p className="text-xs text-soft-gray">បញ្ចូលអត្ថបទខ្លីសម្រាប់ឱ្យសិស្សអាន ឬបំបែកជាពាក្យស្វ័យប្រវត្តិ</p>
                </div>
              </div>

              <form onSubmit={handleAddShortText} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1.5">
                    ប្រភេទ ឬ មេរៀនអត្ថបទ <span className="text-emerald-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shortTextTypeInput}
                    onChange={(e) => setShortTextTypeInput(e.target.value)}
                    placeholder="ឧ. អត្ថបទខ្លី ៖ រឿងកូនឆ្មាតូច"
                    className="w-full px-4 py-3 border border-border-beige bg-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-charcoal font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-charcoal">
                      ខ្លឹមសារអត្ថបទខ្លី <span className="text-emerald-600 font-bold">*</span>
                    </label>
                    <span className="text-[11px] text-soft-gray">សរសេរ ឬ វាយចម្លងអត្ថបទទីនេះ</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={shortTextInput}
                    onChange={(e) => setShortTextInput(e.target.value)}
                    placeholder="សរសេរ ឬ ចម្លងអត្ថបទខ្លីទីនេះ ឧទាហរណ៍ ៖ ថ្ងៃនេះជាថ្ងៃអាទិត្យ។ កូនសិស្សទាំងអស់ទៅលេងសួនច្បារសាលារៀនយ៉ាងសប្បាយរីករាយ។"
                    className="w-full px-4 py-3 border border-border-beige bg-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-charcoal font-sans leading-relaxed"
                  />
                </div>

                {/* Preset Short Texts */}
                <div>
                  <label className="block text-xs font-bold text-soft-gray mb-1.5">
                    គំរូអត្ថបទខ្លីៗ (ចុចដើម្បីជ្រើសរើស ៖)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SHORT_TEXT_SAMPLES.map((sample, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setShortTextTypeInput(`អត្ថបទខ្លី ៖ ${sample.title}`);
                          setShortTextInput(sample.text);
                        }}
                        className="p-2.5 text-left bg-white hover:bg-emerald-50 border border-border-beige hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-xs"
                      >
                        <span className="font-bold text-emerald-800 block mb-0.5">📖 {sample.title}</span>
                        <span className="text-stone-600 line-clamp-1">{sample.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Import Option Mode */}
                <div className="bg-white p-4 rounded-2xl border border-border-beige space-y-2">
                  <label className="block text-xs font-bold text-charcoal mb-2">
                    របៀបបញ្ចូលទៅក្នុងប្រព័ន្ធ ៖
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-stone-50 transition-all">
                    <input
                      type="radio"
                      name="shortTextMode"
                      checked={shortTextMode === 'passages'}
                      onChange={() => setShortTextMode('passages')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-charcoal block">🟢 រក្សាទុកជាអត្ថបទ/ល្បះអាន</span>
                      <span className="text-[11px] text-soft-gray">រក្សាទុកប្រយោគទាំងមូលសម្រាប់ឱ្យសិស្សអាន ឬផ្គុំល្បះ</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-stone-50 transition-all">
                    <input
                      type="radio"
                      name="shortTextMode"
                      checked={shortTextMode === 'words'}
                      onChange={() => setShortTextMode('words')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-charcoal block">🔵 បំបែកជាពាក្យៗស្វ័យប្រវត្តិ</span>
                      <span className="text-[11px] text-soft-gray">ញែកពាក្យទាំងអស់ពីអត្ថបទ បង្កើតជាកាតពាក្យនីមួយៗ</span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>រក្សាទុកអត្ថបទខ្លី</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShortTextModalOpen(false)}
                    className="py-3.5 px-5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-2xl text-sm transition-all cursor-pointer"
                  >
                    បោះបង់
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Layout: Full width table */}
        <div className="w-full">
          {/* Current Word List preview */}
          <div className="bg-white rounded-[32px] border border-border-beige soft-shadow p-6 sm:p-8 flex flex-col h-[680px]">
            {/* Header with filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-beige">
              <div>
                <h3 className="text-lg font-bold text-charcoal">បញ្ជីពាក្យដែលមានក្នុងប្រព័ន្ធ ({words.length})</h3>
                <p className="text-xs text-soft-gray">អ្នកអាចកែប្រែ លុប ឬត្រងពាក្យតាមប្រភេទបាន</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-soft-gray">តម្រងតាមប្រភេទ៖</span>
                <select
                  value={filterType}
                  onChange={(e) => { playClickSound(); setFilterType(e.target.value); }}
                  className="px-3 py-1.5 border border-border-beige bg-[#F9F7F2] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay text-charcoal cursor-pointer"
                >
                  <option value="ទាំងអស់">ទាំងអស់</option>
                  {uniqueWordTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Word List Scroll area */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                {filteredWords.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-soft-gray">
                    <FileSpreadsheet size={48} className="text-border-beige mb-3" />
                    <p className="text-sm font-bold">មិនមានពាក្យក្នុងប្រភេទនេះឡើយ!</p>
                    <p className="text-xs text-soft-gray mt-1">សូមជ្រើសរើសប្រភេទផ្សេង ឬបន្ថែមពាក្យថ្មី</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-beige">
                        <th className="py-3 px-4 font-bold text-sm text-soft-gray w-12">ល.រ</th>
                        <th className="py-3 px-4 font-bold text-sm text-soft-gray">ពាក្យខ្មែរ</th>
                        <th className="py-3 px-4 font-bold text-sm text-soft-gray">ប្រភេទពាក្យ</th>
                        <th className="py-3 px-4 font-bold text-sm text-soft-gray text-right w-28">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWords.map((item, index) => {
                        const originalIndex = words.indexOf(item);
                        return (
                          <motion.tr
                            key={originalIndex >= 0 ? originalIndex : index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border-b border-border-beige/50 hover:bg-[#F9F7F2] transition-colors"
                          >
                            <td className="py-3 px-4 text-sm font-medium text-soft-gray">{index + 1}</td>
                            <td className="py-3 px-4 text-base font-bold text-charcoal">{item.word}</td>
                            <td className="py-3 px-4 text-sm font-medium text-sage">{item.wordType || 'នាម'}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditClick(item, originalIndex)}
                                  id={`btn-edit-word-${originalIndex}`}
                                  className="p-1.5 text-soft-gray hover:text-sage hover:bg-sage/10 rounded-xl transition-all cursor-pointer inline-flex"
                                  title="កែប្រែពាក្យនេះ"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => { playClickSound(); onRemoveWord(originalIndex); }}
                                  id={`btn-delete-word-${originalIndex}`}
                                  className="p-1.5 text-soft-gray hover:text-clay hover:bg-clay/10 rounded-xl transition-all cursor-pointer inline-flex"
                                  title="លុបពាក្យនេះ"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
