
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Server, Wifi, ArrowUpRight, Cpu, Layers, Network } from 'lucide-react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { motion as m } from 'framer-motion';
import { ScrollReveal } from '../../ui/components/ScrollReveal';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';

const motion = m as any;

// Specific Apple-like ease curve
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

// --- Tech Animation Component ---
const TechReveal = ({ text, delay = 0, className = "" }: { text: string, delay?: number, className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const symbols = "01";

  useEffect(() => {
    let iteration = 0;
    const maxIterations = 40; 
    let interval: any = null;

    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayedText(prev => {
          if (iteration >= maxIterations) {
            clearInterval(interval);
            setIsComplete(true);
            return text;
          }
          return text.split("")
            .map((char, index) => {
              if (index < (iteration / maxIterations) * text.length) return text[index];
              return symbols[Math.floor(Math.random() * symbols.length)];
            })
            .join("");
        });
        iteration += 1; 
      }, 30); 
    }, delay * 1000);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className={`${isComplete ? "" : "font-mono text-gray-400 tracking-widest opacity-80"}`}>
        {displayedText || <span className="opacity-0">{text}</span>}
      </span>
      {!isComplete && (
        <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.1, repeat: Infinity }}
            className="inline-block w-2 h-[1em] bg-gray-400 align-middle ml-1"
        />
      )}
    </span>
  );
};

