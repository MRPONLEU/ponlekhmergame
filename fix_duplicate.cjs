const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const doubleBlock = `          {/* Giant Timer always visible at the top of arena */}
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
          {/* Giant Timer always visible at the top of arena */}
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
          )}`;

const singleBlock = `          {/* Giant Timer always visible at the top of arena */}
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
          )}`;

code = code.replace(doubleBlock, singleBlock);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
