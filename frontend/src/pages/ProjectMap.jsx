import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Layers, Info, CheckCircle, Clock, AlertTriangle, Globe, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

// Fix for Leaflet default icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Stylized Marker Icon
const createCustomIcon = (status) => {
  const color = status === 'complete' ? '#22c55e' : status === 'under_process' ? '#60a5fa' : '#ef4444';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 rounded-full animate-ping opacity-20" style="background-color: ${color}"></div>
        <div class="w-8 h-8 rounded-full border-2 border-white/50 shadow-lg flex items-center justify-center transform hover:scale-125 transition-transform" style="background-color: ${color}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

function MapViewSetter({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.flyTo(coords, 16, { duration: 2 });
    }, [coords]);
    return null;
}

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
        setProjects(res.data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 60000); // Live sync
    return () => clearInterval(interval);
  }, []);

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  const daundCenter = [18.4637, 74.5828];

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden flex flex-col font-sans">
      {/* HUD Header Overlay */}
      <div className="fixed top-0 left-0 right-0 p-6 backdrop-blur-md bg-black/40 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 z-[1000]">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-saffron-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
               <span className="text-saffron-500 animate-pulse">🛰️</span> LIVE DEVELOPMENT MAP
            </h1>
            <p className="text-[10px] text-blue-300/40 uppercase tracking-[0.3em] font-bold">Satellite Feed Analysis • Real-time Data Hub</p>
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

      {/* Main Map Integration */}
      <div className="flex-1 relative z-10">
        <MapContainer 
          center={daundCenter} 
          zoom={14} 
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
        >
          {/* Satellite Layer */}
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution='&copy; Google Satellite'
          />
          
          <MapViewSetter coords={selectedProject ? [selectedProject.lat, selectedProject.lng] : null} />

          {filteredProjects.map(p => (
            <Marker 
              key={p._id} 
              position={[p.lat, p.lng]} 
              icon={createCustomIcon(p.status)}
              eventHandlers={{
                click: () => setSelectedProject(p),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-gray-900">
                   <h4 className="font-bold text-sm">{p.name}</h4>
                   <p className="text-[10px] opacity-70">{p.department}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* HUD UI Elements */}
        <div className="absolute inset-x-0 bottom-0 p-6 pointer-events-none z-[1001] flex flex-col md:flex-row items-end justify-between gap-6 bg-gradient-to-t from-black/80 to-transparent">
            {/* Selected Project Card */}
            {selectedProject && (
                <div className="w-80 pointer-events-auto animate-slide-up">
                    <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group/card">
                        <div className="absolute top-0 right-0 p-4">
                           <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-white transition-colors">
                              <Crosshair size={18} />
                           </button>
                        </div>
        
                        <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-bold text-saffron-400 uppercase tracking-widest mb-4">
                           Satellite Analysis • {selectedProject.department}
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
                              <p className="text-sm font-bold text-white">₹ {selectedProject.budget} {t.crore}</p>
                           </div>
                           <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                              <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Completion Date</p>
                              <p className="text-sm font-bold text-white">
                                {selectedProject.expectedCompletionDate ? new Date(selectedProject.expectedCompletionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                              </p>
                           </div>
                        </div>
        
                        <p className="text-xs text-gray-400 leading-relaxed mb-6 italic line-clamp-2">
                           "{selectedProject.description || 'No description provided.'}"
                        </p>
        
                        <div className="flex gap-2">
                            <button className="flex-1 py-3 bg-saffron-500 hover:bg-saffron-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-saffron-500/20">
                                <Info size={14} /> Full Data
                            </button>
                            <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-white/10">
                                <MapPin size={14} /> Navigate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend Overlay */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hidden md:block pointer-events-auto">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">Unit Status Legend</p>
                <div className="flex gap-6">
                   <div className="flex items-center gap-2 text-[10px] font-bold">
                      <div className="w-2 h-2 rounded-full bg-green-500" /> {t.complete || 'Complete'}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold">
                      <div className="w-2 h-2 rounded-full bg-blue-400" /> {t.underProcess || 'Under Process'}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold">
                      <div className="w-2 h-2 rounded-full bg-red-500" /> {t.incomplete || 'Incomplete'}
                   </div>
                </div>
            </div>
        </div>

        {/* Coordinate Overlay HUD (Decorative) */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-none opacity-40 z-20">
            <div className="w-px h-32 bg-gradient-to-b from-transparent via-white to-transparent" />
            <p className="[writing-mode:vertical-rl] text-[8px] font-black uppercase tracking-[0.8em] text-white">LAT: 18.4637N • LNG: 74.5828E</p>
            <div className="w-px h-32 bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#020617] z-[2000] backdrop-blur-3xl">
           <div className="text-center">
              <div className="w-20 h-20 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_50px_rgba(249,115,22,0.3)]" />
              <p className="text-xs font-black uppercase tracking-[0.5em] text-saffron-400 animate-pulse">Establishing Satellite Uplink...</p>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { background: #020617 !important; }
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .custom-popup .leaflet-popup-tip { background: rgba(255, 255, 255, 0.9) !important; }
      `}} />
    </div>
  );
}
