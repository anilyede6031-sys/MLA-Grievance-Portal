import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

export default function AdminLogin() {
  const { user, login, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in
  if (user) {
    if (user.role === 'citizen') {
      logout();
      toast.error('You were logged out. This portal is for admin staff only.');
    } else {
      return <Navigate to="/admin" replace />;
    }
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { ...form, type: 'admin' });
      const loggedUser = res.data.user;
      // Block citizens from admin portal
      if (loggedUser.role === 'citizen') {
        toast.error('This portal is for admin staff only.');
        return;
      }
      login(loggedUser, res.data.token);
      toast.success(`Welcome, ${loggedUser.name}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gov-navy rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={30} className="text-saffron-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-gov-navy dark:text-white uppercase tracking-tight">{t.adminLogin}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.authPersonnelOnly}</p>
          <p className="font-marathi text-xs text-gray-400 mt-1">{t.marathiAuthSub}</p>
        </div>

        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl transition-all">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t.mobile}</label>
              <input value={form.mobile} onChange={e => setForm(f => ({...f, mobile: e.target.value}))}
                className="input-field" placeholder={t.mobilePlaceholder} required />
            </div>
            <div>
              <label className="label">{t.password}</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="input-field pr-10" placeholder="Enter password" required />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-4 text-base font-bold shadow-green-200 disabled:opacity-60 transition-all hover:scale-[1.02]">
              {loading ? <><Loader2 size={18} className="animate-spin" /> {t.loggingIn}</> : <><LogIn size={18} /> {t.login}</>}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              🔐 Secured by JWT. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
