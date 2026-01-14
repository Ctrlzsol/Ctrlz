
import React from 'react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import Logo from '../components/Logo';
import { ExternalLink } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0c2444] text-white pt-20 pb-10 border-t border-white/5 font-sans relative overflow-hidden print:hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#0071e3] rounded-full blur-[120px]"></div>
      </div>

      {/* Large Watermark Logo - FIXED POSITIONING & VISIBILITY */}
      <div className="absolute top-0 bottom-0 left-0 h-full w-1/2 flex items-center justify-start pointer-events-none select-none opacity-10 overflow-hidden">
         <div className="brightness-0 invert h-[80%] w-full"> 
            <Logo className="h-full w-full object-contain object-left" /> 
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        
        {/* Top Section: Slogan Only */}
        <div className="flex flex-col items-center text-center mb-16">
             <p className="text-blue-200/60 text-lg font-medium max-w-xl leading-relaxed">
                {t.hero.slogan}
             </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10"></div>

        {/* Bottom Section: 3 Columns */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-0 text-center lg:text-right">
            
            {/* Left Column (in LTR): Branding Info */}
            <div className="flex flex-col items-center lg:items-start gap-4 flex-1">
                 <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400">
                    <span className="uppercase">Digital Ecosystem</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                    <span className="text-white">AVAILABLE GLOBALLY</span>
                 </div>
            </div>

            {/* Center Column: Ctrl Z Branding */}
            <div className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Developed By</span>
                <div className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-xl font-black text-white tracking-tighter group-hover:text-[#0071e3] transition-colors">Ctrl Z</span>
                    <ExternalLink size={10} className="text-gray-600 group-hover:text-[#0071e3] transition-colors -mt-2" />
                </div>
                <span className="text-[9px] text-gray-500 font-bold tracking-wider opacity-60">TECHNICAL ECOSYSTEM</span>
            </div>

            {/* Right Column (in LTR): Copyright */}
            <div className="flex flex-col items-center lg:items-end gap-2 flex-1 text-gray-400">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">Ctrl Z Platform</p>
                <p className="text-[10px] font-medium tracking-widest opacity-60">ALL RIGHTS RESERVED {new Date().getFullYear()} ©</p>
            </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
