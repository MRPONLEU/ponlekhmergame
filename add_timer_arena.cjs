const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');

const arenaStart = `        <div 
          id="arena-tug-field"
          className={\`bg-white border-none rounded-none shadow-none flex flex-col justify-between overflow-hidden relative transition-all \${
            isExpandedFullscreen
              ? 'flex-1 min-h-[350px] p-0'
              : 'flex-1 min-h-[280px] sm:min-h-[340px] p-0'
          }\`}
        >
          {/* Dedicated Full Screen Button (Icon full Screen ដាច់ដោយឡែក) */}`;

const arenaWithTimer = `        <div 
          id="arena-tug-field"
          className={\`bg-white border-none rounded-none shadow-none flex flex-col justify-between overflow-hidden relative transition-all \${
            isExpandedFullscreen
              ? 'flex-1 min-h-[350px] p-0'
              : 'flex-1 min-h-[280px] sm:min-h-[340px] p-0'
          }\`}
        >
          {matchDuration > 0 && isExpandedFullscreen && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
               <span className={\`text-sm sm:text-base md:text-lg font-black px-4 py-1 sm:py-1.5 rounded-full shadow-md backdrop-blur-md \${timeLeft <= 10 && isTimerRunning ? 'bg-rose-500/90 text-white animate-pulse shadow-rose-200' : 'bg-white/90 text-slate-700 border border-slate-200'}\`}>
                 ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </span>
            </div>
          )}

          {/* Dedicated Full Screen Button (Icon full Screen ដាច់ដោយឡែក) */}`;

code = code.replace(arenaStart, arenaWithTimer);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
