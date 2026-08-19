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
  | 'mystery-box';
