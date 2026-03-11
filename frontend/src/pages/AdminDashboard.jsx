import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BarChart2, Users, LogOut, ChevronDown,
  CheckCircle, Clock, TrendingUp, XCircle, Download, RefreshCw,
  Search, Filter, Eye, MessageSquare, AlertTriangle, Loader2, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

const TALUKAS = ['','Pune', 'Haveli', 'Khed', 'Baramati', 'Junnar', 'Shirur', 'Indapur', 'Daund', 'Mawal', 'Ambegaon', 'Purandhar', 'Bhor', 'Mulshi', 'Velhe'];
const DEPARTMENTS = ['','Road','Water','Electricity','Revenue','Police','Health','Education','Agriculture','Other'];
const STATUSES = ['','Pending','In Progress','Resolved','Rejected'];

const statusConfig = {
  Pending:       { class: 'badge-pending',     icon: Clock },
  'In Progress': { class: 'badge-inprogress',  icon: TrendingUp },
  Resolved:      { class: 'badge-resolved',    icon: CheckCircle },
  Rejected:      { class: 'badge-rejected',    icon: XCircle },
};

function StatCard({ label, value, color, loading }) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{loading ? '…' : value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function ComplaintsTable({ complaints, onUpdate, loading }) {
  // eslint-disable-next-line no-unused-vars
  const { t } = useLang();
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [viewing, setViewing] = useState(null);
  const [viewingReplies, setViewingReplies] = useState(null);
  const [adminPhotoFiles, setAdminPhotoFiles] = useState({});

  const handleStatusChange = async (id, field, value) => {
    setEditing(e => ({ ...e, [id]: { ...e[id], [field]: value } }));
  };

  const handleSave = async (id) => {
    const files = adminPhotoFiles[id];
    const ed = editing[id] || {};
    // Nothing actually changed
    if (!files?.length && Object.keys(ed).length === 0) {
      toast.error('No changes to save.');
      return;
    }
    setSaving(s => ({ ...s, [id]: true }));
    try {
      if (files && files.length > 0) {
        const fd = new FormData();
        if (ed.status) fd.append('status', ed.status);
        if (ed.remarks !== undefined) fd.append('remarks', ed.remarks);
        files.forEach(f => fd.append('adminPhotos', f));
        await api.patch(`/complaints/${id}`, fd);
      } else {
        await api.patch(`/complaints/${id}`, ed);
      }
      toast.success('Updated successfully!');
      setEditing(e => { const n = {...e}; delete n[id]; return n; });
      setAdminPhotoFiles(f => { const n = {...f}; delete n[id]; return n; });
      // Refresh parent list; if modal is open for this complaint, close it so stale data isn't shown
      if (viewing?._id === id) setViewing(null);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={32} className="animate-spin text-saffron-500" />
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gov-navy text-white">
            {['ID / Mobile', 'Name', 'Village', 'Taluka', 'Dept', 'Description', 'Date', 'Status', 'Remarks', 'User Photo', 'Reply Photos', 'Actions'].map(h => (
              <th key={h} className="px-2 py-3 text-left font-semibold text-xs whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {complaints.length === 0 && (
            <tr><td colSpan={12} className="text-center py-10 text-gray-400">No complaints found</td></tr>
          )}
          {complaints.map(c => {
            const ed = editing[c._id] || {};
            const cfg = statusConfig[c.status] || statusConfig.Pending;
            const StatusIcon = cfg.icon;
            return (
              <tr key={c._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="font-mono text-xs text-saffron-600 dark:text-saffron-400 font-bold block">{c.complaintId}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">📱 {c.mobile}</span>
                </td>
                <td className="px-2 py-2 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap text-xs">{c.name}</td>
                <td className="px-2 py-2 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{c.village}</td>
                <td className="px-2 py-2 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{c.taluka}</td>
                <td className="px-2 py-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium whitespace-nowrap">
                    {c.department}
                  </span>
                </td>
                <td className="px-2 py-2 text-gray-600 dark:text-gray-400 text-xs max-w-[150px]" title={c.description}>
                  <span className="block truncate max-w-[150px]">{c.description}</span>
                </td>
                <td className="px-2 py-2 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-2 py-2">
                  <select
                    value={ed.status ?? c.status}
                    onChange={e => handleStatusChange(c._id, 'status', e.target.value)}
                    className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-saffron-400">
                    {['Pending','In Progress','Resolved','Rejected'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input type="text"
                    value={ed.remarks ?? c.remarks ?? ''}
                    onChange={e => handleStatusChange(c._id, 'remarks', e.target.value)}
                    className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 w-24 focus:ring-1 focus:ring-saffron-400"
                    placeholder="Remark..." />
                </td>
                <td className="px-2 py-2">
                  {c.photo ? (
                    <a href={c.photo.startsWith('http') ? c.photo : `${api.defaults.baseURL.replace('/api', '')}/${c.photo}`} 
                       target="_blank" rel="noreferrer" 
                       className="text-saffron-500 hover:text-saffron-600 font-semibold text-xs underline inline-flex items-center gap-1 bg-saffron-50 dark:bg-saffron-900/30 px-1.5 py-1 rounded-md whitespace-nowrap">
                      <Eye size={11}/> View
                    </a>
                  ) : <span className="text-gray-400 text-xs italic">—</span>}
                </td>
                <td className="px-2 py-2">
                  {Array.isArray(c.citizenPhotos) && c.citizenPhotos.length > 0 ? (
                    <button
                      onClick={() => setViewingReplies(c)}
                      className="inline-flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-md font-semibold transition-colors whitespace-nowrap"
                    >
                      <MessageSquare size={10} /> {c.citizenPhotos.length} Reply
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs italic">—</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  {editing[c._id] ? (
                    <div className="flex items-center gap-1.5">
                      <label className="flex items-center gap-0.5 cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-1 rounded border border-dashed border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                        title={adminPhotoFiles[c._id]?.map(f=>f.name).join(', ') || 'Select up to 5 photos'}>
                        📎 {adminPhotoFiles[c._id]?.length ? `${adminPhotoFiles[c._id].length} photo(s)` : 'Photos'}
                        <input type="file" accept="image/*,application/pdf" className="hidden" multiple
                          onChange={e => setAdminPhotoFiles(f => ({ ...f, [c._id]: Array.from(e.target.files).slice(0,5) }))} />
                      </label>
                      <button onClick={() => handleSave(c._id)} disabled={saving[c._id]}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded font-semibold transition-colors disabled:opacity-60 whitespace-nowrap flex items-center gap-0.5">
                        {saving[c._id] ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                     <span className={`${cfg.class} flex items-center gap-1 text-xs`}>
                       <StatusIcon size={10} /> {c.status}
                     </span>
                     <button onClick={() => setViewing(c)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 hover:text-saffron-500" title="View Details">
                       <Eye size={15} />
                     </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complaint Details</h3>
                <p className="text-sm text-gray-500 font-mono font-semibold text-saffron-600">{viewing.complaintId}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div><span className="text-gray-500 block mb-0.5">Citizen Name</span><span className="font-semibold text-gray-800 dark:text-gray-200">{viewing.name}</span></div>
                <div><span className="text-gray-500 block mb-0.5">Mobile</span><span className="font-semibold text-gray-800 dark:text-gray-200">{viewing.mobile}</span></div>
                <div><span className="text-gray-500 block mb-0.5">Village</span><span className="font-semibold text-gray-800 dark:text-gray-200">{viewing.village}</span></div>
                <div><span className="text-gray-500 block mb-0.5">Taluka</span><span className="font-semibold text-gray-800 dark:text-gray-200">{viewing.taluka}</span></div>
                <div><span className="text-gray-500 block mb-0.5">Department</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold mt-0.5">
                    {viewing.department}
                  </span>
                </div>
                <div><span className="text-gray-500 block mb-0.5">Date Filed</span><span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(viewing.createdAt).toLocaleString('en-IN')}</span></div>
              </div>
              
              <div>
                <span className="text-gray-700 dark:text-gray-300 font-bold block mb-2 text-sm flex items-center gap-2"><FileText size={16} /> Description</span>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm border border-gray-200 dark:border-gray-700 leading-relaxed max-h-48 overflow-y-auto w-full break-words">
                  {viewing.description}
                </div>
              </div>

              {viewing.photo && (
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-bold block mb-2 text-sm flex items-center gap-2"><Eye size={16} /> Citizen Uploaded Photo</span>
                  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-center p-2">
                    <img src={viewing.photo.startsWith('http') ? viewing.photo : `${api.defaults.baseURL.replace('/api', '')}/${viewing.photo}`} 
                         alt="Complaint attachment" 
                         className="max-h-80 object-contain rounded-lg shadow-sm" />
                  </div>
                </div>
              )}

              {Array.isArray(viewing.adminPhotos) && viewing.adminPhotos.length > 0 && (
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-bold block mb-3 text-sm flex items-center gap-2">
                    📎 Admin Reply Photos
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">{viewing.adminPhotos.length}/5</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {viewing.adminPhotos.map((ph, idx) => {
                      if (!ph || typeof ph !== 'string') return null;
                      const url = ph.startsWith('http') ? ph : `${api.defaults.baseURL.replace('/api', '')}/${ph.replace(/\\/g, '/')}`;
                      return (
                        <div key={idx} className="rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20">
                          <a href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`Admin reply ${idx+1}`}
                                 className="w-full h-40 object-cover hover:opacity-90 transition-opacity" />
                          </a>
                          <div className="flex items-center gap-2 px-2 py-1.5">
                            <span className="text-xs text-indigo-500 font-semibold flex-1">Photo {idx+1}</span>
                            <a href={url} target="_blank" rel="noreferrer"
                               className="text-[10px] text-indigo-500 underline hover:text-indigo-700">🔍 View</a>
                            <a href={url} download
                               className="inline-flex items-center gap-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors">⬇ Save</a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Array.isArray(viewing.citizenPhotos) && viewing.citizenPhotos.length > 0 && (
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-bold block mb-3 text-sm flex items-center gap-2">
                    📤 Citizen Reply Photos
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">{viewing.citizenPhotos.length}/5</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {viewing.citizenPhotos.map((ph, idx) => {
                      if (!ph || typeof ph !== 'string') return null;
                      const url = ph.startsWith('http') ? ph : `${api.defaults.baseURL.replace('/api', '')}/${ph.replace(/\\/g, '/')}`;
                      return (
                        <div key={idx} className="rounded-xl overflow-hidden border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                          <a href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`Citizen reply ${idx+1}`}
                                 className="w-full h-40 object-cover hover:opacity-90 transition-opacity" />
                          </a>
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-gray-800">
                            <span className="text-xs text-amber-600 font-semibold flex-1">Photo {idx+1}</span>
                            <a href={url} target="_blank" rel="noreferrer"
                               className="text-[10px] text-amber-600 underline hover:text-amber-700">🔍 View</a>
                            <a href={url} download
                               className="inline-flex items-center gap-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors">⬇ Save</a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-end">
              <button onClick={() => setViewing(null)} className="btn-secondary px-6">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Reply Photos Modal */}
      {viewingReplies && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setViewingReplies(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">📤 Citizen Reply Photos</h3>
                <p className="text-sm font-mono font-semibold text-amber-600 mt-0.5">{viewingReplies.complaintId}</p>
                <p className="text-sm text-gray-400 mt-0.5">📱 {viewingReplies.mobile} &nbsp;&bull;&nbsp; {viewingReplies.name}</p>
              </div>
              <button onClick={() => setViewingReplies(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {viewingReplies.citizenPhotos.map((ph, idx) => {
                if (!ph || typeof ph !== 'string') return null;
                const url = ph.startsWith('http') ? ph : `${api.defaults.baseURL.replace('/api', '')}/${ph.replace(/\\/g, '/')}`;
                return (
                  <div key={idx} className="rounded-xl overflow-hidden border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 shadow-sm">
                    <a href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`Citizen reply ${idx + 1}`} className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                    </a>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800">
                      <span className="text-xs text-amber-600 font-bold flex-1">Photo {idx + 1}</span>
                      <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-amber-600 underline hover:text-amber-700">🔍 View</a>
                      <a href={url} download className="inline-flex items-center gap-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors">⬇ Save</a>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setViewingReplies(null)} className="btn-secondary px-6">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingComp, setLoadingComp] = useState(true);
  const [filters, setFilters] = useState({ taluka: '', department: '', status: '', mobile: '', page: 1 });

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try { const r = await api.get('/complaints/stats'); setStats(r.data); }
    catch { toast.error('Failed to load stats'); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setLoadingComp(true);
    try {
      const params = { ...filters };
      if (!params.taluka) delete params.taluka;
      if (!params.department) delete params.department;
      if (!params.status) delete params.status;
      if (!params.mobile) delete params.mobile;
      const r = await api.get('/complaints', { params });
      setComplaints(r.data.complaints);
      setTotal(r.data.total);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoadingComp(false); }
  }, [filters]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === 'complaints') fetchComplaints(); }, [tab, fetchComplaints]);

  const handleExport = async () => {
    try {
      const params = {};
      if (filters.taluka) params.taluka = filters.taluka;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;
      if (filters.mobile) params.mobile = filters.mobile;
      const r = await api.get('/complaints/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'complaints.csv'; a.click();
      toast.success('CSV exported!');
    } catch { toast.error('Export failed.'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { key: 'complaints', icon: FileText, label: t.manageComplaints },
    { key: 'analytics', icon: BarChart2, label: t.analytics },
    ...(user?.role === 'super_admin' ? [{ key: 'users', icon: Users, label: t.users }] : []),
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gov-navy text-white flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-saffron-400">{user?.name}</p>
          <p className="text-xs text-blue-300 mt-0.5">{t.roles?.[user?.role] || user?.role}</p>
          {user?.taluka && <p className="text-xs text-blue-400 mt-0.5">📍 {user.taluka}</p>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === item.key ? 'bg-saffron-500 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={17} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors">
            <LogOut size={17} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
        {/* Mobile tab bar */}
        <div className="md:hidden flex gap-1 p-2 bg-gov-navy overflow-x-auto">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === item.key ? 'bg-saffron-500 text-white' : 'text-blue-200'}`}>
              <item.icon size={13} /> {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* ============ DASHBOARD ============ */}
          {tab === 'dashboard' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gov-navy dark:text-white">{t.dashboard}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Overview of all grievances</p>
                </div>
                <button onClick={fetchStats} className="btn-outline py-2 px-4 text-sm">
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>

              {/* === Top KPI Header (Navy Container) === */}
              <div className="bg-[#0b2447] dark:bg-gray-900 rounded-xl p-4 md:p-5 mb-6 text-white shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
                  <div className="bg-white/5 dark:bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-2xl md:text-3xl font-serif font-bold text-saffron-500 mb-1.5">{stats?.stats?.total?.toLocaleString('en-IN') || 0}</p>
                    <p className="text-[11px] font-bold tracking-widest text-gray-300 uppercase">Total Complaints</p>
                  </div>
                  <div className="bg-white/5 dark:bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-2xl md:text-3xl font-serif font-bold text-saffron-500 mb-1.5">{stats?.stats?.resolved?.toLocaleString('en-IN') || 0}</p>
                    <p className="text-[11px] font-bold tracking-widest text-gray-300 uppercase">Resolved</p>
                  </div>
                  <div className="bg-white/5 dark:bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-2xl md:text-3xl font-serif font-bold text-saffron-500 mb-1.5">{stats?.stats?.inProgress?.toLocaleString('en-IN') || 0}</p>
                    <p className="text-[11px] font-bold tracking-widest text-gray-300 uppercase">In Progress</p>
                  </div>
                  <div className="bg-white/5 dark:bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-2xl md:text-3xl font-serif font-bold text-saffron-500 mb-1.5">
                      {Math.round((stats?.stats?.resolved / (stats?.stats?.total || 1)) * 100) || 0}%
                    </p>
                    <p className="text-[11px] font-bold tracking-widest text-gray-300 uppercase">Resolution %</p>
                  </div>
                </div>
              </div>

              {/* === Departments Grid === */}
              {stats?.byDepartment?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-serif font-bold text-gov-navy dark:text-white mb-4">Departments</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.byDepartment.map(d => {
                      let icon = '📁';
                      let colorClass = 'border-gray-400';
                      let displayName = d._id;
                      
                      if (d._id === 'Water') { icon = '💧'; colorClass = 'border-blue-400'; displayName = 'Water'; }
                      else if (d._id === 'Road') { icon = '🛣️'; colorClass = 'border-gov-navy'; displayName = 'Roads'; }
                      else if (d._id === 'Health') { icon = '🏥'; colorClass = 'border-green-500'; displayName = 'Health'; }
                      else if (d._id === 'Agriculture') { icon = '🌾'; colorClass = 'border-yellow-500'; }
                      else if (d._id === 'Electricity') { icon = '⚡'; colorClass = 'border-purple-500'; }
                      else if (d._id === 'Education') { icon = '📚'; colorClass = 'border-red-500'; }
                      else if (d._id === 'Police') { icon = '👮'; colorClass = 'border-indigo-500'; }
                      else if (d._id === 'Revenue') { icon = '📋'; colorClass = 'border-saffron-500'; }

                      return (
                        <div key={d._id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-t-[3px] ${colorClass} p-4 text-center hover:shadow-md transition-shadow group flex flex-col items-center justify-center`}>
                          <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform">{icon}</div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-[13px] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full">{displayName}</h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">{d.count} complaints</p>
                          <span className="inline-block bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {d.pending || 0} pending
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick action */}
              <div className="card bg-saffron-50 dark:bg-saffron-900/20 border-saffron-200 dark:border-saffron-800">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">⚡ Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setTab('complaints')} className="btn-primary text-sm py-2">View All Complaints</button>
                  {['super_admin', 'taluka_coordinator'].includes(user?.role) && (
                    <button onClick={handleExport} className="btn-outline text-sm py-2"><Download size={14} /> Export Data</button>
                  )}
                  <button onClick={() => setTab('analytics')} className="btn-secondary text-sm py-2"><BarChart2 size={14} /> Analytics</button>
                </div>
              </div>
            </div>
          )}

          {/* ============ COMPLAINTS ============ */}
          {tab === 'complaints' && (
            <div className="animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-gov-navy dark:text-white">{t.manageComplaints}</h1>
                  <p className="text-gray-500 text-sm">{total} total complaints</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={fetchComplaints} className="btn-outline py-2 px-3 text-sm"><RefreshCw size={14} /></button>
                  {['super_admin', 'taluka_coordinator'].includes(user?.role) && (
                    <button onClick={handleExport} className="btn-primary text-sm py-2"><Download size={14} /> {t.exportCSV}</button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="card mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <select value={filters.taluka} onChange={e => setFilters(f => ({...f, taluka: e.target.value, page: 1}))}
                    className="input-field text-sm py-2">
                    {TALUKAS.map(t => <option key={t} value={t}>{t || 'All Talukas'}</option>)}
                  </select>
                  <select value={filters.department} onChange={e => setFilters(f => ({...f, department: e.target.value, page: 1}))}
                    className="input-field text-sm py-2">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d || 'All Departments'}</option>)}
                  </select>
                  <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value, page: 1}))}
                    className="input-field text-sm py-2">
                    {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
                  </select>
                  <div className="relative">
                    <input type="text" value={filters.mobile} onChange={e => setFilters(f => ({...f, mobile: e.target.value, page: 1}))}
                      placeholder="Search Mobile..." className="input-field text-sm py-2 pr-8" />
                    <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <button onClick={fetchComplaints} className="btn-secondary text-sm py-2">
                    <Filter size={14} /> Apply
                  </button>
                </div>
              </div>

              <ComplaintsTable
                complaints={complaints}
                onUpdate={() => { fetchComplaints(); fetchStats(); }}
                role={user?.role}
                loading={loadingComp}
              />

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">Page {filters.page} · {total} total</p>
                <div className="flex gap-2">
                  <button disabled={filters.page <= 1}
                    onClick={() => setFilters(f => ({...f, page: f.page - 1}))}
                    className="btn-outline text-sm py-1.5 px-3 disabled:opacity-40">← Prev</button>
                  <button disabled={filters.page * 20 >= total}
                    onClick={() => setFilters(f => ({...f, page: f.page + 1}))}
                    className="btn-outline text-sm py-1.5 px-3 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </div>
          )}

          {/* ============ ANALYTICS ============ */}
          {tab === 'analytics' && <AnalyticsTab stats={stats} loadingStats={loadingStats} />}

          {/* ============ USERS ============ */}
          {tab === 'users' && user?.role === 'super_admin' && <UsersTab />}

          {/* ============ SETTINGS ============ */}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab({ stats, loadingStats }) {
  if (loadingStats) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-saffron-500" /></div>;
  if (!stats) return <div className="text-center py-20 text-gray-400">No data available</div>;

  const maxByDept = Math.max(...(stats.byDepartment?.map(d => d.count) || [1]));
  const maxByTaluka = Math.max(...(stats.byTaluka?.map(d => d.count) || [1]));
  const maxMonthly = Math.max(...(stats.monthly?.map(d => d.count) || [1]));
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gov-navy dark:text-white">Analytics Dashboard</h1>
        <p className="text-gray-500 text-sm">Visual insights into grievance data</p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Resolution Rate', value: `${stats.stats.total ? Math.round((stats.stats.resolved / stats.stats.total) * 100) : 0}%`, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Pending Rate', value: `${stats.stats.total ? Math.round((stats.stats.pending / stats.stats.total) * 100) : 0}%`, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
          { label: 'Rejected', value: stats.stats.rejected, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        ].map(p => (
          <div key={p.label} className={`px-4 py-2 rounded-full font-semibold text-sm ${p.color}`}>
            {p.label}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Department Bar Chart */}
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">📊 Complaints by Department</h3>
          <div className="space-y-3">
            {stats.byDepartment?.map(d => (
              <div key={d._id}>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{d._id}</span><span className="font-bold">{d.count}</span>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-saffron-400 to-saffron-600 rounded-full transition-all duration-700"
                    style={{ width: `${(d.count / maxByDept) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Taluka Bar Chart */}
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">🗺️ Complaints by Taluka</h3>
          <div className="space-y-3">
            {stats.byTaluka?.map(d => (
              <div key={d._id}>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{d._id}</span><span className="font-bold">{d.count}</span>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
                    style={{ width: `${(d.count / maxByTaluka) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {stats.monthly?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">📈 Monthly Complaint Trend</h3>
          <div className="flex items-end gap-3 h-40">
            {stats.monthly.map(m => (
              <div key={`${m._id.year}-${m._id.month}`} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gov-navy dark:text-saffron-400">{m.count}</span>
                <div className="w-full bg-gradient-to-t from-gov-navy to-blue-500 rounded-t-md transition-all duration-700"
                  style={{ height: `${(m.count / maxMonthly) * 112}px`, minHeight: '4px' }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{months[m._id.month]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name:'', mobile:'', password:'', role:'data_entry_operator', taluka:'' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try { const r = await api.get('/auth/users'); setUsers(r.data.users); }
    catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User created!');
      setForm({ name:'', mobile:'', password:'', role:'data_entry_operator', taluka:'' });
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-extrabold text-gov-navy dark:text-white">{t.users}</h1>

      {/* Create user */}
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Create New User</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><label className="label">Name</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="input-field text-sm" placeholder="Full name" required /></div>
          <div><label className="label">Mobile</label><input type="tel" value={form.mobile} onChange={e => setForm(f=>({...f,mobile:e.target.value}))} className="input-field text-sm" placeholder="10-digit mobile" maxLength={10} required /></div>
          <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className="input-field text-sm" placeholder="Min 6 chars" required /></div>
          <div><label className="label">Role</label>
            <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} className="input-field text-sm">
              <option value="data_entry_operator">Data Entry Operator</option>
              <option value="taluka_coordinator">Taluka Coordinator</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div><label className="label">Taluka (optional)</label>
            <select value={form.taluka} onChange={e => setForm(f=>({...f,taluka:e.target.value}))} className="input-field text-sm">
              <option value="">— Select —</option>
              {['Pune', 'Haveli', 'Khed', 'Baramati', 'Junnar', 'Shirur', 'Indapur', 'Daund', 'Mawal', 'Ambegaon', 'Purandhar', 'Bhor', 'Mulshi', 'Velhe'].map(tl => <option key={tl}>{tl}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center text-sm py-2.5 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : '+' } Create User
            </button>
          </div>
        </form>
      </div>

      {/* Users table */}
      <div className="card overflow-x-auto">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">All Users ({users.length})</h3>
        {loading ? <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-saffron-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              {['Name','Mobile','Role','Taluka','Status','Created'].map(h => <th key={h} className="pb-2 text-xs text-gray-500 font-semibold pr-4">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="py-2.5 pr-4 font-semibold text-gray-800 dark:text-gray-200">{u.name}</td>
                  <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{u.mobile}</td>
                  <td className="py-2.5 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : u.role === 'taluka_coordinator' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{u.role.replace(/_/g,' ')}</span></td>
                  <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">{u.taluka || '—'}</td>
                  <td className="py-2.5 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-2.5 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SettingsTab() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', password: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleUpdate = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', form);
      // Update local storage with new user data but same token
      login({ ...user, name: res.data.user.name }, localStorage.getItem('token'));
      toast.success('Profile updated successfully!');
      setForm({ name: res.data.user.name, password: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-lg">
      <h1 className="text-2xl font-extrabold text-gov-navy dark:text-white">Account Settings</h1>
      
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Update Profile Details</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="input-field max-w-sm" placeholder="Your name" required />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Change Password (Optional)</h4>
            <div className="space-y-3">
              <div>
                <label className="label">Current Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="input-field max-w-sm" placeholder="Leave blank to keep unchanged" />
              </div>
              {form.password && (
                <div>
                  <label className="label">New Password</label>
                  <input type="password" value={form.newPassword} onChange={e => setForm(f => ({...f, newPassword: e.target.value}))}
                    className="input-field max-w-sm" placeholder="Min 6 characters" required={!!form.password} minLength="6" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6 disabled:opacity-60 flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />} 
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
