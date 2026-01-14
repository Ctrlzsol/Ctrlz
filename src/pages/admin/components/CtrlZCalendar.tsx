
import React, { useState, useMemo } from 'react';
import { X, Trash2, Lock, Unlock, Edit3, Save, Loader2, User, AlertTriangle, MessageSquare, Check, Sparkles, Calendar as ExportIcon, ChevronLeft, ChevronRight, Wrench, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ClientProfile, Ticket } from '../../../core/types';
import { useBooking } from '../../../modules/bookings/context';
import AdminBookingModal from './AdminBookingModal';

const stringToHslColor = (str: string, s: number, l: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
};

interface CtrlZCalendarProps {
    bookings: Booking[];
    clients: ClientProfile[];
    dir: 'rtl' | 'ltr';
    refresh?: () => void;
    addTicket: (ticket: Omit<Ticket, 'id'>) => Promise<void>;
    showNotification: (message: string) => void;
    onOpenBookingAction: (booking: Booking) => void; // New Prop
}

const CtrlZCalendar = ({ bookings, clients, dir, refresh, addTicket, showNotification, onOpenBookingAction }: CtrlZCalendarProps) => {
    const { 
        toggleBlockedDate,
        blockedRecords,
        unblockAllDates,
    } = useBooking();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isUnblocking, setIsUnblocking] = useState(false);
    const [togglingDay, setTogglingDay] = useState<number | null>(null);
    
    // Only kept for Adding New Booking
    const [bookingModalState, setBookingModalState] = useState<{ isOpen: boolean, date: string | null }>({ isOpen: false, date: null });

    const clientColors = useMemo(() => {
        const colors: { [key: string]: string } = {};
        clients.forEach(client => {
            colors[client.id] = stringToHslColor(client.id, 60, 70);
        });
        return colors;
    }, [clients]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); 

    const goToToday = () => setCurrentDate(new Date());

    const formatDateStr = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const isPastDate = (day: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return checkDate < today;
    };

    const getBookingsForDay = (day: number) => {
        const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
        let dayBookings = bookings.filter(b => b.date === dateStr && !b.is_blocked && b.status !== 'cancelled'); 
        if (selectedClientId) dayBookings = dayBookings.filter(b => b.clientId === selectedClientId);
        return dayBookings.sort((a,b) => (a.time || "00").localeCompare(b.time || "00"));
    };

    const getClientBlocksForDay = (day: number) => {
        const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
        return blockedRecords.filter(b => b.date === dateStr && b.clientId !== null);
    };

    const isDayEffectivelyBlocked = (day: number) => {
        const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
        const isGloballyBlocked = blockedRecords.some(b => b.date === dateStr && b.clientId === null);
        if (isGloballyBlocked) return true;
        if (selectedClientId) {
            return blockedRecords.some(b => b.date === dateStr && b.clientId === selectedClientId);
        }
        return false;
    };

    const openBookingAction = (e: React.MouseEvent, booking: Booking) => {
        e.stopPropagation();
        onOpenBookingAction(booking); // Trigger parent modal
    };

    const handleDayClick = (day: number) => {
        const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
        const isPast = isPastDate(day);
        const effectivelyBlocked = isDayEffectivelyBlocked(day);
        if (isPast || effectivelyBlocked) return;
        setBookingModalState({ isOpen: true, date: dateStr });
    };
    
    const handleBlockToggle = async (e: React.MouseEvent, day: number) => {
        e.stopPropagation();
        setTogglingDay(day);
        try {
            const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
            await toggleBlockedDate(dateStr, selectedClientId || null);
        } catch (error: any) {
            console.error("Failed to toggle block for day:", day, error.message, error);
        } finally {
            setTogglingDay(null);
        }
    };

    const handleOpenAllDays = async () => {
        setIsUnblocking(true);
        try {
            await unblockAllDates();
            if (refresh) {
                await refresh();
            }
            showNotification('تم فتح جميع الأيام بنجاح.');
        } catch (error: any) {
            alert('خطأ: ' + error.message);
        } finally {
            setIsUnblocking(false);
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-orange-400';
            case 'confirmed': return 'bg-sky-500';
            case 'completed': return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };

    const handleExportCsv = (range: 'current' | 'next') => {
        const year = range === 'current' ? currentDate.getFullYear() : (currentDate.getMonth() === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear());
        const month = range === 'current' ? currentDate.getMonth() : (currentDate.getMonth() + 1) % 12;
    
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
    
        const bookingsToExport = bookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate >= startDate && bookingDate <= endDate;
        }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        if(bookingsToExport.length === 0){
            alert('لا توجد حجوزات في النطاق المحدد.');
            return;
        }

        const headers = ["Date", "Time", "Client", "Status", "Type"];
        const csvContent = [
            headers.join(','),
            ...bookingsToExport.map(b => [b.date, b.time, `"${b.clientName.replace(/"/g, '""')}"`, b.status, b.type].join(','))
        ].join('\n');
    
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `ctrlz_calendar_export_${year}_${month + 1}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setIsExportModalOpen(false);
    };

    const generateGoogleCalendarLink = (booking: Booking) => {
        const client = clients.find(c => c.id === booking.clientId);
        const title = encodeURIComponent(`Ctrl Z Visit: ${client?.companyName || 'Maintenance'}`);
        if (!booking.time) return '';

        const [time, modifier] = booking.time.split(' ');
        let [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

        const startDateTime = new Date(booking.date);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 1);

        const toGoogleFormat = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        
        const dates = `${toGoogleFormat(startDateTime)}/${toGoogleFormat(endDateTime)}`;
        const details = encodeURIComponent(`Scheduled maintenance visit for ${client?.companyName}.`);
        
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    };
    
    return (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative min-h-[700px]">
             <div className="flex flex-col gap-6 mb-8">
                 <div className="flex justify-between items-center">
                    <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-blue pointer-events-none" size={16} />
                        <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="appearance-none bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 font-bold text-[#0c2444] text-sm outline-none cursor-pointer w-48 focus:ring-2 focus:ring-blue-100">
                            <option value="">جميع العملاء</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                        </select>
                    </div>
                     <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setIsExportModalOpen(true)} className="bg-gray-100 text-gray-500 px-3 py-3 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                           <Download size={14}/> <span>تصدير</span>
                        </button>
                        <button type="button" onClick={handleOpenAllDays} disabled={isUnblocking} className="bg-gray-100 text-gray-500 px-3 py-3 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50">
                            {isUnblocking ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} 
                            <span>فتح جميع الأيام</span>
                        </button>
                    </div>
                 </div>

                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-3 hover:bg-white rounded-lg text-gray-500 transition-colors"><ChevronLeft size={20}/></button>
                        <button onClick={goToToday} className="px-4 py-2 bg-white text-[#0c2444] text-sm font-bold hover:bg-gray-200 rounded-lg transition-all">اليوم</button>
                        <button onClick={nextMonth} className="p-3 hover:bg-white rounded-lg text-gray-500 transition-colors"><ChevronRight size={20}/></button>
                    </div>
                    <h2 className="text-lg font-bold text-brand-dark px-4">{currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</h2>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1" dir={dir}>
                {(dir === 'rtl' ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => (<div key={d} className="p-2 text-center text-xs font-bold text-gray-400 uppercase">{d}</div>))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayBookings = getBookingsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    const isPast = isPastDate(day);
                    const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
                    const isGloballyBlocked = blockedRecords.some(b => b.date === dateStr && b.clientId === null);
                    const clientSpecificBlocks = getClientBlocksForDay(day);
                    const isClientSpecificallyBlocked = selectedClientId ? blockedRecords.some(b => b.date === dateStr && b.clientId === selectedClientId) : false;
                    const effectivelyBlocked = isDayEffectivelyBlocked(day);
                    const isToggleButtonDisabled = togglingDay !== null || (isGloballyBlocked && !!selectedClientId);
                    const isBlockActiveForToggle = selectedClientId 
                        ? !!blockedRecords.find(b => b.date === dateStr && b.clientId === selectedClientId) 
                        : isGloballyBlocked;
                    
                    let cellBg = 'bg-slate-50/50';
                    if (isGloballyBlocked) cellBg = 'bg-red-50';
                    else if (isClientSpecificallyBlocked) cellBg = 'bg-sky-50';
                    else if (isPast) cellBg = 'bg-slate-100';

                    return (
                        <div key={day} onClick={() => handleDayClick(day)} className={`rounded-2xl min-h-[140px] p-2 transition-all duration-300 relative group flex flex-col ${isPast || effectivelyBlocked ? 'cursor-not-allowed' : 'hover:shadow-lg hover:bg-white cursor-pointer'} ${cellBg}`}>
                            <div className="flex justify-between items-start mb-2"><div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${effectivelyBlocked || isPast ? 'text-gray-400' : 'text-slate-700'} ${isToday ? 'bg-brand-blue text-white shadow-sm' : ''}`}>{day}</div>{!isPast && (<button type="button" onClick={(e) => handleBlockToggle(e, day)} disabled={isToggleButtonDisabled} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-50 ${isBlockActiveForToggle ? 'opacity-100 text-red-500' : 'text-gray-400'}`}>{togglingDay === day ? <Loader2 size={14} className="animate-spin" /> : (isBlockActiveForToggle ? <Lock size={14} /> : <Unlock size={14} />)}</button>)}</div>
                            
                            {isGloballyBlocked && !isPast && (<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none rounded-xl" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, rgba(239, 68, 68, 0.03), rgba(239, 68, 68, 0.03) 4px, transparent 4px, transparent 8px)' }}><Lock size={16} className="text-red-400/80 mb-1" /><p className="text-[10px] font-bold text-red-500/90">مغلق للجميع</p></div>)}
                            
                            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 -mr-1">{dayBookings.map(b => (
                                <div key={b.id} onClick={(e) => openBookingAction(e, b)} className="w-full p-2 rounded-lg transition-all cursor-pointer group/item hover:shadow-md hover:-translate-y-px bg-white/80 backdrop-blur-sm shadow-sm flex items-center gap-2" style={{ borderRight: b.clientId ? `4px solid ${clientColors[b.clientId] || '#e2e8f0'}` : 'none' }}>
                                    <div className={`w-2 h-2 rounded-full ${getStatusDotColor(b.status)} shrink-0`}></div>
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <p className="font-bold text-xs text-slate-800 truncate">{b.clientName} {b.branchName && <span className="text-gray-500 font-medium">({b.branchName})</span>}</p>
                                        <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                                            <p className="text-[10px] font-mono font-semibold shrink-0">{b.time}</p>
                                            {b.type === 'on-site' && <span title="On-site Visit"><Wrench size={12} className="text-slate-400"/></span>}
                                            {b.type === 'consultation' && <span title="Consultation"><MessageSquare size={12} className="text-slate-400"/></span>}
                                        </div>
                                    </div>
                                    <a href={generateGoogleCalendarLink(b)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity ml-1 shrink-0"><ExportIcon size={12}/></a>
                                </div>
                            ))}</div>

                            {!selectedClientId && clientSpecificBlocks.length > 0 && !isGloballyBlocked && (
                                <div className="mt-auto pt-1 flex flex-wrap gap-1 pointer-events-none">
                                    {clientSpecificBlocks.slice(0, 3).map(block => {
                                        const client = clients.find(c => c.id === block.clientId);
                                        return (
                                            <div key={block?.id} className="flex items-center gap-1 bg-gray-200 text-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md" title={`مغلق للعميل: ${client?.companyName}`}>
                                                <Lock size={8} />
                                                <span className="truncate">{client?.companyName || 'عميل محذوف'}</span>
                                            </div>
                                        );
                                    })}
                                    {clientSpecificBlocks.length > 3 && (
                                        <div className="text-center text-gray-500 text-[9px] font-bold bg-gray-200/50 rounded-md px-1 py-0.5">+ {clientSpecificBlocks.length - 3} آخرين</div>
                                    )}
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
            
            {bookingModalState.isOpen && bookingModalState.date && (
                <AdminBookingModal
                    isOpen={bookingModalState.isOpen}
                    onClose={() => setBookingModalState({ isOpen: false, date: null })}
                    selectedDate={bookingModalState.date}
                    clients={clients}
                    preselectedClientId={selectedClientId}
                    allBookings={bookings}
                    blockedRecords={blockedRecords}
                    onSuccess={showNotification}
                />
            )}
            
            <AnimatePresence>
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-lg">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-[#0c2444]">تصدير المواعيد</h3>
                                <button onClick={() => setIsExportModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">اختر النطاق الزمني للتصدير كملف CSV (Excel).</p>
                            <div className="space-y-3">
                                <button onClick={() => handleExportCsv('current')} className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-[#0c2444]">تصدير الشهر الحالي</button>
                                <button onClick={() => handleExportCsv('next')} className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-[#0c2444]">تصدير الشهر القادم</button>
                                <button disabled className="w-full text-left p-4 bg-gray-50 rounded-xl font-bold text-gray-400 cursor-not-allowed opacity-50">تصدير PDF (قريباً)</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CtrlZCalendar;
