import { Phone, Shield, Heart, Flame, Zap, Landmark, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function EmergencyContacts() {
  const { t } = useLang();

  const contacts = [
    {
      category: 'Emergency Services',
      items: [
        { name: t.police, number: '100', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: t.ambulance, number: '108', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
        { name: t.fire, number: '101', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
      ]
    },
    {
      category: 'Public Utilities',
      items: [
        { name: t.electricity, number: '1912', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { name: t.tehsildar, number: '02117-262331', icon: Landmark, color: 'text-gov-navy', bg: 'bg-indigo-50' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="bg-gov-navy text-white py-12 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-saffron-400 hover:text-saffron-300 font-bold mb-6 transition-colors">
            <ArrowLeft size={18} /> {t.home}
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{t.emergencyContactsTitle}</h1>
          <p className="text-blue-100/70">{t.emergencyContactsDesc}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="space-y-8">
          {contacts.map((group) => (
            <div key={group.category} className="space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">{group.category}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {group.items.map((contact) => (
                  <div key={contact.name} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group hover:border-saffron-300 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${contact.bg} dark:bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                        <contact.icon className={contact.color} size={28} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{contact.name}</h3>
                        <p className="text-xl font-extrabold text-gov-navy dark:text-saffron-400">{contact.number}</p>
                      </div>
                    </div>
                    <a 
                      href={`tel:${contact.number.replace(/-/g, '')}`}
                      className="w-12 h-12 rounded-full bg-saffron-500 hover:bg-saffron-600 text-white flex items-center justify-center shadow-lg shadow-saffron-500/30 transition-all hover:scale-110 active:scale-95"
                    >
                      <Phone size={20} fill="currentColor" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-saffron-50 dark:bg-saffron-900/10 border border-saffron-100 dark:border-saffron-900/30 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-md">🚨</div>
            <h3 className="text-xl font-bold text-saffron-800 dark:text-saffron-400 mb-2">Important Note</h3>
            <p className="text-saffron-700/70 dark:text-saffron-300/50 text-sm max-w-lg mx-auto">
                These numbers are for emergency and official use only. Please use them responsibly to ensure help reaches those in need promptly.
            </p>
        </div>
      </div>
    </div>
  );
}
