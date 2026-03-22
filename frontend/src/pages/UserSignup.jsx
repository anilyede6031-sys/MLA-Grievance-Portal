import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

const TALUKAS = ['Pune', 'Haveli', 'Khed', 'Baramati', 'Junnar', 'Shirur', 'Indapur', 'Daund', 'Mawal', 'Ambegaon', 'Purandhar', 'Bhor', 'Mulshi', 'Velhe'];

export default function UserSignup() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', mobile: '', password: '', taluka: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/citizen-register', form);
      login(res.data.user, res.data.token);
      toast.success('Registration successful!');
      navigate('/complaint');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      const data = err.response?.data;
      const errMessage = data?.errors?.[0]?.msg
        || data?.message
        || (err.message === 'Network Error' ? 'Cannot connect to server. Please try again.' : 'Registration failed.');
      toast.error(errMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UserPlus size={30} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gov-navy dark:text-white uppercase tracking-tight">{t.citizenRegistration}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.createAccountSub}</p>
        </div>

        <div className="bg-white/95 dark:bg-gray-900/98 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="label">{t.fullName}</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="input-field" placeholder={t.fullNamePlaceholder} required />
            </div>
            <div className="space-y-2">
              <label className="label">{t.mobile}</label>
              <input type="tel" value={form.mobile} onChange={e => setForm(f => ({...f, mobile: e.target.value}))}
                className="input-field" placeholder={t.mobilePlaceholder || "10-digit mobile number"} maxLength={10} required />
            </div>
            <div className="space-y-2">
              <label className="label">{t.selectTalukaOptional}</label>
              <select value={form.taluka} onChange={e => setForm(f => ({...f, taluka: e.target.value}))} className="input-field">
                <option value="">{t.selectTaluka}</option>
                {TALUKAS.map(tl => <option key={tl} value={tl}>{tl}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="label">{t.password}</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="input-field pr-10" placeholder={t.minSixChars} required minLength="6" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-4 text-base font-bold shadow-green-200 disabled:opacity-60 transition-all hover:scale-[1.02]">
              {loading ? <><Loader2 size={18} className="animate-spin" /> {t.registering}</> : <><UserPlus size={18} /> {t.register}</>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 font-medium">{t.alreadyHaveAccount}</p>
            <Link to="/login" className="text-gov-green dark:text-saffron-400 font-bold hover:underline mt-2 inline-block text-lg transition-colors">{t.loginHere}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
