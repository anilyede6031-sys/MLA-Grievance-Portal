import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, Copy, X, Loader2, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TALUKAS = ['Pune', 'Haveli', 'Khed', 'Baramati', 'Junnar', 'Shirur', 'Indapur', 'Daund', 'Mawal', 'Ambegaon', 'Purandhar', 'Bhor', 'Mulshi', 'Velhe'];
const DEPARTMENTS = ['Road','Water','Electricity','Revenue','Police','Health','Education','Agriculture','Other'];

export default function ComplaintForm() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', mobile: user?.mobile || '', village:'', taluka:'', department:'', description:'' });
  const mobileReadOnly = !!(user?.role === 'citizen' && user?.mobile);
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const onDrop = useCallback(files => {
    if (files[0]) setPhoto(files[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [], 'application/pdf': ['.pdf'] }, maxSize: 15 * 1024 * 1024, maxFiles: 1
  });

  // Revoke object URL to prevent memory leaks
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t.required || 'Required';
    if (!form.mobile.match(/^[6-9]\d{9}$/)) errs.mobile = t.mobilePlaceholder || 'Enter valid 10-digit mobile number';
    if (!form.village.trim()) errs.village = t.required || 'Required';
    if (!form.taluka) errs.taluka = t.required || 'Required';
    if (!form.department) errs.department = t.required || 'Required';
    if (!form.description.trim()) errs.description = t.required || 'Description is required';
    else if (form.description.length > 500) errs.description = t.descriptionPlaceholder || 'Description cannot exceed 500 characters';
    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (photo) data.append('photo', photo);

    try {
      const res = await api.post('/complaints', data);
      setSuccess(res.data);
      toast.success(t.successSubmit);
    } catch (err) {
      const msg = err.response?.data?.message || t.updateError || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(success.complaintId);
    toast.success(t.copySuccess || 'Complaint ID copied!');
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-slide-up">
        <div className="card text-center border-2 border-green-200 dark:border-green-800">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">{t.successSubmit}</h2>
          <p className="font-marathi text-green-700 dark:text-green-400 mb-6">{t.successSubmitSub || 'आपली तक्रार यशस्वीरित्या नोंदवली गेली.'}</p>

          <div className="bg-saffron-50 dark:bg-saffron-900/20 border border-saffron-200 dark:border-saffron-700 rounded-xl p-5 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t.complaintId}</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-2xl font-mono font-extrabold text-saffron-600 dark:text-saffron-400">{success.complaintId}</p>
              <button onClick={copyId} className="p-1.5 hover:bg-saffron-100 rounded-lg transition-colors">
                <Copy size={16} className="text-saffron-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">⚠️ {t.searchHint || 'Please save this ID to track your complaint'}</p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-semibold mb-6">
            <AlertTriangle size={14} /> {t.status}: {t.pending}
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/track')} className="btn-secondary">{t.trackComplaint}</button>
            <button onClick={() => { setSuccess(null); setForm({ name:'', mobile: user?.mobile || '', village:'', taluka:'', department:'', description:'' }); setPhoto(null); }}
              className="btn-outline">{t.fileComplaint}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-slide-up">
        <div className="card text-center border-2 border-saffron-200 dark:border-saffron-800">
          <div className="w-16 h-16 bg-saffron-100 dark:bg-saffron-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-saffron-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{t.loginRequired}</h2>
          <p className="font-marathi text-gray-600 dark:text-gray-400 mb-6">
            {t.loginRequiredSub}
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary font-bold w-full max-w-xs mx-auto justify-center">
            {t.goToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
          📝 {t.fileComplaint}
        </div>
        <h1 className="text-3xl font-extrabold text-gov-navy dark:text-white mb-1">{t.submitComplaintTitle}</h1>
        <p className="font-marathi text-gray-500 dark:text-gray-400">{t.submitComplaintSub}</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Row: Name + Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.name} *</label>
            <input name="name" value={form.name} onChange={handleChange}
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              placeholder={t.namePlaceholder} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">{t.mobile} *</label>
            <div className="relative">
              <input name="mobile" value={form.mobile} onChange={mobileReadOnly ? undefined : handleChange}
                maxLength={10} readOnly={mobileReadOnly}
                className={`input-field ${errors.mobile ? 'border-red-400' : ''} ${mobileReadOnly ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 cursor-not-allowed pr-28' : ''}`}
                placeholder={t.mobilePlaceholder} />
              {mobileReadOnly && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                  <Lock size={10} /> {t.verified || 'Verified'}
                </span>
              )}
            </div>
            {mobileReadOnly && <p className="text-xs text-green-600 dark:text-green-400 mt-1">🔒 {t.mobileLocked}</p>}
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
          </div>
        </div>

        {/* Row: Village + Taluka */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.village} *</label>
            <input name="village" value={form.village} onChange={handleChange}
              className={`input-field ${errors.village ? 'border-red-400' : ''}`}
              placeholder={t.villagePlaceholder} />
            {errors.village && <p className="text-red-500 text-xs mt-1">{errors.village}</p>}
          </div>
          <div>
            <label className="label">{t.taluka} *</label>
            <select name="taluka" value={form.taluka} onChange={handleChange}
              className={`input-field ${errors.taluka ? 'border-red-400' : ''}`}>
              <option value="">— {t.selectTaluka} —</option>
              {TALUKAS.map(tl => <option key={tl} value={tl}>{tl}</option>)}
            </select>
            {errors.taluka && <p className="text-red-500 text-xs mt-1">{errors.taluka}</p>}
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="label">{t.department} *</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {DEPARTMENTS.map(dep => (
              <button type="button" key={dep} onClick={() => { setForm(f => ({ ...f, department: dep })); if (errors.department) setErrors(er => ({...er, department: null})); }}
                className={`py-2 px-1 text-xs rounded-lg border-2 font-semibold transition-all ${form.department === dep ? 'border-saffron-500 bg-saffron-50 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-saffron-300'}`}>
                {{Road:'🛣️',Water:'💧',Electricity:'⚡',Revenue:'📋',Police:'👮',Health:'🏥',Education:'🎓',Agriculture:'🌾',Other:'📁'}[dep]} {dep}
              </button>
            ))}
          </div>
          {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label">{t.description} * <span className="text-gray-400 text-xs">(max 500 chars)</span></label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4}
            className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
            placeholder={t.descriptionPlaceholder} />
          <div className="flex justify-between mt-1">
            {errors.description ? <p className="text-red-500 text-xs">{errors.description}</p> : <span />}
            <p className={`text-xs ${form.description.length > 500 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{form.description.length} / 500</p>
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="label">{t.photo} <span className="text-gray-400 text-xs">({t.optional || 'Optional'})</span></label>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-saffron-400 bg-saffron-50 dark:bg-saffron-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-saffron-300'}`}>
            <input {...getInputProps()} />
            {photo ? (
              <div className="flex items-center justify-center gap-3">
                <img src={URL.createObjectURL(photo)} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
                <div className="text-left">
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{photo.name}</p>
                  <p className="text-gray-400 text-xs">{(photo.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setPhoto(null); }}
                  className="ml-auto p-1 hover:bg-red-50 rounded-lg">
                  <X size={16} className="text-red-400" />
                </button>
              </div>
            ) : (
              <div>
                <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.dragDropHint}</p>
                <p className="text-xs text-gray-400 mt-1">{t.fileLimitInfo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? <><Loader2 size={18} className="animate-spin" /> {t.submitting}</> : <><CheckCircle size={18} /> {t.submit}</>}
        </button>

        <p className="text-center text-xs text-gray-400">
          {t.genuineComplaintWarning}
        </p>
      </form>
    </div>
  );
}
