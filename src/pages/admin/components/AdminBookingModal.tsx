
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Check, Loader2, Search, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientProfile, Booking } from '../../../core/types';
import { useBooking } from '../../../modules/bookings/context';

interface AdminBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string;
    clients: ClientProfile[];
    preselectedClientId?: string;
    allBookings: Booking[];
    blockedRecords: Booking[];
    onSuccess: (message: string) => void;
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({ isOpen, onClose, selectedDate, clients, preselectedClientId, allBookings, blockedRecords, onSuccess }) => {
    const { addBooking } = useBooking();
    const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSelectedClientId(preselectedClientId || '');
        setSelectedTime('');
        setSelectedBranchId('');
        setSearchTerm('');
    }, [isOpen, preselectedClientId]);
    
    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId);
    }, [clients, selectedClientId]);
    
    const clientBranches = useMemo(() => {
        return selectedClient?.branches || [];
    }, [selectedClient]);

    const availableClients = useMemo(() => {
        if (!selectedDate) return clients;

        const blockedClientIds = new Set(
            blockedRecords
                .filter(b => b.date === selectedDate && b.clientId !== null)
                .map(b => b.clientId)
        );
        
        let filtered = clients.filter(c => !blockedClientIds.has(c.id));

        if (searchTerm) {
            filtered = filtered.filter(c => c.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        return filtered;
    }, [selectedDate, clients, blockedRecords, searchTerm]);

    const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"];

    const isTimeTaken = (time: string) => {
        return allBookings.some(b => b.date === selectedDate && b.time === time && b.status !== 'cancelled');
    };

    const handleClientSelect = (clientId: string) => {
        setSelectedClientId(clientId);
        setSelectedBranchId('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !selectedTime) {
            alert('يرجى اختيار عميل ووقت للحجز.');
            return;
        }
        setIsProcessing(true);
        const client = clients.find(c => c.id === selectedClientId);
        if (!client) {
            alert('لم يتم العثور على العميل.');
            setIsProcessing(false);
            return;
        }
        
        const selectedBranch = clientBranches.find(b => b.id === selectedBranchId);

        const success = await addBooking({
            clientId: client.id,
            clientName: client.companyName,
            date: selectedDate,
            time: selectedTime,
            type: 'on-site',
            status: 'confirmed',
            branchId: selectedBranch ? selectedBranch.id : undefined,
            branchName: selectedBranch ? selectedBranch.name : undefined
        });

        if (success) {
            onSuccess(`تم تأكيد حجز للعميل ${client.companyName} بتاريخ ${selectedDate}`);
            onClose();

            // WHATSAPP LOGIC - ASK FIRST
            if (client.phone) {
                if (window.confirm("هل ترغب بإرسال إشعار واتساب للعميل بخصوص الحجز؟")) {
                    const message = `السلام عليكم،
تم تثبيت موعد الصيانة القادم لحضرتكم بتاريخ (${selectedDate} الساعة ${selectedTime})
في حال وجود أي ملاحظات أو رغبة بتعديل الموعد، يسعدنا تواصلكم معنا في أي وقت عبر نظام Ctrl Z
نحن دائمًا في خدمتكم،
تحيات فريق Ctrl Z 🛠️`;
                    const whatsappUrl = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }
            }
        } else {
            alert('فشل إنشاء الحجز. قد يكون الوقت محجوزاً.');
        }
        setIsProcessing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-600"/></button>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center">
                        <Calendar size={20}/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#0c2444]">حجز خدمة تقنية</h3>
                        <p className="text-sm text-gray-500 font-bold">{selectedDate}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Client Selection */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2 mb-3"><User size={16}/> اختر العميل</label>
                        {!preselectedClientId && (
                            <div className="relative mb-3">
                                <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                <input 
                                    type="text"
                                    placeholder="ابحث عن عميل..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-100 border-transparent p-2.5 pr-10 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                                />
                            </div>
                        )}
                        <div className="flex-grow bg-slate-50 rounded-xl p-2 space-y-1 overflow-y-auto max-h-[200px]">
                            {availableClients.length === 0 ? (
                                <div className="text-center p-6 text-sm text-gray-400">لا يوجد عملاء متاحين.</div>
                            ) : availableClients.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleClientSelect(c.id)}
                                    disabled={!!preselectedClientId && preselectedClientId !== c.id}
                                    className={`w-full text-right flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-bold ${selectedClientId === c.id ? 'bg-brand-dark text-white shadow-md' : 'hover:bg-white/60'} disabled:opacity-50 disabled:hover:bg-transparent`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                        {c.logo ? <img src={c.logo} className="w-full h-full object-contain p-0.5" /> : <span className="text-xs">{c.companyName.substring(0,2)}</span>}
                                    </div>
                                    <span className="truncate">{c.companyName}</span>
                                    {selectedClientId === c.id && <Check size={16} className="mr-auto text-white"/>}
                                </button>
                            ))}
                        </div>
                        <AnimatePresence>
                            {clientBranches.length > 0 && (
                                <motion.div 
                                    className="mt-4"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <label className="text-sm font-bold text-gray-500 flex items-center gap-2 mb-2"><MapPin size={16}/> اختر الفرع</label>
                                    <select
                                        value={selectedBranchId}
                                        onChange={(e) => setSelectedBranchId(e.target.value)}
                                        className="w-full bg-slate-100 border-transparent p-3 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-bold"
                                    >
                                        <option value="">الفرع الرئيسي / غير محدد</option>
                                        {clientBranches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Time Selection */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2 mb-3"><Clock size={16}/> اختر الوقت</label>
                        <div className="grid grid-cols-2 gap-3">
                            {timeSlots.map(time => {
                                const taken = isTimeTaken(time);
                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        disabled={taken}
                                        onClick={() => setSelectedTime(time)}
                                        className={`relative p-4 rounded-xl text-md font-bold border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                                            taken ? 'bg-slate-100 text-gray-400 cursor-not-allowed border-transparent line-through'
                                            : selectedTime === time ? 'bg-brand-dark text-white border-brand-dark shadow-lg'
                                            : 'bg-white border-slate-200 hover:border-slate-400'
                                        }`}
                                    >
                                        {selectedTime === time && <Check size={16}/>}
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                         <button type="submit" disabled={!selectedClientId || !selectedTime || isProcessing} className="w-full bg-brand-blue text-white py-4 mt-auto rounded-xl font-bold disabled:opacity-50 hover:bg-brand-blue/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">
                            {isProcessing ? <Loader2 className="animate-spin"/> : <Check size={18} />}
                            {isProcessing ? 'جاري الحجز...' : 'تأكيد الحجز'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminBookingModal;
