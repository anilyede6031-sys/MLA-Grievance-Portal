import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Bot, FileQuestion, Users, Globe, ChevronRight, Search, Instagram, Youtube, Twitter, MessageSquare, HelpCircle, MapPin, ArrowLeft, Send, User, Volume2, Mic, Camera, SendHorizontal, Phone, ArrowUp, Paperclip, Smile, MoreHorizontal, Info, Shield, Home, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat'); // Simplified to Chat-only
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: '👋 ' + (t.rbotGreeting || 'नमस्कार! आम्ही तुम्हाला कशी मदत करू शकतो?') }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px'; // Reset height to get true scrollHeight
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(newHeight, 150)}px`;
    }
  }, [input]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    if (view !== 'chat') setView('chat');

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

      const res = await api.post('/ai/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'mr' ? 'mr-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.start();
  };

  const commonEmojis = ['😊', '🙏', '👍', '📍', '✅', '🏗️', '🚜', '🇮🇳', '❤️', '🙌', '💧', '⚡', '💊', '🎓', '🏥'];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      {isOpen && (
        <div className="w-[400px] h-[704px] bg-white dark:bg-gray-900 rounded-[24px] rbot-container-shadow overflow-hidden animate-mbot-widget pointer-events-auto origin-bottom-right border border-[#E8EDEB] flex flex-col">
          
          {/* CHAT-ONLY INTERFACE (v48 Simplified) */}
          {/* VIEW: CHAT (MESSAGES) */}
          {view === 'chat' && (
            <div className="flex flex-col h-full bg-white dark:bg-gray-950">
              <div className="h-[72px] border-b border-[#E8EDEB] px-4 flex items-center justify-between bg-white dark:bg-gray-900 rbot-bubble-shadow flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                   {/* Removed back button as menu is removed */}
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00684A] border border-[#00684A]/10 shadow-sm relative flex-shrink-0">
                      <Bot size={22} strokeWidth={1.5} className="animate-pulse" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="rbot-header-title">RBot</h3>
                    <p className="text-[11px] text-[#8392A5] font-bold leading-tight">{t.aiTeamHelp || 'The team can also help'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <button className="p-2 text-gray-400 hover:text-gray-800 transition-colors"><MoreHorizontal size={20} /></button>
                   <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={20} strokeWidth={3} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#F9FBFA] dark:bg-gray-950">
                 {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.type === 'user' ? 'items-end' : 'items-start'} animate-mbot-message`}>
                       <div className={`p-4 rounded-[20px] max-w-[85%] rbot-text leading-relaxed rbot-bubble-shadow ${
                           m.type === 'user' ? 'mbot-bubble-user rounded-tr-none' : 'mbot-bubble-bot rounded-tl-none font-medium text-[#001E2B]'
                         }`}>
                         {m.text}
                       </div>
                    </div>
                 ))}
                  {/* Talk to person button removed */}
                 {isTyping && (
                   <div className="flex justify-start animate-mbot-message">
                      <div className="bg-[#FFFFFF] p-4 rounded-xl rbot-bubble-shadow border border-[#E8EDEB] flex gap-1.5 items-center">
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mbot-typing-dot" />
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mbot-typing-dot" />
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mbot-typing-dot" />
                      </div>
                   </div>
                 )}
                  {attachments.length > 0 && (
                    <div className="flex gap-2 p-2 bg-gray-50 border-b overflow-x-auto custom-scrollbar">
                      {attachments.map((file, i) => (
                        <div key={i} className="relative shrink-0">
                           <img src={URL.createObjectURL(file)} className="w-12 h-12 rounded-lg object-cover border shadow-sm" />
                           <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                             <X size={10} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
                 <div ref={scrollRef} />
              </div>
               <div className="p-2 bg-transparent border-t border-[#E8EDEB] flex-shrink-0">
                   <div className="bg-transparent rounded-none p-1 border-0 flex flex-col min-h-[40px] transition-all">
                       <textarea 
                         ref={textareaRef}
                         value={input} 
                         onChange={(e) => setInput(e.target.value)} 
                         onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                         placeholder="Message..." 
                         className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 active:outline-none appearance-none p-0 text-sm rbot-text flex-1 resize-none font-sans overflow-hidden" 
                         rows="1" 
                       />
                       <div className="flex items-center justify-between mt-0.5 pt-1 border-t border-gray-50/50">
                        <div className="flex items-center gap-2 text-gray-400">
                           <input 
                             type="file" 
                             ref={fileInputRef} 
                             onChange={handleFileChange} 
                             multiple 
                             accept="image/*" 
                             className="hidden" 
                           />
                           <button onClick={() => fileInputRef.current?.click()} className="hover:text-[#00684A] transition-all text-gray-400 p-1">
                             <Paperclip size={20} />
                           </button>
                           <div className="relative">
                              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`hover:text-[#00684A] transition-all p-1 ${showEmojiPicker ? 'text-[#00684A]' : 'text-gray-400'}`}><Smile size={20} /></button>
                              {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border rounded-xl shadow-xl z-50 grid grid-cols-5 gap-1 w-[160px] animate-in fade-in slide-in-from-bottom-2">
                                  {commonEmojis.map(emoji => (
                                    <button key={emoji} onClick={() => { setInput(prev => prev + emoji); setShowEmojiPicker(false); }} className="p-1.5 hover:bg-gray-50 rounded text-lg transition-all active:scale-90">{emoji}</button>
                                  ))}
                                </div>
                              )}
                           </div>
                           <button onClick={startListening} className={`hover:text-[#00684A] transition-all text-gray-400 p-1 ${isListening ? 'text-red-500 animate-pulse bg-red-50 rounded-full' : ''}`}>
                             <Mic size={20} />
                           </button>
                        </div>
                        <button onClick={() => handleSend()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() || attachments.length > 0 ? 'bg-[#00684A] text-white shadow-md' : 'bg-[#F0F2F5] text-gray-300'}`}><ArrowUp size={20} strokeWidth={3} /></button>
                     </div>
                  </div>
              </div>
            </div>
          )}

          {/* Removed Help & Suggested Articles as per user request */}
          {/* Footer Tabs Removed as per user request */}
        </div>
      )}

      {/* Launcher */}
      <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform pointer-events-auto active:scale-95 border-2 ${isOpen ? 'bg-white text-[#001E2B] border-[#E8EDEB]' : 'bg-[#00684A] text-white border-transparent'}`}>
        {isOpen ? <ChevronDown size={28} strokeWidth={3} /> : <div className="relative"><MessageSquare size={32} strokeWidth={1.5} /><div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border border-white shadow-lg" /></div>}
      </button>
    </div>
  );
}
