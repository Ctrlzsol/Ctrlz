import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Clock, Calendar, Info, X, MapPin } from 'lucide-react';
import { Booking, Branch } from '../../../core/types';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps { 
    onSelect: (d: string, t: string, branchId?: string) => void;
    blockedDates: string[];
    bookings: Booking[]; // All bookings to check for taken slots
    clientBookings: Booking[]; // Specific client's bookings to highlight their days
    branches?: Branch[];
}

const DatePicker: React.FC<DatePickerProps> = ({ onSelect, blockedDates, bookings, clientBookings, branches }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"];
    
    const isInvalidDate = (day: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return checkDate < today;
    };

    const isDayFullyBooked = (day: number): boolean => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const bookingsForDay = bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
        return bookingsForDay.length >= timeSlots.length;
    };

    const isTimeTaken = (time: string) => {
        if (!selectedDate) return false;
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`; 
        return bookings.some(b => b.date === dateStr && b.time === time && b.status !== 'cancelled');
    };
    
    const handleConfirm = () => { if (selectedDate && selectedTime) { onSelect(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`, selectedTime, selectedBranchId); } };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
            {/* Calendar View */}
            <div className="md:col-span-1 space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                    <h4 className="text-lg font-bold text-[#0c2444] px-4">{currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</h4>
                    <div className="flex gap-1"><button onClick={prevMonth} className="p-2 hover:bg-white rounded-full text-gray-500"><ChevronLeft size={20}/></button><button onClick={nextMonth} className="p-2 hover:bg-white rounded-full text-gray-500"><ChevronRight size={20}/></button></div>
                </div>
                <div className="grid grid-cols-7 text-center">{['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => <span key={d} className="text-xs font-bold text-gray-400 p-2">{d}</span>)}</div>
                <div className="grid grid-cols-7 gap-1">{Array.from({ length: firstDay }).map((_, i) => <div key={`b-${i}`} />)}{Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => { 
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; 
                    const isBlockedByAdmin = blockedDates.includes(dateStr);
                    const isBookedByClient = clientBookings.some(b => b.date === dateStr && b.status !== 'cancelled');
                    const isFullyBooked = isDayFullyBooked(day);
                    const isInvalid = isInvalidDate(day);
                    const disabled = isBlockedByAdmin || isInvalid || isFullyBooked;
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    
                    let dayClass = 'text-gray-700 bg-white border-gray-200 hover:border-gray-400';
                    if (disabled) dayClass = 'bg-gray-100 text-gray-300 border-transparent line-through cursor-not-allowed';
                    else if (selectedDate === day) dayClass = 'bg-[#0c2444] text-white border-[#0c2444] shadow-lg';
                    else if (isBookedByClient) dayClass = 'bg-blue-50 text-[#0c2444] border-blue-200 font-bold';
                    else if(isToday) dayClass = 'border-[#0071e3] text-[#0c2444]';

                    return (<button key={day} disabled={disabled} onClick={() => { setSelectedDate(day); setSelectedTime(null); }} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 ${dayClass}`}>{day}</button>); 
                })}</div>
            </div>

            {/* Time Slots and Summary */}
            <div className="md:col-span-1 bg-gray-50 rounded-2xl p-6 flex flex-col">
                <h3 className="text-lg font-bold text-[#0c2444] mb-1">اختر اليوم والوقت</h3>
                <p className="text-sm text-gray-500 mb-6">حدد الموعد المناسب لزيارتنا لك.</p>
                
                 <AnimatePresence mode="wait">
                {selectedDate ? (
                    <motion.div 
                        key="time-picker"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="flex-1 flex flex-col"
                    >
                         <div className="bg-white p-4 rounded-xl mb-6 border border-gray-200">
                            <div className="flex items-center gap-2 text-sm font-bold text-[#0c2444]"><Calendar size={16} className="text-[#0071e3]"/><span>التاريخ المحدد</span></div>
                            <p className="text-center text-2xl font-black text-[#0c2444] py-2">{`${currentDate.getFullYear()}/${currentDate.getMonth()+1}/${selectedDate}`}</p>
                        </div>

                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">الأوقات المتاحة</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {timeSlots.map(time => { 
                                const taken = isTimeTaken(time); 
                                return (
                                    <button key={time} disabled={taken} onClick={() => setSelectedTime(time)} className={`relative py-3 px-1 rounded-xl text-sm font-bold border-2 transition-all ${taken ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' : selectedTime === time ? 'bg-[#0c2444] text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-400'}`}>
                                        {time}
                                        {taken && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">محجوز</span>}
                                    </button>
                                ); 
                            })}
                        </div>
                        
                        {branches && branches.length > 0 && (
                            <div className="mt-6">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><MapPin size={14}/> الفرع</p>
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    className="w-full bg-white border-gray-200 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">الفرع الرئيسي / غير محدد</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </motion.div>
                 ) : (
                     <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="flex-1 flex flex-col items-center justify-center bg-white/50 border border-dashed rounded-2xl text-gray-400 text-center p-4"
                     >
                        <Calendar size={32} className="mb-2"/>
                        <p className="font-bold">اختر يوماً من التقويم</p>
                        <p className="text-xs">لعرض الأوقات المتاحة للحجز</p>
                     </motion.div>
                 )}
                </AnimatePresence>
                
                <button onClick={handleConfirm} disabled={!selectedDate || !selectedTime} className="w-full mt-4 bg-[#0071e3] text-white py-4 rounded-xl font-bold disabled:opacity-50 hover:bg-[#0062c9] transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2">
                    <Check size={18}/> تأكيد الحجز
                </button>
            </div>
        </div>
    );
};
export default DatePicker;