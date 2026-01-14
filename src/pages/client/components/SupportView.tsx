
import React from 'react';
import { Headphones, Plus, History, Monitor, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { RemoteSupportTicket } from '../../../core/types';
import { motion } from 'framer-motion';

interface SupportViewProps {
    tickets: RemoteSupportTicket[];
    onOpenTicket: () => void;
    clientUsers: any[];
}

const SupportView: React.FC<SupportViewProps> = ({ tickets, onOpenTicket, clientUsers }) => {
    
    // Status Logic for Remote Support (Client View) - PRECISE MAPPING
    const getClientStatusLabel = (status: string) => {
        if (status === 'sent') return 'تم الإرسال للفني';
        if (status === 'viewed') return 'قيد المعالجة من قبل الفني';
        if (status === 'resolved') return 'تم معالجة التذكرة';
        return status;
    };

    const getClientStatusColor = (status: string) => {
        if (status === 'sent') return 'bg-orange-100 text-orange-700 border-orange-200';
        if (status === 'viewed') return 'bg-blue-100 text-blue-700 border-blue-200';
        if (status === 'resolved') return 'bg-green-100 text-green-700 border-green-200';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="space-y-8">
            {/* 1. Header & Action */}
            <div className="bg-[#0c2444] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h3 className="text-3xl font-black flex items-center gap-4 mb-2">
                        <Headphones size={32} className="text-yellow-400"/> الدعم الفني عن بعد
                    </h3>
                    <p className="text-blue-200 text-sm max-w-md leading-relaxed">
                        هل تواجه مشكلة تقنية؟ افتح تذكرة دعم وسيقوم فريقنا بالاتصال بجهازك وحل المشكلة فوراً.
                    </p>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                    <button 
                        onClick={onOpenTicket}
                        className="w-full md:w-auto bg-white text-[#0c2444] px-8 py-4 rounded-2xl font-bold text-base hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Plus size={20}/> فتح تذكرة دعم جديدة
                    </button>
                </div>
            </div>

            {/* 2. Tickets History List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#0c2444] flex items-center gap-2">
                        <History size={20} className="text-gray-400"/> سجل التذاكر
                    </h3>
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">
                        {tickets.length} تذكرة
                    </span>
                </div>

                {tickets.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                        <Monitor size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="text-lg font-bold text-[#0c2444]">لا توجد تذاكر دعم سابقة</p>
                        <p className="text-sm">عندما تواجه مشكلة، ستظهر جميع التذاكر هنا.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <motion.div 
                                key={ticket.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center ${ticket.status === 'resolved' ? 'bg-green-50/30 border-green-100' : 'bg-white border-gray-100'}`}
                            >
                                {/* Icon Status */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-sm ${ticket.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {ticket.status === 'resolved' ? <CheckCircle size={24}/> : <Clock size={24}/>}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h4 className="font-bold text-[#0c2444] text-lg line-clamp-1">{ticket.issue_details}</h4>
                                        
                                        {/* Status Badge */}
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${getClientStatusColor(ticket.status)}`}>
                                            {ticket.status === 'resolved' && <CheckCircle size={10} />}
                                            {getClientStatusLabel(ticket.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{ticket.issue_details}</p>
                                    
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                            <User size={12}/> المستخدم المتضرر: <span className="text-[#0c2444] font-bold">{ticket.user_name || 'غير محدد'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                            {new Date(ticket.created_at).toLocaleDateString('ar-EG')}
                                        </div>
                                    </div>
                                </div>

                                {/* AnyDesk ID (If Available) */}
                                {ticket.anydesk_id && (
                                    <div className="hidden md:block bg-white/80 px-4 py-3 rounded-xl border border-gray-200 text-center min-w-[120px]">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">AnyDesk ID</p>
                                        <p className="font-mono font-black text-[#0c2444]">
                                            {ticket.anydesk_id}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportView;
