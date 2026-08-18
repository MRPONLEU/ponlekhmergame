import React from 'react';
import { DEFAULT_NAMES } from '../data';
import { 
  ArrowLeft, 
  Play, 
  Trash2, 
  Plus, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
  Volume2,
  Maximize2,
  Minimize2,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playWinSound } from '../utils/audio';
import * as XLSX from 'xlsx';

interface SpinnerProps {
  onBack: () => void;
}

export default function Spinner({ onBack }: SpinnerProps) {
  const [names, setNames] = React.useState<string[]>(DEFAULT_NAMES);
  const [nameInput, setNameInput] = React.useState('');
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [winner, setWinner] = React.useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const toggleFullScreen = () => {
    playClickSound();
    setIsFullScreen(!isFullScreen);
  };

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rotationAngleRef = React.useRef(0);
  const spinVelocityRef = React.useRef(0);
  const animationFrameRef = React.useRef<number | null>(null);

  // Vibrant, colorful and attractive palette for wheel segments
  const colors = [
    '#FF3B30', // Vibrant Red
    '#FF9500', // Vibrant Orange
    '#FFCC00', // Bright Yellow
    '#34C759', // Vibrant Green
    '#00C7BE', // Teal / Cyan
    '#32ADE6', // Light Blue
    '#007AFF', // Royal Blue
    '#5856D6', // Purple
    '#AF52DE', // Violet
    '#FF2D55', // Pink / Magenta
    '#00B0FF', // Sky Blue
    '#FF6B6B', // Coral Red
  ];

  const drawWheel = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    const len = names.length;
    if (len === 0) {
      // Draw empty placeholder
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#F9F7F2';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#E4DFD5';
      ctx.stroke();
      
      ctx.fillStyle = '#8A8A8A';
      ctx.font = 'bold 16px "Kantumruy Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('សូមបញ្ជូលឈ្មោះសិស្ស', centerX, centerY);
      return;
    }

    const anglePerSegment = (2 * Math.PI) / len;

    // Draw wheel segments
    for (let i = 0; i < len; i++) {
      const startAngle = rotationAngleRef.current + i * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Fill with vibrant colors
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Draw segment borders
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      // rotate to center of segment
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      // Crisp white text with shadow for high contrast & attractive look
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Adjust font size based on number of items and full screen state
      let baseFontSize = len > 15 ? 11 : len > 10 ? 13 : 15;
      if (isFullScreen) {
        baseFontSize = 40; // Requested size for full screen
      }
      ctx.font = `bold ${baseFontSize}px "Kantumruy Pro", sans-serif`;
      
      // Draw label slightly in from edge
      ctx.fillText(names[i], radius - (isFullScreen ? 50 : 25), 0);
      ctx.restore();
    }

    // Draw center peg / button
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#889E73';
    ctx.stroke();

    // Draw inner decorative circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#889E73';
    ctx.fill();

    // Draw top pointer arrow (pointing down into the wheel at 12 o'clock)
    ctx.save();
    ctx.translate(centerX, 15);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, -18);
    ctx.lineTo(12, -18);
    ctx.closePath();
    ctx.fillStyle = '#CF7E53';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }, [names, isFullScreen]);

  // Redraw whenever names change
  React.useEffect(() => {
    drawWheel();
  }, [names, drawWheel]);

  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    playClickSound();
    setNames(prev => [...prev, nameInput.trim()]);
    setNameInput('');
  };

  const handleRemoveName = (index: number) => {
    playClickSound();
    setNames(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearNames = () => {
    playClickSound();
    setNames([]);
  };

  const handleSpin = () => {
    if (isSpinning || names.length === 0) return;
    playClickSound();
    setIsSpinning(true);
    setWinner(null);

    // Initial spin speed: large random starting velocity
    spinVelocityRef.current = Math.random() * 0.25 + 0.35;

    let lastTickSegment = -1;

    const animate = () => {
      // Rotate the wheel
      rotationAngleRef.current += spinVelocityRef.current;
      
      // Apply deceleration (friction)
      spinVelocityRef.current *= 0.982;

      // Play tick sound when segment passes pointer (at top: 3 * Math.PI / 2)
      const len = names.length;
      const anglePerSegment = (2 * Math.PI) / len;
      // Normalise rotation angle to 0 - 2PI
      const normalizedAngle = (rotationAngleRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      
      // The pointer is at 12 o'clock, which corresponds to angle 1.5 * PI (or 270 degrees) relative to the wheel
      // Let's compute which segment is currently aligned with the pointer
      const pointerAngle = (1.5 * Math.PI - normalizedAngle + 4 * Math.PI) % (2 * Math.PI);
      const currentSegment = Math.floor(pointerAngle / anglePerSegment) % len;

      if (currentSegment !== lastTickSegment) {
        lastTickSegment = currentSegment;
        playClickSound();
      }

      // Redraw wheel
      drawWheel();

      if (spinVelocityRef.current > 0.001) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Stopped!
        setIsSpinning(false);
        spinVelocityRef.current = 0;

        // Final calculation of winner
        const finalWinner = names[currentSegment];
        setWinner(finalWinner);
        playWinSound();
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      
      const importedNames = data
        .flat()
        .map(name => String(name).trim())
        .filter(name => name.length > 0 && name !== 'undefined' && name !== 'null');

      if (importedNames.length > 0) {
        setNames(prev => {
          const newNames = [...prev, ...importedNames];
          return Array.from(new Set(newNames)); // Remove duplicates
        });
      }
    };
    reader.readAsBinaryString(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
    }
  };

  // Cleanup anim on unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header bar */}
        <div className="flex items-center justify-between mb-10 border-b border-border-beige pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { playClickSound(); onBack(); }}
              id="btn-back-dashboard"
              className="p-3 bg-white hover:bg-stone-bg border border-border-beige rounded-full shadow-sm transition-all text-charcoal hover:text-black cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">កងបង្វិលសំណួរ</h1>
              <p className="text-soft-gray text-sm mt-0.5 font-semibold">បង្វិលកងដើម្បីជ្រើសរើសឈ្មោះសិស្ស ឬសួរសំណួរដោយចៃដន្យ</p>
            </div>
          </div>
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Wheel column */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Spinning Canvas */}
            <div className={isFullScreen ? "fixed inset-0 z-[999] bg-stone-bg/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm overflow-hidden" : "relative bg-white rounded-[32px] p-6 sm:p-10 border border-border-beige soft-shadow flex flex-col items-center justify-center w-full max-w-[420px] aspect-square"}>
              <div className={isFullScreen ? "relative flex flex-col items-center justify-center w-full max-w-[80vh] aspect-square" : "relative w-full h-full flex flex-col items-center justify-center"}>
                <button
                  onClick={toggleFullScreen}
                  id="btn-zoom-wheel"
                  className={`absolute ${isFullScreen ? 'top-[-40px] right-0 sm:top-0 sm:right-[-60px]' : 'top-0 right-0 sm:-top-4 sm:-right-4'} z-20 p-2.5 bg-stone-bg hover:bg-border-beige border border-border-beige rounded-xl shadow-sm transition-all text-charcoal hover:text-black cursor-pointer flex items-center gap-1.5 font-bold text-xs`}
                  title={isFullScreen ? "បង្រួមកង" : "ពង្រីកកង"}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  <span className={isFullScreen ? "hidden" : "hidden sm:inline"}>{isFullScreen ? "បង្រួម" : "ពង្រីកកង"}</span>
                </button>

                <canvas
                  ref={canvasRef}
                  width={isFullScreen ? 800 : 360}
                  height={isFullScreen ? 800 : 360}
                  className="max-w-full aspect-square relative"
                />

                {/* Big Central Trigger Button overlay on peg */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || names.length === 0}
                  id="btn-spin-wheel"
                  className={`absolute bg-sage hover:bg-[#768a63] disabled:bg-stone-bg text-white rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center font-bold text-xs select-none uppercase tracking-wide cursor-pointer ${isFullScreen ? 'w-24 h-24 text-lg' : 'w-14 h-14'}`}
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                >
                  {isSpinning ? "វិល..." : <Play size={isFullScreen ? 32 : 18} fill="currentColor" />}
                </button>
              </div>
            </div>
          </div>

          {/* Names management column */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-[32px] p-6 border border-border-beige soft-shadow flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-charcoal">បញ្ជីឈ្មោះ / សំណួរ ({names.length})</h3>
                {names.length > 0 && (
                  <button
                    onClick={handleClearNames}
                    id="btn-clear-names"
                    className="text-xs font-bold text-clay hover:underline cursor-pointer"
                  >
                    លុបទាំងអស់
                  </button>
                )}
              </div>

              {/* Add name form */}
              <form onSubmit={handleAddName} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="ឧ. សុខា, ពិសិដ្ឋ..."
                  className="flex-1 px-4 py-2.5 border border-border-beige bg-[#F9F7F2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage/15 focus:border-sage transition-all text-charcoal"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-sage hover:bg-[#768a63] text-white font-bold rounded-xl text-sm flex items-center justify-center transition-all cursor-pointer"
                >
                  <Plus size={16} />
                </button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="នាំចូលពី Excel"
                  />
                  <button
                    type="button"
                    className="px-4 py-2.5 bg-[#F9F7F2] border border-border-beige hover:bg-stone-bg text-charcoal font-bold rounded-xl text-sm flex items-center justify-center transition-all pointer-events-none"
                    title="នាំចូលពី Excel"
                  >
                    <Upload size={16} />
                  </button>
                </div>
              </form>

              {/* List scrollbar */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
                {names.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-soft-gray">
                    <HelpCircle size={36} className="text-border-beige mb-2" />
                    <p className="text-xs font-bold">មិនទាន់មានឈ្មោះក្នុងបញ្ជីនៅឡើយទេ</p>
                  </div>
                ) : (
                  names.map((name, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-[#F9F7F2] border border-border-beige rounded-xl flex items-center justify-between gap-2 text-sm text-charcoal"
                    >
                      <span className="font-bold truncate">{name}</span>
                      <button
                        onClick={() => handleRemoveName(idx)}
                        className="p-1 text-soft-gray hover:text-clay hover:bg-clay/10 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-10 md:p-16 max-w-2xl w-full border border-border-beige soft-shadow flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Confetti decoration circles */}
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-sage via-sand to-clay" />
              
              <button
                onClick={() => { playClickSound(); setWinner(null); }}
                className="absolute top-6 right-6 p-3 text-soft-gray hover:text-charcoal hover:bg-stone-bg rounded-full transition-all cursor-pointer"
              >
                <X size={24} />
              </button>

              <div className="w-24 h-24 bg-sage/10 text-sage rounded-full flex items-center justify-center mb-8 animate-bounce shadow-sm">
                <Sparkles size={48} />
              </div>

              <span className="text-sm md:text-base font-bold text-sage bg-sage/10 px-5 py-2 rounded-full uppercase tracking-widest mb-6">
                លទ្ធផលដែលបានជ្រើសរើស
              </span>

              <h2 className="text-5xl md:text-7xl font-extrabold text-charcoal tracking-tight mb-8 px-6 py-8 bg-[#F9F7F2] border border-border-beige rounded-3xl w-full select-none">
                {winner}
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button
                  onClick={() => {
                    playClickSound();
                    if (winner) {
                      setNames(prev => prev.filter(n => n !== winner));
                    }
                    setWinner(null);
                  }}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-lg md:text-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 size={24} />
                  <span>ដកឈ្មោះចេញ</span>
                </button>
                <button
                  onClick={() => { playClickSound(); setWinner(null); }}
                  className="w-full py-4 bg-clay hover:bg-[#b86d47] text-white font-bold rounded-2xl text-lg md:text-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  យល់ព្រម
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
