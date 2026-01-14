
import React, { useState, useMemo, useEffect } from 'react';
import { ClientProfile, Booking, VisitTask } from '../../../core/types';
import { Calendar, Check, Plus, Trash2, Loader2, ClipboardList, CheckCircle, Edit, X, Clock, Ban, LayoutList, ChevronRight, AlertCircle, ArrowDown, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

interface VisitTasksViewProps {
    client: ClientProfile;
    bookings: Booking[];
    visitTasks: VisitTask[];
    addTask: (bookingId: string, text: string, type: 'client_request', clientId: string) => Promise<void>;
    deleteTask: (taskId: string) => Promise<boolean>;
    toggleTaskCompletion: (taskId: string, isCompleted: boolean) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<VisitTask>) => Promise<void>;
}

const VisitTasksView: React.FC<VisitTasksViewProps> = ({ client, bookings, visitTasks, addTask, deleteTask, toggleTaskCompletion, updateTask }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [selectedBookingId, setSelectedBookingId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminPhone, setAdminPhone] = useState<string>('');

    useEffect(() => {
        const fetchAdminPhone = async () => {
            const { data } = await supabase.from('system_settings').select('value').eq('id', 'whatsapp_notification_number').maybeSingle();
            if (data && data.value) setAdminPhone(data.value);
        };
        fetchAdminPhone();
    }, []);
    
    // Sort Bookings: Upcoming first
    const upcomingBookings = useMemo(() => {
        return bookings
            .filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.date) >= new Date())
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [bookings]);

    // Grouping Logic
    const timelineData = useMemo(() => {
        const groups: { id: string, title: string, subtitle: string, isGeneral: boolean, tasks: VisitTask[], dateObj: Date | null }[] = [];
        
        // 1. General Tasks Group (Pending & Postponed without Booking ID)
        const generalTasks = visitTasks.filter(t => 
            t.clientId === client.id && 
            !t.bookingId && 
            (t.status === 'pending' || t.status === 'postponed')
        );

        if (generalTasks.length > 0) {
            groups.push({
                id: 'general',
                title: 'مهام عامة / غير مجدولة',
                subtitle: 'قائمة انتظار المهام والمؤجلات',
                isGeneral: true,
                tasks: generalTasks,
                dateObj: null
            });
        }

        // 2. Booking Groups (Upcoming & Recent)
        const relevantBookings = bookings.filter(b => b.clientId === client.id && b.status !== 'cancelled');
        
        relevantBookings.forEach(booking => {
            const bookingTasks = visitTasks.filter(t => t.bookingId === booking.id);
            // Only show booking if it has tasks OR it is upcoming
            const isUpcoming = new Date(booking.date) >= new Date();
            
            if (bookingTasks.length > 0 || isUpcoming) {
                groups.push({
                    id: booking.id,
                    title: `زيارة: ${new Date(booking.date).toLocaleDateString('ar-EG', {weekday: 'long', day: 'numeric', month: 'long'})}`,
                    subtitle: `${booking.time} - ${booking.branchName || 'الفرع الرئيسي'}`,
                    isGeneral: false,
                    tasks: bookingTasks,
                    dateObj: new Date(booking.date)
                });
            }
        });

        // Sort: General first, then by date ascending (Upcoming first)
        return groups.sort((a, b) => {
            if (a.isGeneral) return -1;
            if (b.isGeneral) return 1;
            return (a.dateObj?.getTime() || 0) - (b.dateObj?.getTime() || 0);
        });

    }, [bookings, visitTasks, client.id]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setIsSubmitting(true);
        await addTask(selectedBookingId || '', newTaskText, 'client_request', client.id);
        
        // WHATSAPP LOGIC - ASK FIRST
        if (adminPhone) {
            if (window.confirm("هل ترغب بإرسال تنبيه واتساب للإدارة بخصوص هذه المهمة؟")) {
                const msg = encodeURIComponent(`مرحباً، أنا ${client.companyName}. قمت بإضافة مهمة جديدة للنظام: ${newTaskText}.`);
                window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank');
            }
        }

        setNewTaskText('');
        setIsSubmitting(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Add Task Form */}
            <div className="lg:col-span-1">
                <div className="bg-[#0c2444] text-white rounded-[2.5rem] p-8 shadow-xl sticky top-8 relative overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071e3] rounded-full blur-[50px] opacity-20 -mr-10 -mt-10"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                                <Plus size={24} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">طلب مهمة جديدة</h3>
                                <p className="text-blue-200 text-xs">أضف مهام للفريق التقني</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-blue-200 mb-2">تاريخ الزيارة (اختياري)</label>
                                <select 
                                    value={selectedBookingId} 
                                    onChange={e => setSelectedBookingId(e.target.value)} 
                                    className="w-full bg-white/10 border border-white/10 text-white text-sm font-bold py-3 px-4 rounded-xl outline-none focus:bg-white/20 focus:border-white/30 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-[#0c2444]">مهام عامة (بدون موعد محدد)</option>
                                    {upcomingBookings.map(b => (
                                        <option key={b.id} value={b.id} className="text-[#0c2444]">
                                            {/* Updated to show Day, Date, and Time */}
                                            {new Date(b.date).toLocaleDateString('ar-EG', { weekday: 'long' })} ({new Date(b.date).toLocaleDateString('ar-EG')}) - {b.time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-200 mb-2">تفاصيل المهمة</label>
                                <textarea 
                                    rows={4}
                                    value={newTaskText} 
                                    onChange={e => setNewTaskText(e.target.value)} 
                                    placeholder="مثال: فحص الطابعة في مكتب المحاسبة..." 
                                    className="w-full bg-white/10 border border-white/10 text-white text-sm font-bold p-4 rounded-xl outline-none focus:bg-white/20 focus:border-white/30 transition-all placeholder:text-blue-200/50 resize-none"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={!newTaskText.trim() || isSubmitting}
                                className="w-full bg-[#0071e3] text-white py-4 rounded-xl font-bold hover:bg-[#005bb5] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                                <span>إضافة الطلب</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Timeline */}
            <div className="lg:col-span-2 space-y-8 relative">
                {/* Timeline Line */}
                <div className="absolute top-4 bottom-0 right-[27px] w-0.5 bg-gray-200 hidden md:block"></div>

                {timelineData.map((group, idx) => {
                    const isUpcoming = group.dateObj && group.dateObj >= new Date();
                    return (
                        <div key={group.id} className="relative md:pr-14">
                            {/* Timeline Dot */}
                            <div className={`absolute top-6 right-3 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 hidden md:flex ${isUpcoming || group.isGeneral ? 'bg-[#0071e3]' : 'bg-gray-300'}`}>
                                {group.isGeneral ? <LayoutList size={14} className="text-white"/> : <Calendar size={14} className="text-white"/>}
                            </div>

                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                                <div className={`px-6 py-4 border-b border-gray-50 flex justify-between items-center ${isUpcoming ? 'bg-blue-50/30' : ''}`}>
                                    <div>
                                        <h4 className={`font-bold text-lg ${isUpcoming ? 'text-[#0071e3]' : 'text-[#0c2444]'}`}>{group.title}</h4>
                                        <p className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-1">
                                            {isUpcoming && <Clock size={12}/>} {group.subtitle}
                                        </p>
                                    </div>
                                    {group.tasks.length > 0 && (
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">
                                            {group.tasks.filter(t=>t.isCompleted).length} / {group.tasks.length} منجز
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 space-y-3">
                                    {group.tasks.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-xs font-bold">لا توجد مهام مسجلة لهذه الزيارة</p>
                                        </div>
                                    ) : (
                                        group.tasks.map(task => (
                                            <TaskItemClient 
                                                key={task.id} 
                                                task={task} 
                                                onDelete={deleteTask} 
                                                onUpdate={updateTask}
                                                upcomingBookings={upcomingBookings}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {timelineData.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <ClipboardList size={64} className="mx-auto mb-4 opacity-20"/>
                        <p className="text-lg font-bold text-[#0c2444]">القائمة فارغة</p>
                        <p className="text-sm">لم يتم إضافة أي مهام أو زيارات بعد.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// FIX: Wrapped TaskItemClient with React.FC to fix assignability error (key prop).
const TaskItemClient: React.FC<{ task: VisitTask, onDelete: (id: string) => Promise<boolean>, onUpdate: (id: string, updates: Partial<VisitTask>) => Promise<void>, upcomingBookings: Booking[] }> = ({ task, onDelete, onUpdate, upcomingBookings }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.text);
    const [editBookingId, setEditBookingId] = useState(task.bookingId || '');

    // Determine visuals based on status
    const isCompleted = task.isCompleted || task.status === 'completed';
    const isPostponed = task.status === 'postponed';
    
    let bgClass = "bg-white";
    let borderClass = "border-gray-100";
    let icon = <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>;
    let textClass = "text-[#0c2444]";

    if (isCompleted) {
        bgClass = "bg-green-50/50";
        borderClass = "border-green-100";
        icon = <CheckCircle size={20} className="text-green-500 fill-green-100"/>;
        textClass = "text-gray-500 line-through decoration-green-500/50";
    } else if (isPostponed) {
        bgClass = "bg-amber-50/50";
        borderClass = "border-amber-100";
        icon = <Clock size={20} className="text-amber-500 fill-amber-100"/>;
        textClass = "text-[#0c2444]";
    }

    const handleSave = async () => {
        if(!editValue.trim()) return;
        await onUpdate(task.id, { 
            text: editValue,
            bookingId: editBookingId || null // Send null if empty string to unassign
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-white border-2 border-blue-200 p-4 rounded-2xl shadow-sm space-y-3 animate-in fade-in">
                <textarea 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    className="w-full p-2 text-sm border-b border-gray-100 outline-none resize-none font-bold text-[#0c2444] bg-transparent"
                    rows={2}
                    placeholder="وصف المهمة..."
                />
                <div className="flex gap-2">
                    <select 
                        value={editBookingId} 
                        onChange={e => setEditBookingId(e.target.value)}
                        className="flex-1 bg-gray-50 text-xs font-bold text-[#0c2444] py-2 px-3 rounded-lg outline-none cursor-pointer"
                    >
                        <option value="">مهام عامة (بدون موعد)</option>
                        {upcomingBookings.map(b => (
                            <option key={b.id} value={b.id}>
                                {new Date(b.date).toLocaleDateString('ar-EG')} - {b.time}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleSave} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"><Save size={16}/></button>
                    <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300"><X size={16}/></button>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex items-start gap-4 p-4 rounded-2xl border ${borderClass} ${bgClass} transition-all relative group`}>
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="flex-1">
                <p className={`text-sm font-bold ${textClass} leading-relaxed`}>{task.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {task.type === 'client_request' && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">طلبك</span>
                    )}
                    {task.type === 'standard' && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">إداري</span>
                    )}
                    {isPostponed && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                            {task.reason || 'مؤجلة'}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Actions for Pending Tasks */}
            {!isCompleted && task.type === 'client_request' && (
                <div className="flex flex-col gap-1 absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 bg-white text-blue-500 rounded-lg shadow-sm border border-gray-100 hover:bg-blue-50 transition-all"
                        title="تعديل / ربط بموعد"
                    >
                        <Edit size={14}/>
                    </button>
                    <button 
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm border border-gray-100 hover:bg-red-50 transition-all"
                        title="حذف"
                    >
                        <Trash2 size={14}/>
                    </button>
                </div>
            )}
        </div>
    );
};

export default VisitTasksView;
