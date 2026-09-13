const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const targetSettingsPlace = `                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Medal size={16} className="text-amber-500" />
                    លក្ខខណ្ឌឈ្នះ (Winner Goal)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 4, label: '៤ លំហាត់' },
                      { val: 6, label: '៦ លំហាត់' },
                      { val: 10, label: '១០ លំហាត់' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setTargetWinPulls(opt.val)}
                        className={\`py-2 px-2.5 rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer \${
                          targetWinPulls === opt.val 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }\`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>`;

const replaceSettingsPlace = `                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Medal size={16} className="text-amber-500" />
                    លក្ខខណ្ឌឈ្នះ (Winner Goal)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 4, label: '៤ លំហាត់' },
                      { val: 6, label: '៦ លំហាត់' },
                      { val: 10, label: '១០ លំហាត់' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setTargetWinPulls(opt.val)}
                        className={\`py-2 px-2.5 rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer \${
                          targetWinPulls === opt.val 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }\`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Duration Settings */}
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
                </div>`;

code = code.replace(targetSettingsPlace, replaceSettingsPlace);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
