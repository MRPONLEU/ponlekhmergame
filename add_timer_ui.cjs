const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const targetHeader = `          {/* Center Title */}
          <div className="flex flex-col items-center gap-0.5 text-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-indigo-900 tracking-tight flex items-center justify-center gap-2">
              <span>{gameMode === 'quiz' ? \`ទាញព្រ័ត្រ ៖ \${currentTopic?.name || 'សំណួរពហុជម្រើស'}\` : 'ទាញព្រ័ត្រ គណិតវិទ្យា'}</span>
            </h1>
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
              {gameMode === 'quiz' 
                ? \`សំណួរពហុជម្រើស (\${availableQuizQuestions.length} សំណួរ)\` 
                : \`ប្រមាណវិធី \${operation === 'mul' ? 'គុណ (×)' : operation === 'add' ? 'បូក (+)' : operation === 'sub' ? 'ដក (-)' : operation === 'div' ? 'ចែក (÷)' : operation === 'decimal' ? 'ទសភាគ' : 'ចម្រុះ'}\`
              }
            </span>
          </div>`;

const replaceHeader = `          {/* Center Title & Timer */}
          <div className="flex flex-col items-center gap-0.5 text-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-indigo-900 tracking-tight flex items-center justify-center gap-2">
              <span>{gameMode === 'quiz' ? \`ទាញព្រ័ត្រ ៖ \${currentTopic?.name || 'សំណួរពហុជម្រើស'}\` : 'ទាញព្រ័ត្រ គណិតវិទ្យា'}</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                {gameMode === 'quiz' 
                  ? \`សំណួរពហុជម្រើស (\${availableQuizQuestions.length} សំណួរ)\` 
                  : \`ប្រមាណវិធី \${operation === 'mul' ? 'គុណ (×)' : operation === 'add' ? 'បូក (+)' : operation === 'sub' ? 'ដក (-)' : operation === 'div' ? 'ចែក (÷)' : operation === 'decimal' ? 'ទសភាគ' : 'ចម្រុះ'}\`
                }
              </span>
              {matchDuration > 0 && (
                <span className={\`text-xs font-black px-2 py-0.5 rounded-full \${timeLeft <= 10 && isTimerRunning ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'}\`}>
                  ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          </div>`;

code = code.replace(targetHeader, replaceHeader);

// Update draw message in winner modal
const targetDrawMsg = `              ) : winner === 'team2' ? (
                <div>
                  <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 text-xs font-extrabold rounded-full mb-2">
                    អបអរសាទរជ័យជម្នះ!
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-rose-600 mb-2">
                    ក្រុមទី ២ ឈ្នះ! 🎉
                  </h2>
                  <p className="text-slate-600 text-sm font-semibold mb-6">
                    ក្រុមទី ២ បានទាញខ្សែព្រ័ត្រឈ្នះផ្តាច់ដោយឆ្លើយត្រូវ {t2Score} សំណួរ!
                  </p>
                </div>
              ) : null}`;

const replaceDrawMsg = `              ) : winner === 'team2' ? (
                <div>
                  <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 text-xs font-extrabold rounded-full mb-2">
                    អបអរសាទរជ័យជម្នះ!
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-rose-600 mb-2">
                    ក្រុមទី ២ ឈ្នះ! 🎉
                  </h2>
                  <p className="text-slate-600 text-sm font-semibold mb-6">
                    ក្រុមទី ២ បានទាញខ្សែព្រ័ត្រឈ្នះផ្តាច់ដោយឆ្លើយត្រូវ {t2Score} សំណួរ!
                  </p>
                </div>
              ) : winner === 'draw' ? (
                <div>
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-extrabold rounded-full mb-2">
                    អស់ម៉ោង!
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-600 mb-2">
                    ស្មើគ្នា! 🤝
                  </h2>
                  <p className="text-slate-600 text-sm font-semibold mb-6">
                    ការប្រកួតបានបញ្ចប់ដោយលទ្ធផលស្មើគ្នា មិនមានអ្នកចាញ់អ្នកឈ្នះទេ។
                  </p>
                </div>
              ) : null}`;

code = code.replace(targetDrawMsg, replaceDrawMsg);

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
