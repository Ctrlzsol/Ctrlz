
import React, { useMemo } from 'react';
import { 
    CalendarPlus, 
    ShoppingCart, 
    MessageSquare, 
    Headphones, 
    CheckCircle, 
    ArrowRight, 
    Zap,
    Clock,
    ClipboardList,
    XCircle,
    Edit3
} from 'lucide-react';
import { useTicket } from '../../../modules/tickets/context';
import { useBooking } from '../../../modules/bookings/context';
import { useClientData } from '../../../modules/clients/context';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from '../../../core/types';

interface ActionCenterProps {
    onNavigate: (tab: string) => void;
    onOpenBookingAction: (booking: Booking) => void;
}

const ActionCenter: React.FC<ActionCenterProps> = ({ onNavigate, onOpenBookingAction }) => {
    const { bookings } = useBooking();
    const { tickets, consultations, orders } = useTicket(); 
    const { visitTasks } = useBooking(); 
    const { clients } = useClientData();

    // --- AGGREGATE ALL ACTIONABLE ITEMS ---
    const allActions = useMemo(() => {
        const list: any[] = [];

        // 1. Pending Bookings
        bookings.filter(b => b.status === 'pending').forEach(b => {
            list.push({
                id: b.id,
                type: 'booking',
                clientId: b.clientId,
                clientName: b.clientName,
                title: 'طلب حجز موعد',
                detail: `${b.date} - ${b.time}`,
                date: b.createdAt || b.date,
                priority: 'high',
                originalObject: b // Pass the full booking object
            });
        });

        // 2. Pending Orders (Add-ons)
        orders.filter(o => o.status === 'pending').forEach(o => {
            list.push({
                id: o.id,
                type: 'order',
                clientId: o.clientId,
                clientName: o.clientName,
                title: 'طلب إضافة جديد',
                detail: o.details, // This contains "Add-on Request: ..." or similar
                date: o.createdAt,
                priority: 'high'
            });
        });

        // 3. Open Support Tickets
        tickets.filter(t => t.status === 'open' || (t.adminHasUnread && t.status !== 'resolved')).forEach(t => {
            list.push({
                id: t.id,
                type: 'ticket',
                clientId: t.clientId,
                clientName: t.clientName,
                title: `تذكرة: ${t.subject}`,
                detail: t.description,
                date: t.date,
                priority: t.priority === 'high' ? 'high' : 'medium'
            });
        });

        // 4. Open Consultations (Unread)
        consultations.filter(c => c.status === 'open').forEach(c => {
            const lastMsg = c.messages[c.messages.length - 1];
            if (lastMsg?.sender === 'client') {
                list.push({
                    id: c.id,
                    type: 'consultation',
                    clientId: c.clientId,
                    clientName: c.clientName,
                    title: `استشارة: ${c.subject}`,
                    detail: lastMsg.text,
                    date: c.lastUpdated || c.createdAt,
                    priority: 'medium'
                });
            }
        });

        // 5. Client Requested Tasks (Pending)
        visitTasks.filter(t => t.type === 'client_request' && !t.isCompleted && t.status !== 'cancelled').forEach(t => {
            list.push({
                id: t.id,
                type: 'client_task',
                clientId: t.clientId,
                clientName: clients.find(c => c.id === t.clientId)?.companyName || 'Unknown',
                title: 'طلب مهمة زيارة',
                detail: t.text,
                date: t.visitDate || new Date().toISOString(),
                priority: 'medium'
            });
        });

        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bookings, orders, tickets, consultations, visitTasks, clients]);

    // --- HANDLERS ---
    const handleBookingClick = (booking: Booking) => {
        onOpenBookingAction(booking);
    };

    const handleNavigateTo = (type: string) => {
        switch (type) {
            case 'booking': onNavigate('calendar'); break;
            case 'order': onNavigate('orders'); break;
            case 'ticket': onNavigate('support'); break;
            case 'consultation': onNavigate('consultations'); break;
            case 'client_task': onNavigate('tasks'); break;
            default: break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <CalendarPlus className="text-blue-500" size={24} />;
            case 'order': return <ShoppingCart className="text-orange-500" size={24} />;
            case 'ticket': return <Headphones className="text-purple-500" size={24} />;
            case 'consultation': return <MessageSquare className="text-emerald-500" size={24} />;
            case 'client_task': return <ClipboardList className="text-indigo-500" size={24} />;
            default: return <Zap className="text-gray-500" size={24} />;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'booking': return 'حجز موعد';
            case 'order': return 'طلب إضافة';
            case 'ticket': return 'دعم فني';
            case 'consultation': return 'استشارة';
            case 'client_task': return 'طلب مهمة';
            default: return 'إجراء';
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="bg-[#0c2444] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black flex items-center gap-4">
                            <Zap size={32} className="text-yellow-400" />
                            مركز الإجراءات الموحد
                        </h3>
                        <p className="text-blue-200 text-sm mt-2 opacity-80">
                            لديك <span className="font-bold text-white text-lg mx-1">{allActions.length}</span> طلبات وإجراءات تتطلب الانتباه.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                            <p className="text-xs text-blue-200 font-bold uppercase mb-1">المهام المعلقة</p>
                            <p className="text-3xl font-black">{allActions.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {allActions.length === 0 ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-24 text-gray-400 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                            <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                            <p className="text-xl font-bold text-[#0c2444]">جميع المهام منجزة!</p>
                            <p className="text-sm">لا توجد إجراءات معلقة حالياً.</p>
                        </motion.div>
                    ) : (
                        allActions.map((item) => (
                            <motion.div 
                                key={`${item.type}-${item.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6 group ${item.type === 'order' ? 'border-orange-100 bg-orange-50/10' : 'border-gray-100'}`}
                            >
                                {/* Icon & Type */}
                                <div className="flex items-center gap-4 md:w-1/4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-blue-50 transition-colors">
                                        {getIcon(item.type)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{getLabel(item.type)}</p>
                                        <h4 className="font-bold text-[#0c2444] text-base line-clamp-1">{item.clientName}</h4>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                    <h5 className="font-bold text-[#0c2444] text-lg mb-1">{item.title}</h5>
                                    <p className="text-sm text-gray-500 line-clamp-1 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                                        {item.detail}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                        <Clock size={12}/> {new Date(item.date).toLocaleDateString('ar-EG')}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end">
                                    
                                    {/* Specific Booking Actions (Inline) */}
                                    {item.type === 'booking' && (
                                        <button 
                                            onClick={() => handleBookingClick(item.originalObject)} 
                                            className="bg-[#0c2444] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0a1f3b] transition-colors flex items-center gap-2 shadow-sm"
                                        >
                                            <Edit3 size={16}/> اتخاذ إجراء (تأكيد/تعديل)
                                        </button>
                                    )}

                                    {/* Generic "Go To" Action for others */}
                                    {item.type !== 'booking' && (
                                        <button 
                                            onClick={() => handleNavigateTo(item.type)} 
                                            className="bg-[#0c2444] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#0a1f3b] transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
                                        >
                                            مراجعة واتخاذ قرار <ArrowRight size={16} className="rtl:rotate-180"/>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActionCenter;
