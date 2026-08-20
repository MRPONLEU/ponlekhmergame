import React from 'react';
import { WordItem } from '../types';
import { 
  ArrowLeft, 
  RotateCcw, 
  HelpCircle, 
  Sparkles,
  Trophy,
  Volume2,
  Gift,
  Star,
  Maximize,
  Minimize,
  ChevronDown,
  X,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound, playWinSound, speakText } from '../utils/audio';

interface LuckyDrawProps {
  words: WordItem[];
  topicName?: string;
  onBack: () => void;
}

export default function LuckyDraw({ words, topicName, onBack }: LuckyDrawProps) {
  const [isRolling, setIsRolling] = React.useState(false);
  const [displayWord, setDisplayWord] = React.useState<WordItem | null>(null);
  const [caughtHistory, setCaughtHistory] = React.useState<WordItem[]>([]);
  const [selectedResult, setSelectedResult] = React.useState<WordItem | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [availableWords, setAvailableWords] = React.useState<WordItem[]>(words);

  React.useEffect(() => {
    setAvailableWords(words);
    setDisplayWord(null);
    setSelectedResult(null);
    setCaughtHistory([]);
  }, [words]);
  const [isFinishedMessage, setIsFinishedMessage] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('ទាំងអស់');
  const [timerFinished, setTimerFinished] = React.useState(false);
  const [timerDuration, setTimerDuration] = React.useState(6);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const machineCardRef = React.useRef<HTMLDivElement>(null);

  const categories = ['ទាំងអស់', ...Array.from(new Set(words.map(w => w.wordType || 'អំណាន')))];
  const filteredWords = selectedCategory === 'ទាំងអស់' 
    ? words 
    : words.filter(w => (w.wordType || 'អំណាន') === selectedCategory);

  const toggleFullscreen = () => {
    playClickSound();
    setIsFullscreen(!isFullscreen);
  };

  const commitResult = (wordToCommit: WordItem | null) => {
    if (!wordToCommit || wordToCommit.word === "សូមអបអរសាទរ ការចាប់ពាក្យបានបញ្ចប់") return;
    setAvailableWords(prev => prev.filter(w => w.word !== wordToCommit.word));
    setCaughtHistory(prev => [wordToCommit, ...prev.filter(w => w.word !== wordToCommit.word)]);
  };

  const handleCloseResult = () => {
    commitResult(selectedResult);
    setSelectedResult(null);
    setDisplayWord(null);
    setTimerFinished(false);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (!isRolling) {
          e.preventDefault();
          if (selectedResult) {
            handleCloseResult();
          } else {
            startLuckyDraw();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedResult, isRolling, availableWords, isFinishedMessage, words]);

  // Fallback if words is empty
  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center font-sans">
        <HelpCircle size={48} className="text-soft-gray mb-3" />
        <p className="text-charcoal font-bold mb-4">មិនមានពាក្យសិក្សានៅក្នុងបញ្ជីទេ!</p>
        <button
          onClick={() => { playClickSound(); onBack(); }}
          className="px-6 py-2.5 bg-clay hover:bg-[#b86d47] text-white font-bold rounded-2xl transition-all cursor-pointer shadow-sm"
        >
          ត្រឡប់ទៅវិញ
        </button>
      </div>
    );
  }

  // Start Lucky Draw Rolling Animation
  const startLuckyDraw = () => {
    if (isRolling) return;
    
    if (isFinishedMessage) {
      playClickSound();
      setAvailableWords(words);
      setCaughtHistory([]);
      setIsFinishedMessage(false);
      setDisplayWord(null);
      return;
    }

    if (availableWords.length === 0) {
      playClickSound();
      const finishedItem: WordItem = {
        word: "សូមអបអរសាទរ ការចាប់ពាក្យបានបញ្ចប់",
        wordType: "បញ្ចប់",
        parts: [],
        definition: "ពាក្យទាំងអស់ត្រូវបានចាប់រួចរាល់ហើយ!",
        example: "សូមអបអរសាទរ!"
      };
      setDisplayWord(finishedItem);
      setSelectedResult(null);
      playWinSound();
      playSuccessSound();
      setIsFinishedMessage(true);
      return;
    }

    playClickSound();
    setIsRolling(true);
    setSelectedResult(null);
    setTimerFinished(false);

    let counter = 0;
    const maxRolls = 20; // 20 ticks of rolling
    const intervalTime = 100; // ms per tick

    const interval = setInterval(() => {
      counter++;
      // Roll through all words for visual richness
      const randomIdx = Math.floor(Math.random() * words.length);
      setDisplayWord(words[randomIdx]);
      playClickSound();

      if (counter >= maxRolls) {
        clearInterval(interval);
        // Pick final winning word strictly from available pool
        const finalWinningWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        setDisplayWord(finalWinningWord);
        setSelectedResult(finalWinningWord);
        setTimerFinished(false);
        setIsRolling(false);

        // Play Win and Success sounds
        playWinSound();
        playSuccessSound();

        // Speak word
        setTimeout(() => {
          speakText(finalWinningWord.word);
        }, 300);
      }
    }, intervalTime);
  };

  return (
    <div ref={containerRef} className={`font-sans transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white flex flex-col justify-center items-center overflow-auto w-screen h-screen m-0 p-0' : 'min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8'}`}>
      
      <div className={`mx-auto w-full ${isFullscreen ? 'h-full flex flex-col justify-center items-center max-w-none' : 'max-w-4xl'}`}>
        
        {/* Header bar - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-border-beige pb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { playClickSound(); onBack(); }}
                id="btn-back-dashboard"
                className="p-3 bg-white hover:bg-stone-bg border border-border-beige rounded-full shadow-sm transition-all text-charcoal hover:text-black cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">ចាប់ពាក្យសំណាង</h1>
                <p className="text-soft-gray text-sm mt-0.5 font-semibold">ម៉ាស៊ីន Lucky Draw ចាប់ពាក្យសំណាងអមដោយសំឡេងអបអរសាទរ</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                onClick={() => { playClickSound(); setIsSettingsOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-bg border border-border-beige text-charcoal rounded-2xl shadow-sm font-bold text-xs sm:text-sm cursor-pointer transition-all"
                title="កំណត់រយៈពេល"
              >
                <Settings size={18} className="text-charcoal" />
                <span>កំណត់ម៉ោង ({timerDuration}s)</span>
              </button>

              <div className="flex items-center gap-2 px-4 py-2 bg-sand/15 border border-sand/25 text-[#a88220] rounded-2xl shadow-sm font-bold text-xs sm:text-sm">
                <Trophy size={18} className="animate-bounce text-[#a88220]" />
                <span>ចាប់បាន៖ {caughtHistory.length} ពាក្យ</span>
              </div>
            </div>
          </div>
        )}

        {/* Lucky Draw Machine Center Stage */}
        <div className={`w-full ${isFullscreen ? 'h-full flex flex-col items-center justify-center p-0' : 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'}`}>
          
          {/* Main Slot Machine Display (Col 8 or 12 in fullscreen) */}
          <div className={`${isFullscreen ? 'w-full h-full flex flex-col items-center justify-center' : 'lg:col-span-8 flex flex-col items-center'}`}>
            
            <div ref={machineCardRef} className={`w-full bg-white ${isFullscreen ? 'h-full max-w-none rounded-none border-none shadow-none flex flex-col justify-center items-center p-8 sm:p-20 relative' : 'p-8 sm:p-12 border border-border-beige rounded-[36px] soft-shadow flex flex-col items-center relative overflow-hidden'}`}>
              
              {/* Top controls: Badge left, Sound & Fullscreen right */}
              <div className="w-full flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage/10 text-sage rounded-full text-xs font-bold border border-sage/20">
                  <Sparkles size={14} className="animate-spin" />
                  <span>Lucky Word Machine</span>
                </div>

                <div className="flex items-center gap-2">
                  {displayWord && displayWord.word !== "សូមអបអរសាទរ ការចាប់ពាក្យបានបញ្ចប់" && (
                    <button
                      onClick={() => { playClickSound(); speakText(displayWord.word); }}
                      className="p-2.5 bg-sage/10 hover:bg-sage/20 text-sage rounded-2xl transition-all cursor-pointer border border-sage/20 flex items-center gap-1.5 px-3 text-xs font-bold"
                      title="ស្ដាប់សំឡេងពាក្យនេះ"
                    >
                      <Volume2 size={16} />
                      <span className="hidden sm:inline">ស្ដាប់</span>
                    </button>
                  )}
                  <button
                    onClick={toggleFullscreen}
                    className="p-3 bg-[#F9F7F2] hover:bg-stone-bg text-charcoal rounded-2xl transition-all cursor-pointer border border-border-beige flex items-center justify-center shadow-sm"
                    title={isFullscreen ? "បិទ" : "ពង្រីកពេញប្រអប់ពាក្យ"}
                  >
                    {isFullscreen ? <X size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>

              {/* Slot window */}
              <div className={`w-full ${isFullscreen ? 'max-w-6xl h-[68vh] sm:h-[78vh]' : 'max-w-md h-52 sm:h-60'} bg-gradient-to-b from-[#F9F7F2] to-[#f0ece1] border-2 border-border-beige rounded-3xl flex flex-col items-center justify-center p-6 relative my-4 sm:my-8 shadow-inner overflow-hidden transition-all duration-300`}>
                
                {/* Glowing ring animation behind */}
                {isRolling && (
                  <div className="absolute inset-0 bg-sand/10 animate-pulse pointer-events-none" />
                )}

                <AnimatePresence mode="wait">
                  {displayWord ? (
                    <motion.div
                      key={displayWord.word + (isRolling ? Math.random() : 'static')}
                      initial={{ y: isRolling ? 30 : 0, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: isRolling ? -30 : 0, opacity: 0, scale: 0.9 }}
                      transition={{ duration: isRolling ? 0.08 : 0.3 }}
                      className="text-center z-10 px-4"
                    >
                      <h2 className={`font-extrabold text-charcoal tracking-tight my-4 drop-shadow-sm font-sans ${
                        isFullscreen 
                          ? (displayWord.word.length > 15 ? 'text-3xl sm:text-6xl leading-snug px-4' : 'text-6xl sm:text-9xl leading-none')
                          : (displayWord.word.length > 15 ? 'text-xl sm:text-2xl px-2' : 'text-3xl sm:text-5xl')
                      }`}>
                        {displayWord.word}
                      </h2>
                    </motion.div>
                  ) : (
                    <div className="text-center z-10 px-4">
                      <Gift size={isFullscreen ? 96 : 48} className="mx-auto text-clay mb-6 animate-bounce" />
                      <p className={`font-bold text-charcoal ${isFullscreen ? 'text-4xl sm:text-5xl mb-3' : 'text-lg'}`}>ចាប់ពាក្យសំណាង</p>
                      <p className={`text-soft-gray ${isFullscreen ? 'text-2xl' : 'text-xs'}`}>ចុចប៊ូតុង "ចាប់ផ្ដើម" ខាងក្រោមដើម្បីចាប់ពាក្យសំណាង!</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Start Button */}
              <button
                onClick={startLuckyDraw}
                disabled={isRolling}
                id="btn-start-lucky-draw"
                className={`w-full ${isFullscreen ? 'max-w-3xl py-7 px-16 text-3xl sm:text-4xl shadow-2xl' : 'max-w-md py-4 px-8 text-lg'} rounded-3xl font-bold text-white transition-all flex items-center justify-center gap-5 cursor-pointer mt-6 ${
                  isRolling 
                    ? 'bg-clay/70 cursor-not-allowed animate-pulse' 
                    : 'bg-clay hover:bg-[#b86d47] active:scale-95'
                }`}
              >
                <Sparkles size={isFullscreen ? 42 : 22} className={isRolling ? 'animate-spin' : ''} />
                <span>{isRolling ? 'កំពុងចាប់ពាក្យសំណាង...' : (isFinishedMessage ? 'ចាប់ផ្ដើមសាថ្មី' : 'ចាប់ផ្ដើម (Lucky Draw)')}</span>
              </button>

            </div>
          </div>

          {/* Sidebar History & Quick stats (Col 4) - Hidden in fullscreen */}
          {!isFullscreen && (
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white rounded-[32px] p-6 border border-border-beige soft-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                    <Star size={18} className="text-sand" />
                    <span>បញ្ជីពាក្យ</span>
                  </h3>
                  <span className="text-xs bg-stone-bg px-2.5 py-1 rounded-full text-soft-gray font-medium">
                    {filteredWords.length} ពាក្យ
                  </span>
                </div>

                {/* Category Dropdown List */}
                {categories.length > 1 && (
                  <div className="relative mb-4">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        playClickSound();
                        setSelectedCategory(e.target.value);
                      }}
                      className="w-full appearance-none bg-[#F9F7F2] border border-border-beige text-charcoal text-sm font-medium rounded-2xl py-2.5 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-clay/50 cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          ប្រភេទ: {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-soft-gray">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                )}

                {words.length === 0 ? (
                  <div className="text-center py-8 text-soft-gray text-sm">
                    មិនទាន់មានពាក្យក្នុងបញ្ជីទេ។
                  </div>
                ) : filteredWords.length === 0 ? (
                  <div className="text-center py-8 text-soft-gray text-sm">
                    គ្មានពាក្យក្នុងប្រភេទនេះទេ។
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {filteredWords.map((item, idx) => {
                      const isCaught = caughtHistory.some(c => c.word === item.word);
                      return (
                        <div 
                          key={`${item.word}-${idx}`}
                          onClick={() => { playClickSound(); setSelectedResult(item); speakText(item.word); }}
                          className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                            isCaught 
                              ? 'bg-sage/10 border-sage/30 text-charcoal' 
                              : 'bg-[#F9F7F2] hover:bg-stone-bg border-border-beige text-charcoal'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{item.word}</span>
                            {isCaught && <span className="text-[10px] bg-sage text-white px-2 py-0.5 rounded-full font-medium">បានចាប់</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Result celebratory modal popup when a word is drawn */}
        <AnimatePresence>
          {selectedResult && !isRolling && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseResult}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[40px] p-12 sm:p-20 max-w-3xl sm:max-w-4xl w-full border border-border-beige shadow-2xl text-center relative overflow-hidden"
              >
                <motion.div
                  key={selectedResult ? selectedResult.word : 'timer'}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: timerDuration, ease: "linear" }}
                  onAnimationComplete={() => {
                    if (selectedResult) {
                      setTimerFinished(true);
                      playSuccessSound();
                    }
                  }}
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-sage via-sand to-clay z-20"
                />

                <button
                  onClick={handleCloseResult}
                  className="absolute top-6 right-6 p-3 bg-[#F9F7F2] hover:bg-stone-bg text-charcoal rounded-full transition-all cursor-pointer border border-border-beige shadow-sm z-10"
                  title="បិទ"
                >
                  <X size={20} />
                </button>

                <div className="w-24 h-24 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-6 text-sage">
                  <Trophy size={48} />
                </div>

                <h3 className={`text-7xl sm:text-9xl font-extrabold my-6 leading-tight transition-colors duration-300 ${timerFinished ? 'text-red-600' : 'text-charcoal'}`}>
                  {selectedResult.word}
                </h3>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsSettingsOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[32px] p-8 sm:p-10 max-w-md w-full border border-border-beige shadow-2xl relative"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-beige">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-sage/10 text-sage rounded-2xl">
                      <Settings size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-charcoal">កំណត់រយៈពេល (វិនាទី)</h2>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 bg-[#F9F7F2] hover:bg-stone-bg text-charcoal rounded-full transition-all cursor-pointer border border-border-beige"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-soft-gray">រយៈពេលចន្លោះពេល</span>
                      <span className="text-2xl font-extrabold text-charcoal">{timerDuration} វិនាទី</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(Number(e.target.value))}
                      className="w-full accent-sage cursor-pointer h-2 bg-stone-bg rounded-lg"
                    />
                    <div className="flex justify-between text-xs text-soft-gray mt-2 font-semibold">
                      <span>1 វិនាទី</span>
                      <span>15 វិនាទី</span>
                      <span>30 វិនាទី</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[3, 5, 10, 15, 20, 30].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => { playClickSound(); setTimerDuration(sec); }}
                        className={`py-2 px-3 rounded-xl font-bold text-sm cursor-pointer transition-all border ${timerDuration === sec ? 'bg-sage text-white border-sage shadow-md' : 'bg-white hover:bg-stone-bg text-charcoal border-border-beige'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { playClickSound(); setIsSettingsOpen(false); }}
                    className="w-full py-3.5 bg-sage hover:bg-[#52796f] text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer mt-4"
                  >
                    រក្សាទុក
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
