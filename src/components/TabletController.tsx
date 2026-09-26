import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  RotateCcw, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Send, 
  Delete,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { playClickSound, playSuccessSound, playFailSound } from '../utils/audio';

export default function TabletController() {
  const queryParams = new URLSearchParams(window.location.search);
  const roomId = queryParams.get('room') || 'TUG-ROOM';
  const teamParam = parseInt(queryParams.get('team') || '1', 10);
  const team: 1 | 2 = teamParam === 2 ? 2 : 1;

  const isTeam1 = team === 1;
  const teamName = isTeam1 ? 'ក្រុមទី ១ (Tablet A)' : 'ក្រុមទី ២ (Tablet B)';
  const themeColor = isTeam1 ? 'from-blue-600 via-indigo-600 to-blue-800' : 'from-rose-600 via-pink-600 to-rose-800';
  const badgeBg = isTeam1 ? 'bg-blue-500' : 'bg-rose-500';
  const headerBorder = isTeam1 ? 'border-blue-400' : 'border-rose-400';

  const [connected, setConnected] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'math' | 'quiz'>('math');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [inputVal, setInputVal] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [statusMsg, setTeacherStatusMsg] = useState<string | null>(null);

  // Poll server for status & current question
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/tug/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, team })
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setConnected(true);
            if (data.gameMode) setGameMode(data.gameMode);
            if (data.question) setCurrentQuestion(data.question);
          }
        } else {
          if (isMounted) setConnected(false);
        }
      } catch {
        if (isMounted) setConnected(false);
      }
    }, 600);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, team]);

  // Submit Answer to server
  const submitAnswer = async (ansText: string) => {
    if (!ansText.trim() || sending) return;
    playClickSound();
    setSending(true);

    try {
      const res = await fetch('/api/tug/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, team, answer: ansText.trim() })
      });

      if (res.ok) {
        playSuccessSound();
        setLastSubmitted(ansText);
        setInputVal('');
        setTeacherStatusMsg('បានបញ្ជូនចម្លើយរួចរាល់! 🚀');
        setTimeout(() => setTeacherStatusMsg(null), 1500);
      } else {
        playFailSound();
      }
    } catch {
      playFailSound();
    } finally {
      setSending(false);
    }
  };

  // Touch Keypad Button Click
  const handleKeypadPress = (val: string) => {
    playClickSound();
    if (val === 'C') {
      setInputVal('');
    } else if (val === 'backspace') {
      setInputVal(prev => prev.slice(0, -1));
    } else if (val === '.') {
      setInputVal(prev => prev.includes('.') ? prev : (prev || '0') + '.');
    } else if (val === 'submit') {
      submitAnswer(inputVal);
    } else {
      if (inputVal.length < 8) {
        setInputVal(prev => prev === '0' ? val : prev + val);
      }
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];
  const khmerPrefixes = ['ក', 'ខ', 'គ', 'ឃ'];

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${themeColor} text-white flex flex-col justify-between p-3 sm:p-6 select-none font-sans overflow-x-hidden`}>
      
      {/* Top Header Bar */}
      <div className={`w-full bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between border ${headerBorder} shadow-lg shrink-0 mb-3`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl ${badgeBg} flex items-center justify-center text-white shadow-md font-black`}>
            <Smartphone size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black tracking-wide leading-tight">{teamName}</h1>
            <p className="text-[11px] sm:text-xs text-white/80 font-bold font-mono">បន្ទប់ ៖ {roomId}</p>
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-xs ${
          connected ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white animate-pulse'
        }`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{connected ? 'បានតភ្ជាប់' : 'កំពុងភ្ជាប់...'}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 w-full max-w-xl mx-auto flex flex-col justify-center gap-4 my-auto">
        
        {/* Status Toast */}
        {statusMsg && (
          <div className="bg-emerald-400 text-stone-900 font-black text-center py-2 px-4 rounded-xl shadow-lg animate-bounce text-sm sm:text-base">
            {statusMsg}
          </div>
        )}

        {/* Question Display Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 text-stone-900 shadow-2xl border-4 border-white/20 text-center relative overflow-hidden">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider bg-stone-100 text-stone-600 px-3 py-1 rounded-full border border-stone-200 inline-block mb-2">
            {gameMode === 'math' ? '🧮 សំណួរគណិតវិទ្យា' : '❓ សំណួរពហុជម្រើស'}
          </span>

          {gameMode === 'math' ? (
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black font-mono text-slate-900 tracking-wider">
                {currentQuestion ? `${currentQuestion.num1} ${currentQuestion.op} ${currentQuestion.num2} = ?` : '៤ + ១០ = ?'}
              </h2>

              {/* Typed Answer Input Box */}
              <div className="bg-stone-100 border-2 border-stone-300 rounded-2xl py-3 px-4 flex items-center justify-between min-h-[60px] shadow-inner">
                <span className="text-stone-400 font-bold text-xs">ចម្លើយរបស់អ្នក ៖</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-indigo-700 tracking-wider">
                  {inputVal || <span className="text-stone-300">?</span>}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {currentQuestion?.question || 'ជ្រើសរើសចម្លើយ A, B, C, D ខាងក្រោម៖'}
              </h2>
            </div>
          )}
        </div>

        {/* CONTROLLER CONTROLS */}
        {gameMode === 'math' ? (
          /* MATH TOUCH KEYPAD */
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(key => (
                <button
                  key={key}
                  onClick={() => handleKeypadPress(key)}
                  className={`py-4 sm:py-5 rounded-2xl font-black text-2xl sm:text-3xl shadow-lg transition-transform duration-100 active:scale-90 cursor-pointer flex items-center justify-center border-2 ${
                    key === 'backspace'
                      ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600'
                      : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  {key === 'backspace' ? <Delete size={28} /> : key}
                </button>
              ))}
            </div>

            {/* Clear and Submit Big Buttons */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => handleKeypadPress('C')}
                className="py-4 bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-800 font-black text-xl rounded-2xl shadow-md border-2 border-stone-300 cursor-pointer"
              >
                C (លុប)
              </button>

              <button
                onClick={() => submitAnswer(inputVal)}
                disabled={!inputVal || sending}
                className="col-span-2 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-emerald-600 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={28} strokeWidth={3} />
                <span>✓ ផ្ញើចម្លើយ</span>
              </button>
            </div>
          </div>
        ) : (
          /* QUIZ 4 BIG OPTION CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {(currentQuestion?.options || ['ជម្រើសទី ១', 'ជម្រើសទី ២', 'ជម្រើសទី ៣', 'ជម្រើសទី ៤']).map((optText: string, idx: number) => {
              const optionColors = [
                { bg: 'bg-[#0284c7] hover:bg-[#0369a1]', border: 'border-[#0284c7]' },
                { bg: 'bg-[#e11d48] hover:bg-[#be123c]', border: 'border-[#e11d48]' },
                { bg: 'bg-[#059669] hover:bg-[#047857]', border: 'border-[#059669]' },
                { bg: 'bg-[#d97706] hover:bg-[#b45309]', border: 'border-[#d97706]' },
              ];
              const theme = optionColors[idx % optionColors.length];

              return (
                <button
                  key={idx}
                  disabled={sending}
                  onClick={() => submitAnswer(String(idx))}
                  className={`w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white text-stone-900 border-4 ${theme.border} shadow-xl transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-3 text-left`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${theme.bg} text-white font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md`}>
                    {optionLabels[idx]}
                  </div>
                  <div className="flex-1 font-extrabold text-base sm:text-lg break-words leading-snug">
                    <span className="text-stone-400 text-xs font-bold block">{khmerPrefixes[idx]}.</span>
                    <span>{optText}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="text-center text-xs text-white/70 font-bold shrink-0 pt-3">
        {lastSubmitted && (
          <span className="bg-white/20 px-3 py-1 rounded-full text-white font-mono">
            ចម្លើយចុងក្រោយ ៖ {lastSubmitted}
          </span>
        )}
      </div>

    </div>
  );
}
