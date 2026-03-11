/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const LangContext = createContext(null);

export const translations = {
  en: {
    siteName: 'MLA Public Grievance Portal',
    mlaName: 'MLA Rahul Subhash Kool',
    constituency: 'Daund, Maharashtra',
    welcome: 'Welcome to the MLA Grievance Redressal Portal',
    welcomeSub: 'Your voice matters. Submit your complaints and track their resolution.',
    fileComplaint: 'File a Complaint',
    trackComplaint: 'Track Complaint',
    home: 'Home', complaints: 'Complaints',
    track: 'Track', admin: 'Admin',
    totalComplaints: 'Total Complaints', pending: 'Pending',
    inProgress: 'In Progress', resolved: 'Resolved',
    name: 'Full Name', mobile: 'Mobile Number', village: 'Village',
    taluka: 'Taluka', department: 'Department', description: 'Complaint Description',
    photo: 'Upload Photo (Optional)', submit: 'Submit Complaint',
    complaintId: 'Complaint ID', status: 'Status', remarks: 'Admin Remarks',
    date: 'Date', actions: 'Actions', search: 'Search',
    filterTaluka: 'Filter by Taluka', filterDept: 'Filter by Department',
    exportCSV: 'Export CSV', adminLogin: 'Admin Login',
    password: 'Password', login: 'Login', logout: 'Logout',
    dashboard: 'Dashboard', manageComplaints: 'Manage Complaints',
    settings: 'Settings',
    statsOverview: 'Overview of all grievances',
    totalComplaintsLabel: 'Total Complaints',
    resolvedLabel: 'Resolved',
    inProgressLabel: 'In Progress',
    resolutionRate: 'Resolution %',
    departmentsTitle: 'Departments',
    pendingLabel: 'pending',
    quickActions: 'Quick Actions',
    viewAllComplaints: 'View All Complaints',
    exportData: 'Export Data',
    analyticsTitle: 'Analytics Dashboard',
    resolutionInsights: 'Visual insights into grievance data',
    complaintsByDept: 'Complaints by Department',
    complaintsByTaluka: 'Complaints by Taluka',
    monthlyTrend: 'Monthly Complaint Trend',
    createUserInfo: 'Create New User',
    profileUpdate: 'Update Profile',
    successProfileUpdate: 'Profile updated successfully!',
    whatsapp: 'WhatsApp Us',
    darkMode: 'Dark Mode',
    language: 'मराठी',
  },
  mr: {
    siteName: 'आमदार सार्वजनिक तक्रार निवारण पोर्टल',
    mlaName: 'आमदार राहुल सुभाष कुल',
    constituency: 'दौंड, महाराष्ट्र',
    welcome: 'आमदार तक्रार निवारण पोर्टलमध्ये आपले स्वागत आहे',
    welcomeSub: 'आपला आवाज महत्त्वाचा आहे. आपल्या तक्रारी सादर करा आणि त्यांचे निराकरण ट्रॅक करा.',
    fileComplaint: 'तक्रार नोंदवा',
    trackComplaint: 'तक्रार ट्रॅक करा',
    home: 'मुख्यपृष्ठ', complaints: 'तक्रारी',
    track: 'ट्रॅक', admin: 'प्रशासक',
    totalComplaints: 'एकूण तक्रारी', pending: 'प्रलंबित',
    inProgress: 'प्रक्रियेत', resolved: 'निराकृत',
    name: 'पूर्ण नाव', mobile: 'मोबाइल नंबर', village: 'गाव',
    taluka: 'तालुका', department: 'विभाग', description: 'तक्रार तपशील',
    photo: 'फोटो अपलोड करा (पर्यायी)', submit: 'तक्रार सादर करा',
    complaintId: 'तक्रार क्रमांक', status: 'स्थिती', remarks: 'प्रशासक टिप्पणी',
    date: 'तारीख', actions: 'कृती', search: 'शोधा',
    filterTaluka: 'तालुकानुसार फिल्टर', filterDept: 'विभागानुसार फिल्टर',
    exportCSV: 'CSV निर्यात', adminLogin: 'प्रशासक लॉगिन',
    password: 'पासवर्ड', login: 'लॉगिन', logout: 'लॉगआउट',
    dashboard: 'डॅशबोर्ड', manageComplaints: 'तक्रारी व्यवस्थापन',
    analytics: 'विश्लेषण', users: 'वापरकर्ते व्यवस्थापन',
    settings: 'सेटिंग्ज',
    statsOverview: 'तक्रारींचा आढावा',
    totalComplaintsLabel: 'एकूण तक्रारी',
    resolvedLabel: 'निराकृत',
    inProgressLabel: 'प्रक्रियेत',
    resolutionRate: 'निराकरण दर',
    departmentsTitle: 'विभाग',
    pendingLabel: 'प्रलंबित',
    quickActions: 'त्वरित कृती',
    viewAllComplaints: 'सर्व तक्रारी पहा',
    exportData: 'डेटा निर्यात करा',
    analyticsTitle: 'विश्लेषण डॅशबोर्ड',
    resolutionInsights: 'तक्रार निवारण अंतर्दृष्टी',
    complaintsByDept: 'विभागांनुसार तक्रारी',
    complaintsByTaluka: 'तालुक्यांनुसार तक्रारी',
    monthlyTrend: 'मासिक तक्रार कल',
    createUserInfo: 'नवीन वापरकर्ता तयार करा',
    profileUpdate: 'प्रोफाइल अपडेट करा',
    successProfileUpdate: 'प्रोफाइल यशस्वीरित्या अपडेट केली!',
    whatsapp: 'व्हाट्सअॅप करा',
    darkMode: 'डार्क मोड',
    language: 'English',
  },
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];
  const toggle = () => setLang(l => {
    const next = l === 'en' ? 'mr' : 'en';
    localStorage.setItem('lang', next);
    return next;
  });
  return <LangContext.Provider value={{ lang, t, toggle }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
