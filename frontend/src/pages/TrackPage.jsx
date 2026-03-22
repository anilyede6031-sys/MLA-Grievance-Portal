import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, Clock, TrendingUp, XCircle, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getPhotoUrl, formatDate } from '../utils/helpers';

const statusConfig = {
  Pending:     { label: 'Pending',     mr: 'प्रलंबित',    icon: Clock,        class: 'badge-pending' },
  'In Progress': { label: 'In Progress', mr: 'प्रक्रियेत',   icon: TrendingUp,   class: 'badge-inprogress' },
  Resolved:    { label: 'Resolved',    mr: 'निराकृत',    icon: CheckCircle,  class: 'badge-resolved' },
  Rejected:    { label: 'Rejected',    mr: 'नाकारले',    icon: XCircle,      class: 'badge-rejected' },
};

export default function TrackPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [query, setQuery] = useState(user?.role === 'citizen' ? user?.mobile || '' : '');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [replyFiles, setReplyFiles] = useState({});
  const [replying, setReplying] = useState({});
  const hasAutoFetched = useRef(false);
  const debounceRef = useRef(null);

  // Auto-fetch complaints for logged-in citizen exactly once on mount
  useEffect(() => {
    if (user?.role === 'citizen' && user?.mobile && !hasAutoFetched.current) {
      hasAutoFetched.current = true;
      handleSearch(user.mobile);
    }
  }, [user]);

  // Debounced Live Search
  useEffect(() => {
    if (!query) return;
    
    // Auto-search if it looks like a full mobile number (10 digits) or a valid GRV ID
    const isFullMobile = /^[6-9]\d{9}$/.test(query);
    const isFullId = query.startsWith('GRV-') && query.length >= 8;

    if (isFullMobile || isFullId) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        handleSearch(query);
      }, 600);
    }
    
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) { toast.error(t.searchHint || 'Enter Complaint ID or Mobile Number'); return; }
    
    const isId = searchQuery.startsWith('GRV-');

    // Privacy frontend validation
    if (!isId) {
      if (!user) {
        toast.error(t.mobileOwnershipError || 'You must be logged in to search by mobile number.');
        return;
      }
      if (user.role === 'citizen' && searchQuery !== user.mobile) {
        toast.error(t.privacyError || 'Privacy restricted: You can only search your own mobile number.');
        return;
      }
    }

    setLoading(true);
    // Don't reset searched immediately to avoid flickering while auto-searching
    try {
      const params = isId ? { complaintId: searchQuery } : { mobile: searchQuery };
      const res = await api.get('/complaints/track', { params });
      setComplaints(res.data.complaints);
      setSearched(true);
    } catch (err) {
      if (err.response?.status === 404) { 
        setComplaints([]); 
        setSearched(true); 
      }
      else if (err.response?.status === 403) { 
        toast.error(err.response.data.message); 
      }
      else {
        // Only toast error if it was a manual search or a significant failure
        if (!debounceRef.current) toast.error(t.updateError || 'Error fetching data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (complaintId) => {
    const files = replyFiles[complaintId] || [];
    if (files.length === 0) return toast.error(t.atLeastOnePhotoError || 'Please select at least one photo to reply.');
    
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));

    setReplying(prev => ({ ...prev, [complaintId]: true }));
    try {
      const res = await api.post(`/complaints/${complaintId}/reply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t.replySuccess || 'Reply submitted successfully!');
      
      // Update local state to show the new photos immediately
      setComplaints(prev => prev.map(c => {
        if (c._id === complaintId) {
          return { ...c, citizenPhotos: [...(c.citizenPhotos || []), ...res.data.paths] };
        }
        return c;
      }));
      setReplyFiles(prev => ({ ...prev, [complaintId]: [] }));
    } catch (err) {
      toast.error(err.response?.data?.message || t.updateError || 'Error uploading reply.');
    } finally {
      setReplying(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">

      {/* Search Card */}
      <div className="card mb-8">
        <label className="label text-base mb-2">{t.complaintId} {t.or} {t.mobile}</label>
        <div className="flex gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-field flex-1 text-base"
            placeholder={t.searchHint} />
          <button onClick={handleSearch} disabled={loading}
            className="btn-primary px-6 py-2.5 disabled:opacity-60">
            <Search size={18} />
            {loading ? t.searching : t.search}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="animate-slide-up">
          {complaints.length === 0 ? (
            <div className="card text-center py-12">
              <AlertTriangle size={48} className="mx-auto text-yellow-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">{t.noComplaintsTitle}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t.noComplaintsSub}</p>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
            {t.complaintIdOrMobile}
          </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{complaints.length} {t.complaintsFoundLabel}</p>
              {complaints.map(c => {
                const cfg = statusConfig[c.status] || statusConfig.Pending;
                const StatusIcon = cfg.icon;
                return (
                  <div key={c.complaintId} className="card border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{c.complaintId}</p>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{c.name}</h3>
                      </div>
                      <span className={`${cfg.class} flex items-center gap-1.5 text-sm px-3 py-1`}>
                        <StatusIcon size={14} /> {lang === 'en' ? cfg.label : cfg.mr}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{t.submitted}</span><span>{t.inProgress}</span><span>{t.resolved}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          c.status === 'Resolved' ? 'w-full bg-green-500' :
                          c.status === 'In Progress' ? 'w-2/3 bg-blue-500' :
                          c.status === 'Rejected' ? 'w-full bg-red-500' : 'w-1/3 bg-yellow-500'
                        }`} />
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                      {[
                        { label: t.village, value: c.village },
                        { label: t.taluka, value: c.taluka },
                        { label: t.department, value: c.department },
                        { label: t.filedOn, value: formatDate(c.createdAt) },
                        c.resolvedAt && { label: t.resolvedOn, value: formatDate(c.resolvedAt) },
                      ].filter(Boolean).map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1 font-medium">{t.description}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{c.description}</p>
                    </div>

                    {/* Admin remarks */}
                    {c.remarks && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex gap-2">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400">{t.adminRemarks}</p>
                          <p className="text-sm text-green-800 dark:text-green-300">{c.remarks}</p>
                        </div>
                      </div>
                    )}

                    {/* Admin Reply Photos */}
                    {Array.isArray(c.adminPhotos) && c.adminPhotos.length > 0 && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
                          📎 {t.adminReplyPhotos}
                          <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{c.adminPhotos.length}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {c.adminPhotos.map((ph, idx) => {
                            if (!ph || typeof ph !== 'string') return null;
                            const url = getPhotoUrl(ph);
                            return (
                              <div key={idx} className="rounded-lg overflow-hidden border-2 border-indigo-200 dark:border-indigo-600 shadow-sm relative group">
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt={`Admin reply ${idx+1}`} className="w-full h-24 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Citizen Reply Photos Display */}
                    {Array.isArray(c.citizenPhotos) && c.citizenPhotos.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                          📤 {t.citizenReplyPhotos}
                          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{c.citizenPhotos.length}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {c.citizenPhotos.map((ph, idx) => {
                            if (!ph || typeof ph !== 'string') return null;
                            const url = getPhotoUrl(ph);
                            return (
                              <div key={idx} className="rounded-lg overflow-hidden border-2 border-amber-200 dark:border-amber-600 shadow-sm relative group">
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt={`My reply ${idx+1}`} className="w-full h-24 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* User uploaded Photo */}
                    {c.photo && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">{t.initialPhoto} <span className="text-[10px] text-gray-400">(click to open)</span></p>
                        <a href={getPhotoUrl(c.photo)} target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105 border rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer">
                          <img src={getPhotoUrl(c.photo)}
                            alt="complaint" className="w-32 h-24 object-cover" />
                        </a>
                      </div>
                    )}

                    {/* Citizen Reply UI (Allowed if NOT Resolved/Rejected and photos limit < 5) */}
                    {(c.status === 'Pending' || c.status === 'In Progress') && (c.citizenPhotos?.length || 0) < 5 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.replyMorePhotos}</p>
                          {(c.remarks || (c.adminPhotos?.length > 0)) && (
                            <span className="animate-pulse bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800">
                            {t.replyNeeded}
                          </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          {c.remarks ? t.adminRemarkPrompt : t.replyLimitInfo?.replace('{n}', 5 - (c.citizenPhotos?.length || 0))}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                          <label className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full flex flex-col items-center justify-center min-h-[100px]">
                            {replyFiles[c._id]?.length ? (
                              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                ✅ {t.fileSelected?.replace('{n}', replyFiles[c._id].length)}
                              </span>
                            ) : (
                              <>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  {t.dragDropHint}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {t.fileLimitInfoSmall}
                                </span>
                              </>
                            )}
                            <input type="file" multiple accept="image/*,application/pdf" className="hidden"
                              onChange={e => {
                                const filesArray = Array.from(e.target.files);
                                // Prevent users from bypassing the individual file size limit of 5MB
                                const validFiles = filesArray.filter(f => f.size <= 5 * 1024 * 1024);
                                if (validFiles.length < filesArray.length) {
                                  toast.error('Some files were ignored because they exceed the 5MB limit.');
                                }
                                const selected = validFiles.slice(0, 5 - (c.citizenPhotos?.length || 0));
                                setReplyFiles(prev => ({...prev, [c._id]: selected}));
                              }} />
                          </label>
                          <button onClick={() => handleReplySubmit(c._id)} disabled={replying[c._id] || !replyFiles[c._id]?.length}
                            className="w-full sm:w-auto btn-primary px-4 py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                            {replying[c._id] ? t.sendingReply : t.sendReply}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      {!searched && (
        <div className="card bg-saffron-50 dark:bg-saffron-900/20 border-saffron-200 dark:border-saffron-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <FileText size={18} className="text-saffron-500" /> {user?.role === 'citizen' ? t.complaintGuide : t.statusGuide}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.values(statusConfig).map(cfg => {
              const Icon = cfg.icon;
              return (
                <div key={cfg.label} className="flex items-center gap-2.5">
                  <span className={`${cfg.class} flex items-center gap-1 px-2 py-1`}>
                    <Icon size={12} /> <span className="font-marathi text-sm text-gray-600 dark:text-gray-400">{cfg.mr}</span>
                  </span>
                </div>
              );
            })}
          </div>
          {user?.role === 'citizen' && (
            <div className="mt-4 pt-4 border-t border-saffron-200 dark:border-saffron-800 text-sm text-saffron-800 dark:text-saffron-400">
              <p>📍 {t.automaticSyncNotice?.replace('{n}', user.mobile)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
