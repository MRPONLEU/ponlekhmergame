import React from 'react';
import { ViewState, Topic } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  Disc, 
  Printer, 
  CheckSquare, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Calculator, 
  Gift,
  Gamepad2,
  Layers,
  ChevronDown,
  Download,
  Settings,
  Hand
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound } from '../utils/audio';
import { downloadMultiSheetTemplate } from '../utils/excelHelper';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  topics: Topic[];
  activeTopicId: string;
  onSelectTopic: (id: string) => void;
}

export default function Dashboard({
  onNavigate,
  topics,
  activeTopicId,
  onSelectTopic
}: DashboardProps) {
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = React.useState(false);

  const activeTopic = React.useMemo(() => {
    return topics.find(t => t.id === activeTopicId) || topics[0];
  }, [topics, activeTopicId]);

  const totalWords = activeTopic.difficultWords.length + activeTopic.shortPassages.length;

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    playClickSound();
  };

  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const menuItems = [
    {
      id: 'add-words' as ViewState,
      title: 'គ្រប់គ្រងប្រធានបទ & Excel',
      subtitle: 'បង្កើតប្រធានបទ បញ្ចូល និងទាញយក Excel ៣ Sheet (ពាក្យពិបាក អត្ថបទខ្លី សំណួរ)',
      icon: Layers,
      iconBoxBg: 'bg-indigo-50 text-indigo-600',
      badge: `${topics.length} ប្រធានបទ`,
      highlight: true
    },
    {
      id: 'mystery-box' as ViewState,
      title: 'បើកប្រអប់សំណាង',
      subtitle: 'បើកប្រអប់អំណោយអមដោយចលនា 3D សំឡេង និងពិន្ទុសំណាង',
      icon: Gift,
      iconBoxBg: 'bg-purple-100 text-purple-600',
      badge: 'កំពុងពេញនិយម'
    },
    {
      id: 'word-grab' as ViewState,
      title: 'ល្បែងចាប់ពាក្យ (AI Camera)',
      subtitle: 'លេងជាដៃគូ (សិស្សទី១ vs ទី២) ប្រើកាមេរ៉ាចាប់ចលនាដៃដណ្តើមចាប់ពាក្យ',
      icon: Hand,
      iconBoxBg: 'bg-cyan-100 text-cyan-700',
      badge: 'កាមេរ៉ា AI'
    },
    {
      id: 'quiz' as ViewState,
      title: 'សំណួរពហុជម្រើស',
      subtitle: 'ប្រឡងជ្រើសរើសចម្លើយត្រឹមត្រូវ ១ ក្នុងចំណោម ៤ តាមប្រធានបទសកម្ម',
      icon: CheckSquare,
      iconBoxBg: 'bg-purple-50 text-purple-500',
      badge: `${activeTopic.quizQuestions.length} សំណួរ`
    },
    {
      id: 'team-cards' as ViewState,
      title: 'ល្បែងបើកកាត',
      subtitle: 'ល្បែងប្រកួតជាក្រុម បើកកាតលេខដើម្បីឆ្លើយពាក្យខ្មែរ',
      icon: Gamepad2,
      iconBoxBg: 'bg-blue-50 text-blue-600',
      badge: 'លេងជាក្រុម'
    },
    {
      id: 'word-puzzle' as ViewState,
      title: 'ល្បែងផ្គុំពាក្យខ្មែរ',
      subtitle: 'រៀនសរសេរនិងផ្គុំអក្សរវិទ្យាពីបំណែកព្យាង្គ និងតួអក្សរ',
      icon: BookOpen,
      iconBoxBg: 'bg-cyan-50 text-cyan-500',
      badge: `${activeTopic.difficultWords.length} ពាក្យ`
    },
    {
      id: 'word-search' as ViewState,
      title: 'ល្បែងស្វែងរកពាក្យ',
      subtitle: 'ស្វែងរកពាក្យដែលលាក់ខ្លួនក្នុងតារាងអក្សរខ្វាត់ខ្វែង',
      icon: Sparkles,
      iconBoxBg: 'bg-amber-50 text-amber-500',
      badge: 'Worksheet'
    },
    {
      id: 'lucky-draw' as ViewState,
      title: 'ចាប់ពាក្យសំណាង',
      subtitle: 'ចាប់ពាក្យសំណាងរត់ឡើងចុះដូចម៉ាស៊ីន Lucky Draw',
      icon: Sparkles,
      iconBoxBg: 'bg-sky-50 text-sky-500',
    },
    {
      id: 'spinner' as ViewState,
      title: 'កង់បង្វិលសំណាង',
      subtitle: 'ចាប់ឈ្មោះសិស្សដោយចៃដន្យសម្រាប់ឆ្លើយសំណួរ',
      icon: Disc,
      iconBoxBg: 'bg-emerald-50 text-emerald-500',
    },
    {
      id: 'flashcards' as ViewState,
      title: 'បណ្ណពាក្យ (A4)',
      subtitle: 'ទាញយកបណ្ណពាក្យ ៣ ស្មើគ្នាជា PDF សម្រាប់បោះពុម្ព',
      icon: Printer,
      iconBoxBg: 'bg-orange-50 text-orange-500',
    },
    {
      id: 'math-finger' as ViewState,
      title: 'គិតលេខរហ័ស (Math Finger)',
      subtitle: 'លំហាត់អនុវត្តប្រឡងគិតលេខរហ័សដោយប្រើដៃ',
      icon: Calculator,
      iconBoxBg: 'bg-rose-50 text-rose-500',
      badge: 'Math'
    },
  ];

  const handleCardClick = (id: ViewState) => {
    playClickSound();
    onNavigate(id);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Top Action Buttons */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <button 
          onClick={toggleFullscreen}
          id="btn-fullscreen-toggle"
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full shadow-xs transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
          title={isFullscreen ? "បង្រួមអេក្រង់" : "ពេញអេក្រង់"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button 
          onClick={toggleSound}
          id="btn-sound-toggle"
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full shadow-xs transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
          title={soundEnabled ? "បិទសំឡេង" : "បើកសំឡេង"}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col items-center">
        {/* Playful Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-4 shadow-2xs"
        >
          <Sparkles size={15} className="text-amber-500 fill-amber-400" />
          <span>កម្មវិធីអប់រំ និងកម្សាន្តកុមារ</span>
        </motion.div>

        {/* Header Title */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-3 select-none drop-shadow-2xs font-sans"
          >
            ល្បែងសិក្សាសម្រាប់កុមារ
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            ជ្រើសរើសប្រធានបទមេរៀន និងលេងល្បែងអប់រំដោយមិនលាយឡំប្រធានបទគ្នា!
          </motion.p>
        </div>

        {/* ========================================================= */}
        {/* PROMINENT TOPIC SELECTOR BANNER */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.04)] mb-10 relative z-30"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Topic Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Layers size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                    ប្រធានបទកំពុងលេង (Active Topic)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {activeTopic.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                  <span className="font-semibold text-indigo-600">📚 {activeTopic.difficultWords.length} ពាក្យពិបាក</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600">📖 {activeTopic.shortPassages.length} អត្ថបទខ្លី</span>
                  <span>•</span>
                  <span className="font-semibold text-purple-600">❓ {activeTopic.quizQuestions.length} សំណួរ MCQ</span>
                </div>
              </div>
            </div>

            {/* Quick Switch Dropdown & Manage Button */}
            <div className="flex items-center gap-2.5 self-start md:self-center relative">
              <div className="relative">
                <button
                  onClick={() => { playClickSound(); setIsTopicDropdownOpen(!isTopicDropdownOpen); }}
                  id="btn-quick-topic-switch"
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <span>ប្តូរប្រធានបទ ({topics.length})</span>
                  <ChevronDown size={16} className={`transition-transform ${isTopicDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isTopicDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 max-h-72 overflow-y-auto"
                    >
                      <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase">
                        ជ្រើសរើសប្រធានបទមេរៀន ៖
                      </div>
                      {topics.map((t) => {
                        const isCur = t.id === activeTopicId;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              playSuccessSound();
                              onSelectTopic(t.id);
                              setIsTopicDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              isCur
                                ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{t.name}</span>
                            {isCur && <span className="text-[10px] text-indigo-600 bg-white px-2 py-0.5 rounded-md shadow-2xs font-extrabold shrink-0">សកម្ម ✓</span>}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  onNavigate('add-words');
                }}
                id="btn-manage-topics"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Settings size={15} />
                <span>គ្រប់គ្រង & Excel</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 6+ Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.id}
                id={`menu-card-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => handleCardClick(item.id)}
                className={`group cursor-pointer relative rounded-[28px] p-8 bg-white border transition-all duration-300 flex flex-col items-center text-center shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] ${
                  item.highlight ? 'border-indigo-200 ring-2 ring-indigo-500/10' : 'border-slate-100'
                }`}
              >
                {item.badge && (
                  <span className={`absolute top-4 right-4 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.highlight ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
                
                {/* Icon Squircle Box */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${item.iconBoxBg} mb-5 transition-transform duration-300 group-hover:scale-110 shadow-2xs`}>
                  <IconComponent size={28} strokeWidth={2.2} />
                </div>

                {/* Card Title */}
                <h3 className="text-xl font-bold text-slate-800 mb-1.5 select-none group-hover:text-slate-900 transition-colors">
                  {item.title}
                </h3>

                {/* Card Subtitle */}
                <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed select-none">
                  {item.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Small Footer Credits */}
        <div className="mt-16 text-slate-400 text-xs text-center font-medium select-none">
          ល្បែងសិក្សាខ្មែរ និងឧបករណ៍បង្រៀនតាមប្រធានបទ Excel © 2026
        </div>
      </div>
    </div>
  );
}
