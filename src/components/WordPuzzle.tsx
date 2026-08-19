import React from 'react';
import { WordItem } from '../types';
import { 
  Home, 
  Clock, 
  ArrowDownUp, 
  Users, 
  Shrink,
  Settings,
  Award,
  RotateCcw,
  Check,
  HelpCircle,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound, playFailSound } from '../utils/audio';
import { isSentenceItem } from '../utils/khmerSplit';

const KHMER_DECOYS = ['្ង', 'ុំ', 'ម', 'ធ', 'ញ', 'ុ', 'ៀ', 'ា', 'យ', 'ោ', 'ទ', 'ែ', 'ក', 'ខ', 'ច', 'ឆ', 'ជ', 'ឈ', 'ញ', 'ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ', 'ត', 'ថ', 'ទ', 'ធ', 'ន', 'ប', 'ផ', 'ព', 'ភ', 'ម', 'យ', 'រ', 'ល', 'វ', 'ស', 'ហ', 'ឡ', 'អ', 'ា', 'ិ', 'ី', 'ឹ', 'ឺ', 'ុ', 'ូ', 'ួ', 'ើ', 'ឿ', 'ៀ', 'េ', 'ែ', 'ៃ', 'ោ', 'ៅ', 'ំ', 'ះ', 'ុំ', 'េំ', 'ុះ', 'េះ', 'ោះ'];

interface WordPuzzleProps {
  words: WordItem[];
  topicName?: string;
  onBack: () => void;
}

