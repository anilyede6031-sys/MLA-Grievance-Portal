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

    const checkTracking = async (id) => {
      try {
        const res = await api.get(`/complaints/track?complaintId=${id}`);
        if (res.data.success && res.data.complaints.length > 0) {
          const c = res.data.complaints[0];
          return /[\u0900-\u097F]/.test(text)
            ? `तुमच्या तक्रारीची (#${id}) सद्यस्थिती: ${c.status === 'Pending' ? 'प्रलंबित' : c.status === 'Resolved' ? 'सुटली आहे' : 'प्रक्रियेत आहे'}. विभागाचे नाव: ${c.department}.`
            : `Status for Complaint #${id}: ${c.status}. Department: ${c.department}. Last updated: ${new Date(c.updatedAt).toLocaleDateString('en-IN')}.`;
        }
        return null;
      } catch { return null; }
    };

    // AI Response Logic
    setTimeout(async () => {
      let reply = '';
      const lowText = text.toLowerCase();
      const isMarathi = /[\u0900-\u097F]/.test(text);

      // 1. Check for Complaint ID pattern (e.g., GRV-MMV31NZE-845E)
      const idMatch = text.match(/(GRV-[A-Z0-9-]+)/i);
      if (idMatch) {
        const trackReply = await checkTracking(idMatch[1].toUpperCase());
        if (trackReply) {
          setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: trackReply }]);
          setIsTyping(false);
          return;
        }
      }

      if (lowText.includes('report') || lowText.includes('analysis') || lowText.includes('अहवाल') || lowText.includes('आकडेवारी') || lowText.includes('सर्व माहिती')) {
        reply = isMarathi
          ? `दौंड विकास अहवाल: एकूण निधी ₹${projSummary.totalBudget} कोटी (${projSummary.totalProjects} प्रकल्प). तक्रारी: एकूण ${stats.total}, त्यापैकी ${stats.resolved} सुटल्या आहेत. सर्वाधिक तक्रारी ${stats.byTaluka[0]?._id || 'दौंड'} तालुक्यातून आहेत.`
          : `Daund Development Report: Total Fund ₹${projSummary.totalBudget} Cr (${projSummary.totalProjects} Projects). Complaints: ${stats.total} total, ${stats.resolved} resolved. Highest issues reported in ${stats.byTaluka[0]?._id || 'Daund'} Taluka.`;
      } else if ((lowText.includes('total') || lowText.includes('एकूण')) && (lowText.includes('complaint') || lowText.includes('तक्रार'))) {
        reply = isMarathi
          ? `आतापर्यंत एकूण ${stats.total} तक्रारी प्राप्त झाल्या आहेत, त्यापैकी ${stats.resolved} तक्रारींचे यशस्वीरित्या निवारण करण्यात आले आहे.`
          : `We have received a total of ${stats.total} complaints, and ${stats.resolved} have been successfully resolved.`;
      } else if (lowText.includes('budget') || lowText.includes('निधी') || lowText.includes('खर्च')) {
        const topDept = Object.entries(projSummary.expenditure).sort((a,b) => b[1] - a[1])[0];
        reply = isMarathi
          ? `दौंडमधील एकूण विकास निधी ₹${projSummary.totalBudget} कोटी आहे. सर्वाधिक खर्च ${topDept ? topDept[0] : 'रस्ते'} विभागावर (₹${topDept ? topDept[1] : 0} कोटी) केला जात आहे.`
          : `The total development budget for Daund is ₹${projSummary.totalBudget} Cr. The highest allocation is for ${topDept ? topDept[0] : 'Roads'} (₹${topDept ? topDept[1] : 0} Cr).`;
      } else if (lowText.includes('taluka') || lowText.includes('तालुका') || lowText.includes('विभाग')) {
        const topTaluka = stats.byTaluka[0];
        const topDept = stats.byDepartment[0];
        reply = isMarathi
          ? `प्रादेशिक माहिती: सर्वाधिक तक्रारी ${topTaluka ? topTaluka._id : 'दौंड'} तालुक्यातून (${topTaluka ? topTaluka.count : 0}) आहेत. सर्वाधिक तक्रारी ${topDept ? topDept._id : 'रस्ते'} विभागाशी संबंधित आहेत.`
          : `Regional Data: Most complaints are from ${topTaluka ? topTaluka._id : 'Daund'} (${topTaluka ? topTaluka.count : 0}). The most affected department is ${topDept ? topDept._id : 'Roads'}.`;
      } else if (lowText.includes('complaint') || lowText.includes('तक्रार')) {
        reply = isMarathi 
          ? "तक्रार नोंदवण्यासाठी, मुख्य पृष्ठावरील 'तक्रार नोंदवा' वर क्लिक करा. तुम्हाला तुमची माहिती आणि समस्येचे वर्णन द्यावे लागेल. सबमिट केल्यानंतर, तुम्हाला एक युनिक ट्रॅकिंग आयडी मिळेल."
          : "To file a complaint, click on 'File a Complaint' on the home page. You'll need to provide your details and a description of the issue. After submission, you will receive a unique Tracking ID.";
      } else if (lowText.includes('project') || lowText.includes('प्रकल्प') || lowText.includes('काम')) {
        if (projects.length > 0) {
          const featured = projects.slice(0, 3);
          const projectList = featured.map(p => `- ${p.name} (Budget: ₹${p.budget} Cr, Status: ${p.status})`).join('\n');
          reply = isMarathi
            ? `दौंडमध्ये सध्या अनेक प्रकल्प सुरू आहेत. काही महत्त्वाचे प्रकल्प:\n${projectList.replace(/Budget/g, 'निधी').replace(/Status/g, 'स्थिती')}\n\nअधिक माहितीसाठी मुख्य पृष्ठावरील 'Live Map' तपासा.`
            : `There are several ongoing projects in Daund. Some key projects include:\n${projectList}\n\nYou can see the full list on the 'Live Map' on our HomePage.`;
        } else {
          reply = isMarathi
            ? "सध्या प्रकल्पांची माहिती उपलब्ध नाही. कृपया थोड्या वेळाने प्रयत्न करा."
            : "Project information is currently unavailable. Please try again later.";
        }
      } else if (lowText.includes('emergency') || lowText.includes('आपत्कालीन') || lowText.includes('मदत')) {
        reply = isMarathi
          ? "तुम्ही आमच्या 'आपत्कालीन संपर्क' पृष्ठावर सर्व महत्वाचे नंबर (पोलीस, रुग्णवाहिका, अग्निशमन दल) शोधू शकता. मी तुम्हाला तिथे घेऊन जाऊ का?"
          : "You can find all emergency contacts (Police, Ambulance, Fire) on our dedicated 'Emergency Contacts' page. Would you like me to show them?";
      } else {
        reply = isMarathi
          ? "क्षमस्व, मला समजले नाही. अधिक मदतीसाठी खालील बटणे वापरा."
          : "I'm sorry, I'm still learning. For specific help, you can use the quick actions below.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1000);
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
