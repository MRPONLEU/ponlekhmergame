import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft as ArrowLeftIcon, 
  Camera as CameraIcon, 
  CameraOff as CameraOffIcon, 
  Settings as SettingsIcon, 
  Volume2 as Volume2Icon, 
  VolumeX as VolumeXIcon, 
  Sparkles as SparklesIcon, 
  Play as PlayIcon, 
  Maximize as MaximizeIcon, 
  Minimize as MinimizeIcon, 
  Hand as HandIcon, 
  RefreshCw as RefreshCwIcon, 
  HelpCircle as HelpCircleIcon,
  Clock as ClockIcon,
  Target as TargetIcon,
  Crown as CrownIcon,
  MousePointer as MousePointerIcon,
  CheckCircle2 as CheckCircle2Icon,
  Scan as ScanIcon,
  ArrowRight as ArrowRightIcon
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

interface SingleWordTarget {
  id: string;
  word: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  vx: number;
  vy: number;
  scale: number;
  glowColor: string;
  bgGradStart: string;
  bgGradEnd: string;
  textColor: string;
  spawnTime: number;
}

interface TrackedHand {
  x: number; // 0 to 1
  y: number; // 0 to 1
  playerId: 1 | 2; // 1 = Left side / Student A, 2 = Right side / Student B
  isGrabbing: boolean;
  fingerCount: number; // 0 to 5 detected extended fingers
  handedness: 'Left' | 'Right' | 'unknown';
  isCrossLine: boolean; // whether hand crossed into the opponent's half
  landmarks: { x: number; y: number; z?: number }[];
}

// Pre-allocated static skeleton connection graph for 0-allocation 60fps drawing
const FINGER_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17], [17, 0]    // Palm Ring
];

// High-precision linear interpolation for butter-smooth 60fps tracking
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

