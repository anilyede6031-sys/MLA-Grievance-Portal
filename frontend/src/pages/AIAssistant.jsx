import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ArrowLeft, MessageSquare, List, AlertTriangle, X, Mic, Volume2, VolumeX, Camera, Paperclip, MapPin } from 'lucide-react';
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

  // Speech Recognition Setup
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'mr-IN'; // Multilingual support
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
    utterance.lang = 'mr-IN'; // Marathi Voice
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, byDepartment: [], byTaluka: [] });
  const [projSummary, setProjSummary] = useState({ expenditure: {}, totalBudget: 0, totalProjects: 0 });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, statsRes, sumRes] = await Promise.all([
          api.get('/projects'),
          api.get('/complaints/public-stats'),
          api.get('/projects/summary')
        ]);
        if (projRes.data.success) {
          const projs = projRes.data.projects;
          setProjects(projs);
          // Proactive Greeting Logic
          const activeProj = projs.find(p => p.status === 'under_process');
          if (activeProj) {
            setMessages(prev => [
              ...prev,
              { id: 'proactive', type: 'bot', text: `🇮🇳 अपडेट: ${activeProj.name} प्रकल्पाचे काम सध्या जोरात सुरू आहे! ${activeProj.description}. आम्ही दौंडच्या प्रगतीसाठी कटिबद्ध आहोत.` }
            ]);
          }
        }
        if (statsRes.data.success) {
          setStats({
            ...statsRes.data.stats,
            byDepartment: statsRes.data.byDepartment || [],
            byTaluka: statsRes.data.byTaluka || []
          });
        }
        if (sumRes.data.success) setProjSummary(sumRes.data.data);
      } catch (err) {
        console.error("Failed to fetch AI data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text = input, image = selectedImage, loc = location) => {
    if (!text.trim() && !image && !loc) return;

    const userMsg = { 
      id: Date.now(), 
      type: 'user', 
      text, 
      image: image ? URL.createObjectURL(image) : null 
    };
    if (text !== input) {
        // Only add message if it's not a duplicate from getLocation
        setMessages(prev => [...prev, userMsg]);
    } else {
        setMessages(prev => [...prev, userMsg]);
    }
    
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    // Real AI Response Logic using Gemini Multimodal + Location
    (async () => {
      try {
        const formData = new FormData();
        formData.append('message', text);
        if (image) formData.append('image', image);
        if (loc) formData.append('location', JSON.stringify(loc));

        const res = await api.post('/ai/chat', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
          const reply = res.data.reply;
          setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: reply }]);
        } else {
          throw new Error("AI failed");
        }
      } catch (err) {
        console.error("AI Assistant Error:", err);
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'bot', 
          text: /[\u0900-\u097F]/.test(text)
            ? "क्षमस्व, एआय असिस्टंट सध्या अनुपलब्ध आहे. कृपया थोड्या वेळाने प्रयत्न करा किंवा थेट 'तक्रार नोंदवा' वर जा."
            : "I'm sorry, the AI Assistant is currently experiencing high load. Please try again in a few moments or use our manual tracking features." 
        }]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const quickActions = [
    { label: t.aiAskComplaint, text: 'How to file a complaint?' },
    { label: t.aiAskProjects, text: 'Tell me about projects in Daund' },
    { label: t.aiAskEmergency, text: 'Show emergency contacts' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gov-navy text-white p-4 md:p-6 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-saffron-400">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-saffron-500 flex items-center justify-center shadow-lg shadow-saffron-500/20">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight">{t.aiAssistantTitle}</h1>
              <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">● Online & Ready</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold uppercase text-gray-400">
            Powered by Daund Digital Hub
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${m.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${m.type === 'user' ? 'bg-gov-navy' : 'bg-saffron-500'}`}>
                {m.type === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
              </div>
              <div 
                onClick={() => m.type === 'bot' && speak(m.text)}
                className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed cursor-pointer group relative ${
                m.type === 'user' 
                  ? 'bg-gov-navy text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
              }`}>
                {m.image && <img src={m.image} alt="uploaded" className="mb-2 rounded-lg max-h-48 object-cover" />}
                {m.text}
                {m.type === 'bot' && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Volume2 size={12} className="text-gov-navy/40" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-saffron-500 flex items-center justify-center">
                 <Bot size={14} className="text-white" />
               </div>
               <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150" />
               </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button 
                key={action.label}
                onClick={() => handleSend(action.text)}
                className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-saffron-50 dark:hover:bg-saffron-900/20 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold transition-all hover:border-saffron-300 active:scale-95"
              >
                {action.label}
              </button>
            ))}
          </div>

          {selectedImage && (
            <div className="relative inline-block">
              <img src={URL.createObjectURL(selectedImage)} className="w-20 h-20 rounded-xl object-cover border-2 border-saffron-500" />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept="image/*" 
              onChange={(e) => setSelectedImage(e.target.files[0])} 
            />
            <button 
              onClick={getLocation}
              className={`w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:border-saffron-300 transition-all ${location ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
            >
              <MapPin size={20} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:border-saffron-300 transition-all"
            >
              <Camera size={20} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Type or use Mic..."}
              className={`flex-1 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-saffron-500 rounded-2xl px-5 py-3 text-sm text-gray-900 dark:text-white dark:placeholder-gray-500 ${isListening ? 'animate-pulse bg-saffron-50' : ''}`}
            />
            <button 
              onClick={startListening}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-gov-navy text-white hover:bg-gov-blue shadow-lg shadow-gov-navy/20'}`}
            >
              {isListening && <span className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-75"></span>}
              <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
            </button>
            <button 
              onClick={() => handleSend()}
              className="w-12 h-12 bg-saffron-500 hover:bg-saffron-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-saffron-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 uppercase tracking-[0.2em] font-bold">
            Automated Assistant · Final responses handled by MLA Office
          </p>
        </div>
      </div>
    </div>
  );
}
