import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, CheckCircle, Clock, AlertCircle, TrendingUp, ChevronRight, Phone, XCircle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const step = target / (duration / 30);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function HomePage() {
  const { t } = useLang();
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [projectSummary, setProjectSummary] = useState({ expenditure: {}, statusCounts: { complete:0, under_process:0, incomplete:0 }, totalBudget: 0, totalProjects: 0 });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/complaints/public-stats');
      if (res.data.success) {
        setStats(res.data.stats || { total: 0, pending: 0, inProgress: 0, resolved: 0 });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchProjectSummary = async () => {
    try {
      const res = await api.get('/projects/summary');
      if (res.data.success) setProjectSummary(res.data.data);
    } catch (error) {
      console.error("Error fetching project summary:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.success) setProjects(res.data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchProjectSummary(), fetchProjects()]);
      setLoading(false);
    };
    
    loadData();

    // Live Polling every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchProjectSummary();
      fetchProjects();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: t.totalComplaints, value: stats.total, icon: FileText, color: 'text-gov-navy', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t.pending, value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: t.inProgress, value: stats.inProgress, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t.resolved, value: stats.resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[500px] flex items-center bg-[#0a2444] text-white overflow-hidden py-20">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] rounded-full bg-saffron-500/10 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-green-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Text content */}
            <div className="lg:col-span-7 animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-saffron-500/10 border border-saffron-400/20 backdrop-blur-md rounded-full px-4 py-1.5 text-saffron-400 text-sm font-semibold mb-8 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-saffron-500 animate-ping" />
                🏛️ {t.mlaName} Office · Daund
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                {t.welcome}
              </h1>
              <p className="text-xl md:text-2xl text-saffron-400 mb-4 font-marathi font-medium">
                आपल्या समस्यांचे निराकरण आमची प्राथमिकता
              </p>
              <p className="text-blue-100/70 mb-10 text-base md:text-lg leading-relaxed max-w-xl">
                {t.welcomeSub} Join thousands of citizens in Daund who are getting their grievances resolved swiftly and transparently through our official portal.
              </p>
              <div className="flex flex-wrap gap-5">
                <Link to="/complaint"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-saffron-500 hover:bg-saffron-600 text-white rounded-2xl font-bold shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-1">
                  <FileText size={20} className="group-hover:scale-110 transition-transform" /> {t.fileComplaint}
                </Link>
                <Link to="/track"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white rounded-2xl font-bold transition-all duration-300 transform hover:-translate-y-1">
                  <Search size={20} className="group-hover:scale-110 transition-transform" /> {t.trackComplaint}
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a2444] bg-blue-900 flex items-center justify-center text-[10px] font-bold">
                      {['👨', '👩', '👵', '👴'][i-1]}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-blue-200/60">
                  <span className="text-white font-bold">5,000+</span> citizens already registered
                </div>
              </div>
            </div>

            {/* MLA Photo Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end animate-fade-in delay-200">
              <div className="relative">
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-saffron-500/20 blur-[60px] rounded-full scale-110" />
                
                <div className="relative w-[320px] md:w-[380px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-6 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-saffron-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-saffron-500/20 transition-colors" />
                  
                  <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-gradient-to-b from-blue-900/50 to-transparent border border-white/5 mb-6">
                    <img src="/mla-photo.png" alt={t.mlaName} className="w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-700" />
                    
                    {/* Badge on photo */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                       <span className="text-[10px] uppercase tracking-widest font-bold text-saffron-400">Official Portal</span>
                       <div className="flex h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    </div>
                  </div>

                  <div className="space-y-1 text-center">
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{t.mlaName}</h3>
                    <p className="text-saffron-400 font-marathi font-semibold">आमदार - दौंड मतदारसंघ</p>
                    <p className="text-blue-300/60 text-xs font-medium uppercase tracking-[0.2em] pt-2">Maharashtra Legislative Assembly</p>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                      <p className="text-xl font-bold text-white">100%</p>
                      <p className="text-[10px] text-blue-300/40 uppercase font-bold tracking-wider mt-1">Response Rate</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                      <p className="text-xl font-bold text-white">24/7</p>
                      <p className="text-[10px] text-blue-300/40 uppercase font-bold tracking-wider mt-1">Online Support</p>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 text-gov-navy dark:text-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-700 animate-bounce transition-transform" style={{ animationDuration: '4s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-saffron-100 dark:bg-saffron-900/30 flex items-center justify-center text-xl">🇮🇳</div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Digital India</p>
                      <p className="text-sm font-extrabold">E-Governance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`card ${card.bg} border-0 flex flex-col items-center py-6 hover:shadow-md transition-shadow`}>
              <div className={`${card.color} mb-2`}>
                <card.icon size={24} />
              </div>
              <p className={`text-3xl font-extrabold ${card.color}`}>
                {loading ? '...' : <AnimatedCounter target={card.value} />}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mt-1 text-center">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="section-title text-3xl">How It Works</h2>
          <p className="section-subtitle">Simple 3-step process to resolve your grievance</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '📝', title: 'File Complaint', mr: 'तक्रार नोंदवा', desc: 'Fill in the complaint form with your details and description.' },
            { step: '02', icon: '🔔', title: 'Get Complaint ID', mr: 'क्रमांक मिळवा', desc: 'Receive a unique Complaint ID for tracking your complaint.' },
            { step: '03', icon: '✅', title: 'Track Resolution', mr: 'निराकरण ट्रॅक करा', desc: 'Track the status and get notified when resolved.' },
          ].map(({ step, icon, title, mr, desc }) => (
            <div key={step} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-saffron-100 dark:bg-saffron-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <div>
                  <span className="text-xs font-mono text-saffron-500 font-bold">STEP {step}</span>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-marathi text-sm">{mr}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Departments */}
      <section className="bg-gray-100 dark:bg-gray-900 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="section-title text-2xl">Complaint Categories</h2>
            <p className="section-subtitle">We handle grievances across all government departments</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {[
              { icon: '🛣️', label: 'Road' }, { icon: '💧', label: 'Water' },
              { icon: '⚡', label: 'Electricity' }, { icon: '📋', label: 'Revenue' },
              { icon: '👮', label: 'Police' }, { icon: '🏥', label: 'Health' },
              { icon: '🎓', label: 'Education' }, { icon: '🌾', label: 'Agriculture' },
              { icon: '📁', label: 'Other' },
            ].map(({ icon, label }) => (
              <Link key={label} to="/complaint"
                className="card hover:shadow-md hover:border-saffron-200 dark:hover:border-saffron-700 transition-all flex flex-col items-center py-4 gap-2 group">
                <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Extra Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="section-title text-3xl">{t.extraFeaturesTitle}</h2>
          <p className="section-subtitle">{t.extraFeaturesSub}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🤖', title: t.aiAssistantTitle, desc: t.aiAssistantDesc, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', link: '/ai-assistant' },
            { icon: '🗺️', title: t.liveMapTitle, desc: t.liveMapDesc, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', link: '/live-map' },
            { icon: '🚨', title: t.emergencyContactsTitle, desc: t.emergencyContactsDesc, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', link: '/emergency' },
          ].map((feature) => (
            <div key={feature.title} className="card hover:shadow-xl transition-all group border border-gray-100 dark:border-gray-800">
              <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className={`text-xl font-bold mb-3 ${feature.color} dark:text-white`}>{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {feature.desc}
              </p>
              <Link to={feature.link} className="mt-6 text-sm font-bold flex items-center gap-2 text-gray-400 group-hover:text-gov-navy dark:group-hover:text-saffron-400 transition-colors">
                {t.viewDetails} <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Transparency Section (MLA Fund Tracker) */}
      <section className="bg-white dark:bg-gray-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title text-3xl">{t.transparencyTitle}</h2>
            <p className="section-subtitle">{t.transparencySub}</p>
          </div>
          
          <div className="card shadow-2xl border-t-4 border-gov-navy dark:border-saffron-500 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <h3 className="text-xl font-extrabold text-gov-navy dark:text-white flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-saffron-100 dark:bg-saffron-900/30 flex items-center justify-center text-xl">📊</div>
                   <div className="flex flex-col">
                      <span>{t.mlaFundTrackerTitle}</span>
                      <span className="text-[9px] text-green-500 animate-pulse font-bold tracking-widest uppercase">● Live Updates Active</span>
                   </div>
                </h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedProject('list')}
                    className="text-xs font-bold text-saffron-600 hover:text-saffron-700 underline uppercase tracking-widest"
                  >
                    {t.viewDetails}
                  </button>
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Total Budget:</span>
                  <span className="text-gov-navy dark:text-saffron-400 font-bold">₹ {projectSummary.totalBudget || 0} {t.crore}</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
                {[
                  { label: t.roads, value: projectSummary.expenditure?.Road || 0, color: 'bg-gov-navy' },
                  { label: t.water, value: projectSummary.expenditure?.Water || 0, color: 'bg-blue-500' },
                  { label: t.education, value: projectSummary.expenditure?.Education || 0, color: 'bg-saffron-500' },
                  { label: t.health, value: projectSummary.expenditure?.Health || 0, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label} className="group">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gov-navy dark:group-hover:text-saffron-400 transition-colors uppercase tracking-wide">
                        {item.label}
                      </span>
                      <span className="text-sm font-extrabold text-gov-navy dark:text-white">
                        ₹ {item.value} {t.crore}
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-50 dark:border-gray-700">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(0,0,0,0.1)]`}
                        style={{ width: `${projectSummary.totalBudget > 0 ? (item.value / projectSummary.totalBudget) * 100 : 0}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                 {[
                   { label: t.complete, value: projectSummary.statusCounts?.complete || 0, icon: '✅' },
                   { label: t.underProcess, value: projectSummary.statusCounts?.under_process || 0, icon: '⏳' },
                   { label: t.incomplete, value: projectSummary.statusCounts?.incomplete || 0, icon: '❌' },
                   { label: t.totalProjects, value: projectSummary.totalProjects || 0, icon: '🏗️' }
                 ].map(info => (
                   <div key={info.label} className="p-3">
                     <div className="text-xl mb-1">{info.icon}</div>
                     <p className="text-xs text-gray-400 uppercase tracking-tighter mb-0.5">{info.label}</p>
                     <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{info.value}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">{t.fileComplaint}</h2>
          <p className="font-marathi text-saffron-100 mb-6 text-lg">आपली समस्या आमच्यापर्यंत पोहोचवा</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/complaint"
              className="inline-flex items-center gap-2 bg-white text-saffron-600 hover:bg-saffron-50 font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all">
              <FileText size={18} /> File Now <ChevronRight size={16} />
            </Link>
            <Link to="/track"
              className="inline-flex items-center gap-2 bg-saffron-700 hover:bg-saffron-800 text-white font-semibold px-8 py-3 rounded-xl transition-all">
              <Search size={18} /> Track Status
            </Link>
          </div>
        </div>
      </section>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-xl font-extrabold text-gov-navy dark:text-white flex items-center gap-3">
                <span className="text-2xl">🏗️</span> 
                {selectedProject === 'list' ? t.allProjects : selectedProject.name}
              </h2>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {selectedProject === 'list' ? (
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">{t.noProjectsFound || 'No projects found'}</div>
                  ) : (
                    projects.map(p => (
                      <div key={p._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-saffron-300 transition-all cursor-pointer group" onClick={() => setSelectedProject(p)}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-saffron-600 transition-colors">{p.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${p.status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : p.status === 'under_process' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                            {t[p.status] || p.status}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><strong>{t.department}:</strong> {p.department}</span>
                          <span><strong>{t.budget}:</strong> ₹ {p.budget} {t.crore}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                       <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t.department}</p>
                       <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{selectedProject.department}</p>
                     </div>
                     <div className="p-4 bg-saffron-50 dark:bg-saffron-900/20 rounded-2xl">
                       <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t.budget}</p>
                       <p className="text-sm font-bold text-saffron-700 dark:text-saffron-400">₹ {selectedProject.budget} {t.crore}</p>
                     </div>
                     <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                       <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t.status}</p>
                       <p className="text-sm font-bold text-green-700 dark:text-green-400">{t[selectedProject.status] || selectedProject.status}</p>
                     </div>
                  </div>
                  
                  {selectedProject.description && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t.projectDesc}</p>
                      <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 text-sm leading-relaxed border border-gray-100 dark:border-gray-700 italic">
                        "{selectedProject.description}"
                      </div>
                    </div>
                  )}

                  {selectedProject.expectedCompletionDate && selectedProject.status !== 'complete' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                       <Clock size={16} className="text-saffron-500" />
                       <strong>{t.expectedCompletion}:</strong> {new Date(selectedProject.expectedCompletionDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                    </div>
                  )}

                  <div className="pt-6">
                    <button 
                      onClick={() => setSelectedProject('list')}
                      className="text-sm font-bold text-gov-navy dark:text-saffron-400 hover:underline flex items-center gap-2"
                    >
                      ← {t.back || 'Back to List'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button 
                onClick={() => setSelectedProject(null)}
                className="btn-primary py-2 px-8 rounded-xl shadow-lg"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