export default function WordGrab({ words, topics, activeTopicId, onBack }: WordGrabProps) {
  // Game Setup & Players
  const [player1Name, setPlayer1Name] = useState<string>('សិស្ស ក (ដៃឆ្វេង 💙)');
  const [player2Name, setPlayer2Name] = useState<string>('សិស្ស ខ (ដៃស្ដាំ 💖)');
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  
  // Game States: 'lobby' | 'scan' | 'countdown' | 'playing' | 'gameover'
  const [gameState, setGameState] = useState<'lobby' | 'scan' | 'countdown' | 'playing' | 'gameover'>('lobby');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);

  // Scan state indicators
  const [p1ScanProgress, setP1ScanProgress] = useState<number>(0); // 0 to 100%
  const [p2ScanProgress, setP2ScanProgress] = useState<number>(0); // 0 to 100%
  const [p1FingersDetected, setP1FingersDetected] = useState<number>(0);
  const [p2FingersDetected, setP2FingersDetected] = useState<number>(0);

  // Game Options & Configuration
  const [targetScore, setTargetScore] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(60); // seconds
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [floatingSpeed, setFloatingSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [wordSpawnDelay, setWordSpawnDelay] = useState<number>(1.0); // delay in seconds (0.5s to 5s)
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

  // Current single target word state for UI banner
  const [currentWordText, setCurrentWordText] = useState<string>('');
  const [grabEffects, setGrabEffects] = useState<{ id: number; x: number; y: number; text: string; color: string; player: 1 | 2 }[]>([]);
  const [fpsDisplay, setFpsDisplay] = useState<number>(60);
  const [performanceMode, setPerformanceMode] = useState<boolean>(true); // Hardware acceleration & optimized render

  // Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const aiCanvasRef = useRef<HTMLCanvasElement | null>(null); // Offscreen downscaled canvas for super fast AI
  const containerRef = useRef<HTMLDivElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const aiDetectTimerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Persistent tracking & LERP smoothing refs (supports full-screen movement & jitter-free 60fps)
  const rawHandsRef = useRef<TrackedHand[]>([]);
  const smoothedHandsRef = useRef<TrackedHand[]>([]);
  const p1HandTrackerRef = useRef<{ x: number; y: number; lastSeen: number }>({ x: 0.25, y: 0.5, lastSeen: 0 });
  const p2HandTrackerRef = useRef<{ x: number; y: number; lastSeen: number }>({ x: 0.75, y: 0.5, lastSeen: 0 });
  
  const singleWordRef = useRef<SingleWordTarget | null>(null);
  const p1ScoreRef = useRef<number>(0);
  const p2ScoreRef = useRef<number>(0);
  const gameRunningRef = useRef<boolean>(false);
  const currentWordIndexRef = useRef<number>(0);
  const lastCatchTimeRef = useRef<number>(0);
  const wordSpawnDelayRef = useRef<number>(0.5);
  const p1ScanRef = useRef<number>(0);
  const p2ScanRef = useRef<number>(0);
  const isDetectingRef = useRef<boolean>(false);
  
  // FPS calculation refs
  const frameCountRef = useRef<number>(0);
  const lastFpsCheckRef = useRef<number>(performance.now());
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Synchronize active words pool
  const wordList = React.useMemo(() => {
    if (words && words.length > 0) {
      return words.map(w => w.word.trim()).filter(Boolean);
    }
    return ['មាតុភូមិ', 'សិល្បៈ', 'វប្បធម៌', 'កុមារ', 'សាលារៀន', 'វិជ្ជា', 'សាមគ្គី', 'មិត្តភាព', 'អក្សរសាស្ត្រ', 'កីឡា'];
  }, [words]);

  useEffect(() => {
    p1ScoreRef.current = p1Score;
  }, [p1Score]);

  useEffect(() => {
    p2ScoreRef.current = p2Score;
  }, [p2Score]);

  useEffect(() => {
    wordSpawnDelayRef.current = wordSpawnDelay;
  }, [wordSpawnDelay]);

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

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Initialize MediaPipe HandLandmarker with high performance settings
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
          numHands: 2, // 2 players: Student A (Left) & Student B (Right)
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4
        });

        if (!isMounted) return;
        landmarkerRef.current = handLandmarker;
        setIsAiLoading(false);
        setAiStatusText('AI ចាប់ចលនាដៃរួចរាល់ 100%!');
      } catch (err) {
        if (!isMounted) return;
        setIsAiLoading(false);
        setAiStatusText('មុខងារ Optical Motion & Touch ត្រៀមរួចជាស្រេច');
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

  // Progressive Camera Stream Starter (Optimized for low-latency 640x480)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('ឧបករណ៍មិនគាំទ្រ Camera (អាចលេងដោយ Touch/Click)');
        setCameraActive(false);
        return;
      }

      let stream: MediaStream | null = null;
      const candidates: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: useFrontCamera ? 'user' : 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        {
          video: {
            facingMode: useFrontCamera ? 'user' : 'environment'
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      for (const constraint of candidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (stream) break;
        } catch (candidateErr) {}
      }

      if (!stream && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter(d => d.kind === 'videoinput');
          if (videoDevs.length > 0) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: videoDevs[0].deviceId } },
              audio: false
            });
          }
        } catch (devErr) {}
      }

      if (!stream) {
        setCameraError('មិនអាចបើក Camera (អាចលេងដោយ Touch/Click)');
        setCameraActive(false);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setCameraActive(true);
          setCameraError(null);
        };
      }
    } catch (err: any) {
      setCameraError('មិនអាចបើក Camera (អាចលេងដោយ Touch/Click)');
      setCameraActive(false);
    }
  }, [useFrontCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Spawn Next SINGLE Word Target (ពាក្យចេញតែមួយពាក្យ ចាប់បានមួយទើបចេញមួយទៀត)
  const spawnNextSingleWord = useCallback(() => {
    if (wordList.length === 0) return;

    // Pick next word
    const nextIndex = (currentWordIndexRef.current + 1) % wordList.length;
    currentWordIndexRef.current = nextIndex;
    const nextWord = wordList[nextIndex];

    setCurrentWordText(nextWord);

    const speedMult = floatingSpeed === 'slow' ? 0.35 : floatingSpeed === 'fast' ? 0.75 : 0.5;
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speedMult;
    const vy = Math.sin(angle) * speedMult;

    // Floating colors palette
    const colorOptions = [
      { glow: '#fbbf24', start: '#f59e0b', end: '#d97706', text: '#451a03' }, // Amber
      { glow: '#38bdf8', start: '#0284c7', end: '#0369a1', text: '#ffffff' }, // Cyan
      { glow: '#34d399', start: '#059669', end: '#047857', text: '#ffffff' }, // Emerald
      { glow: '#f472b6', start: '#db2777', end: '#be185d', text: '#ffffff' }, // Pink
      { glow: '#a78bfa', start: '#7c3aed', end: '#6d28d9', text: '#ffffff' }, // Purple
    ];
    const col = colorOptions[Math.floor(Math.random() * colorOptions.length)];

    singleWordRef.current = {
      id: `word-${Date.now()}`,
      word: nextWord,
      x: 35 + Math.random() * 30, // Center area (35% to 65%)
      y: 35 + Math.random() * 30,
      vx,
      vy,
      scale: 1,
      glowColor: col.glow,
      bgGradStart: col.start,
      bgGradEnd: col.end,
      textColor: col.text,
      spawnTime: Date.now()
    };

    if (autoSpeak) {
      setTimeout(() => {
        speakText(nextWord);
      }, 100);
    }
  }, [wordList, floatingSpeed, autoSpeak]);

  // Navigate to Hand Calibration / Scanning step
  const handleProceedToScan = () => {
    if (soundEnabled) playClickSound();
    setP1ScanProgress(0);
    setP2ScanProgress(0);
    p1ScanRef.current = 0;
    p2ScanRef.current = 0;
    setGameState('scan');

    if (autoSpeak) {
      setTimeout(() => {
        speakText('សូមលាម្រាមដៃទាំង៥៖ សិស្ស ក ប្រើដៃឆ្វេង និងសិស្ស ខ ប្រើដៃស្ដាំ');
      }, 200);
    }
  };

  // Launch countdown from Scan or Direct
  const handleStartCountdown = useCallback(() => {
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
          spawnNextSingleWord();
          return 0;
        }
        if (soundEnabled) playClickSound();
        return prev - 1;
      });
    }, 1000);
  }, [soundEnabled, timeLimit, spawnNextSingleWord]);

  // Match Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // End Match & Winner
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

  // Check target score
  useEffect(() => {
    if (gameState === 'playing') {
      if (p1Score >= targetScore || p2Score >= targetScore) {
        endMatch();
      }
    }
  }, [p1Score, p2Score, targetScore, gameState, endMatch]);

  // Catch Single Word logic
  const handleCatchWord = useCallback((player: 1 | 2, grabX: number, grabY: number, isCrossLine: boolean = false) => {
    const now = Date.now();
    if (now - lastCatchTimeRef.current < 450) return; // Debounce
    lastCatchTimeRef.current = now;

    const caughtWord = singleWordRef.current ? singleWordRef.current.word : currentWordText;

    // Immediately hide/close the word capsule & top banner text upon catch
    singleWordRef.current = null;
    setCurrentWordText('');

    // Award score to the fast student
    if (player === 1) {
      setP1Score(prev => prev + 1);
      p1ScoreRef.current += 1;
    } else {
      setP2Score(prev => prev + 1);
      p2ScoreRef.current += 1;
    }

    if (soundEnabled) playSuccessSound();
    triggerConfetti();

    // Floating burst score effect with cross-line indicator
    const effectId = Date.now();
    const effectText = isCrossLine
      ? `+1 ${player === 1 ? player1Name : player2Name} (ឆ្លងបន្ទាត់!) ⚡`
      : `+1 ${player === 1 ? player1Name : player2Name}`;

    setGrabEffects(prev => [
      ...prev.slice(-2),
      {
        id: effectId,
        x: grabX,
        y: grabY,
        text: effectText,
        color: isCrossLine ? '#facc15' : (player === 1 ? '#38bdf8' : '#f43f5e'),
        player
      }
    ]);

    setTimeout(() => {
      setGrabEffects(prev => prev.filter(e => e.id !== effectId));
    }, 950);

    // Speak caught word
    if (autoSpeak) {
      speakText(caughtWord);
    }

    // Spawn the NEXT single word after configured interval!
    const delayMs = Math.round(wordSpawnDelayRef.current * 1000);
    setTimeout(() => {
      if (gameRunningRef.current) {
        spawnNextSingleWord();
      }
    }, delayMs);
  }, [player1Name, player2Name, soundEnabled, autoSpeak, currentWordText, spawnNextSingleWord]);

  // 1. Decoupled Asynchronous AI Detection Worker (Downscaled 320x240 for 3x Faster Zero-Lag AI)
  useEffect(() => {
    let isRunning = true;
    let animId: number | null = null;
    let lastRun = 0;

    // Create persistent downscaled processing canvas (320x240)
    const procCanvas = document.createElement('canvas');
    procCanvas.width = 320;
    procCanvas.height = 240;
    const procCtx = procCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
    aiCanvasRef.current = procCanvas;

    const detectTask = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      const now = performance.now();

      if (
        video && 
        video.readyState >= 2 && 
        !video.paused && 
        landmarker && 
        !isDetectingRef.current && 
        now - lastRun >= 30 // ~33 FPS AI rate keeps CPU cool while canvas runs at 60-120 FPS!
      ) {
        lastRun = now;
        isDetectingRef.current = true;

        try {
          if (procCtx) {
            procCtx.drawImage(video, 0, 0, 320, 240);
            const results = landmarker.detectForVideo(procCanvas, now);

            if (results && results.landmarks) {
              const rawHands = results.landmarks.map((landmarks: any[], k: number) => {
                const wrist = landmarks[0];
                const thumbTip = landmarks[4];
                const indexMCP = landmarks[5];
                const indexTip = landmarks[8];

                if (!wrist || !indexTip) return null;

                const mirroredX = 1 - indexTip.x;
                const mirroredY = indexTip.y;
                const pinchDist = thumbTip ? Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y) : 0.2;
                const isGrabbing = pinchDist < 0.085;

                let fingerCount = 0;
                if (thumbTip && Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y) > 0.12) fingerCount++;
                if (landmarks[8] && landmarks[6] && landmarks[8].y < landmarks[6].y) fingerCount++;
                if (landmarks[12] && landmarks[10] && landmarks[12].y < landmarks[10].y) fingerCount++;
                if (landmarks[16] && landmarks[14] && landmarks[16].y < landmarks[14].y) fingerCount++;
                if (landmarks[20] && landmarks[18] && landmarks[20].y < landmarks[18].y) fingerCount++;
                fingerCount = Math.max(1, Math.min(5, fingerCount));

                const mpCat = (results.handednesses && results.handednesses[k]) 
                  ? results.handednesses[k][0]?.categoryName 
                  : (results.handedness && results.handedness[k]) 
                    ? results.handedness[k][0]?.categoryName 
                    : null;

                const thumbRelX = thumbTip && indexMCP ? (1 - thumbTip.x) - (1 - indexMCP.x) : 0;
                const isLeft = mpCat === 'Left' || (mpCat === null && thumbRelX > 0.015);
                const isRight = mpCat === 'Right' || (mpCat === null && thumbRelX < -0.015);
                const handedness: 'Left' | 'Right' | 'unknown' = isLeft ? 'Left' : isRight ? 'Right' : 'unknown';

                return {
                  x: mirroredX,
                  y: mirroredY,
                  isGrabbing,
                  fingerCount,
                  handedness,
                  landmarks: landmarks.map(lm => ({
                    x: 1 - lm.x,
                    y: lm.y,
                    z: lm.z
                  }))
                };
              }).filter(Boolean) as any[];

              const detectedHands: TrackedHand[] = [];

              if (rawHands.length === 1) {
                const h = rawHands[0];
                let assignedPlayer: 1 | 2;

                if (h.handedness === 'Left') {
                  assignedPlayer = 1;
                } else if (h.handedness === 'Right') {
                  assignedPlayer = 2;
                } else {
                  const d1 = Math.hypot(h.x - p1HandTrackerRef.current.x, h.y - p1HandTrackerRef.current.y);
                  const d2 = Math.hypot(h.x - p2HandTrackerRef.current.x, h.y - p2HandTrackerRef.current.y);
                  assignedPlayer = d1 <= d2 ? 1 : 2;
                }

                const isCrossLine = (assignedPlayer === 1 && h.x > 0.5) || (assignedPlayer === 2 && h.x < 0.5);

                if (assignedPlayer === 1) {
                  p1HandTrackerRef.current = {
                    x: 0.7 * h.x + 0.3 * p1HandTrackerRef.current.x,
                    y: 0.7 * h.y + 0.3 * p1HandTrackerRef.current.y,
                    lastSeen: now
                  };
                } else {
                  p2HandTrackerRef.current = {
                    x: 0.7 * h.x + 0.3 * p2HandTrackerRef.current.x,
                    y: 0.7 * h.y + 0.3 * p2HandTrackerRef.current.y,
                    lastSeen: now
                  };
                }

                detectedHands.push({ ...h, playerId: assignedPlayer, isCrossLine });
              } else if (rawHands.length >= 2) {
                const h0 = rawHands[0];
                const h1 = rawHands[1];

                let score01 = 0;
                let score10 = 0;

                if (h0.handedness === 'Left') score01 += 60;
                if (h0.handedness === 'Right') score10 += 60;
                if (h1.handedness === 'Right') score01 += 60;
                if (h1.handedness === 'Left') score10 += 60;

                const d0_p1 = Math.hypot(h0.x - p1HandTrackerRef.current.x, h0.y - p1HandTrackerRef.current.y);
                const d0_p2 = Math.hypot(h0.x - p2HandTrackerRef.current.x, h0.y - p2HandTrackerRef.current.y);
                const d1_p1 = Math.hypot(h1.x - p1HandTrackerRef.current.x, h1.y - p1HandTrackerRef.current.y);
                const d1_p2 = Math.hypot(h1.x - p2HandTrackerRef.current.x, h1.y - p2HandTrackerRef.current.y);

                score01 += (1 - d0_p1) * 30 + (1 - d1_p2) * 30;
                score10 += (1 - d0_p2) * 30 + (1 - d1_p1) * 30;

                if (score01 >= score10) {
                  p1HandTrackerRef.current = { x: 0.7 * h0.x + 0.3 * p1HandTrackerRef.current.x, y: 0.7 * h0.y + 0.3 * p1HandTrackerRef.current.y, lastSeen: now };
                  p2HandTrackerRef.current = { x: 0.7 * h1.x + 0.3 * p2HandTrackerRef.current.x, y: 0.7 * h1.y + 0.3 * p2HandTrackerRef.current.y, lastSeen: now };
                  detectedHands.push({ ...h0, playerId: 1, isCrossLine: h0.x > 0.5 });
                  detectedHands.push({ ...h1, playerId: 2, isCrossLine: h1.x < 0.5 });
                } else {
                  p2HandTrackerRef.current = { x: 0.7 * h0.x + 0.3 * p2HandTrackerRef.current.x, y: 0.7 * h0.y + 0.3 * p2HandTrackerRef.current.y, lastSeen: now };
                  p1HandTrackerRef.current = { x: 0.7 * h1.x + 0.3 * p1HandTrackerRef.current.x, y: 0.7 * h1.y + 0.3 * p1HandTrackerRef.current.y, lastSeen: now };
                  detectedHands.push({ ...h0, playerId: 2, isCrossLine: h0.x < 0.5 });
                  detectedHands.push({ ...h1, playerId: 1, isCrossLine: h1.x > 0.5 });
                }
              }

              rawHandsRef.current = detectedHands;
            }
          }
        } catch (e) {
        } finally {
          isDetectingRef.current = false;
        }
      }

      if (isRunning) {
        animId = requestAnimationFrame(detectTask);
      }
    };

    animId = requestAnimationFrame(detectTask);

    return () => {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // 2. Liquid Smooth 60+ FPS LERP Rendering & Physics Loop
  useEffect(() => {
    let frameCount = 0;

    const renderLoop = (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Calculate time delta for fluid motion on any refresh rate (60Hz, 90Hz, 120Hz)
      const now = performance.now();
      const dt = Math.min(2.2, Math.max(0.4, (now - lastFrameTimeRef.current) / 16.67));
      lastFrameTimeRef.current = now;

      // Realtime FPS Counter calculation
      frameCountRef.current++;
      if (now - lastFpsCheckRef.current >= 600) {
        const curFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsCheckRef.current));
        setFpsDisplay(Math.min(120, Math.max(15, curFps)));
        frameCountRef.current = 0;
        lastFpsCheckRef.current = now;
      }

      if (canvas) {
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          const container = containerRef.current;
          const targetW = container ? container.clientWidth : 1280;
          const targetH = container ? container.clientHeight : 720;

          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          const width = canvas.width;
          const height = canvas.height;

          // 1. Draw Background (Hardware-Blitted Video or Optimized Neon Arena)
          if (video && video.readyState >= 2 && !video.paused) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -width, 0, width, height);
            ctx.restore();
          } else {
            frameCount++;
            ctx.fillStyle = '#060814';
            ctx.fillRect(0, 0, width, height);

            // Left arena glow (Player 1)
            const p1Grad = ctx.createRadialGradient(width * 0.25, height * 0.5, 20, width * 0.25, height * 0.5, width * 0.35);
            p1Grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
            p1Grad.addColorStop(1, 'transparent');
            ctx.fillStyle = p1Grad;
            ctx.fillRect(0, 0, width / 2, height);

            // Right arena glow (Player 2)
            const p2Grad = ctx.createRadialGradient(width * 0.75, height * 0.5, 20, width * 0.75, height * 0.5, width * 0.35);
            p2Grad.addColorStop(0, 'rgba(244, 63, 94, 0.15)');
            p2Grad.addColorStop(1, 'transparent');
            ctx.fillStyle = p2Grad;
            ctx.fillRect(width / 2, 0, width / 2, height);

            // Subtle animated grid lines
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const gridSpacing = 64;
            const offset = (frameCount * 0.3) % gridSpacing;
            for (let x = offset; x < width; x += gridSpacing) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 2. Arena Split Divider & Cross-Line Guide
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.setLineDash([8, 8]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.stroke();

          // Top Header Player Tags
          ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
          ctx.fillRect(0, 0, width / 2, 34);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
          ctx.fillRect(width / 2, 0, width / 2, 34);

          ctx.font = 'bold 14px "Kantumruy Pro", sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`👈 ${player1Name}`, 20, 22);

          ctx.fillStyle = '#fb7185';
          ctx.textAlign = 'right';
          ctx.fillText(`${player2Name} 👉`, width - 20, 22);

          // Center Line Freedom Badge
          ctx.fillStyle = '#facc15';
          ctx.textAlign = 'center';
          ctx.font = 'bold 11px "Kantumruy Pro", sans-serif';
          ctx.fillText('⚡ ចាប់ឆ្លងបន្ទាត់បាន (AI ចំណាំដៃ)', width / 2, 22);
          ctx.restore();

          // 3. Smooth LERP Interpolation on Hand Movement (Jitter-Free 60 FPS)
          const targetHands = rawHandsRef.current;
          const prevSmoothed = smoothedHandsRef.current;
          const LERP_FACTOR = 0.44; // Perfect balance of lightning responsiveness and silk smoothness

          const nextSmoothed: TrackedHand[] = targetHands.map(th => {
            const match = prevSmoothed.find(ps => ps.playerId === th.playerId);
            if (!match) {
              return { ...th };
            }

            const sx = lerp(match.x, th.x, LERP_FACTOR);
            const sy = lerp(match.y, th.y, LERP_FACTOR);

            const smoothedLandmarks = th.landmarks.map((tlm, idx) => {
              const prevLm = match.landmarks && match.landmarks[idx];
              if (!prevLm) return tlm;
              return {
                x: lerp(prevLm.x, tlm.x, LERP_FACTOR),
                y: lerp(prevLm.y, tlm.y, LERP_FACTOR),
                z: tlm.z
              };
            });

            return {
              ...th,
              x: sx,
              y: sy,
              landmarks: smoothedLandmarks
            };
          });

          smoothedHandsRef.current = nextSmoothed;
          const currentHands = nextSmoothed;

          // 4. PRE-GAME SCANNING STEP RENDER (ស្កេនម្រាមដៃទាំង ៥ របស់សិស្ស)
          if (gameState === 'scan') {
            let p1HasHand = false;
            let p2HasHand = false;
            let p1Fingers = 0;
            let p2Fingers = 0;

            currentHands.forEach(hand => {
              if (hand.playerId === 1) {
                p1HasHand = true;
                p1Fingers = Math.max(p1Fingers, hand.fingerCount);
              } else {
                p2HasHand = true;
                p2Fingers = Math.max(p2Fingers, hand.fingerCount);
              }
            });

            setP1FingersDetected(p1Fingers);
            setP2FingersDetected(p2Fingers);

            // Progress accretion with dt
            if (p1HasHand && p1Fingers >= 4) {
              p1ScanRef.current = Math.min(100, p1ScanRef.current + 2.5 * dt);
            } else {
              p1ScanRef.current = Math.max(0, p1ScanRef.current - 1 * dt);
            }

            if (p2HasHand && p2Fingers >= 4) {
              p2ScanRef.current = Math.min(100, p2ScanRef.current + 2.5 * dt);
            } else {
              p2ScanRef.current = Math.max(0, p2ScanRef.current - 1 * dt);
            }

            setP1ScanProgress(Math.floor(p1ScanRef.current));
            setP2ScanProgress(Math.floor(p2ScanRef.current));

            // Visual Scan Target Guides
            const p1CenterX = width * 0.25;
            const p1CenterY = height * 0.52;
            const p1Radius = Math.min(width * 0.16, 120);

            ctx.save();
            ctx.strokeStyle = p1ScanRef.current >= 100 ? '#10b981' : '#00e5ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(p1CenterX, p1CenterY, p1Radius, 0, Math.PI * 2);
            ctx.stroke();

            // Progress Arc
            ctx.setLineDash([]);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(p1CenterX, p1CenterY, p1Radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (p1ScanRef.current / 100)));
            ctx.stroke();

            ctx.font = 'bold 16px "Kantumruy Pro", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(p1ScanRef.current >= 100 ? '✅ ស្កេនដៃឆ្វេងជាប់!' : `🖐️ ដាក់ដៃឆ្វេង (ម្រាម ${p1Fingers}/5)`, p1CenterX, p1CenterY + p1Radius + 30);
            ctx.restore();

            // Student B Target (Right)
            const p2CenterX = width * 0.75;
            const p2CenterY = height * 0.52;
            const p2Radius = Math.min(width * 0.16, 120);

            ctx.save();
            ctx.strokeStyle = p2ScanRef.current >= 100 ? '#10b981' : '#ff007f';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(p2CenterX, p2CenterY, p2Radius, 0, Math.PI * 2);
            ctx.stroke();

            // Progress Arc
            ctx.setLineDash([]);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(p2CenterX, p2CenterY, p2Radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (p2ScanRef.current / 100)));
            ctx.stroke();

            ctx.font = 'bold 16px "Kantumruy Pro", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(p2ScanRef.current >= 100 ? '✅ ស្កេនដៃស្ដាំជាប់!' : `🖐️ ដាក់ដៃស្ដាំ (ម្រាម ${p2Fingers}/5)`, p2CenterX, p2CenterY + p2Radius + 30);
            ctx.restore();

            // Auto start when both reach 100%
            if (p1ScanRef.current >= 100 && p2ScanRef.current >= 100) {
              handleStartCountdown();
            }
          }

          // 5. Draw 5-Finger Skeletons & Dynamic Player Badges (Zero-Allocation 60 FPS)
          if (showSkeleton && currentHands.length > 0) {
            currentHands.forEach(hand => {
              const playerColor = hand.playerId === 1 ? '#00e5ff' : '#ff007f';
              const lms = hand.landmarks;

              if (lms && lms.length >= 21) {
                ctx.save();
                ctx.strokeStyle = playerColor;
                ctx.lineWidth = hand.isCrossLine ? 3.5 : 2.5;
                ctx.lineCap = 'round';

                // Use static connections for 0-allocation high performance
                for (let i = 0; i < FINGER_CONNECTIONS.length; i++) {
                  const [i1, i2] = FINGER_CONNECTIONS[i];
                  const p1 = lms[i1];
                  const p2 = lms[i2];
                  if (p1 && p2) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x * width, p1.y * height);
                    ctx.lineTo(p2.x * width, p2.y * height);
                    ctx.stroke();
                  }
                }

                // Draw Joint Dots
                for (let idx = 0; idx < lms.length; idx++) {
                  const pt = lms[idx];
                  const px = pt.x * width;
                  const py = pt.y * height;
                  const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
                  ctx.beginPath();
                  ctx.arc(px, py, isTip ? 5 : 3, 0, Math.PI * 2);
                  ctx.fillStyle = isTip ? '#facc15' : '#ffffff';
                  ctx.fill();
                }

                // Palm center indicator & Cross-Line Energy Aura
                const px = hand.x * width;
                const py = hand.y * height;

                if (hand.isCrossLine) {
                  ctx.beginPath();
                  ctx.arc(px, py, 26, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
                  ctx.fill();
                  ctx.strokeStyle = '#facc15';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(px, py, hand.isGrabbing ? 20 : 14, 0, Math.PI * 2);
                ctx.fillStyle = hand.isGrabbing ? '#facc15' : playerColor;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Dynamic Hand Identification Label
                const handLabel = hand.playerId === 1
                  ? (hand.isCrossLine ? '⚡ សិស្ស ក (ឆ្លងបន្ទាត់!) 💙' : 'សិស្ស ក (ដៃឆ្វេង) 💙')
                  : (hand.isCrossLine ? '⚡ សិស្ស ខ (ឆ្លងបន្ទាត់!) 💖' : 'សិស្ស ខ (ដៃស្ដាំ) 💖');

                ctx.font = 'bold 12px "Kantumruy Pro", sans-serif';
                ctx.fillStyle = hand.isCrossLine ? '#facc15' : '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(handLabel, px, py - 20);
                ctx.restore();
              }
            });
          }

          // 6. SINGLE WORD DRIFT & COLLISION (Time-Delta Physics for 60-120 FPS)
          if (gameRunningRef.current && singleWordRef.current) {
            const w = singleWordRef.current;
            let nx = w.x + w.vx * dt;
            let ny = w.y + w.vy * dt;

            // Bounce within arena
            if (nx <= 15 || nx >= 85) w.vx = -w.vx;
            if (ny <= 18 || ny >= 82) w.vy = -w.vy;

            w.x = Math.max(15, Math.min(85, nx));
            w.y = Math.max(18, Math.min(82, ny));

            // Check collision with any player's hand
            for (let h = 0; h < currentHands.length; h++) {
              const hand = currentHands[h];
              const hxPct = hand.x * 100;
              const hyPct = hand.y * 100;
              const dist = Math.hypot(hxPct - w.x, hyPct - w.y);

              if (dist < 13) {
                handleCatchWord(hand.playerId, hxPct, hyPct, hand.isCrossLine);
                break;
              }
            }

            // Draw Single Word Capsule (Hardware-Accelerated Glow)
            const cx = (w.x / 100) * width;
            const cy = (w.y / 100) * height;

            ctx.save();
            ctx.font = 'bold 30px "Kantumruy Pro", sans-serif';
            const textMetrics = ctx.measureText(w.word);
            const cardW = Math.max(150, textMetrics.width + 56);
            const cardH = 68;
            const rx = cx - cardW / 2;
            const ry = cy - cardH / 2;

            // Outer Neon Border Halo (Lightning fast GPU draw without software shadowBlur)
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(rx - 4, ry - 4, cardW + 8, cardH + 8, (cardH + 8) / 2);
            } else {
              ctx.rect(rx - 4, ry - 4, cardW + 8, cardH + 8);
            }
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();

            // Capsule Background Gradient
            const grad = ctx.createLinearGradient(rx, ry, rx + cardW, ry + cardH);
            grad.addColorStop(0, w.bgGradStart);
            grad.addColorStop(1, w.bgGradEnd);
            ctx.fillStyle = grad;

            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(rx, ry, cardW, cardH, cardH / 2);
            } else {
              ctx.rect(rx, ry, cardW, cardH);
            }
            ctx.fill();

            // Crisp White Inner Border
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Word Text
            ctx.fillStyle = w.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(w.word, cx, cy + 2);

            ctx.restore();
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
  }, [gameState, showSkeleton, player1Name, player2Name, handleCatchWord, handleStartCountdown]);

  // Touch / Pointer Click interaction on Canvas (Instant Zero Delay fallback)
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    if (gameState !== 'playing' || !singleWordRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const pctX = (px / rect.width) * 100;
    const pctY = (py / rect.height) * 100;
    const player: 1 | 2 = pctX < 50 ? 1 : 2;

    const w = singleWordRef.current;
    const dist = Math.hypot(pctX - w.x, pctY - w.y);
    if (dist < 16) {
      handleCatchWord(player, w.x, w.y);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      handleCanvasInteraction(t.clientX, t.clientY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleCanvasInteraction(e.clientX, e.clientY);
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
            <ArrowLeftIcon size={20} />
            <span className="text-sm font-bold hidden sm:inline">ត្រឡប់</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white shadow-md">
              <HandIcon size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-amber-300 tracking-tight flex items-center gap-1.5">
                <span>ល្បែងចាប់ពាក្យ (AI Hand Tracking)</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 font-mono">
                  1 Word Focus
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden md:block">
                ស្កេនម្រាមដៃ៥៖ សិស្ស ក (ដៃឆ្វេង) vs សិស្ស ខ (ដៃស្ដាំ) - ចាប់បានមួយ ចេញមួយទៀត!
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Live Performance & FPS Indicator */}
          <div 
            className="px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 flex items-center gap-1.5 text-xs font-mono font-bold shadow-inner"
            title="ល្បឿន Render Loop (LERP 60+ FPS Smoot Engine)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
            <span>{fpsDisplay} FPS</span>
            <span className="text-[10px] text-emerald-400 font-sans hidden sm:inline">⚡ រលូន</span>
          </div>

          {/* Camera Status Indicator / Toggle */}
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              if (cameraActive) {
                stopCamera();
              } else {
                startCamera();
              }
            }}
            className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold ${
              cameraActive 
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60' 
                : 'bg-slate-800 text-amber-400 border-amber-500/30 hover:bg-slate-700'
            }`}
            title={cameraActive ? 'Camera កំពុងដំណើរការ' : 'សាកល្បងបើក Camera ឡើងវិញ'}
          >
            {cameraActive ? <CameraIcon size={16} /> : <CameraOffIcon size={16} />}
            <span className="hidden sm:inline">{cameraActive ? 'Camera បើក' : 'របៀប Touch/Click'}</span>
          </button>

          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setIsHowToPlayOpen(true);
            }}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="របៀបលេង"
          >
            <HelpCircleIcon size={18} />
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
            <SettingsIcon size={18} />
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
            {soundEnabled ? <Volume2Icon size={18} /> : <VolumeXIcon size={18} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer"
            title="ពេញអេក្រង់"
          >
            {isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
          </button>
        </div>
      </header>

      {/* MAIN GAME ARENA / CAMERA LIVE VIEWPORT */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        
        {/* Fullscreen Video Canvas with Hand Skeleton & Single Floating Word */}
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouchStart}
          onMouseDown={handleMouseDown}
          className="absolute inset-0 w-full h-full object-cover z-0 cursor-crosshair"
        />

        {/* Ambient Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/60 pointer-events-none z-10" />

        {/* TOP HUD: PLAYER SCORES & ACTIVE SINGLE WORD PROMPT */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between gap-2 pointer-events-none">
          
          {/* Player 1 Score HUD (Left) */}
          <motion.div 
            animate={{ scale: p1Score > 0 ? [1, 1.1, 1] : 1 }}
            className="bg-slate-900/90 backdrop-blur-md p-2.5 sm:p-3.5 rounded-2xl border-2 border-cyan-500/70 shadow-lg shadow-cyan-950/50 flex items-center gap-3 pointer-events-auto"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              <span>ក</span>
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
                <TargetIcon size={20} className="text-purple-950" />
                <span>ដណ្តើមចាប់ពាក្យ ៖</span>
                <span className="text-xl sm:text-2xl text-purple-950 underline decoration-wavy decoration-purple-600 ml-1">
                  {currentWordText}
                </span>
              </div>

              {/* Time Remaining Bar */}
              <div className="mt-1.5 px-3 py-0.5 bg-slate-900/80 backdrop-blur-sm rounded-full text-xs font-mono text-amber-300 border border-slate-700 flex items-center gap-1.5">
                <ClockIcon size={12} />
                <span>{timeLeft}s</span>
              </div>
            </motion.div>
          )}

          {/* Player 2 Score HUD (Right) */}
          <motion.div 
            animate={{ scale: p2Score > 0 ? [1, 1.1, 1] : 1 }}
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
              <span>ខ</span>
            </div>
          </motion.div>
        </div>

        {/* STEP 1: LOBBY SCREEN */}
        {gameState === 'lobby' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-6"
            >
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-xl shadow-cyan-950/60">
                <HandIcon size={48} className="animate-bounce" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-300">
                  ប្រកួតចាប់ពាក្យ (AI 5-Fingers)
                </h2>
                <p className="text-sm sm:text-base text-slate-300 mt-1.5">
                  សិស្ស ក (ដៃឆ្វេង 💙) vs សិស្ស ខ (ដៃស្ដាំ 💖) — <span className="text-amber-300 font-bold">អាចចាប់ឆ្លងបន្ទាត់ដណ្តើមគ្នាពេញអេក្រង់!</span>
                </p>
              </div>

              {/* Player Name Badges */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 bg-cyan-950/60 rounded-2xl border border-cyan-500/40">
                  <div className="text-[11px] font-extrabold text-cyan-400">👈 សិស្ស ក (ដៃឆ្វេង)</div>
                  <input
                    type="text"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="w-full bg-cyan-900/40 font-bold text-white text-sm px-2.5 py-1.5 mt-1 rounded-lg border border-cyan-500/30 focus:outline-none"
                    placeholder="ឈ្មោះសិស្ស ក"
                  />
                </div>

                <div className="p-3.5 bg-rose-950/60 rounded-2xl border border-rose-500/40">
                  <div className="text-[11px] font-extrabold text-rose-400">សិស្ស ខ (ដៃស្ដាំ) 👉</div>
                  <input
                    type="text"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="w-full bg-rose-900/40 font-bold text-white text-sm px-2.5 py-1.5 mt-1 rounded-lg border border-rose-500/30 focus:outline-none text-right"
                    placeholder="ឈ្មោះសិស្ស ខ"
                  />
                </div>
              </div>

              {/* Action Button: Go to Hand Scanner */}
              <button
                onClick={handleProceedToScan}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-98 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-cyan-950/50 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <ScanIcon size={24} />
                <span>ស្កេនដៃសិស្ស (Scan Hands)</span>
              </button>
            </motion.div>
          </div>
        )}

        {/* STEP 2: HAND CALIBRATION & 5-FINGERS SCANNER */}
        {gameState === 'scan' && (
          <div className="absolute top-20 left-0 right-0 z-30 pointer-events-none flex flex-col items-center justify-center">
            <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-cyan-500/50 shadow-2xl text-center space-y-1">
              <div className="text-base sm:text-lg font-black text-amber-300 flex items-center justify-center gap-2">
                <ScanIcon size={20} className="animate-spin text-cyan-400" />
                <span>សូមលាម្រាមដៃទាំង ៥ ដាក់ក្នុងរង្វង់ស្កេន</span>
              </div>
              <p className="text-xs text-slate-300">
                សិស្ស ក (ខាងឆ្វេង ប្រើដៃឆ្វេង 💙) • សិស្ស ខ (ខាងស្ដាំ ប្រើដៃស្ដាំ 💖)
              </p>
            </div>

            {/* Skip / Direct Start Button */}
            <button
              onClick={handleStartCountdown}
              className="mt-3 pointer-events-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-full border border-slate-700 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>រំលងការស្កេន ឬចាប់ផ្ដើមភ្លាម</span>
              <ArrowRightIcon size={14} />
            </button>
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

        {/* GRAB BURST RIPPLE EFFECTS */}
        <AnimatePresence>
          {grabEffects.map((effect) => (
            <motion.div
              key={effect.id}
              initial={{ scale: 0.5, opacity: 1, y: 0 }}
              animate={{ scale: 1.5, opacity: 0, y: -35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              style={{
                left: `${effect.x}%`,
                top: `${effect.y}%`,
                transform: 'translate(-50%, -50%)',
                color: effect.color
              }}
              className="absolute z-30 pointer-events-none font-black text-2xl sm:text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] flex items-center gap-1"
            >
              <SparklesIcon size={28} />
              <span>{effect.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* GAME OVER & WINNER PODIUM */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-2xl text-center space-y-6"
            >
              <div className="inline-flex p-4 rounded-3xl bg-amber-400 text-purple-950 shadow-xl shadow-amber-950/60 animate-bounce">
                <CrownIcon size={52} />
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
                  onClick={handleProceedToScan}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black text-base rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all"
                >
                  <RefreshCwIcon size={18} />
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
                  <HelpCircleIcon size={20} />
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
                  <p><strong>ស្កេនដៃសិស្ស៖</strong> មុនលេង សិស្ស ក (ឆ្វេង) លាដៃឆ្វេង ម្រាមទាំង៥ និងសិស្ស ខ (ស្ដាំ) លាដៃស្ដាំ ម្រាមទាំង៥ ក្នុងរង្វង់ស្កេន។</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <p><strong>ពាក្យចេញម្ដងមួយ៖</strong> នៅពេលចាប់ផ្ដើម ពាក្យតែមួយគត់នឹងអណ្ដែតលើអេក្រង់។</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <p><strong>ដណ្តើមចាប់ពាក្យ៖</strong> សិស្សណាដែលលាដៃចាប់ពាក្យបានមុន នឹងទទួលបាន ១ ពិន្ទុ រួចពាក្យបន្ទាប់នឹងបង្ហាញឡើងភ្លាមៗ!</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                  <p><strong>ចាប់ឆ្លងបន្ទាត់បាន (Cross-Line Grab)៖</strong> សិស្សអាចលូកដៃឆ្លងបន្ទាត់កណ្តាលទៅដណ្តើមចាប់ពាក្យបាន ដោយ AI ចំណាំដៃឆ្វេង (សិស្ស ក) និងដៃស្ដាំ (សិស្ស ខ) ជាប់ជានិច្ច!</p>
                </div>
              </div>

              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black rounded-xl cursor-pointer"
              >
                យល់ព្រម
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                  <SettingsIcon size={20} />
                  <span>ការកំណត់ល្បែង</span>
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                {/* Target Score */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    ពិន្ទុឈ្នះ (Target Score)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((score) => (
                      <button
                        key={score}
                        onClick={() => setTargetScore(score)}
                        className={`py-2 rounded-xl font-bold border cursor-pointer ${
                          targetScore === score 
                            ? 'bg-amber-400 text-purple-950 border-amber-300' 
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floating Speed */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    ល្បឿនអណ្ដែតពាក្យ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'slow', label: 'យឺត' },
                      { id: 'medium', label: 'មធ្យម' },
                      { id: 'fast', label: 'លឿន' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setFloatingSpeed(s.id as any)}
                        className={`py-2 rounded-xl font-bold border cursor-pointer ${
                          floatingSpeed === s.id 
                            ? 'bg-amber-400 text-purple-950 border-amber-300' 
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Spawn Delay Interval */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      រយៈពេលចន្លោះពេលចេញពាក្យបន្ទាប់ (Word Delay)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-500/30">
                      {wordSpawnDelay} វិនាទី
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { value: 0.5, label: '0.5s' },
                      { value: 1.0, label: '1s' },
                      { value: 2.0, label: '2s' },
                      { value: 3.0, label: '3s' },
                      { value: 5.0, label: '5s' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setWordSpawnDelay(opt.value)}
                        className={`py-2 px-1 rounded-xl font-bold border text-xs cursor-pointer transition-all ${
                          wordSpawnDelay === opt.value 
                            ? 'bg-amber-400 text-purple-950 border-amber-300 shadow-md scale-105' 
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ultra Smooth Engine Toggle */}
                <div className="flex items-center justify-between p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40">
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">ម៉ាស៊ីនចលនារលូន (60+ FPS LERP Engine)</span>
                    <span className="text-[10px] text-slate-400">បង្កើនល្បឿន AI 3 ដង & ចលនាដៃ Smooth ឥតរអាក់រអួល</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={performanceMode}
                    onChange={(e) => setPerformanceMode(e.target.checked)}
                    className="w-5 h-5 accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* Skeleton Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-200">បង្ហាញឆ្អឹងម្រាមដៃទាំង៥ (Skeleton)</span>
                  <input
                    type="checkbox"
                    checked={showSkeleton}
                    onChange={(e) => setShowSkeleton(e.target.checked)}
                    className="w-5 h-5 accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Auto Speak Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-200">បញ្ចេញសំឡេងអានពាក្យខ្មែរ</span>
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="w-5 h-5 accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                បិទ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
