import React from 'react';
import { ViewState } from '../types';
import { 
  Plus, 
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
  Gamepad2
} from 'lucide-react';
import { motion } from 'motion/react';
import { playClickSound } from '../utils/audio';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  wordCount: number;
}

export default function Dashboard({ onNavigate, wordCount }: DashboardProps) {
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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
      title: 'បញ្ចូលពាក្យ',
      subtitle: 'បន្ថែមបញ្ជីពាក្យថ្មីៗសម្រាប់កុមារ',
      icon: Plus,
      iconBoxBg: 'bg-indigo-50 text-indigo-500',
      badge: `${wordCount} ពាក្យ`
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
      subtitle: 'រៀនសរសេរនិងផ្គុំអក្សរវិទ្យា',
      icon: BookOpen,
      iconBoxBg: 'bg-cyan-50 text-cyan-500',
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
      id: 'spinner' as ViewState,
      title: 'កង់បង្វិលសំណាង',
      subtitle: 'ចាប់ឈ្មោះសិស្សដោយចៃដន្យ',
      icon: Disc,
      iconBoxBg: 'bg-emerald-50 text-emerald-500',
    },
    {
      id: 'flashcards' as ViewState,
      title: 'បណ្ណពាក្យ (A4)',
      subtitle: 'ទាញយកបណ្ណពាក្យ ៣ ស្មើគ្នាជា PDF',
      icon: Printer,
      iconBoxBg: 'bg-orange-50 text-orange-500',
    },
    {
      id: 'quiz' as ViewState,
      title: 'សំណួរពហុជម្រើស',
      subtitle: 'ជ្រើសរើសចម្លើយត្រឹមត្រូវ ១ ក្នុងចំណោម ៤',
      icon: CheckSquare,
      iconBoxBg: 'bg-purple-50 text-purple-500',
      badge: 'របៀបគ្រូ'
    },
    {
      id: 'math-finger' as ViewState,
      title: 'គិតលេខរហ័ស (Math Finger)',
      subtitle: 'លំហាត់អនុវត្តប្រឡងគិតលេខរហ័សដោយប្រើដៃ',
      icon: Calculator,
      iconBoxBg: 'bg-rose-50 text-rose-500',
      badge: 'ថ្មី (Math)'
    },
    {
      id: 'mystery-box' as ViewState,
      title: 'បើកប្រអប់សំណាង',
      subtitle: 'បើកប្រអប់អំណោយអមដោយចលនា និងសំឡេង ដើម្បីបង្ហាញពាក្យអាន',
      icon: Gift,
      iconBoxBg: 'bg-purple-100 text-purple-600',
      badge: 'ថ្មី (3D Box)'
    },
    {
      id: 'lucky-draw' as ViewState,
      title: 'ចាប់ពាក្យសំណាង',
      subtitle: 'ចាប់ពាក្យសំណាងរត់ឡើងចុះដូចម៉ាស៊ីន Lucky Draw',
      icon: Sparkles,
      iconBoxBg: 'bg-sky-50 text-sky-500',
    },
  ];

  const handleCardClick = (id: ViewState) => {
    playClickSound();
    onNavigate(id);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Top Action Buttons */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <button 
          onClick={toggleFullscreen}
          id="btn-fullscreen-toggle"
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full shadow-sm transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
          title={isFullscreen ? "បង្រួមអេក្រង់" : "ពេញអេក្រង់"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button 
          onClick={toggleSound}
          id="btn-sound-toggle"
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full shadow-sm transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6 shadow-xs"
        >
          <Sparkles size={15} className="text-amber-500 fill-amber-400" />
          <span>កម្មវិធីអប់រំ និងកម្សាន្តកុមារ</span>
        </motion.div>

        {/* Header Title */}
        <div className="text-center mb-14">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 select-none drop-shadow-xs font-sans"
          >
            ល្បែងសិក្សាសម្រាប់កុមារ
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            របកគំហើញថ្មីសម្រាប់ការអាន ស្គាល់អត្ថន័យ និងការសរសេរដៃតាមតម្រុយអក្សរសាស្ត្រខ្មែរយ៉ាងរហ័ស!
          </motion.p>
        </div>

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
                className="group cursor-pointer relative rounded-[28px] p-8 bg-white border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col items-center text-center"
              >
                {item.badge && (
                  <span className="absolute top-4 right-4 text-[11px] font-bold px-2.5 py-0.5 bg-slate-100 border border-slate-200/60 rounded-full text-slate-600">
                    {item.badge}
                  </span>
                )}
                
                {/* Icon Squircle Box */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${item.iconBoxBg} mb-5 transition-transform duration-300 group-hover:scale-110`}>
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
          ល្បែងសិក្សាខ្មែរ និងឧបករណ៍បង្រៀន © 2026
        </div>
      </div>
    </div>
  );
}
