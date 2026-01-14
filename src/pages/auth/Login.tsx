
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/AuthContext';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { Shield, ArrowRight, Cpu, Fingerprint, Activity, ScanLine, Terminal, Layers, Globe, Radio } from 'lucide-react';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';
import { motion, AnimatePresence } from 'framer-motion';

const portalThemes = {
    client: {
        id: 'client',
        color: 'blue',
        hex: '#0071e3',
        gradient: 'from-blue-600 to-indigo-600',
        lightBg: 'bg-blue-50',
        icon: Layers,
        title: 'بوابة العميل',
        sub: 'Ecosystem Access',
        desc: 'الوصول المباشر إلى خدمات الدعم والمتابعة الفنية لأعمالكم.'
    },
    technician: {
        id: 'technician',
        color: 'emerald',
        hex: '#10b981',
        gradient: 'from-emerald-500 to-teal-600',
        lightBg: 'bg-emerald-50',
        icon: Terminal,
        title: 'بوابة الفني',
        sub: 'Technical Uplink',
        desc: 'منصة العمليات الميدانية لمتابعة المهام وحل التذاكر التقنية.'
    },
    admin: {
        id: 'admin',
        color: 'indigo',
        hex: '#4f46e5',
        gradient: 'from-[#0c2444] to-blue-900',
        lightBg: 'bg-slate-100',
        icon: Shield,
        title: 'مركز الإدارة',
        sub: 'Core Command',
        desc: 'لوحة التحكم المركزية لإدارة الأنظمة والعملاء والتقارير المالية.'
    }
};

const Login = () => {
  const [activeRole, setActiveRole] = useState<'client' | 'technician' | 'admin'>('client');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const { login, logout, isAuthenticated, user } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const theme = portalThemes[activeRole];
  const ThemeIcon = theme.icon;

  useEffect(() => {
    logout();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'client') navigate('/client', { replace: true });
        else if (user.role === 'technician') navigate('/technician', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const success = await login(accessCode, activeRole);
    if (!success) {
        setIsSubmitting(false);
        setError('بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center relative overflow-hidden font-sans p-4" dir={dir}>
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
          <FloatingTechBackground />
      </div>

      <div className="w-full max-w-[900px] relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] border border-white overflow-hidden flex flex-col md:flex-row min-h-[550px]"
          >
             
             {/* LEFT SIDE: Visual Brand & Role Info (Dynamic Gradient) */}
             <div className="w-full md:w-[40%] relative overflow-hidden flex flex-col justify-between p-10 text-white">
                 <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeRole}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
                    />
                 </AnimatePresence>

                 {/* Noise & Patterns */}
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
                 
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                            <ThemeIcon size={24} />
                        </div>
                        <span className="font-black text-xl tracking-tighter">Ctrl <span className="text-white/70">Z</span></span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeRole}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h2 className="text-4xl font-black mb-3 leading-tight">{theme.title}</h2>
                            <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/60 mb-6">{theme.sub}</p>
                            <p className="text-sm text-white/80 leading-relaxed font-medium max-w-xs">{theme.desc}</p>
                        </motion.div>
                    </AnimatePresence>
                 </div>

                 <div className="relative z-10 pt-10">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold">
                                    {i === 1 ? 'U' : i === 2 ? 'S' : 'A'}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Global Tech Network</p>
                    </div>
                 </div>
             </div>

             {/* RIGHT SIDE: Auth Form */}
             <div className="flex-1 bg-white p-10 md:p-14 flex flex-col justify-center">
                 
                 {/* Role Switch Tabs */}
                 <div className="flex bg-gray-100/50 p-1 rounded-2xl mb-12">
                     {(['client', 'technician', 'admin'] as const).map((role) => (
                         <button
                            key={role}
                            onClick={() => { setActiveRole(role); setAccessCode(''); setError(''); }}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all relative ${activeRole === role ? 'text-[#0c2444] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             {activeRole === role && (
                                 <motion.div 
                                    layoutId="active-tab-bg"
                                    className="absolute inset-0 bg-white rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                 />
                             )}
                             <span className="relative z-10">{role}</span>
                         </button>
                     ))}
                 </div>

                 <div className="mb-10">
                    <h3 className="text-2xl font-black text-[#0c2444] mb-2">تسجيل الدخول</h3>
                    <p className="text-sm text-gray-400 font-medium">يرجى إدخال رمز الوصول الخاص بك للمتابعة</p>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-r ${theme.gradient} rounded-2xl opacity-0 group-focus-within:opacity-10 transition-opacity blur`}></div>
                        
                        <div className={`relative flex items-center transition-all duration-300 ${error ? 'animate-shake' : ''}`}>
                            <div className={`absolute right-4 text-${theme.color}-500 transition-transform duration-300 ${isFocused ? 'scale-110 opacity-100' : 'opacity-30'}`}>
                                <Fingerprint size={24} />
                            </div>
                            <input 
                                type={activeRole === 'admin' ? "password" : "text"}
                                value={accessCode}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onChange={(e) => { setAccessCode(e.target.value); setError(''); }}
                                className={`block w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-5 pr-14 pl-6 text-right text-[#0c2444] placeholder-gray-300 outline-none focus:bg-white focus:border-${theme.color}-200 transition-all font-mono text-xl tracking-[0.4em]`}
                                placeholder="••••••••"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-red-50 text-red-600 text-[11px] font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 border border-red-100"
                            >
                                <Activity size={16} /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button 
                        type="submit"
                        disabled={isSubmitting || !accessCode}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full relative overflow-hidden rounded-2xl font-black text-xs py-5 text-white shadow-2xl transition-all disabled:opacity-40 disabled:grayscale group active:scale-95`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient}`}></div>
                        
                        <div className="relative flex items-center justify-center gap-3 tracking-[0.2em]">
                            {isSubmitting ? (
                                <>
                                    <Cpu className="animate-spin" size={20} />
                                    <span>جاري التحقق...</span>
                                </>
                            ) : (
                                <>
                                    <span>دخول النظام</span>
                                    <ArrowRight className={`w-4 h-4 transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                                </>
                            )}
                        </div>
                    </motion.button>
                 </form>

                 <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between text-gray-400">
                    <p className="text-[9px] font-black uppercase tracking-widest">Ctrl Z Platform v3.1</p>
                    <div className="flex gap-4">
                        <Globe size={14} className="hover:text-blue-500 cursor-pointer transition-colors" />
                        <Radio size={14} className="hover:text-emerald-500 cursor-pointer transition-colors" />
                    </div>
                 </div>
             </div>
          </motion.div>
      </div>

      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default Login;
