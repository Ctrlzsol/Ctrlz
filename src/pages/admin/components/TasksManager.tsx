
import React, { useMemo, useState, useEffect } from 'react';
import { useBooking } from '../../../modules/bookings/context';
import { useClientData } from '../../../modules/clients/context';
import { VisitTask, ClientProfile } from '../../../core/types';
import { ClipboardList, Check, Calendar, Edit, X, Loader2, ChevronLeft, Building2, CheckCircle, Plus, Clock, Search, Trash2, AlertCircle, ArrowRight, Save, Filter, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TasksManager = () => {
    const { visitTasks, updateTask, deleteTask, bookings, markClientTasksAsViewed, addTask } = useBooking();
    const { clients } = useClientData();
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
    
    // Task Editing State
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTaskText, setEditTaskText] = useState('');
    const [editTaskNotes, setEditTaskNotes] = useState('');
    
    // Postpone State
    const [postponeTaskId, setPostponeTaskId] = useState<string | null>(null);
    const [postponeDate, setPostponeDate] = useState('');
    const [isPostponeGeneral, setIsPostponeGeneral] = useState(false);

    // Add Task State
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskType, setNewTaskType] = useState<'general' | 'visit'>('general');
    const [selectedBookingIdForNewTask, setSelectedBookingIdForNewTask] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        markClientTasksAsViewed();
    }, [markClientTasksAsViewed]);

    const filteredClients = useMemo(() => {
        return clients.filter(c => c.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [clients, searchTerm]);

    const getClientTaskStats = (clientId: string) => {
        const clientTasks = visitTasks.filter(t => t.clientId === clientId);
        const pending = clientTasks.filter(t => !t.isCompleted && (t.status === 'pending' || t.status === 'postponed')).length;
        const total = clientTasks.length;
        return { pending, total };
    };

    // Filter available dates strictly to actual visits (confirmed or pending bookings)
    const availableDates = useMemo(() => {
        if (!selectedClient) return [];
        const clientBookings = bookings.filter(b => 
            b.clientId === selectedClient.id && 
            (b.status === 'confirmed' || b.status === 'pending' || b.status === 'completed')
        );
        // Create unique set of dates
        const dates = new Set(clientBookings.map(b => b.date));
        return Array.from(dates).sort().reverse();
    }, [bookings, selectedClient]);

    // --- Detail View Data ---
    const clientTasks = useMemo(() => {
        if (!selectedClient) return { actionRequired: [], scheduled: [], history: [] };
        
        let all = visitTasks.filter(t => t.clientId === selectedClient.id);

        // Filter by Date if selected
        if (selectedDateFilter) {
            // Find bookings on this specific date
            const bookingIdsOnDate = bookings
                .filter(b => b.clientId === selectedClient.id && b.date === selectedDateFilter)
                .map(b => b.id);
            
            // Filter tasks linked to these bookings OR having this exact visitDate string
            all = all.filter(t => (t.bookingId && bookingIdsOnDate.includes(t.bookingId)) || (t.visitDate === selectedDateFilter));
        }
        
        // Zone A: Action Required 
        const actionRequired = all.filter(t => {
            if (t.isCompleted || t.status === 'completed' || t.status === 'cancelled') return false;
            // If date filter is active, only show if it matches filter logic above (already filtered 'all')
            return (t.type === 'client_request') || (!t.bookingId && (t.status === 'pending' || t.status === 'postponed'));
        });
        
        // Zone B: Scheduled (Linked to Future Bookings)
        const scheduled = all.filter(t => {
            if (!t.bookingId) return false;
            if (t.isCompleted || t.status === 'completed') return false;
            return true;
        });

        // Zone C: History
        const history = all.filter(t => t.isCompleted || t.status === 'completed' || t.status === 'cancelled');

        return { actionRequired, scheduled, history };
    }, [visitTasks, selectedClient, selectedDateFilter, bookings]);

    const upcomingBookingsForSelected = useMemo(() => {
        if (!selectedClient) return [];
        return bookings
            .filter(b => b.clientId === selectedClient.id && b.status !== 'cancelled')
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [bookings, selectedClient]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !newTaskText.trim()) return;
        const bookingIdToSend = newTaskType === 'visit' ? selectedBookingIdForNewTask : '';
        if (newTaskType === 'visit' && !bookingIdToSend) { alert('يرجى اختيار زيارة.'); return; }

        setIsSubmitting(true);
        await addTask(bookingIdToSend, newTaskText, 'standard', selectedClient.id);
        setNewTaskText('');
        setIsSubmitting(false);
    };

    const handleUpdateStatus = async (task: VisitTask, newStatus: VisitTask['status']) => {
        if (newStatus === 'postponed') {
            setPostponeTaskId(task.id);
            setPostponeDate('');
            setIsPostponeGeneral(false);
            return;
        }
        await updateTask(task.id, { 
            status: newStatus,
            isCompleted: newStatus === 'completed'
        });
    };

    const confirmPostpone = async () => {
        if (!postponeTaskId) return;
        
        let updates: Partial<VisitTask> = { status: 'postponed', isCompleted: false };
        
        if (isPostponeGeneral) {
            updates.bookingId = undefined; 
            updates.reason = 'تم التأجيل إلى قائمة المهام العامة';
        } else if (postponeDate) {
             const targetBooking = bookings.find(b => b.clientId === selectedClient?.id && b.date === postponeDate);
             if (targetBooking) {
                 updates.bookingId = targetBooking.id;
                 updates.reason = `تم التأجيل لزيارة ${postponeDate}`;
                 updates.status = 'pending'; 
             } else {
                 updates.bookingId = undefined;
                 updates.reason = `مؤجل لتاريخ: ${postponeDate}`;
             }
        }

        await updateTask(postponeTaskId, updates);
        setPostponeTaskId(null);
    };

    const startEditing = (task: VisitTask) => {
        setEditingTaskId(task.id);
        setEditTaskText(task.text);
        setEditTaskNotes(task.notes || '');
    };

    const saveEditing = async () => {
        if (editingTaskId && editTaskText.trim()) {
            await updateTask(editingTaskId, { 
                text: editTaskText,
                notes: editTaskNotes // Save admin notes
            });
            setEditingTaskId(null);
            setEditTaskText('');
            setEditTaskNotes('');
        }
    };

    return (
        <div className="min-h-screen pb-10">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-4 z-20">
                <h3 className="text-2xl font-bold text-[#0c2444] flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <ClipboardList size={24}/>
                    </div>
                    إدارة المهام والعمليات
                </h3>
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20}/>
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="ابحث عن عميل..." 
                        className="w-full bg-[#f8fafc] border-2 border-transparent rounded-2xl py-3 pr-12 pl-4 outline-none focus:bg-white focus:border-blue-100 transition-all text-[#0c2444] font-bold text-sm"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {!selectedClient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map(client => {
                        const stats = getClientTaskStats(client.id);
                        return (
                            <motion.div 
                                key={client.id}
                                layout
                                onClick={() => setSelectedClient(client)}
                                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                                        {client.logo ? <img src={client.logo} className="w-full h-full object-contain p-2"/> : <Building2 size={24} className="text-gray-300"/>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0c2444] text-lg">{client.companyName}</h4>
                                        <p className="text-xs text-gray-500">{client.name}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {stats.pending > 0 ? (
                                        <span className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
                                            <AlertCircle size={12}/> {stats.pending} مهام نشطة
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">
                                            <CheckCircle size={12}/> كل شيء تمام
                                        </span>
                                    )}
                                </div>
                                <div className="absolute top-6 left-6 text-gray-300 group-hover:text-blue-500 transition-colors">
                                    <ChevronLeft size={24} className="rtl:rotate-0 ltr:rotate-180"/>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    
                    {/* Header & Back */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => { setSelectedClient(null); setSelectedDateFilter(''); }} className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                                <ArrowRight size={20} className="rtl:rotate-180"/>
                            </button>
                            <h2 className="text-2xl font-black text-[#0c2444]">{selectedClient.companyName} - لوحة المهام</h2>
                        </div>
                        
                        {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                            <Filter size={16} className="text-gray-400 mr-2"/>
                            <select 
                                value={selectedDateFilter} 
                                onChange={(e) => setSelectedDateFilter(e.target.value)}
                                className="bg-transparent text-sm font-bold text-[#0c2444] outline-none cursor-pointer"
                            >
                                <option value="">كل التواريخ</option>
                                {availableDates.map(date => (
                                    <option key={date} value={date}>{new Date(date).toLocaleDateString('ar-EG')}</option>
                                ))}
                            </select>
                            {selectedDateFilter && <button onClick={() => setSelectedDateFilter('')} className="p-1 hover:bg-gray-100 rounded-full"><X size={14}/></button>}
                        </div>
                    </div>

                    {/* Quick Add Task (Hidden if filter is active) */}
                    {!selectedDateFilter && (
                        <div className="bg-[#0c2444] text-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071e3] opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-1 w-full">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Plus size={20}/> إضافة مهمة جديدة</h4>
                                    <div className="bg-white/10 p-1 rounded-xl flex gap-1 w-fit mb-3">
                                        <button onClick={() => setNewTaskType('general')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${newTaskType === 'general' ? 'bg-white text-[#0c2444]' : 'text-white/70 hover:text-white'}`}>عامة</button>
                                        <button onClick={() => setNewTaskType('visit')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${newTaskType === 'visit' ? 'bg-white text-[#0c2444]' : 'text-white/70 hover:text-white'}`}>مرتبطة بزيارة</button>
                                    </div>
                                    <div className="flex gap-2">
                                        {newTaskType === 'visit' && (
                                            <select value={selectedBookingIdForNewTask} onChange={e => setSelectedBookingIdForNewTask(e.target.value)} className="bg-white/10 border border-white/20 text-white text-xs font-bold py-3 px-4 rounded-xl outline-none focus:bg-white/20">
                                                <option value="" className="text-gray-500"> اختر الزيارة </option>
                                                {upcomingBookingsForSelected.map(b => (
                                                    <option key={b.id} value={b.id} className="text-[#0c2444]">{new Date(b.date).toLocaleDateString('ar-EG')} - {b.time}</option>
                                                ))}
                                            </select>
                                        )}
                                        <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="اكتب وصف المهمة..." className="flex-1 bg-white text-[#0c2444] text-sm font-bold p-3 rounded-xl outline-none placeholder:text-gray-400"/>
                                        <button onClick={handleAddTask} disabled={isSubmitting} className="bg-[#0071e3] px-6 rounded-xl font-bold hover:bg-[#005bb5] transition-colors">{isSubmitting ? <Loader2 className="animate-spin"/> : 'إضافة'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Zone A: Action Required */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-[#0c2444] text-lg flex items-center gap-2">
                                <AlertCircle size={20} className="text-red-500"/> مهام تتطلب إجراء
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">{clientTasks.actionRequired.length}</span>
                            </h3>
                            <div className="space-y-3">
                                {clientTasks.actionRequired.length === 0 ? (
                                    <p className="text-gray-400 text-sm italic bg-white p-4 rounded-xl border border-dashed border-gray-200">لا توجد مهام معلقة.</p>
                                ) : clientTasks.actionRequired.map(task => (
                                    <div key={task.id} className="bg-white p-4 rounded-2xl border-l-4 border-l-red-500 border border-gray-100 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex gap-2 mb-1">
                                                    {task.type === 'client_request' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold inline-block">طلب عميل</span>}
                                                    {task.status === 'postponed' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold inline-block">مؤجلة</span>}
                                                </div>
                                                
                                                {editingTaskId === task.id ? (
                                                    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl">
                                                        <input value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} className="w-full bg-white p-2 rounded border border-gray-200 text-sm font-bold text-[#0c2444]" placeholder="نص المهمة"/>
                                                        <textarea value={editTaskNotes} onChange={(e) => setEditTaskNotes(e.target.value)} className="w-full bg-white p-2 rounded border border-gray-200 text-xs text-gray-600" placeholder="ملاحظات إدارية (اختياري)"/>
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <button onClick={saveEditing} className="text-green-600 bg-green-50 p-1.5 rounded"><Check size={16}/></button>
                                                            <button onClick={() => setEditingTaskId(null)} className="text-red-500 bg-red-50 p-1.5 rounded"><X size={16}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="font-bold text-[#0c2444] cursor-pointer hover:text-blue-600" onClick={() => startEditing(task)}>{task.text}</p>
                                                        {task.notes && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><FileText size={10}/> {task.notes}</p>}
                                                        {/* Show date context if filtering */}
                                                        {selectedDateFilter && task.visitDate && <p className="text-[9px] text-gray-400 mt-1">{task.visitDate}</p>}
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => startEditing(task)} className="p-1 text-gray-400 hover:text-blue-500"><Edit size={14}/></button>
                                        </div>
                                        {editingTaskId !== task.id && (
                                            <div className="flex gap-2 pt-2 border-t border-gray-50">
                                                <button onClick={() => handleUpdateStatus(task, 'completed')} className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-xs font-bold hover:bg-green-100">إنجاز</button>
                                                <button onClick={() => handleUpdateStatus(task, 'postponed')} className="flex-1 bg-amber-50 text-amber-600 py-2 rounded-lg text-xs font-bold hover:bg-amber-100">تأجيل</button>
                                                <button onClick={() => deleteTask(task.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Zone B: Scheduled & History */}
                        <div className="space-y-8">
                            {/* Scheduled */}
                            <div>
                                <h3 className="font-bold text-[#0c2444] text-lg flex items-center gap-2 mb-4">
                                    <Calendar size={20} className="text-blue-500"/> مهام الزيارات {selectedDateFilter ? '(مفلترة)' : 'القادمة'}
                                </h3>
                                <div className="space-y-3">
                                    {clientTasks.scheduled.map(task => (
                                        <div key={task.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                                            {editingTaskId === task.id ? (
                                                <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl">
                                                    <input value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} className="w-full bg-white p-2 rounded border border-gray-200 text-sm font-bold text-[#0c2444]" />
                                                    <textarea value={editTaskNotes} onChange={(e) => setEditTaskNotes(e.target.value)} className="w-full bg-white p-2 rounded border border-gray-200 text-xs text-gray-600" placeholder="ملاحظات..." />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={saveEditing} className="text-green-600 bg-green-50 p-1.5 rounded"><Check size={16}/></button>
                                                        <button onClick={() => setEditingTaskId(null)} className="text-red-500 bg-red-50 p-1.5 rounded"><X size={16}/></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <span className="font-bold text-[#0c2444] text-sm block cursor-pointer hover:text-blue-600" onClick={() => startEditing(task)}>{task.text}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">
                                                                {bookings.find(b => b.id === task.bookingId)?.date || task.visitDate}
                                                            </span>
                                                            {task.notes && <span className="text-[10px] text-gray-400 flex items-center gap-1"><FileText size={10}/> ملاحظة</span>}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => startEditing(task)} className="p-1 text-gray-400 hover:text-blue-500"><Edit size={14}/></button>
                                                </div>
                                            )}
                                            
                                            {editingTaskId !== task.id && (
                                                <div className="flex gap-2 pt-2 border-t border-gray-50">
                                                    <button onClick={() => handleUpdateStatus(task, 'completed')} className="flex-1 bg-green-50 text-green-600 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100">إنجاز</button>
                                                    <button onClick={() => handleUpdateStatus(task, 'postponed')} className="flex-1 bg-amber-50 text-amber-600 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100">تأجيل</button>
                                                    <button onClick={() => deleteTask(task.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {clientTasks.scheduled.length === 0 && <p className="text-gray-400 text-sm italic">لا توجد مهام مجدولة.</p>}
                                </div>
                            </div>

                            {/* History */}
                            <div>
                                <h3 className="font-bold text-[#0c2444] text-lg flex items-center gap-2 mb-4">
                                    <CheckCircle size={20} className="text-green-500"/> السجل
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {clientTasks.history.map(task => (
                                        <div key={task.id} className={`p-3 rounded-xl border flex justify-between items-center ${task.status === 'completed' ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                            <span className={`text-sm font-bold ${task.status === 'completed' ? 'text-green-800' : 'text-gray-600'}`}>{task.text}</span>
                                            <span className="text-[10px] font-bold">{task.status === 'completed' ? '✅ تم' : '❌ ملغي'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Postpone Date Selection Modal */}
            <AnimatePresence>
                {postponeTaskId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative">
                            <button onClick={() => setPostponeTaskId(null)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                            <h3 className="text-xl font-bold text-[#0c2444] mb-4">تأجيل المهمة</h3>
                            <p className="text-sm text-gray-500 mb-6">إلى متى تريد تأجيل هذه المهمة؟</p>
                            
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input type="radio" checked={isPostponeGeneral} onChange={() => setIsPostponeGeneral(true)} name="postponeType" className="accent-blue-600"/>
                                    <span className="font-bold text-sm text-gray-700">إلى قائمة المهام العامة (بدون موعد)</span>
                                </label>
                                
                                <div className={`p-3 border rounded-xl transition-all ${!isPostponeGeneral ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}`}>
                                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                                        <input type="radio" checked={!isPostponeGeneral} onChange={() => setIsPostponeGeneral(false)} name="postponeType" className="accent-blue-600"/>
                                        <span className="font-bold text-sm text-gray-700">تحديد موعد جديد</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        value={postponeDate} 
                                        onChange={(e) => setPostponeDate(e.target.value)} 
                                        disabled={isPostponeGeneral}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                                    />
                                    <select 
                                        className="w-full mt-2 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                                        onChange={(e) => setPostponeDate(e.target.value)}
                                        disabled={isPostponeGeneral}
                                    >
                                        <option value="">-- أو اختر من الزيارات القادمة --</option>
                                        {upcomingBookingsForSelected.map(b => (
                                            <option key={b.id} value={b.date}>{new Date(b.date).toLocaleDateString('ar-EG')} - {b.time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button onClick={confirmPostpone} className="w-full bg-[#0c2444] text-white py-3 rounded-xl font-bold mt-6 hover:bg-[#0a1f3b] transition-colors">
                                تأكيد التأجيل
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TasksManager;
