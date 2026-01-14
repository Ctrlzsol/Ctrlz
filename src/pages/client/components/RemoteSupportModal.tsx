
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Headphones, Monitor, User, Send, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useClientData } from '../../../modules/clients/context';
import { useTicket } from '../../../modules/tickets/context';
import { ClientProfile } from '../../../core/types';
import { useNavigate } from 'react-router-dom';

interface RemoteSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: ClientProfile;
}

const RemoteSupportModal: React.FC<RemoteSupportModalProps> = ({ isOpen, onClose, client }) => {
    const { createRemoteSupport, refreshClients } = useTicket();
    const { refreshClients: refreshClientData } = useClientData();
    const navigate = useNavigate();

    const [selectedUserId, setSelectedUserId] = useState('');
    const [anyDeskId, setAnyDeskId] = useState('');
    // Removed IP State
    const [issueDetails, setIssueDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-fill AnyDesk when user is selected
    useEffect(() => {
        if (selectedUserId && client.usersList) {
            const user = client.usersList.find(u => u.id === selectedUserId);
            if (user?.anyDeskId) {
                setAnyDeskId(user.anyDeskId);
            } else {
                setAnyDeskId('');
            }
        }
    }, [selectedUserId, client.usersList]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issueDetails.trim() || !selectedUserId || !anyDeskId) {
            alert("يرجى تعبئة جميع الحقول المطلوبة");
            return;
        }

        setIsSubmitting(true);
        const selectedUser = client.usersList?.find(u => u.id === selectedUserId);

        const result = await createRemoteSupport({
            client_id: client.id,
            client_name: client.companyName,
            user_id: selectedUserId,
            user_name: selectedUser?.name || 'Unknown',
            issue_details: issueDetails,
            anydesk_id: anyDeskId,
            ip_address: '', // Removed IP Requirement
        });

        if (result.success) {
            // Force refresh client data to update balance in UI
            await refreshClientData();
            alert("تم إرسال طلب الدعم بنجاح! تم خصم تذكرة واحدة من رصيدك.");
            onClose();
            setIssueDetails('');
            setSelectedUserId('');
            setAnyDeskId('');
        } else {
            alert(result.error === 'INSUFFICIENT_BALANCE' ? "عذراً، رصيدك غير كافي." : "فشل إرسال الطلب.");
        }
        setIsSubmitting(false);
    };

    const handleBuyTickets = () => {
        onClose();
        // Pass specific request ID to auto-open the order form
        navigate('/client', { state: { tab: 'requests', preSelectedRequest: 'ticket' } });
    };

    if (!isOpen) return null;

    // --- ZERO BALANCE VIEW ---
    if (client.remainingTickets <= 0) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden text-center p-8"
                >
                    <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20}/>
                    </button>
                    
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-[#0c2444] mb-2">عذراً، رصيدك الحالي انتهى</h3>
                    <p className="text-gray-500 mb-8 font-medium">
                        لقد استهلكت جميع تذاكر الدعم عن بعد المتاحة في باقتك. يرجى شراء حزمة تذاكر جديدة للمتابعة.
                    </p>
                    
                    <button 
                        onClick={handleBuyTickets}
                        className="w-full bg-[#0c2444] text-white py-4 rounded-xl font-bold hover:bg-[#0a1f3b] transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <ShoppingCart size={20} /> طلب تذاكر إضافية
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
                {/* Header */}
                <div className="bg-[#0c2444] p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Headphones size={20} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">فتح تذكرة دعم عن بعد</h3>
                            <p className="text-xs text-blue-200 opacity-80">سيتم خصم 1 تذكرة من رصيدك (المتبقي: {client.remainingTickets})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={18}/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* User Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                            <User size={14}/> المستخدم المتضرر
                        </label>
                        <select 
                            required
                            value={selectedUserId} 
                            onChange={e => setSelectedUserId(e.target.value)} 
                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">-- اختر من القائمة --</option>
                            {client.usersList?.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* AnyDesk Row - Full Width since IP is gone */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                            <Monitor size={14}/> رقم AnyDesk
                        </label>
                        <input 
                            required
                            type="text" 
                            value={anyDeskId} 
                            onChange={e => setAnyDeskId(e.target.value)} 
                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl p-3 text-sm font-mono font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-100"
                            placeholder="000 000 000"
                        />
                    </div>

                    {/* Issue Details */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">تفاصيل المشكلة</label>
                        <textarea 
                            required
                            rows={4} 
                            value={issueDetails} 
                            onChange={e => setIssueDetails(e.target.value)} 
                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl p-4 text-sm font-medium text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                            placeholder="اشرح المشكلة التي تواجهها بالتفصيل..."
                        ></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-[#0c2444] text-white py-4 rounded-xl font-bold hover:bg-[#0a1f3b] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} className="rtl:rotate-180"/>}
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال وخصم تذكرة'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default RemoteSupportModal;
