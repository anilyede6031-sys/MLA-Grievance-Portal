import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Bot, FileQuestion, Users, Globe, ChevronRight, Search, Instagram, Youtube, Twitter, MessageSquare, HelpCircle, MapPin, ArrowLeft, Send, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('menu'); // 'menu' or 'chat'
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hi there 👋\nI\'ll guide you through your questions, and if anything needs extra support, our team is here to help.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const { t } = useLang();

  // Scroll to bottom
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
      const formData = new FormData();
      formData.append('message', text);
      const res = await api.post('/ai/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      console.error("Widget Chat Error:", err);
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: "Error connecting. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      {/* Premium Widget Card (Blueberry Style) */}
      {isOpen && (
        <div className="w-[340px] md:w-[380px] bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-up pointer-events-auto origin-bottom-right border border-gray-100 dark:border-gray-800 flex flex-col h-[600px] max-h-[80vh]">
          
          {/* VIEW: MENU */}
          {view === 'menu' ? (
            <>
              {/* Header Section (Purple Gradient) */}
              <div className="bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#d946ef] p-6 text-white relative flex-shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-sm font-bold opacity-90 tracking-tight">Daund Vikas Mitra</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <span className="font-bold text-xs uppercase">V</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <span className="font-bold text-xs uppercase">M</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="ml-2 hover:bg-white/10 p-1.5 rounded-full transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-bold opacity-90 tracking-tight">Hi There! 👋</h2>
                  <h1 className="text-3xl font-extrabold tracking-tight leading-tight">How Can We Help?</h1>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950 space-y-4 overflow-y-auto custom-scrollbar">
                
                {/* Primary Action: Send us a message */}
                <button 
                  onClick={() => setView('chat')}
                  className="w-full text-left bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-gray-800 dark:text-gray-100">Send us a message</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">AI Agent and team can help</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#a855f7] group-hover:scale-110 transition-transform">
                      <MessageSquare size={16} />
                    </div>
                  </div>
                </button>

                {/* Search Help */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between group focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                  <span className="text-sm text-gray-400 font-medium">Search for help</span>
                  <Search size={18} className="text-purple-500" />
                </div>

                {/* Link List */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                   {[
                     { label: "View our FAQ's", icon: FileQuestion },
                     { label: "Join our Community", icon: Users },
                     { label: "Follow us on Instagram", icon: Instagram },
                     { label: "Follow us on Twitter (X)", icon: Twitter },
                   ].map((item, idx) => (
                     <button key={idx} className="w-full flex items-center justify-between p-4 text-left border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                       <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">{item.label}</span>
                       <ChevronRight size={16} className="text-gray-300 group-hover:text-[#a855f7] transition-colors" />
                     </button>
                   ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* VIEW: CHAT (PABLO STYLE) */}
              <div className="flex flex-col h-full bg-white dark:bg-gray-950">
                {/* Chat Header */}
                <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('menu')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="relative">
                       <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">B</div>
                       <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">Vikas Mitra</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Now</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="p-2 text-gray-400"><Globe size={18} /></button>
                     <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400"><X size={18} /></button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-white dark:bg-gray-950">
                   {messages.map((m) => (
                     <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex gap-3 max-w-[85%] ${m.type === 'user' ? 'flex-row-reverse' : ''}`}>
                           {!m.type === 'user' && (
                             <div className="w-6 h-6 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">B</div>
                           )}
                           <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                             m.type === 'user' 
                               ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-500/20' 
                               : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none font-medium'
                           }`}>
                             {m.text}
                           </div>
                        </div>
                     </div>
                   ))}
                   {isTyping && (
                     <div className="flex justify-start animate-pulse">
                        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                           <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                           <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                           <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        </div>
                     </div>
                   )}
                   <div ref={scrollRef} />
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
                   <div className="flex gap-2">
                      <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Write a reply..."
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-0 rounded-xl px-4 py-2 text-sm dark:text-white"
                      />
                      <button 
                        onClick={() => handleSend()}
                        className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-90 transition-all"
                      >
                        <Send size={18} />
                      </button>
                   </div>
                   <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest mt-3">Powered by Daund Digital Hub</p>
                </div>
              </div>
            </>
          )}

          {/* SHARED: Footer Navigation Bar */}
          <div className="bg-white dark:bg-gray-900 px-6 py-3 grid grid-cols-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
             <button onClick={() => setView('menu')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'menu' ? 'text-purple-600' : 'text-gray-400'}`}>
               {view === 'menu' && <div className="w-1.5 h-1.5 rounded-full bg-current mb-0.5" />}
               <span className="text-[10px] font-extrabold uppercase tracking-widest">{view === 'menu' ? 'Home' : <Globe size={16} />}</span>
             </button>
             <button onClick={() => setView('chat')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'chat' ? 'text-purple-600' : 'text-gray-400'}`}>
               {view === 'chat' && <div className="w-1.5 h-1.5 rounded-full bg-current mb-0.5" />}
               <MessageSquare size={view === 'chat' ? 0 : 18} />
               <span className="text-[10px] font-extrabold uppercase tracking-widest">Messages</span>
             </button>
             <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
               <HelpCircle size={18} />
               <span className="text-[10px] font-extrabold uppercase tracking-widest">Help</span>
             </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(168,85,247,0.4)] transition-all duration-300 transform pointer-events-auto active:scale-95 group relative ${
          isOpen 
            ? 'bg-white text-gray-900 rotate-90 scale-90' 
            : 'bg-gradient-to-br from-[#6366f1] to-[#d946ef] text-white hover:scale-110'
        }`}
      >
        {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-[#d946ef] animate-ping opacity-20 scale-125" />
        )}
        {isOpen ? <X size={28} /> : (
          <div className="relative">
            <MessageCircle size={32} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-bounce" />
          </div>
        )}
      </button>
    </div>
  );
}
