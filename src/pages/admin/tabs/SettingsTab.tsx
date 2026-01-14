
import React, { useState, useEffect } from 'react';
import { ImageIcon, Upload, AlertTriangle, Loader2, Trash2, Save, CheckCircle, Maximize, Minus, Plus, Users, Key, Shield, CheckSquare, Square, Smartphone, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientData } from '../../../modules/clients/context';
import { useLogo } from '../../../core/contexts/LogoContext';
import { supabase } from '../../../lib/supabase';
import { SystemUser } from '../../../core/types';

const SettingsTab: React.FC = () => {
    const { clients, deleteClient } = useClientData();
    const { customLogoData, logoScale, saveLogoSettings, resetLogo } = useLogo();
    
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Local state for previewing before save
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);
    const [previewScale, setPreviewScale] = useState<number>(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- System Users State ---
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', access_code: '', permissions: [] as string[] });
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // --- WhatsApp Settings State ---
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

    const AVAILABLE_SCREENS = [
        { id: 'dashboard', label: 'لوحة التحكم' },
        { id: 'notifications', label: 'التنبيهات' },
        { id: 'calendar', label: 'التقويم' },
        { id: 'tasks', label: 'المهام' },
        { id: 'clients', label: 'العملاء' },
        { id: 'technicians', label: 'الفنيين' },
        { id: 'support', label: 'الدعم الفني' },
        { id: 'consultations', label: 'الاستشارات' },
        { id: 'orders', label: 'طلبات الإضافة' },
        { id: 'billing', label: 'الفوترة' },
        { id: 'financials', label: 'المركز المالي' },
        { id: 'reports', label: 'التقارير' },
        { id: 'settings', label: 'الإعدادات' },
    ];

    // Sync preview with current context on load & Fetch WhatsApp Settings
    useEffect(() => {
        setPreviewLogo(customLogoData);
        setPreviewScale(logoScale);
        fetchWhatsAppSettings();
        fetchSystemUsers();
    }, [customLogoData, logoScale]);

    const fetchWhatsAppSettings = async () => {
        try {
            const { data, error } = await supabase.from('system_settings').select('value').eq('id', 'whatsapp_notification_number').maybeSingle();
            if (!error && data) {
                setWhatsappNumber(data.value || '');
            }
        } catch (e) {
            console.error("Error fetching whatsapp settings", e);
        }
    };

    const fetchSystemUsers = async () => {
        setIsLoadingUsers(true);
        const { data, error } = await supabase
            .from('system_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSystemUsers(data as SystemUser[]);
        }
        setIsLoadingUsers(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const file = e.target.files?.[0]; 
        if (file) { 
            if (file.size > 2 * 1024 * 1024) {
                alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميجابايت لضمان سرعة النظام.");
                return;
            }
            const reader = new FileReader(); 
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewLogo(base64String);
                setHasUnsavedChanges(true);
            };
            reader.readAsDataURL(file); 
        } 
    };

    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreviewScale(parseFloat(e.target.value));
        setHasUnsavedChanges(true);
    };

    const handleSaveLogo = async () => {
        if (previewLogo) {
            setIsSaving(true);
            await saveLogoSettings(previewLogo, previewScale);
            setIsSaving(false);
            setHasUnsavedChanges(false);
            alert("تم حفظ الشعار وإعدادات الحجم في قاعدة البيانات بنجاح.");
        }
    };

    const handleResetLogo = async () => {
        if(window.confirm('هل أنت متأكد من استعادة الشعار الافتراضي؟')) {
            setIsSaving(true);
            await resetLogo();
            setPreviewLogo(null);
            setPreviewScale(1);
            setIsSaving(false);
            setHasUnsavedChanges(false);
        }
    };

    const handleOpenConfirmModal = () => {
        if (!selectedClientId) { alert('يرجى اختيار عميل أولاً.'); return; }
        setIsConfirmModalOpen(true);
    };

    const handleDeleteClient = async () => {
        if (!selectedClientId) { alert('يرجى اختيار عميل أولاً.'); return; }
        setIsDeleting(true);
        try {
            const success = await deleteClient(selectedClientId);
            if (success) { setSelectedClientId(''); setIsConfirmModalOpen(false); }
        } catch (error) { console.error(error); alert('An unexpected error occurred in the UI layer.'); } 
        finally { setIsDeleting(false); }
    };

    const togglePermission = (screenId: string) => {
        setNewUserForm(prev => {
            const perms = prev.permissions.includes(screenId)
                ? prev.permissions.filter(p => p !== screenId)
                : [...prev.permissions, screenId];
            return { ...prev, permissions: perms };
        });
    };

    const handleAddSystemUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserForm.name || !newUserForm.access_code) return;
        setIsSaving(true);
        try {
            const payload = { name: newUserForm.name, access_code: newUserForm.access_code, permissions: newUserForm.permissions, is_deleted: false };
            const { data, error } = await supabase.from('system_users').insert([payload]).select().single();
            if (error) throw error;
            if (data) setSystemUsers(prev => [data, ...prev]); else await fetchSystemUsers();
            setIsUserModalOpen(false);
            setNewUserForm({ name: '', access_code: '', permissions: [] });
            alert("تم إضافة المستخدم بنجاح.");
        } catch (error: any) { alert("حدث خطأ: " + error.message); } 
        finally { setIsSaving(false); }
    };

    const handleDeleteSystemUser = async (userId: string) => {
        setSystemUsers(prev => prev.filter(u => u.id !== userId));
        try {
            const { error } = await supabase.from('system_users').delete().eq('id', userId);
            if (error) { console.error(error); fetchSystemUsers(); alert('حدث خطأ أثناء الحذف: ' + error.message); }
        } catch (err) { console.error(err); fetchSystemUsers(); }
    };

    const handleSaveWhatsapp = async () => {
        setIsSavingWhatsapp(true);
        try {
            // Robust upsert
            const { error } = await supabase.from('system_settings').upsert({ 
                id: 'whatsapp_notification_number', 
                value: whatsappNumber 
            }, { onConflict: 'id' });
            
            if (error) throw error;
            alert("تم حفظ رقم التنبيهات بنجاح. سيتم إرسال إشعارات العملاء لهذا الرقم.");
        } catch (err: any) {
            console.error("WhatsApp Save Error:", err);
            if (err.message?.includes("column") && err.message?.includes("value")) {
                alert("تنبيه: جدول قاعدة البيانات يحتاج لتحديث (إضافة عمود value). يرجى التواصل مع المطور.");
            } else {
                alert("فشل حفظ الرقم: " + err.message);
            }
        } finally {
            setIsSavingWhatsapp(false);
        }
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <h3 className="text-2xl font-bold text-[#0c2444] mb-6">إعدادات النظام</h3>
            
            {/* 1. Logo Configuration Section */}
            <div className="max-w-4xl bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#0c2444]">
                    <ImageIcon size={20} className="text-[#0071e3]"/> تكوين الشعار
                </h4>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-48 h-32 bg-[#f5f5f7] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                            {previewLogo ? (
                                <img src={previewLogo} alt="Preview" className="w-full h-full object-contain p-4 transition-transform duration-200" style={{ transform: `scale(${previewScale})` }} />
                            ) : (
                                <span className="text-xs text-gray-400 font-bold">معاينة الشعار</span>
                            )}
                            {hasUnsavedChanges && <div className="absolute top-2 right-2"><span className="bg-yellow-100 text-yellow-800 text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">غير محفوظ</span></div>}
                        </div>
                        {previewLogo && (
                            <div className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center text-xs text-gray-500 font-bold mb-2">
                                    <span className="flex items-center gap-1"><Minus size={12}/> تصغير</span>
                                    <span className="flex items-center gap-1"><Maximize size={12}/> حجم الشعار</span>
                                    <span className="flex items-center gap-1">تكبير <Plus size={12}/></span>
                                </div>
                                <input type="range" min="0.5" max="2.5" step="0.1" value={previewScale} onChange={handleScaleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0c2444]" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-4">
                        <p className="text-sm text-gray-500 mb-2 leading-relaxed">
                            قم برفع شعار المؤسسة هنا. سيتم تحويل الصورة وحفظها في قاعدة البيانات مباشرة لضمان ظهورها في الفواتير والداشبورد.
                            <br/>
                            <span className="text-xs text-orange-500 font-bold">ملاحظة: يفضل استخدام صور شفافة (PNG) بحجم أقل من 2MB.</span>
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <label htmlFor="logo-upload" className="cursor-pointer bg-white text-[#0c2444] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm">
                                <Upload size={16}/> <span>اختر صورة</span>
                            </label>
                            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/>
                            {previewLogo && (
                                <button onClick={handleSaveLogo} disabled={!hasUnsavedChanges || isSaving} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md ${hasUnsavedChanges ? 'bg-[#0c2444] text-white hover:bg-[#0a1f3b]' : 'bg-green-100 text-green-700 cursor-default'}`}>
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : (hasUnsavedChanges ? <Save size={16}/> : <CheckCircle size={16}/>)}
                                    {isSaving ? 'جاري الحفظ...' : (hasUnsavedChanges ? 'حفظ وتطبيق' : 'تم الحفظ')}
                                </button>
                            )}
                            {previewLogo && <button onClick={handleResetLogo} disabled={isSaving} className="px-4 py-2.5 text-red-500 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">استعادة الافتراضي</button>}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. WhatsApp Notification Settings */}
            <div className="max-w-4xl bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h4 className="font-bold text-lg flex items-center gap-2 text-[#0c2444]">
                            <BellRing size={20} className="text-green-500"/> إعدادات التنبيهات (Admin WhatsApp)
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                            ضع هنا رقم هاتفك الشخصي أو رقم الإدارة. عندما يقوم أي عميل بإجراء، سيقوم النظام بتوجيه رسالة واتساب تلقائية لهذا الرقم.
                        </p>
                    </div>
                </div>
                <div className="flex items-end gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                            <Smartphone size={14}/> رقم واتساب الإدارة (المستلم للتنبيهات)
                        </label>
                        <input 
                            type="text" 
                            dir="ltr"
                            placeholder="9627xxxxxxxx" 
                            value={whatsappNumber} 
                            onChange={e => setWhatsappNumber(e.target.value)} 
                            className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none font-mono font-bold text-[#0c2444] focus:ring-2 focus:ring-green-100"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">صيغة دولية بدون + (مثال: 962788877285)</p>
                    </div>
                    <button 
                        onClick={handleSaveWhatsapp}
                        disabled={isSavingWhatsapp}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSavingWhatsapp ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} حفظ الرقم
                    </button>
                </div>
            </div>

            {/* 3. System Users Management */}
            <div className="max-w-4xl bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg flex items-center gap-2 text-[#0c2444]">
                        <Users size={20} className="text-[#0071e3]"/> مستخدمي النظام والصلاحيات
                    </h4>
                    <button onClick={() => setIsUserModalOpen(true)} className="bg-[#0c2444] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#0a1f3b] transition-colors">
                        <Plus size={16}/> إضافة مستخدم
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                                <th className="py-3 px-2">الاسم</th>
                                <th className="py-3 px-2">رمز الدخول</th>
                                <th className="py-3 px-2">الصلاحيات</th>
                                <th className="py-3 px-2 w-16">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingUsers ? (
                                <tr><td colSpan={4} className="text-center py-4"><Loader2 className="animate-spin inline-block text-gray-300"/></td></tr>
                            ) : systemUsers.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-4 text-gray-400 text-sm">لا يوجد مستخدمين إضافيين.</td></tr>
                            ) : (
                                systemUsers.map(user => (
                                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-2 font-bold text-[#0c2444]">{user.name}</td>
                                        <td className="py-3 px-2 font-mono text-xs bg-gray-100 px-2 rounded w-fit">{user.access_code}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex flex-wrap gap-1">
                                                {user.permissions?.length > 0 ? (
                                                    user.permissions.includes('*') ? 
                                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">صلاحية كاملة</span> 
                                                    : user.permissions.slice(0, 3).map(p => (
                                                        <span key={p} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-100">
                                                            {AVAILABLE_SCREENS.find(s => s.id === p)?.label || p}
                                                        </span>
                                                    ))
                                                ) : <span className="text-gray-400 text-xs">لا يوجد صلاحيات</span>}
                                                {user.permissions?.length > 3 && <span className="text-[10px] text-gray-400 self-center">+{user.permissions.length - 3}</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => handleDeleteSystemUser(user.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                                title="حذف المستخدم"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Danger Zone Section */}
            <div className="max-w-4xl mt-8">
                <h4 className="text-xl font-bold text-[#0c2444] mb-4 flex items-center gap-2"><AlertTriangle className="text-red-500" /> منطقة الخطر</h4>
                <div className="bg-white border border-red-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    <h5 className="font-bold text-lg text-red-700 mb-2">حذف ملف عميل نهائياً</h5>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-2">اختر العميل للحذف</label>
                            <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full bg-[#f5f5f7] border-0 rounded-xl p-3 outline-none font-bold text-[#0c2444] focus:ring-2 focus:ring-red-200 cursor-pointer"><option value="">-- اختر العميل --</option>{clients.map(c => <option key={c.id} value={c.id}>{c.companyName} {c.id.startsWith('local') ? '(Local)' : ''}</option>)}</select>
                        </div>
                        <button type="button" onClick={handleOpenConfirmModal} disabled={!selectedClientId} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-red-200 min-w-[140px] justify-center cursor-pointer">
                            <Trash2 size={18} /> <span>حذف البيانات</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                        <motion.form 
                            onSubmit={handleAddSystemUser}
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <h3 className="text-xl font-bold text-[#0c2444] mb-6">إضافة مستخدم جديد</h3>
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">اسم المستخدم</label>
                                        <div className="relative">
                                            <Users size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                            <input required value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full bg-gray-50 p-3 pr-9 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100" placeholder="الاسم الكامل"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">رمز الدخول</label>
                                        <div className="relative">
                                            <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                            <input required value={newUserForm.access_code} onChange={e => setNewUserForm({...newUserForm, access_code: e.target.value})} className="w-full bg-gray-50 p-3 pr-9 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 font-mono" placeholder="كود سري"/>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-3 flex items-center gap-2"><Shield size={14}/> تحديد الصلاحيات والشاشات</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-60 overflow-y-auto">
                                        {AVAILABLE_SCREENS.map(screen => (
                                            <div 
                                                key={screen.id} 
                                                onClick={() => togglePermission(screen.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${newUserForm.permissions.includes(screen.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-200'}`}
                                            >
                                                {newUserForm.permissions.includes(screen.id) ? <CheckSquare size={18} className="shrink-0"/> : <Square size={18} className="shrink-0"/>}
                                                <span className="text-sm font-bold">{screen.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-auto">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">إلغاء</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-[#0c2444] text-white py-3 rounded-xl font-bold hover:bg-[#0a1f3b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} حفظ المستخدم
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Modal */}
            <AnimatePresence>
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[#0c2444] mb-2">تأكيد عملية الحذف</h3>
                            <p className="text-gray-500 mb-8">
                                هل أنت متأكد من رغبتك في حذف العميل المحدد نهائياً؟ 
                                <br />
                                سيتم حذف جميع البيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    onClick={handleDeleteClient} 
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={16} />}
                                    {isDeleting ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
export default SettingsTab;
