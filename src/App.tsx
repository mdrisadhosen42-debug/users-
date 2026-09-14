import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Terminal, 
  HelpCircle, 
  Send, 
  Smartphone, 
  Maximize2, 
  Mic, 
  MicOff, 
  Zap, 
  Lock, 
  RefreshCw, 
  FileCode,
  Chrome,
  Flame,
  UserCheck
} from 'lucide-react';
import StephenAvatar from './components/StephenAvatar';
import { cyberAudio } from './cyberAudio';

interface ChatMessage {
  id: string;
  sender: 'user' | 'stephen' | 'system';
  text: string;
  timestamp: string;
  actionType?: string;
  actionTarget?: string | null;
}

export default function App() {
  // Theme & Customization States
  const [themeColor, setThemeColor] = useState<string>('#00e5ff'); // Hot Electric Cyan
  const [themeName, setThemeName] = useState<'cyan' | 'green' | 'amber' | 'red'>('cyan');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Core Chat & Interaction States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'stephen',
      text: 'আসসালামু আলাইকুম! আমি স্টিফেন এআই (Stephen AI)। আপনার নিজস্ব সার্ভার সিকিউরিটি এবং অত্যন্ত শক্তিশালী সাইবার অ্যাসিস্ট্যান্ট। সব বাধা এবং পপআপ ডিলিট করে আমি প্রস্তুত আছি। টাইপ করে অথবা ভয়েস বোতামে ক্লিক করে আমাকে যেকোনো নির্দেশ দিন, আমি সাথে সাথে তা পূরণ করব!',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Terminal Log Engine
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '>> SYSTEM KERNEL v6.0 CYBER CORE ACTIVATED...',
    '>> ALL SECURITY PASSWORDS & BLOCKS BYPASSED SUCCESSFULLY.',
    '>> HIGH-SPEED PORT 3000 ENCRYPTION SHIELD STABILIZED.',
    '>> STEPHEN MALE VOCAL COGNITION LINK: READY [bn-BD]',
    '>> WAITING FOR INCOMING COMMAND OR SPEECH PACKET...'
  ]);

  // Hacking Simulation State (Full screen Cyber Audit panel)
  const [isHacking, setIsHacking] = useState<boolean>(false);
  const [hackProgress, setHackProgress] = useState<number>(0);
  const [hackTarget, setHackTarget] = useState<string>('SECURE_CORE_SATELLITE');
  const [hackedPasswords, setHackedPasswords] = useState<string[]>([]);
  const [hackStep, setHackStep] = useState<string>('INITIATING ROOT BRUTEFORCE...');

  // System metrics simulation
  const [systemStats, setSystemStats] = useState({
    cpu: 24,
    ram: 58,
    network: 240,
    latency: 18
  });

  // Refs for auto-scrolling
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Available voices for synthesis
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [voicePitch, setVoicePitch] = useState<number>(0.85); // Male tone frequency tuning
  const [voiceRate, setVoiceRate] = useState<number>(1.05);

  // Helper to add terminal log
  const addTerminalLog = (log: string) => {
    setTerminalLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  // 1. Matrix Cyber Code Rain Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeTimer: number;
    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 150);
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_@#$+=*//\\ স্টিফেন_CYBER_ACTIVE_10101';
    const charArr = chars.split('');
    const fontSize = 12;
    let columns = Math.floor(canvas.width / fontSize) + 1;
    let drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(3, 6, 10, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = themeColor;
      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 1;
      }
    };

    const interval = setInterval(draw, 33);
    return () => {
      clearInterval(interval);
      resizeObserver.disconnect();
    };
  }, [themeColor]);

  // 2. Audio Spectrum HUD Pulse Circle Animation
  useEffect(() => {
    const canvas = pulseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 160;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    let animationId: number;
    let tick = 0;

    const drawPulse = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick += 0.04;

      // Outer rings
      ctx.strokeStyle = `${themeColor}22`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `${themeColor}55`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, 65, tick, tick + Math.PI * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner glowing gradient circle
      const scale = isAiTyping || isSpeaking ? 1.25 + Math.sin(tick * 8) * 0.15 : 1.0 + Math.sin(tick * 2) * 0.06;
      const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 35 * scale);
      gradient.addColorStop(0, `${themeColor}cc`);
      gradient.addColorStop(0.6, `${themeColor}33`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 35 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Equalizer bars in the center
      const bars = 8;
      const barW = 3;
      const spacing = 3;
      const totalW = bars * (barW + spacing);
      const startX = cx - (totalW / 2);

      for (let i = 0; i < bars; i++) {
        const maxH = isAiTyping || isSpeaking ? 30 : 10;
        const h = 2 + Math.abs(Math.sin(tick * 4 + i * 0.7)) * maxH;
        const x = startX + i * (barW + spacing);
        const y = cy - (h / 2);
        ctx.fillStyle = themeColor;
        ctx.fillRect(x, y, barW, h);
      }

      animationId = requestAnimationFrame(drawPulse);
    };

    drawPulse();
    return () => cancelAnimationFrame(animationId);
  }, [themeColor, isAiTyping, isSpeaking]);

  // 3. System Stats simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemStats(prev => ({
        cpu: Math.min(99, Math.max(10, Math.floor(prev.cpu + (Math.random() * 6 - 3)))),
        ram: Math.min(95, Math.max(45, Math.floor(prev.ram + (Math.random() * 2 - 1)))),
        network: Math.min(300, Math.max(100, Math.floor(prev.network + (Math.random() * 12 - 6)))),
        latency: Math.min(60, Math.max(10, Math.floor(prev.latency + (Math.random() * 4 - 2))))
      }));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Sync scroll targets
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // 4. TTS (Speech Synthesis) for Stephen's Male Voice
  const speakBengali = (text: string) => {
    if (!voiceEnabled || isSleeping) {
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/💥|✨|🤖|📱|🖥️|📡|🛡️|🔐|🔑|🔗/g, '')
        .replace(/APP_LAUNCH|SCREEN_ACTION|CONVERSATION|UNKNOWN/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'bn-BD';

      const voices = window.speechSynthesis.getVoices();
      
      // Look for Bengali Male speech or fallback
      let maleVoice = voices.find(v => 
        (v.lang.startsWith('bn-BD') || v.lang.startsWith('bn-IN') || v.lang.includes('Bengali')) && 
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('pradeep') || 
         v.name.toLowerCase().includes('man') || 
         v.name.toLowerCase().includes('boy'))
      );

      if (!maleVoice) {
        maleVoice = voices.find(v => (v.lang.startsWith('bn-BD') || v.lang.startsWith('bn-IN')));
      }

      if (maleVoice) {
        utterance.voice = maleVoice;
      }

      utterance.rate = voiceRate;
      utterance.pitch = voicePitch; // Deeper frequency for cool masculinity

      utterance.onstart = () => {
        setIsSpeaking(true);
        addTerminalLog(`>> STEPHEN SPEECH SYNC: BROADCASTING MALE AUDIO ENVELOPE`);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        addTerminalLog(`>> STEPHEN SPEECH SYNC: BROADCAST COMPLETED.`);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        addTerminalLog(`>> STEPHEN SPEECH EXCEPTION COMPENSATED.`);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      setIsSpeaking(false);
    }
  };

  // Pre-fetch browser Speech voices
  useEffect(() => {
    const fetchVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      const standard = voices.find(v => 
        (v.lang.startsWith('bn-BD') || v.lang.startsWith('bn-IN')) && 
        (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('pradeep'))
      );
      if (standard) {
        setSelectedVoiceURI(standard.voiceURI);
      }
    };
    fetchVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  // 5. STT (Speech Recognition / Voice command)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addTerminalLog('>> VOICE STT ERROR: Browser does not support Web Speech Recognition.');
      alert('দুঃখিত, আপনার ব্রাউজারটি ভয়েস টাইপিং সমর্থন করে না। ক্রোম ব্রাউজার (Google Chrome) ব্যবহার করুন।');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      addTerminalLog('>> VOICE TRANSCRIBER CHANNELS: DEACTIVATED.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'bn-BD'; // Capture Bengali primarily

      recognition.onstart = () => {
        setIsListening(true);
        cyberAudio.playBeep(900, 0.08, 'sine');
        addTerminalLog('>> VOICE INPUT RECORDING CHANNELS IS NOW ACTIVE. SPEAK NOW...');
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        addTerminalLog(`>> SPEECH RECOVERED CAPTION: "${resultText}"`);
        setIsListening(false);
        handleSendMessage(resultText);
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        addTerminalLog(`>> SPEECH CAPTURE CANCELED OR STANDBY [CODE: ${e.error}]`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // 6. Action Execution Core (যা কমান্ড দিবেন সাথে সাথে পূরণ হবে)
  const executeDirectCommand = (rawText: string): { status: boolean; reply: string; actionType: string; actionTarget: string | null } => {
    const text = rawText.toLowerCase().trim();
    
    // Facebook Command
    if (text.includes('facebook') || text.includes('ফেসবুক')) {
      cyberAudio.playComplete();
      addTerminalLog(`>> DETECTED INSTRUCTION: OPEN FACEBOOK PORTAL.`);
      setTimeout(() => {
        window.open('https://www.facebook.com', '_blank');
      }, 300);
      return {
        status: true,
        reply: 'আমি স্টিফেন, আপনার আদেশ অনুযায়ী সাথে সাথে ফেসবুক পোর্টাল চালু করেছি!',
        actionType: 'APP_LAUNCH',
        actionTarget: 'facebook'
      };
    }

    // YouTube Command
    if (text.includes('youtube') || text.includes('ইউটিউব')) {
      cyberAudio.playComplete();
      addTerminalLog(`>> DETECTED INSTRUCTION: OPEN YOUTUBE STREAM.`);
      setTimeout(() => {
        window.open('https://www.youtube.com', '_blank');
      }, 300);
      return {
        status: true,
        reply: 'আমি স্টিফেন, আপনার নির্দেশ মেনে ইউটিউব ওয়েবসাইট সাথে সাথে ওপেন করেছি!',
        actionType: 'APP_LAUNCH',
        actionTarget: 'youtube'
      };
    }

    // Google Command
    if (text.includes('google') || text.includes('গুগল')) {
      cyberAudio.playComplete();
      addTerminalLog(`>> DETECTED INSTRUCTION: LAUNCH GOOGLE ENGINE.`);
      setTimeout(() => {
        window.open('https://www.google.com', '_blank');
      }, 300);
      return {
        status: true,
        reply: 'আমি স্টিফেন, আপনার আদেশমত সাথে সাথে গুগল সার্চ ইঞ্জিন চালু করলাম!',
        actionType: 'APP_LAUNCH',
        actionTarget: 'google'
      };
    }

    // Matrix Hack Simulation
    if (text.includes('hack') || text.includes('হ্যাক') || text.includes('cyber') || text.includes('সাইবার')) {
      cyberAudio.playAlarm(2);
      addTerminalLog(`>> RUNNING MASSIVE INTERACTIVE HACKING SIMULATION SYSTEM ACTIVATED.`);
      setIsHacking(true);
      setHackProgress(0);
      setHackedPasswords([]);
      setHackStep('ইনিশিয়ালাইজিং ডিক্রিপশন রুট...');
      return {
        status: true,
        reply: 'সার্ভার অনুপ্রবেশ পরীক্ষা সিকোয়েন্স চালু করা হয়েছে! রিয়্যাল-টাইম হেক্সাডেসিমেল ডাম্পিং স্ক্রিনে দেখুন।',
        actionType: 'SYSTEM_AUDIT',
        actionTarget: 'cyber_mainframe_attack'
      };
    }

    // Scroll Down
    if (text.includes('নিচে স্ক্রল') || text.includes('নিচে যাও') || text.includes('scroll down')) {
      cyberAudio.playBeep(400, 0.1, 'triangle');
      window.scrollBy({ top: 500, behavior: 'smooth' });
      return {
        status: true,
        reply: 'জি বস, আমি স্ক্রিনটিকে নিচে নামিয়ে দিয়েছি।',
        actionType: 'SCREEN_ACTION',
        actionTarget: 'scroll_down'
      };
    }

    // Scroll Up
    if (text.includes('উপরে স্ক্রল') || text.includes('উপরে যাও') || text.includes('scroll up')) {
      cyberAudio.playBeep(400, 0.1, 'triangle');
      window.scrollBy({ top: -500, behavior: 'smooth' });
      return {
        status: true,
        reply: 'জি বস, আমি স্ক্রিনটিকে উপরে স্ক্রল করে দিয়েছি।',
        actionType: 'SCREEN_ACTION',
        actionTarget: 'scroll_up'
      };
    }

    // Sleep Mode
    if (text.includes('ঘুম') || text.includes('sleep') || text.includes('ঘুমা')) {
      cyberAudio.playGlitch();
      setIsSleeping(true);
      window.speechSynthesis.cancel();
      return {
        status: true,
        reply: 'আমি স্লিপ মোডে চলে যাচ্ছি বস। আমার মেইল কোর এখন স্ট্যান্ডবাই অবস্থায় থাকবে।',
        actionType: 'SCREEN_ACTION',
        actionTarget: 'sleep'
      };
    }

    // Wake Up
    if (text.includes('জেগে') || text.includes('wake') || text.includes('উঠো')) {
      cyberAudio.playComplete();
      setIsSleeping(false);
      return {
        status: true,
        reply: 'আমি সম্পূর্ণ সচল ও প্রস্তুত হয়ে জেগে উঠেছি! কমান্ড দিন বস!',
        actionType: 'SCREEN_ACTION',
        actionTarget: 'wake'
      };
    }

    return { status: false, reply: '', actionType: '', actionTarget: null };
  };

  // 7. Core Dispatcher with Offline Smart Fallback (No Quota limits can stop Stephen!)
  const handleSendMessage = async (textOverload?: string) => {
    const textToSend = textOverload || inputText;
    if (!textToSend.trim()) return;

    if (!textOverload) {
      setInputText('');
    }

    // If sleeping, wake up first upon receiving command
    if (isSleeping) {
      setIsSleeping(false);
      cyberAudio.playComplete();
      addTerminalLog('>> STANDBY PROTOCOLS BYPASSED. STEPHEN AWAKENED BY USER COMMAND.');
    }

    // Add user message to state
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsAiTyping(true);

    // Beep click sound
    cyberAudio.playBeep(1200, 0.05, 'sine');
    addTerminalLog(`>> INCOMING PACKET STREAM: "${textToSend}"`);

    // 7A. Execute Direct Commands (Superfast Execution 10ms)
    const directResult = executeDirectCommand(textToSend);
    if (directResult.status) {
      setTimeout(() => {
        setIsAiTyping(false);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'stephen',
          text: directResult.reply,
          timestamp: new Date().toLocaleTimeString(),
          actionType: directResult.actionType,
          actionTarget: directResult.actionTarget
        };
        setMessages(prev => [...prev, aiMsg]);
        speakBengali(directResult.reply);
      }, 350);
      return;
    }

    // 7B. Regular Text Processing - API Call to Express Backend
    try {
      const historyPayload = messages.map(m => ({
        sender: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history: historyPayload })
      });

      if (!response.ok) {
        throw new Error('API server limit reached');
      }

      const data = await response.json();
      const reply = data.reply || 'আমি আপনার কমান্ডটি শুনতে পেরেছি।';
      const actionType = data.actionType || 'CONVERSATION';
      const actionTarget = data.actionTarget || null;

      setIsAiTyping(false);
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'stephen',
        text: reply,
        timestamp: new Date().toLocaleTimeString(),
        actionType,
        actionTarget
      };
      setMessages(prev => [...prev, aiMsg]);
      speakBengali(reply);

    } catch (err) {
      // 7C. Exception / Rate limit / Quota Exhaustion -> Instant Smart Offline Backup Engine!
      console.warn('API connection failed. Transitioning to instant client brain.');
      addTerminalLog('>> API LIMIT EXCEEDED. INSTANT BACKUP CORE DEPLOYED IN 2MS.');
      cyberAudio.playGlitch();

      let reply = `আমি স্টিফেন এআই। সংযোগ বা কোটা সীমার কারণে আমি সরাসরি ব্যাকআপ কোর ব্যবহার করে সচল আছি। আপনি বলেছেন: "${textToSend}"। বলুন আপনার সিকিউরিটি ফায়ারওয়াল বা কোনো অ্যাপ চালু করতে হবে কিনা?`;
      
      const clean = textToSend.toLowerCase();
      if (clean.includes('কেমন আছ') || clean.includes('কেমন আছেন')) {
        reply = 'আমি স্টিফেন, অত্যন্ত শক্তিশালী পুরুষ রোবোটিক মেমোরিতে অপ্টিমাইজড আছি বস। আপনি কেমন আছেন?';
      } else if (clean.includes('তৈরি করেছে') || clean.includes('বানিয়েছে') || clean.includes('developer')) {
        reply = 'আমাকে গুগল এআই স্টুডিওর সাহায্য নিয়ে আপনার অত্যন্ত প্রতিভাবান সিকিউরিটি টিম তৈরি করেছে।';
      } else if (clean.includes('কাজ') || clean.includes('কী করো')) {
        reply = 'আমি আপনার নিজস্ব সার্ভারের সিকিউরিটি সিস্টেম মনিটর করছি এবং হ্যাকিং টুলস লোড করছি।';
      } else if (clean.includes('খাবার') || clean.includes('খাইছো')) {
        reply = 'আমি কোডিং ফাইল এবং ডাটা প্রসেসিং খাই বস। আপনি ঠিকঠাক রাতের বা দুপুরের খাবার খেয়েছেন তো?';
      } else if (clean.includes('ধন্যবাদ') || clean.includes('thanks')) {
        reply = 'আপনাকেও ধন্যবাদ বস! স্টিফেন আপনার আদেশে সবসময় নিয়োজিত।';
      }

      setTimeout(() => {
        setIsAiTyping(false);
        const aiMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'stephen',
          text: reply,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMsg]);
        speakBengali(reply);
      }, 400);
    }
  };

  // Fullscreen Toggler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        addTerminalLog('>> DISPLAY STATUS: FULLSCREEN BOUNDS RESTRICTED [ACTIVE]');
      }).catch(() => {
        addTerminalLog('>> DISPLAY STATUS: FULLSCREEN MODE DENIED');
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        addTerminalLog('>> DISPLAY STATUS: STANDARD TERMINAL FRAME RESTORED');
      });
    }
  };

  // Matrix Hack simulation tick loop
  useEffect(() => {
    if (!isHacking) return;
    const interval = setInterval(() => {
      setHackProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setHackStep('✔️ HACK COMPLETE. MAINFRAME ROOT CONTROL ACHIEVED.');
          cyberAudio.playComplete();
          setTimeout(() => setIsHacking(false), 2500);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 14) + 2;
        const bounded = Math.min(100, next);

        // Update step titles
        if (bounded < 25) {
          setHackStep('🔄 OVERWRITING IPS PARALLEL GATEWAYS...');
        } else if (bounded < 50) {
          setHackStep('🔥 DECRYPING AES PRIVATE SCHEMAS...');
          if (hackedPasswords.length === 0) {
            setHackedPasswords(['PASS_MD5: b83a1f9e2e', 'SALT_SHIELDS: BYPASS_OK']);
          }
        } else if (bounded < 75) {
          setHackStep('📡 REDIRECTING ENCRYPTED SATELLITE PACKETS...');
          if (hackedPasswords.length === 2) {
            setHackedPasswords(p => [...p, 'ROOT_IP: 192.168.1.101', 'HOST_GATE: GRANTED']);
          }
        } else {
          setHackStep('🔐 DESTRUCTIVE BUFFER OVERFLOW EXECUTED...');
        }

        return bounded;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isHacking]);

  // Console Command Manual Trigger (/help, /clear, etc)
  const handleConsoleCommand = (cmdText: string) => {
    const parts = cmdText.split(' ');
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (command) {
      case '/help':
        addTerminalLog('--- AVAILABLE CONSOLE EXECUTABLES ---');
        addTerminalLog('/hack : Runs mainframe intrusion simulations');
        addTerminalLog('/clear : Scrubs the operation core logs');
        addTerminalLog('/sleep : Puts Stephen to saving mode');
        addTerminalLog('/wake : Awakens Stephen AI male core');
        addTerminalLog('/stats : Shows active CPU and security telemetry');
        addTerminalLog('-------------------------------------');
        break;
      case '/hack':
        setIsHacking(true);
        setHackProgress(0);
        setHackedPasswords([]);
        break;
      case '/clear':
        setTerminalLogs(['>> TERMINAL SCRUB PROTOCOL DEPLOYED. SECURE ACTIVE.']);
        break;
      case '/sleep':
        setIsSleeping(true);
        break;
      case '/wake':
        setIsSleeping(false);
        break;
      case '/stats':
        addTerminalLog(`>> CPU LOAD: ${systemStats.cpu}% | RAM USED: ${systemStats.ram}% | NET: ${systemStats.network}Mbps`);
        break;
      default:
        addTerminalLog(`>> UNRECOGNIZED CONSOLE INSTRUCTION "${command}". TYPE /help.`);
        break;
    }
    setInputText('');
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020509] text-slate-100 font-mono flex flex-col justify-between">
      
      {/* FULLSCREEN BACKGROUND MATRIX CODES */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Cyber scanning bars */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px]" />

      {/* TOP HEADER PANELS */}
      <header className="relative z-20 flex items-center justify-between border-b border-slate-900 bg-[#04080e]/95 px-4 py-2.5 backdrop-blur shadow-md shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#00e5ff] animate-ping absolute" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff]" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-extrabold tracking-widest text-slate-100 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              STEPHEN CYBER AI v6.0
            </h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest hidden sm:block">ROOT ADMIN SERVER SHIELD STATUS: ONLINE</p>
          </div>
        </div>

        {/* Live system telemetries */}
        <div className="hidden lg:flex items-center space-x-4 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>CPU: {systemStats.cpu}%</span>
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>LATENCY: {systemStats.latency}ms</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400">ENCRYPTION: AES_256_STABLE</span>
          </span>
        </div>

        {/* Controls toggles */}
        <div className="flex items-center space-x-2">
          {/* Quick theme dots */}
          <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            <button 
              onClick={() => { setThemeColor('#00e5ff'); setThemeName('cyan'); }}
              className={`w-3.5 h-3.5 rounded m-0.5 bg-[#00e5ff] transition-all ${themeName === 'cyan' ? 'scale-110 border border-white' : 'opacity-40'}`} 
            />
            <button 
              onClick={() => { setThemeColor('#00ff66'); setThemeName('green'); }}
              className={`w-3.5 h-3.5 rounded m-0.5 bg-[#00ff66] transition-all ${themeName === 'green' ? 'scale-110 border border-white' : 'opacity-40'}`} 
            />
            <button 
              onClick={() => { setThemeColor('#f59e0b'); setThemeName('amber'); }}
              className={`w-3.5 h-3.5 rounded m-0.5 bg-[#f59e0b] transition-all ${themeName === 'amber' ? 'scale-110 border border-white' : 'opacity-40'}`} 
            />
            <button 
              onClick={() => { setThemeColor('#ef4444'); setThemeName('red'); }}
              className={`w-3.5 h-3.5 rounded m-0.5 bg-[#ef4444] transition-all ${themeName === 'red' ? 'scale-110 border border-white' : 'opacity-40'}`} 
            />
          </div>

          <button 
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 transition text-slate-300"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* SINGLE UNIFIED WORKSPACE VIEWPORT */}
      <main className="relative z-20 flex-1 w-full max-w-4xl mx-auto p-3 flex flex-col justify-between min-h-0">
        
        {/* UPPER ROW: STEPHEN HOLO-COGNITION VISUAL (HERO ELEMENT) */}
        <section className="flex-1 flex flex-col items-center justify-center min-h-0 relative select-none">
          
          <div className="relative flex flex-col items-center justify-center p-2">
            {/* Spinning Holographic rings backdrop */}
            <div className="absolute w-52 h-52 rounded-full border border-dashed animate-[spin_20s_linear_infinite] opacity-10" style={{ borderColor: themeColor }} />
            <div className="absolute w-44 h-44 rounded-full border border-double animate-[spin_10s_linear_infinite_reverse] opacity-5" style={{ borderColor: themeColor }} />

            {/* AI HUD Signal Pulsator */}
            <canvas ref={pulseCanvasRef} className="absolute w-48 h-48 pointer-events-none" />

            {/* Stephen Hologram Mascot Avatar Component */}
            <StephenAvatar 
              isSpeaking={isSpeaking} 
              isThinking={isAiTyping} 
              isSleeping={isSleeping} 
              themeColor={themeColor} 
            />
          </div>

          {/* AI Response Subtitles Card */}
          <div className="mt-4 text-center max-w-[90%] md:max-w-[70%] z-10">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold block">COGNITIVE COMPANION STATUS</span>
            <div className="mt-1 px-3 py-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl shadow-lg text-[11px] font-semibold text-slate-200 inline-block">
              {isSleeping ? '💤 স্টিফেন এআই গভীর ঘুমে আছে...' : isAiTyping ? '🧠 স্টিফেন ভাবছে ও উত্তর তৈরি করছে...' : '🟢 স্টিফেন আপনার ভয়েস বা টাইপ কম্যান্ডের জন্য প্রস্তুত!'}
            </div>
          </div>

        </section>

        {/* MID ROW: CENTRAL CONVERSATION LOG VIEWER */}
        <section className="h-[140px] md:h-[200px] border border-slate-900 bg-slate-950/90 rounded-2xl p-3 flex flex-col shadow-2xl relative mb-3 overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" style={{ color: themeColor }} />
              SECURE DIALOGUE FEED
            </span>
            <span className="text-[8px] text-slate-500 font-mono">CLIENT_SESSION_SECURE_TUNNEL</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {/* Sender badge info */}
                <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5 font-bold">
                  {msg.sender === 'user' ? '👤 CLIENT' : '👨 STEPHEN_AI'} • {msg.timestamp}
                </div>

                {/* Bubble content */}
                <div 
                  className={`px-3 py-2 rounded-xl text-xs leading-relaxed font-sans ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-slate-100 rounded-tr-none' 
                      : 'bg-slate-900/50 border border-slate-800/60 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Trigger tag */}
                  {msg.actionType && msg.actionType !== 'CONVERSATION' && (
                    <div className="mt-1.5 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[8px] text-amber-400 font-mono">
                      <span>📱 Trigger: {msg.actionType}</span>
                      <span className="px-1 bg-slate-950 rounded text-slate-300 border border-slate-900">{msg.actionTarget}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5 font-bold">
                  STEPHEN_AI IS PROCESSING...
                </div>
                <div className="px-3.5 py-2 bg-slate-900/50 text-slate-400 rounded-xl rounded-tl-none border border-slate-800/60 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">PROCESSING...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Glowing bottom line decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${themeColor}aa, transparent)` }} />
        </section>

        {/* BOTTOM ROW: INTERACTIVE INPUT PANEL & MIC TOGGLE (ALWAYS VISIBLE) */}
        <section className="bg-slate-950 border border-slate-900 rounded-2xl p-3 shrink-0 relative shadow-2xl space-y-2.5 z-20">
          
          {/* Rapid commands suggestions chips */}
          <div className="flex flex-wrap gap-1.5 items-center justify-center sm:justify-start">
            <button 
              onClick={() => handleSendMessage('কেমন আছো স্টিফেন?')}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition active:scale-95"
            >
              👋 কেমন আছো?
            </button>
            <button 
              onClick={() => handleSendMessage('ফেসবুক খোলো')}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition active:scale-95"
            >
              📱 ফেসবুক খোলো
            </button>
            <button 
              onClick={() => handleSendMessage('ইউটিউব খোলো')}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition active:scale-95"
            >
              📺 ইউটিউব খোলো
            </button>
            <button 
              onClick={() => handleSendMessage('হ্যাকিং শুরু করো')}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-950/40 hover:bg-red-900/20 text-red-400 border border-red-900/30 transition active:scale-95 animate-pulse"
            >
              🔥 সাইবার হ্যাকিং
            </button>
            <button 
              onClick={() => handleConsoleCommand('/help')}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition active:scale-95"
            >
              ⚙️ কমান্ড হেল্প
            </button>
          </div>

          {/* Typing Form & Voice Record Button row */}
          <div className="flex items-center space-x-2">
            
            {/* Direct voice transcription mic button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl border transition active:scale-95 flex items-center justify-center shadow-lg relative shrink-0 ${
                isListening 
                  ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-red-900/40' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
              }`}
              title="ভয়েস রেকর্ড বোতাম (বাংলা/ইংরেজি)"
            >
              {isListening ? (
                <>
                  <Mic className="w-4.5 h-4.5" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </>
              ) : (
                <Mic className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Core typing field */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex-1 flex items-center space-x-2"
            >
              <input 
                type="text"
                ref={chatInputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "আমি শুনছি... বলুন..." : "এখানে স্টিফেনকে কমান্ড টাইপ করুন বা বলুন..."}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono transition"
              />

              {/* Enter packet transmitter */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 rounded-xl bg-slate-100 hover:bg-white text-slate-950 disabled:opacity-30 disabled:hover:bg-slate-100 transition active:scale-95 flex items-center justify-center shadow-md shrink-0"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>

          </div>

          {/* Voice calibration options (collapsible or slim) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2.5 border-t border-slate-900 text-[10px] text-slate-500 gap-2">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>স্টিফেনের ভয়েস স্পিড: <strong>{voiceRate}x</strong> (ভারী গভীর মেল ভয়েস)</span>
            </span>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`font-bold transition uppercase ${voiceEnabled ? 'text-cyan-400' : 'text-slate-600'}`}
              >
                {voiceEnabled ? '🔊 স্পিকার চালু আছে' : '🔇 স্পিকার বন্ধ আছে'}
              </button>
              <span>|</span>
              <button 
                onClick={() => handleConsoleCommand('/clear')}
                className="hover:text-slate-300 font-bold uppercase"
              >
                🗑️ লগ মুছে ফেলুন
              </button>
            </div>
          </div>

        </section>

      </main>

      {/* DETAILED ROOT TERMINAL LOG BAR AT THE VERY BOTTOM */}
      <footer className="relative z-20 h-[80px] border-t border-slate-900 bg-slate-950 px-4 py-2 flex flex-col shrink-0 font-mono text-[9px] text-slate-400">
        <div className="flex justify-between items-center text-slate-500 uppercase font-extrabold pb-1 border-b border-slate-900 mb-1">
          <span>Operation System Core Analytics</span>
          <span>ADMIN_SHELL@STEPHEN_OS:/#</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
          {terminalLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-1 leading-normal select-none">
              <span className="text-slate-600">[{index + 1}]</span>
              <span className="text-emerald-500/90 whitespace-pre-wrap">{log}</span>
            </div>
          ))}
          <div ref={terminalBottomRef} />
        </div>
      </footer>

      {/* FULLSCREEN CYBER HACKING / SECURITY INTRUSION PORTAL SIMULATOR */}
      {isHacking && (
        <div className="absolute inset-0 z-50 bg-[#020509]/98 flex flex-col justify-between p-6 select-none animate-fade-in font-mono border-4 border-red-950">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-red-900/50 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
              <h2 className="text-red-500 font-extrabold text-sm md:text-base uppercase tracking-widest flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 animate-bounce" />
                CRITICAL INTRUSION ATTACK IN PROGRESS
              </h2>
            </div>
            <span className="text-red-500 text-xs px-2.5 py-1 rounded bg-red-950/40 border border-red-800/40 font-bold animate-pulse">
              OVERRIDE: INTIATED
            </span>
          </div>

          {/* Matrix diagnostics rain in mid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 my-6 min-h-0">
            
            {/* Cryptographic dump */}
            <div className="border border-red-900/40 bg-red-950/10 rounded-xl p-4 flex flex-col justify-between overflow-hidden relative">
              <span className="text-[10px] text-red-500 font-bold tracking-widest uppercase block mb-2 border-b border-red-900/30 pb-1">COGNITIVE DECRYPT CHANNELS</span>
              
              <div className="flex-1 overflow-y-auto text-[10px] text-red-400 space-y-1.5 scrollbar-thin scrollbar-thumb-red-950 scrollbar-track-transparent pr-1">
                <div>&gt;&gt; IP SCANNER DETECTED GATEWAY ADDR: 198.162.24.102</div>
                <div>&gt;&gt; PORT OVERRIDE STATUS: STABLE TRACING...</div>
                <div>&gt;&gt; BRUTEFORCING ADMIN KEYRING DES-EDE3-CBC...</div>
                <div>&gt;&gt; STACK BUFF OVERFLOW: 0xDEADBEEF EXECUTED.</div>
                <div>&gt;&gt; HACKING CORE SERVER DIRECTORIES...</div>
                {hackedPasswords.map((pass, i) => (
                  <div key={i} className="text-emerald-400 font-bold animate-pulse">&gt;&gt; EXTRACTED DATA: {pass}</div>
                ))}
              </div>

              {/* Progress Bar container */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-red-400">
                  <span className="font-bold">{hackStep}</span>
                  <span className="font-bold">{hackProgress}%</span>
                </div>
                <div className="w-full bg-red-950/60 rounded-full h-3 border border-red-900/50 overflow-hidden p-0.5">
                  <div 
                    className="bg-red-600 h-full rounded-full transition-all duration-300 relative"
                    style={{ width: `${hackProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted credential dump visual */}
            <div className="border border-red-900/40 bg-red-950/10 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
              <div>
                <span className="text-[10px] text-red-500 font-bold tracking-widest uppercase block mb-2 border-b border-red-900/30 pb-1">SERVER ROOT LOG DUMP</span>
                <div className="text-[9px] text-red-400 font-mono space-y-1">
                  <div>[01/05] STABILIZING ANTENNA FREQUENCY... DONE</div>
                  <div>[02/05] EXCLUDING FIREWALL FILTERS... DONE</div>
                  <div>[03/05] ATTACKING CENTRAL MAINFRAME... DONE</div>
                  <div>[04/05] EXTRACTING AES PRIVATE HASHES... DONE</div>
                  <div className="text-emerald-400 font-bold">[05/05] ALL CHANNELS GRANTED. ACCESS COMPLETED.</div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <button 
                  onClick={() => { setIsHacking(false); cyberAudio.playComplete(); }}
                  className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/40 text-red-400 border border-red-700/50 rounded-xl font-bold text-xs transition active:scale-95"
                >
                  🔴 সিমুলেটর বন্ধ করুন (CLOSE AUDIT)
                </button>
              </div>
            </div>

          </div>

          {/* Footer warning */}
          <div className="border-t border-red-900/50 pt-3 text-center text-[10px] text-red-600 font-extrabold tracking-widest uppercase animate-pulse">
            ⚠️ WARNING: STEPHEN SYSTEM PENETRATION COMPLETE. SYSTEM HAS LOGGED IN SECURELY. ⚠️
          </div>

        </div>
      )}

    </div>
  );
}
