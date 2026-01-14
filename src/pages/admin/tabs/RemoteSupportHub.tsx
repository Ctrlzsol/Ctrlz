
import React, { useState, useEffect, useMemo } from 'react';
import { Headphones, CheckCircle, Monitor, ExternalLink, Search, Clock, User, Eye, Loader2 } from 'lucide-react';
import { useTicket } from '../../../modules/tickets/context';
import { RemoteSupportTicket } from '../../../core/types';
import { getStatusLabel, getStatusColor } from '../../../core/utils';
import { supabase } from '../../../lib/supabase';

const RemoteSupportHub: React.FC = () => {
    // We still grab initial data from context to populate the list
    const { remoteSupportTickets, markRemoteSupportAsViewed } = useTicket();
    
    // Local state to allow immediate UI updates as requested
    const [localTickets, setLocalTickets] = useState<RemoteSupportTicket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Sync local state with context on load
    useEffect(() => {
        setLocalTickets(remoteSupportTickets);
    }, [remoteSupportTickets]);

    const filteredTickets = useMemo(() => {
        return localTickets.filter(t => 
            t.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.issue_details.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [localTickets, searchTerm]);

    // --- MANDATORY FUNCTION IMPLEMENTATION FROM SCRATCH ---
    const handleResolveTicket = async (ticketId: string, clientId: string) => {
        alert("بدء اعتماد الحل للتذكرة رقم: " + ticketId);
        
        try {
            console.log("1. Sending Update to Supabase for ID:", ticketId);
            
            // 1. Update Ticket Status
            // Note: Using 'resolved' to map correctly to 'تم معالجة التذكرة' via utils.ts color logic
            const { error: ticketError } = await supabase
                .from('remote_support_tickets')
                .update({ status: 'resolved' }) 
                .eq('id', ticketId);

            if (ticketError) {
                console.error("Ticket Update Error:", ticketError);
                throw ticketError;
            }

            console.log("2. Sending Notification to Client:", clientId);

            // 2. Insert Notification
            const { error: notifError } = await supabase
                .from('notifications')
                .insert([{
                    client_id: clientId, // Schema uses client_id
                    client_name: 'System', // Required by some schemas, filling safe default
                    subject: 'تم معالجة التذكرة',
                    description: 'تم معالجة تذكرة الدعم عن بعد بنجاح ✅',
                    is_deleted: false,
                    created_at: new Date().toISOString()
                }]);

            if (notifError) console.error("فشل إرسال الإشعار ولكن تم الحل", notifError);

            alert("✅ نجحت العملية! تم تغيير الحالة وإرسال التنبيه.");
            
            // 3. Update Local Screen Immediately
            setLocalTickets(prev => prev.map(t => 
                t.id === ticketId ? { ...t, status: 'resolved' } : t
            ));

        } catch (error: any) {
            console.error(error);
            alert("حدث خطأ تقني: " + (error.message || JSON.stringify(error)));
        }
    };

    const handleOpenAnyDesk = async (e: React.MouseEvent, ticket: RemoteSupportTicket) => {
        e.preventDefault();
        e.stopPropagation();
        if (!ticket.anydesk_id) return;
        
        if (ticket.status === 'sent') {
            await markRemoteSupportAsViewed(ticket.id);
        }
        
        window.location.href = `anydesk:${ticket.anydesk_id.replace(/\s/g, '')}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-bold text-[#0c2444] flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                            <Headphones size={24}/>
                        </div>
                        تذاكر الدعم عن بعد
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 mr-16">إدارة طلبات الاتصال المباشر عبر AnyDesk</p>
                </div>
                <div className="relative w-80">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="بحث (اسم العميل، المشكلة)..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[#f8fafc] border-2 border-transparent rounded-2xl py-3 pr-11 pl-4 font-bold text-[#0c2444] text-sm outline-none focus:bg-white focus:border-blue-100 transition-all"
                    />
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-xs text-gray-500 font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-5">العميل</th>
                            <th className="p-5">المستخدم</th>
                            <th className="p-5 w-1/3">تفاصيل المشكلة</th>
                            <th className="p-5">AnyDesk ID</th>
                            <th className="p-5">IP Address</th>
                            <th className="p-5">الحالة</th>
                            <th className="p-5 text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-medium text-[#0c2444]">
                        {filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-10 text-center text-gray-400">لا توجد تذاكر دعم عن بعد.</td>
                            </tr>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <tr key={ticket.id} className={`hover:bg-gray-50/50 transition-colors ${ticket.status === 'sent' ? 'bg-red-50/10' : ''}`}>
                                    <td className="p-5 font-bold">
                                        {ticket.client_name}
                                        {ticket.status === 'sent' && <span className="mr-2 w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>}
                                    </td>
                                    <td className="p-5 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                {ticket.user_name ? ticket.user_name.charAt(0) : 'U'}
                                            </div>
                                            {ticket.user_name}
                                        </div>
                                    </td>
                                    <td className="p-5 text-gray-600 leading-relaxed">{ticket.issue_details}</td>
                                    <td className="p-5 font-mono font-bold text-red-600 tracking-wider">{ticket.anydesk_id}</td>
                                    <td className="p-5 font-mono text-gray-500">{ticket.ip_address || '-'}</td>
                                    <td className="p-5">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getStatusColor(ticket.status)}`}>
                                            {getStatusLabel(ticket.status)}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2 relative z-10">
                                            <button 
                                                type="button"
                                                onClick={(e) => handleOpenAnyDesk(e, ticket)}
                                                className="bg-red-50 text-red-600 p-2 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                                                title="فتح AnyDesk"
                                            >
                                                <ExternalLink size={18}/>
                                            </button>
                                            
                                            {/* --- MANDATORY BUTTON REPLACEMENT --- */}
                                            {ticket.status !== 'resolved' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log("تم النقر على الزر للتذكرة:", ticket.id);
                                                        handleResolveTicket(ticket.id, ticket.client_id);
                                                    }}
                                                    className="bg-green-50 text-green-600 p-2 rounded-xl hover:bg-green-100 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs border border-green-200"
                                                    style={{ cursor: 'pointer', zIndex: 100 }}
                                                    title="اعتماد الحل (إجباري)"
                                                >
                                                    <CheckCircle size={18}/> 
                                                    <span className="hidden lg:inline">اعتماد الحل</span>
                                                </button>
                                            )}
                                            {/* ----------------------------------- */}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RemoteSupportHub;
