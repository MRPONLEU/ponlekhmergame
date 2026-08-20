import React from 'react';
import { DEFAULT_NAMES } from '../data';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Sparkles, 
  HelpCircle, 
  X, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Upload, 
  Settings, 
  History, 
  Users, 
  Shuffle, 
  Award, 
  ListPlus, 
  Crown,
  RotateCcw,
  CheckCircle2,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playWinSound, playTickSound } from '../utils/audio';
import * as XLSX from 'xlsx';

interface SpinnerProps {
  onBack: () => void;
}

export interface SpinHistoryItem {
  id: string;
  name: string;
  time: string;
}

export default function Spinner({ onBack }: SpinnerProps) {
  // Wheel items
  const [names, setNames] = React.useState<string[]>(DEFAULT_NAMES);
  const [nameInput, setNameInput] = React.useState('');
  const [bulkInput, setBulkInput] = React.useState('');
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [winner, setWinner] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);
  const [spinDuration, setSpinDuration] = React.useState<'normal' | 'fast' | 'slow'>('normal');
  const [wheelFontSize, setWheelFontSize] = React.useState<number>(100); // 50% to 200%

  // Modals / Drawers
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isNamesDrawerOpen, setIsNamesDrawerOpen] = React.useState(false);
  const [history, setHistory] = React.useState<SpinHistoryItem[]>([]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement | null>(null);
  const rotationAngleRef = React.useRef(0);
  const spinVelocityRef = React.useRef(0);
  const animationFrameRef = React.useRef<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (soundEnabled) playClickSound();
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (err) {
        console.log("Fullscreen request error:", err);
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (err) {
        console.log("Exit fullscreen error:", err);
      }
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Vibrant Palette matching the reference image (Hot Pink, Purple, Orange, Red, Magenta, Green, Yellow, Cyan)
  const colors = [
    '#FF2A6D', // Hot Pink
    '#9333EA', // Vibrant Purple / Violet
    '#F97316', // Vibrant Orange
    '#EF4444', // Bright Red
    '#C026D3', // Magenta / Fuchsia
    '#10B981', // Bright Green
    '#FACC15', // Bright Yellow
    '#06B6D4', // Cyan / Sky Blue
    '#3B82F6', // Royal Blue
    '#8B5CF6', // Indigo / Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
  ];

  // Draw the high quality wheel exactly matching image.png
  const drawWheel = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Calculate dimensions
    const outerRadius = Math.min(centerX, centerY) - 8;
    const bezelThickness = outerRadius * 0.12; // Navy outer ring width
    const innerRadius = outerRadius - bezelThickness; // Segment radius
    const hubRadius = innerRadius * 0.28; // Center SPIN button radius

    const len = names.length;

    // 1. Draw Outer Navy Bezel Ring (Matching image.png dark blue outer border)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a'; // Deep Navy Slate
    ctx.fill();

    // Subtle outer border highlight
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3b82f6'; // Bright blue edge highlight
    ctx.stroke();

    // Inner shadow of the bezel
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.restore();

    // 2. Draw Wheel Segments
    if (len === 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 22px "Kantumruy Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('សូមបញ្ជូលឈ្មោះសិស្ស', centerX, centerY);
      ctx.restore();
    } else {
      const anglePerSegment = (2 * Math.PI) / len;

      for (let i = 0; i < len; i++) {
        const startAngle = rotationAngleRef.current + i * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;

        // Draw Wedge
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // White Divider Lines between wedges
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();

        // Draw Text inside Wedge
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Dynamic font size based on item count, canvas size, and font size setting (supports up to 200%)
        let baseFontSize = Math.max(13, Math.min(28, Math.floor((innerRadius * 0.65) / Math.max(8, len * 0.7))));
        if (len <= 8) baseFontSize = Math.floor(innerRadius * 0.11);
        if (len <= 4) baseFontSize = Math.floor(innerRadius * 0.14);

        const fontScale = (wheelFontSize || 100) / 100;
        const fontSize = Math.max(10, Math.round(baseFontSize * fontScale));

        ctx.font = `900 ${fontSize}px "Kantumruy Pro", sans-serif`;
        
        // Text padding from outer edge
        const textOffset = innerRadius - (innerRadius * 0.12);
        ctx.fillText(names[i], textOffset, 0);
        ctx.restore();
      }
    }

    // 3. Draw Golden Glowing Carnival Light Bulbs on the Navy Bezel Ring
    const numBulbs = Math.max(12, Math.min(20, Math.round(len * 2) || 14));
    const bulbDistance = outerRadius - (bezelThickness / 2);
    const bulbRadius = Math.max(4, bezelThickness * 0.22);

    for (let b = 0; b < numBulbs; b++) {
      const bulbAngle = (b * (2 * Math.PI)) / numBulbs;
      const bx = centerX + bulbDistance * Math.cos(bulbAngle);
      const by = centerY + bulbDistance * Math.sin(bulbAngle);

      ctx.save();
      // Outer soft glow
      ctx.beginPath();
      ctx.arc(bx, by, bulbRadius * 1.8, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.fill();

      // Golden Bulb Body
      ctx.beginPath();
      ctx.arc(bx, by, bulbRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#fef08a'; // Bright pastel warm yellow
      ctx.fill();

      // Shiny center pinpoint
      ctx.beginPath();
      ctx.arc(bx, by, bulbRadius * 0.45, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw Center Dark Navy Hub ("SPIN" Button)
    ctx.save();
    // Drop shadow under hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0f1d';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Hub rim border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1e3a8a';
    ctx.stroke();

    // Center "បង្វិល" Text (Bold White)
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 3;
    ctx.font = `900 ${Math.floor(hubRadius * 0.40)}px "Kantumruy Pro", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('បង្វិល', centerX, centerY);
    ctx.restore();

    // 5. Draw Top Golden Pointer (Pointing Downwards at 12 o'clock, matching image.png)
    ctx.save();
    const pointerTopY = centerY - outerRadius - 4;
    const pointerTipY = centerY - innerRadius + 14;
    const pointerHalfWidth = bezelThickness * 0.9;

    ctx.beginPath();
    ctx.moveTo(centerX - pointerHalfWidth, pointerTopY);
    ctx.lineTo(centerX + pointerHalfWidth, pointerTopY);
    ctx.lineTo(centerX, pointerTipY);
    ctx.closePath();

    // Golden gradient fill
    const ptrGrad = ctx.createLinearGradient(centerX - pointerHalfWidth, pointerTopY, centerX + pointerHalfWidth, pointerTipY);
    ptrGrad.addColorStop(0, '#fde047');
    ptrGrad.addColorStop(0.5, '#eab308');
    ptrGrad.addColorStop(1, '#ca8a04');

    ctx.fillStyle = ptrGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Pointer fold accent (Top folded ribbon look)
    ctx.beginPath();
    ctx.moveTo(centerX - pointerHalfWidth, pointerTopY);
    ctx.lineTo(centerX + pointerHalfWidth, pointerTopY);
    ctx.lineTo(centerX + pointerHalfWidth * 0.8, pointerTopY - 8);
    ctx.lineTo(centerX - pointerHalfWidth * 0.8, pointerTopY - 8);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.stroke();
    ctx.restore();

  }, [names, colors, wheelFontSize]);

  // Handle ResizeObserver to keep canvas razor sharp at 2x resolution
  React.useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !container) return;
      const size = Math.min(container.clientWidth, container.clientHeight, 700);
      if (size > 50) {
        canvas.width = size * 2;
        canvas.height = size * 2;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        drawWheel();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [drawWheel, isFullscreen]);

  // Redraw when names change
  React.useEffect(() => {
    drawWheel();
  }, [names, drawWheel]);

  // Spin Engine
  const handleSpin = () => {
    if (isSpinning || names.length === 0) return;
    if (soundEnabled) playClickSound();
    setIsSpinning(true);
    setWinner(null);

    // Initial spin speed: based on duration setting
    const baseSpeed = spinDuration === 'fast' ? 0.35 : spinDuration === 'slow' ? 0.55 : 0.45;
    spinVelocityRef.current = Math.random() * 0.15 + baseSpeed;
    const friction = spinDuration === 'fast' ? 0.975 : spinDuration === 'slow' ? 0.988 : 0.983;

    let lastTickSegment = -1;

    const animate = () => {
      rotationAngleRef.current += spinVelocityRef.current;
      spinVelocityRef.current *= friction;

      const len = names.length;
      const anglePerSegment = (2 * Math.PI) / len;
      const normalizedAngle = (rotationAngleRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      
      // Pointer is at 12 o'clock (1.5 * PI)
      const pointerAngle = (1.5 * Math.PI - normalizedAngle + 4 * Math.PI) % (2 * Math.PI);
      const currentSegment = Math.floor(pointerAngle / anglePerSegment) % len;

      if (currentSegment !== lastTickSegment) {
        lastTickSegment = currentSegment;
        if (soundEnabled) playTickSound();
      }

      drawWheel();

      if (spinVelocityRef.current > 0.0015) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin complete!
        setIsSpinning(false);
        spinVelocityRef.current = 0;

        const finalWinner = names[currentSegment];
        setWinner(finalWinner);
        if (soundEnabled) playWinSound();

        // Record history
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        setHistory(prev => [
          {
            id: `spin_${Date.now()}`,
            name: finalWinner,
            time: timeStr
          },
          ...prev.slice(0, 49) // Keep last 50
        ]);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Name management
  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    if (soundEnabled) playClickSound();
    setNames(prev => [...prev, nameInput.trim()]);
    setNameInput('');
  };

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    if (soundEnabled) playClickSound();
    const newItems = bulkInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (newItems.length > 0) {
      setNames(prev => Array.from(new Set([...prev, ...newItems])));
      setBulkInput('');
    }
  };

  const handleRemoveName = (index: number) => {
    if (soundEnabled) playClickSound();
    setNames(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleShuffle = () => {
    if (soundEnabled) playClickSound();
    setNames(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleResetDefault = () => {
    if (soundEnabled) playClickSound();
    setNames(DEFAULT_NAMES);
  };

  const handleClearNames = () => {
    if (soundEnabled) playClickSound();
    setNames([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (soundEnabled) playClickSound();

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
          return Array.from(new Set(newNames));
        });
      }
    };
    reader.readAsBinaryString(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className={`font-sans transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-gradient-to-b from-[#3b0764] via-[#2e1065] to-[#1e0538] flex flex-col w-screen h-screen m-0 p-2 sm:p-3 md:p-4 overflow-hidden' 
        : 'min-h-screen bg-transparent py-2 px-2 sm:px-4 lg:px-6 flex flex-col justify-start'
    }`}>
      <div className="w-full h-full flex flex-col flex-1 min-h-0 justify-start gap-2.5 sm:gap-3.5">
        
        {/* PURPLE GRADIENT NAVIGATION BAR - DEDICATED FOR STUDENT RANDOM PICKER */}
        <div className="w-full bg-gradient-to-r from-[#581c87] via-[#4c1d95] to-[#3b0764] py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl sm:rounded-3xl border border-purple-400/30 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white shrink-0">
          
          {/* LEFT: Student Picker Badge & Counter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-amber-50/95 text-slate-800 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-xl border border-amber-300 flex items-center gap-3">
              <span className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-purple-950 shadow-xs flex items-center gap-2">
                <span>🎯 កងបង្វិលចាប់ឈ្មោះសិស្ស</span>
              </span>
              <div className="bg-slate-100/95 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-inner flex items-center gap-2">
                <Users size={18} className="text-purple-700" />
                <span className="text-sm sm:text-base font-black text-purple-950">
                  សិស្សក្នុងកង៖ <span className="text-emerald-700 font-black">{names.length}</span> នាក់
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Action Controls (Manage Names, Shuffle, History, Settings, Fullscreen, Close) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Manage Names Button */}
            <button
              onClick={() => {
                if (soundEnabled) playClickSound();
                setIsNamesDrawerOpen(true);
              }}
              className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white hover:bg-amber-50 text-purple-950 font-black rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2 text-xs sm:text-sm"
              title="គ្រប់គ្រងបញ្ជីឈ្មោះ"
            >
              <ListPlus size={19} className="text-purple-950" />
              <span>បញ្ជីឈ្មោះ ({names.length})</span>
            </button>

            {/* Shuffle Names Button */}
            <button
              onClick={handleShuffle}
              disabled={isSpinning || names.length === 0}
              className="p-3 sm:p-3.5 bg-white hover:bg-amber-50 text-purple-950 rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              title="ច្របល់ឈ្មោះចៃដន្យ"
            >
              <Shuffle size={20} className="text-purple-950" />
            </button>

            {/* History of Picked Students */}
            <button
              onClick={() => {
                if (soundEnabled) playClickSound();
                setIsHistoryOpen(!isHistoryOpen);
              }}
              className="p-3 sm:p-3.5 bg-white hover:bg-amber-50 text-purple-950 rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95 relative"
              title="ប្រវត្តិសិស្សដែលបានហៅ"
            >
              <History size={20} className="text-purple-950" />
              {history.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-pink-500 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {history.length}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                if (soundEnabled) playClickSound();
                setIsSettingsOpen(true);
              }}
              className="p-3 sm:p-3.5 bg-white hover:bg-amber-50 text-purple-950 rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="ការកំណត់កងបង្វិល"
            >
              <Settings size={20} className="text-purple-950" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-3 sm:p-3.5 bg-white hover:bg-amber-50 text-purple-950 rounded-2xl shadow-md border border-purple-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title={isFullscreen ? "បង្រួមអេក្រង់" : "ពេញអេក្រង់"}
            >
              {isFullscreen ? <Minimize size={20} className="text-purple-950" /> : <Maximize size={20} className="text-purple-950" />}
            </button>

            {/* Exit/Back Button */}
            <button
              onClick={() => { if (soundEnabled) playClickSound(); onBack(); }}
              id="btn-back-dashboard"
              className="p-3 sm:p-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl border border-rose-300/40 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="ចាកចេញ"
            >
              <X size={20} />
            </button>
          </div>

        </div>

        {/* MAIN STAGE CARD: VIOLET RADIAL SUNBURST BACKDROP LIKE IMAGE.PNG */}
        <div className={`relative rounded-3xl sm:rounded-[36px] overflow-hidden shadow-2xl border-2 border-purple-500/30 bg-gradient-to-b from-[#6b21a8] via-[#4c1d95] to-[#2e1065] text-white flex flex-col items-center justify-center ${
          isFullscreen 
            ? 'flex-1 h-full w-full min-h-0 p-2 sm:p-4' 
            : 'min-h-[560px] sm:min-h-[640px] flex-1 p-4 sm:p-6'
        }`}>
          
          {/* Violet Radial Sunburst Rays in Background (Matching image.png sunburst) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <div 
              className="absolute inset-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.25)_0%,_rgba(168,85,247,0.15)_30%,_transparent_70%)] animate-pulse" 
              style={{ animationDuration: '4s' }}
            />
            {/* Triangular Sunburst Ray Cones */}
            <div 
              className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg,_rgba(255,255,255,0.08)_0deg_15deg,_transparent_15deg_30deg)]"
            />
          </div>

          {/* Floating Sparkles Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-8 left-12 w-3 h-3 rounded-full bg-amber-300 animate-ping" />
            <div className="absolute top-20 right-16 w-2.5 h-2.5 rounded-full bg-pink-400 animate-bounce" />
            <div className="absolute bottom-16 left-20 w-3.5 h-3.5 rounded-full bg-cyan-300 animate-pulse" />
            <div className="absolute bottom-12 right-16 w-3 h-3 rounded-full bg-yellow-200 animate-ping" />
          </div>

          {/* CENTER STAGE: THE WHEEL */}
          <div 
            ref={canvasContainerRef} 
            className="relative z-10 w-full flex-1 min-h-0 flex flex-col items-center justify-center max-w-[620px] max-h-[620px] aspect-square p-2"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onClick={handleSpin}
                className="cursor-pointer max-w-full max-h-full aspect-square drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] active:scale-[0.99] transition-transform select-none"
              />

              {/* Click-to-spin central trigger button directly on top of the hub */}
              <button
                onClick={handleSpin}
                disabled={isSpinning || names.length === 0}
                id="btn-spin-wheel-center"
                className="absolute z-20 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full cursor-pointer opacity-0"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                title="ចុចដើម្បីបង្វិល"
              >
                បង្វិល
              </button>
            </div>
          </div>

          {/* Bottom Fast Action Controls Pill */}
          <div className="relative z-20 mt-2 flex items-center gap-3">
            <button
              onClick={handleSpin}
              disabled={isSpinning || names.length === 0}
              id="btn-spin-wheel-bottom"
              className="px-8 py-3.5 sm:px-10 sm:py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-purple-950 font-black text-lg sm:text-xl rounded-full shadow-2xl border-2 border-yellow-200 transition-all cursor-pointer flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={22} className="fill-purple-950" />
              <span>{isSpinning ? "កំពុងវិល..." : "បង្វិលកង"}</span>
            </button>

            <button
              onClick={handleShuffle}
              disabled={isSpinning || names.length === 0}
              className="p-3.5 sm:p-4 bg-purple-900/60 hover:bg-purple-800/80 active:scale-95 text-white rounded-full border border-purple-400/40 shadow-lg transition-all cursor-pointer"
              title="ច្របល់ឈ្មោះចៃដន្យ"
            >
              <Shuffle size={20} />
            </button>
          </div>

        </div>

      </div>

      {/* WINNER CELEBRATION MODAL - DEDICATED FOR STUDENT RANDOM PICK */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-[#4c1d95] via-[#3b0764] to-[#1e0538] rounded-[36px] p-6 sm:p-10 max-w-xl w-full border-4 border-amber-400 shadow-2xl flex flex-col items-center text-center relative overflow-hidden text-white"
            >
              {/* Confetti Ribbon */}
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400" />
              
              <button
                onClick={() => { if (soundEnabled) playClickSound(); setWinner(null); }}
                className="absolute top-5 right-5 p-2.5 text-purple-200 hover:text-white bg-purple-900/40 hover:bg-purple-800/60 rounded-full transition-all cursor-pointer"
              >
                <X size={22} />
              </button>

              {/* Trophy / Crown Avatar */}
              <div className="w-22 h-22 sm:w-26 sm:h-26 bg-gradient-to-br from-amber-300 to-yellow-500 text-purple-950 rounded-full flex items-center justify-center mb-5 animate-bounce shadow-2xl border-4 border-white/60">
                <Crown size={48} className="fill-purple-950" />
              </div>

              <span className="text-xs sm:text-sm font-black text-amber-300 bg-amber-400/20 border border-amber-400/40 px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">
                🎉 សិស្សដែលត្រូវឡើងឆ្លើយសំណួរ 🎉
              </span>

              <p className="text-xs sm:text-sm text-purple-200 font-semibold mb-4">
                សូមអញ្ជើញសិស្សដែលមានឈ្មោះខាងក្រោមឡើងឆ្លើយ ៖
              </p>

              {/* Student Name Card */}
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-8 px-6 py-6 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-3xl w-full shadow-inner select-none drop-shadow-md">
                {winner}
              </h2>

              {/* Bottom Actions: Remove Name or Keep and Spin Next */}
              <div className="flex flex-col sm:flex-row gap-3.5 w-full">
                <button
                  onClick={() => {
                    if (soundEnabled) playClickSound();
                    if (winner) {
                      setNames(prev => prev.filter(n => n !== winner));
                    }
                    setWinner(null);
                  }}
                  className="flex-1 py-4 px-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-sm sm:text-base shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-rose-400/40"
                  title="ដកឈ្មោះសិស្សរូបនេះចេញពីកង ដើម្បីកុំឱ្យបង្វិលត្រូវម្ដងទៀត"
                >
                  <Trash2 size={18} />
                  <span>ដកឈ្មោះចេញពីកង</span>
                </button>

                <button
                  onClick={() => { if (soundEnabled) playClickSound(); setWinner(null); }}
                  className="flex-1 py-4 px-5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-purple-950 font-black rounded-2xl text-sm sm:text-base shadow-lg transition-all active:scale-95 cursor-pointer border border-yellow-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} className="text-purple-950" />
                  <span>រក្សាទុក & បង្វិលបន្ត</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANAGE NAMES DRAWER / MODAL */}
      <AnimatePresence>
        {isNamesDrawerOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh] text-slate-800 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                    <Users size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-purple-950">បញ្ជីឈ្មោះសិស្ស ({names.length})</h3>
                    <p className="text-xs text-slate-500 font-semibold">បន្ថែមឈ្មោះ នាំចូល Excel ឬលុបឈ្មោះតាមចិត្ត</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNamesDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Add Single Name */}
              <form onSubmit={handleAddName} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="វាយបញ្ចូលឈ្មោះសិស្ស..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 text-slate-800 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-sm flex items-center justify-center transition-all cursor-pointer shadow-md"
                >
                  <Plus size={18} />
                </button>
              </form>

              {/* Bulk Add Box */}
              <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100 mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-purple-900">បញ្ចូលឈ្មោះច្រើនក្នុងពេលតែមួយ (បិទភ្ជាប់) ៖</span>
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
                      className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs pointer-events-none"
                    >
                      <Upload size={13} />
                      <span>នាំចូល Excel</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="ឧ. សុខា, ពិសិដ្ឋ, បូរមី, ទេវី..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {bulkInput.trim().length > 0 && (
                  <button
                    onClick={handleBulkAdd}
                    className="mt-2 w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    បន្ថែមឈ្មោះទាំងអស់នេះ
                  </button>
                )}
              </div>

              {/* Names List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[140px] max-h-[220px]">
                {names.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <HelpCircle size={32} className="mb-2 text-slate-300" />
                    <p className="text-xs font-bold">មិនទាន់មានឈ្មោះក្នុងបញ្ជីនៅឡើយទេ</p>
                  </div>
                ) : (
                  names.map((name, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-sm text-slate-800"
                    >
                      <span className="font-bold truncate text-xs sm:text-sm">{idx + 1}. {name}</span>
                      <button
                        onClick={() => handleRemoveName(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Tools */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs font-bold mt-2">
                <button
                  onClick={handleResetDefault}
                  className="text-purple-700 hover:underline cursor-pointer"
                >
                  ផ្ទុកឈ្មោះលំនាំដើម
                </button>
                <button
                  onClick={handleClearNames}
                  className="text-rose-600 hover:underline cursor-pointer"
                >
                  លុបឈ្មោះទាំងអស់
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col text-slate-800 relative space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                    <Settings size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-purple-950">ការកំណត់កងបង្វិល</h3>
                    <p className="text-xs text-slate-500 font-semibold">កែប្រែល្បឿន ទំហំអក្សរ និងសំឡេង</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Font Size Setting (Supports 50% up to 200%) */}
              <div className="space-y-3 bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Type size={16} className="text-purple-700" />
                    <span>ទំហំអក្សរឈ្មោះក្នុងកង</span>
                  </label>
                  <span className="text-xs font-black text-purple-950 bg-amber-300 border border-amber-400 px-2.5 py-0.5 rounded-lg shadow-xs">
                    {wheelFontSize}%
                  </span>
                </div>

                {/* Range Slider from 50% to 200% */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playClickSound();
                      setWheelFontSize(prev => Math.max(50, prev - 10));
                    }}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-purple-100 text-purple-950 border border-purple-200 font-black text-sm flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="បន្ថយទំហំ"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={wheelFontSize}
                    onChange={(e) => setWheelFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playClickSound();
                      setWheelFontSize(prev => Math.min(200, prev + 10));
                    }}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-purple-100 text-purple-950 border border-purple-200 font-black text-sm flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="បង្កើនទំហំ"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets: 75%, 100%, 130%, 160%, 200% */}
                <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                  {[
                    { value: 75, label: 'តូច', scale: '75%' },
                    { value: 100, label: 'ធម្មតា', scale: '100%' },
                    { value: 130, label: 'ធំ', scale: '130%' },
                    { value: 160, label: 'ធំខ្លាំង', scale: '160%' },
                    { value: 200, label: 'ធំបំផុត', scale: '200%' }
                  ].map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        if (soundEnabled) playClickSound();
                        setWheelFontSize(preset.value);
                      }}
                      className={`py-1.5 px-0.5 rounded-xl font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${
                        wheelFontSize === preset.value
                          ? 'bg-purple-700 text-white border-purple-700 shadow-sm ring-2 ring-purple-300'
                          : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100 hover:text-purple-900'
                      }`}
                    >
                      <span className="text-[11px] font-black">{preset.label}</span>
                      <span className="text-[9px] opacity-80">{preset.scale}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spin Speed */}
              <div className="space-y-2">
                <label className="text-xs font-black text-purple-950 uppercase tracking-wider">ល្បឿនបង្វិលកង</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'fast', label: 'លឿន' },
                    { id: 'normal', label: 'មធ្យម' },
                    { id: 'slow', label: 'យឺត' }
                  ].map(spd => (
                    <button
                      key={spd.id}
                      onClick={() => { if (soundEnabled) playClickSound(); setSpinDuration(spd.id as any); }}
                      className={`py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        spinDuration === spd.id
                          ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 size={18} className="text-purple-700" /> : <VolumeX size={18} className="text-slate-400" />}
                  <span className="text-xs font-bold text-slate-800">សំឡេងបង្វិល និងសំឡេងជ័យជម្នះ</span>
                </div>
                <button
                  onClick={() => { setSoundEnabled(!soundEnabled); }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Quick Reset Names */}
              <button
                onClick={() => {
                  handleResetDefault();
                  setIsSettingsOpen(false);
                }}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} />
                <span>ផ្ទុកបញ្ជីឈ្មោះសិស្សលំនាំដើម</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY OF CALLED STUDENTS DRAWER / MODAL */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col max-h-[80vh] text-slate-800 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-pink-100 text-pink-700 rounded-2xl">
                    <History size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-purple-950">ប្រវត្តិសិស្សដែលបានហៅ</h3>
                    <p className="text-xs text-slate-500 font-semibold">ឈ្មោះដែលបានបង្វិលចំពីមុន</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Award size={36} className="mb-2 text-slate-300" />
                    <p className="text-xs font-bold">មិនទាន់មានប្រវត្តិបង្វិលនៅឡើយទេ</p>
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-900 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-extrabold text-purple-950 text-sm">{item.name}</p>
                          <span className="text-[10px] text-purple-600 font-bold">ម៉ោង {item.time}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-purple-200/80 text-purple-900 rounded-lg text-xs font-bold">
                        បានហៅ
                      </span>
                    </div>
                  ))
                )}
              </div>

              {history.length > 0 && (
                <div className="pt-3 border-t border-slate-100 mt-3">
                  <button
                    onClick={() => {
                      if (soundEnabled) playClickSound();
                      setHistory([]);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    លុបប្រវត្តិទាំងអស់
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
