
import React from 'react';
import { Target, Heart, Award, Building2, Zap, Layers } from 'lucide-react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { ScrollReveal } from '../../ui/components/ScrollReveal';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';
import { motion as m } from 'framer-motion';

const motion = m as any;

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans relative overflow-x-hidden selection:bg-[#0c2444] selection:text-white">
      
      <FloatingTechBackground />

      {/* 1. HERO: Minimalist & Clean */}
      <section className="relative pt-40 pb-20 px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
                     <span className="w-2 h-2 rounded-full bg-[#0071e3]"></span>
                     <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">{t.about.heroSubtitle}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-[#0c2444] tracking-tight leading-tight mb-8">
                   {t.about.storyTitleBig}
                </h1>
                <p className="text-xl md:text-2xl text-[#66768f] leading-relaxed font-medium">
                    {t.about.storyText1}
                </p>
            </ScrollReveal>
        </div>
      </section>

      {/* 2. THE STORY: Split Layout */}
      <section className="py-16 px-4 relative z-10">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <ScrollReveal>
                  <div className="relative p-2">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-[2.5rem] transform -rotate-2"></div>
                      <div className="relative bg-white p-8 md:p-12 rounded-[2rem] shadow-md border border-gray-100">
                          <Building2 size={40} className="text-[#0c2444] mb-6" />
                          <h3 className="text-2xl font-bold text-[#0c2444] mb-4">{t.about.productOfCanvas}</h3>
                          <p className="text-lg text-[#66768f] leading-relaxed">
                            {t.about.storyText2}
                          </p>
                      </div>
                  </div>
              </ScrollReveal>
              
              <ScrollReveal delay={0.2}>
                  <div className="space-y-6">
                      <h2 className="text-3xl font-bold text-[#0c2444]">{t.about.storyTitle}</h2>
                      <p className="text-lg text-[#0c2444] font-medium leading-relaxed border-l-4 border-[#0071e3] pl-4 rtl:pl-0 rtl:pr-4">
                          {t.about.storyBridge}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                              <span className="block text-3xl font-bold text-[#0071e3] mb-1">100%</span>
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.about.statUptime}</span>
                          </div>
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                              <span className="block text-3xl font-bold text-[#0071e3] mb-1">24/7</span>
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.about.statSupport}</span>
                          </div>
                      </div>
                  </div>
              </ScrollReveal>
          </div>
      </section>

      {/* 3. DUALITY: Visual Cards */}
      <section className="py-20 bg-[#0c2444] text-white relative overflow-hidden my-10 mx-4 lg:mx-8 rounded-[2.5rem]">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0071e3] rounded-full blur-[100px] opacity-10"></div>
           
           <div className="max-w-[1000px] mx-auto px-4 relative z-10">
               <div className="text-center mb-16">
                   <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.about.ecosystemTitle}</h2>
                   <p className="text-lg text-blue-100 opacity-80">{t.about.ecosystemSubtitle}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Strategy Card */}
                   <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-sm"
                    >
                       <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center mb-6">
                           <Layers className="w-6 h-6 text-[#0071e3]" />
                       </div>
                       <h3 className="text-2xl font-bold mb-3">Canvas</h3>
                       <p className="text-sm font-bold text-[#0071e3] uppercase tracking-wider mb-4">{t.about.canvasRole}</p>
                       <p className="text-blue-100/70 text-base leading-relaxed mb-6">{t.about.canvasDesc}</p>
                       <ul className="space-y-2">
                           <li className="flex items-center gap-3 text-sm font-medium text-white/90"><div className="w-1.5 h-1.5 bg-[#0071e3] rounded-full"></div>{t.about.canvasPoint1}</li>
                           <li className="flex items-center gap-3 text-sm font-medium text-white/90"><div className="w-1.5 h-1.5 bg-[#0071e3] rounded-full"></div>{t.about.canvasPoint2}</li>
                       </ul>
                   </motion.div>

                   {/* Execution Card */}
                   <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white/10 border border-white/20 rounded-[2rem] p-8 backdrop-blur-sm relative overflow-hidden"
                    >
                       <div className="absolute top-0 right-0 px-3 py-1 bg-[#0071e3] rounded-bl-xl text-[10px] font-bold uppercase tracking-wider rtl:right-auto rtl:left-0 rtl:rounded-bl-none rtl:rounded-br-xl">{t.about.youAreHere}</div>
                       <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                           <Zap className="w-6 h-6 text-white" />
                       </div>
                       <h3 className="text-2xl font-bold mb-3">Ctrl Z</h3>
                       <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">{t.about.ctrlzRole}</p>
                       <p className="text-blue-100/70 text-base leading-relaxed mb-6">{t.about.ctrlzDesc}</p>
                       <ul className="space-y-2">
                           <li className="flex items-center gap-3 text-sm font-medium text-white"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>{t.about.ctrlzPoint1}</li>
                           <li className="flex items-center gap-3 text-sm font-medium text-white"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>{t.about.ctrlzPoint2}</li>
                       </ul>
                   </motion.div>
               </div>
           </div>
      </section>

      {/* 4. CORE VALUES: Clean 3-Col Grid */}
      <section className="py-20 px-4 relative z-10">
         <div className="max-w-[1100px] mx-auto">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#0c2444] mb-2">{t.about.principlesTitle}</h2>
                <p className="text-gray-500">{t.about.principlesSubtitle}</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                     { icon: Target, title: t.about.missionTitle, desc: t.about.missionDesc },
                     { icon: Award, title: t.about.excellenceTitle, desc: t.about.excellenceDesc },
                     { icon: Heart, title: t.about.customerTitle, desc: t.about.customerDesc },
                 ].map((item, idx) => (
                     <ScrollReveal key={idx} delay={idx * 0.1}>
                        <div className="group bg-white rounded-[1.5rem] p-8 h-full border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300">
                             <div className="w-12 h-12 bg-[#f0f4fa] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#0c2444] transition-colors duration-300">
                                <item.icon className="w-6 h-6 text-[#0c2444] group-hover:text-white transition-colors duration-300" strokeWidth={2} />
                             </div>
                             <h3 className="text-xl font-bold text-[#0c2444] mb-3">{item.title}</h3>
                             <p className="text-sm text-[#66768f] leading-relaxed">{item.desc}</p>
                        </div>
                     </ScrollReveal>
                 ))}
             </div>
         </div>
      </section>

    </div>
  );
};

export default About;
