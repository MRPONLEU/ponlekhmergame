const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

code = code.replace(/!currentQuestion/g, function(match, offset, str) {
  if (offset < 400) return '!t1Question';
  return '!t2Question';
});

code = code.replace(/currentQuestion\.answer/g, function(match, offset, str) {
  if (offset < 400) return 't1Question.answer';
  return 't2Question.answer';
});

code = code.replace(/currentQuestion, gameMode, currentQuizQuestion/g, 't1Question, t2Question, gameMode, t1QuizQuestion, t2QuizQuestion');

// Now for currentQuizQuestion usages in render
code = code.replace(/currentQuizQuestion\?/g, function(match, offset) {
  if (offset < 1300) return 't1QuizQuestion?';
  return 't2QuizQuestion?';
});
code = code.replace(/!currentQuizQuestion/g, function(match, offset) {
  if (offset < 1300) return '!t1QuizQuestion';
  return '!t2QuizQuestion';
});

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
