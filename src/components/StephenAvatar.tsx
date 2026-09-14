import React, { useEffect, useState } from 'react';

interface StephenAvatarProps {
  isSpeaking: boolean;
  isThinking: boolean;
  isSleeping: boolean;
  themeColor: string;
}

export default function StephenAvatar({ isSpeaking, isThinking, isSleeping, themeColor }: StephenAvatarProps) {
  const [blink, setBlink] = useState(false);

  // Random eye blinking when awake
  useEffect(() => {
    if (isSleeping) return;
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 4500 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [isSleeping]);

  return (
    <div className="relative w-44 h-44 flex items-center justify-center select-none">
      
      {/* Outer Rotating Cybernetic HUD Rings */}
      <div 
        className={`absolute inset-0 rounded-full border-2 border-dashed opacity-30 transition-all duration-1000 ${
          isSleeping ? 'scale-90 animate-[spin_60s_linear_infinite]' : 'animate-[spin_15s_linear_infinite]'
        }`}
        style={{ borderColor: isSleeping ? '#334155' : themeColor }}
      />
      
      <div 
        className={`absolute -inset-1.5 rounded-full border border-double opacity-20 transition-all duration-1000 ${
          isSleeping ? 'opacity-5 scale-95' : 'animate-[spin_25s_linear_infinite_reverse]'
        }`}
        style={{ borderColor: isSleeping ? '#1e293b' : themeColor }}
      />

      {/* Main Holographic Avatar Container */}
      <div className="relative w-36 h-36 rounded-full bg-slate-950/95 border border-slate-800 flex items-center justify-center overflow-hidden shadow-[inset_0_0_25px_rgba(0,0,0,0.9)]">
        
        {/* Horizontal Scanner Bars for Cyberpunk Holo-feed */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-30 z-10" />
        
        {/* Scan line laser overlay */}
        {!isSleeping && (
          <div 
            className="absolute top-0 left-0 w-full h-1 bg-sky-400/40 blur-[1px] animate-[bounce_5s_infinite_ease-in-out] z-10"
            style={{ backgroundColor: themeColor }}
          />
        )}

        {/* Ambient sleeping pulse or active processing light */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 mix-blend-color-dodge pointer-events-none z-0 ${
            isSleeping ? 'bg-indigo-950/20 animate-pulse' : 'bg-transparent'
          }`}
        />

        {/* Vector SVG Drawing of Stephen (Powerful Male Cybernetic Intelligence) */}
        <svg viewBox="0 0 100 100" className="w-28 h-28 z-0 transition-all duration-700 transform hover:scale-105">
          <defs>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isSleeping ? '#1e293b' : '#0ea5e9'} />
              <stop offset="100%" stopColor={isSleeping ? '#0f172a' : '#4f46e5'} />
            </linearGradient>
            
            <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* 1. Cybernetic neck & metallic collar plates */}
          <path d="M42 78 L58 78 L55 90 L45 90 Z" fill="url(#faceGrad)" stroke={isSleeping ? '#334155' : themeColor} strokeWidth="1" />
          <path d="M34 88 C34 82, 66 82, 66 88 L64 98 L36 98 Z" fill="#1e293b" stroke={isSleeping ? '#1e293b' : themeColor} strokeWidth="1" opacity="0.8" />
          
          {/* Cyber collar diagnostic lights */}
          {!isSleeping && (
            <>
              <circle cx="50" cy="85" r="1.5" fill={themeColor} className="animate-ping" />
              <circle cx="50" cy="85" r="1" fill={themeColor} />
            </>
          )}

          {/* 2. Structured, Strong Masculine Face Shape */}
          <path 
            d="M35 40 C35 25, 65 25, 65 40 C65 54, 58 64, 50 69 C42 64, 35 54, 35 40 Z" 
            fill="url(#faceGrad)" 
            stroke={isSleeping ? '#334155' : themeColor} 
            strokeWidth="1.2" 
          />

          {/* 3. Hair (Masculine modern undercut cyberpunk style) */}
          <path d="M33 38 C32 24, 68 24, 67 38 C63 32, 57 30, 50 32 C43 30, 37 32, 33 38 Z" fill="url(#hairGrad)" filter={isSleeping ? undefined : "url(#glow)"} />
          {/* Clean shave side fades */}
          <path d="M34 38 L34 46 L37 40 Z" fill="#1e293b" opacity="0.6" />
          <path d="M66 38 L66 46 L63 40 Z" fill="#1e293b" opacity="0.6" />

          {/* 4. Cyber Headset & Recievers */}
          <rect x="31" y="40" width="3" height="10" rx="1.5" fill={isSleeping ? '#334155' : themeColor} />
          <rect x="66" y="40" width="3" height="10" rx="1.5" fill={isSleeping ? '#334155' : themeColor} />

          {/* 5. Eyes (Open glowing vs. Sleeping vs. Blinking) */}
          {isSleeping ? (
            /* Closed sleeping eyes with gentle neon breathing pulse lines */
            <>
              <path d="M40 48 Q44 51 47 48" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M53 48 Q56 51 60 48" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </>
          ) : blink ? (
            /* Normal temporary blink */
            <>
              <path d="M40 48 L47 48" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" />
              <path d="M53 48 L60 48" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : (
            /* Open powerful glowing male eyes */
            <>
              {/* Eyelid shadow */}
              <ellipse cx="43.5" cy="47.5" rx="3.5" ry="1.8" fill="#020617" stroke={themeColor} strokeWidth="1" />
              <circle cx="43.5" cy="47.5" r="1.5" fill="#38bdf8" className="animate-pulse" />
              <circle cx="44.2" cy="46.8" r="0.5" fill="#ffffff" /> {/* Reflection */}

              <ellipse cx="56.5" cy="47.5" rx="3.5" ry="1.8" fill="#020617" stroke={themeColor} strokeWidth="1" />
              <circle cx="56.5" cy="47.5" r="1.5" fill="#38bdf8" className="animate-pulse" />
              <circle cx="57.2" cy="46.8" r="0.5" fill="#ffffff" /> {/* Reflection */}
            </>
          )}

          {/* Sharp masculine eyebrows */}
          <path d="M39 42 Q44 40 48 43" stroke={isSleeping ? '#334155' : themeColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M52 43 Q56 40 61 42" stroke={isSleeping ? '#334155' : themeColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* Masculine nose bridge */}
          <path d="M48 49 L50 49 L50 54 L48 55" stroke={isSleeping ? '#1e293b' : themeColor} strokeWidth="0.8" fill="none" opacity="0.6" />

          {/* 6. Mouth / Lip Sync */}
          {isSleeping ? (
            /* Calm straight lip line in sleep mode */
            <line x1="46" y1="59" x2="54" y2="59" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          ) : isSpeaking ? (
            /* Active speech animation oval */
            <ellipse 
              cx="50" 
              cy="59" 
              rx="3.5" 
              ry={2.5 + Math.sin(Date.now() / 50) * 1.5} 
              fill="#0ea5e9" 
              stroke="#ffffff" 
              strokeWidth="0.8" 
            />
          ) : isThinking ? (
            /* Concentrating mouth */
            <line x1="47" y1="59" x2="53" y2="59" stroke={themeColor} strokeWidth="2" strokeLinecap="round" />
          ) : (
            /* Subtle powerful half-smile / active status */
            <path d="M46 59 Q50 61 54 59" stroke={themeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          )}

          {/* Cybernetic side cheek circuits */}
          {!isSleeping && (
            <>
              <path d="M37 53 L39 55 L37 57" stroke={`${themeColor}aa`} strokeWidth="0.8" fill="none" />
              <path d="M63 53 L61 55 L63 57" stroke={`${themeColor}aa`} strokeWidth="0.8" fill="none" />
            </>
          )}
        </svg>

        {/* Real-time spectrum bar overlay at the bottom when speaking */}
        {isSpeaking && !isSleeping && (
          <div className="absolute bottom-2.5 flex items-end justify-center space-x-0.5 w-full z-10 px-6 animate-pulse">
            <div className="w-1 bg-cyan-500 rounded-full animate-[bounce_0.5s_infinite_ease-in-out_100ms]" style={{ height: '7px' }} />
            <div className="w-1 bg-sky-500 rounded-full animate-[bounce_0.3s_infinite_ease-in-out_200ms]" style={{ height: '15px' }} />
            <div className="w-1 bg-blue-500 rounded-full animate-[bounce_0.4s_infinite_ease-in-out_300ms]" style={{ height: '9px' }} />
            <div className="w-1 bg-indigo-500 rounded-full animate-[bounce_0.2s_infinite_ease-in-out_400ms]" style={{ height: '17px' }} />
            <div className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.5s_infinite_ease-in-out_500ms]" style={{ height: '11px' }} />
          </div>
        )}

        {/* Offline overlay label when asleep */}
        {isSleeping && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-20">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 animate-pulse">STANDBY / SLEEP</span>
            <span className="text-[8px] text-indigo-400/70 mt-0.5">ENERGY_SAVE_MODE</span>
          </div>
        )}

      </div>
    </div>
  );
}
