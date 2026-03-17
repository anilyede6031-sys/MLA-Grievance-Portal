import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Layers, Info, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function ProjectMap() {
  const { t } = useLang();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.success) {
        // Assign random simulation coordinates for the map
        const data = res.data.projects.map((p, i) => ({
          ...p,
          x: 20 + (i * 15) % 60 + (Math.random() * 5),
          y: 20 + (i * 10) % 60 + (Math.random() * 5),
        }));
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    // Live Satellite Refresh every 60 seconds
    const interval = setInterval(fetchProjects, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  return (
    <div className="min-h-screen bg-[#0a2444] text-white overflow-hidden flex flex-col">
      {/* HUD Header */}
      <div className="p-6 border-b border-white/10 backdrop-blur-xl bg-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-saffron-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tighter flex items-center gap-2">
               <span className="text-saffron-500 animate-pulse">🛰️</span> {t.liveMapTitle}
            </h1>
            <p className="text-[10px] text-blue-300/40 uppercase tracking-[0.3em] font-bold">Satellite Feed Analysis • Real-time Data</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            {['all', 'complete', 'under_process', 'incomplete'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  filter === f 
                  ? 'bg-saffron-500 border-saffron-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'All Units' : (t[f] || f)}
              </button>
            ))}
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative bg-black overflow-hidden group">
        {/* Background Image (Mockup) */}
        <div className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-1000">
           <img 
             src="/daund-map.png" 
             className="w-full h-full object-cover scale-150 animate-[pulse_10s_infinite]"
             alt="Live Map"
           />
        </div>

        {/* Scanning Lines Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />

        {/* Project Markers */}
        {!loading && filteredProjects.map(p => (
          <div 
            key={p._id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group/marker"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => setSelectedProject(p)}
          >
             {/* Ping Effect */}
             <div className={`absolute inset-[-10px] rounded-full animate-ping opacity-20 ${
               p.status === 'complete' ? 'bg-green-500' : p.status === 'under_process' ? 'bg-blue-500' : 'bg-red-500'
             }`} />
             
             {/* Marker Hexagon */}
             <div className={`w-8 h-8 flex items-center justify-center relative transition-transform group-hover/marker:scale-125 ${
               p.status === 'complete' ? 'text-green-400' : p.status === 'under_process' ? 'text-blue-400' : 'text-red-400'
             }`}>
                <MapPin size={28} fill="currentColor" fillOpacity={0.2} />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
             </div>

             {/* Minimal Label */}
             <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[8px] font-bold whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity shadow-lg">
                {p.name.substring(0, 15)}...
             </div>
          </div>
        ))}

        {/* Selected Project Card (HUD Style) */}
        {selectedProject && (
          <div className="absolute bottom-10 left-10 w-80 animate-slide-right z-30">
             <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group/card">
                <div className="absolute top-0 right-0 p-4">
                   <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-white transition-colors">
                      <Layers size={16} />
                   </button>
                </div>

                <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-bold text-saffron-400 uppercase tracking-widest mb-4">
                   Sector Analysis • {selectedProject.department}
                </div>

                <h3 className="text-xl font-extrabold mb-1 tracking-tight pr-4">{selectedProject.name}</h3>
                
                <div className="flex items-center gap-2 mb-6">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${
                     selectedProject.status === 'complete' ? 'bg-green-500' : selectedProject.status === 'under_process' ? 'bg-blue-400' : 'bg-red-500'
                   }`} />
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                     {t[selectedProject.status] || selectedProject.status}
                   </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Budget Allocation</p>
                      <p className="text-sm font-bold">₹ {selectedProject.budget} {t.crore}</p>
                   </div>
                   <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Completion Date</p>
                      <p className="text-sm font-bold">
                        {selectedProject.expectedCompletionDate ? new Date(selectedProject.expectedCompletionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                   </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-6 italic line-clamp-2">
                   "{selectedProject.description || 'No description provided.'}"
                </p>

                <Link 
                   to="/"
                   className="flex items-center justify-center gap-2 w-full py-3 bg-saffron-500 hover:bg-saffron-600 rounded-xl font-bold text-xs transition-all shadow-lg shadow-saffron-500/20"
                >
                   <Info size={14} /> Full Data Access
                </Link>
             </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-10 right-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 hidden md:block">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Live Status Legend</p>
           <div className="space-y-2">
              <div className="flex items-center gap-3 text-[10px] font-bold">
                 <div className="w-2 h-2 rounded-full bg-green-500" /> {t.complete}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                 <div className="w-2 h-2 rounded-full bg-blue-400" /> {t.underProcess}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                 <div className="w-2 h-2 rounded-full bg-red-500" /> {t.incomplete}
              </div>
           </div>
        </div>

        {/* UI Decorative Elements */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-4 pointer-events-none opacity-20">
           <div className="w-px h-20 bg-gradient-to-b from-transparent via-white to-transparent" />
           <p className="vertical-text text-[8px] font-bold uppercase tracking-[0.5em] text-white">Grid System 042-B</p>
           <div className="w-px h-20 bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[100] backdrop-blur-xl">
           <div className="text-center">
              <div className="w-16 h-16 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-saffron-400">Initializing Core Map Link...</p>
           </div>
        </div>
      )}
    </div>
  );
}