export default function WordPuzzle({ words, topicName, onBack }: WordPuzzleProps) {
  const [filterType, setFilterType] = React.useState('ទាំងអស់');

  const uniqueWordTypes = React.useMemo(() => {
    const types = new Set<string>();
    words.forEach(w => {
      if (w.wordType) types.add(w.wordType);
    });
    return ['ទាំងអស់', ...Array.from(types)];
  }, [words]);

  const activeWords = React.useMemo(() => {
    const wordList = filterType === 'ទាំងអស់' ? words : words.filter(w => w.wordType === filterType);
    const singleWords = wordList.filter(w => !isSentenceItem(w));
    return singleWords.length > 0 ? singleWords : wordList;
  }, [words, filterType]);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const currentWord = activeWords[currentIndex];

  const [difficulty, setDifficulty] = React.useState<'ងាយស្រួល' | 'មធ្យម' | 'លំបាក'>('មធ្យម');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const [pool, setPool] = React.useState<string[]>([]);
  const [assembled, setAssembled] = React.useState<string[]>([]);
  const [prefilledIndices, setPrefilledIndices] = React.useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    setCurrentIndex(0);
  }, [filterType]);

  const initPuzzle = React.useCallback(() => {
    if (!currentWord) return;
    const parts = [...currentWord.parts];
    const targetLength = Math.max(12, parts.length + 4); // Make sure we have at least 12 or parts+4 items in pool
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
      // Randomly select indices to prefill
      const indices = Array.from({ length: parts.length }, (_, i) => i);
      const shuffledIndices = indices.sort(() => Math.random() - 0.5);
      indicesToPrefill = shuffledIndices.slice(0, prefillCount);
      
      indicesToPrefill.forEach(idx => {
        initialAssembled[idx] = parts[idx];
        // Remove pre-filled chars from pool
        const poolIndex = combined.indexOf(parts[idx]);
        if (poolIndex > -1) {
           combined.splice(poolIndex, 1);
        }
      });
    }

    setPool(combined);
    setAssembled(initialAssembled);
    setPrefilledIndices(indicesToPrefill);
    
    const firstEmpty = initialAssembled.findIndex(x => x === '');
    setSelectedIndex(firstEmpty !== -1 ? firstEmpty : 0);
    setIsSuccess(false);
    setShowError(false);
  }, [currentIndex, currentWord, difficulty]);

  React.useEffect(() => {
    initPuzzle();
  }, [initPuzzle]);

  const handlePoolClick = (letter: string) => {
    if (isSuccess) return;
    playClickSound();
    
    if (selectedIndex < assembled.length) {
       const newAssembled = [...assembled];
       newAssembled[selectedIndex] = letter;
       setAssembled(newAssembled);
       
       let nextIndex = selectedIndex + 1;
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

  const handleBoxClick = (index: number) => {
    if (isSuccess || prefilledIndices.includes(index)) return;
    playClickSound();
    setSelectedIndex(index);
    setShowError(false);
  };

  const handleClear = () => {
    if (isSuccess) return;
    playClickSound();
    
    const initialAssembled = new Array(currentWord.parts.length).fill('');
    prefilledIndices.forEach(idx => {
       initialAssembled[idx] = currentWord.parts[idx];
    });
    setAssembled(initialAssembled);
    
    const firstEmpty = initialAssembled.findIndex(x => x === '');
    setSelectedIndex(firstEmpty !== -1 ? firstEmpty : 0);
    setShowError(false);
  };

  const handleCheck = () => {
    if (assembled.includes('')) {
      return; // Not fully filled
    }
    
    if (assembled.join('') === currentWord.parts.join('')) {
      playSuccessSound();
      setIsSuccess(true);
      setShowError(false);
      setSelectedIndex(-1); // Remove selection
    } else {
      playFailSound();
      setShowError(true);
    }
  };

  const handleNext = () => {
    playClickSound();
    setCurrentIndex((prev) => (prev + 1) % activeWords.length);
  };

  if (activeWords.length === 0) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <HelpCircle size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-700 font-bold mb-2">មិនមានពាក្យសិក្សានៅក្នុងបញ្ជីប្រភេទនេះទេ!</p>
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => { playClickSound(); setFilterType(e.target.value); }}
            className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
          >
            {uniqueWordTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => { playClickSound(); onBack(); }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            ត្រឡប់ទៅវិញ
          </button>
        </div>
      </div>
    );
  }

  const MenuButton = ({ icon, text, onClick }: { icon: React.ReactNode, text: string, onClick?: () => void }) => (
    <button onClick={() => { playClickSound(); onClick && onClick(); }} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm shadow-sm cursor-pointer">
      {icon}
      <span>{text}</span>
    </button>
  );

  return (
    <div className="h-screen w-full bg-[#F8FAFC] font-sans flex flex-col overflow-hidden">
      {/* Header Container */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between mx-4 md:mx-6 mt-4 md:mt-6 gap-4 shrink-0">
        {/* Left: Icon and Text */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1C60F4] rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
            <Award size={28} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#1E293B]">ល្បែងផ្គុំពាក្យខ្មែរ</h1>
            <p className="text-xs md:text-sm text-gray-500">បំពេញពាក្យ ស្រៈ និងជើងអក្សរក្នុងប្រអប់</p>
          </div>
        </div>
        
        {/* Right: Menu buttons */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
          <MenuButton icon={<Home size={16}/>} text="ទំព័រដើម" onClick={onBack} />
          <MenuButton icon={<Settings size={16}/>} text="ការកំណត់" onClick={() => setIsSettingsOpen(true)} />
        </div>
      </div>

      {/* Game Card */}
      <div className="bg-white rounded-[32px] mx-4 md:mx-6 my-4 md:my-6 p-4 md:p-8 shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
         
         {/* Boxes Area */}
         <div className="flex flex-wrap justify-center content-center gap-2 md:gap-3 flex-1 min-h-[120px] py-4">
           {assembled.map((char, idx) => {
             const isSelected = selectedIndex === idx;
             const isFilled = char !== '';
             const isPrefilled = prefilledIndices.includes(idx);
             
             let sizeClasses = "w-16 h-20 md:w-20 md:h-24 xl:w-28 xl:h-32 text-3xl md:text-4xl xl:text-5xl";
             if (assembled.length >= 12) {
               sizeClasses = "w-9 h-13 sm:w-11 sm:h-16 md:w-13 md:h-18 lg:w-15 lg:h-22 text-lg md:text-2xl lg:text-3xl";
             } else if (assembled.length >= 10) {
               sizeClasses = "w-10 h-14 md:w-14 md:h-18 lg:w-16 lg:h-20 xl:w-20 xl:h-24 text-xl md:text-2xl lg:text-3xl xl:text-4xl";
             } else if (assembled.length >= 8) {
               sizeClasses = "w-14 h-18 md:w-16 md:h-20 lg:w-20 lg:h-24 xl:w-24 xl:h-28 text-2xl md:text-3xl lg:text-4xl xl:text-5xl";
             }

             let boxClasses = `${sizeClasses} rounded-2xl flex items-center justify-center font-bold cursor-pointer transition-all duration-200 `;
             
             if (showError && isFilled && char !== currentWord.parts[idx]) {
               boxClasses += " bg-red-50 border-2 border-red-500 border-b-[6px] text-red-500 animate-shake";
             } else if (isSuccess || (isFilled && char === currentWord.parts[idx] && showError)) {
                 boxClasses += " bg-[#E8F5E9] border-2 border-[#4CAF50] border-b-[6px] text-[#4CAF50]";
             } else if (isFilled) {
               if (isPrefilled) {
                 boxClasses += " bg-white border-2 border-gray-200 border-b-[#1C60F4] border-b-[6px] text-[#1C60F4]";
               } else {
                 boxClasses += " bg-white border-2 border-[#FDBF47] border-b-[#F59E0B] border-b-[6px] text-[#FF6600]";
               }
             } else if (isSelected) {
               boxClasses += " bg-[#FFF3D6] border-2 border-[#FDBF47] border-b-[6px] border-b-[#F59E0B]";
             } else {
               boxClasses += " bg-white border-2 border-dashed border-[#FDBF47]";
             }
             
             return (
               <motion.div 
                 key={idx} 
                 onClick={() => handleBoxClick(idx)} 
                 className={boxClasses}
                 animate={showError && isFilled && char !== currentWord.parts[idx] ? { x: [-5, 5, -5, 5, 0] } : {}}
                 transition={{ duration: 0.4 }}
               >
                 {char}
               </motion.div>
             )
           })}
         </div>
         
         {/* Character Pool Area */}
         <div className="bg-[#F8FAFC] rounded-[24px] p-3 md:p-5 border border-gray-100 shrink-0">
           <div className="flex justify-between items-center mb-3 md:mb-4 px-2">
             <span className="text-gray-500 font-semibold text-xs md:text-sm">ផ្ទាំងអក្សរសម្រាប់បំពេញ:</span>
           </div>
           
           <div className="flex flex-wrap justify-center gap-2 md:gap-3">
             {pool.map((char, idx) => {
               // Render combining marks with a dotted circle visually if possible, or just let font handle it.
               return (
                 <button 
                   key={idx} 
                   onClick={() => handlePoolClick(char)}
                   className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-white border border-gray-200 border-b-[4px] rounded-xl flex items-center justify-center text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#1C60F4] hover:bg-gray-50 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-sm"
                 >
                   {char}
                 </button>
               );
             })}
           </div>
         </div>
         
         {/* Check Button */}
         <div className="mt-4 shrink-0 flex justify-center">
            <button 
              onClick={isSuccess ? handleNext : handleCheck}
              className="w-full max-w-xl bg-[#00B47A] hover:bg-[#009A68] text-white font-bold text-lg rounded-2xl py-3 md:py-4 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
            >
              <Check size={24} />
              {isSuccess ? "បន្តទៅពាក្យបន្ទាប់" : "ផ្ទៀងផ្ទាត់ចម្លើយ"}
            </button>
         </div>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative transform-gpu will-change-transform"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Settings size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">ការកំណត់កម្រិតលំបាក</h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full transition-all cursor-pointer border border-gray-200"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-3">
                {(['ងាយស្រួល', 'មធ្យម', 'លំបាក'] as const).map(level => {
                  let desc = "";
                  if (level === 'ងាយស្រួល') desc = "បង្ហាញតួអក្សរបំពេញស្រាប់ ៧០%";
                  else if (level === 'មធ្យម') desc = "បង្ហាញតួអក្សរបំពេញស្រាប់ ២០%";
                  else if (level === 'លំបាក') desc = "មិនបង្ហាញតួអក្សរបំពេញស្រាប់";
                  
                  return (
                    <button
                      key={level}
                      onClick={() => { playClickSound(); setDifficulty(level); }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-1 ${
                        difficulty === level 
                          ? 'border-[#1C60F4] bg-blue-50' 
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`font-bold text-lg ${difficulty === level ? 'text-[#1C60F4]' : 'text-gray-700'}`}>
                          {level}
                        </span>
                        {difficulty === level && <Check size={20} className="text-[#1C60F4]" />}
                      </div>
                      <span className="text-sm text-gray-500 font-medium">
                        {desc}
                      </span>
                    </button>
                  );
                })}
                
                <button
                  onClick={() => { playClickSound(); setIsSettingsOpen(false); }}
                  className="w-full py-4 bg-[#1C60F4] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer mt-4"
                >
                  រក្សាទុក
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-10 md:p-14 max-w-md w-full shadow-2xl relative border-2 border-[#00B47A] flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-[#D1F5E1] text-[#00B47A] rounded-full flex items-center justify-center mb-6">
                <Check size={48} strokeWidth={3} />
              </div>
              <p className="text-gray-600 font-bold mb-3 text-lg">ពាក្យត្រឹមត្រូវគឺ៖</p>
              <h2 className="text-5xl md:text-6xl font-extrabold text-[#00B47A] mb-10 leading-tight">
                {currentWord.word}
              </h2>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-[#4F46E5] hover:bg-indigo-600 text-white font-bold rounded-2xl text-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>បន្តទៅមុខ</span>
                <ChevronRight size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
