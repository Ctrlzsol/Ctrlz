
import React from 'react';
import { Calendar as CalendarIcon, Edit2, Ticket, MapPin, Trash2, Clock, ShieldCheck, Plus, Zap, AlertTriangle, CheckCircle, Headphones, History, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Booking, Ticket as TicketType } from '../../../core/types';
import { StatusBadge } from '../../../ui/components/StatusBadge';

interface ClientOverviewProps {
    t: any;
    actualRemainingVisits: number;
    actualRemainingTickets: number;
    upcomingBookings: Booking[];
    canEditBooking: (date: string, time?: string) => boolean;
    setBookingToReschedule: (id: string) => void;
    setIsVisitModalOpen: (open: boolean) => void;
    handleVisitRequest: () => void;
    setIsTicketModalOpen: (open: boolean) => void;
    handleCancelBooking: (booking: Booking) => void;
    setBookingSuccess: (success: { date: string; time: string } | null) => void;
    remoteSupportTickets?: TicketType[]; 
}

const ClientOverview: React.FC<ClientOverviewProps> = ({ 
    t, 
    actualRemainingVisits, 
    actualRemainingTickets, 
    upcomingBookings, 
    canEditBooking, 
    setBookingToReschedule, 
    setIsVisitModalOpen, 
    handleVisitRequest, 
    setIsTicketModalOpen, 
    handleCancelBooking, 
    setBookingSuccess,
    remoteSupportTickets = [] 
}) => {
    
    const nextVisit = upcomingBookings[0];
    const currentMonthName = new Date().toLocaleString('ar-EG', { month: 'long' });

    return (
        <div className="space-y-10">
            
            {/* 1. HERO / SYSTEM STATUS */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-inner border-4 border-white">
                            <ShieldCheck size={40} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#0c2444] mb-1">حالة النظام: مستقرة</h2>
                            <p className="text-gray-500 font-medium">جميع الأنظمة تعمل بكفاءة. لا توجد تهديدات مكتشفة.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleVisitRequest} className="bg-white border border-gray-200 text-[#0c2444] px-6 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95 flex items-center gap-2">
                            <CalendarIcon size={18}/> حجز زيارة
                        </button>
                        <button onClick={() => setIsTicketModalOpen(true)} className="bg-[#0c2444] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-900/10 hover:bg-[#0a1f3b] hover:shadow-xl transition-all active:scale-95 flex items-center gap-2">
                            <Headphones size={18} /> فتح تذكرة دعم عن بعد
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* 2. REDESIGNED VISUAL BALANCES CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visits Card - Dark Theme */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative bg-[#0c2444] rounded-[2.5rem] p-8 overflow-hidden text-white shadow-2xl group min-h-[240px] flex flex-col justify-between"
                >
                    {/* Abstract Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071e3] opacity-20 rounded-full blur-[80px] -mr-16 -mt-16 transition-all group-hover:opacity-30"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 opacity-10 rounded-full blur-[60px] -ml-10 -mb-10"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col">
                                <span className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1 opacity-80">الرصيد المتاح</span>
                                <h3 className="text-2xl font-bold tracking-tight">الزيارات الميدانية</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                <MapPin className="text-[#4dade8]" size={24} />
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-black tracking-tighter text-white drop-shadow-sm">{actualRemainingVisits}</span>
                            <span className="text-xl text-blue-200 font-medium">زيارات</span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-blue-200">
                            <CalendarIcon size={14}/>
                            <span>متبقي لشهر {currentMonthName}</span>
                        </div>
                        <button 
                            onClick={handleVisitRequest} 
                            className="bg-[#0071e3] hover:bg-[#0062c9] text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 group-hover:translate-x-1"
                        >
                            طلب زيارة <ArrowRight size={14} className="rtl:rotate-180"/>
                        </button>
                    </div>
                </motion.div>

                {/* Tickets Card - Light Theme */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-white rounded-[2.5rem] p-8 overflow-hidden text-[#0c2444] shadow-lg border border-gray-100 group min-h-[240px] flex flex-col justify-between"
                >
                    {/* Abstract Decor */}
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 opacity-5 rounded-full blur-[80px] -ml-16 -mb-16 transition-all group-hover:opacity-10"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col">
                                <span className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-1 opacity-80">الرصيد المتاح</span>
                                <h3 className="text-2xl font-bold tracking-tight">تذاكر الدعم عن بعد</h3>
                            </div>
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform duration-300">
                                <Ticket className="text-orange-600" size={24} />
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-black tracking-tighter text-[#0c2444]">{actualRemainingTickets}</span>
                            <span className="text-xl text-gray-400 font-medium">تذكرة</span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span>فريق الدعم متصل وجاهز</span>
                        </div>
                        <button 
                            onClick={() => setIsTicketModalOpen(true)} 
                            className="bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 group-hover:translate-x-1"
                        >
                            فتح تذكرة <Plus size={14}/>
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* UPCOMING SCHEDULE */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#0c2444]">الجدول القادم</h3>
                    {upcomingBookings.length > 0 && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{upcomingBookings.length} مواعيد</span>}
                </div>

                {upcomingBookings.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center text-gray-400">
                        <CalendarIcon size={48} className="mb-4 opacity-20"/>
                        <p className="font-bold text-lg text-gray-500">لا توجد مواعيد قادمة</p>
                        <p className="text-sm mt-1">يمكنك طلب زيارة جديدة في أي وقت.</p>
                        <button onClick={handleVisitRequest} className="mt-6 text-[#0071e3] font-bold text-sm hover:underline">حجز موعد الآن</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingBookings.map((booking, idx) => {
                            const canEdit = canEditBooking(booking.date, booking.time);
                            const isNext = idx === 0; // Highlight the very next appointment

                            return (
                                <div 
                                    key={booking.id} 
                                    className={`relative p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${
                                        isNext 
                                        ? 'bg-[#0c2444] text-white shadow-xl shadow-blue-900/10' 
                                        : 'bg-white border border-gray-100 text-[#0c2444] hover:shadow-md'
                                    }`}
                                >
                                    {isNext && <div className="absolute top-4 left-4 bg-[#0071e3] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">الزيارة القادمة</div>}
                                    
                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 ${isNext ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            <span className="text-xs uppercase opacity-60">{new Date(booking.date).toLocaleString('en-US', {month: 'short'})}</span>
                                            <span className="text-2xl">{new Date(booking.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold mb-1 flex items-center gap-2">
                                                زيارة صيانة {booking.branchName && `- ${booking.branchName}`}
                                            </h4>
                                            <div className={`flex items-center gap-4 text-sm font-medium ${isNext ? 'text-blue-200' : 'text-gray-500'}`}>
                                                <span className="flex items-center gap-1"><Clock size={14}/> {booking.time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {booking.status === 'confirmed' ? (
                                            <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${isNext ? 'bg-green-500/20 text-green-300' : 'bg-green-50 text-green-600'}`}>
                                                <CheckCircle size={14}/> مؤكد
                                            </div>
                                        ) : booking.status === 'pending' ? (
                                            <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${isNext ? 'bg-orange-500/20 text-orange-200' : 'bg-orange-50 text-orange-600'}`}>
                                                <Clock size={14}/> قيد المراجعة
                                            </div>
                                        ) : (
                                            <StatusBadge status={booking.status} className={isNext ? 'bg-white/10 border-white/20 text-white' : ''} />
                                        )}

                                        {canEdit && (booking.status === 'confirmed' || booking.status === 'pending') && (
                                            <div className="flex gap-2 mr-auto md:mr-0">
                                                <button 
                                                    onClick={() => { setBookingToReschedule(booking.id); setBookingSuccess(null); setIsVisitModalOpen(true); }}
                                                    className={`p-2 rounded-xl transition-colors ${isNext ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                                >
                                                    <Edit2 size={16}/>
                                                </button>
                                                <button 
                                                    onClick={() => handleCancelBooking(booking)}
                                                    className={`p-2 rounded-xl transition-colors ${isNext ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ClientOverview;
