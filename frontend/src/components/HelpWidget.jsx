import { useState, useEffect } from 'react';
import { MessageCircle, X, Bot, FileQuestion, Users, Globe, ChevronRight, Search, Instagram, Youtube, Twitter, MessageSquare, HelpCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      {/* Premium Widget Card (Blueberry Style) */}
      {isOpen && (
        <div className="w-[340px] md:w-[380px] bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-up pointer-events-auto origin-bottom-right border border-gray-100 dark:border-gray-800">
          
          {/* Header Section (Purple Gradient) */}
          <div className="bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#d946ef] p-6 text-white relative">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold opacity-90 tracking-tight">Daund Vikas Mitra</span>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <span className="font-bold text-xs">B</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <span className="font-bold text-xs">B</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="ml-2 hover:bg-white/10 p-1.5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold opacity-90">Hi There!</h2>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight">How Can We Help? 🙏</h1>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            
            {/* Primary Action: Send us a message */}
            <Link 
              to="/ai-assistant" 
              onClick={() => setIsOpen(false)}
              className="block bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">Send us a message</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">AI Agent and team can help</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#d946ef] group-hover:scale-110 transition-transform">
                  <MapPin size={16} />
                </div>
              </div>
            </Link>

            {/* Search Help */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
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
                 { label: "Subscribe to our Youtube", icon: Youtube },
               ].map((item, idx) => (
                 <button key={idx} className="w-full flex items-center justify-between p-4 text-left border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                   <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                   <ChevronRight size={16} className="text-gray-300 group-hover:text-[#a855f7] transition-colors" />
                 </button>
               ))}
            </div>
          </div>

          {/* Footer Navigation (Blueberry Style) */}
          <div className="bg-white dark:bg-gray-900 p-3 grid grid-cols-3 border-t border-gray-100 dark:border-gray-800">
             <button className="flex flex-col items-center gap-1 text-purple-600">
               <div className="w-1.5 h-1.5 rounded-full bg-current mb-0.5" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
             </button>
             <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors pt-2">
               <MessageSquare size={18} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Messages</span>
             </button>
             <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors pt-2">
               <HelpCircle size={18} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Help</span>
             </button>
          </div>
        </div>
      )}

      {/* Toggle Button (Purple Bubble) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(168,85,247,0.4)] transition-all duration-300 transform pointer-events-auto active:scale-95 ${
          isOpen 
            ? 'bg-white text-gray-900 rotate-90 scale-90' 
            : 'bg-gradient-to-br from-[#6366f1] to-[#d946ef] text-white hover:scale-110'
        }`}
      >
        {isOpen ? <X size={28} /> : (
          <div className="relative">
            <MessageCircle size={32} />
            <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          </div>
        )}
      </button>
    </div>
  );
}
