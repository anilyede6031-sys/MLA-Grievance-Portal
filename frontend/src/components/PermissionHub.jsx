import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Mic, ShieldCheck, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function PermissionHub() {
  const { t } = useLang();
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState({
    location: false,
    camera: false,
    mic: false
  });

  useEffect(() => {
    const hasSeen = localStorage.getItem('perm_hub_seen');
    if (!hasSeen) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const askAllPermissions = async () => {
    try {
      // 1. Location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => setStatus(prev => ({ ...prev, location: true })),
          () => console.log("Location Denied")
        );
      }

      // 2. Camera & Mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStatus(prev => ({ ...prev, camera: true, mic: true }));
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.log("Media Denied", e);
      }

      alert(t.allPermsGranted);
      handleClose();
    } catch (error) {
      console.error("Permission error:", error);
      alert(t.permsDeniedMsg);
    }
  };

  const handleClose = () => {
    localStorage.setItem('perm_hub_seen', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="relative p-8 text-center bg-gradient-to-b from-[#00684A]/10 to-transparent">
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
          
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-50 text-[#00684A]">
            <ShieldCheck size={40} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t.permHubTitle}</h2>
          <p className="text-sm text-gray-500 font-medium px-4">{t.permHubSub}</p>
        </div>

        <div className="px-8 pb-8 space-y-4">
          <div className="space-y-3">
             <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status.location ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                   {status.location ? <CheckCircle2 size={24} /> : <MapPin size={22} />}
                </div>
                <div className="flex-1">
                   <p className="text-xs font-bold text-gray-900 dark:text-white">{t.permLocation}</p>
                </div>
             </div>

             <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status.camera ? 'bg-green-100 text-green-600' : 'bg-purple-50 text-purple-500'}`}>
                   {status.camera ? <CheckCircle2 size={24} /> : <Camera size={22} />}
                </div>
                <div className="flex-1">
                   <p className="text-xs font-bold text-gray-900 dark:text-white">{t.permCamera}</p>
                </div>
             </div>

             <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status.mic ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                   {status.mic ? <CheckCircle2 size={24} /> : <Mic size={22} />}
                </div>
                <div className="flex-1">
                   <p className="text-xs font-bold text-gray-900 dark:text-white">{t.permMic}</p>
                </div>
             </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
             <button 
               onClick={askAllPermissions}
               className="w-full h-14 bg-[#00684A] text-white rounded-2xl font-black shadow-lg shadow-[#00684A]/20 hover:bg-[#00583A] transition-all active:scale-95 flex items-center justify-center gap-3 group"
             >
               {t.allowAll}
               <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </button>
             <button 
               onClick={handleClose}
               className="w-full h-14 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
             >
               {t.maybeLater}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
