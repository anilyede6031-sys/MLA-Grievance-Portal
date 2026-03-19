import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ArrowLeft, MessageSquare, List, AlertTriangle, X } from 'lucide-react';
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
  const scrollRef = useRef(null);

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
        if (projRes.data.success) setProjects(projRes.data.projects);
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

  const handleSend = (text = input) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Real AI Response Logic using Gemini
    (async () => {
      try {
        const res = await api.post('/ai/chat', { message: text });
        if (res.data.success) {
          setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: res.data.reply }]);
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
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                m.type === 'user' 
                  ? 'bg-gov-navy text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
              }`}>
                {m.text}
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
          <div className="flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-saffron-500 rounded-2xl px-5 py-3 text-sm text-gray-900 dark:text-white dark:placeholder-gray-500"
            />
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
