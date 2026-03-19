import { useState, useEffect } from 'react';
import { MessageCircle, X, Bot, FileQuestion, Users, Globe, ChevronRight, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLang();

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
      {/* Widget Card */}
      {isOpen && (
        <div className="w-[340px] md:w-[380px] bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-slide-up pointer-events-auto origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-br from-gov-navy to-gov-blue p-6 pb-12 relative text-white">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-saffron-500 flex items-center justify-center border-2 border-white/20 shadow-lg">
                <Bot size={22} className="text-white" />
              </div>
              <h3 className="font-extrabold text-lg">Help Center</h3>
            </div>
            <p className="text-white/70 text-sm font-medium">Hi there! How can we help? 👋</p>
          </div>

          {/* Body */}
          <div className="p-6 -mt-8 relative z-10 space-y-4">
            {/* Search Placeholder */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 flex items-center gap-3 shadow-md border border-gray-100 dark:border-gray-800 group focus-within:ring-2 focus-within:ring-saffron-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search for help..." 
                className="bg-transparent border-0 p-0 text-sm w-full focus:ring-0 text-gray-700 dark:text-gray-200"
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Link 
                to="/ai-assistant" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-saffron-300 dark:hover:border-saffron-600 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-saffron-50 dark:bg-saffron-900/20 flex items-center justify-center text-saffron-600">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Send us a message</h4>
                    <p className="text-[10px] text-gray-400 font-medium">AI Assistant is online & ready</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-saffron-500 transition-colors" />
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all text-left group">
                  <FileQuestion size={18} className="text-gov-blue group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">View FAQs</span>
                </button>
                <button className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all text-left group">
                  <Users size={18} className="text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Join Community</span>
                </button>
              </div>
            </div>

            {/* Social Links Mini */}
            <div className="flex items-center justify-center gap-4 py-2 opacity-50 hover:opacity-100 transition-opacity">
               <button className="text-gray-500 hover:text-gov-blue transition-colors"><Globe size={18} /></button>
               <button className="text-gray-500 hover:text-gov-blue transition-colors"><ExternalLink size={18} /></button>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 flex items-center justify-center gap-8 border-t border-gray-100 dark:border-gray-800">
            <button className="flex flex-col items-center gap-1 text-saffron-500">
               <div className="w-1.5 h-1.5 rounded-full bg-current" />
               <span className="text-[10px] font-bold uppercase">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
               <span className="text-[10px] font-bold uppercase">Messages</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
               <span className="text-[10px] font-bold uppercase">Help</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.4)] transition-all duration-300 transform pointer-events-auto active:scale-90 ${
          isOpen 
            ? 'bg-white text-gray-900 rotate-90 scale-90' 
            : 'bg-saffron-500 text-white hover:bg-saffron-600 hover:-translate-y-1'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gov-navy text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce-slow">
                1
            </span>
        )}
      </button>
    </div>
  );
}
