const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const target1 = `              {/* Individual Question Card */}
              <div className="bg-white border-2 border-sky-100 rounded-xl py-1 px-3 text-center shadow-xs flex-1 flex items-center justify-center min-h-[44px] sm:min-h-[48px]">
                {gameMode === 'math' ? (
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-800 drop-shadow-xs">
                    {t1Question ? t1Question.text : '...'}
                  </span>
                ) : (
                  <span className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2">
                    {t1QuizQuestion ? t1QuizQuestion.question : 'មិនទាន់មានសំណួរ'}
                  </span>
                )}
              </div>

              {/* Answer Display Box (ប្រអប់ចម្លើយ) */}
              <motion.div 
                animate={
                  t1Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t1SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#e0f2fe', '#ffffff'] }
                    : {}
                }
                className={\`flex-1 sm:max-w-[140px] min-h-[44px] sm:min-h-[48px] bg-white border-2 rounded-xl py-1 px-3 text-center flex items-center justify-center transition-colors shadow-xs \${
                  t1Shake 
                    ? 'border-rose-400 text-rose-600 bg-rose-50' 
                    : t1SuccessFlash
                    ? 'border-sky-500 ring-2 ring-sky-300'
                    : 'border-slate-200/90 text-slate-800'
                }\`}
              >
                {gameMode === 'math' ? (
                  <span className={\`text-2xl sm:text-3xl font-black font-mono tracking-widest \${t1Input ? 'text-slate-800' : 'text-slate-300'}\`}>
                    {t1Input || 0}
                  </span>
                ) : (
                  <span className={\`font-black \${
                    t1Locked 
                      ? 'text-rose-600 text-xs sm:text-sm animate-pulse' 
                      : t1Choice !== null 
                      ? 'text-sky-700 text-lg sm:text-xl' 
                      : 'text-slate-400 text-xs sm:text-sm'
                  }\`}>
                    {t1Locked 
                      ? '❌ រង់ចាំ...' 
                      : t1Choice !== null 
                      ? \`ជម្រើស [ \${['ក', 'ខ', 'គ', 'ឃ'][t1Choice]} ]\` 
                      : '-'}
                  </span>
                )}
              </motion.div>`;

const replace1 = `              {/* Individual Question Card */}
              <motion.div 
                animate={
                  t1Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t1SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#e0f2fe', '#ffffff'] }
                    : {}
                }
                className={\`border-2 rounded-xl py-1 px-3 text-center shadow-xs flex-1 flex flex-col items-center justify-center min-h-[44px] sm:min-h-[48px] transition-colors \${
                  t1Shake 
                    ? 'border-rose-400 bg-rose-50' 
                    : t1SuccessFlash
                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-300'
                    : 'border-sky-100 bg-white'
                }\`}
              >
                {gameMode === 'math' ? (
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-800 drop-shadow-xs flex items-center justify-center flex-wrap gap-2">
                    <span>{t1Question ? t1Question.text.replace('?', '') : '...'}</span>
                    <span className={\`min-w-[40px] px-2 py-0.5 rounded border-b-4 \${
                      t1Shake ? 'border-rose-500 text-rose-600 bg-rose-100/50' 
                      : t1SuccessFlash ? 'border-emerald-500 text-emerald-600 bg-emerald-100/50' 
                      : t1Input ? 'border-sky-400 text-sky-700 bg-sky-50'
                      : 'border-slate-300 text-slate-400 bg-slate-50'
                    }\`}>
                      {t1Input || '?'}
                    </span>
                  </span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2">
                      {t1QuizQuestion ? t1QuizQuestion.question : 'មិនទាន់មានសំណួរ'}
                    </span>
                    {t1Locked && (
                       <span className="text-rose-600 text-xs sm:text-sm font-black animate-pulse mt-1">
                         ❌ ចម្លើយមិនត្រឹមត្រូវ! រង់ចាំបន្តិច...
                       </span>
                    )}
                    {!t1Locked && t1Choice !== null && (
                       <span className="text-sky-700 text-sm sm:text-base font-black mt-1">
                         បានជ្រើសរើស៖ [ \${['ក', 'ខ', 'គ', 'ឃ'][t1Choice]} ]
                       </span>
                    )}
                  </div>
                )}
              </motion.div>`;

code = code.replace(target1, replace1);

