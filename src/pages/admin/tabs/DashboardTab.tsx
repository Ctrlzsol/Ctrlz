
import React, { useMemo } from 'react';
import { 
    TrendingUp, AlertCircle, Users, Ticket, CheckCircle, 
    Calendar as CalendarIcon, Clock, ArrowUpRight, DollarSign, 
    Activity, FileWarning, MessageSquare, ChevronLeft, ShieldAlert, Zap, LayoutDashboard,
    PieChart, BarChart3, Bell, Headphones, CalendarClock, Briefcase, FileText, XCircle, ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInvoice } from '../../../modules/billing/context';
import { useClientData } from '../../../modules/clients/context';
import { useTicket } from '../../../modules/tickets/context';
import { useBooking } from '../../../modules/bookings/context';

const DashboardTab: React.FC<{setActiveTab: (tab: any) => void;}> = ({setActiveTab}) => {
    const { invoices } = useInvoice();
    const { clients } = useClientData();
    const { tickets, orders } = useTicket(); // Added orders
    const { bookings, visitTasks } = useBooking();

    // --- Metrics ---
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const yearlyRevenue = invoices
        .filter(i => new Date(i.issueDate).getFullYear() === currentYear && i.status === 'paid')
        .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const monthlyRevenue = invoices
        .filter(i => new Date(i.issueDate).getMonth() === currentMonth && new Date(i.issueDate).getFullYear() === currentYear && i.status === 'paid')
        .reduce((acc, curr) => acc + curr.totalAmount, 0);

    // Contract Statistics
    const contractStats = useMemo(() => {
        const now = new Date();
        let active = 0;
        let suspended = 0;
        let expired = 0;

        clients.forEach(c => {
            // Check expiry
            let isExpired = false;
            if (c.contractStartDate) {
                const startDate = new Date(c.contractStartDate);
                const endDate = new Date(startDate);
                endDate.setMonth(startDate.getMonth() + (c.contractDurationMonths || 12));
                if (endDate < now) isExpired = true;
            }

            if (c.status === 'suspended') suspended++;
            else if (isExpired) expired++;
            else active++;
        });

        return { active, suspended, expired, total: clients.length };
    }, [clients]);

    // Pending Actions (Action Center Data)
    const pendingBookings = bookings.filter(b => b.status === 'pending' && new Date(b.date) >= new Date());
    const unreadTickets = tickets.filter(t => t.adminHasUnread && t.status !== 'resolved');
    const openTickets = tickets.filter(t => t.status === 'open');
    const pendingOrders = orders.filter(o => o.status === 'pending'); // Added Pending Orders

    // Calculate total actions for the badge or summary
    const totalPendingActions = pendingBookings.length + unreadTickets.length + pendingOrders.length;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
            
            {/* 1. Command Center Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-[#0c2444] to-[#1e3a8a] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[80px] -mr-10 -mt-10"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Activity size={18} className="text-green-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">System Status: Optimal</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">لوحة القيادة</h1>
                    <p className="text-blue-200 text-sm font-medium max-w-md leading-relaxed">
                        نظرة شمولية على الأداء المالي، التفاعل مع العملاء، وحالة النظام التقنية.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[140px]">
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">الدخل السنوي</p>
                        <p className="text-2xl font-black">{yearlyRevenue.toLocaleString()} <span className="text-xs font-normal opacity-70">JOD</span></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[140px]">
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">العملاء الكلي</p>
                        <p className="text-2xl font-black">{clients.length}</p>
                    </div>
                </div>
            </div>

            {/* 2. Interactive Widget Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Main Content (Stats + Action Center) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Stat Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={20}/></div>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase">إيرادات الشهر</p>
                                <h3 className="text-2xl font-black text-[#0c2444]">{monthlyRevenue.toLocaleString()} <span className="text-xs text-gray-400">JOD</span></h3>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} onClick={() => setActiveTab('support')} className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100 shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:border-purple-300 transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white text-purple-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><Headphones size={20}/></div>
                                {openTickets.length > 0 && <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>}
                            </div>
                            <div>
                                <p className="text-purple-600/70 text-xs font-bold uppercase">تذاكر عن بعد (نشطة)</p>
                                <h3 className="text-2xl font-black text-purple-900">{openTickets.length}</h3>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} onClick={() => setActiveTab('calendar')} className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:border-orange-300 transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white text-orange-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><CalendarClock size={20}/></div>
                                {pendingBookings.length > 0 && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>}
                            </div>
                            <div>
                                <p className="text-orange-600/70 text-xs font-bold uppercase">حجوزات بحاجة إلى تأكيد</p>
                                <h3 className="text-2xl font-black text-orange-900">{pendingBookings.length}</h3>
                            </div>
                        </motion.div>
                    </div>

                    {/* ACTION CENTER */}
                    <div className="bg-[#0c2444] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <div className="relative z-10 flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black flex items-center gap-3">
                                    <Bell size={24} className="text-yellow-400"/> مركز الإجراءات
                                </h3>
                                <p className="text-blue-200 text-xs opacity-80 mt-1">لديك {totalPendingActions} مهام عاجلة تتطلب انتباهك</p>
                            </div>
                            <button onClick={() => setActiveTab('notifications')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors backdrop-blur-md">
                                عرض الكل
                            </button>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Pending Orders Cards (NEW) */}
                            {pendingOrders.map(o => (
                                <div key={o.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer group flex justify-between items-center" onClick={() => setActiveTab('orders')}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                            <span className="text-[10px] font-bold text-green-300 uppercase">طلب إضافة جديد</span>
                                        </div>
                                        <p className="font-bold text-sm">{o.clientName}</p>
                                        <p className="text-xs text-blue-200 mt-0.5 line-clamp-1">{o.details}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-[#0c2444] transition-colors">
                                        <ShoppingCart size={16}/>
                                    </div>
                                </div>
                            ))}

                            {/* Pending Bookings Cards */}
                            {pendingBookings.map(b => (
                                <div key={b.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer group flex justify-between items-center" onClick={() => setActiveTab('calendar')}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                            <span className="text-[10px] font-bold text-orange-300 uppercase">حجز بحاجة لتأكيد</span>
                                        </div>
                                        <p className="font-bold text-sm">{b.clientName}</p>
                                        <p className="text-xs text-blue-200 mt-0.5">{new Date(b.date).toLocaleDateString()} - {b.time}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-[#0c2444] transition-colors">
                                        <ArrowUpRight size={16}/>
                                    </div>
                                </div>
                            ))}

                            {/* Unread Tickets Cards */}
                            {unreadTickets.map(t => (
                                <div key={t.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer group flex justify-between items-center" onClick={() => setActiveTab(t.subject.startsWith('استشارة') ? 'consultations' : 'support')}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            <span className="text-[10px] font-bold text-blue-300 uppercase">{t.subject.startsWith('استشارة') ? 'استشارة' : 'تذكرة'} جديدة</span>
                                        </div>
                                        <p className="font-bold text-sm line-clamp-1">{t.subject}</p>
                                        <p className="text-xs text-blue-200 mt-0.5">{t.clientName}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-[#0c2444] transition-colors">
                                        <MessageSquare size={16}/>
                                    </div>
                                </div>
                            ))}

                            {totalPendingActions === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-10 text-center opacity-50 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <CheckCircle size={32} className="mb-2 text-green-400"/>
                                    <p className="text-sm font-bold">لا توجد إجراءات معلقة</p>
                                    <p className="text-[10px]">كل شيء تحت السيطرة!</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* RIGHT: Sidebar Items (Contracts Summary & Quick Actions) */}
                <div className="space-y-8">
                    
                    {/* Contracts Status Summary (Replaces Detailed Table) */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#0c2444] flex items-center gap-2">
                                <Briefcase size={20} className="text-[#0071e3]"/> حالة العقود
                            </h3>
                            <button onClick={() => setActiveTab('clients')} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                                <ArrowUpRight size={16} className="text-gray-500"/>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                        <CheckCircle size={20}/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#0c2444]">{contractStats.active}</p>
                                        <p className="text-[10px] font-bold text-green-700 uppercase">عقود نشطة</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                                        <ShieldAlert size={20}/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#0c2444]">{contractStats.expired}</p>
                                        <p className="text-[10px] font-bold text-orange-700 uppercase">منتهية / بحاجة لتجديد</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                                        <XCircle size={20}/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#0c2444]">{contractStats.suspended}</p>
                                        <p className="text-[10px] font-bold text-red-700 uppercase">معلقة</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-[#0c2444] mb-4">روابط سريعة</h3>
                        <div className="space-y-2">
                            <button onClick={() => setActiveTab('reports')} className="w-full text-right p-3 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-600 transition-colors flex items-center gap-3">
                                <FileText size={16} className="text-gray-400"/> إصدار تقرير جديد
                            </button>
                            <button onClick={() => setActiveTab('financials')} className="w-full text-right p-3 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-600 transition-colors flex items-center gap-3">
                                <DollarSign size={16} className="text-gray-400"/> تسجيل مصروف
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </motion.div>
    );
};

export default DashboardTab;
