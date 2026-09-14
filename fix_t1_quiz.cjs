const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

// Replace t2QuizQuestion?.options and !t2QuizQuestion in Team 1's choice rendering
const targetStr = `{t2QuizQuestion?.options.map((optText, optIdx) => {
                    const khmerLabels = ['ក', 'ខ', 'គ', 'ឃ'];
                    const keyHints = ['A / 1', 'B / 2', 'C / 3', 'D / 4'];
                    const isSelected = t1Choice === optIdx;
                    return (
                      <button
                        key={\`t1-choice-\${optIdx}\`}
                        type="button"
                        disabled={t1Locked || !t2QuizQuestion}`;

const replaceStr = `{t1QuizQuestion?.options.map((optText, optIdx) => {
                    const khmerLabels = ['ក', 'ខ', 'គ', 'ឃ'];
                    const keyHints = ['A / 1', 'B / 2', 'C / 3', 'D / 4'];
                    const isSelected = t1Choice === optIdx;
                    return (
                      <button
                        key={\`t1-choice-\${optIdx}\`}
                        type="button"
                        disabled={t1Locked || !t1QuizQuestion}`;

if (!code.includes(targetStr)) {
  console.log("Target string not found, trying regex/flexible match");
  code = code.replace(/t2QuizQuestion\?\.options\.map\(\(optText, optIdx\) => \{([\s\S]*?)key=\{`t1-choice-\$\{optIdx\}`\}([\s\S]*?)disabled=\{t1Locked \|\| !t2QuizQuestion\}/, (match, p1, p2) => {
    return `t1QuizQuestion?.options.map((optText, optIdx) => {${p1}key={\`t1-choice-\${optIdx}\`}${p2}disabled={t1Locked || !t1QuizQuestion}`;
  });
} else {
  code = code.replace(targetStr, replaceStr);
}

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
console.log("Successfully replaced!");