const target2 = `              {/* Individual Question Card */}
              <div className="bg-white border-2 border-rose-100 rounded-xl py-1 px-3 text-center shadow-xs flex-1 flex items-center justify-center min-h-[44px] sm:min-h-[48px]">
                {gameMode === 'math' ? (
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-800 drop-shadow-xs">
                    {t2Question ? t2Question.text : '...'}
                  </span>
                ) : (
                  <span className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2">
                    {t2QuizQuestion ? t2QuizQuestion.question : 'មិនទាន់មានសំណួរ'}
                  </span>
                )}
              </div>

              {/* Answer Display Box (ប្រអប់ចម្លើយ) */}
              <motion.div 
                animate={
                  t2Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t2SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#ffe4e6', '#ffffff'] }
                    : {}
                }
                className={\`flex-1 sm:max-w-[140px] min-h-[44px] sm:min-h-[48px] bg-white border-2 rounded-xl py-1 px-3 text-center flex items-center justify-center transition-colors shadow-xs \${
                  t2Shake 
                    ? 'border-rose-400 text-rose-600 bg-rose-50' 
                    : t2SuccessFlash
                    ? 'border-rose-500 ring-2 ring-rose-300'
                    : 'border-slate-200/90 text-slate-800'
                }\`}
              >
                {gameMode === 'math' ? (
                  <span className={\`text-2xl sm:text-3xl font-black font-mono tracking-widest \${t2Input ? 'text-slate-800' : 'text-slate-300'}\`}>
                    {t2Input || 0}
                  </span>
                ) : (
                  <span className={\`font-black \${
                    t2Locked 
                      ? 'text-rose-600 text-xs sm:text-sm animate-pulse' 
                      : t2Choice !== null 
                      ? 'text-rose-700 text-lg sm:text-xl' 
                      : 'text-slate-400 text-xs sm:text-sm'
                  }\`}>
                    {t2Locked 
                      ? '❌ រង់ចាំ...' 
                      : t2Choice !== null 
                      ? \`ជម្រើស [ \${['ក', 'ខ', 'គ', 'ឃ'][t2Choice]} ]\` 
                      : '-'}
                  </span>
                )}
              </motion.div>`;

const replace2 = `              {/* Individual Question Card */}
              <motion.div 
                animate={
                  t2Shake 
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] } 
                    : t2SuccessFlash 
                    ? { scale: [1, 1.05, 1], backgroundColor: ['#ffffff', '#ffe4e6', '#ffffff'] }
                    : {}
                }
                className={\`border-2 rounded-xl py-1 px-3 text-center shadow-xs flex-1 flex flex-col items-center justify-center min-h-[44px] sm:min-h-[48px] transition-colors \${
                  t2Shake 
                    ? 'border-rose-400 bg-rose-50' 
                    : t2SuccessFlash
                    ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300'
                    : 'border-rose-100 bg-white'
                }\`}
              >
                {gameMode === 'math' ? (
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-800 drop-shadow-xs flex items-center justify-center flex-wrap gap-2">
                    <span>{t2Question ? t2Question.text.replace('?', '') : '...'}</span>
                    <span className={\`min-w-[40px] px-2 py-0.5 rounded border-b-4 \${
                      t2Shake ? 'border-rose-500 text-rose-600 bg-rose-100/50' 
                      : t2SuccessFlash ? 'border-emerald-500 text-emerald-600 bg-emerald-100/50' 
                      : t2Input ? 'border-rose-400 text-rose-700 bg-rose-50'
                      : 'border-slate-300 text-slate-400 bg-slate-50'
                    }\`}>
                      {t2Input || '?'}
                    </span>
                  </span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2">
                      {t2QuizQuestion ? t2QuizQuestion.question : 'មិនទាន់មានសំណួរ'}
                    </span>
                    {t2Locked && (
                       <span className="text-rose-600 text-xs sm:text-sm font-black animate-pulse mt-1">
                         ❌ ចម្លើយមិនត្រឹមត្រូវ! រង់ចាំបន្តិច...
                       </span>
                    )}
                    {!t2Locked && t2Choice !== null && (
                       <span className="text-rose-700 text-sm sm:text-base font-black mt-1">
                         បានជ្រើសរើស៖ [ \${['ក', 'ខ', 'គ', 'ឃ'][t2Choice]} ]
                       </span>
                    )}
                  </div>
                )}
              </motion.div>`;

code = code.replace(target2, replace2);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
