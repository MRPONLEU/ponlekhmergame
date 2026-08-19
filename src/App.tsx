import React from 'react';
import { ViewState, WordItem } from './types';
import { DEFAULT_WORDS } from './data';
import Dashboard from './components/Dashboard';
import AddWords from './components/AddWords';
import WordPuzzle from './components/WordPuzzle';
import TeamCards from './components/TeamCards';
import WordSearch from './components/WordSearch';
import LuckyDraw from './components/LuckyDraw';
import Spinner from './components/Spinner';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import MathFinger from './components/MathFinger';
import MysteryBox from './components/MysteryBox';
import { AnimatePresence, motion } from 'motion/react';

import { playClickSound } from './utils/audio';
import { isSentenceItem } from './utils/khmerSplit';

export default function App() {
  const [currentView, setCurrentView] = React.useState<ViewState>('dashboard');
  
  // Persistent Khmer word list in LocalStorage
  const [words, setWords] = React.useState<WordItem[]>(() => {
    try {
      const saved = localStorage.getItem('khmer_words');
      if (saved) {
        const parsed: WordItem[] = JSON.parse(saved);
        const hasSentences = parsed.some(w => isSentenceItem(w));
        if (!hasSentences) {
          const defaultSentences = DEFAULT_WORDS.filter(w => isSentenceItem(w));
          return [...parsed, ...defaultSentences];
        }
        return parsed;
      }
      return DEFAULT_WORDS;
    } catch (e) {
      console.error("Failed to parse saved words, using default.", e);
      return DEFAULT_WORDS;
    }
  });

  // Save words whenever list changes
  React.useEffect(() => {
    try {
      localStorage.setItem('khmer_words', JSON.stringify(words));
    } catch (e) {
      console.error("Failed to save words to localStorage", e);
    }
  }, [words]);

  const handleAddWord = (newWord: WordItem) => {
    setWords(prev => [newWord, ...prev]);
  };

  const handleRemoveWord = (index: number) => {
    setWords(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSetWords = (newWords: WordItem[]) => {
    setWords(newWords);
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  // Select view component based on active routing state
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={handleNavigate} 
            wordCount={words.length} 
          />
        );
      case 'add-words':
        return (
          <AddWords 
            words={words} 
            onAddWord={handleAddWord} 
            onRemoveWord={handleRemoveWord} 
            onSetWords={handleSetWords}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'team-cards':
        return (
          <TeamCards 
            words={words} 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'word-puzzle':
        return (
          <WordPuzzle 
            words={words} 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'word-search':
        return (
          <WordSearch 
            words={words} 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'lucky-draw':
        return (
          <LuckyDraw 
            words={words} 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'spinner':
        return (
          <Spinner 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'flashcards':
        return (
          <Flashcards 
            words={words} 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'quiz':
        return (
          <Quiz 
            words={words} 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'math-finger':
        return (
          <MathFinger 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'mystery-box':
        return (
          <MysteryBox 
            words={words} 
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      default:
        return (
          <Dashboard 
            onNavigate={handleNavigate} 
            wordCount={words.length} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden text-slate-800 font-sans">
      {/* Ambient background soft glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-100/30 via-sky-50/20 to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
      
      <div className="relative z-10 w-full pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
