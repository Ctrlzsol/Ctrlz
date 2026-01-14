
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Headphones, Send, User, Check, MessageSquare, Search, Monitor, Copy, Cpu, ExternalLink, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTicket } from '../../../modules/tickets/context';
import { useClientData } from '../../../modules/clients/context';
import { useBooking } from '../../../modules/bookings/context';

const SupportHub: React.FC = () => {
    const { tickets, addReply, updateTicketStatus } = useTicket();
    const { clients } = useClientData();
    
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [ipAddress, setIpAddress] = useState('');

    // --- UPDATED FILTERING LOGIC ---
    const supportTickets = useMemo(() => {
        return tickets.filter(t => 
            // Show if type is support OR type is missing (legacy) AND not an order/consultation
            (!t.type || t.type === 'support') && 
            t.status !== 'resolved' && 
            (t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [tickets, searchTerm]);

    const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedTicketId), [tickets, selectedTicketId]);

    const selectedClient = useMemo(() => {
        if (!selectedTicket) return null;
        return clients.find(c => c.id === selectedTicket.clientId);
    }, [selectedTicket, clients]);

    const affectedUser = useMemo(() => {
        if (!selectedClient || !selectedTicket?.affectedUserId) return null;
        return selectedClient.usersList?.find(u => u.id === selectedTicket.affectedUserId);
    }, [selectedClient, selectedTicket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedTicket?.messages]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !replyText.trim()) return;
        await addReply(selectedTicket.id, { id: `m-${Date.now()}`, sender: 'admin', senderName: 'الدعم الفني', text: replyText, timestamp: new Date().toISOString() });
        setReplyText('');
    };
    
    const handleResolveTicket = async () => {
        if (!selectedTicket) return;
        if(window.confirm('هل أنت متأكد من إغلاق هذه التذكرة؟ سيتم إرسال رسالة وداعية للعميل.')) {
            await addReply(selectedTicket.id, { 
                id: `sys-${Date.now()}`, 
                sender: 'admin', 
                senderName: 'الدعم الفني', 
                text: 'تم حل التذكرة بنجاح. شكراً لتعاونكم معنا.', 
                timestamp: new Date().toISOString() 
            });
            await updateTicketStatus(selectedTicket.id, 'resolved');
            setSelectedTicketId(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    const launchAnyDesk = (id: string) => {
        // Tries to launch AnyDesk using protocol handler
        window.location.href = `anydesk:${id}`;
    };

    return (
        <div className="h-[calc(100vh-140px)] bg-[#f5f5f7] rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-row relative">
            
            {/* 1. Left Sidebar: Ticket List (Requests) */}
            <div className="w-96 border-l border-gray-100 flex flex-col bg-white shrink-0 z-20">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-[#0c2444] text-xl mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><Headphones size={20}/></div>
                        طلبات الدعم عن بعد <span className="bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-full">{supportTickets.length}</span>
                    </h3>
                    <div className="relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                        <input 
                            type="text" 
                            placeholder="بحث عن تذكرة..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 pr-11 pl-4 text-sm font-bold text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {supportTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3"><Check size={32} className="text-gray-300"/></div>
                            <p className="font-bold text-gray-500">لا توجد طلبات دعم حالياً</p>
                        </div>
                    ) : (
                        supportTickets.map(t => (
                            <button 
                                key={t.id}
                                onClick={() => setSelectedTicketId(t.id)}
                                className={`w-full text-right p-4 rounded-2xl transition-all border group relative overflow-hidden ${selectedTicketId === t.id ? 'bg-[#0c2444] border-[#0c2444] shadow-lg shadow-blue-900/20' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'}`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className={`font-bold text-sm line-clamp-1 ${selectedTicketId === t.id ? 'text-white' : 'text-[#0c2444]'}`}>{t.subject}</span>
                                    {t.adminHasUnread && <span className="w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
                                </div>
                                <div className="flex items-center gap-2 mb-3 relative z-10">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedTicketId === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {t.clientName.charAt(0)}
                                    </div>
                                    <p className={`text-xs ${selectedTicketId === t.id ? 'text-blue-200' : 'text-gray-500'}`}>{t.clientName}</p>
                                </div>
                                <div className="flex justify-between items-center relative z-10">
                                    <span className={`text-[10px] ${selectedTicketId === t.id ? 'text-gray-400' : 'text-gray-400'}`}>{new Date(t.date).toLocaleDateString('ar-EG')}</span>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${selectedTicketId === t.id ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                                        دعم فني
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* 2. Main Content: Remote Connection Dashboard */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {!selectedTicket ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                            <Monitor size={50} className="text-gray-300" />
                        </div>
                        <p className="font-bold text-xl text-[#0c2444]">شاشة التحكم بالدعم عن بعد</p>
                        <p className="text-sm mt-2">اختر تذكرة للبدء في الاتصال ومعالجة المشكلة</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        
                        {/* Header */}
                        <div className="h-20 bg-white border-b border-gray-200 flex justify-between items-center px-8 shrink-0">
                            <div>
                                <h4 className="font-black text-[#0c2444] text-lg">{selectedTicket.subject}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    جلسة دعم نشطة
                                    <span className="text-gray-300">|</span>
                                    <span>Ticket #{selectedTicket.id.substring(0,6)}</span>
                                </div>
                            </div>
                            <button onClick={handleResolveTicket} className="flex items-center gap-2 bg-white border border-green-200 text-green-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-50 transition-all shadow-sm">
                                <CheckCircle size={18}/> إنهاء وإغلاق التذكرة
                            </button>
                        </div>

                        {/* WORKSPACE GRID */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            
                            {/* TOP ROW: CONNECTION INFO & USER DETAILS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* CARD 1: User & AnyDesk Info */}
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-bold text-xl border border-red-100">
                                                {selectedTicket.affectedUserName ? selectedTicket.affectedUserName.charAt(0) : <User/>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">المستخدم المتضرر</p>
                                                <h3 className="text-xl font-black text-[#0c2444]">{selectedTicket.affectedUserName || 'غير محدد'}</h3>
                                                <p className="text-xs text-gray-500">{affectedUser?.position || 'موظف'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* AnyDesk Section */}
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                                    <Monitor size={20}/>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">AnyDesk ID</p>
                                                    <p className="font-mono font-black text-lg text-[#0c2444] tracking-widest">
                                                        {affectedUser?.anyDeskId || 'غير مسجل'}
                                                    </p>
                                                </div>
                                            </div>
                                            {affectedUser?.anyDeskId && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => copyToClipboard(affectedUser.anyDeskId!)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500" title="نسخ">
                                                        <Copy size={16}/>
                                                    </button>
                                                    <button onClick={() => launchAnyDesk(affectedUser.anyDeskId!)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-200">
                                                        <ExternalLink size={14}/> اتصال
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* IP Address Section */}
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                    <Cpu size={20}/>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-blue-400 uppercase">IP Address (للإتصال المباشر)</p>
                                                    <input 
                                                        type="text" 
                                                        value={ipAddress} 
                                                        onChange={(e) => setIpAddress(e.target.value)} 
                                                        placeholder="أدخل IP الجهاز (مثال: 192.168.1.50)"
                                                        className="bg-transparent font-mono font-bold text-[#0c2444] w-full outline-none placeholder:text-blue-300/70"
                                                    />
                                                </div>
                                            </div>
                                            {ipAddress && (
                                                <button onClick={() => copyToClipboard(ipAddress)} className="p-2 bg-white/50 hover:bg-white rounded-lg text-blue-600 transition-colors">
                                                    <Copy size={16}/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* CARD 2: Problem Description */}
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col">
                                    <h4 className="font-bold text-[#0c2444] mb-4 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-gray-400"/> وصف المشكلة
                                    </h4>
                                    <div className="bg-[#f8fafc] p-5 rounded-2xl border border-gray-100 flex-1 overflow-y-auto max-h-[220px]">
                                        <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedTicket.description}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <div className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500">
                                            الأولوية: {selectedTicket.priority === 'high' ? 'عالية 🔥' : 'عادية'}
                                        </div>
                                        <div className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500">
                                            العميل: {selectedClient?.companyName}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM ROW: CHAT / LOG */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[400px]">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-[2rem]">
                                    <h4 className="font-bold text-[#0c2444] text-sm">سجل المحادثة والإجراءات</h4>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                                    {selectedTicket.messages.map(msg => (
                                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 border-white shadow-sm ${msg.sender === 'admin' ? 'bg-[#0c2444] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                {msg.sender === 'admin' ? 'الدعم' : 'العميل'}
                                            </div>
                                            <div className={`py-3 px-5 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.sender === 'admin' ? 'bg-[#0c2444] text-white rounded-tl-none' : 'bg-gray-100 text-[#0c2444] rounded-tr-none'}`}>
                                                <p>{msg.text}</p>
                                                <p className={`text-[9px] mt-1 text-right opacity-60`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[2rem]">
                                    <form onSubmit={handleSendReply} className="flex gap-4 items-end bg-white p-2 rounded-[1.5rem] border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-sm">
                                        <div className="flex-1">
                                            <textarea 
                                                value={replyText} 
                                                onChange={e=>setReplyText(e.target.value)} 
                                                className="w-full bg-transparent border-none outline-none text-sm p-3 resize-none max-h-32 text-[#0c2444] placeholder-gray-400 min-h-[50px]"
                                                rows={1}
                                                placeholder="اكتب ردك أو ملاحظة هنا..."
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(e); } }}
                                            />
                                        </div>
                                        <button type="submit" disabled={!replyText.trim()} className="bg-[#0c2444] text-white p-3 rounded-xl hover:bg-[#0a1f3b] disabled:opacity-50 transition-all mb-1 ml-1 shadow-md">
                                            <Send size={18} className="rtl:rotate-180"/>
                                        </button>
                                    </form>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportHub;
