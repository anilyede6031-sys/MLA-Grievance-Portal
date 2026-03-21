import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ArrowLeft, MessageSquare, List, AlertTriangle, X, Mic, Volume2, VolumeX, Camera, Paperclip, MapPin, Smile, ArrowUp, MoreHorizontal, Info, Shield, Phone, Home, HelpCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import '../index.css'; 

export default function AIAssistant() {
  const { t } = useLang();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: '👋 Hi there! How can I help today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

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
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col font-sans">
      {/* 1:1 RBOT FULL PAGE HEADER */}
      <div className="h-[72px] bg-white dark:bg-gray-900 border-b border-[#E8EDEB] px-4 md:px-6 flex-shrink-0 flex items-center justify-between sticky top-0 z-50 rbot-bubble-shadow">
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
             <p className="text-[11px] text-[#8392A5] font-bold leading-tight">The team can also help</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Online & Ready</span>
           </div>
           <button className="p-2 text-gray-400 hover:text-[#001E2B] transition-colors"><MoreHorizontal size={24} /></button>
        </div>
      </div>

      {/* Main Messaging Area */}
      <div className="flex-1 overflow-y-auto bg-[#F9FBFA] dark:bg-gray-950 custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
           
           <div className="bg-white dark:bg-gray-900 border border-[#E8EDEB] p-5 rounded-3xl flex gap-4 text-xs md:text-sm text-gray-500 italic leading-relaxed rbot-bubble-shadow items-start animate-mbot-message">
              <Info size={20} className="text-[#00684A] shrink-0 mt-0.5" />
              <p>This chat session is recorded to ensure service quality.</p>
           </div>

           {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.type === 'user' ? 'items-end' : 'items-start'} animate-mbot-message mb-6`}>
                 <div className={`p-4 md:p-6 rounded-[20px] max-w-[90%] md:max-w-[75%] rbot-bubble-shadow rbot-text leading-relaxed ${
                     m.type === 'user' 
                       ? 'mbot-bubble-user rounded-tr-none' 
                       : 'mbot-bubble-bot rounded-tl-none font-medium'
                   }`}>
                   {m.text}
                 </div>
                 <p className={`text-[10px] text-[#8392A5] mt-3 font-black tracking-widest uppercase ${m.type === 'user' ? 'mr-2' : 'ml-2'}`}>
                   {m.type === 'bot' ? 'RBot • AI Agent • Now' : 'Citizen • Now'}
                 </p>
              </div>
           ))}

           <div className="flex flex-col items-start gap-4 pb-8 animate-mbot-message delay-150">
              <button onClick={() => handleSend("That helped 👍")} className="px-6 py-3 bg-white border border-[#E8EDEB] rounded-full text-sm font-bold rbot-bubble-shadow hover:border-[#00684A] hover:text-[#00684A] transition-all flex items-center gap-2 text-[#001E2B]">That helped 👍</button>
              <button onClick={() => handleSend("Show me more 👀")} className="px-6 py-3 bg-white border border-[#E8EDEB] rounded-full text-sm font-bold rbot-bubble-shadow hover:border-[#00684A] hover:text-[#00684A] transition-all flex items-center gap-2 text-[#001E2B]">Show me more 👀</button>
              <button onClick={() => handleSend("Talk to a person 👤")} className="px-6 py-3 bg-white border border-[#E8EDEB] rounded-full text-sm font-bold rbot-bubble-shadow hover:border-[#00684A] hover:text-[#00684A] transition-all flex items-center gap-2 text-[#001E2B]">Talk to a person 👤</button>
           </div>

           {isTyping && (
             <div className="flex justify-start animate-mbot-message mb-6">
                <div className="bg-white p-5 rounded-2xl rbot-bubble-shadow border border-[#E8EDEB] flex gap-2 items-center">
                   <div className="w-2 h-2 bg-gray-400 rounded-full mbot-typing-dot" />
                   <div className="w-2 h-2 bg-gray-400 rounded-full mbot-typing-dot" />
                   <div className="w-2 h-2 bg-gray-400 rounded-full mbot-typing-dot" />
                </div>
             </div>
           )}
           <div ref={scrollRef} />
        </div>
      </div>

      {/* Modern Static Input Bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-[#E8EDEB] p-4 md:p-8 flex-shrink-0">
        <div className="max-w-4xl mx-auto space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 border border-[#E8EDEB] shadow-sm relative focus-within:border-[#14161A] transition-all">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Message..."
                className="bg-transparent border-0 focus:ring-0 p-2 rbot-text md:text-xl w-full resize-none min-h-[120px] font-medium placeholder:text-gray-300"
                rows="3"
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F9FBFA]">
                 <div className="flex items-center gap-6 text-gray-300">
                    <button onClick={() => fileInputRef.current?.click()} className="hover:text-[#00684A] transition-colors"><Paperclip size={24} /></button>
                    <button onClick={startListening} className={`hover:text-[#00684A] transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}><Mic size={24} /></button>
                    <button className="hover:text-[#00684A] transition-colors"><Smile size={24} /></button>
                 </div>
                 <button 
                   onClick={() => handleSend()}
                   className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                     input.trim() 
                       ? 'bg-[#00684A] text-white' 
                       : 'bg-[#F0F2F5] text-gray-300'
                   }`}
                 >
                   <ArrowUp size={28} strokeWidth={3} />
                 </button>
              </div>
           </div>
           <p className="text-[10px] text-center text-gray-300 uppercase tracking-[0.3em] font-black pb-4">
              Daund Digital Empowerment Center • 24/7 Official AI Assistant
           </p>
        </div>
      </div>
    </div>
  );
}
