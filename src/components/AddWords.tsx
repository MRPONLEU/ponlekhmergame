import React from 'react';
import { WordItem, QuizQuestion, Topic } from '../types';
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
  FileText,
  Layers,
  HelpCircle,
  FolderPlus,
  Copy,
  Check,
  Tag,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound, playFailSound } from '../utils/audio';
import { splitKhmerWord } from '../utils/khmerSplit';
import { downloadMultiSheetTemplate, exportTopicToMultiSheetExcel, parseMultiSheetTopicExcel } from '../utils/excelHelper';

interface AddWordsProps {
  topics: Topic[];
  activeTopicId: string;
  onSelectTopic: (id: string) => void;
  onAddTopic: (topic: Topic) => void;
  onUpdateTopic: (topic: Topic) => void;
  onDeleteTopic: (id: string) => void;
  onBack: () => void;
}

type TabType = 'topics' | 'words' | 'antonyms' | 'passages' | 'quiz';

export default function AddWords({
  topics,
  activeTopicId,
  onSelectTopic,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onBack
}: AddWordsProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('topics');
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const activeTopic = React.useMemo(() => {
    return topics.find(t => t.id === activeTopicId) || topics[0];
  }, [topics, activeTopicId]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    playSuccessSound();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    playFailSound();
    setTimeout(() => setErrorMessage(null), 4000);
  };

  // ==================== TOPIC MANAGEMENT STATE ====================
  const [isTopicModalOpen, setIsTopicModalOpen] = React.useState(false);
  const [editingTopicId, setEditingTopicId] = React.useState<string | null>(null);
  const [topicNameInput, setTopicNameInput] = React.useState('');
  const [topicDescInput, setTopicDescInput] = React.useState('');
  const [topicToDelete, setTopicToDelete] = React.useState<Topic | null>(null);

  // ==================== EXCEL IMPORT MODAL STATE ====================
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importTargetMode, setImportTargetMode] = React.useState<'new' | 'current'>('new');
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importParsedData, setImportParsedData] = React.useState<{
    topicName: string;
    difficultWords: WordItem[];
    antonymWords: WordItem[];
    shortPassages: WordItem[];
    quizQuestions: QuizQuestion[];
  } | null>(null);
  const [isParsingExcel, setIsParsingExcel] = React.useState(false);

  // ==================== WORD MODAL STATE ====================
  const [isWordModalOpen, setIsWordModalOpen] = React.useState(false);
  const [editingWordIdx, setEditingWordIdx] = React.useState<number | null>(null);
  const [wordInput, setWordInput] = React.useState('');
  const [wordTypeInput, setWordTypeInput] = React.useState('នាម');
  const [partsInput, setPartsInput] = React.useState('');
  const [defInput, setDefInput] = React.useState('');
  const [exampleInput, setExampleInput] = React.useState('');
  const [wordSearch, setWordSearch] = React.useState('');
  const [wordTypeFilter, setWordTypeFilter] = React.useState('ទាំងអស់');

  // ==================== ANTONYM MODAL STATE ====================
  const [isAntonymModalOpen, setIsAntonymModalOpen] = React.useState(false);
  const [editingAntonymIdx, setEditingAntonymIdx] = React.useState<number | null>(null);
  const [antonymWord1Input, setAntonymWord1Input] = React.useState('');
  const [antonymWord2Input, setAntonymWord2Input] = React.useState('');
  const [antonymTypeInput, setAntonymTypeInput] = React.useState('ពាក្យផ្ទុយ');
  const [antonymDefInput, setAntonymDefInput] = React.useState('');
  const [antonymExInput, setAntonymExInput] = React.useState('');
  const [antonymSearch, setAntonymSearch] = React.useState('');

  // ==================== SHORT TEXT MODAL STATE ====================
  const [isPassageModalOpen, setIsPassageModalOpen] = React.useState(false);
  const [editingPassageIdx, setEditingPassageIdx] = React.useState<number | null>(null);
  const [passageCategoryInput, setPassageCategoryInput] = React.useState('អត្ថបទខ្លី ៖ អំណាន');
  const [passageTextInput, setPassageTextInput] = React.useState('');
  const [passageSearch, setPassageSearch] = React.useState('');

  // ==================== QUIZ MODAL STATE ====================
  const [isQuizModalOpen, setIsQuizModalOpen] = React.useState(false);
  const [editingQuizIdx, setEditingQuizIdx] = React.useState<number | null>(null);
  const [quizQuestionInput, setQuizQuestionInput] = React.useState('');
  const [quizOptionsInput, setQuizOptionsInput] = React.useState<string[]>(['', '', '', '']);
  const [quizAnswerIdxInput, setQuizAnswerIdxInput] = React.useState<number>(0);
  const [quizExplanationInput, setQuizExplanationInput] = React.useState('');

  // AI Generator state
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiTopicInput, setAiTopicInput] = React.useState('');

  // ==================== TOPIC ACTIONS ====================
  const handleOpenCreateTopic = () => {
    playClickSound();
    setEditingTopicId(null);
    setTopicNameInput(`មេរៀនទី${topics.length + 1} ៖ `);
    setTopicDescInput('');
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (t: Topic) => {
    playClickSound();
    setEditingTopicId(t.id);
    setTopicNameInput(t.name);
    setTopicDescInput(t.description || '');
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!topicNameInput.trim()) {
      showError('សូមបញ្ចូលឈ្មោះប្រធានបទ!');
      return;
    }

    if (editingTopicId) {
      const existing = topics.find(t => t.id === editingTopicId);
      if (existing) {
        const updated: Topic = {
          ...existing,
          name: topicNameInput.trim(),
          description: topicDescInput.trim()
        };
        onUpdateTopic(updated);
        showSuccess(`បានកែប្រែប្រធានបទ "${updated.name}" ដោយជោគជ័យ!`);
      }
    } else {
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        name: topicNameInput.trim(),
        description: topicDescInput.trim() || 'ប្រធានបទមេរៀនថ្មី',
        difficultWords: [],
        antonymWords: [],
        shortPassages: [],
        quizQuestions: [],
        createdAt: Date.now()
      };
      onAddTopic(newTopic);
      onSelectTopic(newTopic.id);
      showSuccess(`បានបង្កើតប្រធានបទថ្មី "${newTopic.name}" ដោយជោគជ័យ!`);
    }

    setIsTopicModalOpen(false);
  };

  const handleDuplicateTopic = (t: Topic) => {
    playClickSound();
    const cloned: Topic = {
      ...t,
      id: `topic-${Date.now()}`,
      name: `${t.name} (ច្បាប់ចម្លង)`,
      createdAt: Date.now()
    };
    onAddTopic(cloned);
    showSuccess(`បានចម្លងស្ទួនប្រធានបទ "${cloned.name}" ដោយជោគជ័យ!`);
  };

  const handleRequestDeleteTopic = (t: Topic) => {
    playClickSound();
    if (topics.length <= 1) {
      showError('មិនអាចលុបបានទេ! កម្មវិធីត្រូវតែមានយ៉ាងហោចណាស់ប្រធានបទ ១។');
      return;
    }
    setTopicToDelete(t);
  };

  const handleConfirmDeleteTopic = () => {
    if (!topicToDelete) return;
    playClickSound();
    const name = topicToDelete.name;
    onDeleteTopic(topicToDelete.id);
    showSuccess(`បានលុបប្រធានបទ "${name}" ដោយជោគជ័យ!`);
    setTopicToDelete(null);
  };

  // ==================== EXCEL IMPORT ACTIONS ====================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();
    setImportFile(file);
    setIsParsingExcel(true);
    try {
      const parsed = await parseMultiSheetTopicExcel(file);
      setImportParsedData(parsed);
      setIsParsingExcel(false);
      playSuccessSound();
    } catch (err: any) {
      console.error(err);
      setIsParsingExcel(false);
      showError('បរាជ័យក្នុងការអានឯកសារ Excel! សូមពិនិត្យមើលទម្រង់ឯកសារ។');
    }
  };

  const handleConfirmImportExcel = () => {
    if (!importParsedData) return;
    playClickSound();

    if (importTargetMode === 'new') {
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        name: importParsedData.topicName || `ប្រធានបទមេរៀន ${topics.length + 1}`,
        description: `នាំចូលពី Excel: ${importFile?.name || ''}`,
        difficultWords: importParsedData.difficultWords,
        antonymWords: importParsedData.antonymWords || [],
        shortPassages: importParsedData.shortPassages,
        quizQuestions: importParsedData.quizQuestions,
        createdAt: Date.now()
      };
      onAddTopic(newTopic);
      onSelectTopic(newTopic.id);
      showSuccess(`បាននាំចូលប្រធានបទថ្មី "${newTopic.name}" ដែលមាន ${newTopic.difficultWords.length} ពាក្យពិបាក, ${(newTopic.antonymWords || []).length} ពាក្យផ្ទុយ, ${newTopic.shortPassages.length} អត្ថបទ និង ${newTopic.quizQuestions.length} សំណួរ!`);
    } else {
      // Overwrite / append into active topic
      const updated: Topic = {
        ...activeTopic,
        difficultWords: importParsedData.difficultWords.length > 0 ? importParsedData.difficultWords : activeTopic.difficultWords,
        antonymWords: (importParsedData.antonymWords && importParsedData.antonymWords.length > 0) ? importParsedData.antonymWords : (activeTopic.antonymWords || []),
        shortPassages: importParsedData.shortPassages.length > 0 ? importParsedData.shortPassages : activeTopic.shortPassages,
        quizQuestions: importParsedData.quizQuestions.length > 0 ? importParsedData.quizQuestions : activeTopic.quizQuestions
      };
      onUpdateTopic(updated);
      showSuccess(`បានបញ្ចូលទិន្នន័យពី Excel ទៅកាន់ "${activeTopic.name}" ដោយជោគជ័យ!`);
    }

    setIsImportModalOpen(false);
    setImportFile(null);
    setImportParsedData(null);
  };

  // ==================== DIFFICULT WORDS ACTIONS ====================
  const handleOpenAddWord = () => {
    playClickSound();
    setEditingWordIdx(null);
    setWordInput('');
    setWordTypeInput('នាម');
    setPartsInput('');
    setDefInput('');
    setExampleInput('');
    setIsWordModalOpen(true);
  };

  const handleOpenEditWord = (w: WordItem, idx: number) => {
    playClickSound();
    setEditingWordIdx(idx);
    setWordInput(w.word);
    setWordTypeInput(w.wordType || 'នាម');
    setPartsInput(w.parts ? w.parts.join(', ') : '');
    setDefInput(w.definition || '');
    setExampleInput(w.example || '');
    setIsWordModalOpen(true);
  };

  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!wordInput.trim()) {
      showError('សូមបញ្ចូលពាក្យ!');
      return;
    }

    const wordVal = wordInput.trim();
    const typeVal = wordTypeInput.trim() || 'នាម';
    const partsVal = partsInput.trim() 
      ? partsInput.split(',').map(p => p.trim()).filter(Boolean) 
      : splitKhmerWord(wordVal);
    const defVal = defInput.trim() || `ពាក្យខ្មែរប្រភេទ${typeVal}`;
    const exVal = exampleInput.trim() || `ខ្ញុំស្គាល់ពាក្យ ${wordVal}។`;

    const item: WordItem = {
      word: wordVal,
      wordType: typeVal,
      parts: partsVal,
      definition: defVal,
      example: exVal
    };

    const newWords = [...activeTopic.difficultWords];
    if (editingWordIdx !== null) {
      newWords[editingWordIdx] = item;
      showSuccess(`បានកែប្រែពាក្យ "${wordVal}" ដោយជោគជ័យ!`);
    } else {
      newWords.unshift(item);
      showSuccess(`បានបញ្ចូលពាក្យថ្មី "${wordVal}" ទៅកាន់ "${activeTopic.name}"!`);
    }

    onUpdateTopic({
      ...activeTopic,
      difficultWords: newWords
    });

    setIsWordModalOpen(false);
  };

  const handleDeleteWord = (idx: number) => {
    playClickSound();
    const targetWord = activeTopic.difficultWords[idx]?.word;
    const newWords = activeTopic.difficultWords.filter((_, i) => i !== idx);
    onUpdateTopic({
      ...activeTopic,
      difficultWords: newWords
    });
    showSuccess(`បានលុបពាក្យ "${targetWord}" ដោយជោគជ័យ!`);
  };

  // AI Words Generator
  const handleAiGenerate = async (topicStr: string) => {
    if (!topicStr.trim()) return;
    playClickSound();
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicStr.trim() })
      });
      if (!res.ok) throw new Error('បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ AI');
      const data: WordItem[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        onUpdateTopic({
          ...activeTopic,
          difficultWords: [...data, ...activeTopic.difficultWords]
        });
        showSuccess(`AI បានបង្កើតពាក្យចំនួន ${data.length} ដោយជោគជ័យ!`);
      }
    } catch (err: any) {
      showError(err.message || 'មានបញ្ហាក្នុងការបង្កើតពាក្យ AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  // ==================== ANTONYMS ACTIONS (ពាក្យផ្ទុយ) ====================
  const handleOpenAddAntonym = () => {
    playClickSound();
    setEditingAntonymIdx(null);
    setAntonymWord1Input('');
    setAntonymWord2Input('');
    setAntonymTypeInput('ពាក្យផ្ទុយ');
    setAntonymDefInput('');
    setAntonymExInput('');
    setIsAntonymModalOpen(true);
  };

  const handleOpenEditAntonym = (item: WordItem, idx: number) => {
    playClickSound();
    setEditingAntonymIdx(idx);
    const antonymSepRegex = /\s*(?:≠|=\/|\/=|!=|><|<>|\\neq)\s*/;
    if (antonymSepRegex.test(item.word)) {
      const [w1, w2] = item.word.split(antonymSepRegex).map(s => s.trim());
      setAntonymWord1Input(w1 || '');
      setAntonymWord2Input(w2 || '');
    } else {
      setAntonymWord1Input(item.word);
      setAntonymWord2Input('');
    }
    setAntonymTypeInput(item.wordType || 'ពាក្យផ្ទុយ');
    setAntonymDefInput(item.definition || '');
    setAntonymExInput(item.example || '');
    setIsAntonymModalOpen(true);
  };

  const handleSaveAntonym = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    const w1 = antonymWord1Input.trim();
    const w2 = antonymWord2Input.trim();

    if (!w1) {
      showError('សូមបញ្ចូលពាក្យទី១!');
      return;
    }

    const typeVal = antonymTypeInput.trim() || 'ពាក្យផ្ទុយ';
    const pairWord = w2 ? `${w1} ≠ ${w2}` : w1;
    const parts = w2 ? [w1, '≠', w2] : splitKhmerWord(w1);
    const defVal = antonymDefInput.trim() || (w2 ? `${w1} ផ្ទុយនឹង ${w2}` : 'ពាក្យផ្ទុយ');
    const exVal = antonymExInput.trim() || (w2 ? `${w1} ផ្ទុយនឹង ${w2}` : '');

    const item1: WordItem = {
      word: pairWord,
      wordType: typeVal,
      parts,
      definition: defVal,
      example: exVal
    };

    const currentAntonyms = [...(activeTopic.antonymWords || [])];

    if (editingAntonymIdx !== null) {
      currentAntonyms[editingAntonymIdx] = item1;
      showSuccess(`បានកែប្រែពាក្យផ្ទុយ "${pairWord}" ដោយជោគជ័យ!`);
    } else {
      currentAntonyms.unshift(item1);
      showSuccess(`បានបញ្ចូលពាក្យផ្ទុយ "${pairWord}" ទៅកាន់ "${activeTopic.name}"!`);
    }

    onUpdateTopic({
      ...activeTopic,
      antonymWords: currentAntonyms
    });

    setIsAntonymModalOpen(false);
  };

  const handleDeleteAntonym = (idx: number) => {
    playClickSound();
    const currentAntonyms = activeTopic.antonymWords || [];
    const targetWord = currentAntonyms[idx]?.word;
    const newAntonyms = currentAntonyms.filter((_, i) => i !== idx);
    onUpdateTopic({
      ...activeTopic,
      antonymWords: newAntonyms
    });
    showSuccess(`បានលុបពាក្យផ្ទុយ "${targetWord}" ដោយជោគជ័យ!`);
  };

  // ==================== SHORT PASSAGES ACTIONS ====================
  const handleOpenAddPassage = () => {
    playClickSound();
    setEditingPassageIdx(null);
    setPassageCategoryInput('អត្ថបទខ្លី ៖ អំណាន');
    setPassageTextInput('');
    setIsPassageModalOpen(true);
  };

  const handleOpenEditPassage = (p: WordItem, idx: number) => {
    playClickSound();
    setEditingPassageIdx(idx);
    setPassageCategoryInput(p.wordType || 'អត្ថបទខ្លី');
    setPassageTextInput(p.word);
    setIsPassageModalOpen(true);
  };

  const handleSavePassage = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!passageTextInput.trim()) {
      showError('សូមបញ្ចូលអត្ថបទ ឬល្បះអំណាន!');
      return;
    }

    const rawText = passageTextInput.trim();
    const cat = passageCategoryInput.trim() || 'អត្ថបទខ្លី';

    const sentences = rawText
      .split(/(?:[។\n\r]+)/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const itemsToAdd: WordItem[] = (sentences.length > 0 ? sentences : [rawText]).map(s => {
      const spaceWords = s.split(/\s+/).filter(Boolean);
      return {
        word: s,
        wordType: cat.startsWith('អត្ថបទ') ? cat : `អត្ថបទខ្លី ៖ ${cat}`,
        parts: spaceWords.length > 1 ? spaceWords : splitKhmerWord(s),
        definition: `ល្បះអំណាន ៖ ${cat}`,
        example: s
      };
    });

    const newPassages = [...activeTopic.shortPassages];
    if (editingPassageIdx !== null) {
      newPassages[editingPassageIdx] = itemsToAdd[0];
      showSuccess('បានកែប្រែអត្ថបទខ្លីដោយជោគជ័យ!');
    } else {
      newPassages.unshift(...itemsToAdd);
      showSuccess(`បានបញ្ចូលអត្ថបទខ្លី ${itemsToAdd.length} ល្បះដោយជោគជ័យ!`);
    }

    onUpdateTopic({
      ...activeTopic,
      shortPassages: newPassages
    });

    setIsPassageModalOpen(false);
  };

  const handleDeletePassage = (idx: number) => {
    playClickSound();
    const newPassages = activeTopic.shortPassages.filter((_, i) => i !== idx);
    onUpdateTopic({
      ...activeTopic,
      shortPassages: newPassages
    });
    showSuccess('បានលុបអត្ថបទខ្លីដោយជោគជ័យ!');
  };

  // ==================== QUIZ ACTIONS ====================
  const handleOpenAddQuiz = () => {
    playClickSound();
    setEditingQuizIdx(null);
    setQuizQuestionInput('');
    setQuizOptionsInput(['', '', '', '']);
    setQuizAnswerIdxInput(0);
    setQuizExplanationInput('');
    setIsQuizModalOpen(true);
  };

  const handleOpenEditQuiz = (q: QuizQuestion, idx: number) => {
    playClickSound();
    setEditingQuizIdx(idx);
    setQuizQuestionInput(q.question);
    const opts = [...q.options];
    while (opts.length < 4) opts.push('');
    setQuizOptionsInput(opts);
    setQuizAnswerIdxInput(q.answerIndex || 0);
    setQuizExplanationInput(q.explanation || '');
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!quizQuestionInput.trim()) {
      showError('សូមបញ្ចូលសំណួរ!');
      return;
    }
    const cleanOpts = quizOptionsInput.map(o => o.trim()).filter(Boolean);
    if (cleanOpts.length < 2) {
      showError('សូមបំពេញយ៉ាងហោចណាស់ ២ ជម្រើស!');
      return;
    }

    const item: QuizQuestion = {
      question: quizQuestionInput.trim(),
      options: cleanOpts,
      answerIndex: Math.min(quizAnswerIdxInput, cleanOpts.length - 1),
      explanation: quizExplanationInput.trim()
    };

    const newQuiz = [...activeTopic.quizQuestions];
    if (editingQuizIdx !== null) {
      newQuiz[editingQuizIdx] = item;
      showSuccess('បានកែប្រែសំណួរពហុជម្រើសដោយជោគជ័យ!');
    } else {
      newQuiz.unshift(item);
      showSuccess(`បានបញ្ចូលសំណួរថ្មីទៅកាន់ "${activeTopic.name}"!`);
    }

    onUpdateTopic({
      ...activeTopic,
      quizQuestions: newQuiz
    });

    setIsQuizModalOpen(false);
  };

  const handleDeleteQuiz = (idx: number) => {
    playClickSound();
    const newQuiz = activeTopic.quizQuestions.filter((_, i) => i !== idx);
    onUpdateTopic({
      ...activeTopic,
      quizQuestions: newQuiz
    });
    showSuccess('បានលុបសំណួរដោយជោគជ័យ!');
  };

  // Filtered lists for rendering
  const filteredWords = React.useMemo(() => {
    return activeTopic.difficultWords.filter(w => {
      const matchSearch = !wordSearch || w.word.includes(wordSearch) || (w.definition && w.definition.includes(wordSearch));
      const matchType = wordTypeFilter === 'ទាំងអស់' || w.wordType === wordTypeFilter;
      return matchSearch && matchType;
    });
  }, [activeTopic.difficultWords, wordSearch, wordTypeFilter]);

  const uniqueWordTypes = React.useMemo(() => {
    const s = new Set<string>();
    activeTopic.difficultWords.forEach(w => {
      if (w.wordType) s.add(w.wordType);
    });
    return Array.from(s);
  }, [activeTopic.difficultWords]);

  const filteredPassages = React.useMemo(() => {
    return activeTopic.shortPassages.filter(p => {
      return !passageSearch || p.word.includes(passageSearch) || (p.wordType && p.wordType.includes(passageSearch));
    });
  }, [activeTopic.shortPassages, passageSearch]);

  const filteredAntonyms = React.useMemo(() => {
    const list = activeTopic.antonymWords || [];
    return list.filter(w => {
      return !antonymSearch || w.word.includes(antonymSearch) || (w.definition && w.definition.includes(antonymSearch)) || (w.example && w.example.includes(antonymSearch));
    });
  }, [activeTopic.antonymWords, antonymSearch]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans max-w-6xl mx-auto">
      {/* Top Notification Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-semibold text-sm"
          >
            <CheckCircle2 size={20} className="shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-semibold text-sm"
          >
            <AlertCircle size={20} className="shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { playClickSound(); onBack(); }}
            id="btn-back-dashboard"
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center"
            title="ត្រឡប់ទៅផ្ទាំងដើម"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span>គ្រប់គ្រងប្រធានបទមេរៀន</span>
              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                Excel 4-Sheet System
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              រៀបចំប្រធានបទ បញ្ចូលពាក្យពិបាក ពាក្យផ្ទុយ អត្ថបទខ្លី និងសំណួរពហុជម្រើសដាច់ដោយឡែកពីគ្នា
            </p>
          </div>
        </div>

        {/* Quick Active Topic Badge */}
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">ប្រធានបទសកម្ម ៖</span>
          <span className="text-sm font-bold text-indigo-600 max-w-[200px] truncate" title={activeTopic.name}>
            {activeTopic.name}
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl mb-8">
        <button
          onClick={() => { playClickSound(); setActiveTab('topics'); }}
          id="tab-topics"
          className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'topics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers size={18} className={activeTab === 'topics' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>ប្រធានបទ ({topics.length})</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('words'); }}
          id="tab-words"
          className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'words'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BookOpen size={18} className={activeTab === 'words' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>ពាក្យពិបាក ({activeTopic.difficultWords.length})</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('antonyms'); }}
          id="tab-antonyms"
          className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'antonyms'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <RefreshCw size={18} className={activeTab === 'antonyms' ? 'text-amber-600' : 'text-slate-400'} />
          <span>ពាក្យផ្ទុយ ({(activeTopic.antonymWords || []).length})</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('passages'); }}
          id="tab-passages"
          className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'passages'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText size={18} className={activeTab === 'passages' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>អត្ថបទខ្លី ({activeTopic.shortPassages.length})</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('quiz'); }}
          id="tab-quiz"
          className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <HelpCircle size={18} className={activeTab === 'quiz' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>សំណួរ ({activeTopic.quizQuestions.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL TOPICS LIST & EXCEL ACTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          {/* Action Ribbon */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreateTopic}
                id="btn-create-topic"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <FolderPlus size={18} />
                <span>បង្កើតប្រធានបទថ្មី</span>
              </button>

              <button
                onClick={() => { playClickSound(); setIsImportModalOpen(true); }}
                id="btn-import-excel-modal"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet size={18} />
                <span>បញ្ចូល Excel (៣ Sheet)</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playClickSound();
                  downloadMultiSheetTemplate(activeTopic.name || 'គំរូប្រធានបទ');
                  showSuccess('បានទាញយកទម្រង់គំរូ Excel (៣ Sheet) ដោយជោគជ័យ!');
                }}
                id="btn-download-excel-template"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                title="ទាញយកទម្រង់ Excel ដែលមាន Sheet ពាក្យពិបាក, អត្ថបទខ្លី, និងសំណួរពហុជម្រើស"
              >
                <Download size={16} />
                <span>ទាញយកទម្រង់គំរូ Excel</span>
              </button>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((t) => {
              const isActive = t.id === activeTopicId;
              return (
                <div
                  key={t.id}
                  id={`topic-card-${t.id}`}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                    isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <Check size={13} strokeWidth={3} />
                      <span>កំពុងលេង</span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 pr-16 mb-1.5 leading-snug">
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {t.description || 'គ្មានការពិពណ៌នា'}
                    </p>

                    {/* Stats pills */}
                    <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-slate-50 rounded-2xl mb-5 text-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-indigo-600">{t.difficultWords.length}</span>
                        <span className="text-[9px] text-slate-500 font-medium">ពិបាក</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200/60">
                        <span className="text-xs font-extrabold text-amber-600">{(t.antonymWords || []).length}</span>
                        <span className="text-[9px] text-slate-500 font-medium">ផ្ទុយ</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200/60">
                        <span className="text-xs font-extrabold text-emerald-600">{t.shortPassages.length}</span>
                        <span className="text-[9px] text-slate-500 font-medium">អត្ថបទ</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200/60">
                        <span className="text-xs font-extrabold text-purple-600">{t.quizQuestions.length}</span>
                        <span className="text-[9px] text-slate-500 font-medium">MCQ</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        playClickSound();
                        onSelectTopic(t.id);
                        showSuccess(`បានជ្រើសរើស "${t.name}" សម្រាប់លេងក្នុងល្បែងទាំងអស់!`);
                      }}
                      id={`btn-select-topic-${t.id}`}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      <span>{isActive ? 'ប្រធានបទសកម្ម (Active)' : 'ជ្រើសរើសលេងប្រធានបទនេះ'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          playClickSound();
                          exportTopicToMultiSheetExcel(t);
                          showSuccess(`បាននាំចេញ "${t.name}" ជា Excel ៤ Sheet ដោយជោគជ័យ!`);
                        }}
                        id={`btn-export-topic-${t.id}`}
                        className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="នាំចេញជា Excel ៤ Sheet"
                      >
                        <Download size={14} />
                        <span>ទាញយក Excel</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditTopic(t)}
                        id={`btn-edit-topic-${t.id}`}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer"
                        title="កែសម្រួលឈ្មោះ"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => handleDuplicateTopic(t)}
                        id={`btn-duplicate-topic-${t.id}`}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer"
                        title="ចម្លងស្ទួន"
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        onClick={() => handleRequestDeleteTopic(t)}
                        id={`btn-delete-topic-${t.id}`}
                        disabled={topics.length <= 1}
                        className={`p-2 rounded-lg transition-all ${
                          topics.length <= 1
                            ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer'
                        }`}
                        title={topics.length <= 1 ? 'មិនអាចលុបប្រធានបទចុងក្រោយបានទេ' : 'លុបប្រធានបទ'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIFFICULT WORDS (ពាក្យពិបាក) */}
      {/* ========================================================================= */}
      {activeTab === 'words' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">ប្រធានបទសកម្ម</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeTopic.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ពាក្យពិបាកសរុប ៖ {activeTopic.difficultWords.length} ពាក្យ (ប្រើក្នុងល្បែងផ្គុំពាក្យ បើកកាត ស្វែងរកពាក្យ...)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddWord}
                id="btn-add-word"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} />
                <span>បន្ថែមពាក្យពិបាកថ្មី</span>
              </button>
            </div>
          </div>

          {/* AI Generator Box */}
          <div className="bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-purple-50/70 p-5 rounded-3xl border border-indigo-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">បង្កើតពាក្យពិបាកដោយស្វ័យប្រវត្តជាមួយ AI</h4>
                <p className="text-xs text-slate-500">បញ្ចូលប្រធានបទដើម្បីឲ្យ AI បង្កើតពាក្យខ្មែរ និយមន័យ និងឧទាហរណ៍ដោយស្វ័យប្រវត្តិ</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={aiTopicInput}
                onChange={(e) => setAiTopicInput(e.target.value)}
                placeholder="ឧ. សត្វព្រៃ, ផ្លែឈើ..."
                className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-indigo-500 w-full sm:w-48"
              />
              <button
                onClick={() => handleAiGenerate(aiTopicInput || activeTopic.name)}
                disabled={isAiLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isAiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{isAiLoading ? 'កំពុងបង្កើត...' : 'បង្កើត'}</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={wordSearch}
                onChange={(e) => setWordSearch(e.target.value)}
                placeholder="ស្វែងរកពាក្យពិបាក..."
                className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200/80 text-sm focus:outline-indigo-500 font-medium"
              />
            </div>
            {uniqueWordTypes.length > 0 && (
              <select
                value={wordTypeFilter}
                onChange={(e) => setWordTypeFilter(e.target.value)}
                className="px-4 py-3 bg-white rounded-2xl border border-slate-200/80 text-sm font-semibold focus:outline-indigo-500 text-slate-700"
              >
                <option value="ទាំងអស់">ប្រភេទពាក្យទាំងអស់</option>
                {uniqueWordTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          {/* Words List */}
          {filteredWords.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">មិនទាន់មានពាក្យពិបាកក្នុងប្រធានបទនេះនៅឡើយទេ</h3>
              <p className="text-xs text-slate-400 mb-4">អ្នកអាចចុច "បន្ថែមពាក្យពិបាកថ្មី" ឬបញ្ចូលតាមរយៈឯកសារ Excel</p>
              <button
                onClick={handleOpenAddWord}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                បន្ថែមពាក្យដំបូង
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWords.map((item, idx) => {
                const originalIndex = activeTopic.difficultWords.findIndex(w => w.word === item.word);
                return (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-black text-slate-900">{item.word}</h4>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                            {item.wordType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditWord(item, originalIndex)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                            title="កែសម្រួល"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteWord(originalIndex)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="លុប"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Parts Breakdown */}
                      {item.parts && item.parts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="text-[11px] text-slate-400 font-medium">បំបែកអក្សរ ៖</span>
                          {item.parts.map((p, pIdx) => (
                            <span key={pIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Definition & Example */}
                      {item.definition && (
                        <p className="text-xs text-slate-600 mb-1 leading-relaxed">
                          <span className="font-semibold text-slate-700">និយមន័យ ៖</span> {item.definition}
                        </p>
                      )}
                      {item.example && (
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          <span className="font-semibold text-slate-600 not-italic">ឧទាហរណ៍ ៖</span> "{item.example}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANTONYM WORDS (ពាក្យផ្ទុយ) */}
      {/* ========================================================================= */}
      {activeTab === 'antonyms' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">ប្រធានបទសកម្ម</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeTopic.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ពាក្យផ្ទុយសរុប ៖ {(activeTopic.antonymWords || []).length} ពាក្យ (ប្រើក្នុងបណ្ណពាក្យ Flashcards, ផ្គូផ្គង និងល្បែងពាក្យផ្ទុយ)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddAntonym}
                id="btn-add-antonym"
                className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} />
                <span>បន្ថែមពាក្យផ្ទុយថ្មី</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={antonymSearch}
              onChange={(e) => setAntonymSearch(e.target.value)}
              placeholder="ស្វែងរកពាក្យផ្ទុយ..."
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200/80 text-sm focus:outline-amber-500 font-medium"
            />
          </div>

          {/* Antonyms List */}
          {filteredAntonyms.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <RefreshCw size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">មិនទាន់មានពាក្យផ្ទុយក្នុងប្រធានបទនេះនៅឡើយទេ</h3>
              <p className="text-xs text-slate-400 mb-4">អ្នកអាចចុច "បន្ថែមពាក្យផ្ទុយថ្មី" ឬបញ្ចូលតាមរយៈឯកសារ Excel (Sheet 2: ពាក្យផ្ទុយ)</p>
              <button
                onClick={handleOpenAddAntonym}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
              >
                បន្ថែមពាក្យផ្ទុយដំបូង
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAntonyms.map((item, idx) => {
                const currentAntonyms = activeTopic.antonymWords || [];
                const originalIndex = currentAntonyms.findIndex(w => w.word === item.word);
                return (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(() => {
                            const antonymSepRegex = /\s*(?:≠|=\/|\/=|!=|><|<>|\\neq)\s*/;
                            if (antonymSepRegex.test(item.word)) {
                              const [w1, w2] = item.word.split(antonymSepRegex).map(s => s.trim());
                              return (
                                <div className="flex items-center gap-2 bg-amber-50/60 px-3 py-1 rounded-xl border border-amber-200/60">
                                  <span className="text-lg font-black text-amber-900">{w1}</span>
                                  <span className="text-rose-500 font-black text-base select-none inline-flex items-center">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="4" y1="8" x2="20" y2="8" />
                                      <line x1="4" y1="16" x2="20" y2="16" />
                                      <line x1="18" y1="3" x2="6" y2="21" />
                                    </svg>
                                  </span>
                                  <span className="text-lg font-black text-amber-900">{w2}</span>
                                </div>
                              );
                            }
                            return <h4 className="text-xl font-black text-slate-900">{item.word}</h4>;
                          })()}
                          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                            {item.wordType || 'ពាក្យផ្ទុយ'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditAntonym(item, originalIndex)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-all"
                            title="កែសម្រួល"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteAntonym(originalIndex)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="លុប"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Parts Breakdown */}
                      {item.parts && item.parts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="text-[11px] text-slate-400 font-medium">បំបែកអក្សរ ៖</span>
                          {item.parts.map((p, pIdx) => (
                            <span key={pIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Definition & Example */}
                      {item.definition && (
                        <p className="text-xs text-slate-600 mb-1 leading-relaxed">
                          <span className="font-semibold text-slate-700">{item.definition.startsWith('ផ្ទុយនឹង') ? '' : 'និយមន័យ ៖ '}</span>
                          {item.definition}
                        </p>
                      )}
                      {item.example && (
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          <span className="font-semibold text-slate-600 not-italic">ឧទាហរណ៍ ៖</span> "{item.example}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHORT PASSAGES (អត្ថបទខ្លី) */}
      {/* ========================================================================= */}
      {activeTab === 'passages' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">ប្រធានបទសកម្ម</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeTopic.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                អត្ថបទខ្លី/ល្បះអំណានសរុប ៖ {activeTopic.shortPassages.length} ល្បះ
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddPassage}
                id="btn-add-passage"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} />
                <span>បន្ថែមអត្ថបទខ្លីថ្មី</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={passageSearch}
              onChange={(e) => setPassageSearch(e.target.value)}
              placeholder="ស្វែងរកអត្ថបទខ្លី..."
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200/80 text-sm focus:outline-emerald-500 font-medium"
            />
          </div>

          {/* Passages List */}
          {filteredPassages.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <FileText size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">មិនទាន់មានអត្ថបទខ្លីក្នុងប្រធានបទនេះនៅឡើយទេ</h3>
              <p className="text-xs text-slate-400 mb-4">អ្នកអាចចុច "បន្ថែមអត្ថបទខ្លីថ្មី" ឬបញ្ចូលតាមរយៈឯកសារ Excel (Sheet 2: អត្ថបទខ្លី)</p>
              <button
                onClick={handleOpenAddPassage}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                បន្ថែមអត្ថបទខ្លី
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPassages.map((item, idx) => {
                const originalIndex = activeTopic.shortPassages.findIndex(p => p.word === item.word);
                return (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                          {item.wordType || 'អត្ថបទខ្លី'}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-800 leading-relaxed">
                        {item.word}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenEditPassage(item, originalIndex)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                        title="កែសម្រួល"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePassage(originalIndex)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                        title="លុប"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: QUIZ QUESTIONS (សំណួរពហុជម្រើស) */}
      {/* ========================================================================= */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">ប្រធានបទសកម្ម</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeTopic.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                សំណួរពហុជម្រើសសរុប ៖ {activeTopic.quizQuestions.length} សំណួរ (ប្រើក្នុងល្បែងសំណួរពហុជម្រើស Quiz)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddQuiz}
                id="btn-add-quiz"
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} />
                <span>បន្ថែមសំណួរពហុជម្រើសថ្មី</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          {activeTopic.quizQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <HelpCircle size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">មិនទាន់មានសំណួរពហុជម្រើសក្នុងប្រធានបទនេះនៅឡើយទេ</h3>
              <p className="text-xs text-slate-400 mb-4">អ្នកអាចចុច "បន្ថែមសំណួរពហុជម្រើសថ្មី" ឬបញ្ចូលតាមរយៈឯកសារ Excel (Sheet 3: សំណួរពហុជម្រើស)</p>
              <button
                onClick={handleOpenAddQuiz}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
              >
                បន្ថែមសំណួរដំបូង
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTopic.quizQuestions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {qIdx + 1}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditQuiz(q, qIdx)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                        title="កែសម្រួលសំណួរ"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(qIdx)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                        title="លុបសំណួរ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.answerIndex;
                      const labels = ['ក', 'ខ', 'គ', 'ឃ'];
                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400/40'
                              : 'bg-slate-50 border-slate-200/70 text-slate-700'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {labels[optIdx] || optIdx + 1}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
                              ចម្លើយត្រូវ ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2">
                      <Info size={15} className="text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">ការពន្យល់ ៖ </span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT TOPIC */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isTopicModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {editingTopicId ? 'កែសម្រួលប្រធានបទ' : 'បង្កើតប្រធានបទថ្មី'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                កំណត់ឈ្មោះ និងការពិពណ៌នាសម្រាប់ប្រធានបទមេរៀន
              </p>

              <form onSubmit={handleSaveTopic} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ឈ្មោះប្រធានបទ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={topicNameInput}
                    onChange={(e) => setTopicNameInput(e.target.value)}
                    placeholder="ឧ. មេរៀនទី១ ៖ សត្វព្រៃ និងធម្មជាតិ"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ការពិពណ៌នា (ស្រេចចិត្ត)
                  </label>
                  <textarea
                    value={topicDescInput}
                    onChange={(e) => setTopicDescInput(e.target.value)}
                    placeholder="ឧ. មេរៀនអំពីសត្វព្រៃ រុក្ខជាតិ និងបរិស្ថានរស់នៅ..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTopicModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: IMPORT EXCEL (MULTI-SHEET) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                    បញ្ចូលទិន្នន័យពី Excel (៣ Sheet)
                  </h3>
                  <p className="text-xs text-slate-500">
                    បញ្ចូលឯកសារ Excel ដែលមាន Sheet: ពាក្យពិបាក, អត្ថបទខ្លី, និងសំណួរពហុជម្រើស ក្នុង file តែមួយ
                  </p>
                </div>
                <button
                  onClick={() => {
                    downloadMultiSheetTemplate();
                    showSuccess('បានទាញយកទម្រង់គំរូ Excel!');
                  }}
                  className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                  title="ទាញយកទម្រង់គំរូ"
                >
                  <Download size={14} />
                  <span>ទម្រង់គំរូ</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-8 text-center transition-all bg-slate-50/50 mb-6">
                <input
                  type="file"
                  id="excel-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="excel-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet size={28} />
                  </div>
                  <span className="text-sm font-bold text-slate-800 mb-1">
                    {importFile ? importFile.name : 'ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ Excel (.xlsx)'}
                  </span>
                  <span className="text-xs text-slate-400">
                    គាំទ្រ .xlsx ដែលមាន ៣ Sheet ឬ .csv
                  </span>
                </label>
              </div>

              {/* Parsing Progress */}
              {isParsingExcel && (
                <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-3 text-indigo-700 text-xs font-bold mb-4">
                  <RefreshCw size={16} className="animate-spin" />
                  <span>កំពុងអានទិន្នន័យពី Excel Worksheet នីមួយៗ...</span>
                </div>
              )}

              {/* Parsed Summary Preview */}
              {importParsedData && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 mb-6">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-2">
                    លទ្ធផលអានបានពី Excel ៖
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-white rounded-xl shadow-2xs">
                      <span className="text-base font-extrabold text-indigo-600 block">
                        {importParsedData.difficultWords.length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">ពាក្យពិបាក</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-2xs">
                      <span className="text-base font-extrabold text-amber-600 block">
                        {(importParsedData.antonymWords || []).length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">ពាក្យផ្ទុយ</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-2xs">
                      <span className="text-base font-extrabold text-emerald-600 block">
                        {importParsedData.shortPassages.length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">អត្ថបទខ្លី</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-2xs">
                      <span className="text-base font-extrabold text-purple-600 block">
                        {importParsedData.quizQuestions.length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">សំណួរ MCQ</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Import Option */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ជម្រើសនៃការបញ្ចូល ៖
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportTargetMode('new')}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      importTargetMode === 'new'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block font-extrabold mb-0.5">បង្កើតជាប្រធានបទថ្មី</span>
                    <span className="text-[10px] font-normal text-slate-500">បង្កើតប្រធានបទថ្មីស្រឡាងដោយប្រើឈ្មោះឯកសារ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportTargetMode('current')}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      importTargetMode === 'current'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block font-extrabold mb-0.5">បញ្ចូលក្នុងប្រធានបទសកម្ម</span>
                    <span className="text-[10px] font-normal text-slate-500">បញ្ចូលទៅកាន់ "{activeTopic.name}"</span>
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                    setImportParsedData(null);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImportExcel}
                  disabled={!importParsedData}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  យល់ព្រមនាំចូល
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT DIFFICULT WORD */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isWordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {editingWordIdx !== null ? 'កែសម្រួលពាក្យពិបាក' : 'បន្ថែមពាក្យពិបាកថ្មី'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                បញ្ចូលទៅកាន់ប្រធានបទ ៖ <span className="font-bold text-indigo-600">{activeTopic.name}</span>
              </p>

              <form onSubmit={handleSaveWord} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ពាក្យពិបាក <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    placeholder="ឧ. សត្វដំរី"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ប្រភេទពាក្យ
                    </label>
                    <input
                      type="text"
                      value={wordTypeInput}
                      onChange={(e) => setWordTypeInput(e.target.value)}
                      placeholder="ឧ. នាម, កិរិយាសព្ទ..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      បំបែកអក្សរ (ក្បៀស)
                    </label>
                    <input
                      type="text"
                      value={partsInput}
                      onChange={(e) => setPartsInput(e.target.value)}
                      placeholder="ឧ. ដ, ំ, រ, ី"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    និយមន័យ (ស្រេចចិត្ត)
                  </label>
                  <input
                    type="text"
                    value={defInput}
                    onChange={(e) => setDefInput(e.target.value)}
                    placeholder="ឧ. សត្វចតុបាទមាឌធំ មានប្រមោយវែង..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ឧទាហរណ៍ប្រើប្រាស់ (ស្រេចចិត្ត)
                  </label>
                  <input
                    type="text"
                    value={exampleInput}
                    onChange={(e) => setExampleInput(e.target.value)}
                    placeholder="ឧ. ហ្វូងសត្វដំរីដើរកាត់ព្រៃជ្រៅ។"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsWordModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ANTONYM (ពាក្យផ្ទុយ) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAntonymModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {editingAntonymIdx !== null ? 'កែសម្រួលពាក្យផ្ទុយ' : 'បន្ថែមពាក្យផ្ទុយថ្មី'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                បញ្ចូលទៅកាន់ប្រធានបទ ៖ <span className="font-bold text-amber-600">{activeTopic.name}</span>
              </p>

              <form onSubmit={handleSaveAntonym} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ពាក្យទី១ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={antonymWord1Input}
                      onChange={(e) => setAntonymWord1Input(e.target.value)}
                      placeholder="ឧ. ខ្ពស់"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-amber-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {editingAntonymIdx !== null ? 'ពាក្យផ្ទុយគ្នានឹង' : 'ពាក្យទី២ (ផ្ទុយគ្នា)'}
                    </label>
                    <input
                      type="text"
                      value={antonymWord2Input}
                      onChange={(e) => setAntonymWord2Input(e.target.value)}
                      placeholder="ឧ. ទាប"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ប្រភេទពាក្យ
                  </label>
                  <input
                    type="text"
                    value={antonymTypeInput}
                    onChange={(e) => setAntonymTypeInput(e.target.value)}
                    placeholder="ឧ. គុណនាម / ពាក្យផ្ទុយ"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    និយមន័យ ឬការពន្យល់ (ស្រេចចិត្ត)
                  </label>
                  <textarea
                    value={antonymDefInput}
                    onChange={(e) => setAntonymDefInput(e.target.value)}
                    placeholder="ឧ. ផ្ទុយនឹង ៖ ទាប"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-amber-500 focus:bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ឧទាហរណ៍ប្រើប្រាស់ក្នុងប្រយោគ (ស្រេចចិត្ត)
                  </label>
                  <input
                    type="text"
                    value={antonymExInput}
                    onChange={(e) => setAntonymExInput(e.target.value)}
                    placeholder="ឧ. ដើមត្នោតនេះខ្ពស់ ឯដើមចេកនោះទាប។"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-amber-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAntonymModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SHORT PASSAGE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPassageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {editingPassageIdx !== null ? 'កែសម្រួលអត្ថបទខ្លី' : 'បន្ថែមអត្ថបទខ្លីថ្មី'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                បញ្ចូលទៅកាន់ប្រធានបទ ៖ <span className="font-bold text-emerald-600">{activeTopic.name}</span>
              </p>

              <form onSubmit={handleSavePassage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ចំណងជើង ឬប្រភេទអត្ថបទ
                  </label>
                  <input
                    type="text"
                    value={passageCategoryInput}
                    onChange={(e) => setPassageCategoryInput(e.target.value)}
                    placeholder="ឧ. អត្ថបទខ្លី ៖ រឿងកូនឆ្មាតូច"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    អត្ថបទខ្លី / ល្បះអំណាន <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={passageTextInput}
                    onChange={(e) => setPassageTextInput(e.target.value)}
                    placeholder="ឧ. កូនឆ្មាតូចរត់លេងលើវាលស្មៅពណ៌បៃតងយ៉ាងសប្បាយរីករាយ។"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-emerald-500 focus:bg-white resize-none"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ចំណាំ៖ ប្រសិនបើអ្នកបញ្ចូលអត្ថបទច្រើនល្បះដោយបំបែកដោយសញ្ញាខណ្ឌ (។) ប្រព័ន្ធនឹងបំបែកជាល្បះអំណានដោយស្វ័យប្រវត្តិ។
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPassageModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT QUIZ QUESTION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isQuizModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {editingQuizIdx !== null ? 'កែសម្រួលសំណួរពហុជម្រើស' : 'បន្ថែមសំណួរពហុជម្រើសថ្មី'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                បញ្ចូលទៅកាន់ប្រធានបទ ៖ <span className="font-bold text-purple-600">{activeTopic.name}</span>
              </p>

              <form onSubmit={handleSaveQuiz} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ខ្លឹមសារសំណួរ <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={quizQuestionInput}
                    onChange={(e) => setQuizQuestionInput(e.target.value)}
                    placeholder="ឧ. តើសត្វមួយណាជាសត្វចតុបាទស៊ីសាច់ជាអាហារ និងមានឆ្នូតខ្មៅលឿង?"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-purple-500 focus:bg-white resize-none"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
                    ជម្រើសចម្លើយទាំង ៤ (ជ្រើសរើសចម្លើយត្រឹមត្រូវ) <span className="text-rose-500">*</span>
                  </label>
                  {quizOptionsInput.map((opt, optIdx) => {
                    const isSelected = quizAnswerIdxInput === optIdx;
                    const labels = ['ក', 'ខ', 'គ', 'ឃ'];
                    return (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuizAnswerIdxInput(optIdx)}
                          className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title={isSelected ? 'ចម្លើយត្រូវ' : 'ចុចដើម្បីជ្រើសរើសជាចម្លើយត្រូវ'}
                        >
                          {labels[optIdx]}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...quizOptionsInput];
                            newOpts[optIdx] = e.target.value;
                            setQuizOptionsInput(newOpts);
                          }}
                          placeholder={`ជម្រើសទី ${labels[optIdx]}...`}
                          className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-purple-500 focus:bg-white ${
                            isSelected ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200'
                          }`}
                          required
                        />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ការពន្យល់បន្ថែម (ស្រេចចិត្ត)
                  </label>
                  <textarea
                    value={quizExplanationInput}
                    onChange={(e) => setQuizExplanationInput(e.target.value)}
                    placeholder="ឧ. សត្វខ្លា គឺជាសត្វចតុបាទស៊ីសាច់ជាអាហារ ដែលមានឆ្នូតរាងកាយពណ៌លឿងខ្មៅ..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-purple-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsQuizModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM DELETE TOPIC */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {topicToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center"
            >
              {/* Animated Warning Icon */}
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Trash2 size={32} className="animate-pulse" />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1.5">
                បញ្ជាក់ការលុបប្រធានបទ
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                តើអ្នកពិតជាចង់លុបប្រធានបទនេះចេញពីប្រព័ន្ធមែនទេ?
              </p>

              {/* Target Topic Details Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                    ប្រធានបទត្រូវលុប
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  {topicToDelete.name}
                </h4>

                {/* Topic counts breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60">
                  <div className="p-1.5 bg-white rounded-lg">
                    <span className="text-xs font-bold text-indigo-600 block">{topicToDelete.difficultWords.length}</span>
                    <span className="text-[10px] text-slate-400">ពាក្យពិបាក</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg">
                    <span className="text-xs font-bold text-emerald-600 block">{topicToDelete.shortPassages.length}</span>
                    <span className="text-[10px] text-slate-400">អត្ថបទខ្លី</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg">
                    <span className="text-xs font-bold text-purple-600 block">{topicToDelete.quizQuestions.length}</span>
                    <span className="text-[10px] text-slate-400">សំណួរ MCQ</span>
                  </div>
                </div>
              </div>

              {/* Warning note */}
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-left flex items-start gap-2.5 text-xs text-rose-800 font-medium mb-6 leading-relaxed">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span>
                  រាល់ទិន្នន័យពាក្យពិបាក អត្ថបទ និងសំណួរក្នុងប្រធានបទនេះ នឹងត្រូវលុបចេញជាអចិន្ត្រៃយ៍។
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setTopicToDelete(null);
                  }}
                  id="btn-cancel-delete-topic"
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTopic}
                  id="btn-confirm-delete-topic"
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>យល់ព្រមលុប</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
