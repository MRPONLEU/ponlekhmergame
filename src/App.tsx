import React from 'react';
import { ViewState, WordItem, QuizQuestion, Topic } from './types';
import { DEFAULT_TOPICS } from './data';
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
import WordGrab from './components/WordGrab';
import { AnimatePresence, motion } from 'motion/react';
import { isSentenceItem } from './utils/khmerSplit';

export default function App() {
  const [currentView, setCurrentView] = React.useState<ViewState>('dashboard');
  
  // Persistent Topics in LocalStorage
  const [topics, setTopics] = React.useState<Topic[]>(() => {
    try {
      const saved = localStorage.getItem('khmer_topics');
      if (saved) {
        const parsed: Topic[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Check if user had older single-list khmer_words and migrate
      const oldWords = localStorage.getItem('khmer_words');
      if (oldWords) {
        const parsedWords: WordItem[] = JSON.parse(oldWords);
        if (Array.isArray(parsedWords) && parsedWords.length > 0) {
          const diffWords = parsedWords.filter(w => !isSentenceItem(w));
          const passages = parsedWords.filter(w => isSentenceItem(w));
          const migrated: Topic[] = [
            {
              id: 'migrated-topic-1',
              name: 'មេរៀនរបស់ខ្ញុំ (ទិន្នន័យពីមុន)',
              description: 'ទិន្នន័យពាក្យ និងអត្ថបទដែលបានរក្សាទុកពីមុន',
              difficultWords: diffWords.length > 0 ? diffWords : DEFAULT_TOPICS[0].difficultWords,
              shortPassages: passages.length > 0 ? passages : DEFAULT_TOPICS[0].shortPassages,
              quizQuestions: DEFAULT_TOPICS[0].quizQuestions,
              createdAt: Date.now()
            },
            ...DEFAULT_TOPICS.slice(1)
          ];
          return migrated;
        }
      }
      return DEFAULT_TOPICS;
    } catch (e) {
      console.error("Failed to parse saved topics, using default.", e);
      return DEFAULT_TOPICS;
    }
  });

  // Active Topic ID
  const [activeTopicId, setActiveTopicId] = React.useState<string>(() => {
    try {
      const savedId = localStorage.getItem('khmer_active_topic_id');
      if (savedId && topics.some(t => t.id === savedId)) {
        return savedId;
      }
      return topics[0]?.id || DEFAULT_TOPICS[0].id;
    } catch {
      return topics[0]?.id || DEFAULT_TOPICS[0].id;
    }
  });

  // Save topics whenever list changes
  React.useEffect(() => {
    try {
      localStorage.setItem('khmer_topics', JSON.stringify(topics));
    } catch (e) {
      console.error("Failed to save topics to localStorage", e);
    }
  }, [topics]);

  // Save active topic ID
  React.useEffect(() => {
    try {
      localStorage.setItem('khmer_active_topic_id', activeTopicId);
    } catch (e) {
      console.error("Failed to save active topic id to localStorage", e);
    }
  }, [activeTopicId]);

  // Current active topic reference
  const activeTopic = React.useMemo(() => {
    return topics.find(t => t.id === activeTopicId) || topics[0] || DEFAULT_TOPICS[0];
  }, [topics, activeTopicId]);

  // Derived words strictly scoped to the active topic
  const activeWords = React.useMemo(() => {
    const list = [...activeTopic.difficultWords, ...activeTopic.shortPassages];
    // If empty fallback to difficult words
    return list.length > 0 ? list : activeTopic.difficultWords;
  }, [activeTopic]);

  // Topic Management Handlers
  const handleSelectTopic = (id: string) => {
    setActiveTopicId(id);
  };

  const handleAddTopic = (newTopic: Topic) => {
    setTopics(prev => [newTopic, ...prev]);
    setActiveTopicId(newTopic.id);
  };

  const handleUpdateTopic = (updatedTopic: Topic) => {
    setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));
  };

  const handleDeleteTopic = (id: string) => {
    setTopics(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTopicId === id && next.length > 0) {
        setActiveTopicId(next[0].id);
      }
      return next;
    });
  };

  const handleUpdateActiveQuizQuestions = (questions: QuizQuestion[]) => {
    setTopics(prev => prev.map(t => {
      if (t.id === activeTopicId) {
        return { ...t, quizQuestions: questions };
      }
      return t;
    }));
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
            topics={topics}
            activeTopicId={activeTopicId}
            onSelectTopic={handleSelectTopic}
          />
        );
      case 'add-words':
        return (
          <AddWords 
            topics={topics}
            activeTopicId={activeTopicId}
            onSelectTopic={handleSelectTopic}
            onAddTopic={handleAddTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'team-cards':
        return (
          <TeamCards 
            words={activeWords} 
            topicName={activeTopic.name}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'word-puzzle':
        return (
          <WordPuzzle 
            words={activeWords} 
            topicName={activeTopic.name}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'word-search':
        return (
          <WordSearch 
            words={activeWords} 
            topicName={activeTopic.name}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'lucky-draw':
        return (
          <LuckyDraw 
            words={activeWords} 
            topicName={activeTopic.name}
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
            words={activeWords} 
            topicName={activeTopic.name}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'quiz':
        return (
          <Quiz 
            words={activeWords} 
            questions={activeTopic.quizQuestions}
            topicName={activeTopic.name}
            onUpdateQuestions={handleUpdateActiveQuizQuestions}
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
            words={activeWords} 
            topicName={activeTopic.name}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      case 'word-grab':
        return (
          <WordGrab 
            words={activeWords} 
            topics={topics}
            activeTopicId={activeTopicId}
            onBack={() => handleNavigate('dashboard')} 
          />
        );
      default:
        return (
          <Dashboard 
            onNavigate={handleNavigate} 
            topics={topics}
            activeTopicId={activeTopicId}
            onSelectTopic={handleSelectTopic}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden text-slate-800 font-sans">
      {/* Ambient background soft glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-100/30 via-sky-50/20 to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
      
      <div className={`relative z-10 w-full h-full ${['dashboard', 'add-words'].includes(currentView) ? 'pb-12' : 'pb-0'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
