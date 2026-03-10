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
    analytics: 'Analytics', users: 'Manage Users',
    successSubmit: 'Complaint submitted successfully!',
    required: 'This field is required',
    departments: ['Road', 'Water', 'Electricity', 'Revenue', 'Police', 'Health', 'Education', 'Agriculture', 'Other'],
    talukas: ['Pune', 'Haveli', 'Khed', 'Baramati', 'Junnar', 'Shirur', 'Indapur', 'Daund', 'Mawal', 'Ambegaon', 'Purandhar', 'Bhor', 'Mulshi', 'Velhe'],
    roles: { super_admin: 'Super Admin', taluka_coordinator: 'Taluka Coordinator', data_entry_operator: 'Data Entry Operator' },
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
    successSubmit: 'तक्रार यशस्वीरित्या सादर केली!',
    required: 'हे फील्ड आवश्यक आहे',
    departments: ['रस्ता', 'पाणी', 'वीज', 'महसूल', 'पोलीस', 'आरोग्य', 'शिक्षण', 'कृषी', 'इतर'],
    talukas: ['पुणे', 'हवेली', 'खेड', 'बारामती', 'जुन्नर', 'शिरूर', 'इंदापूर', 'दौंड', 'मावळ', 'आंबेगाव', 'पुरंदर', 'भोर', 'मुळशी', 'वेल्हे'],
    roles: { super_admin: 'सुपर प्रशासक', taluka_coordinator: 'तालुका समन्वयक', data_entry_operator: 'डेटा एंट्री ऑपरेटर' },
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
