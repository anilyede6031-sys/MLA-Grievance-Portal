import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, CheckCircle, Clock, AlertCircle, TrendingUp, ChevronRight, Phone } from 'lucide-react';
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
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/complaints/public-stats');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
    </div>
  );
}
