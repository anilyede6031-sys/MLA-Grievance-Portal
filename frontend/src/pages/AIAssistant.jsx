import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ArrowLeft, MessageSquare, List, AlertTriangle, X, Mic, Volume2, VolumeX, Camera, Paperclip, MapPin, Smile, ArrowUp, MoreHorizontal, Info, Shield, Phone, Home, HelpCircle, ChevronRight, Stars } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function AIAssistant() {
  const { t } = useLang();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: t.aiGreeting }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Speech Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.start();
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(newHeight, 300)}px`;
    }
  }, [input]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.data.success) {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen gemini-bg flex flex-col font-sans">
      {/* 1:1 RBOT FULL PAGE HEADER */}
      <div className="h-[72px] bg-white dark:bg-gray-900 px-4 md:px-6 flex-shrink-0 flex items-center justify-between sticky top-0 z-50 rbot-bubble-shadow">
        <div className="flex items-center gap-4">
           <Link to="/" className="p-2 hover:bg-gray-50 rounded-full transition-all text-gray-400">
             <ArrowLeft size={20} strokeWidth={3} />
           </Link>
           <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#00684A] border border-[#00684A]/10 shadow-sm relative">
              <Bot size={24} strokeWidth={1.5} />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
           </div>
           <div>
             <h1 className="rbot-header-title text-xl leading-tight">RBot</h1>
             <p className="text-[11px] text-[#8392A5] font-bold leading-tight">{t.aiTeamHelp}</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{t.aiOnlineReady}</span>
           </div>
           <button className="p-2 text-gray-400 hover:text-[#001E2B] transition-colors"><MoreHorizontal size={24} /></button>
        </div>
      </div>

      {/* Main Messaging Area */}
      <div className="flex-1 overflow-y-auto bg-[#F9FBFA] dark:bg-gray-950 custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
           
           <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl flex gap-4 text-xs md:text-sm text-gray-500 italic leading-relaxed rbot-bubble-shadow items-start animate-mbot-message">
              <Info size={20} className="text-[#00684A] shrink-0 mt-0.5" />
              <p>{t.recordingNotice}</p>
           </div>

           {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.type === 'user' ? 'items-end' : 'items-start'} animate-mbot-message mb-10`}>
                 <div className="flex gap-4 items-start max-w-[90%] md:max-w-[80%]">
                    {m.type === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm transition-all hover:scale-110">
                        <Stars size={18} className="gemini-star-gradient" />
                      </div>
                    )}
                    <div className={`${
                        m.type === 'user' 
                          ? 'gemini-user-bubble p-4 md:p-5 rounded-[24px] rounded-tr-none' 
                          : 'rbot-text leading-relaxed text-[15px] md:text-[16px] pt-1'
                      } ${m.type === 'bot' ? 'animate-gemini-stream' : ''}`}>
                      {m.text}
                    </div>
                 </div>
                 <p className={`text-[10px] text-[#8392A5] mt-3 font-black tracking-widest uppercase ${m.type === 'user' ? 'mr-2' : 'ml-14'}`}>
                   {m.type === 'bot' ? t.aiRBotPersona : `${t.roles.citizen} • Now`}
                 </p>
              </div>
           ))}

            {/* Suggestion buttons removed as per user request */}

           {isTyping && (
             <div className="flex justify-start animate-mbot-message mb-6">
                <div className="bg-white p-5 rounded-2xl rbot-bubble-shadow flex gap-2 items-center">
                   <div className="w-2 h-2 bg-gray-400 rounded-full mbot-typing-dot" />
                   <div className="w-2 h-2 bg-gray-400 rounded-full mbot-typing-dot" />
                   <div className="w-2 h-2 bg-gray-400 rounded-full mbot-typing-dot" />
                </div>
             </div>
           )}
           <div ref={scrollRef} />
        </div>
      </div>

      {/* Floating Gemini Pill Input Bar */}
      <div className="gemini-bg p-4 md:pb-12 flex-shrink-0">
        <div className="max-w-3xl mx-auto space-y-4">
           <div className="bg-transparent rounded-none p-4 md:p-6 relative transition-all border-t border-gray-100 dark:border-gray-800">
              <textarea 
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={t.aiMessageRBot}
                className="bg-transparent border-none outline-none focus:ring-0 focus:outline-none active:outline-none p-1 rbot-text md:text-lg w-full resize-none min-h-[40px] font-medium placeholder:text-gray-400 shadow-none appearance-none overflow-y-auto custom-scrollbar"
                rows="1"
              />
              <div className="flex items-center justify-between mt-3">
                 <div className="flex items-center gap-5 md:gap-7 text-gray-500">
                    <button onClick={() => toast.error('File attachment coming soon!')} className="hover:text-[#4285F4] transition-colors p-1"><Paperclip size={24} /></button>
                    <button onClick={() => toast.error('Voice input coming soon!')} className={`hover:text-[#4285F4] transition-colors p-1 ${isListening ? 'text-red-500 animate-pulse' : ''}`}><Mic size={24} /></button>
                    <button onClick={() => toast.error('Stickers coming soon!')} className="hover:text-[#4285F4] transition-colors p-1"><Smile size={24} /></button>
                 </div>
                 <button 
                   onClick={() => handleSend()}
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${
                     input.trim() 
                       ? 'bg-[#001E2B] text-white hover:bg-black' 
                       : 'bg-gray-50 text-gray-300'
                   }`}
                 >
                   <ArrowUp size={24} strokeWidth={3} />
                 </button>
              </div>
           </div>
           <p className="text-[9px] text-center text-gray-400 uppercase tracking-[0.2em] font-medium pt-2">
              {t.aiMistakesDisclaimer}
           </p>
        </div>
      </div>
    </div>
  );
}
