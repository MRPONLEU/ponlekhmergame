import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Settings, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  Zap, 
  Hand, 
  Users, 
  Award, 
  RefreshCw, 
  Sliders, 
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  Flame,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { WordItem, Topic } from '../types';
import { playSuccessSound, playFailSound, playClickSound, playWinSound, speakText } from '../utils/audio';

interface WordGrabProps {
  words: WordItem[];
  topics: Topic[];
  activeTopicId: string;
  onBack: () => void;
}

interface Player {
  id: 1 | 2;
  name: string;
  score: number;
  color: string;
  glowColor: string;
  side: 'left' | 'right';
}

interface FloatingBubble {
  id: string;
  word: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  vx: number;
  vy: number;
  size: number;
  isTarget: boolean;
  colorClass: string;
  glowColor: string;
  scale: number;
  spawnTime: number;
}

interface HandPoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
  playerId: 1 | 2;
  isGrabbing: boolean;
}

export default function WordGrab({ words, topics, activeTopicId, onBack }: WordGrabProps) {
  // Game Setup & Players
  const [player1Name, setPlayer1Name] = useState<string>('សិស្សទី ១ (ខៀវ)');
  const [player2Name, setPlayer2Name] = useState<string>('សិស្សទី ២ (ក្រហម)');
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  
  // Game States: 'lobby' | 'countdown' | 'playing' | 'gameover'
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'playing' | 'gameover'>('lobby');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);

  // Game Options & Configuration
  const [gameMode, setGameMode] = useState<'target' | 'rush'>('target'); // 'target' = Catch Target Word, 'rush' = First to Catch any word
  const [targetScore, setTargetScore] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(60); // seconds
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [floatingSpeed, setFloatingSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [bubbleDensity, setBubbleDensity] = useState<number>(3); // 2, 3, or 4 simultaneous words
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [useFrontCamera, setUseFrontCamera] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Camera & Tracking Status
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStatusText, setAiStatusText] = useState<string>('កំពុងរៀបចំ AI ចាប់ចលនាដៃ...');

  // Game Play Dynamic Data
  const [currentTargetWord, setCurrentTargetWord] = useState<string>('');
  const [floatingBubbles, setFloatingBubbles] = useState<FloatingBubble[]>([]);
  const [grabEffects, setGrabEffects] = useState<{ id: number; x: number; y: number; text: string; color: string; player: 1 | 2 }[]>([]);

  // Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Real-time Hand tracking state kept in ref for 60fps loop
  const trackedHandsRef = useRef<HandPoint[]>([]);
  const bubblesRef = useRef<FloatingBubble[]>([]);
  const p1ScoreRef = useRef<number>(0);
  const p2ScoreRef = useRef<number>(0);
  const targetWordRef = useRef<string>('');
  const gameRunningRef = useRef<boolean>(false);
  const lastCatchTimeRef = useRef<number>(0);

  // Synchronize active words pool
  const wordList = React.useMemo(() => {
    if (words && words.length > 0) {
      return words.map(w => w.word.trim()).filter(Boolean);
    }
    return ['មាតុភូមិ', 'សិល្បៈ', 'វប្បធម៌', 'កុមារ', 'សាលារៀន', 'វិជ្ជា', 'សាមគ្គី', 'មិត្តភាព'];
  }, [words]);

  // Keep refs in sync
  useEffect(() => {
    bubblesRef.current = floatingBubbles;
  }, [floatingBubbles]);

  useEffect(() => {
    p1ScoreRef.current = p1Score;
  }, [p1Score]);

  useEffect(() => {
    p2ScoreRef.current = p2Score;
  }, [p2Score]);

  useEffect(() => {
    targetWordRef.current = currentTargetWord;
  }, [currentTargetWord]);

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (soundEnabled) playClickSound();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Sound triggers
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Initialize MediaPipe HandLandmarker with fallback
  useEffect(() => {
    let isMounted = true;

    async function loadHandLandmarker() {
      setIsAiLoading(true);
      setAiStatusText('កំពុងផ្ទុកម៉ូដែល AI ចាប់ចលនាដៃ (MediaPipe)...');

      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        if (!isMounted) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 4,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });

        if (!isMounted) return;
        landmarkerRef.current = handLandmarker;
        setIsAiLoading(false);
        setAiStatusText('AI ចាប់ចលនាដៃរួចរាល់ 100%!');
      } catch (err) {
        console.warn('MediaPipe HandLandmarker load fallback:', err);
        setIsAiLoading(false);
        setAiStatusText('ប្រើប្រព័ន្ធ Optical Motion + Touch ឆ្លាតវៃ');
      }
    }

    loadHandLandmarker();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: useFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Video play error:', e));
          setCameraActive(true);
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('សូមអនុញ្ញាតបើក Camera ដើម្បីចាប់ចលនាដៃសិស្ស');
      setCameraActive(false);
    }
  }, [useFrontCamera]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera on mount / toggle
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Switch Target Word Helper
  const pickNewTargetWord = useCallback(() => {
    if (wordList.length === 0) return;
    const available = wordList.filter(w => w !== targetWordRef.current);
    const chosen = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : wordList[0];
    setCurrentTargetWord(chosen);
    targetWordRef.current = chosen;

    if (autoSpeak) {
      setTimeout(() => {
        speakText(`ចាប់ពាក្យ ${chosen}`);
      }, 200);
    }
  }, [wordList, autoSpeak]);

  // Spawn initial bubbles
  const spawnBubbles = useCallback((targetWord: string) => {
    const newBubbles: FloatingBubble[] = [];
    const colors = [
      { bg: 'from-amber-400 to-yellow-500 text-purple-950', glow: '#fbbf24' },
      { bg: 'from-cyan-400 to-blue-500 text-white', glow: '#38bdf8' },
      { bg: 'from-emerald-400 to-green-500 text-white', glow: '#34d399' },
      { bg: 'from-fuchsia-400 to-pink-500 text-white', glow: '#f472b6' },
      { bg: 'from-indigo-400 to-purple-500 text-white', glow: '#818cf8' },
    ];

    // Speed multiplier
    const speedMult = floatingSpeed === 'slow' ? 0.35 : floatingSpeed === 'fast' ? 0.85 : 0.55;

    // Guaranteed target word bubble
    if (targetWord) {
      const col = colors[0];
      newBubbles.push({
        id: `target-${Date.now()}-${Math.random()}`,
        word: targetWord,
        x: 20 + Math.random() * 60, // 20% - 80%
        y: 20 + Math.random() * 40,
        vx: (Math.random() - 0.5) * speedMult * 1.5,
        vy: (Math.random() * 0.4 + 0.2) * speedMult,
        size: 130,
        isTarget: true,
        colorClass: col.bg,
        glowColor: col.glow,
        scale: 1,
        spawnTime: Date.now()
      });
    }

    // Distractor words
    const otherWords = wordList.filter(w => w !== targetWord);
    const count = bubbleDensity;

    for (let i = 0; i < count; i++) {
      const randomWord = otherWords.length > 0 
        ? otherWords[Math.floor(Math.random() * otherWords.length)]
        : wordList[i % wordList.length];
      const col = colors[(i + 1) % colors.length];

      newBubbles.push({
        id: `distractor-${i}-${Date.now()}`,
        word: randomWord,
        x: 10 + (i * (80 / count)) + Math.random() * 10,
        y: 15 + Math.random() * 50,
        vx: (Math.random() - 0.5) * speedMult * 1.5,
        vy: (Math.random() * 0.4 + 0.2) * speedMult,
        size: 120,
        isTarget: false,
        colorClass: col.bg,
        glowColor: col.glow,
        scale: 1,
        spawnTime: Date.now()
      });
    }

    setFloatingBubbles(newBubbles);
    bubblesRef.current = newBubbles;
  }, [wordList, bubbleDensity, floatingSpeed]);

  // Start Game Countdown
  const handleStartGame = () => {
    if (soundEnabled) playClickSound();
    setP1Score(0);
    setP2Score(0);
    p1ScoreRef.current = 0;
    p2ScoreRef.current = 0;
    setTimeLeft(timeLimit);
    setWinner(null);
    setGameState('countdown');
    setCountdownNum(3);

    const timer = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('playing');
          gameRunningRef.current = true;
          pickNewTargetWord();
          return 0;
        }
        if (soundEnabled) playClickSound();
        return prev - 1;
      });
    }, 1000);
  };

  // Trigger when Target Word changes in playing state
  useEffect(() => {
    if (gameState === 'playing' && currentTargetWord) {
      spawnBubbles(currentTargetWord);
    }
  }, [gameState, currentTargetWord, spawnBubbles]);

  // Match Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // End game
          endMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // End Match & Determine Winner
  const endMatch = useCallback(() => {
    gameRunningRef.current = false;
    setGameState('gameover');
    
    const s1 = p1ScoreRef.current;
    const s2 = p2ScoreRef.current;
    
    if (s1 > s2) {
      setWinner(1);
      if (soundEnabled) playWinSound();
      triggerConfetti();
      speakText(`ជយោ! ${player1Name} ទទួលបានជ័យជម្នះ!`);
    } else if (s2 > s1) {
      setWinner(2);
      if (soundEnabled) playWinSound();
      triggerConfetti();
      speakText(`ជយោ! ${player2Name} ទទួលបានជ័យជម្នះ!`);
    } else {
      setWinner('draw');
      if (soundEnabled) playSuccessSound();
      speakText('ស្មើគ្នា! ទាំងពីរនាក់ពូកែដូចគ្នា!');
    }
  }, [player1Name, player2Name, soundEnabled]);

  // Check Target Score
  useEffect(() => {
    if (gameState === 'playing') {
      if (p1Score >= targetScore || p2Score >= targetScore) {
        endMatch();
      }
    }
  }, [p1Score, p2Score, targetScore, gameState, endMatch]);

  // Hand Grab Action Logic
  const handleWordGrabbed = useCallback((bubble: FloatingBubble, player: 1 | 2, grabX: number, grabY: number) => {
    const now = Date.now();
    if (now - lastCatchTimeRef.current < 450) return; // Debounce fast spam
    lastCatchTimeRef.current = now;

    const isCorrect = gameMode === 'rush' ? true : bubble.isTarget;

    if (isCorrect) {
      // Award Point
      if (player === 1) {
        setP1Score(prev => prev + 1);
        p1ScoreRef.current += 1;
      } else {
        setP2Score(prev => prev + 1);
        p2ScoreRef.current += 1;
      }

      if (soundEnabled) playSuccessSound();
      triggerConfetti();

      // Add Visual Grab Burst Effect
      const effectId = Date.now();
      setGrabEffects(prev => [
        ...prev.slice(-4),
        {
          id: effectId,
          x: grabX,
          y: grabY,
          text: `+1 ${player === 1 ? player1Name : player2Name}`,
          color: player === 1 ? '#38bdf8' : '#f43f5e',
          player
        }
      ]);

      setTimeout(() => {
        setGrabEffects(prev => prev.filter(e => e.id !== effectId));
      }, 1200);

      // Read Word out loud
      if (autoSpeak) {
        speakText(bubble.word);
      }

      // Next Word
      setTimeout(() => {
        if (gameRunningRef.current) {
          pickNewTargetWord();
        }
      }, 600);

    } else {
      // Wrong word grabbed in Target Mode
      if (soundEnabled) playFailSound();

      // Small bounce/shake effect on bubble
      setFloatingBubbles(prev => prev.map(b => {
        if (b.id === bubble.id) {
          return {
            ...b,
            vx: -b.vx * 1.5,
            vy: -b.vy * 1.5,
            scale: 0.8
          };
        }
        return b;
      }));

      // Grab effect
      const effectId = Date.now();
      setGrabEffects(prev => [
        ...prev.slice(-4),
        {
          id: effectId,
          x: grabX,
          y: grabY,
          text: 'ខុសពាក្យ!',
          color: '#fb7185',
          player
        }
      ]);

      setTimeout(() => {
        setGrabEffects(prev => prev.filter(e => e.id !== effectId));
      }, 1000);
    }
  }, [gameMode, player1Name, player2Name, soundEnabled, autoSpeak, pickNewTargetWord]);

  // Main Canvas Render & AI Vision Tracking Animation Loop
  useEffect(() => {
    let lastVideoTime = -1;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Keep canvas resolution synced to container
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
          }

          const width = canvas.width;
          const height = canvas.height;

          // Clear frame
          ctx.clearRect(0, 0, width, height);

          // Mirror Camera Feed
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -width, 0, width, height);
          ctx.restore();

          // Subtle arena middle divider line (Player 1 Left | Player 2 Right)
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.setLineDash([8, 8]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.stroke();

          // Side Labels (សិស្សទី១ / សិស្សទី២)
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fillRect(0, 0, width / 2, 40);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.fillRect(width / 2, 0, width / 2, 40);

          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`👈 ${player1Name}`, 24, 26);

          ctx.fillStyle = '#fb7185';
          ctx.textAlign = 'right';
          ctx.fillText(`${player2Name} 👉`, width - 24, 26);
          ctx.restore();

          // AI Hand Landmark Detection
          const detectedHands: HandPoint[] = [];

          if (landmarkerRef.current && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            try {
              const results = landmarkerRef.current.detectForVideo(video, performance.now());
              if (results.landmarks && results.landmarks.length > 0) {
                results.landmarks.forEach((landmarks: any[]) => {
                  // Index fingertip (landmark 8) and Thumb tip (landmark 4)
                  const indexTip = landmarks[8];
                  const thumbTip = landmarks[4];
                  const wrist = landmarks[0];

                  if (!indexTip) return;

                  // Since video is mirrored:
                  // Raw X: 0 is left in raw video, but in mirrored view, it is 1 - x
                  const mirroredX = 1 - indexTip.x;
                  const mirroredY = indexTip.y;

                  // Pinch / Grab gesture detection: distance between thumb and index
                  const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
                  const isGrabbing = pinchDist < 0.09;

                  // Player 1 is on Left side (x < 0.5), Player 2 is on Right side (x >= 0.5)
                  const playerId: 1 | 2 = mirroredX < 0.5 ? 1 : 2;

                  detectedHands.push({
                    x: mirroredX,
                    y: mirroredY,
                    playerId,
                    isGrabbing
                  });

                  // Draw Neon Hand Skeleton & Cursor
                  if (showSkeleton) {
                    const playerColor = playerId === 1 ? '#00e5ff' : '#ff007f';
                    const glowColor = playerId === 1 ? 'rgba(0, 229, 255, 0.6)' : 'rgba(255, 0, 127, 0.6)';

                    // Draw skeleton connections
                    ctx.save();
                    ctx.strokeStyle = playerColor;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 12;

                    // Draw index fingertip laser cursor
                    const px = mirroredX * width;
                    const py = mirroredY * height;

                    ctx.beginPath();
                    ctx.arc(px, py, isGrabbing ? 24 : 18, 0, Math.PI * 2);
                    ctx.fillStyle = isGrabbing ? '#facc15' : playerColor;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Ripple ring
                    ctx.beginPath();
                    ctx.arc(px, py, isGrabbing ? 36 : 26, 0, Math.PI * 2);
                    ctx.strokeStyle = glowColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Student badge label next to cursor
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.fillText(playerId === 1 ? 'សិស្សទី១' : 'សិស្សទី២', px, py - 28);

                    ctx.restore();
                  }
                });
              }
            } catch (e) {
              // Silently ignore detection jitter
            }
          }

          trackedHandsRef.current = detectedHands;

          // Physics update for floating bubbles during playing
          if (gameRunningRef.current && bubblesRef.current.length > 0) {
            const updatedBubbles = bubblesRef.current.map(b => {
              let nx = b.x + b.vx;
              let ny = b.y + b.vy;
              let nvx = b.vx;
              let nvy = b.vy;

              // Bounce off boundaries (5% - 95% width, 10% - 90% height)
              if (nx <= 6 || nx >= 94) nvx = -nvx;
              if (ny <= 12 || ny >= 88) nvy = -nvy;

              // Check collision with any player's tracked hands
              detectedHands.forEach(hand => {
                const handXPercent = hand.x * 100;
                const handYPercent = hand.y * 100;
                const dist = Math.hypot(handXPercent - nx, handYPercent - ny);

                // Hitbox radius based on bubble size (approx 8-12%)
                if (dist < 10) {
                  handleWordGrabbed(b, hand.playerId, handXPercent, handYPercent);
                }
              });

              return {
                ...b,
                x: Math.max(6, Math.min(94, nx)),
                y: Math.max(12, Math.min(88, ny)),
                vx: nvx,
                vy: nvy
              };
            });

            bubblesRef.current = updatedBubbles;
            setFloatingBubbles(updatedBubbles);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showSkeleton, player1Name, player2Name, handleWordGrabbed]);

  // Click/Touch fallback for testing or devices without camera
  const handleManualBubbleTouch = (bubble: FloatingBubble, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // Determine player based on screen X position
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const isLeft = clientX < window.innerWidth / 2;
    const player: 1 | 2 = isLeft ? 1 : 2;
    handleWordGrabbed(bubble, player, bubble.x, bubble.y);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden relative"
    >
      {/* Hidden processing video element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* TOP HEADER / APP BAR */}
      <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 z-30 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              stopCamera();
              onBack();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="ត្រឡប់ក្រោយ"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-bold hidden sm:inline">ត្រឡប់</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white shadow-md">
              <Hand size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-amber-300 tracking-tight flex items-center gap-1.5">
                <span>ល្បែងចាប់ពាក្យ (AI Hand Tracking)</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 font-mono">
                  2 Players
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden md:block">
                ប្រើកាមេរ៉ាចាប់ចលនាដៃសិស្សទី១ (ឆ្វេង) និងសិស្សទី២ (ស្ដាំ) ប្រកួតចាប់ពាក្យ
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setIsHowToPlayOpen(true);
            }}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="របៀបលេង"
          >
            <HelpCircle size={18} />
            <span className="hidden sm:inline">របៀបលេង</span>
          </button>

          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setIsSettingsOpen(true);
            }}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer"
            title="ការកំណត់"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playClickSound();
            }}
            className={`p-2 rounded-xl border cursor-pointer transition-all ${
              soundEnabled 
                ? 'bg-purple-900/50 text-amber-300 border-purple-500/50' 
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="សំឡេង"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer"
            title="ពេញអេក្រង់"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* MAIN GAME ARENA / CAMERA LIVE VIEWPORT */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        
        {/* Fullscreen Video Canvas with Hand Skeleton & Particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Ambient Dark Overlay to enhance text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/70 pointer-events-none z-10" />

        {/* TOP HUD: PLAYER SCORES & TARGET PROMPT */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between gap-2 pointer-events-none">
          
          {/* Player 1 Score HUD (Left) */}
          <motion.div 
            animate={{ scale: p1Score > 0 ? [1, 1.08, 1] : 1 }}
            className="bg-slate-900/90 backdrop-blur-md p-2.5 sm:p-3.5 rounded-2xl border-2 border-cyan-500/70 shadow-lg shadow-cyan-950/50 flex items-center gap-3 pointer-events-auto"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              <span>P1</span>
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-black text-cyan-400 truncate max-w-[120px] sm:max-w-[150px]">
                {player1Name}
              </div>
              <div className="text-xl sm:text-3xl font-black text-white flex items-baseline gap-1">
                <span>{p1Score}</span>
                <span className="text-[10px] text-slate-400 font-normal">/ {targetScore}</span>
              </div>
            </div>
          </motion.div>

          {/* Center Target Word Banner / Round Timer */}
          {gameState === 'playing' && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center justify-center pointer-events-auto"
            >
              <div className="bg-amber-400 text-purple-950 px-4 sm:px-6 py-2 rounded-full font-black text-sm sm:text-lg border-2 border-amber-300 shadow-2xl flex items-center gap-2 animate-bounce">
                <Target size={20} className="text-purple-950" />
                <span>
                  {gameMode === 'target' ? 'សូមចាប់ពាក្យ ៖' : 'ដណ្តើមចាប់ពាក្យ ៖'}
                </span>
                <span className="text-xl sm:text-2xl text-purple-950 underline decoration-wavy decoration-purple-600 ml-1">
                  {currentTargetWord}
                </span>
              </div>

              {/* Time Remaining Bar */}
              <div className="mt-1.5 px-3 py-0.5 bg-slate-900/80 backdrop-blur-sm rounded-full text-xs font-mono text-amber-300 border border-slate-700 flex items-center gap-1.5">
                <Clock size={12} />
                <span>{timeLeft}s</span>
              </div>
            </motion.div>
          )}

          {/* Player 2 Score HUD (Right) */}
          <motion.div 
            animate={{ scale: p2Score > 0 ? [1, 1.08, 1] : 1 }}
            className="bg-slate-900/90 backdrop-blur-md p-2.5 sm:p-3.5 rounded-2xl border-2 border-rose-500/70 shadow-lg shadow-rose-950/50 flex items-center gap-3 pointer-events-auto text-right"
          >
            <div>
              <div className="text-[11px] sm:text-xs font-black text-rose-400 truncate max-w-[120px] sm:max-w-[150px]">
                {player2Name}
              </div>
              <div className="text-xl sm:text-3xl font-black text-white flex items-baseline justify-end gap-1">
                <span>{p2Score}</span>
                <span className="text-[10px] text-slate-400 font-normal">/ {targetScore}</span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              <span>P2</span>
            </div>
          </motion.div>
        </div>

        {/* FLOATING WORD BUBBLES ON CANVAS */}
        {gameState === 'playing' && floatingBubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            onClick={(e) => handleManualBubbleTouch(bubble, e)}
            onTouchStart={(e) => handleManualBubbleTouch(bubble, e)}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute z-20 cursor-pointer select-none transition-transform active:scale-95 ${
              bubble.isTarget ? 'scale-110 animate-pulse' : 'scale-100'
            }`}
          >
            <div 
              style={{
                boxShadow: `0 0 25px ${bubble.glowColor}, 0 8px 16px rgba(0,0,0,0.6)`
              }}
              className={`px-5 py-3 sm:px-7 sm:py-4 rounded-3xl bg-gradient-to-r ${bubble.colorClass} border-2 border-white/80 backdrop-blur-md flex items-center justify-center hover:scale-105 transition-all`}
            >
              <span className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-md">
                {bubble.word}
              </span>
            </div>
          </motion.div>
        ))}

        {/* GRAB BURST RIPPLE EFFECTS */}
        <AnimatePresence>
          {grabEffects.map((effect) => (
            <motion.div
              key={effect.id}
              initial={{ scale: 0.5, opacity: 1, y: 0 }}
              animate={{ scale: 1.6, opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                left: `${effect.x}%`,
                top: `${effect.y}%`,
                transform: 'translate(-50%, -50%)',
                color: effect.color
              }}
              className="absolute z-30 pointer-events-none font-black text-2xl sm:text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] flex items-center gap-1"
            >
              <Sparkles size={28} />
              <span>{effect.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* LOBBY / READY SCREEN */}
        {gameState === 'lobby' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-6"
            >
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-xl shadow-cyan-950/60">
                <Hand size={48} className="animate-bounce" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-300">
                  ត្រៀមខ្លួនប្រកួតចាប់ពាក្យ!
                </h2>
                <p className="text-sm sm:text-base text-slate-300 mt-1.5">
                  សិស្ស ២ នាក់ឈរ ឬអង្គុយមុខកាមេរ៉ា (ឆ្វេង 💙 vs ស្ដាំ 💖) រួចលាដៃដណ្តើមចាប់ពាក្យ
                </p>
              </div>

              {/* Player Name Badges */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 bg-cyan-950/60 rounded-2xl border border-cyan-500/40">
                  <div className="text-[11px] font-extrabold text-cyan-400">👈 ផ្នែកខាងឆ្វេង</div>
                  <input
                    type="text"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="w-full bg-cyan-900/40 font-bold text-white text-sm px-2.5 py-1.5 mt-1 rounded-lg border border-cyan-500/30 focus:outline-none"
                    placeholder="ឈ្មោះសិស្សទី១"
                  />
                </div>

                <div className="p-3.5 bg-rose-950/60 rounded-2xl border border-rose-500/40">
                  <div className="text-[11px] font-extrabold text-rose-400">ផ្នែកខាងស្ដាំ 👉</div>
                  <input
                    type="text"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="w-full bg-rose-900/40 font-bold text-white text-sm px-2.5 py-1.5 mt-1 rounded-lg border border-rose-500/30 focus:outline-none text-right"
                    placeholder="ឈ្មោះសិស្សទី២"
                  />
                </div>
              </div>

              {/* Status Note */}
              <div className="text-xs text-cyan-300 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-800/40 flex items-center justify-center gap-2">
                <Sparkles size={14} />
                <span>{aiStatusText}</span>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-98 text-purple-950 font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-amber-950/50 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <Play size={24} className="fill-current" />
                <span>ចាប់ផ្ដើមលេងឥឡូវនេះ</span>
              </button>
            </motion.div>
          </div>
        )}

        {/* COUNTDOWN 3..2..1 SCREEN */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-30 flex items-center justify-center">
            <motion.div
              key={countdownNum}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-8xl sm:text-9xl font-black text-amber-400 drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]"
            >
              {countdownNum === 0 ? 'ចាប់ផ្ដើម!' : countdownNum}
            </motion.div>
          </div>
        )}

        {/* GAME OVER & WINNER PODIUM */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-2xl text-center space-y-6"
            >
              <div className="inline-flex p-4 rounded-3xl bg-amber-400 text-purple-950 shadow-xl shadow-amber-950/60 animate-bounce">
                <Crown size={52} />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  លទ្ធផលនៃការប្រកួត
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {winner === 'draw' 
                    ? 'ស្មើគ្នា!' 
                    : `🎉 ${winner === 1 ? player1Name : player2Name} ឈ្នះ!`}
                </h2>
              </div>

              {/* Score Comparison Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="p-3 bg-cyan-950/50 rounded-xl border border-cyan-500/40">
                  <div className="text-xs font-bold text-cyan-400">{player1Name}</div>
                  <div className="text-3xl font-black text-white mt-1">{p1Score}</div>
                </div>

                <div className="p-3 bg-rose-950/50 rounded-xl border border-rose-500/40">
                  <div className="text-xs font-bold text-rose-400">{player2Name}</div>
                  <div className="text-3xl font-black text-white mt-1">{p2Score}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStartGame}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black text-base rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all"
                >
                  <RefreshCw size={18} />
                  <span>លេងម្តងទៀត</span>
                </button>

                <button
                  onClick={() => {
                    setGameState('lobby');
                  }}
                  className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-base rounded-xl border border-slate-700 cursor-pointer"
                >
                  <span>ម៉ឺនុយ</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>

      {/* HOW TO PLAY MODAL */}
      <AnimatePresence>
        {isHowToPlayOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                  <HelpCircle size={20} />
                  <span>របៀបលេងល្បែងចាប់ពាក្យ</span>
                </h3>
                <button
                  onClick={() => setIsHowToPlayOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <p>ដាក់ទូរស័ព្ទ Tablet ឬ Computer មុខសិស្សទាំង ២ នាក់ (សិស្សទី១ ខាងឆ្វេង, សិស្សទី២ ខាងស្ដាំ)។</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <p>AI នឹងចាប់ចលនាចុងម្រាមដៃ និងបាតដៃរបស់សិស្សដោយស្វ័យប្រវត្តិតាមពណ៌ (ខៀវ 💙 vs ក្រហម 💖)។</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <p>ស្ដាប់សំឡេងអានពាក្យ ឬមើលផ្ទាំងពាក្យគោលដៅនៅខាងលើ រួចលាដៃដណ្តើមចាប់ពាក្យដែលត្រូវឱ្យបានលឿនជាងគេដើម្បីទទួលបានពិន្ទុ!</p>
                </div>
              </div>

              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer"
              >
                យល់ហើយ!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS DRAWER MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                  <Sliders size={20} />
                  <span>ការកំណត់ល្បែងចាប់ពាក្យ</span>
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                {/* Mode Select */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">របៀបលេង (Game Mode) ៖</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setGameMode('target')}
                      className={`p-2.5 rounded-xl font-bold text-xs border cursor-pointer ${
                        gameMode === 'target'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      🎯 ចាប់ពាក្យត្រូវ
                    </button>
                    <button
                      onClick={() => setGameMode('rush')}
                      className={`p-2.5 rounded-xl font-bold text-xs border cursor-pointer ${
                        gameMode === 'rush'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      ⚡ ដណ្តើមចាប់លឿន
                    </button>
                  </div>
                </div>

                {/* Target Score */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">ពិន្ទុឈ្នះ (Target Score) ៖</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((score) => (
                      <button
                        key={score}
                        onClick={() => setTargetScore(score)}
                        className={`py-2 rounded-xl font-bold text-xs border cursor-pointer ${
                          targetScore === score
                            ? 'bg-amber-400 text-purple-950 border-amber-300'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {score} ពិន្ទុ
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Speed */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">ល្បឿនពាក្យអណ្ដែត ៖</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['slow', 'medium', 'fast'] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setFloatingSpeed(spd)}
                        className={`py-2 rounded-xl font-bold text-xs border cursor-pointer ${
                          floatingSpeed === spd
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {spd === 'slow' ? 'យឺត' : spd === 'medium' ? 'មធ្យម' : 'លឿន'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Front / Back Camera Switch */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold">ប្ដូរកាមេរ៉ា (មុខ / ក្រោយ)</span>
                  <button
                    onClick={() => {
                      setUseFrontCamera(!useFrontCamera);
                      setTimeout(() => startCamera(), 100);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera size={14} />
                    <span>{useFrontCamera ? 'កាមេរ៉ាមុខ' : 'កាមេរ៉ាក្រោយ'}</span>
                  </button>
                </div>

                {/* Show Skeleton Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">បង្ហាញចលនាគ្រោងឆ្អឹងដៃ (Skeleton)</span>
                  <input
                    type="checkbox"
                    checked={showSkeleton}
                    onChange={(e) => setShowSkeleton(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Auto Speak Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">សំឡេងអានពាក្យស្វ័យប្រវត្តិកម្ពុជា</span>
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer"
              >
                រក្សាទុក & បិទ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
