import React from 'react';
import { 
    DollarSign, Ticket, Users, Monitor, ChevronLeft, Calendar as CalendarIcon, 
    AlertCircle, Briefcase, Plus, CheckCircle, ArrowRight, TrendingUp, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useClientData } from '../../../modules/clients/context';
import { useTicket } from '../../../modules/tickets/context';
import { useBooking } from '../../../modules/bookings/context';
import { useInvoice } from '../../../modules/billing/context';
import { ClientProfile, VisitTask } from '../../../core/types';
import { StatusBadge } from '../../../ui/components/StatusBadge';

interface OverviewTabProps {
    setActiveTab: (tab: any) => void;
    visitTasks: VisitTask[];
}

const KpiCard = ({ title, value, icon, colorClass, detail }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string, detail?: string }) => (
    <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden`}>
        <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full ${colorClass} opacity-10 blur-xl`}></div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorClass} bg-opacity-10 text-2xl`}>
                {icon}
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-black text-[#0c2444] mt-1">{value}</p>
            {detail && <p className="text-xs text-gray-400 mt-2">{detail}</p>}
        </div>
    </div>
);

const OverviewTab: React.FC<OverviewTabProps> = ({ setActiveTab, visitTasks }) => {
    const { clients } = useClientData();
    const { tickets } = useTicket();
    const { bookings } = useBooking();
    const { invoices } = useInvoice();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = invoices
        .filter(i => new Date(i.issueDate).getMonth() === currentMonth && new Date(i.issueDate).getFullYear() === currentYear && i.status === 'paid')
        .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const pendingAmount = invoices
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const openSupportTickets = tickets.filter(t => !t.subject.startsWith('طلب') && t.status !== 'resolved');
    
    // Updated Actionable Items: Find upcoming confirmed visits that don't have tasks yet.
    const upcomingConfirmedBookings = bookings.filter(b => b.status === 'confirmed' && new Date(b.date) >= new Date());
    const bookingsNeedingTasks = upcomingConfirmedBookings.filter(b => !visitTasks.some(task => task.bookingId === b.id));

    const latestActivities = [...tickets.map(t => ({...t, type: 'ticket', eventDate: t.date})), ...bookings.map(b => ({...b, type: 'booking', eventDate: b.createdAt}))]
        .sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
        .slice(0, 5);


    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
            {/* KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="إيرادات الشهر" value={`${monthlyRevenue.toLocaleString()}`} detail="JOD" icon={<TrendingUp />} colorClass="text-green-500" />
                <KpiCard title="مبالغ معلقة" value={`${pendingAmount.toLocaleString()}`} detail="JOD" icon={<AlertCircle />} colorClass="text-orange-500" />
                <KpiCard title="العملاء النشطين" value={clients.filter(c => c.status === 'active').length} icon={<Users />} colorClass="text-blue-500" />
                <KpiCard title="تذاكر دعم مفتوحة" value={openSupportTickets.length} icon={<Ticket />} colorClass="text-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Action Center & Recent Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Action Center */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-[#0c2444] mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-orange-500"/> مركز الإجراءات</h3>
                        {bookingsNeedingTasks.length > 0 ? (
                            <div className="space-y-3">
                                {bookingsNeedingTasks.map(booking => (
                                    <div key={`action-${booking.id}`} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600`}>
                                                <ClipboardList size={18}/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#0c2444]">{`زيارة قادمة لـ ${booking.clientName}`}</p>
                                                <p className="text-xs text-gray-500">{`لم يتم تحديد مهام لها بعد - ${booking.date}`}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setActiveTab('support')} className="bg-white text-xs font-bold text-[#0c2444] px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1">
                                            متابعة <ChevronLeft size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                                <p className="font-bold">لا توجد إجراءات مطلوبة.</p>
                                <p className="text-xs">كل شيء على ما يرام.</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-[#0c2444] mb-4 flex items-center gap-2"><Monitor size={18}/> آخر الأنشطة</h3>
                        <div className="space-y-2">
                           {latestActivities.map(item => (
                                <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold bg-gray-100 text-gray-500">
                                        {item.clientName.substring(0,2)}
                                    </div>
                                    <p className="text-sm text-gray-600 flex-1">
                                        <span className="font-bold text-[#0c2444]">{item.clientName}</span>
                                        {item.type === 'booking' ? ` لديه حجز بتاريخ ${item.date}` : ` قام بفتح تذكرة جديدة.`}
                                    </p>
                                    <span className="text-xs text-gray-400 font-medium">{new Date(item.eventDate).toLocaleDateString()}</span>
                                </div>
                           ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Quick Actions */}
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setActiveTab('clients')} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-center">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2"><Plus size={20}/></div>
                            <p className="text-xs font-bold text-[#0c2444]">عميل جديد</p>
                        </button>
                        <button onClick={() => setActiveTab('calendar')} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-center">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2"><CalendarIcon size={20}/></div>
                            <p className="text-xs font-bold text-[#0c2444]">حجز جديد</p>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default OverviewTab;