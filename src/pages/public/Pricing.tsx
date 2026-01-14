
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, BarChart3, X, CheckCircle, Minus, Clock } from 'lucide-react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { PACKAGES } from '../../core/constants';
import { motion as m, AnimatePresence } from 'framer-motion';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';

const motion = m as any;

const Pricing = () => {
  const { t, language } = useLanguage();
  const oneTimePackages = PACKAGES.filter(p => p.type === 'one-time');
  const subPackages = PACKAGES.filter(p => p.type === 'subscription');
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  return (
    <div className="bg-[#f5f5f7] min-h-screen pt-32 pb-24 relative overflow-hidden font-sans">
      
      <FloatingTechBackground />

      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-4 text-center mb-12 relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1 className="text-5xl md:text-7xl font-semibold text-[#0c2444] mb-6 tracking-tight">{t.packages.title}</h1>
                <p className="text-xl text-[#86868b] max-w-2xl mx-auto font-medium mb-8">{t.packages.subTitle}</p>
                
                {/* Comparison Entry Point */}
                <button 
                    onClick={() => setIsComparisonOpen(true)}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 text-[#0c2444] px-6 py-3 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition-all hover:shadow-md"
                >
                    <BarChart3 size={18} className="text-[#0071e3]" />
                    مقارنة الباقات
                </button>
            </motion.div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Subscription Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-24">
          {subPackages.map((pkg, idx) => {
            const translatedPkg = t.packages.items[pkg.name];
            const isPopular = pkg.isPopular;

            return (
                <motion.div 
                    key={pkg.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.6, type: "spring", stiffness: 50 }}
                    whileHover={{ 
                        y: -15, 
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" 
                    }}
                    className={`relative flex flex-col rounded-[2.5rem] p-10 transition-colors duration-300 ${
                        isPopular
                        ? 'bg-[#0c2444] text-white shadow-2xl z-10 ring-4 ring-white/20' 
                        : 'bg-white text-[#0c2444] shadow-lg border border-gray-100'
                    }`}
                >
                {isPopular && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-4 right-8 px-4 py-2 bg-[#0071e3] shadow-lg shadow-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider text-white z-20"
                    >
                        {t.common.mostPopular}
                    </motion.div>
                )}
                
                <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2 tracking-tight">{translatedPkg.name}</h3>
                    <p className={`text-xs font-bold leading-relaxed mb-8 opacity-80 min-h-[40px]`}>
                        {translatedPkg.capacity}
                    </p>
                    
                    <div className="flex items-baseline mb-8 pb-8 border-b border-gray-200/20">
                        <span className="text-6xl font-black tracking-tighter">{pkg.price}</span>
                        <div className="ml-2 flex flex-col items-start">
                            <span className="text-sm font-bold">{t.common.jod}</span>
                            <span className="text-xs opacity-60">{t.common.perMonth}</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {translatedPkg.features.map((feature, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + (i * 0.05) }}
                            className="flex items-start group"
                        >
                            <div className={`p-1 rounded-full mr-3 mt-0.5 ${isPopular ? 'bg-white/10' : 'bg-blue-50'}`}>
                                <Check size={14} className={`${isPopular ? 'text-white' : 'text-[#0071e3]'}`} strokeWidth={3} />
                            </div>
                            <span className={`text-sm font-medium leading-relaxed group-hover:translate-x-1 transition-transform ${isPopular ? 'text-gray-300' : 'text-[#0c2444]'}`}>{feature}</span>
                        </motion.div>
                        ))}
                    </div>

                    <div className={`mt-8 pt-4 border-t ${isPopular ? 'border-white/10 text-gray-400' : 'border-gray-100 text-gray-500'} text-xs font-medium leading-relaxed`}>
                         <p>{t.packages.customNote}</p>
                    </div>

                </div>

                <div className="mt-8">
                    <Link 
                    to="/contact" 
                    className={`relative overflow-hidden block w-full py-4 rounded-2xl text-center font-bold text-sm transition-all active:scale-95 group ${
                        isPopular 
                        ? 'bg-white text-[#0c2444]' 
                        : 'bg-[#0c2444] text-white'
                    }`}
                    >
                    <span className="relative z-10 group-hover:scale-105 inline-block transition-transform">{t.common.bookService}</span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                    </Link>
                </div>
                </motion.div>
            );
          })}
        </div>

        {/* One Time Services Grid */}
        <div className="mb-24">
           <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-[#0c2444]">{t.packages.oneTimeTitle}</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {oneTimePackages.map((pkg, idx) => {
                 const translatedPkg = t.packages.items[pkg.name];
                 return (
                    <motion.div 
                        key={pkg.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between shadow-sm border border-gray-100 hover:shadow-xl transition-all"
                    >
                        <div className="flex-1 mb-6 md:mb-0 text-center md:text-start">
                            <h3 className="text-xl font-bold text-[#0c2444] mb-3">{translatedPkg.name}</h3>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {translatedPkg.features.slice(0, 3).map((feat, i) => (
                                    <span key={i} className="text-xs bg-[#f5f5f7] px-3 py-1.5 rounded-lg text-[#0c2444] font-bold border border-gray-200">{feat}</span>
                                ))}
                            </div>
                            
                            {/* Special Note for Tech Day */}
                            {pkg.name === 'techDay' && (
                                <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100 shadow-sm">
                                    <Clock size={14} className="text-blue-500" />
                                    <span>
                                        {language === 'ar' ? 'تشمل زيارة فنية لمدة 4 ساعات' : 'Includes a 4-hour technical visit'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center pl-6 border-l border-gray-100">
                            <span className="text-4xl font-black text-[#0c2444] mb-3">{pkg.price}<span className="text-sm font-medium text-gray-400 ml-1">{t.common.jod}</span></span>
                            <Link to="/contact" className="px-8 py-3 bg-[#0c2444] text-white text-sm font-bold rounded-xl hover:bg-[#0071e3] transition-colors shadow-lg shadow-gray-200">
                                {t.common.bookService}
                            </Link>
                        </div>
                    </motion.div>
                 )
             })}
           </div>
        </div>

        {/* COMPARISON MODAL */}
        <AnimatePresence>
            {isComparisonOpen && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-32 bg-black/60 backdrop-blur-md overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.9 }} 
                        className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col mb-10"
                        style={{ maxHeight: 'calc(100vh - 100px)' }}
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc] sticky top-0 z-10">
                            <h3 className="text-2xl font-bold text-[#0c2444]">مقارنة الباقات التفصيلية</h3>
                            <button onClick={() => setIsComparisonOpen(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"><X size={20}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-4 text-sm font-bold text-gray-400 w-1/4">الميزة</th>
                                            <th className="p-4 text-sm font-bold text-[#0c2444] bg-gray-50 rounded-t-2xl w-1/4 text-center">باقة الأعمال الأساسية</th>
                                            <th className="p-4 text-sm font-bold text-[#0071e3] bg-blue-50 rounded-t-2xl w-1/4 text-center border-t-4 border-[#0071e3]">باقة الأعمال المتقدمة</th>
                                            <th className="p-4 text-sm font-bold text-white bg-[#0c2444] rounded-t-2xl w-1/4 text-center">باقة الأعمال الشاملة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-medium text-[#0c2444]">
                                        {[
                                            { label: 'مستوى المسؤولية', v1: 'عند حدوث المشكلة', v2: 'تدخل استباقي', v3: 'إدارة كاملة للمؤسسة' },
                                            { label: 'عدد المستخدمين', v1: '10', v2: '20', v3: '30' },
                                            { label: 'الزيارات الميدانية شهرياً', v1: '2', v2: '4', v3: '8' },
                                            { label: 'مدة الزيارة', v1: '4 ساعات', v2: '4 ساعات', v3: '4 ساعات' },
                                            { label: 'تذاكر الدعم عن بُعد', v1: '3', v2: '7', v3: '12' },
                                            { label: 'حسابات Microsoft 365', v1: '5 (Standard)', v2: '10 (Standard)', v3: '15 (Premium)' },
                                            { label: 'تراخيص Antivirus', v1: '2', v2: '5', v3: '10' },
                                            { label: 'النسخ الاحتياطي', v1: <Minus size={16} className="text-gray-300 mx-auto"/>, v2: <CheckCircle size={16} className="text-blue-500 mx-auto"/>, v3: <CheckCircle size={16} className="text-green-500 mx-auto"/> },
                                            { label: 'المراقبة الاستباقية', v1: <Minus size={16} className="text-gray-300 mx-auto"/>, v2: <CheckCircle size={16} className="text-blue-500 mx-auto"/>, v3: <CheckCircle size={16} className="text-green-500 mx-auto"/> },
                                            { label: 'إدارة الصلاحيات', v1: <Minus size={16} className="text-gray-300 mx-auto"/>, v2: <CheckCircle size={16} className="text-blue-500 mx-auto"/>, v3: <CheckCircle size={16} className="text-green-500 mx-auto"/> },
                                            { label: 'إدارة أمن متقدمة', v1: <Minus size={16} className="text-gray-300 mx-auto"/>, v2: <Minus size={16} className="text-gray-300 mx-auto"/>, v3: <CheckCircle size={16} className="text-green-500 mx-auto"/> },
                                            { label: 'جلسة استشارية للإدارة', v1: <Minus size={16} className="text-gray-300 mx-auto"/>, v2: <Minus size={16} className="text-gray-300 mx-auto"/>, v3: <CheckCircle size={16} className="text-green-500 mx-auto"/> },
                                            { label: 'نوع التقرير', v1: 'مختصر', v2: 'تحليلي', v3: 'مفصل + توصيات' },
                                            { label: 'زيارة طارئة (استجابة فورية لعطل حرج)', v1: '18 JOD', v2: '12 JOD', v3: 'مشمولة' },
                                            { label: 'زيارة ميدانية إضافية (حتى 4 ساعات)', v1: '25 JOD', v2: '25 JOD', v3: '25 JOD' },
                                            { label: 'مستخدم إضافي', v1: '6 JOD / شهر', v2: '5 JOD / شهر', v3: '4 JOD / شهر' },
                                            { label: 'تذكرة دعم إضافية عن بعد', v1: '10 JOD', v2: '10 JOD', v3: '10 JOD' },
                                            { label: 'رخص البرامج', v1: 'حسب نوع الرخصة (Microsoft 365، Antivirus، وغيرها)', v2: 'حسب نوع الرخصة (Microsoft 365، Antivirus، وغيرها)', v3: 'حسب نوع الرخصة (Microsoft 365، Antivirus، وغيرها)' },
                                            { label: 'السعر الشهري', v1: '180 JOD', v2: '280 JOD', v3: '360 JOD', isPrice: true },
                                        ].map((row, idx) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-bold text-gray-500">{row.label}</td>
                                                <td className={`p-4 text-center border-l border-r border-gray-100 ${row.isPrice ? 'font-black text-lg' : ''}`}>{row.v1}</td>
                                                <td className={`p-4 text-center border-l border-r border-blue-100 bg-blue-50/10 ${row.isPrice ? 'font-black text-lg text-[#0071e3]' : ''}`}>{row.v2}</td>
                                                <td className={`p-4 text-center border-l border-gray-100 bg-[#0c2444]/5 ${row.isPrice ? 'font-black text-lg text-[#0c2444]' : ''}`}>{row.v3}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                للأعمال التي تحتاج دعماً عند الطلب اختر <span className="font-bold text-[#0c2444]">الأساسية</span>، 
                                للأعمال التي تعتمد على التقنية يومياً اختر <span className="font-bold text-[#0071e3]">المتقدمة</span>، 
                                وللشركات التي ترغب بتفويض التقنية بالكامل اختر <span className="font-bold text-[#0c2444]">الشاملة</span>.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                تُحتسب الإضافات حسب الباقة المختارة، ويظهر السعر النهائي بوضوح داخل لوحة التحكم.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Pricing;
