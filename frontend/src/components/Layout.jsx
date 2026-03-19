import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, MessageCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import HelpWidget from './HelpWidget';

function Navbar({ darkMode, setDarkMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { t, toggle: toggleLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { to: '/', label: t.home },
    { to: '/live-map', label: t.liveMapTitle }
  ];
  if (!user || user.role === 'citizen') {
    navLinks.push({ to: '/complaint', label: t.fileComplaint });
    navLinks.push({ to: '/track', label: user ? 'My Complaints' : t.trackComplaint });
  } else {
    navLinks.push({ to: '/track', label: t.trackComplaint });
  }

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => { logout(); navigate('/'); };
  const whatsappNum = import.meta.env.VITE_WHATSAPP || '919373414102';

  return (
    <>
      {/* Tricolor bar */}
      <div className="h-1.5 tricolor-stripe w-full" />

      <nav className={`sticky top-0 z-50 bg-white dark:bg-gray-900 transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'border-b border-gray-100 dark:border-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇮🇳</span>
                  <div>
                    <p className="text-sm font-bold text-gov-navy dark:text-saffron-400 leading-tight">{t.mlaName}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{t.constituency}</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive(link.to) ? 'text-saffron-600 bg-saffron-50 dark:bg-saffron-900/20 dark:text-saffron-400' : 'text-gray-700 dark:text-gray-300 hover:text-saffron-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2">
              <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors">
                <MessageCircle size={14} /> {t.whatsapp}
              </a>
              <button onClick={toggleLang}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Globe size={13} /> {t.language}
              </button>
              <button onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium capitalize">{user.name}</span>
                  {user.role !== 'citizen' && (
                    <Link to="/admin" title={t.dashboard} className="p-2 text-gray-500 hover:text-gov-navy hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                      <span className="text-xs font-bold">Admin</span>
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 font-semibold">{t.logout}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-saffron-600 transition-colors">Login</Link>
                  <Link to="/signup" className="btn-primary text-sm py-1.5 px-4 hidden sm:block">Sign Up</Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-400">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-fade-in">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${isActive(link.to) ? 'bg-saffron-50 text-saffron-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={toggleLang} className="flex-1 text-center py-2 border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                  <Globe size={14} className="inline mr-1" />{t.language}
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 border rounded-lg border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
              <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noreferrer"
                className="flex justify-center items-center gap-2 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold">
                <MessageCircle size={15} /> {t.whatsapp}
              </a>
              {user ? (
                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full py-2 text-center text-sm text-red-500 font-semibold">{t.logout}</button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-center w-full py-2 border rounded-lg text-sm font-medium">Login</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="block text-center btn-primary w-full justify-center">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default function Layout({ children, darkMode, setDarkMode }) {
  const { user } = useAuth();
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col relative text-gray-950 dark:text-gray-50">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 animate-fade-in">{children}</main>
        <HelpWidget />
        <footer className="bg-gov-navy text-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🇮🇳</span>
                  <div>
                    <p className="font-bold text-saffron-400">MLA Rahul Subhash Kul</p>
                    <p className="text-xs text-gray-400">Daund, Maharashtra</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Committed to resolving public grievances swiftly and transparently.</p>
              </div>
              <div>
                <h4 className="font-semibold text-saffron-400 mb-3">Quick Links</h4>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/live-map" className="hover:text-white transition-colors">{t.liveMapTitle}</Link></li>
                  <li><Link to="/complaint" className="hover:text-white transition-colors">File Complaint</Link></li>
                  <li><Link to="/track" className="hover:text-white transition-colors">{user?.role === 'citizen' ? 'My Complaints' : 'Track Complaint'}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-saffron-400 mb-3">Contact</h4>
                <p className="text-gray-400 text-sm">Maharashtra Legislative Assembly</p>
                <p className="text-gray-400 text-sm">Daund Assembly</p>
                <p className="text-gray-400 text-sm mt-2">This is an official portal of MLA Rahul Subhash Kul office.</p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-6 pt-4 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} MLA Rahul Subhash Kul. Government of Maharashtra. All Rights Reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
