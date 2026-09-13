const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');
const target = `            {/* Custom Background Image */}`;
const replace = `            {/* Flash Banner when a team answers correctly */}
            <AnimatePresence>
              {lastWinnerTeam && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={\`absolute top-2 left-1/2 -translate-x-1/2 font-black text-sm sm:text-base md:text-lg text-white px-4 py-1.5 rounded-full shadow-lg z-50 \${
                    lastWinnerTeam === 'team1' ? 'bg-sky-600/90' : 'bg-rose-600/90'
                  }\`}
                >
                  {lastWinnerTeam === 'team1' ? '🎉 ក្រុមទី ១ ឆ្លើយត្រូវ! (+1)' : '🎉 ក្រុមទី ២ ឆ្លើយត្រូវ! (+1)'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom Background Image */}`;
code = code.replace(target, replace);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
