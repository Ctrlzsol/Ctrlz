
import React, { useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, X, Printer, ClipboardList, ArrowRight, Layers, Check, Zap, Shield, TrendingUp, Building2, Calendar, User, Server, Database, FileBarChart, AlertOctagon, Clock, Activity, FileCheck, HardDrive, Cpu, Radio, Search, Wrench, ServerOff, CloudOff, Share2 } from 'lucide-react';
import { Report } from '../../../core/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useLogo } from '../../../core/contexts/LogoContext';

interface ReportsViewProps {
    reports: Report[];
    t: any;
}

const ReportPrintModal: React.FC<{ report: Report; onClose: () => void }> = ({ report, onClose }) => {
    const { customLogoData } = useLogo();
    
    // SAFE DATA EXTRACTION & MAPPING
    const content = (report.content || {}) as any;
    const score = content.healthScore || 0;
    
    // TYPE CHECKING
    const isVisitLog = report.type === 'visit_log';
    const isMonthly = report.type === 'monthly_technical';
    const isIncident = report.type === 'incident';

    // Helper to split text into list items
    const parseList = (text: any) => {
        if (!text) return [];
        if (typeof text !== 'string') return []; 
        return text.split('\n').filter((line: string) => line.trim() !== '');
    };

    const tasksList = isVisitLog ? parseList(content.completed_tasks) : parseList(content.key_achievements);
    const notesList = isVisitLog ? parseList(content.recommendations) : parseList(content.strategic_recommendations);
    const warningsList = parseList(content.warnings);
    const pendingList = parseList(content.pendingTasks);

    // New License Parsing
    const activeLicenses = parseList(content.licenseActive);
    const expiringLicenses = parseList(content.licenseExpiring);
    const expiredLicenses = parseList(content.licenseExpired);

    // MAPPINGS (Ensure keys match ReportGenerator output)
    const sysStatusMap: Record<string, { label: string, color: string, icon: any }> = { 
        stable: { label: 'مستقر', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle }, 
        unstable: { label: 'غير مستقر', color: 'text-orange-600 bg-orange-50', icon: Activity }, 
        critical: { label: 'حرج', color: 'text-red-600 bg-red-50', icon: AlertTriangle }, 
        maintenance: { label: 'تحت الصيانة', color: 'text-blue-600 bg-blue-50', icon: Wrench }, 
        no_server: { label: 'لا يوجد', color: 'text-gray-400 bg-gray-50', icon: ServerOff } 
    };

    const backupStatusMap: Record<string, { label: string, color: string, icon: any }> = { 
        success: { label: 'ناجح', color: 'text-emerald-600 bg-emerald-50', icon: Database }, 
        failed: { label: 'فشل', color: 'text-red-600 bg-red-50', icon: AlertOctagon }, 
        pending: { label: 'قيد الانتظار', color: 'text-orange-600 bg-orange-50', icon: Clock }, 
        not_performed: { label: 'لم يتم', color: 'text-gray-400 bg-gray-50', icon: CloudOff } 
    };

    const handlePrint = () => {
        setTimeout(() => window.print(), 300);
    };

    const handleWhatsAppShare = () => {
        const confirmMsg = "لمشاركة التقرير كملف PDF، يجب أولاً تحميله (طباعة -> حفظ كـ PDF) ثم إرساله يدوياً عبر واتساب.\n\nهل ترغب بفتح واتساب الآن؟";
        if (confirm.apply(null, [confirmMsg] as any)) {
             window.open(`https://wa.me/`, '_blank');
        }
    };

    const efficiencyLabel = content.efficiency === 'high' ? 'عالية' : content.efficiency === 'medium' ? 'متوسطة' : 'منخفضة';

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-center overflow-y-auto">
            {/* FIXED CONTROLS */}
            <div className="fixed top-6 left-6 flex gap-4 print:hidden z-[210]">
                <button onClick={handlePrint} className="bg-[#0c2444] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#0a1f3b] transition-all flex items-center gap-2 cursor-pointer">
                    <Printer size={18} /> طباعة / PDF
                </button>
                <button onClick={handleWhatsAppShare} className="bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 transition-all flex items-center gap-2 cursor-pointer">
                    <Share2 size={18} /> واتساب
                </button>
                <button onClick={onClose} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-700 transition-all flex items-center gap-2 border-2 border-white/20 cursor-pointer">
                    <X size={18} /> إغلاق
                </button>
            </div>

            {/* A4 PAPER CONTAINER */}
            <div className="min-h-full w-full flex items-start justify-center p-4 py-20 print:p-0 print:py-0 print:block">
                <div className="transform scale-[0.85] origin-top shadow-2xl print:scale-100 print:shadow-none print:transform-none">
                    <div id="invoice-print-area" className="bg-[#fcfcfc] w-[210mm] min-h-[297mm] h-auto relative shadow-2xl mx-auto text-[#1e293b] font-sans flex flex-col overflow-hidden print:w-full print:h-auto print:absolute print:top-0 print:left-0 print:m-0" dir="rtl">
                        
                        {/* 1. HEADER SECTION */}
                        <div className="p-12 pb-6 bg-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0c2444] to-[#0071e3]"></div>
                            <div className="flex justify-between items-start mb-12 relative z-10">
                                {/* Left: Logo */}
                                <div className="w-1/3">
                                    {customLogoData ? (
                                        <img src={customLogoData} alt="Logo" className="max-h-24 object-contain object-right" />
                                    ) : (
                                        <h1 className="text-6xl font-black text-[#0c2444] tracking-tighter">Ctrl <span className="text-[#0071e3]">z</span></h1>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-bold">IT Ecosystem & Support</p>
                                </div>

                                {/* Right: Report Title */}
                                <div className="w-2/3 text-left flex flex-col items-end">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-mono text-gray-400 uppercase">REF: {report.id.substring(0, 8).toUpperCase()}</span>
                                        <span className={`text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider ${isIncident ? 'bg-red-500' : isVisitLog ? 'bg-purple-600' : 'bg-[#8b5cf6]'}`}>
                                            {isVisitLog ? 'VISIT REPORT' : isIncident ? 'INCIDENT REPORT' : 'MONTHLY AUDIT'}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-[#0c2444] mb-2 text-right leading-tight whitespace-nowrap">{content.summary || 'تقرير فني شامل'}</h2>
                                    <p className="text-gray-500 text-sm font-medium text-right max-w-sm">
                                        {isMonthly ? 'تقرير شامل يغطي جميع الأنشطة والمهام المنجزة خلال الشهر.' : isIncident ? 'تقرير تفصيلي حول الحادثة الطارئة والحلول المنفذة.' : 'تقرير يوثق تفاصيل الزيارة الميدانية والمهام المنجزة.'}
                                    </p>
                                </div>
                            </div>

                            {/* Metadata Row */}
                            <div className="bg-[#f8fafc] rounded-2xl p-6 grid grid-cols-4 gap-4 border border-gray-100">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">العميل</p>
                                    <h4 className="font-bold text-[#0c2444] text-sm">{report.clientId}</h4>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">التاريخ</p>
                                    <h4 className="font-bold text-[#0c2444] text-sm flex items-center gap-2">
                                        <Calendar size={14} className="text-[#0071e3]"/>
                                        {new Date(report.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h4>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">الفني</p>
                                    <h4 className="font-bold text-[#0c2444] text-sm flex items-center gap-2">
                                        <User size={14} className="text-[#0071e3]"/>
                                        {content.technician_name || 'فريق الدعم الفني'}
                                    </h4>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">مدة العمل</p>
                                    <h4 className="font-bold text-[#0c2444] text-sm flex items-center gap-2">
                                        <Clock size={14} className="text-[#0071e3]"/>
                                        {content.duration || 'غير محدد'}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* 2. CREATIVE STATUS INDICATORS (Only for Monthly/Visit Reports) */}
                        {!isIncident && (
                            <div className="px-12 py-4">
                                <div className="grid grid-cols-4 gap-6">
                                    {/* Score Circular Infographic */}
                                    <div className="col-span-1 flex flex-col items-center justify-center">
                                        <div className="relative w-36 h-36 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#0071e3 ${score}%, #e2e8f0 0)` }}></div>
                                            <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black text-[#0c2444]">{score}%</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">صحة النظام</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Server Status */}
                                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-full h-1 ${sysStatusMap[content.system_status]?.color.split(' ')[0].replace('text-', 'bg-') || 'bg-gray-400'}`}></div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${sysStatusMap[content.system_status]?.color || 'bg-gray-100 text-gray-500'}`}>
                                            <Server size={24}/>
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 mb-1">حالة السيرفر</p>
                                        <h4 className="text-lg font-black text-[#0c2444]">{sysStatusMap[content.system_status]?.label || content.system_status}</h4>
                                    </div>

                                    {/* Backup Status */}
                                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-full h-1 ${backupStatusMap[content.backup_status]?.color.split(' ')[0].replace('text-', 'bg-') || 'bg-gray-400'}`}></div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${backupStatusMap[content.backup_status]?.color || 'bg-gray-100 text-gray-500'}`}>
                                            <Database size={24}/>
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 mb-1">النسخ الاحتياطي</p>
                                        <h4 className="text-lg font-black text-[#0c2444]">{backupStatusMap[content.backup_status]?.label || content.backup_status}</h4>
                                    </div>

                                    {/* Efficiency */}
                                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-full h-1 ${content.efficiency === 'high' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${content.efficiency === 'high' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                            <Activity size={24}/>
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 mb-1">كفاءة الأداء</p>
                                        <h4 className="text-lg font-black text-[#0c2444]">{efficiencyLabel}</h4>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. MAIN CONTENT (Split) */}
                        <div className="px-12 py-6 grid grid-cols-12 gap-8 flex-1">
                            
                            {/* LEFT COLUMN (Recs & Details) */}
                            <div className="col-span-5 space-y-6">
                                
                                {/* Recommendations */}
                                {((notesList.length > 0) || (content.prevention)) && (
                                    <div className="bg-[#fffbeb] rounded-[2rem] p-8 border border-[#fef3c7] relative overflow-hidden">
                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#fcd34d] opacity-20 rounded-full"></div>
                                        <h3 className="text-lg font-black text-[#92400e] mb-6 flex items-center gap-3 relative z-10">
                                            <Zap size={20} className="fill-[#d97706] text-[#d97706]"/> {isIncident ? 'إجراءات الوقاية' : 'التوصيات الفنية'}
                                        </h3>
                                        <ul className="space-y-4 relative z-10">
                                            {isIncident && content.prevention && (
                                                <li className="flex gap-3 items-start text-sm font-bold text-[#b45309]">
                                                    <div className="mt-1 w-6 h-6 rounded-full bg-[#fde68a] text-[#b45309] flex items-center justify-center shrink-0 text-xs">1</div>
                                                    <span className="leading-relaxed">{content.prevention}</span>
                                                </li>
                                            )}
                                            {notesList.map((t: string, i: number) => (
                                                <li key={i} className="flex gap-3 items-start text-sm font-bold text-[#b45309]">
                                                    <div className="mt-1 w-6 h-6 rounded-full bg-[#fde68a] text-[#b45309] flex items-center justify-center shrink-0 text-xs">{i + (content.prevention ? 2 : 1)}</div>
                                                    <span className="leading-relaxed">{t.replace(/^-\s*/, '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Pending Tasks (If any) */}
                                {pendingList.length > 0 && (
                                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-200">
                                        <h3 className="text-sm font-black text-gray-500 mb-4 flex items-center gap-2">
                                            <Clock size={18}/> مهام مؤجلة / قيد الانتظار
                                        </h3>
                                        <ul className="space-y-3">
                                            {pendingList.map((t: string, i: number) => (
                                                <li key={i} className="flex gap-3 items-center text-xs font-bold text-gray-500 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0"></div>
                                                    <span>{t.replace(/^-\s*/, '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            </div>

                            {/* RIGHT COLUMN (Tasks & Achievements) */}
                            <div className="col-span-7 space-y-8">
                                
                                {/* A. Tasks / Achievements - HIDDEN FOR INCIDENTS */}
                                {(!isIncident && (isVisitLog || isMonthly)) && (
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0c2444] mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#e0f2fe] text-[#0284c7] rounded-xl flex items-center justify-center">
                                                {isMonthly ? <Layers size={20}/> : <ClipboardList size={20}/>}
                                            </div>
                                            {isMonthly ? 'أبرز الإنجازات والأنشطة' : 'المهام المنجزة خلال الزيارة'}
                                        </h3>
                                        
                                        {tasksList.length > 0 ? (
                                            <div className="space-y-3">
                                                {tasksList.map((t: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-100 hover:shadow-md transition-all">
                                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0 border border-green-200">
                                                            <Check size={14} className="text-green-600" strokeWidth={3}/>
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-700 leading-relaxed">{t.replace(/^-\s*/, '')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <FileText size={32} className="text-gray-300 mx-auto mb-2"/>
                                                <p className="text-gray-400 text-sm font-bold">لا توجد مهام مسجلة</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* B. Incident Details (If Incident) */}
                                {isIncident && (
                                    <div>
                                        <h3 className="text-xl font-bold text-red-700 mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                                <AlertTriangle size={20}/> 
                                            </div>
                                            تفاصيل الحادثة
                                        </h3>
                                        
                                        <div className="bg-white p-6 rounded-[2rem] border-l-4 border-l-red-500 border border-gray-100 shadow-sm mb-6">
                                            <p className="text-sm font-bold text-[#0c2444] leading-relaxed">
                                                {content.incident_details || 'لا توجد تفاصيل.'}
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><Search size={14}/> السبب الجذري</h4>
                                                <p className="text-sm font-bold text-[#0c2444]">{content.root_cause || '-'}</p>
                                            </div>
                                            <div className="bg-green-50 p-6 rounded-3xl border border-green-200">
                                                <h4 className="text-xs font-bold text-green-600 uppercase mb-2 flex items-center gap-2"><Wrench size={14}/> الحل المنفذ</h4>
                                                <p className="text-sm font-bold text-green-900">{content.resolution || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* LICENSES SECTION (Detailed for Print) */}
                                {!isIncident && (activeLicenses.length > 0 || expiringLicenses.length > 0 || expiredLicenses.length > 0) && (
                                    <div className="bg-white rounded-[2rem] p-6 border border-gray-200 mt-6 shadow-sm">
                                        <h3 className="font-bold text-[#0c2444] text-sm border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                                            <Shield size={18}/> حالة التراخيص والموظفين
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {activeLicenses.length > 0 && (
                                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                                    <p className="text-[10px] font-bold text-green-700 mb-2 uppercase tracking-wide">سارية المفعول (Active)</p>
                                                    <ul className="space-y-1">
                                                        {activeLicenses.map((l: string, i: number) => <li key={i} className="text-xs text-green-900 font-bold">• {l}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {expiringLicenses.length > 0 && (
                                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                    <p className="text-[10px] font-bold text-orange-700 mb-2 uppercase tracking-wide">تنتهي قريباً (Expiring)</p>
                                                    <ul className="space-y-1">
                                                        {expiringLicenses.map((l: string, i: number) => <li key={i} className="text-xs text-orange-900 font-bold">• {l}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {expiredLicenses.length > 0 && (
                                                <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                                    <p className="text-[10px] font-bold text-red-700 mb-2 uppercase tracking-wide">منتهية (Expired)</p>
                                                    <ul className="space-y-1">
                                                        {expiredLicenses.map((l: string, i: number) => <li key={i} className="text-xs text-red-900 font-bold">• {l}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Warnings if any */}
                                {warningsList.length > 0 && (
                                    <div className="bg-red-50 rounded-[2rem] p-6 border border-red-100 mt-6">
                                        <h3 className="font-bold text-red-800 text-sm mb-4 flex items-center gap-2">
                                            <AlertOctagon size={18}/> ملاحظات حرجة ومخاطر
                                        </h3>
                                        <ul className="space-y-3">
                                            {warningsList.map((t: string, i: number) => (
                                                <li key={i} className="flex gap-3 items-start text-sm text-red-900">
                                                    <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                                                    <span className="leading-relaxed font-bold">{t}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto bg-[#0c2444] text-white p-8 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071e3] opacity-20 rounded-full blur-[60px] pointer-events-none"></div>
                            <div className="relative z-10">
                                <p className="font-bold text-sm">Ctrl Z Information Technology</p>
                                <p className="text-[10px] text-blue-200 mt-1">King Abdullah II St, Amman, Jordan</p>
                            </div>
                            <div className="text-right relative z-10">
                                <p className="font-bold text-sm dir-ltr">www.ctrlz.jo</p>
                                <p className="text-[10px] text-blue-200 mt-1">+962 7 8887 7285</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

const ReportsView: React.FC<ReportsViewProps> = ({ reports, t }) => {
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    return (
        <div className="space-y-8">
            <AnimatePresence>
                {selectedReport && (
                    <ReportPrintModal report={selectedReport} onClose={() => setSelectedReport(null)} />
                )}
            </AnimatePresence>

            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#0c2444] flex items-center gap-2">
                        <FileBarChart size={24} className="text-[#0071e3]"/> {t.client.reports.title}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 text-gray-400">
                            <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                            <p className="font-bold text-lg">لا توجد تقارير متاحة</p>
                            <p className="text-sm">لم يصدر أي تقرير فني بعد.</p>
                        </div>
                    ) : (
                        reports.map((report) => {
                            const isMonthly = report.type === 'monthly_technical';
                            const isIncident = report.type === 'incident';
                            return (
                                <motion.div 
                                    key={report.id}
                                    layout
                                    className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer group"
                                    onClick={() => setSelectedReport(report)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isIncident ? 'bg-red-50 text-red-600' : isMonthly ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {isIncident ? <AlertTriangle size={24}/> : isMonthly ? <FileBarChart size={24}/> : <ClipboardList size={24}/>}
                                        </div>
                                        <span className="text-[10px] bg-gray-50 text-gray-500 px-3 py-1 rounded-full font-bold font-mono">
                                            {new Date(report.createdAt).toLocaleDateString('ar-EG')}
                                        </span>
                                    </div>
                                    
                                    <h4 className="font-bold text-[#0c2444] text-lg mb-1">
                                        {isMonthly ? 'التقرير الشهري' : isIncident ? 'تقرير زيارة طارئة' : 'تقرير زيارة ميدانية'}
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-6 font-medium">
                                        {report.month}
                                    </p>
                                    
                                    <div className="flex items-center text-sm font-bold text-[#0071e3] group-hover:gap-2 transition-all">
                                        عرض التفاصيل <ArrowRight size={16} className="rtl:rotate-180"/>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
