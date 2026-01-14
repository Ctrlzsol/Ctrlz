
import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertTriangle, Edit3, Trash2, Save, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from '../../../core/types';
import { useBooking } from '../../../modules/bookings/context';
import { useClientData } from '../../../modules/clients/context';
import { useTicket } from '../../../modules/tickets/context';
import { supabase } from '../../../lib/supabase'; // Imported Supabase

interface BookingActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    onSuccess: (message: string) => void;
}

const BookingActionModal: React.FC<BookingActionModalProps> = ({ isOpen, onClose, booking, onSuccess }) => {
    const { updateBookingStatus, rescheduleBooking } = useBooking();
    const { clients } = useClientData();
    const { addTicket } = useTicket();

    const [isProcessing, setIsProcessing] = useState(false);
    const [view, setView] = useState<'main' | 'cancel'>('main');
    const [cancelReason, setCancelReason] = useState('');
    
    // Reschedule State
    const [formData, setFormData] = useState({
        date: '',
        time: ''
    });

    const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"];

    useEffect(() => {
        if (booking) {
            setFormData({
                date: booking.date,
                time: booking.time || '09:00 AM'
            });
            setView('main');
            setCancelReason('');
        }
    }, [booking, isOpen]);

    if (!isOpen || !booking) return null;

    const client = clients.find(c => c.id === booking.clientId);

    const handleConfirmBooking = async () => {
        setIsProcessing(true);
        try {
            await updateBookingStatus(booking.id, 'confirmed');
            
            // 1. INSERT REAL-TIME NOTIFICATION (Fixes the timestamp issue)
            if (client) {
                await supabase.from('notifications').insert([{
                    client_id: client.id,
                    client_name: client.companyName,
                    title: 'تم تأكيد موعدك ✅',
                    description: `تم تثبيت موعد الزيارة بتاريخ ${booking.date} الساعة ${booking.time}.`,
                    is_read: false,
                    is_deleted: false,
                    created_at: new Date().toISOString() // Ensures exact "Now" time
                }]);
            }

            // 2. WhatsApp Notification Logic
            if (client && client.phone) {
                if (window.confirm("هل ترغب بإرسال إشعار واتساب للعميل بخصوص تأكيد الحجز؟")) {
                    const message = `السلام عليكم،
تم تثبيت موعد الصيانة القادم لحضرتكم بتاريخ (${booking.date} الساعة ${booking.time})
في حال وجود أي ملاحظات أو رغبة بتعديل الموعد، يسعدنا تواصلكم معنا في أي وقت عبر نظام Ctrl Z
نحن دائمًا في خدمتكم،
تحيات فريق Ctrl Z 🛠️`;
                    
                    const whatsappUrl = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }
            }

            onSuccess('تم تأكيد الحجز بنجاح');
            onClose();
        } catch (error) {
            alert('فشل تأكيد الحجز');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRescheduleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        const { date: newDate, time: newTime } = formData;
        
        if (booking.date === newDate && booking.time === newTime) {
            alert("لم يتم تغيير الموعد.");
            return;
        }

        setIsProcessing(true);
        try {
            await rescheduleBooking(booking.id, newDate, newTime);
            
            // Notify Client via Ticket/Notification System
            if (client) { 
                await addTicket({ 
                    clientId: client.id, 
                    clientName: client.companyName, 
                    subject: `إشعار: تم تعديل موعدكم`, 
                    description: `تم تعديل موعدكم من تاريخ ${booking.date} الساعة ${booking.time} إلى الموعد الجديد بتاريخ ${newDate} الساعة ${newTime}.`, 
                    status: 'resolved', 
                    priority: 'medium', 
                    date: new Date().toISOString().split('T')[0], 
                    messages: [{ id: `sys-${Date.now()}`, sender: 'admin', senderName: 'النظام', text: `تم تعديل موعدكم من تاريخ ${booking.date} الساعة ${booking.time} إلى الموعد الجديد بتاريخ ${newDate} الساعة ${newTime}.`, timestamp: new Date().toISOString() }] 
                }); 
            }

            onSuccess('تم تعديل الموعد بنجاح');
            onClose();
        } catch (error) {
            alert('فشل تعديل الحجز');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmCancellation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelReason) {
            alert('يرجى كتابة سبب الإلغاء');
            return;
        }

        setIsProcessing(true);
        try {
            await updateBookingStatus(booking.id, 'cancelled');
            
            if (client) { 
                await addTicket({ 
                    clientId: client.id, 
                    clientName: client.companyName, 
                    subject: `إشعار بخصوص موعد ${booking.date}`, 
                    description: `نأسف لإبلاغكم بإلغاء موعدكم المقرر بتاريخ ${booking.date}.\n\nالسبب: ${cancelReason}`, 
                    status: 'resolved', 
                    priority: 'medium', 
                    date: new Date().toISOString().split('T')[0], 
                    messages: [{ id: `sys-${Date.now()}`, sender: 'admin', senderName: 'النظام', text: `تم إلغاء الموعد للسبب التالي: ${cancelReason}`, timestamp: new Date().toISOString() }] 
                }); 
            }

            onSuccess('تم إلغاء الحجز وإشعار العميل');
            onClose();
        } catch (error) {
            alert('فشل إلغاء الحجز');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X size={20} className="text-gray-600"/>
                </button>

                {view === 'main' ? (
                    <>
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${booking.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                {booking.status === 'pending' ? <AlertTriangle size={24}/> : <Edit3 size={24}/>}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0c2444]">
                                    {booking.status === 'pending' ? 'إجراء بخصوص الحجز' : 'تعديل الحجز'}
                                </h3>
                                <p className="text-sm text-gray-500 font-bold">
                                    {client?.companyName} - {booking.date}
                                </p>
                            </div>
                        </div>

                        {booking.status === 'pending' ? (
                            <div className="space-y-4">
                                <p className="text-center text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    هذا الحجز بانتظار التأكيد من طرفكم. الرجاء اختيار الإجراء المناسب.
                                </p>
                                <div className="flex gap-4 pt-4 border-t border-gray-100">
                                    <button 
                                        type="button" 
                                        onClick={() => setView('cancel')} 
                                        disabled={isProcessing} 
                                        className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 border border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        <X size={18}/> إلغاء الحجز
                                    </button>
                                    <button 
                                        onClick={handleConfirmBooking} 
                                        disabled={isProcessing} 
                                        className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>} تأكيد الحجز
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleRescheduleBooking} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">تعديل التاريخ</label>
                                    <input 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))} 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-[#0c2444] font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">تعديل الوقت</label>
                                    <select 
                                        value={formData.time} 
                                        onChange={(e) => setFormData(f => ({ ...f, time: e.target.value }))} 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-[#0c2444] font-bold"
                                    >
                                        {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-gray-100">
                                    <button 
                                        type="button" 
                                        onClick={() => setView('cancel')} 
                                        disabled={isProcessing} 
                                        className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 border border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        <X size={18}/> إلغاء الحجز
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isProcessing} 
                                        className="flex-1 bg-[#0c2444] text-white py-3 rounded-xl font-bold hover:bg-[#0a1f3b] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} حفظ التعديلات
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                ) : (
                    <form onSubmit={handleConfirmCancellation}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                                <MessageSquare size={20}/>
                            </div>
                            <h3 className="text-xl font-bold text-[#0c2444]">سبب إلغاء الموعد</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">سيتم إرسال السبب للعميل كإشعار. الرجاء توضيح السبب بشكل احترافي.</p>
                        <textarea 
                            value={cancelReason} 
                            onChange={e => setCancelReason(e.target.value)} 
                            required 
                            rows={4} 
                            className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 resize-none text-[#0c2444] font-medium" 
                            placeholder="مثال: اليوم المحدد مغلق للصيانة الطارئة..."
                        ></textarea>
                        <div className="flex gap-3 mt-6">
                            <button 
                                type="button" 
                                onClick={() => setView('main')} 
                                disabled={isProcessing} 
                                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                تراجع
                            </button>
                            <button 
                                type="submit" 
                                disabled={isProcessing} 
                                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={16}/>} تأكيد الإلغاء
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default BookingActionModal;
