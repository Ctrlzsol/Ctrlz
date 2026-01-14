
import React, { useState, useMemo, useEffect } from 'react';
import { FileText, RefreshCw, Send, Printer, Building2, AlertTriangle, CheckCircle, FileBarChart, Eye, Calendar, User, Clock, TrendingUp, Zap, Server, Database, ClipboardList, MapPin, Activity, AlertOctagon, ArrowUpRight, Check, X, Shield, Cpu, ChevronLeft, Wrench, ServerOff, Share2, CloudOff, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientProfile, VisitTask } from '../../../core/types';
import { supabase } from '../../../lib/supabase';
import { useBooking } from '../../../modules/bookings/context';
import { useLogo } from '../../../core/contexts/LogoContext';

const ReportGenerator = ({ clients, t, visitTasks: allVisitTasks }: { clients: ClientProfile[], t: any, visitTasks: VisitTask[] }) => { 
    const { bookings } = useBooking();
    const { customLogoData } = useLogo();
    const [step, setStep] = useState(1); 
    const [selectedClient, setSelectedClient] = useState(''); 
    const [reportType, setReportType] = useState('monthly_technical'); 
    const [selectedVisitId, setSelectedVisitId] = useState('');
    
    const [includeRecommendations, setIncludeRecommendations] = useState(true);
    const [includeWarnings, setIncludeWarnings] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    const [durationHours, setDurationHours] = useState(2);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const minutesOptions = useMemo(() => Array.from({ length: 56 }, (_, i) => i + 5), []);

    const [formData, setFormData] = useState({ 
        summary: '', 
        healthScore: 95,
        technicianName: 'فريق Ctrl Z',
        visitLocation: '', 
        efficiency: 'high', 
        systemStatus: 'stable', 
        backupStatus: 'success', 
        visitsPerformed: '', 
        pendingTasks: '', 
        recommendations: '', 
        riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
        warnings: '', 
        keyAchievements: '',
        strategicRecommendations: '',
        incidentDetails: '',
        rootCause: '',
        resolution: '',
        prevention: '',
        // NEW LICENSE FIELDS
        licenseActive: '',
        licenseExpiring: '',
        licenseExpired: ''
    }); 
    
    const [isGenerating, setIsGenerating] = useState(false);
    
    const clientBookings = useMemo(() => {
        if (!selectedClient) return [];
        return bookings
            .filter(b => b.clientId === selectedClient && (b.status === 'completed' || b.status === 'confirmed' || b.status === 'pending'))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedClient, bookings]);

    const activeClient = useMemo(() => clients.find(c => c.id === selectedClient), [clients, selectedClient]);
    const clientBranches = useMemo(() => activeClient?.branches || [], [activeClient]);

    useEffect(() => {
        if (reportType === 'visit_log' && selectedVisitId) {
            const visitTasks = allVisitTasks.filter(task => task.bookingId === selectedVisitId);
            const booking = bookings.find(b => b.id === selectedVisitId);
            const completedTasks = visitTasks.filter(t => t.isCompleted || t.status === 'completed');
            const pendingTasks = visitTasks.filter(t => !t.isCompleted || t.status === 'postponed' || t.status === 'pending');
            const totalTasks = visitTasks.length;
            const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100;

            let autoTitle = '';
            let location = '';
            if (booking) {
                location = booking.branchName || ''; 
                const dateStr = new Date(booking.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
                autoTitle = `تقرير زيارة ميدانية - ${dateStr}`;
            }

            setFormData(prev => ({
                ...prev,
                summary: autoTitle, 
                visitLocation: location,
                healthScore: completionPercentage,
                efficiency: completionPercentage >= 80 ? 'high' : 'medium',
                systemStatus: 'stable',
                backupStatus: 'success',
                visitsPerformed: completedTasks.map(t => `- ${t.text}`).join('\n'), 
                pendingTasks: pendingTasks.map(t => `- ${t.text} (${t.status === 'postponed' ? 'مؤجلة' : 'قيد الانتظار'})`).join('\n'),
                recommendations: '',
                warnings: ''
            }));
            setDurationHours(2);
            setDurationMinutes(0);
        } else if (reportType === 'monthly_technical') {
             const now = new Date();
             const monthName = now.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
             
             // Auto-populate Monthly Tasks
             const currentMonth = now.getMonth();
             const currentYear = now.getFullYear();

             const monthlyTasks = allVisitTasks.filter(t => {
                 // Must belong to client
                 if (t.clientId !== selectedClient) return false;
                 // Must be completed
                 if (!t.isCompleted && t.status !== 'completed') return false;
                 
                 // Check Date (Either visitDate string or fallback)
                 let taskDate = new Date();
                 if (t.visitDate) taskDate = new Date(t.visitDate);
                 else if (t.bookingId) {
                     const b = bookings.find(bk => bk.id === t.bookingId);
                     if (b) taskDate = new Date(b.date);
                 }
                 
                 return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
             });

             const achievementsText = monthlyTasks.length > 0 
                ? monthlyTasks.map(t => `- ${t.text}`).join('\n')
                : 'تم إجراء الفحص الدوري لجميع الأنظمة.\nتحديث برمجيات الحماية.\nفحص النسخ الاحتياطي.';

             setFormData(prev => ({ 
                 ...prev, 
                 summary: `التقرير الفني الشهري - ${monthName}`, 
                 healthScore: 98, 
                 efficiency: 'high', 
                 systemStatus: 'stable', 
                 backupStatus: 'success', 
                 keyAchievements: achievementsText, 
                 pendingTasks: '', 
                 strategicRecommendations: '', 
                 warnings: '', 
                 recommendations: '',
                 licenseActive: 'Microsoft 365 - All Users\nAntivirus - All Devices',
                 licenseExpiring: '',
                 licenseExpired: ''
             }));
             setDurationHours(0); setDurationMinutes(0);
        } else if (reportType === 'incident') {
            const dateStr = new Date().toLocaleDateString('ar-EG');
            setFormData(prev => ({ ...prev, summary: `تقرير زيارة طارئة - ${dateStr}`, incidentDetails: '', rootCause: '', resolution: '', prevention: '', }));
            setDurationHours(1); setDurationMinutes(30);
        }
    }, [selectedVisitId, reportType, allVisitTasks, activeClient, bookings, clientBookings, selectedClient]);

    const handleSendReport = async () => { 
        setIsGenerating(true); 
        if (!activeClient) { alert('العميل غير محدد'); setIsGenerating(false); return; }
        const formattedDuration = durationMinutes > 0 ? `${durationHours} ساعة و ${durationMinutes} دقيقة` : `${durationHours} ساعة`;
        let reportContent: any = { 
            efficiency: formData.efficiency, system_status: formData.systemStatus, backup_status: formData.backupStatus,
            technician_name: formData.technicianName, duration: formattedDuration, visit_location: formData.visitLocation,
            healthScore: formData.healthScore, summary: formData.summary, pendingTasks: formData.pendingTasks,
            riskLevel: formData.riskLevel, warnings: includeWarnings ? formData.warnings : '',
            // NEW FIELDS IN DB JSON
            licenseActive: formData.licenseActive,
            licenseExpiring: formData.licenseExpiring,
            licenseExpired: formData.licenseExpired
        };
        if (reportType === 'visit_log') { reportContent = { ...reportContent, completed_tasks: formData.visitsPerformed, recommendations: includeRecommendations ? formData.recommendations : '' }; } 
        else if (reportType === 'monthly_technical') { reportContent = { ...reportContent, key_achievements: formData.keyAchievements, strategic_recommendations: includeRecommendations ? formData.strategicRecommendations : '' }; } 
        else if (reportType === 'incident') { reportContent = { ...reportContent, incident_details: formData.incidentDetails, root_cause: formData.rootCause, resolution: formData.resolution, prevention: formData.prevention }; }

        const { error } = await supabase.from('reports').insert([{ client_id: activeClient.id, month: new Date().toLocaleString('default', { month: 'long' }), type: reportType, content: reportContent, is_deleted: false }]);
        if (error) { alert('فشل إرسال التقرير: ' + error.message); } else { alert(`تم إرسال التقرير بنجاح إلى ${activeClient.companyName}.`); setStep(1); }
        setIsGenerating(false);
    }; 

    const parseList = (text: string) => (!text) ? [] : text.split('\n').filter(line => line.trim() !== '');

    const handlePrint = () => {
        setTimeout(() => window.print(), 300);
    };

    const handleWhatsAppShare = () => {
        const confirmMsg = "لمشاركة التقرير كملف PDF، يجب أولاً تحميله (طباعة -> حفظ كـ PDF) ثم إرساله يدوياً عبر واتساب.\n\nهل ترغب بفتح واتساب الآن؟";
        if (confirm.apply(null, [confirmMsg] as any)) {
             window.open(`https://wa.me/`, '_blank');
        }
    };

    // --- ENHANCED REPORT PREVIEW (INFOGRAPHIC STYLE) ---
    const ReportPreview = () => {
        const isVisitLog = reportType === 'visit_log';
        const isMonthly = reportType === 'monthly_technical';
        const isEmergency = reportType === 'incident';
        const tasksList = isVisitLog ? parseList(formData.visitsPerformed) : parseList(formData.keyAchievements);
        const pendingList = parseList(formData.pendingTasks);
        const notesList = isVisitLog ? parseList(formData.recommendations) : parseList(formData.strategicRecommendations);
        const warningsList = parseList(formData.warnings);
        const formattedDuration = durationMinutes > 0 ? `${durationHours} ساعة و ${durationMinutes} دقيقة` : `${durationHours} ساعة`;

        // Licenses Lists
        const activeLicenses = parseList(formData.licenseActive);
        const expiringLicenses = parseList(formData.licenseExpiring);
        const expiredLicenses = parseList(formData.licenseExpired);

        const getSystemStatus = (status: string) => {
            switch(status) {
                case 'stable': return { label: 'مستقر', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
                case 'critical': return { label: 'حرج', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
                case 'maintenance': return { label: 'تحت الصيانة', color: 'text-blue-600', bg: 'bg-blue-100', icon: Wrench };
                case 'no_server': return { label: 'لا يوجد سيرفر', color: 'text-gray-500', bg: 'bg-gray-100', icon: ServerOff };
                default: return { label: status, color: 'text-gray-600', bg: 'bg-gray-100', icon: Activity };
            }
        };

        const getBackupStatus = (status: string) => {
            switch(status) {
                case 'success': return { label: 'ناجح', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
                case 'failed': return { label: 'فشل', color: 'text-red-600', bg: 'bg-red-100', icon: AlertOctagon };
                case 'pending': return { label: 'قيد الانتظار', color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock };
                case 'not_performed': return { label: 'لا يوجد / لم يتم', color: 'text-gray-500', bg: 'bg-gray-100', icon: CloudOff };
                default: return { label: status, color: 'text-gray-600', bg: 'bg-gray-100', icon: Database };
            }
        };

        const sysStatus = getSystemStatus(formData.systemStatus);
        const backStatus = getBackupStatus(formData.backupStatus);

        return (
            <div id="invoice-print-area" className="bg-white w-[210mm] min-h-[297mm] h-auto relative shadow-2xl mx-auto text-[#1e293b] font-sans flex flex-col overflow-hidden" dir="rtl">
                
                {/* BIG BLUE HEADER - Updated to contain Logo & Metadata */}
                <div className="relative bg-[#0c2444] text-white pt-10 pb-12 px-12 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
                    <div className="relative z-10">
                        {/* Top Row: Big Logo & Title */}
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-1/2">
                                {customLogoData ? (
                                    <img src={customLogoData} alt="Logo" className="h-28 object-contain object-right brightness-0 invert drop-shadow-md" />
                                ) : (
                                    <h1 className="text-6xl font-black tracking-tighter">Ctrl <span className="text-[#0071e3]">z</span></h1>
                                )}
                                <p className="text-blue-200 mt-3 text-sm font-bold tracking-[0.3em] uppercase opacity-80">Tech Ecosystem</p>
                            </div>
                            <div className="w-1/2 text-left pt-2">
                                <span className={`inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 ${isEmergency ? 'bg-red-500 text-white' : 'bg-[#0071e3] text-white'}`}>
                                    {isEmergency ? 'EMERGENCY REPORT' : isMonthly ? 'MONTHLY REPORT' : 'VISIT REPORT'}
                                </span>
                                <h2 className="text-3xl font-black leading-tight mb-2 whitespace-nowrap">{formData.summary}</h2>
                                <p className="text-base text-blue-100 font-mono">{new Date().toLocaleDateString('ar-EG', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-4 gap-6 pt-6 border-t border-white/10">
                            {[
                                { label: 'العميل', value: activeClient?.companyName, icon: Building2 },
                                { label: 'الموقع', value: formData.visitLocation || 'المقر الرئيسي', icon: MapPin },
                                { label: 'المدة', value: formattedDuration, icon: Clock },
                                { label: 'الفني', value: formData.technicianName, icon: User }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-start gap-2">
                                    <div className="flex items-center gap-2 text-blue-300">
                                        <item.icon size={16} />
                                        <p className="text-[10px] font-bold uppercase tracking-wider">{item.label}</p>
                                    </div>
                                    <p className="font-bold text-white text-lg leading-tight truncate w-full">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CONTENT BODY */}
                <div className="p-12 flex-1 space-y-12">
                    
                    {/* INFOGRAPHIC SYSTEM STATUS */}
                    {!isEmergency && (
                        <div className="grid grid-cols-4 gap-8">
                            <div className="col-span-1 flex flex-col items-center justify-center">
                                <div className="relative w-40 h-40 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#0071e3 ${formData.healthScore}%, #f1f5f9 0)` }}></div>
                                    <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-[#0c2444]">{formData.healthScore}%</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">صحة النظام</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-span-3 grid grid-cols-3 gap-5">
                                <div className={`rounded-[2rem] p-6 border flex flex-col items-center justify-center text-center gap-3 ${sysStatus.bg} ${sysStatus.color.replace('text-', 'border-').replace('600', '200')}`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm`}>
                                        <sysStatus.icon size={28} className={sysStatus.color}/>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold opacity-60 mb-1">حالة السيرفر</p>
                                        <p className={`font-black text-xl ${sysStatus.color}`}>{sysStatus.label}</p>
                                    </div>
                                </div>

                                <div className={`rounded-[2rem] p-6 border flex flex-col items-center justify-center text-center gap-3 ${backStatus.bg} ${backStatus.color.replace('text-', 'border-').replace('600', '200')}`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm`}>
                                        <backStatus.icon size={28} className={backStatus.color}/>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold opacity-60 mb-1">النسخ الاحتياطي</p>
                                        <p className={`font-black text-xl ${backStatus.color}`}>{backStatus.label}</p>
                                    </div>
                                </div>

                                <div className={`rounded-[2rem] p-6 border flex flex-col items-center justify-center text-center gap-3 ${formData.efficiency === 'high' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm`}>
                                        <Activity size={28} className={formData.efficiency === 'high' ? 'text-blue-600' : 'text-gray-500'}/>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold opacity-60 mb-1">الكفاءة</p>
                                        <p className="font-black text-xl text-[#0c2444]">{formData.efficiency === 'high' ? 'عالية' : 'متوسطة'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MAIN REPORT SECTIONS */}
                    <div className="grid grid-cols-3 gap-10">
                        <div className="col-span-2 space-y-10">
                            {isEmergency && (
                                <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                                    <h3 className="text-red-800 font-bold mb-4 flex items-center gap-3 text-lg"><AlertTriangle size={24}/> تفاصيل المشكلة الطارئة</h3>
                                    <p className="text-base text-red-900 leading-relaxed font-medium">{formData.incidentDetails || 'لا يوجد تفاصيل'}</p>
                                    <div className="mt-8 grid grid-cols-2 gap-6">
                                        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm"><p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">السبب الجذري</p><p className="text-sm font-bold text-[#0c2444] leading-relaxed">{formData.rootCause}</p></div>
                                        <div className="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm"><p className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">الحل المنفذ</p><p className="text-sm font-bold text-green-800 leading-relaxed">{formData.resolution}</p></div>
                                    </div>
                                </div>
                            )}

                            {(!isEmergency && tasksList.length > 0) && (
                                <div>
                                    <h3 className="font-bold text-[#0c2444] text-xl mb-6 flex items-center gap-3">
                                        <div className="bg-blue-50 p-2 rounded-xl text-[#0071e3]"><ClipboardList size={24}/></div>
                                        {isMonthly ? 'أبرز الإنجازات والأنشطة' : 'المهام المنجزة'}
                                    </h3>
                                    <div className="space-y-4">
                                        {tasksList.map((t, i) => (
                                            <div key={i} className="flex items-start gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-blue-100 transition-colors">
                                                <div className="mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 border border-green-200"><CheckCircle size={14} className="text-green-600"/></div>
                                                <p className="text-base font-bold text-gray-700 leading-relaxed">{t.replace(/^-\s*/, '')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(notesList.length > 0) && (
                                <div>
                                    <h3 className="font-bold text-[#0c2444] text-xl mb-6 flex items-center gap-3">
                                        <div className="bg-yellow-50 p-2 rounded-xl text-yellow-600"><Zap size={24} className="fill-yellow-500"/></div>
                                        التوصيات والمقترحات
                                    </h3>
                                    <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-[2rem] p-8 relative overflow-hidden">
                                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-100 rounded-full opacity-50 blur-3xl"></div>
                                        <ul className="space-y-4 relative z-10">
                                            {notesList.map((n, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#92400e]">
                                                    <ArrowUpRight size={20} className="shrink-0 mt-0.5 bg-yellow-200 rounded-full p-0.5"/>
                                                    <span className="leading-relaxed text-base">{n.replace(/^-\s*/, '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 space-y-8">
                            <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
                                <h3 className="text-sm font-black text-[#0c2444] mb-5 uppercase tracking-wider flex items-center gap-2"><Shield size={16}/> حالة التراخيص</h3>
                                <div className="space-y-4">
                                    {/* Active */}
                                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                        <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-2"><CheckCircle size={12}/> سارية المفعول</p>
                                        <ul className="space-y-1">
                                            {activeLicenses.length > 0 ? activeLicenses.map((l, i) => <li key={i} className="text-xs text-green-800 font-medium">• {l}</li>) : <li className="text-[10px] text-gray-400">لا يوجد</li>}
                                        </ul>
                                    </div>
                                    {/* Expiring */}
                                    {expiringLicenses.length > 0 && (
                                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                            <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-2"><Clock size={12}/> تنتهي قريباً</p>
                                            <ul className="space-y-1">
                                                {expiringLicenses.map((l, i) => <li key={i} className="text-xs text-orange-800 font-medium">• {l}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Expired */}
                                    {expiredLicenses.length > 0 && (
                                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                            <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={12}/> منتهية</p>
                                            <ul className="space-y-1">
                                                {expiredLicenses.map((l, i) => <li key={i} className="text-xs text-red-800 font-medium">• {l}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {pendingList.length > 0 && (
                                <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200">
                                    <h3 className="text-sm font-black text-gray-500 mb-5 flex items-center gap-2 uppercase tracking-wider"><Clock size={18}/> مهام مؤجلة</h3>
                                    <ul className="space-y-4">{pendingList.map((t, i) => (<li key={i} className="text-sm font-bold text-gray-600 flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 shrink-0"></div><span className="leading-snug">{t.replace(/^-\s*/, '')}</span></li>))}</ul>
                                </div>
                            )}
                            {warningsList.length > 0 && (
                                <div className="bg-red-50 rounded-[2rem] p-6 border border-red-100">
                                    <h3 className="text-sm font-black text-red-700 mb-5 flex items-center gap-2 uppercase tracking-wider"><AlertOctagon size={18}/> مخاطر وملاحظات</h3>
                                    <ul className="space-y-4">{warningsList.map((w, i) => (<li key={i} className="text-sm font-bold text-red-800 flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div><span className="leading-snug">{w}</span></li>))}</ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#f8fafc] p-8 border-t border-gray-200 text-center relative z-10">
                    <p className="text-[#0c2444] font-black text-base mb-1">Ctrl Z Information Technology</p>
                    <p className="text-gray-400 text-xs font-mono tracking-widest">AMMAN, JORDAN • +962 7 8887 7285 • WWW.CTRLZ.JO</p>
                </div>
            </div>
        );
    };
    
    return ( 
        <div className="max-w-6xl mx-auto">
            {/* Steps & Header Omitted for brevity, logic remains same */}
            <div className="flex justify-between items-center mb-10 px-4">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-[#0c2444] text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <div className={`h-1 w-16 rounded-full transition-all ${step >= 2 ? 'bg-[#0c2444]' : 'bg-gray-200'}`}></div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-[#0c2444] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                </div>
                <h2 className="text-2xl font-bold text-[#0c2444]">منشئ التقارير الذكي</h2>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col relative">
                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-10 flex-1 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-center mb-8 text-gray-600">لمن تريد إرسال التقرير اليوم؟</h3>
                        <div className="max-w-md mx-auto w-full mb-8">
                            <label className="block text-sm font-bold text-gray-400 mb-2">اختر العميل</label>
                            <div className="relative">
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <select 
                                    className="w-full bg-[#f8fafc] border-2 border-transparent rounded-2xl py-4 pr-12 pl-4 text-lg font-bold text-[#0c2444] outline-none focus:border-blue-100 transition-all cursor-pointer shadow-inner"
                                    value={selectedClient} 
                                    onChange={(e) => {setSelectedClient(e.target.value); setSelectedVisitId('');}}
                                >
                                    <option value="">-- اختر من القائمة --</option>
                                    {clients.map(c => (<option key={c.id} value={c.id}>{c.companyName}</option>))}
                                </select>
                            </div>
                        </div>
                        {selectedClient && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[{ id: 'visit_log', label: 'تقرير زيارة', icon: ClipboardList, desc: 'توثيق مهام زيارة ميدانية روتينية.', color: 'bg-purple-50 text-purple-600 border-purple-100' }, { id: 'monthly_technical', label: 'تقرير شهري', icon: FileBarChart, desc: 'ملخص شامل، إحصائيات، وتراخيص.', color: 'bg-blue-50 text-blue-600 border-blue-100' }, { id: 'incident', label: 'تقرير زيارة طارئة', icon: AlertTriangle, desc: 'توثيق عطل طارئ، السبب، والحل.', color: 'bg-red-50 text-red-600 border-red-100' }].map((type) => (
                                    <button key={type.id} onClick={() => setReportType(type.id)} className={`p-6 rounded-[2rem] border-2 text-right transition-all group hover:shadow-lg ${reportType === type.id ? `border-current ${type.color} ring-2 ring-offset-2 ring-current` : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-xl ${reportType === type.id ? 'bg-white/50' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}><type.icon size={28} strokeWidth={1.5} /></div>
                                        <h4 className={`font-bold text-lg mb-2 ${reportType === type.id ? 'text-inherit' : 'text-[#0c2444]'}`}>{type.label}</h4>
                                        <p className={`text-xs font-medium leading-relaxed ${reportType === type.id ? 'opacity-80' : 'text-gray-400'}`}>{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {reportType === 'visit_log' && selectedClient && (
                             <div className="max-w-md mx-auto w-full mt-8 animate-in fade-in">
                                 <label className="block text-sm font-bold text-gray-400 mb-2">ربط بزيارة (لتعبئة العنوان والمهام)</label>
                                 <select className="w-full bg-white border border-gray-200 rounded-xl p-3 font-bold text-[#0c2444] outline-none" value={selectedVisitId} onChange={(e) => setSelectedVisitId(e.target.value)}>
                                     <option value="">-- إدخال يدوي --</option>
                                     {clientBookings.map(b => (<option key={b.id} value={b.id}>{b.date} - {b.time}</option>))}
                                 </select>
                             </div>
                        )}
                        <div className="mt-12 text-center">
                            <button onClick={() => setStep(2)} disabled={!selectedClient} className="bg-[#0c2444] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-900/20 hover:bg-[#0a1f3b] hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-3 mx-auto">التالي <ArrowUpRight className="rtl:rotate-180"/></button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setStep(1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100"><ChevronLeft className="rtl:rotate-180 text-gray-600"/></button>
                                <div>
                                    <h3 className="font-bold text-lg text-[#0c2444]">{activeClient?.companyName}</h3>
                                    <p className="text-xs text-gray-500 font-bold">{reportType === 'monthly_technical' ? 'تقرير شهري' : reportType === 'incident' ? 'تقرير زيارة طارئة' : 'تقرير زيارة'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowPreview(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2"><Eye size={16}/> معاينة</button>
                                <button onClick={handleSendReport} disabled={isGenerating} className="bg-[#0c2444] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#0a1f3b] flex items-center gap-2 shadow-lg">{isGenerating ? <RefreshCw className="animate-spin" size={16}/> : <Send size={16} className="rtl:rotate-180"/>} {isGenerating ? 'جاري الإرسال...' : 'إرسال التقرير'}</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="text-xs font-bold text-gray-400 block mb-2">عنوان التقرير</label>
                                        <input value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold text-sm outline-none text-[#0c2444]"/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 block mb-2">الفني المسؤول</label>
                                        <input value={formData.technicianName} onChange={e => setFormData({...formData, technicianName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold text-sm outline-none text-[#0c2444]"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-xs font-bold text-gray-400 block mb-2">ساعات</label><select value={durationHours} onChange={e => setDurationHours(parseInt(e.target.value))} className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold text-sm outline-none text-[#0c2444]">{[...Array(13).keys()].map(h => <option key={h} value={h}>{h} ساعات</option>)}</select></div>
                                        <div className="flex-1"><label className="text-xs font-bold text-gray-400 block mb-2">دقائق</label><select value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value))} className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold text-sm outline-none text-[#0c2444]"><option value={0}>0 دقيقة</option>{minutesOptions.map(m => <option key={m} value={m}>{m} دقيقة</option>)}</select></div>
                                    </div>
                                    
                                    {(reportType !== 'monthly_technical') && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 block mb-2">الموقع</label>
                                            <select 
                                                value={formData.visitLocation} 
                                                onChange={e => setFormData({...formData, visitLocation: e.target.value})} 
                                                className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold text-sm outline-none text-[#0c2444]"
                                            >
                                                <option value="" disabled>اختر الفرع</option>
                                                {clientBranches.length > 0 ? (
                                                    clientBranches.map(branch => (
                                                        <option key={branch.id} value={branch.name}>{branch.name}</option>
                                                    ))
                                                ) : (
                                                    <option value="المقر الرئيسي (افتراضي)">لا توجد فروع مسجلة</option>
                                                )}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                    {reportType === 'incident' ? (
                                        <>
                                            <div><label className="text-sm font-bold text-[#0c2444] mb-2 block">وصف المشكلة (Emergency)</label><textarea rows={3} value={formData.incidentDetails} onChange={e => setFormData({...formData, incidentDetails: e.target.value})} className="w-full bg-red-50 border-red-100 p-4 rounded-xl text-sm font-medium outline-none text-red-900"></textarea></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-sm font-bold text-[#0c2444] mb-2 block">السبب الجذري</label><textarea rows={3} value={formData.rootCause} onChange={e => setFormData({...formData, rootCause: e.target.value})} className="w-full bg-gray-50 border-gray-200 p-4 rounded-xl text-sm outline-none"></textarea></div>
                                                <div><label className="text-sm font-bold text-[#0c2444] mb-2 block">الحل المنفذ</label><textarea rows={3} value={formData.resolution} onChange={e => setFormData({...formData, resolution: e.target.value})} className="w-full bg-green-50 border-green-100 p-4 rounded-xl text-sm outline-none"></textarea></div>
                                            </div>
                                            <div><label className="text-sm font-bold text-[#0c2444] mb-2 block">إجراءات وقائية</label><textarea rows={2} value={formData.prevention} onChange={e => setFormData({...formData, prevention: e.target.value})} className="w-full bg-gray-50 border-gray-200 p-4 rounded-xl text-sm outline-none"></textarea></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                <div className="bg-gray-50 p-3 rounded-xl text-center"><label className="block text-xs text-gray-400 mb-1">التقييم (Health Score)</label><input type="number" value={formData.healthScore} onChange={e => setFormData({...formData, healthScore: parseInt(e.target.value)})} className="w-full text-center bg-transparent font-black text-xl"/></div>
                                                <div className="bg-gray-50 p-3 rounded-xl text-center"><label className="block text-xs text-gray-400 mb-1">حالة السيرفر</label><select value={formData.systemStatus} onChange={e => setFormData({...formData, systemStatus: e.target.value})} className="w-full text-center bg-transparent font-bold text-sm outline-none"><option value="stable">مستقر</option><option value="critical">حرج</option><option value="maintenance">تحت الصيانة</option><option value="no_server">لا يوجد / غير مطبق</option></select></div>
                                                <div className="bg-gray-50 p-3 rounded-xl text-center"><label className="block text-xs text-gray-400 mb-1">النسخ الاحتياطي</label><select value={formData.backupStatus} onChange={e => setFormData({...formData, backupStatus: e.target.value})} className="w-full text-center bg-transparent font-bold text-sm outline-none"><option value="success">ناجح</option><option value="failed">فشل</option><option value="pending">قيد الانتظار</option><option value="not_performed">لم يتم / غير مطبق</option></select></div>
                                                <div className="bg-gray-50 p-3 rounded-xl text-center"><label className="block text-xs text-gray-400 mb-1">الكفاءة</label><select value={formData.efficiency} onChange={e => setFormData({...formData, efficiency: e.target.value})} className="w-full text-center bg-transparent font-bold text-sm outline-none"><option value="high">عالية</option><option value="medium">متوسطة</option><option value="low">منخفضة</option></select></div>
                                            </div>
                                            
                                            {/* EXPANDED LICENSE SECTION */}
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                                <h4 className="font-bold text-[#0c2444] text-sm border-b border-gray-200 pb-2 mb-2 flex items-center gap-2"><Shield size={16}/> حالة التراخيص والموظفين</h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-green-700 mb-2 block flex items-center gap-1"><CheckCircle size={12}/> تراخيص سارية (Active)</label>
                                                        <textarea rows={3} value={formData.licenseActive} onChange={e => setFormData({...formData, licenseActive: e.target.value})} className="w-full bg-white border border-green-100 p-2 rounded-xl text-xs font-medium outline-none resize-none text-[#0c2444]" placeholder="اكتب أسماء الموظفين أو البرامج..."></textarea>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-orange-600 mb-2 block flex items-center gap-1"><Clock size={12}/> تنتهي قريباً (Expiring)</label>
                                                        <textarea rows={3} value={formData.licenseExpiring} onChange={e => setFormData({...formData, licenseExpiring: e.target.value})} className="w-full bg-white border border-orange-100 p-2 rounded-xl text-xs font-medium outline-none resize-none text-[#0c2444]" placeholder="تراخيص ستنتهي هذا الشهر..."></textarea>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-red-600 mb-2 block flex items-center gap-1"><AlertTriangle size={12}/> منتهية (Expired)</label>
                                                        <textarea rows={3} value={formData.licenseExpired} onChange={e => setFormData({...formData, licenseExpired: e.target.value})} className="w-full bg-white border border-red-100 p-2 rounded-xl text-xs font-medium outline-none resize-none text-[#0c2444]" placeholder="تراخيص منتهية يجب تجديدها..."></textarea>
                                                    </div>
                                                </div>
                                            </div>

                                            <div><label className="text-sm font-bold text-[#0c2444] mb-2 block">{reportType === 'visit_log' ? 'المهام المنجزة (كل مهمة في سطر)' : 'ملخص الأنشطة والإنجازات (شامل)'}</label><textarea rows={6} value={reportType === 'visit_log' ? formData.visitsPerformed : formData.keyAchievements} onChange={e => reportType === 'visit_log' ? setFormData({...formData, visitsPerformed: e.target.value}) : setFormData({...formData, keyAchievements: e.target.value})} className="w-full bg-gray-50 border-gray-200 p-4 rounded-xl text-sm font-medium outline-none resize-none leading-relaxed"></textarea></div>
                                            <div><label className="text-sm font-bold text-[#0c2444] mb-2 block">مهام مؤجلة / معلقة</label><textarea rows={3} value={formData.pendingTasks} onChange={e => setFormData({...formData, pendingTasks: e.target.value})} className="w-full bg-gray-50 border-gray-200 p-4 rounded-xl text-sm font-medium outline-none resize-none leading-relaxed"></textarea></div>
                                            <div><label className="text-sm font-bold text-[#0c2444] mb-2 block">التوصيات</label><textarea rows={4} value={reportType === 'visit_log' ? formData.recommendations : formData.strategicRecommendations} onChange={e => reportType === 'visit_log' ? setFormData({...formData, recommendations: e.target.value}) : setFormData({...formData, strategicRecommendations: e.target.value})} className="w-full bg-gray-50 border-gray-200 p-4 rounded-xl text-sm font-medium outline-none resize-none leading-relaxed"></textarea></div>
                                            <div><label className="text-sm font-bold text-red-600 mb-2 block flex items-center gap-2"><AlertTriangle size={14}/> ملاحظات حرجة / تحذيرات</label><textarea rows={2} value={formData.warnings} onChange={e => setFormData({...formData, warnings: e.target.value})} className="w-full bg-red-50 border-red-100 p-4 rounded-xl text-sm font-medium outline-none resize-none leading-relaxed text-red-800 placeholder-red-300" placeholder="اختياري..."></textarea></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {showPreview && <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-center overflow-y-auto"><div className="fixed top-6 left-6 z-[210] flex gap-3 print:hidden"><button onClick={handlePrint} className="bg-[#0c2444] text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-[#0a1f3b] flex items-center gap-2 cursor-pointer"><Printer size={18}/> طباعة</button><button onClick={handleWhatsAppShare} className="bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-green-600 flex items-center gap-2 cursor-pointer"><Share2 size={18}/> عبر واتساب</button><button onClick={() => setShowPreview(false)} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-red-700 cursor-pointer">إغلاق</button></div><div className="min-h-full w-full flex items-start justify-center p-8 pt-20"><div className="transform scale-[0.85] origin-top shadow-2xl"><ReportPreview /></div></div></div>}
            </AnimatePresence>
        </div> 
    ); 
};

export default ReportGenerator;
