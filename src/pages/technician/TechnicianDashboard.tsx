
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../modules/auth/AuthContext';
import { useBooking } from '../../modules/bookings/context';
import { useClientData } from '../../modules/clients/context';
import { useTicket } from '../../modules/tickets/context';
import { Calendar as CalendarIcon, Check, LogOut, ClipboardList, Briefcase, CheckCircle, Clock, ChevronDown, MessageSquare, Send, Loader2, User, Bot, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';
import { Booking, VisitTask, Ticket as TicketType } from '../../core/types';

const TaskItem: React.FC<{ 
    task: VisitTask; 
    onToggle: (taskId: string, currentStatus: boolean) => Promise<void>; 
}> = ({ task, onToggle }) => (
    <div 
        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${task.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
    >
        <button 
            onClick={() => onToggle(task.id, task.isCompleted)} 
            className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${task.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-blue-400'}`}
        >
            <Check size={12} strokeWidth={3} />
        </button>
        <p className={`font-bold text-sm ${task.isCompleted ? 'text-green-800 line-through' : 'text-[#0c2444]'}`}>
            {task.text}
        </p>
    </div>
);

const BookingCard: React.FC<{ 
    booking: Booking; 
    visitTasks: VisitTask[];
    expandedBookingId: string | null;
    setExpandedBookingId: (id: string | null) => void;
    onTaskToggle: (taskId: string, currentStatus: boolean) => Promise<void>;
}> = ({ booking, visitTasks, expandedBookingId, setExpandedBookingId, onTaskToggle }) => {
    const tasksForBooking = visitTasks.filter(task => task.bookingId === booking.id);
    const isExpanded = expandedBookingId === booking.id;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)} className="w-full text-right p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex flex-col items-center justify-center font-bold">
                        <span className="text-[10px] uppercase">{new Date(booking.date).toLocaleString('ar-EG', { month: 'short' })}</span>
                        <span className="text-xl -mt-1">{new Date(booking.date).getDate()}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#0c2444]">{booking.clientName} {booking.branchName && <span className="text-sm text-gray-500 font-medium">- {booking.branchName}</span>}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock size={12} /><span>{booking.time}</span>
                        </div>
                    </div>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2"><ClipboardList size={14} />المهام المطلوبة</h4>
                            {tasksForBooking.length > 0 ? (
                                <div className="space-y-2">
                                    {tasksForBooking.map(task => <TaskItem key={task.id} task={task} onToggle={onTaskToggle} />)}
                                </div>
                            ) : (
                                <p className="text-xs text-center text-gray-400 py-4">لا توجد مهام محددة لهذه الزيارة.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TechnicianDashboard = () => {
    const { user, logout } = useAuth();
    const { bookings, visitTasks, toggleTaskCompletion } = useBooking();
    const { clients } = useClientData();
    const { tickets, addReply } = useTicket();

    const [activeTab, setActiveTab] = useState<'visits' | 'consultations'>('visits');
    const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
    const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // 1. Find clients assigned to the logged-in technician
    const assignedClients = useMemo(() => {
        if (!user) return [];
        return clients.filter(client => client.assignedTechnicianId === user.id);
    }, [clients, user]);

    const assignedClientIds = useMemo(() => new Set(assignedClients.map(c => c.id)), [assignedClients]);

    // 2. Filter bookings for assigned clients
    const assignedBookings = useMemo(() => {
        return bookings.filter(booking => booking.clientId && assignedClientIds.has(booking.clientId) && booking.status !== 'cancelled');
    }, [bookings, assignedClientIds]);

    // 3. Filter consultations for assigned clients
    const assignedConsultations = useMemo(() => {
        return tickets.filter(t => 
            assignedClientIds.has(t.clientId) && 
            t.subject.startsWith('استشارة تقنية:')
        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [tickets, assignedClientIds]);

    const selectedConsultation = useMemo(() => {
        return tickets.find(t => t.id === selectedConsultationId);
    }, [tickets, selectedConsultationId]);

    const today = new Date().toISOString().split('T')[0];
    const todaysVisits = useMemo(() => {
        return assignedBookings
            .filter(b => b.date === today && b.status === 'confirmed')
            .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
    }, [assignedBookings, today]);
    
    const upcomingVisits = useMemo(() => {
        return assignedBookings
            .filter(b => b.date > today && b.status === 'confirmed')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [assignedBookings, today]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConsultation?.messages]);

    const handleTaskToggle = async (taskId: string, currentStatus: boolean) => {
        await toggleTaskCompletion(taskId, !currentStatus);
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedConsultation || !replyText.trim()) return;
        setIsReplying(true);
        // Technician replies as "admin" role for simplicity in schema, but senderName distinguishes.
        await addReply(selectedConsultation.id, { id: `m-${Date.now()}`, sender: 'admin', senderName: user?.name || 'Technician', text: replyText, timestamp: new Date().toISOString() });
        setReplyText('');
        setIsReplying(false);
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans relative" dir="rtl">
            <FloatingTechBackground />
            <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 pb-24 h-screen flex flex-col">
                <header className="flex justify-between items-center mb-6 bg-white/80 backdrop-blur-md p-4 rounded-[2rem] shadow-sm border border-white/50 z-20 shrink-0">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-[#0c2444] rounded-full flex items-center justify-center text-white border-4 border-white shadow-md"><Briefcase size={20} /></div><div><h1 className="text-xl font-bold text-[#0c2444]">{user?.name}</h1><p className="text-xs text-gray-500 font-bold">بوابة الفنيين</p></div></div>
                    <button onClick={logout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"><LogOut size={20} /></button>
                </header>
                
                <div className="flex justify-center mb-6 bg-gray-200/50 p-1 rounded-full w-fit mx-auto shrink-0">
                    <button onClick={() => setActiveTab('visits')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'visits' ? 'bg-white text-[#0c2444] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الزيارات</button>
                    <button onClick={() => setActiveTab('consultations')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'consultations' ? 'bg-white text-[#0c2444] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الاستشارات <span className="text-[10px] bg-red-500 text-white px-1.5 rounded-full">{assignedConsultations.filter(t => t.status !== 'resolved').length}</span></button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'visits' ? (
                            <motion.div key="visits" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full overflow-y-auto pb-20">
                                <div className="space-y-8">
                                    {/* Today's Visits */}
                                    <div>
                                        <h2 className="text-lg font-bold text-[#0c2444] mb-4">زيارات اليوم ({todaysVisits.length})</h2>
                                        {todaysVisits.length === 0 ? (
                                            <div className="text-center py-10 text-gray-400 bg-white/50 rounded-2xl border border-dashed">
                                                <CheckCircle size={32} className="mx-auto mb-2 text-green-400"/>
                                                <p>لا توجد زيارات مجدولة اليوم.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {todaysVisits.map((booking) => (
                                                    <BookingCard 
                                                        key={booking.id} 
                                                        booking={booking} 
                                                        visitTasks={visitTasks}
                                                        expandedBookingId={expandedBookingId}
                                                        setExpandedBookingId={setExpandedBookingId}
                                                        onTaskToggle={handleTaskToggle}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Upcoming Schedule */}
                                    <div>
                                        <h2 className="text-lg font-bold text-[#0c2444] mb-4">الجدول القادم ({upcomingVisits.length})</h2>
                                        {upcomingVisits.length === 0 ? (
                                            <p className="text-center py-10 text-gray-400">لا توجد زيارات قادمة في جدولك.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {upcomingVisits.map((booking) => (
                                                    <BookingCard 
                                                        key={booking.id} 
                                                        booking={booking} 
                                                        visitTasks={visitTasks}
                                                        expandedBookingId={expandedBookingId}
                                                        setExpandedBookingId={setExpandedBookingId}
                                                        onTaskToggle={handleTaskToggle}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="consultations" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex gap-4 overflow-hidden pb-4">
                                {/* Left List */}
                                <div className="w-1/3 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/50 p-4 overflow-y-auto space-y-3">
                                    {assignedConsultations.length === 0 ? (
                                        <div className="text-center py-20 text-gray-400"><MessageSquare size={30} className="mx-auto mb-2 opacity-50"/><p className="text-xs">لا توجد استشارات</p></div>
                                    ) : (
                                        assignedConsultations.map(ticket => (
                                            <button 
                                                key={ticket.id} 
                                                onClick={() => setSelectedConsultationId(ticket.id)} 
                                                className={`w-full text-right p-4 rounded-2xl transition-all border group relative ${selectedConsultationId === ticket.id ? 'bg-[#0c2444] text-white shadow-lg shadow-blue-900/10 border-transparent' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm text-[#0c2444]'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className={selectedConsultationId === ticket.id ? 'text-gray-300' : 'text-gray-400'}/>
                                                        <span className="font-bold text-xs">{ticket.clientName}</span>
                                                    </div>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${ticket.status === 'resolved' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-white'}`}>
                                                        {ticket.status === 'resolved' ? 'منتهية' : 'جارية'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm mb-1 line-clamp-1">{ticket.subject.replace('استشارة تقنية: ', '')}</h4>
                                                <p className={`text-[10px] ${selectedConsultationId === ticket.id ? 'text-gray-300' : 'text-gray-400'}`}>{new Date(ticket.date).toLocaleDateString()}</p>
                                            </button>
                                        ))
                                    )}
                                </div>

                                {/* Right Chat */}
                                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative">
                                    {selectedConsultation ? (
                                        <>
                                            <div className="h-16 flex justify-between items-center px-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm z-10 sticky top-0">
                                                <div>
                                                    <h3 className="font-bold text-[#0c2444] text-sm">{selectedConsultation.subject}</h3>
                                                    <p className="text-xs text-gray-500">{selectedConsultation.clientName}</p>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${selectedConsultation.status === 'resolved' ? 'bg-gray-300' : 'bg-green-500'}`}></div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
                                                {selectedConsultation.messages.map(msg => (
                                                    <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 border-white shadow-sm ${msg.sender === 'admin' ? 'bg-[#0c2444] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                            {msg.sender === 'admin' ? 'Me' : 'C'}
                                                        </div>
                                                        <div className={`py-3 px-5 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed ${msg.sender === 'admin' ? 'bg-[#0c2444] text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'}`}>
                                                            <p>{msg.text}</p>
                                                            <p className={`text-[9px] mt-1 text-right ${msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {selectedConsultation.status !== 'resolved' ? (
                                                <div className="p-4 bg-white border-t border-gray-100">
                                                    <form onSubmit={handleSendReply} className="flex gap-2 items-end bg-[#f8fafc] p-2 rounded-[1.5rem] border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                                                        <div className="flex-1">
                                                            <input 
                                                                type="text" 
                                                                value={replyText} 
                                                                onChange={e=>setReplyText(e.target.value)} 
                                                                className="w-full bg-transparent border-none outline-none text-sm p-3 text-[#0c2444] placeholder-gray-400" 
                                                                placeholder="اكتب ردك..."
                                                            />
                                                        </div>
                                                        <button type="submit" disabled={isReplying || !replyText.trim()} className="bg-[#0c2444] text-white p-3 rounded-xl hover:bg-[#0a1f3b] disabled:opacity-50 transition-all mb-1 ml-1">
                                                            <Send size={18} className="rtl:rotate-180"/>
                                                        </button>
                                                    </form>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 border-t border-gray-200">هذه الاستشارة مغلقة.</div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                                            <Bot size={40} className="mb-2 opacity-20"/>
                                            <p className="text-sm">اختر استشارة لعرض التفاصيل</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default TechnicianDashboard;
