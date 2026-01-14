
import React, { useState } from 'react';
import { X, Send, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Ticket as TicketType } from '../../../core/types';
import { useTicket } from '../../../modules/tickets/context';

interface TicketDetailModalProps {
    selectedTicket: TicketType;
    setSelectedTicket: (ticket: TicketType | null) => void;
    replyText: string;
    setReplyText: (text: string) => void;
    handleSendReply: (e: React.FormEvent) => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ selectedTicket, setSelectedTicket, replyText, setReplyText, handleSendReply }) => {
    const { deleteTicket } = useTicket();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        const ticketId = selectedTicket.id;
        console.log(`[UI] Delete Ticket button clicked. Attempting to delete ticket ID: ${ticketId}`);
        console.log('[UI] Bypassing confirmation dialog.');
        setIsDeleting(true);
        try {
            console.log(`[UI] Calling deleteTicket from context with ID: ${ticketId}`);
            const success = await deleteTicket(ticketId);
            if (success) {
                console.log('[UI] Context reported successful ticket deletion.');
                setSelectedTicket(null); // Close modal only on success
            } else {
                console.warn('[UI] Context reported failed ticket deletion.');
            }
        } finally {
            console.log('[UI] Resetting isDeleting state.');
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div className="bg-white rounded-[2rem] w-full max-w-3xl h-[80vh] flex flex-col relative overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <div><h3 className="text-xl font-bold">{selectedTicket.subject}</h3></div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDelete} disabled={isDeleting} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50" title="حذف التذكرة">
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
                        </button>
                        <button onClick={() => setSelectedTicket(null)} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors z-[100] cursor-pointer active:scale-95"><X size={20}/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-[#f5f5f7] space-y-4"><div className="bg-white p-4 rounded-xl shadow-sm"><p className="text-gray-600">{selectedTicket.description}</p></div>{selectedTicket.messages?.map(m=>(<div key={m.id} className={`flex ${m.sender==='admin'?'justify-end':'justify-start'}`}><div className={`p-4 rounded-2xl max-w-[80%] ${m.sender==='admin'?'bg-[#0c2444] text-white':'bg-white'}`}><p>{m.text}</p></div></div>))}</div>
                <div className="p-4 bg-white border-t"><form onSubmit={handleSendReply} className="flex gap-2"><input type="text" value={replyText} onChange={e=>setReplyText(e.target.value)} className="flex-1 bg-[#f5f5f7] rounded-xl px-4" placeholder="الرد..."/><button className="bg-[#0c2444] text-white p-3 rounded-xl"><Send size={20}/></button></form></div>
            </motion.div>
        </div>
    );
};
export default TicketDetailModal;
