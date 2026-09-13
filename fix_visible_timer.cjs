const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const oldHeaderTimer = `              {matchDuration > 0 && (
                <span className={\`text-xs font-black px-2 py-0.5 rounded-full \${timeLeft <= 10 && isTimerRunning ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'}\`}>
                  ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              )}`;
code = code.replace(oldHeaderTimer, '');

const oldArenaTimer = `          {matchDuration > 0 && isExpandedFullscreen && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
               <span className={\`text-sm sm:text-base md:text-lg font-black px-4 py-1 sm:py-1.5 rounded-full shadow-md backdrop-blur-md \${timeLeft <= 10 && isTimerRunning ? 'bg-rose-500/90 text-white animate-pulse shadow-rose-200' : 'bg-white/90 text-slate-700 border border-slate-200'}\`}>
                 ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </span>
            </div>
          )}`;
code = code.replace(oldArenaTimer, '');

// Now insert it in the top of the arena, outside of conditions, but checking matchDuration > 0
const arenaTopStr = `          {/* Dedicated Full Screen Button (Icon full Screen ដាច់ដោយឡែក) */}`;
const newArenaTimer = `          {/* Giant Timer always visible at the top of arena */}
          {matchDuration > 0 && (
            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
               <div className={\`flex items-center gap-2 px-5 py-2 rounded-2xl shadow-lg border-2 backdrop-blur-md transition-colors \${
                 timeLeft <= 10 && isTimerRunning 
                   ? 'bg-rose-600/90 text-white border-rose-400 animate-pulse shadow-rose-500/50' 
                   : 'bg-slate-900/80 text-white border-slate-700'
               }\`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={\`\${timeLeft <= 10 ? 'text-white' : 'text-emerald-400'}\`}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 <span className="text-xl sm:text-3xl font-black font-mono tracking-widest drop-shadow-md">
                   {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
               </div>
            </div>
          )}

          {/* Dedicated Full Screen Button (Icon full Screen ដាច់ដោយឡែក) */}`;
code = code.replace(arenaTopStr, newArenaTimer);

fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
