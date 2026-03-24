import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ArrowLeft, MessageSquare, List, AlertTriangle, X, Mic, Volume2, VolumeX, Camera, Paperclip, MapPin, Smile, ArrowUp, MoreHorizontal, Info, Shield, Phone, Home, HelpCircle, ChevronRight, Stars } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function AIAssistant() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: t.aiGreeting }
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Speech Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'mr' ? 'mr-IN' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.start();
  };

  const commonEmojis = ['😊', '🙏', '👍', '📍', '✅', '🏗️', '🚜', '🇮🇳', '❤️', '🙌', '💧', '⚡', '💊', '🎓', '🏥'];

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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleSend = async (text = input) => {
    if (!text.trim() && attachments.length === 0) return;

    const userMsg = { id: Date.now(), type: 'user', text, hasImages: attachments.length > 0 };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('message', text);
      formData.append('history', JSON.stringify(messages.map(m => ({ type: m.type, text: m.text }))));
      currentAttachments.forEach(file => formData.append('images', file));

      const response = await api.post('/api/ai/atomic-chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: response.data.reply }]);
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

            {attachments.length > 0 && (
              <div className="flex gap-4 p-4 bg-gray-50/50 rounded-2xl mb-4 overflow-x-auto custom-scrollbar border border-dashed border-gray-200">
                {attachments.map((file, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={URL.createObjectURL(file)} className="w-20 h-20 rounded-xl object-cover border shadow-sm" />
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                      <X size={14} />
                    </button>
                    <p className="text-[10px] text-gray-500 mt-1 truncate w-20 text-center font-medium">{file.name}</p>
                  </div>
                ))}
              </div>
            )}

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
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="hover:text-[#4285F4] transition-colors p-1">
                      <Paperclip size={24} />
                    </button>
                    <button onClick={startListening} className={`hover:text-[#4285F4] transition-colors p-1 ${isListening ? 'text-red-500 animate-pulse bg-red-50 rounded-full' : ''}`}>
                      <Mic size={24} />
                    </button>
                    <div className="relative">
                       <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`hover:text-[#4285F4] transition-colors p-1 ${showEmojiPicker ? 'text-[#4285F4]' : ''}`}><Smile size={24} /></button>
                       {showEmojiPicker && (
                         <div className="absolute bottom-full left-0 mb-4 p-3 bg-white border rounded-2xl shadow-2xl z-50 grid grid-cols-5 gap-2 w-[210px] animate-in fade-in slide-in-from-bottom-4">
                           {commonEmojis.map(emoji => (
                             <button key={emoji} onClick={() => { setInput(prev => prev + emoji); setShowEmojiPicker(false); }} className="p-2 hover:bg-gray-50 rounded-lg text-2xl transition-all active:scale-90">{emoji}</button>
                           ))}
                         </div>
                       )}
                    </div>
                 </div>
                 <button 
                   onClick={() => handleSend()}
                   disabled={isTyping}
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${
                     (input.trim() || attachments.length > 0) && !isTyping ? 'bg-[#00684A] text-white' : 'bg-gray-100 text-gray-300'
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
