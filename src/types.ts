export interface WordItem {
  word: string;
  wordType: string;
  parts: string[]; // Scrambled letter parts, e.g. ["ស", "ត", "្វ"]
  definition: string;
  example: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  difficultWords: WordItem[]; // Sheet 1: ពាក្យពិបាក
  antonymWords?: WordItem[]; // Sheet 2: ពាក្យផ្ទុយ (Antonyms / Opposite Words)
  shortPassages: WordItem[]; // Sheet 3: អត្ថបទខ្លី
  quizQuestions: QuizQuestion[]; // Sheet 4: សំណួរពហុជម្រើស
  createdAt: number;
}

export type ViewState =
  | 'dashboard'
  | 'add-words'
  | 'word-puzzle'
  | 'team-cards'
  | 'word-search'
  | 'lucky-draw'
  | 'spinner'
  | 'flashcards'
  | 'quiz'
  | 'math-finger'
  | 'mystery-box'
  | 'word-grab'
  | 'math-tug';
