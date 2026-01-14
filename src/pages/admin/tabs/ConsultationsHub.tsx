
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bot, Search, Plus, X, User, CheckCircle, Lock, Loader2, AlertCircle, RefreshCw, MoreVertical, Trash2 } from 'lucide-react';
import { useTicket } from '../../../modules/tickets/context';
import { useClientData } from '../../../modules/clients/context';
import { motion, AnimatePresence } from 'framer-motion';

const ConsultationsHub: React.FC = () => {
    const { consultations, addConsultationReply, resolveConsultation, createConsultation } = useTicket();
    const { clients } = useClientData();
    
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // Modal State
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [newClient, setNewClient] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');

    // --- Strict Handle Close Function (Fixed White Screen Issue) ---
    const handleCloseConsultation = async (id: string) => {
        setIsClosing(true);
        try {
            const closingMsg = { 
                id: `sys-${Date.now()}`, 
                sender: 'admin', 
                senderName: 'الدعم الفني', 
                text: "شكراً لتواصلكم معنا، تم انتهاء الاستشارة التقنية بنجاح. نحن دائماً في خدمتكم", 
                timestamp: new Date().toISOString() 
            };

            // This function in context performs the DB update and local state update safely
            const success = await resolveConsultation(id, closingMsg);

            if (!success) throw new Error("فشل التحديث في قاعدة البيانات");

            // Removed window.location.reload() to prevent crash. 
            // The Context API automatically updates the UI.
            
        } catch (err: any) {
            console.error(err);
            alert("فشل الإغلاق: " + err.message);
        } finally {
            setIsClosing(false);
        }
    };

    // Filter Logic
    const filteredConsultations = useMemo(() => {
        return consultations
            .filter(c => 
                c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.subject.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                if (a.status === 'open' && b.status === 'resolved') return -1;
                if (a.status === 'resolved' && b.status === 'open') return 1;
                return new Date(b.lastUpdated || b.createdAt).getTime() - new Date(a.lastUpdated || a.createdAt).getTime();
            });
    }, [consultations, searchTerm]);

    const selectedConsultation = useMemo(() => consultations.find(c => c.id === selectedId), [consultations, selectedId]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedConsultation?.messages, selectedId]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConsultation || !replyText.trim()) return;
        setIsSending(true);
        try {
            await addConsultationReply(selectedConsultation.id, { 
                id: `m-${Date.now()}`, 
                sender: 'admin', 
                senderName: 'فريق الدعم', 
                text: replyText, 
                timestamp: new Date().toISOString() 
            }, selectedConsultation.messages);
            setReplyText('');
        } catch (error) {
            console.error(error);
            alert("فشل إرسال الرسالة");
        } finally {
            setIsSending(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const client = clients.find(c => c.id === newClient);
        if(!client) return;

        await createConsultation({
            client_id: client.id,
            client_name: client.companyName,
            subject: `استشارة: ${newSubject}`,
            messages: [{ id: `m-${Date.now()}`, sender: 'admin', senderName: 'فريق الدعم', text: newMessage, timestamp: new Date().toISOString() }]
        });
        
        setIsNewModalOpen(false); setNewClient(''); setNewSubject(''); setNewMessage('');
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-140px)] bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-row relative">
            
            {/* RIGHT SIDEBAR: Chat List */}
            <div className="w-80 md:w-96 border-l border-gray-100 flex flex-col bg-white shrink-0 z-10">
                <div className="p-6 border-b border-gray-100 bg-[#f8fafc]/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[#0c2444] text-lg flex items-center gap-2">
                            <Bot size={22} className="text-[#0071e3]"/> الاستشارات
                            <span className="bg-blue-100 text-[#0071e3] text-xs px-2 py-1 rounded-full font-bold">{filteredConsultations.filter(c => c.status === 'open').length}</span>
                        </h3>
                        <button onClick={() => setIsNewModalOpen(true)} className="w-8 h-8 bg-[#0c2444] text-white rounded-full flex items-center justify-center hover:bg-[#0a1f3b] transition-colors shadow-md">
                            <Plus size={18}/>
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="بحث في المحادثات..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-xs font-bold text-[#0c2444] outline-none focus:border-blue-200 transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {filteredConsultations.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <MessageSquare size={32} className="mx-auto mb-2 opacity-20"/>
                            <p className="text-xs">لا توجد محادثات نشطة</p>
                        </div>
                    ) : (
                        filteredConsultations.map(c => {
                            const lastMsg = c.messages[c.messages.length - 1];
                            const isSelected = selectedId === c.id;
                            const hasUnread = lastMsg?.sender === 'client' && !isSelected;

                            return (
                                <button 
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    className={`w-full text-right p-4 rounded-2xl transition-all border group relative overflow-hidden ${
                                        isSelected 
                                        ? 'bg-[#0c2444] border-[#0c2444] shadow-lg shadow-blue-900/10' 
                                        : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1.5 relative z-10">
                                        <h4 className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-white' : 'text-[#0c2444]'}`}>
                                            {c.clientName}
                                        </h4>
                                        <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {formatTime(c.lastUpdated || c.createdAt)}
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className={`font-bold text-xs mb-1 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-[#0071e3]'}`}>
                                            {c.subject.replace('استشارة:', '').replace('استشارة تقنية:', '')}
                                        </p>
                                        <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {lastMsg?.sender === 'admin' ? 'أنت: ' : ''}{lastMsg?.text}
                                        </p>
                                    </div>
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {hasUnread && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>}
                                        {c.status === 'resolved' && <CheckCircle size={14} className={isSelected ? 'text-green-400' : 'text-green-600'} />}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* LEFT AREA: Chat Window */}
            <div className="flex-1 flex flex-col bg-[#f0f4f9] relative min-w-0">
                {!selectedConsultation ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Bot size={40} className="text-gray-300" />
                        </div>
                        <p className="font-bold text-lg text-[#0c2444]">غرفة الاستشارات</p>
                        <p className="text-sm mt-1">اختر محادثة من القائمة للبدء</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 bg-white/90 backdrop-blur-md border-b border-gray-200 flex justify-between items-center px-8 sticky top-0 z-[1000]">
                            <div>
                                <h4 className="font-bold text-[#0c2444] text-base">{selectedConsultation.subject}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <User size={12}/> {selectedConsultation.clientName}
                                    <span className="text-gray-300">|</span>
                                    <span className={`font-bold ${selectedConsultation.status === 'open' ? 'text-green-600' : 'text-gray-500'}`}>
                                        {selectedConsultation.status === 'open' ? 'مفتوحة للنقاش' : 'تم إغلاق الاستشارة'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* CLOSE BUTTON - REBUILT AS REQUESTED */}
                            {selectedConsultation.status !== 'resolved' ? (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCloseConsultation(selectedConsultation.id);
                                    }}
                                    disabled={isClosing}
                                    style={{ 
                                        zIndex: 9999, 
                                        cursor: 'pointer', 
                                        position: 'relative',
                                        backgroundColor: '#ef4444', 
                                        color: 'white',
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {isClosing ? <Loader2 size={16} className="animate-spin"/> : <Lock size={16}/>}
                                    {isClosing ? 'جاري الإغلاق...' : 'إغلاق الاستشارة'}
                                </button>
                            ) : (
                                <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-200">
                                    <CheckCircle size={14}/> الاستشارة مغلقة
                                </div>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {selectedConsultation.messages.map((msg, idx) => {
                                const isAdmin = msg.sender === 'admin';
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx} 
                                        className={`flex items-end gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 border-white shadow-sm ${isAdmin ? 'bg-[#0c2444] text-white' : 'bg-white text-[#0c2444]'}`}>
                                            {isAdmin ? 'D' : 'C'}
                                        </div>
                                        <div className={`py-3 px-5 rounded-2xl max-w-[70%] text-sm leading-relaxed shadow-sm ${
                                            isAdmin 
                                            ? 'bg-[#0c2444] text-white rounded-tl-none' 
                                            : 'bg-white border border-gray-100 text-[#0c2444] rounded-tr-none'
                                        }`}>
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                            <p className={`text-[9px] mt-2 text-right opacity-60 font-mono`}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            
                            {selectedConsultation.status === 'resolved' && (
                                <div className="flex justify-center my-6">
                                    <span className="bg-gray-200 text-gray-500 text-[10px] px-4 py-2 rounded-full font-bold flex items-center gap-2">
                                        <Lock size={12}/> تم إغلاق هذه المحادثة
                                    </span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Hidden if Resolved */}
                        {selectedConsultation.status !== 'resolved' && (
                            <div className="p-6 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendReply} className="flex gap-3 items-end bg-[#f8fafc] p-2 rounded-[1.5rem] border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                                    <textarea 
                                        value={replyText} 
                                        onChange={e=>setReplyText(e.target.value)} 
                                        className="flex-1 bg-transparent border-none outline-none text-sm p-3 text-[#0c2444] placeholder-gray-400 resize-none max-h-32 min-h-[44px]" 
                                        placeholder="اكتب ردك هنا..."
                                        rows={1}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(e); } }}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!replyText.trim()} 
                                        className="bg-[#0c2444] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#0a1f3b] disabled:opacity-50 transition-all shadow-md mb-0.5"
                                    >
                                        <Send size={18} className="rtl:rotate-180 translate-x-[-1px]"/>
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* New Consultation Modal */}
            <AnimatePresence>
                {isNewModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative">
                            <button onClick={() => setIsNewModalOpen(false)} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                            <h3 className="text-xl font-bold text-[#0c2444] mb-6">بدء استشارة جديدة</h3>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <select required value={newClient} onChange={e => setNewClient(e.target.value)} className="w-full bg-[#f8fafc] border border-gray-100 rounded-xl p-3 outline-none font-bold text-[#0c2444]">
                                    <option value="">-- اختر العميل --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                </select>
                                <input required type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full bg-[#f8fafc] border border-gray-100 rounded-xl p-3 outline-none font-bold text-[#0c2444]" placeholder="الموضوع" />
                                <textarea required rows={4} value={newMessage} onChange={e => setNewMessage(e.target.value)} className="w-full bg-[#f8fafc] border border-gray-100 rounded-xl p-3 outline-none font-bold text-[#0c2444] resize-none" placeholder="الرسالة..." />
                                <button type="submit" className="w-full bg-[#0c2444] text-white py-3 rounded-xl font-bold hover:bg-[#0a1f3b] mt-4 shadow-lg">إرسال</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConsultationsHub;
