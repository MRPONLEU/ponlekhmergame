const fs = require('fs');
let code = fs.readFileSync('src/components/MathTugOfWar.tsx', 'utf8');
const target = `            </button>
          </div>
            {/* Background Lines & Markers */}`;
const replace = `            </button>
          </div>

          {/* Tug of War Interactive Stage */}
          <div className="flex-1 flex items-center justify-center relative min-h-[170px] sm:min-h-[220px] md:min-h-[260px] overflow-hidden">
            {/* Custom Background Image */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat pointer-events-none" 
              style={{ backgroundImage: "url('/images/background2.png')" }} 
            />

            {/* Background Lines & Markers */}`;
code = code.replace(target, replace);
fs.writeFileSync('src/components/MathTugOfWar.tsx', code);
