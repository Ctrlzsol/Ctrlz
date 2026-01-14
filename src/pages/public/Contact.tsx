
import React from 'react';
import { Mail, Phone, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';
import { motion as m } from 'framer-motion';

const motion = m as any;

const Contact = () => {
  const { t, dir } = useLanguage();

  return (
    <div className="bg-[#f5f5f7] min-h-screen pt-24 pb-16 relative overflow-hidden flex flex-col items-center justify-center">
      
      <FloatingTechBackground />

      <div className="max-w-5xl w-full px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-16">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-semibold text-[#0c2444] mb-6 tracking-tight"
            >
                {t.contact.title}
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-[#86868b] font-medium max-w-2xl mx-auto"
            >
                {t.contact.subtitle}
            </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: dir === 'rtl' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/50"
          >
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#0c2444] mb-2 uppercase tracking-wide opacity-70">{t.contact.name}</label>
                <input type="text" className="w-full bg-white/50 border-0 rounded-xl p-4 text-lg placeholder-gray-400 focus:ring-2 focus:ring-[#0071e3] transition-all shadow-inner" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0c2444] mb-2 uppercase tracking-wide opacity-70">{t.contact.email}</label>
                <input type="email" className="w-full bg-white/50 border-0 rounded-xl p-4 text-lg placeholder-gray-400 focus:ring-2 focus:ring-[#0071e3] transition-all shadow-inner" placeholder="info@be-canvas.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0c2444] mb-2 uppercase tracking-wide opacity-70">{t.contact.message}</label>
                <textarea rows={4} className="w-full bg-white/50 border-0 rounded-xl p-4 text-lg placeholder-gray-400 focus:ring-2 focus:ring-[#0071e3] transition-all shadow-inner" placeholder="How can we help?"></textarea>
              </div>
              <button className="w-full bg-[#0c2444] text-white font-semibold text-lg py-4 px-6 rounded-xl hover:bg-[#0a1f3b] transition-all shadow-lg shadow-gray-400/30 flex justify-center items-center gap-2 group">
                {t.contact.send}
                <ArrowRight size={20} className={`transition-transform ${dir === 'rtl' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
              </button>
            </form>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: dir === 'rtl' ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col justify-center space-y-12 py-8 lg:pl-12 rtl:lg:pl-0 rtl:lg:pr-12"
          >
            {[
                { icon: Phone, title: "Phone", text: "+962 7 8887 7285", sub: t.contact.workingHours },
                { icon: Mail, title: "Email", text: "info@be-canvas.com", sub: "Online Support" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#0071e3] shadow-md border border-gray-100 shrink-0">
                  <item.icon size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#0c2444] mb-1">{item.title}</h4>
                  <p className="text-lg font-bold text-[#0071e3] mb-1">{item.text}</p>
                  <p className="text-sm text-gray-500 font-medium">{item.sub}</p>
                </div>
              </div>
            ))}
            
            <div className="pt-8 border-t border-gray-200">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Technical HQ</p>
                <p className="text-[#0c2444] font-black text-3xl tracking-tighter">Ctrl <span className="text-[#0071e3]">z</span> Ecosystem</p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