const Home = () => {
  const { t, dir } = useLanguage();

  return (
    <div className="h-screen w-full bg-[#f5f5f7] font-sans selection:bg-[#0c2444] selection:text-white relative overflow-y-auto snap-y snap-mandatory scroll-smooth">
      
      <div className="fixed inset-0 pointer-events-none z-0">
         <FloatingTechBackground />
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative h-screen snap-start flex flex-col items-center justify-center text-center px-4 z-10">
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, ease }}
           className="relative z-10 max-w-5xl mx-auto"
        >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-[#0c2444] mb-6 leading-[1.05] flex flex-col items-center">
                <motion.span 
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8 }}
                >
                    {t.hero.titleLine1}
                </motion.span>
                
                <div className="relative overflow-hidden py-2 px-4">
                    <TechReveal 
                        text={t.hero.titleLine2} 
                        delay={0.5} 
                        className="relative z-10 text-gray-400"
                    />
                </div>
            </h1>
            
            <p className="text-xl md:text-2xl text-[#66768f] font-medium max-w-2xl mx-auto mb-10 leading-relaxed opacity-90">
               {t.hero.slogan}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/contact" className="px-10 py-4 bg-[#0c2444] text-white rounded-full text-lg font-bold hover:bg-[#0a1f3b] transition-all hover:scale-105 shadow-xl shadow-blue-900/20 active:scale-95">
                    {t.common.contactUs}
                </Link>
                <Link to="/pricing" className="flex items-center gap-2 text-[#0071e3] hover:underline font-bold px-6 py-3 text-lg group">
                    {t.hero.cta} <ArrowRight size={20} className={`transition-transform ${dir === 'rtl' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
                </Link>
            </div>
        </motion.div>
      </section>

      {/* 2. THE ECOSYSTEM (Visual Diagram) - CREATIVE REDESIGN */}
      <section className="h-screen snap-start flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto relative z-10">
         <ScrollReveal>
             <div className="text-center mb-16">
                 <h2 className="text-5xl md:text-7xl font-bold text-[#0c2444] mb-4 tracking-tight leading-tight">
                    {t.home.canvasSection.title}
                 </h2>
                 {/* Subtitle Removed as requested */}
             </div>
         </ScrollReveal>

         <div className="relative w-full flex items-center justify-center">
             
             {/* Dynamic Animated Connection Pipe */}
             <div className="absolute top-1/2 left-0 right-0 h-32 -translate-y-1/2 z-0 hidden lg:block overflow-hidden">
                 <svg className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0071e3" stopOpacity="0" />
                            <stop offset="50%" stopColor="#0071e3" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path 
                        d="M 100,64 L 1300,64"
                        stroke="url(#flowGradient)"
                        strokeWidth="4"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        strokeDasharray="10 20"
                    />
                    <motion.circle 
                        cx="0" cy="64" r="6" fill="#0071e3"
                        animate={{ 
                            cx: ["10%", "90%"],
                            opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                 </svg>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10 w-full">
                 
                 {/* CANVAS CARD */}
                 <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.8, ease }}
                    className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500"
                 >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-bl-[100px] -mr-10 -mt-10 transition-all group-hover:bg-[#0071e3]/10"></div>
                     <div className="w-16 h-16 bg-[#f5f5f7] text-[#0c2444] rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform">
                         <Layers size={32} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">{t.home.canvasSection.parentRole}</h3>
                     <h2 className="text-4xl font-black text-[#0c2444] mb-4 tracking-tight relative z-10">{t.home.canvasSection.parentTitle}</h2>
                     <p className="text-lg text-gray-500 leading-relaxed font-medium relative z-10">
                        {t.home.canvasSection.parentDesc}
                     </p>
                 </motion.div>

                 {/* CONNECTOR NODE (Creative Hub) */}
                 <div className="flex flex-col items-center justify-center text-center relative z-20">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <motion.div 
                            className="absolute inset-0 bg-[#0071e3] opacity-5 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        ></motion.div>
                        <motion.div 
                            className="absolute inset-4 bg-[#0071e3] opacity-10 rounded-full"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
                        ></motion.div>
                        <div className="w-24 h-24 bg-white rounded-full shadow-[0_10px_30px_rgba(0,113,227,0.2)] border border-white flex items-center justify-center relative z-10">
                            <Network className="text-[#0071e3]" size={36} />
                        </div>
                    </div>
                    <div className="mt-4 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full border border-gray-100 shadow-lg">
                        <span className="text-xs font-bold text-[#0c2444] uppercase tracking-wider">{t.home.canvasSection.connection}</span>
                    </div>
                 </div>

                 {/* CTRL Z CARD */}
                 <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.8, ease }}
                    className="bg-[#0c2444] text-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500"
                 >
                     <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#0071e3] rounded-full blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
                     <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

                     <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                             <Cpu size={32} />
                        </div>
                        <h3 className="text-xs font-bold text-[#0071e3] uppercase tracking-widest mb-2">{t.home.canvasSection.childRole}</h3>
                        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{t.home.canvasSection.childTitle}</h2>
                        <p className="text-lg text-blue-100/80 leading-relaxed font-medium">
                            {t.home.canvasSection.childDesc}
                        </p>
                     </div>
                 </motion.div>
             </div>
         </div>
      </section>

      {/* 3. FEATURES - MODERN REDESIGN */}
      <section className="h-screen snap-start flex flex-col justify-center py-20 relative z-10">
          <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <ScrollReveal>
                <div className="text-center mb-20">
                    {/* UPDATED: Removed gradient, used solid brand color */}
                    <h2 className="text-5xl md:text-7xl font-bold text-[#0c2444] mb-4 tracking-tight leading-tight">
                        {t.home.servicesTitle}
                    </h2>
                    <p className="text-xl text-gray-500 font-medium">
                        {t.home.servicesSubtitle}
                    </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                      { icon: Shield, title: t.home.features.security.title, desc: t.home.features.security.desc, color: "text-green-600", bg: "bg-green-50" },
                      { icon: Server, title: t.home.features.maintenance.title, desc: t.home.features.maintenance.desc, color: "text-blue-600", bg: "bg-blue-50" },
                      { icon: Wifi, title: t.home.features.support.title, desc: t.home.features.support.desc, color: "text-purple-600", bg: "bg-purple-50" }
                  ].map((feat, i) => (
                      <motion.div
                         key={i}
                         initial={{ opacity: 0, y: 40 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: false }}
                         transition={{ delay: i * 0.1, duration: 0.8, ease }}
                         className="flex flex-col items-start p-10 rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full group"
                      >
                          <div className={`w-16 h-16 rounded-2xl ${feat.bg} flex items-center justify-center mb-8 ${feat.color} group-hover:scale-110 transition-transform duration-300`}>
                            <feat.icon size={32} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-2xl font-bold text-[#0c2444] mb-4 group-hover:text-[#0071e3] transition-colors">{feat.title}</h3>
                          <p className="text-[#66768f] font-medium leading-relaxed text-lg">{feat.desc}</p>
                      </motion.div>
                  ))}
              </div>
              
              <div className="mt-16 text-center">
                  <Link to="/services" className="inline-flex items-center gap-2 text-xl font-bold text-[#0071e3] hover:underline group">
                      {t.home.servicesCta} <ArrowRight size={20} className={`transition-transform ${dir === 'rtl' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
                  </Link>
              </div>
          </div>
      </section>

      {/* 4. CTA */}
      <section className="h-screen snap-start flex flex-col justify-center py-20 px-4 text-center relative z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] pointer-events-none opacity-60"></div>

          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: false }}
             transition={{ duration: 1, ease }}
             className="relative z-10 max-w-4xl mx-auto"
          >
             <div className="mb-8 flex justify-center">
                 <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center animate-bounce-slow text-[#0c2444]">
                     <ArrowUpRight size={36} />
                 </div>
             </div>

              <h2 className="text-5xl md:text-7xl font-bold text-[#0c2444] mb-8 tracking-tighter leading-none">
                  {t.home.contactCtaTitle}
              </h2>
              <p className="text-2xl md:text-3xl text-[#66768f] mb-12 font-medium max-w-2xl mx-auto">
                  {t.home.contactCtaDesc}
              </p>
              
              <div className="flex flex-col items-center">
                  <Link 
                    to="/contact" 
                    className="group relative inline-flex items-center gap-4 px-12 py-5 bg-[#0c2444] text-white rounded-full text-xl font-bold hover:bg-[#0a1f3b] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                  >
                      <span>{t.home.contactCtaButton}</span>
                      <ArrowRight size={20} className={`transition-transform ${dir === 'rtl' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
                  </Link>
              </div>
          </motion.div>
      </section>
    </div>
  );
};

export default Home;
