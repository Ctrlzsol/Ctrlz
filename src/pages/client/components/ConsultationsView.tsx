
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ClientProfile, Consultation } from '../../../core/types';
import { MessageSquare, Send, Bot, Shield, Plus, Search, CheckCircle, Clock, ArrowLeft, Lock, Star } from 'lucide-react';
import { useTicket } from '../../../modules/tickets/context';
import { motion, AnimatePresence } from 'framer-motion';

interface ConsultationsViewProps {
    client: ClientProfile;
    tickets: any[]; 
    addTicket: any; 
    addReply: any; 
}

const ConsultationsView: React.FC<ConsultationsViewProps> = ({ client }) => {
    const { consultations, createConsultation, addConsultationReply } = useTicket();
    
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [newConsultationMessage, setNewConsultationMessage] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const clientConsultations = useMemo(() => {
        return consultations
            .filter(c => c.clientId === client.id && c.subject.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a,b) => new Date(b.lastUpdated || b.createdAt).getTime() - new Date(a.lastUpdated || a.createdAt).getTime());
    }, [consultations, client.id, searchTerm]);

    useEffect(() => {
        if (selectedConsultation) {
            const updated = consultations.find(c => c.id === selectedConsultation.id);
            if (updated) {
                if (updated.status !== selectedConsultation.status || updated.messages.length !== selectedConsultation.messages.length) {
                    setSelectedConsultation(updated);
                }
            }
        }
    }, [consultations, selectedConsultation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConsultation?.messages]);

    const handleStartConsultation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConsultationMessage.trim()) return;
        setIsStarting(true);
        
        const generatedSubject = newConsultationMessage.length > 40 
            ? newConsultationMessage.substring(0, 40) + '...' 
            : newConsultationMessage;

        await createConsultation({
            client_id: client.id,
            client_name: client.companyName,
            subject: `استشارة: ${generatedSubject}`,
            messages: [{ id: `m-${Date.now()}`, sender: 'client', senderName: client.companyName, text: newConsultationMessage, timestamp: new Date().toISOString() }]
        });
        
        // Removed WhatsApp trigger here as requested

        setNewConsultationMessage('');
        setIsStarting(false);
    };
    
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedConsultation || !replyText.trim()) return;
        
        await addConsultationReply(selectedConsultation.id, { id: `m-${Date.now()}`, sender: 'client', senderName: client.companyName, text: replyText, timestamp: new Date().toISOString() }, selectedConsultation.messages);
        setReplyText('');
    };

    const startNewFromClosed = () => {
        setSelectedConsultation(null);
    };

    return (
        <div className="h-[750px] bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row relative">
            
            {/* SIDEBAR LIST */}
            <div className={`w-full md:w-80 lg:w-96 border-l border-gray-100 bg-gray-50/50 flex flex-col ${selectedConsultation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-gray-100 bg-white">
                    <h3 className="font-bold text-[#0c2444] text-xl mb-4 flex items-center gap-2">
                        <MessageSquare size={22} className="text-[#0071e3]"/> استشاراتي
                    </h3>
                    <button onClick={() => setSelectedConsultation(null)} className="w-full bg-[#0c2444] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#0a1f3b] transition-all flex items-center justify-center gap-2 mb-4">
                        <Plus size={18}/> محادثة جديدة
                    </button>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-xl py-2.5 pr-9 pl-4 text-xs font-bold text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100 transition-all"/>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {clientConsultations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
                            <Bot size={24} className="mb-2 opacity-50"/>
                            <p className="text-xs">ابدأ محادثة جديدة مع فريق الدعم</p>
                        </div>
                    ) : (
                        clientConsultations.map(c => {
                            const lastMsg = c.messages[c.messages.length - 1];
                            const isSelected = selectedConsultation?.id === c.id;
                            const hasUnread = lastMsg?.sender === 'admin' && !isSelected;

                            return (
                                <button key={c.id} onClick={() => setSelectedConsultation(c)} className={`w-full text-right p-4 rounded-2xl transition-all border group relative ${isSelected ? 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50' : 'bg-transparent border-transparent hover:bg-white hover:shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-[#0071e3]' : 'text-[#0c2444]'}`}>
                                            {c.subject.replace('استشارة:', '').replace('استشارة تقنية:', '')}
                                        </h4>
                                        <div className="flex items-center gap-1">
                                            {c.status === 'resolved' && <Lock size={12} className="text-gray-400"/>}
                                            {hasUnread && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] text-gray-400 line-clamp-1 flex-1 ml-2">
                                            {lastMsg?.sender === 'admin' ? 'الدعم: ' : 'أنت: '}
                                            {lastMsg?.text}
                                        </p>
                                        <span className="text-[9px] text-gray-300 font-mono whitespace-nowrap">
                                            {new Date(c.createdAt).toLocaleDateString('ar-EG', {month:'short', day:'numeric'})}
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* CHAT AREA */}
            <div className={`flex-1 flex flex-col bg-[#f0f4f9] relative ${!selectedConsultation ? 'hidden md:flex' : 'flex'}`}>
                {!selectedConsultation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100"><Bot size={32} className="text-[#0071e3]" /></div>
                        <h3 className="text-2xl font-bold text-[#0c2444] mb-2">كيف يمكننا مساعدتك؟</h3>
                        <p className="text-gray-500 mb-8 max-w-sm text-sm">فريقنا التقني جاهز للإجابة على استفساراتك. ابدأ محادثة جديدة وسيتم الرد عليك في أقرب وقت.</p>
                        <form onSubmit={handleStartConsultation} className="w-full max-w-lg relative">
                            <textarea value={newConsultationMessage} onChange={e => setNewConsultationMessage(e.target.value)} className="w-full bg-white p-5 rounded-[2rem] shadow-xl shadow-blue-900/5 border-none outline-none resize-none text-[#0c2444] placeholder-gray-400 min-h-[120px] text-sm font-medium focus:ring-4 focus:ring-blue-50 transition-all pb-16" placeholder="اكتب استفسارك هنا..."></textarea>
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 font-bold px-3">استشارة جديدة</span>
                                <button type="submit" disabled={isStarting || !newConsultationMessage.trim()} className="bg-[#0c2444] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#0a1f3b] disabled:opacity-50 transition-all shadow-md">{isStarting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Send size={18} className="rtl:rotate-180 translate-x-[-1px]"/>}</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 flex justify-between items-center px-4 md:px-6 sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedConsultation(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="rotate-180 text-gray-500"/></button>
                                <div className="w-10 h-10 bg-[#0c2444] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm border-2 border-white"><Shield size={18}/></div>
                                <div>
                                    <h4 className="font-bold text-[#0c2444] text-sm line-clamp-1">الدعم الفني Ctrl z</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        {selectedConsultation.status === 'resolved' ? (
                                            <span className="text-gray-400 flex items-center gap-1"><Lock size={10}/> مغلقة</span>
                                        ) : (
                                            <span className="text-green-600 flex items-center gap-1"><Clock size={10}/> نشط الآن</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50">
                            {selectedConsultation.messages.map((msg, idx) => {
                                const isMe = msg.sender === 'client';
                                return (
                                    <div key={idx} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 border-white shadow-sm ${isMe ? 'bg-gray-200 text-gray-600' : 'bg-[#0c2444] text-white'}`}>{isMe ? 'أنت' : 'Z'}</div>
                                        <div className={`py-3 px-4 rounded-2xl max-w-[85%] md:max-w-[70%] text-sm leading-relaxed shadow-sm ${isMe ? 'bg-white text-[#0c2444] rounded-br-none border border-gray-100' : 'bg-[#0c2444] text-white rounded-bl-none'}`}>
                                            <p className="text-[10px] font-bold mb-1 opacity-80">{isMe ? client.companyName : 'الدعم الفني Ctrl z'}</p>
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                            <p className={`text-[9px] mt-1.5 text-left opacity-60 font-mono`}>{new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer: Input OR Closed Message */}
                        {selectedConsultation.status === 'resolved' ? (
                            <div className="p-6 bg-white border-t border-gray-200">
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center"
                                >
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Star size={24} className="fill-green-600"/>
                                    </div>
                                    <h4 className="text-[#0c2444] font-bold mb-1">تم إغلاق الاستشارة</h4>
                                    <p className="text-xs text-gray-500 mb-4">شكراً لتواصلك معنا. نأمل أن نكون قد قدمنا المساعدة المطلوبة.</p>
                                    <button 
                                        onClick={startNewFromClosed} 
                                        className="bg-[#0c2444] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0a1f3b] transition-all shadow-lg flex items-center gap-2 mx-auto"
                                    >
                                        <Plus size={16}/> بدء استشارة جديدة
                                    </button>
                                </motion.div>
                            </div>
                        ) : (
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendReply} className="flex gap-2 items-end bg-[#f8fafc] p-2 rounded-[1.5rem] border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                                    <div className="flex-1">
                                        <textarea 
                                            value={replyText} 
                                            onChange={e=>setReplyText(e.target.value)} 
                                            className="w-full bg-transparent border-none outline-none text-sm p-2 text-[#0c2444] placeholder-gray-400 resize-none max-h-32 min-h-[44px]" 
                                            rows={1} 
                                            placeholder="اكتب رسالتك..." 
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(e); } }}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={!replyText.trim()} 
                                        className="bg-[#0c2444] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#0a1f3b] disabled:opacity-50 transition-all shadow-md mb-0.5"
                                    >
                                        <Send size={18} className="rtl:rotate-180 translate-x-[-1px]" />
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConsultationsView;
