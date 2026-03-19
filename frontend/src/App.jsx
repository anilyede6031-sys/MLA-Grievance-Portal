import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ComplaintForm from './pages/ComplaintForm';
import TrackPage from './pages/TrackPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import EmergencyContacts from './pages/EmergencyContacts';
import AIAssistant from './pages/AIAssistant';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const handleDarkMode = (val) => {
    setDarkMode(val);
    localStorage.setItem('darkMode', val);
  };

  return (
    <AuthProvider>
      <LangProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#f9fafb' : '#111827', border: '1px solid #e5e7eb', fontSize: '14px' },
            }}
          />
          <Routes>
            {/* Public routes with Layout */}
            <Route path="/" element={<Layout darkMode={darkMode} setDarkMode={handleDarkMode}><HomePage /></Layout>} />
            <Route path="/complaint" element={<Layout darkMode={darkMode} setDarkMode={handleDarkMode}><ComplaintForm /></Layout>} />
            <Route path="/track" element={<Layout darkMode={darkMode} setDarkMode={handleDarkMode}><TrackPage /></Layout>} />
            <Route path="/admin/login" element={<Layout darkMode={darkMode} setDarkMode={handleDarkMode}><AdminLogin /></Layout>} />
            <Route path="/login" element={<Layout darkMode={darkMode} setDarkMode={handleDarkMode}><UserLogin /></Layout>} />
            <Route path="/signup" element={<Layout darkMode={darkMode} setDarkMode={handleDarkMode}><UserSignup /></Layout>} />
            <Route path="/emergency" element={<EmergencyContacts />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />

            {/* Admin - protected */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['super_admin', 'taluka_coordinator', 'data_entry_operator']}>
                <Layout darkMode={darkMode} setDarkMode={handleDarkMode}>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={
              <Layout darkMode={darkMode} setDarkMode={handleDarkMode}>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <p className="text-8xl font-extrabold text-saffron-400 mb-4">404</p>
                  <h1 className="text-2xl font-bold text-gov-navy dark:text-white mb-2">Page Not Found</h1>
                  <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                  <Link to="/" className="btn-primary">Go Home</Link>
                </div>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  );
}
