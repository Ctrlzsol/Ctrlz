
import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, X, Building2, Shield, Activity, Plus, Edit, Trash2, MapPin, Calendar as CalendarIcon, CheckCircle, Clock, Smartphone, AlertTriangle, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientProfile, ClientUser, Ticket as TicketType, Booking, VisitTask } from '../../../core/types';
import { PACKAGES } from '../../../core/constants';
import { useInvoice } from '../../../modules/billing/context';
import { useBooking } from '../../../modules/bookings/context';
import { useClientData } from '../../../modules/clients/context';
import { useLanguage } from '../../../core/contexts/LanguageContext';
import { StatusBadge } from '../../../ui/components/StatusBadge';
import { supabase } from '../../../lib/supabase'; 

const ClientDetailModal = ({ client, onClose, bookings, tickets, onUpdateClient, showNotification, onNavigateToBilling }: { 
    client: ClientProfile, 
    onClose: () => void, 
    bookings: Booking[], 
    tickets: TicketType[],
    onUpdateClient: (id: string, updates: Partial<ClientProfile>) => Promise<void>,
    showNotification: (message: string) => void,
    onNavigateToBilling: (clientId: string) => void
}) => {
    const { invoices } = useInvoice();
    const { visitTasks, addTask } = useBooking();
    const { clients, refreshClients } = useClientData();
    const { t } = useLanguage();

    const liveClient = useMemo(() => {
        return clients.find(c => c.id === client.id) || client;
    }, [clients, client]);

    const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'team' | 'branches' | 'checklist' | 'finance'>('overview');
    
    const clientInvoices = invoices.filter(i => i.clientId === liveClient.id);
    const clientBookings = bookings.filter(b => b.clientId === liveClient.id);
    const clientTickets = tickets.filter(t => t.clientId === liveClient.id);
    const clientTasks = visitTasks.filter(t => t.clientId === liveClient.id);
    
    const [teamUserForm, setTeamUserForm] = useState({ name: '', email: '', position: '', phone: '', anyDeskId: '' });
    const [showTeamUserForm, setShowTeamUserForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
    
    const [newTaskText, setNewTaskText] = useState('');
    const [selectedVisitForAdminTask, setSelectedVisitForAdminTask] = useState('');

    const packageInfo = PACKAGES.find(p => p.id === liveClient.packageId);
    const translatedPkgName = packageInfo ? (t.packages.items[packageInfo.name]?.name || packageInfo.name) : liveClient.packageId;

    const completedTasksCount = clientTasks.filter(t => t.isCompleted || t.status === 'completed').length;
    const pendingTasksCount = clientTasks.filter(t => !t.isCompleted && t.status === 'pending').length;
    const completedVisitsCount = clientBookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;

    const totalPendingAmount = useMemo(() => {
        return clientInvoices
            .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
    }, [clientInvoices]);

    const monthlySubscription = liveClient.netPrice ?? 0;

    const combinedHistory = useMemo(() => {
        const history = [
            ...clientBookings.map(b => ({ type: 'booking', date: b.date, item: b })),
            ...clientTickets.map(t => ({ type: 'ticket', date: t.date, item: t })),
            ...clientTasks.map(t => ({ type: 'task', date: t.visitDate || t.id, item: t }))
        ];
        return history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [clientBookings, clientTickets, clientTasks]);

    const handleAddOrEditUser = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        let updatedUsers = [...(liveClient.usersList || [])];
        
        if (editingUserId) {
            updatedUsers = updatedUsers.map(u => u.id === editingUserId ? { ...u, ...teamUserForm } : u);
        } else {
            const userToAdd: ClientUser = { id: `u-${Date.now()}`, clientId: liveClient.id, ...teamUserForm }; 
            updatedUsers.push(userToAdd);
        }
        
        await onUpdateClient(liveClient.id, { usersList: updatedUsers, activeUsers: updatedUsers.length }); 
        
        setTeamUserForm({ name: '', email: '', position: '', phone: '', anyDeskId: '' }); 
        setShowTeamUserForm(false);
        setEditingUserId(null);
    };

    const handleDeleteUser = async (e: React.MouseEvent, userId: string) => { 
        e.preventDefault(); 
        e.stopPropagation();
        
        const clientId = liveClient.id;
        setIsDeletingUser(userId);
        
        try {
            const { data, error: fetchError } = await supabase.from('clients').select('users_list').eq('id', clientId).single();
            if (fetchError) throw fetchError;

            let currentList = data.users_list;
            if (typeof currentList === 'string') {
                try { currentList = JSON.parse(currentList); } catch { currentList = []; }
            } else if (!Array.isArray(currentList)) {
                currentList = [];
            }

            const newList = currentList.filter((u: any) => String(u.id) !== String(userId));

            const { error: updateError } = await supabase.from('clients').update({ users_list: newList, active_users: newList.length }).eq('id', clientId);
            if (updateError) throw updateError;

            await refreshClients();
        } catch (err: any) {
            alert('خطأ: ' + err.message);
        } finally {
            setIsDeletingUser(null);
        }
    };

    const startEditUser = (user: ClientUser) => {
        setTeamUserForm({ name: user.name, email: user.email, position: user.position, phone: user.phone, anyDeskId: user.anyDeskId || '' });
        setEditingUserId(user.id);
        setShowTeamUserForm(true);
    };

    const tasksByVisit = useMemo(() => {
        const groups: Record<string, VisitTask[]> = {};
        visitTasks
            .filter(task => task.clientId === liveClient.id && (selectedVisitForAdminTask ? task.bookingId === selectedVisitForAdminTask : true))
            .forEach(task => {
                const booking = clientBookings.find(b => b.id === task.bookingId);
                const key = booking ? booking.date : 'مهام عامة / غير مجدولة';
                if (!groups[key]) groups[key] = [];
                groups[key].push(task);
            });
        return groups;
    }, [visitTasks, liveClient.id, clientBookings, selectedVisitForAdminTask]);

    const upcomingVisits = clientBookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.date) >= new Date());

    // Calculate percentage for visits circle
    const visitsPercentage = liveClient.totalVisits > 0 
        ? (liveClient.remainingVisits / liveClient.totalVisits) * 100 
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#f5f5f7] rounded-[2.5rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                
                {/* 1. PROFILE COVER & HEADER */}
                <div className="relative h-56 bg-[#0c2444] shrink-0 flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-[#0c2444]"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20 backdrop-blur-sm">
                        <X size={24} />
                    </button>

                    <div className="relative z-10 flex items-center gap-6 px-12 h-full">
                        <div className="w-32 h-32 bg-white rounded-3xl shadow-xl p-2 flex items-center justify-center border-4 border-white">
                            {liveClient.logo ? <img src={liveClient.logo} className="w-full h-full object-contain rounded-2xl"/> : <Building2 size={40} className="text-gray-300"/>}
                        </div>
                        <div className="text-white">
                            <h2 className="text-3xl font-black tracking-tight">{liveClient.companyName}</h2>
                            <p className="text-sm text-blue-200 mb-2">{liveClient.name} - {liveClient.referenceNumber}</p>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-sm"><Shield size={14}/> {translatedPkgName}</span>
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-sm ${liveClient.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    <Activity size={14}/> {liveClient.status === 'active' ? 'نشط' : 'معلق'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. NAVIGATION BAR */}
                <div className="bg-white border-b border-gray-200 px-12 pt-4 pb-0 flex gap-8 overflow-x-auto shrink-0 sticky top-0 z-10 shadow-sm">
                    {[{ id: 'overview', label: 'نظرة عامة' }, { id: 'history', label: 'السجل' }, { id: 'team', label: 'الفريق' }, { id: 'branches', label: 'الفروع' }, { id: 'checklist', label: 'المهام' }, { id: 'finance', label: 'المالية' }].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveSection(tab.id as any)} 
                            className={`pb-4 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${activeSection === tab.id ? 'border-[#0c2444] text-[#0c2444]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3. SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    
                    {/* SECTION: OVERVIEW */}
                    {activeSection === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-[#0c2444] mb-4 flex items-center gap-2"><Briefcase size={20} className="text-blue-600"/> بيانات الاتصال</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-2xl">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">المسؤول</p>
                                            <p className="font-bold text-[#0c2444]">{liveClient.name}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">البريد الإلكتروني</p>
                                            <p className="font-bold text-[#0c2444] truncate">{liveClient.email}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">الهاتف</p>
                                            <p className="font-bold text-[#0c2444]" dir="ltr">{liveClient.phone}</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                            <p className="text-xs text-blue-400 font-bold uppercase mb-1">رمز الدخول</p>
                                            <p className="font-mono font-black text-blue-700 text-lg tracking-widest">{liveClient.accessCode}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2"><CheckCircle size={24}/></div>
                                        <p className="text-2xl font-black text-[#0c2444]">{completedTasksCount}</p>
                                        <p className="text-xs font-bold text-gray-400">مهام منجزة</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2"><Clock size={24}/></div>
                                        <p className="text-2xl font-black text-[#0c2444]">{pendingTasksCount}</p>
                                        <p className="text-xs font-bold text-gray-400">مهام عالقة</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2"><MapPin size={24}/></div>
                                        <p className="text-2xl font-black text-[#0c2444]">{completedVisitsCount}</p>
                                        <p className="text-xs font-bold text-gray-400">زيارات تمت</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-[#0c2444] mb-4">رصيد الباقة</h3>
                                    <div className="space-y-6 text-center">
                                        
                                        {/* FIXED CIRCULAR PROGRESS - CSS Conic Gradient */}
                                        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                                            <div 
                                                className="absolute inset-0 rounded-full" 
                                                style={{ 
                                                    background: `conic-gradient(#3b82f6 ${visitsPercentage}%, #f3f4f6 0)` 
                                                }}
                                            ></div>
                                            <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black text-[#0c2444]">{liveClient.remainingVisits}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">زيارات متبقية</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-gray-500">تذاكر الدعم</span>
                                                <span className="text-[#0c2444]">{liveClient.remainingTickets} / {liveClient.totalTickets}</span>
                                            </div>
                                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${liveClient.totalTickets > 0 ? (liveClient.remainingTickets / liveClient.totalTickets) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OTHER SECTIONS REMAIN UNCHANGED */}
                    {activeSection === 'history' && (
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-xl text-[#0c2444] mb-6">سجل الأنشطة الشامل</h3>
                            <div className="space-y-6 relative border-r-2 border-gray-100 pr-6 mr-3">
                                {combinedHistory.map((h, i) => (
                                    <div key={i} className="relative">
                                        <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${h.type === 'booking' ? 'bg-blue-500' : h.type === 'ticket' ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 mb-1">{new Date(h.date).toLocaleDateString('ar-EG')} - {h.type === 'booking' ? 'موعد' : h.type === 'ticket' ? 'تذكرة' : 'مهمة'}</p>
                                                <p className="font-bold text-[#0c2444] text-sm">
                                                    {h.type === 'booking' ? `حجز زيارة: ${(h.item as Booking).type}` : 
                                                     h.type === 'ticket' ? `تذكرة: ${(h.item as TicketType).subject}` : 
                                                     `مهمة: ${(h.item as VisitTask).text}`}
                                                </p>
                                            </div>
                                            <span className="text-[10px] bg-white px-2 py-1 rounded-md border border-gray-200 font-bold">
                                                {(h.item as any).status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {combinedHistory.length === 0 && <p className="text-gray-400 text-sm italic">لا توجد أنشطة مسجلة.</p>}
                            </div>
                        </div>
                    )}

                    {/* SECTION: TEAM (User Management) */}
                    {activeSection === 'team' && (
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-[#0c2444]">فريق العمل (المستخدمين)</h3>
                                <button onClick={() => { setShowTeamUserForm(!showTeamUserForm); setEditingUserId(null); setTeamUserForm({name:'',email:'',position:'',phone:'',anyDeskId:''}); }} className="bg-[#0c2444] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#0a1f3b] transition-colors"><Plus size={16}/> إضافة عضو</button>
                            </div>
                            
                            {showTeamUserForm && (
                                <form onSubmit={handleAddOrEditUser} className="bg-gray-50 p-6 rounded-2xl mb-8 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                                    <input required placeholder="الاسم" value={teamUserForm.name} onChange={e => setTeamUserForm({...teamUserForm, name: e.target.value})} className="p-3 rounded-xl border border-gray-200 outline-none bg-white text-[#0c2444]" />
                                    <input required placeholder="المسمى الوظيفي" value={teamUserForm.position} onChange={e => setTeamUserForm({...teamUserForm, position: e.target.value})} className="p-3 rounded-xl border border-gray-200 outline-none bg-white text-[#0c2444]" />
                                    <input type="email" placeholder="البريد الإلكتروني" value={teamUserForm.email} onChange={e => setTeamUserForm({...teamUserForm, email: e.target.value})} className="p-3 rounded-xl border border-gray-200 outline-none bg-white text-[#0c2444]" />
                                    <input placeholder="AnyDesk ID" value={teamUserForm.anyDeskId} onChange={e => setTeamUserForm({...teamUserForm, anyDeskId: e.target.value})} className="p-3 rounded-xl border border-gray-200 outline-none font-mono bg-white text-[#0c2444]" />
                                    <div className="col-span-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">{editingUserId ? 'حفظ التعديلات' : 'إضافة المستخدم'}</button>
                                        <button type="button" onClick={() => setShowTeamUserForm(false)} className="px-6 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300">إلغاء</button>
                                    </div>
                                </form>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(liveClient.usersList || []).map(u => (
                                    <div key={u.id} className="p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-all bg-white flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#0c2444] text-sm">{u.name}</h4>
                                                <p className="text-xs text-gray-500">{u.position}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 group-hover:opacity-100 transition-all relative z-10">
                                            <button 
                                                onClick={() => startEditUser(u)} 
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                type="button"
                                            >
                                                <Edit size={16}/>
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={(e) => handleDeleteUser(e, u.id)} 
                                                disabled={isDeletingUser === u.id}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer disabled:opacity-50"
                                                title="حذف المستخدم"
                                            >
                                                {isDeletingUser === u.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'branches' && (
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-xl text-[#0c2444] mb-6">الفروع المسجلة</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(!liveClient.branches || liveClient.branches.length === 0) ? (
                                    <p className="col-span-3 text-center text-gray-400 italic py-8">لا توجد فروع مسجلة لهذا العميل.</p>
                                ) : (
                                    liveClient.branches.map(branch => (
                                        <div key={branch.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                                <MapPin size={20}/>
                                            </div>
                                            <h4 className="font-bold text-[#0c2444] text-lg mb-2">{branch.name}</h4>
                                            <p className="text-sm text-gray-500">{branch.address || 'العنوان غير محدد'}</p>
                                            {branch.phone && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Smartphone size={12}/> {branch.phone}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'checklist' && (
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-[#0c2444]">قائمة المهام والزيارات</h3>
                                <div className="flex gap-2">
                                    <select value={selectedVisitForAdminTask} onChange={e => setSelectedVisitForAdminTask(e.target.value)} className="bg-gray-50 border-none rounded-xl text-sm font-bold text-[#0c2444] px-4 py-2 outline-none">
                                        <option value="">كل المهام</option>
                                        {upcomingVisits.map(b => <option key={b.id} value={b.id}>{b.date} - {b.time}</option>)}
                                    </select>
                                </div>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); if(newTaskText.trim()) { addTask(selectedVisitForAdminTask, newTaskText, 'standard', liveClient.id); setNewTaskText(''); } }} className="flex gap-2 mb-8">
                                <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="أضف مهمة جديدة..." className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all text-[#0c2444]" />
                                <button type="submit" className="bg-[#0c2444] text-white px-6 rounded-xl font-bold hover:bg-[#0a1f3b]"><Plus/></button>
                            </form>

                            <div className="space-y-6">
                                {Object.entries(tasksByVisit).map(([dateLabel, tasks]) => (
                                    <div key={dateLabel} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                        <h4 className="font-bold text-[#0c2444] mb-3 flex items-center gap-2 text-sm"><CalendarIcon size={14}/> {dateLabel}</h4>
                                        <div className="space-y-2">
                                            {(tasks as VisitTask[]).map(task => (
                                                <div key={task.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full ${task.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`text-sm font-bold flex-1 ${task.isCompleted ? 'line-through text-gray-400' : 'text-[#0c2444]'}`}>{task.text}</span>
                                                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">{task.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'finance' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-[#0c2444] to-blue-900 rounded-[2rem] p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                                <div className="relative z-10 flex flex-col gap-6 w-full">
                                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                        <div>
                                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                                <TrendingUp size={14}/> قيمة الاشتراك الشهري
                                            </p>
                                            <h4 className="text-2xl font-black">{monthlySubscription} <span className="text-sm opacity-70">JOD</span></h4>
                                        </div>
                                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded border border-white/10">باقة {translatedPkgName}</span>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                                <FileText size={14}/> المستحقات المعلقة (فواتير)
                                            </p>
                                            <h3 className="text-4xl font-black">{totalPendingAmount.toFixed(2)} <span className="text-lg opacity-70">JOD</span></h3>
                                        </div>
                                        <div>
                                            {totalPendingAmount > 0 ? (
                                                <span className="flex items-center gap-2 bg-red-500/20 border border-red-400/50 text-red-200 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                                                    <AlertTriangle size={14}/> يوجد فواتير غير مدفوعة
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 bg-green-500/20 border border-green-400/50 text-green-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                    <CheckCircle size={14}/> لا توجد مستحقات
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                            </div>
                            
                            <div className="flex justify-end">
                                <button onClick={() => onNavigateToBilling(liveClient.id)} className="bg-white border border-gray-200 text-[#0c2444] px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                                    <Plus size={18}/> إنشاء فاتورة جديدة
                                </button>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
                                <table className="w-full text-right">
                                    <thead className="bg-gray-50 text-xs text-gray-400 font-bold uppercase">
                                        <tr>
                                            <th className="p-4">رقم الفاتورة</th>
                                            <th className="p-4">التاريخ</th>
                                            <th className="p-4">المبلغ</th>
                                            <th className="p-4">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-bold text-[#0c2444]">
                                        {clientInvoices.length === 0 ? (
                                            <tr><td colSpan={4} className="p-6 text-center text-gray-400 font-normal">لا توجد فواتير مسجلة</td></tr>
                                        ) : (
                                            clientInvoices.map(inv => (
                                                <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-4 font-mono text-gray-500">{inv.invoiceNumber}</td>
                                                    <td className="p-4">{new Date(inv.issueDate).toLocaleDateString()}</td>
                                                    <td className="p-4">{inv.totalAmount} JOD</td>
                                                    <td className="p-4"><StatusBadge status={inv.status}/></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </motion.div>
        </div>
    );
};

export default ClientDetailModal;
