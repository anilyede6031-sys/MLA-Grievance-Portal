import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Bot, FileQuestion, Users, Globe, ChevronRight, Search, Instagram, Youtube, Twitter, MessageSquare, HelpCircle, MapPin, ArrowLeft, Send, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('menu'); // 'menu' or 'chat'
  const { t } = useLang();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: t.aiGreeting || 'Hello! I am Daund Vikas Mitra, your 24/7 Digital Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Geolocation
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: `📍 Location Shared: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }]);
      handleSend(`My location is shared. What projects are near me?`, null, { lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, (err) => {
      console.error(err);
      alert("Unable to retrieve location.");
    });
  };

  // Speech Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = t.language === 'English' ? 'mr-IN' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.start();
  };

  // Text to Speech
  const speak = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = t.language === 'English' ? 'mr-IN' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text = input, image = selectedImage, loc = location) => {
    if (!text.trim() && !image && !loc) return;
    
    // Switch to chat view if sending from menu
    if (view === 'menu') setView('chat');

    const userMsg = { 
      id: Date.now(), 
      type: 'user', 
      text,
      image: image ? URL.createObjectURL(image) : null
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('message', text);
      if (image) formData.append('image', image);
      if (loc) formData.append('location', JSON.stringify(loc));

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
      {/* Premium Widget Card */}
      {isOpen && (
        <div className="w-[340px] md:w-[380px] bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-up pointer-events-auto origin-bottom-right border border-gray-100 dark:border-gray-800 flex flex-col h-[600px] max-h-[80vh]">
          
          {/* VIEW: MENU */}
          {view === 'menu' ? (
            <>
              {/* Header Section */}
              <div className="bg-gradient-to-br from-gov-navy via-gov-blue to-saffron-500 p-6 text-white relative flex-shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black opacity-90 tracking-tighter uppercase whitespace-nowrap">Daund Vikas Mitra</span>
                    <span className="bg-green-500 text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">24/7</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-bold opacity-90 tracking-tight">{t.aiAssistantTitle}</h2>
                  <h1 className="text-lg font-extrabold tracking-tight leading-tight">{t.aiAssistantDesc}</h1>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950 space-y-4 overflow-y-auto custom-scrollbar">
                
                {/* Primary Action */}
                <button 
                  onClick={() => setView('chat')}
                  className="w-full text-left bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-gray-800 dark:text-gray-100">{t.aiAssistantTitle} Chat</h3>
                      <p className="text-xs text-green-500 font-bold mt-0.5">● {t.aiStatus}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-saffron-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Bot size={20} />
                    </div>
                  </div>
                </button>

                {/* Quick Actions List */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                   {[
                     { label: t.aiAskComplaint, text: 'How to file a complaint?', icon: MessageSquare },
                     { label: t.aiAskProjects, text: 'Tell me about projects in Daund', icon: MapPin },
                     { label: t.aiAskEmergency, text: 'Show emergency contacts', icon: Users },
                     { label: "Search Help Center", text: 'Search help', icon: Search },
                   ].map((item, idx) => (
                     <button 
                       key={idx} 
                       onClick={() => handleSend(item.text)}
                       className="w-full flex items-center justify-between p-4 text-left border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                     >
                       <div className="flex items-center gap-3">
                         <item.icon size={16} className="text-gray-400 group-hover:text-saffron-500" />
                         <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">{item.label}</span>
                       </div>
                       <ChevronRight size={16} className="text-gray-300 group-hover:text-saffron-500 transition-colors" />
                     </button>
                   ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* VIEW: CHAT */}
              <div className="flex flex-col h-full bg-white dark:bg-gray-950">
                {/* Chat Header */}
                <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('menu')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="relative">
                       <div className="w-10 h-10 rounded-full bg-saffron-500 flex items-center justify-center text-white font-black text-lg shadow-sm">V</div>
                       <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">Daund Vikas Mitra</h3>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{t.aiStatus}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-950/50">
                   {messages.map((m) => (
                     <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex gap-3 max-w-[85%] ${m.type === 'user' ? 'flex-row-reverse' : ''}`}>
                           {m.type !== 'user' && (
                             <div className="w-6 h-6 rounded-full bg-saffron-500 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">V</div>
                           )}
                           <div 
                             onClick={() => m.type === 'bot' && speak(m.text)}
                             className={`p-4 rounded-2xl text-sm leading-relaxed cursor-pointer relative group ${
                             m.type === 'user' 
                               ? 'bg-gov-navy text-white rounded-tr-none shadow-md shadow-gov-navy/20' 
                               : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none font-medium'
                           }`}>
                             {m.image && <img src={m.image} alt="uploaded" className="mb-2 rounded-lg max-h-32 object-cover" />}
                             {m.text}
                             {m.type === 'bot' && (
                               <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Volume2 size={10} className="text-gray-400" />
                               </div>
                             )}
                           </div>
                        </div>
                     </div>
                   ))}
                   {isTyping && (
                     <div className="flex justify-start animate-fade-in">
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                           <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                           <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75" />
                           <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150" />
                        </div>
                     </div>
                   )}
                   <div ref={scrollRef} />
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
                   {selectedImage && (
                     <div className="relative inline-block">
                        <img src={URL.createObjectURL(selectedImage)} className="w-16 h-16 rounded-xl object-cover border-2 border-saffron-500" />
                        <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                          <X size={10} />
                        </button>
                     </div>
                   )}
                   <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedImage(e.target.files[0])} />
                      <button onClick={getLocation} className={`p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl border border-gray-100 dark:border-gray-700 ${location ? 'text-green-500 border-green-200' : ''}`}><MapPin size={18} /></button>
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl border border-gray-100 dark:border-gray-700"><Camera size={18} /></button>
                      
                      <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : t.aiPlaceholder}
                        className={`flex-1 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-0 rounded-xl px-4 py-2 text-sm dark:text-white ${isListening ? 'animate-pulse bg-red-50' : ''}`}
                      />
                      
                      <button 
                        onClick={startListening}
                        className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700'}`}
                      >
                        <Mic size={18} />
                      </button>
                      
                      <button 
                        onClick={() => handleSend()}
                        className="w-10 h-10 bg-saffron-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-saffron-500/20 transition-all active:scale-95"
                      >
                        <Send size={18} />
                      </button>
                   </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Navigation Bar */}
          <div className="bg-white dark:bg-gray-900 px-6 py-2 grid grid-cols-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
             <button onClick={() => setView('menu')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'menu' ? 'text-saffron-500' : 'text-gray-400'}`}>
               <div className={`w-1.5 h-1.5 rounded-full bg-current mb-0.5 transition-opacity ${view === 'menu' ? 'opacity-100' : 'opacity-0'}`} />
               <Bot size={18} />
               <span className="text-[8px] font-black uppercase tracking-widest">Assistant</span>
             </button>
             <button onClick={() => setView('chat')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'chat' ? 'text-saffron-500' : 'text-gray-400'}`}>
               <div className={`w-1.5 h-1.5 rounded-full bg-current mb-0.5 transition-opacity ${view === 'chat' ? 'opacity-100' : 'opacity-0'}`} />
               <MessageSquare size={18} />
               <span className="text-[8px] font-black uppercase tracking-widest">Chat</span>
             </button>
             <Link to="/emergency" className="flex flex-col items-center gap-1 text-gray-400 hover:text-saffron-500 transition-colors">
               <div className="w-1.5 h-1.5 rounded-full bg-current mb-0.5 opacity-0" />
               <HelpCircle size={18} />
               <span className="text-[8px] font-black uppercase tracking-widest">Contacts</span>
             </Link>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-xl shadow-saffron-500/20 transition-all duration-300 transform pointer-events-auto active:scale-95 group relative ${
          isOpen 
            ? 'bg-white text-gray-900 rotate-90 scale-90' 
            : 'bg-gradient-to-br from-gov-navy to-saffron-500 text-white hover:scale-110'
        }`}
      >
        {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-saffron-500 animate-ping opacity-20 scale-125" />
        )}
        {isOpen ? <X size={28} /> : (
          <div className="relative">
            <MessageCircle size={32} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg animate-bounce" />
          </div>
        )}
      </button>
    </div>
  );
}
