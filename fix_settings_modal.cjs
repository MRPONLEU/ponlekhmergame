const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const targetSettingsEnd = `                {/* 5. Sound, Language & Screen System */}`;
const replaceSettingsEnd = `                {/* Match Duration Settings */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    កំណត់ពេលប្រកួត (Match Duration)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 0, label: 'គ្មានកំណត់' },
                      { val: 60, label: '១ នាទី' },
                      { val: 180, label: '៣ នាទី' },
                      { val: 300, label: '៥ នាទី' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setMatchDuration(opt.val)}
                        className={\`py-2 px-2.5 rounded-xl font-extrabold text-[11px] sm:text-xs border transition-all cursor-pointer \${
                          matchDuration === opt.val 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }\`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Sound, Language & Screen System */}`;

code = code.replace(targetSettingsEnd, replaceSettingsEnd);

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
