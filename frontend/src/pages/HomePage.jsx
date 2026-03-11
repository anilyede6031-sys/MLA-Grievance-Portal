import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, CheckCircle, Clock, AlertCircle, TrendingUp, ChevronRight, Phone } from 'lucide-react';
import { useLang } from '../context/LangContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

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
        const res = await fetch(`${API_URL}/api/complaints/public-stats`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
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
      <section className="relative bg-gradient-to-br from-gov-navy via-blue-900 to-blue-800 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-saffron-500 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-green-500 translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-saffron-500/20 border border-saffron-400/30 rounded-full px-4 py-1.5 text-saffron-300 text-sm font-medium mb-6">
                🏛️ Government of Maharashtra
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                {t.welcome}
              </h1>
              <p className="text-blue-200 text-lg mb-3 font-marathi">
                आपल्या समस्यांचे निराकरण आमची प्राथमिकता
              </p>
              <p className="text-blue-300 mb-8 text-sm md:text-base leading-relaxed">
                {t.welcomeSub}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/complaint"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                  <FileText size={18} /> {t.fileComplaint}
                </Link>
                <Link to="/track"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all">
                  <Search size={18} /> {t.trackComplaint}
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3 text-blue-300 text-sm">
                <Phone size={14} />
                <span>Constituency Office: Daund, Maharashtra</span>
              </div>
            </div>

            {/* MLA Photo placeholder */}
            <div className="flex justify-center animate-fade-in">
              <div className="relative">
                <div className="w-64 h-80 md:w-72 md:h-96 rounded-2xl bg-gradient-to-b from-saffron-400/30 to-white/10 border-2 border-saffron-400/30 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                  <div className="w-32 h-32 rounded-full border-4 border-white/80 shadow-lg mb-4 overflow-hidden bg-saffron-100 flex items-center justify-center">
                    <img src="/mla-photo.png" alt={t.mlaName} className="w-full h-full object-cover object-top" />
                  </div>
                  <p className="text-white font-bold text-lg text-center px-4">{t.mlaName}</p>
                  <p className="text-saffron-300 text-sm font-marathi text-center px-4 mt-1">आमदार</p>
                  <p className="text-blue-300 text-xs text-center px-4 mt-1">{t.constituency}</p>
                  <div className="mt-4 px-4 py-2 bg-saffron-500/20 rounded-full">
                    <p className="text-saffron-300 text-xs font-medium">Maharashtra Legislative Assembly</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-saffron-500 flex items-center justify-center text-lg">🇮🇳</div>
                <div className="absolute -bottom-3 -left-3 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs">MLA</div>
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
