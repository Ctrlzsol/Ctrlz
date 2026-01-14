

import React from 'react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { Monitor, Server, Shield, Cloud, HardDrive, Wifi, ChevronRight } from 'lucide-react';
import { motion as m } from 'framer-motion';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';
import { ScrollReveal } from '../../ui/components/ScrollReveal';

const motion = m as any;

const Services = () => {
  const { t, dir } = useLanguage();

  const servicesList = [
    { ...t.services.items.itSupport, icon: Monitor, color: "text-blue-600", gradient: "from-blue-500/20 to-blue-500/5" },
    { ...t.services.items.managed, icon: Server, color: "text-purple-600", gradient: "from-purple-500/20 to-purple-500/5" },
    { ...t.services.items.security, icon: Shield, color: "text-green-600", gradient: "from-green-500/20 to-green-500/5" },
    { ...t.services.items.remote, icon: Cloud, color: "text-sky-600", gradient: "from-sky-500/20 to-sky-500/5" },
    { ...t.services.items.backup, icon: HardDrive, color: "text-orange-600", gradient: "from-orange-500/20 to-orange-500/5" },
    { ...t.services.items.network, icon: Wifi, color: "text-indigo-600", gradient: "from-indigo-500/20 to-indigo-500/5" }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-32 pb-32 relative overflow-hidden font-sans">
      
      <FloatingTechBackground />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         
         <div className="text-center mb-24 max-w-3xl mx-auto">
            <ScrollReveal>
                <h1 className="text-5xl md:text-7xl font-bold text-[#0c2444] mb-6 tracking-tight leading-tight">
                    {t.services.title}
                </h1>
                <p className="text-2xl text-[#86868b] font-medium leading-relaxed">
                    {t.services.subtitle}
                </p>
            </ScrollReveal>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
            {servicesList.map((service, idx) => (
               <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  className="group h-full"
                  style={{ perspective: "1000px" }}
               >
                  <div className={`relative bg-white rounded-[2.5rem] p-8 h-full flex flex-col justify-between shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 hover:border-transparent overflow-hidden transform-gpu group-hover:scale-[1.02] group-hover:-rotate-y-2 group-hover:rotate-x-2`}>
                      
                      {/* Gradient Glow on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                      
                      <div className="relative z-10">
                          <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:shadow-md transition-all duration-500`}>
                              <service.icon size={32} className={service.color} strokeWidth={2} />
                          </div>
                          
                          <h3 className="text-3xl font-bold text-[#0c2444] mb-3 tracking-tight">
                              {service.title}
                          </h3>
                          
                          <p className="text-[#86868b] text-lg font-medium leading-relaxed mb-8 group-hover:text-[#0c2444] transition-colors">
                              {service.desc}
                          </p>
                      </div>

                      <div className="relative z-10 pt-6 border-t border-gray-100 group-hover:border-black/5 mt-auto">
                          <ul className="space-y-3">
                              {service.features.map((feat, i) => (
                                  <li key={i} className="flex items-center gap-3 text-[15px] font-bold text-[#0c2444]/80">
                                      <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-50`}></div>
                                      {feat}
                                  </li>
                              ))}
                          </ul>
                          <div className="mt-8 flex justify-end">
                              <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500`}>
                                  <ChevronRight className={`${service.color} transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`} size={20} />
                              </div>
                          </div>
                      </div>
                  </div>
               </motion.div>
            ))}
         </div>

      </div>
    </div>
  );
};

export default Services;
