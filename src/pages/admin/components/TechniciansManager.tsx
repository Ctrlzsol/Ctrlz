
import React, { useState } from 'react';
import { Wrench, Plus, Edit, Trash2, Loader2, X, User, Phone, Key, Search, ChevronRight, Shield, CheckSquare, Square, CreditCard, FileText, Settings, LayoutDashboard, Fingerprint, Calendar, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnician } from '../../../modules/technicians/context';
import { useClientData } from '../../../modules/clients/context';
import { Technician } from '../../../core/types';

const TechniciansManager: React.FC = () => {
    const { technicians, addTechnician, updateTechnician, deleteTechnician, isLoading } = useTechnician();
    const { clients, updateClient } = useClientData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState<Technician | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', credential: '', permissions: [] as string[] });
    const [isProcessing, setIsProcessing] = useState(false);
    
    // State for client assignments
    const [assignedClientIds, setAssignedClientIds] = useState<Set<string>>(new Set());
    const [clientSearch, setClientSearch] = useState('');

    // UPDATED PERMISSIONS LIST
    const AVAILABLE_SCREENS = [
        { id: 'visits', label: 'إدارة الزيارات والمهام', icon: LayoutDashboard },
        { id: 'notifications', label: 'شاشة التنبيهات', icon: Bell },
        { id: 'consultations', label: 'الاستشارات التقنية', icon: User },
        { id: 'financials', label: 'المركز المالي', icon: CreditCard },
        { id: 'reports', label: 'التقارير', icon: FileText },
        { id: 'settings', label: 'إعدادات النظام', icon: Settings },
    ];

    const openAddModal = () => {
        setIsEditing(null);
        setFormData({ name: '', phone: '', credential: '', permissions: ['visits'] }); // Default permission
        setAssignedClientIds(new Set());
        setIsModalOpen(true);
    };

    const openEditModal = (tech: Technician) => {
        setIsEditing(tech);
        setFormData({ 
            name: tech.name, 
            phone: tech.phone || '', 
            credential: tech.credential || '', 
            permissions: tech.permissions || ['visits'] 
        });
        const clientsForThisTech = clients.filter(c => c.assignedTechnicianId === tech.id).map(c => c.id);
        setAssignedClientIds(new Set(clientsForThisTech));
        setClientSearch('');
        setIsModalOpen(true);
    };

    const handleClientToggle = (clientId: string) => {
        setAssignedClientIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(clientId)) {
                newSet.delete(clientId);
            } else {
                newSet.add(clientId);
            }
            return newSet;
        });
    };

    const togglePermission = (screenId: string) => {
        setFormData(prev => {
            const perms = prev.permissions.includes(screenId)
                ? prev.permissions.filter(p => p !== screenId)
                : [...prev.permissions, screenId];
            return { ...prev, permissions: perms };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        let success = false;
        
        const payload = {
            name: formData.name,
            phone: formData.phone,
            credential: formData.credential,
            permissions: formData.permissions
        };

        if (isEditing) {
            success = await updateTechnician(isEditing.id, payload);

            const previouslyAssignedToThisTech = clients
                .filter(c => c.assignedTechnicianId === isEditing.id)
                .map(c => c.id);

            const promises: Promise<void>[] = [];

            for (const clientId of assignedClientIds) {
                const client = clients.find(c => c.id === clientId);
                if (client && client.assignedTechnicianId !== isEditing.id) {
                    promises.push(updateClient(clientId, { assignedTechnicianId: isEditing.id }));
                }
            }
            
            for (const clientId of previouslyAssignedToThisTech) {
                if (!assignedClientIds.has(clientId)) {
                    promises.push(updateClient(clientId, { assignedTechnicianId: null }));
                }
            }

            try {
                await Promise.all(promises);
            } catch (error) {
                console.error("Failed to update client assignments", error);
                success = false;
            }
        } else {
            success = await addTechnician(payload);
        }
        
        if (success) {
            setIsModalOpen(false);
        } else {
            alert('فشلت العملية. يرجى المحاولة مرة أخرى.');
        }
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الفني؟ سيتم إلغاء تعيينه من جميع العملاء.')) {
            await deleteTechnician(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-bold text-[#0c2444] flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Wrench size={24} /></div>
                        إدارة الفنيين
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 mr-16">إدارة حسابات الفريق التقني وصلاحياتهم</p>
                </div>
                <button onClick={openAddModal} className="bg-[#0c2444] text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-[#0a1f3b] shadow-lg shadow-blue-900/10 transition-all active:scale-95">
                    <Plus size={18} /> إضافة فني جديد
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {technicians.map(tech => {
                        const assignedClients = clients.filter(c => c.assignedTechnicianId === tech.id);
                        return (
                            <motion.div 
                                key={tech.id} 
                                initial={{opacity:0, y:20}}
                                animate={{opacity:1, y:0}}
                                className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                            >
                                {/* ID Badge Header */}
                                <div className="bg-[#f8fafc] p-6 border-b border-gray-50 relative">
                                    <div className="absolute top-4 left-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(tech)} className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl shadow-sm"><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(tech.id)} className="p-2 bg-white text-red-500 hover:bg-red-50 rounded-xl shadow-sm"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-white border-4 border-white shadow-md rounded-full flex items-center justify-center text-3xl font-black text-[#0c2444] mb-3">
                                            {tech.name.charAt(0)}
                                        </div>
                                        <h4 className="font-black text-lg text-[#0c2444]">{tech.name}</h4>
                                        <p className="text-xs text-[#0071e3] font-bold bg-blue-50 px-3 py-1 rounded-full mt-1">Technician</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Credentials */}
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <Fingerprint size={14}/> <span>ID Code</span>
                                        </div>
                                        <span className="font-mono font-bold text-[#0c2444] tracking-widest">{tech.credential || '---'}</span>
                                    </div>

                                    {/* Clients */}
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">العملاء المعينين</p>
                                        <div className="flex flex-wrap gap-1">
                                            {assignedClients.length > 0 ? assignedClients.slice(0, 3).map(c => (
                                                <span key={c.id} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 font-bold shadow-sm">{c.companyName}</span>
                                            )) : <span className="text-[10px] text-gray-400 italic">لا يوجد عملاء</span>}
                                            {assignedClients.length > 3 && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-bold">+{assignedClients.length - 3}</span>}
                                        </div>
                                    </div>

                                    {/* Permissions */}
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">الصلاحيات</p>
                                        <div className="flex flex-wrap gap-1">
                                            {(tech.permissions?.slice(0,2) || []).map(p => (
                                                <span key={p} className="text-[9px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 font-bold">{p}</span>
                                            ))}
                                            {(tech.permissions?.length || 0) > 2 && <span className="text-[9px] text-gray-400 px-1">...</span>}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* EDIT/ADD MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="bg-[#0c2444] p-6 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">{isEditing ? 'تعديل بيانات الفني' : 'إضافة فني جديد'}</h3>
                                    <p className="text-xs text-blue-200 mt-1">يرجى ملء البيانات بدقة لضمان سير العمل</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-[#0c2444] border-b border-gray-100 pb-2 mb-4">البيانات الشخصية</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500">الاسم الكامل</label>
                                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-[#0c2444]"/>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500">رقم الهاتف</label>
                                            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-[#0c2444]"/>
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-500">رمز الدخول (ID/Credential)</label>
                                            <div className="relative">
                                                <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                <input value={formData.credential} onChange={e => setFormData({...formData, credential: e.target.value})} className="w-full bg-blue-50 p-3 pr-10 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-200 transition-all font-mono font-bold text-[#0c2444] tracking-widest"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-[#0c2444] border-b border-gray-100 pb-2 mb-4">تعيين العملاء</h4>
                                        <div className="relative mb-3">
                                            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" placeholder="بحث عن عميل..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="w-full bg-white border border-gray-200 p-2.5 pr-9 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm"/>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            {clients.filter(c => c.companyName.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                                                <label key={client.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${assignedClientIds.has(client.id) ? 'bg-white border-blue-200 shadow-sm' : 'border-transparent hover:bg-white'}`}>
                                                    <span className="font-bold text-xs text-[#0c2444]">{client.companyName}</span>
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${assignedClientIds.has(client.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                                        {assignedClientIds.has(client.id) && <CheckSquare size={14} className="text-white"/>}
                                                    </div>
                                                    <input type="checkbox" checked={assignedClientIds.has(client.id)} onChange={() => handleClientToggle(client.id)} className="hidden"/>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-[#0c2444] border-b border-gray-100 pb-2 mb-4">صلاحيات النظام</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {AVAILABLE_SCREENS.map(screen => (
                                            <div 
                                                key={screen.id} 
                                                onClick={() => togglePermission(screen.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${formData.permissions.includes(screen.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-200'}`}
                                            >
                                                {formData.permissions.includes(screen.id) ? <CheckSquare size={18} className="shrink-0"/> : <Square size={18} className="shrink-0"/>}
                                                <span className="text-xs font-bold truncate">{screen.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>

                            <div className="p-6 border-t border-gray-100 bg-gray-50">
                                <button type="submit" onClick={handleSubmit} disabled={isProcessing} className="w-full bg-[#0c2444] text-white py-4 rounded-xl font-bold hover:bg-[#0a1f3b] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
                                    {isProcessing ? <Loader2 className="animate-spin"/> : (isEditing ? 'حفظ التعديلات' : 'إضافة الفني')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TechniciansManager;
