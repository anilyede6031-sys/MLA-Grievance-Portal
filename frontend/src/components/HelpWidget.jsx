import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Bot, FileQuestion, Users, Globe, ChevronRight, Search, Instagram, Youtube, Twitter, MessageSquare, HelpCircle, MapPin, ArrowLeft, Send, User, Volume2, Mic, Camera, SendHorizontal, Phone, ArrowUp, Paperclip, Smile, MoreHorizontal, Info, Shield, Home, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('menu'); // 'menu', 'chat', 'help'
  const { t } = useLang();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: '👋 ' + (t.rbotGreeting || 'नमस्कार! आम्ही तुम्हाला कशी मदत करू शकतो?') }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    if (view !== 'chat') setView('chat');

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

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = t.language === 'English' ? 'en-US' : 'mr-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.start();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      {isOpen && (
        <div className="w-[400px] h-[704px] bg-white dark:bg-gray-900 rounded-[24px] rbot-container-shadow overflow-hidden animate-mbot-widget pointer-events-auto origin-bottom-right border border-[#E8EDEB] flex flex-col">
          
          {/* VIEW: HOME (MENU) */}
          {view === 'menu' && (
            <>
              <div className="bg-gradient-to-br from-[#00684A] to-[#014130] p-4 text-white relative flex-shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[9px] font-black opacity-70 tracking-[0.2em] uppercase">{t.daundVikasMitra}</span>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-all text-white">
                    <ChevronDown size={24} strokeWidth={3} />
                  </button>
                </div>
                <h1 className="rbot-greeting text-white mb-2 leading-[1.1]">{t.helloHowHelp}</h1>
                <div className="flex items-center gap-2 mt-3 bg-black/10 w-fit px-2 py-1 rounded-full border border-white/10 text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest">{t.aiOnlineReady || 'Online & Ready'}</span>
                </div>
              </div>
              <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950 space-y-4 overflow-y-auto custom-scrollbar">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl rbot-bubble-shadow border border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-black rbot-text mb-1">{t.aiAssistantTitle}</h2>
                  <p className="text-sm text-gray-500 font-bold mb-4">{t.aiAssistantDesc}</p>
                  <button onClick={() => setView('chat')} className="w-full flex items-center justify-between p-4 bg-[#00684A] text-white rounded-2xl hover:bg-[#004D37] transition-all group shadow-lg rbot-button-hover">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageSquare size={20} /></div>
                      <div className="text-left font-sans">
                        <p className="text-xs font-black uppercase opacity-70">{t.sendMessageSub}</p>
                        <p className="font-bold">{t.chatSupportSub}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* VIEW: CHAT (MESSAGES) */}
          {view === 'chat' && (
            <div className="flex flex-col h-full bg-white dark:bg-gray-950">
              <div className="h-[72px] border-b border-[#E8EDEB] px-4 flex items-center justify-between bg-white dark:bg-gray-900 rbot-bubble-shadow flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                    <ArrowLeft size={18} strokeWidth={3} />
                  </button>
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
                  <div className="flex flex-col items-start gap-2 pt-2 animate-mbot-message delay-150">
                    <button onClick={() => handleSend(t.talkPerson || "Talk to a person 👤")} className="px-5 py-2.5 bg-white border border-[#E8EDEB] rounded-full text-sm font-bold rbot-bubble-shadow hover:border-[#00684A] hover:text-[#00684A] text-[#001E2B] transition-all">{t.talkPerson || "Talk to a person 👤"}</button>
                  </div>
                 {isTyping && (
                   <div className="flex justify-start animate-mbot-message">
                      <div className="bg-[#FFFFFF] p-4 rounded-xl rbot-bubble-shadow border border-[#E8EDEB] flex gap-1.5 items-center">
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mbot-typing-dot" />
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mbot-typing-dot" />
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mbot-typing-dot" />
                      </div>
                   </div>
                 )}
                 <div ref={scrollRef} />
              </div>
               <div className="p-3 bg-white dark:bg-gray-900 border-t border-[#E8EDEB] flex-shrink-0">
                   <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] p-3 border border-[#E8EDEB] flex flex-col shadow-sm min-h-[70px] focus-within:border-[#14161A] transition-all">
                      <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Message..." className="bg-transparent border-0 focus:ring-0 p-0 text-sm rbot-text flex-1 resize-none font-sans" rows="1" />
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-5 text-gray-400">
                           <button onClick={() => fileInputRef.current?.click()} className="hover:text-[#00684A] transition-colors"><Paperclip size={20} /></button>
                           <button className="hover:text-[#00684A] transition-colors"><Smile size={20} /></button>
                           <button onClick={startListening} className={`hover:text-[#00684A] transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}><Mic size={20} /></button>
                        </div>
                        <button onClick={() => handleSend()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-[#00684A] text-white shadow-md' : 'bg-[#F0F2F5] text-gray-300'}`}><ArrowUp size={20} strokeWidth={3} /></button>
                     </div>
                  </div>
              </div>
            </div>
          )}

          {/* VIEW: HELP */}
          {view === 'help' && (
            <div className="flex flex-col h-full bg-white dark:bg-gray-950">
              <div className="bg-[#00684A] p-8 text-white relative flex-shrink-0 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-2xl font-black tracking-tight">{t.rbotHelp}</h1>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-all text-white"><X size={24} strokeWidth={3} /></button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00684A]" size={18} />
                  <input 
                    type="text" 
                    placeholder={t.searchHelpPlaceholder}
                    className="w-full bg-white text-[#001E2B] font-bold text-sm py-3.5 pl-12 pr-4 rounded-xl border-0 rbot-input-focus shadow-lg"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F9FBFA] dark:bg-gray-950 custom-scrollbar">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">{t.suggestedArticles}</p>
                {[
                  "How to track a complaint?",
                  "Contacting the Taluka Coordinator",
                  "Information about upcoming projects",
                  "Language settings and accessibility",
                  "Submitting photos of grievances"
                ].map((item, idx) => (
                  <button key={idx} className="w-full text-left p-4 bg-white border border-[#E8EDEB] rounded-2xl rbot-bubble-shadow hover:border-[#00684A] hover:text-[#00684A] transition-all flex items-center justify-between group">
                    <span className="text-sm font-bold text-[#001E2B] group-hover:text-[#00684A] tracking-tight">{item}</span>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#00684A]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calibrated Footer */}
          <div className="bg-white dark:bg-gray-900 h-[81px] grid grid-cols-3 border-t border-[#EDEDED] flex-shrink-0">
             <button onClick={() => setView('menu')} className={`flex flex-col items-center pt-[18px] pb-[10px] transition-all ${view === 'menu' ? 'text-[#00684A]' : 'text-[#6C6F74] rbot-button-hover'}`}>
               <Home size={24} className={view === 'menu' ? 'fill-[#00684A]/10' : ''} />
               <span className={`text-[14px] leading-[20px] mt-2 ${view === 'menu' ? 'font-bold' : 'font-medium'}`}>{t.rbotHome || 'Home'}</span>
             </button>
             <button onClick={() => setView('chat')} className={`flex flex-col items-center pt-[18px] pb-[10px] transition-all ${view === 'chat' ? 'text-[#00684A]' : 'text-[#6C6F74] rbot-button-hover'}`}>
               <div className="relative">
                  <MessageSquare size={24} className={view === 'chat' ? 'fill-[#00684A]/10' : ''} />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
               </div>
               <span className={`text-[14px] leading-[20px] mt-2 ${view === 'chat' ? 'font-bold' : 'font-medium'}`}>{t.rbotMessages || 'Messages'}</span>
             </button>
             <button onClick={() => setView('help')} className={`flex flex-col items-center pt-[18px] pb-[10px] transition-all ${view === 'help' ? 'text-[#00684A]' : 'text-[#6C6F74] rbot-button-hover'}`}>
               <HelpCircle size={24} className={view === 'help' ? 'fill-[#00684A]/10' : ''} />
               <span className={`text-[14px] leading-[20px] mt-2 ${view === 'help' ? 'font-bold' : 'font-medium'}`}>{t.rbotHelp || 'Help'}</span>
             </button>
          </div>
        </div>
      )}

      {/* Launcher */}
      <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform pointer-events-auto active:scale-95 border-2 ${isOpen ? 'bg-white text-[#001E2B] border-[#E8EDEB]' : 'bg-[#00684A] text-white border-transparent'}`}>
        {isOpen ? <ChevronDown size={28} strokeWidth={3} /> : <div className="relative"><MessageSquare size={32} strokeWidth={1.5} /><div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border border-white shadow-lg" /></div>}
      </button>
    </div>
  );
}
