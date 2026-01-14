
import React, { useMemo, useState, useEffect } from 'react';
import { Bell, CalendarCheck, XCircle, Trash2, CheckSquare, ShoppingCart, ClipboardList, Clock, Headphones, Share2, Calendar, Loader2 } from 'lucide-react';
import { useBooking } from '../../../modules/bookings/context';
import { useAuth } from '../../../modules/auth/AuthContext';
import { useClientData } from '../../../modules/clients/context';
import { supabase } from '../../../lib/supabase';

// Icon Logic
const NotificationIcon = ({ subject, type }: { subject: string, type?: string }) => {
    if (type === 'completed_task') return <CheckSquare size={20} className="text-green-600" />;
    if (type === 'new_task') return <ClipboardList size={20} className="text-purple-500" />;
    if (type === 'booking_confirmed') return <CalendarCheck size={20} className="text-blue-500" />;
    if (type === 'booking_pending') return <Clock size={20} className="text-orange-500" />;
    if (subject.includes('إلغاء موعد')) return <XCircle size={20} className="text-red-500" />;
    if (type === 'order_update') return <ShoppingCart size={20} className="text-emerald-600" />;
    if (type === 'resolved_ticket') return <Headphones size={20} className="text-green-500" />;
    return <Bell size={20} className="text-gray-500" />;
};

interface NotificationsViewProps {
    tickets: any[]; 
    onClear: () => Promise<void>;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ tickets: initialTickets, onClear }) => {
    const { user } = useAuth();
    const { bookings, visitTasks } = useBooking();
    const { clients } = useClientData();
    
    // Local state for system tickets
    const [localTickets, setLocalTickets] = useState(initialTickets);
    const [adminPhone, setAdminPhone] = useState<string>('');
    const [isClearing, setIsClearing] = useState(false);
    
    // Cleared IDs State - Loaded from LocalStorage
    const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
    
    // Session Flag
    const [isSessionCleared, setIsSessionCleared] = useState(false);

    // Sync props to local state
    useEffect(() => {
        setLocalTickets(initialTickets);
    }, [initialTickets]);

    // LOAD Cleared IDs when User ID matches
    useEffect(() => {
        if (!user?.id) return;
        try {
            const storageKey = `ctrlz_cleared_ids_${user.id}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                setClearedIds(new Set(JSON.parse(stored)));
            }
        } catch (e) {
            console.error("Error loading cleared IDs", e);
        }
    }, [user?.id]);

    // Fetch Admin Phone for WhatsApp Export
    useEffect(() => {
        const fetchAdminPhone = async () => {
            try {
                const { data } = await supabase.from('system_settings').select('value').eq('id', 'whatsapp_notification_number').maybeSingle();
                if (data && data.value) setAdminPhone(data.value);
            } catch (error) {
                console.error("Failed to fetch admin phone:", error);
            }
        };
        fetchAdminPhone();
    }, []);

    // --- Data Preparation (Combined List) ---
    const combinedNotifications = useMemo(() => {
        if (isSessionCleared) return [];

        const feed: any[] = [];
        const userId = user?.id;
        if (!userId) return [];

        // Helper to ensure correct time display
        const resolveDate = (dateStr?: string, timeStr?: string) => {
            if (!dateStr) return new Date().toISOString();
            if (dateStr.includes('T')) return dateStr; // Already ISO

            // If only Date string (YYYY-MM-DD), append time or current time
            if (timeStr) {
                try {
                    const [time, modifier] = timeStr.trim().split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    
                    if (modifier === 'PM' && hours < 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;

                    const d = new Date(dateStr);
                    d.setHours(hours, minutes, 0, 0);
                    return d.toISOString();
                } catch (e) { }
            }

            const d = new Date(dateStr);
            // Default to start of day if no time, so it sorts towards bottom of that day
            return d.toISOString();
        };

        // 1. System Notifications (Primary Source for Real Timestamp)
        localTickets.forEach(t => {
            if (clearedIds.has(t.id)) return; 

            feed.push({
                id: t.id,
                subject: t.title || t.subject || 'إشعار',
                description: t.description || t.message || '',
                date: t.created_at || new Date().toISOString(), // This comes from DB insert time
                type: 'system'
            });
        });

        // 2. Bookings (Derived - Only add if not already covered by a system notification to avoid duplicates, or just list them)
        // We will list them but they might have "visit date" as timestamp if createdAt is not recent.
        bookings.filter(b => b.clientId === userId && (b.status === 'confirmed' || b.status === 'pending')).forEach(b => {
            const id = `b-${b.id}`;
            if (clearedIds.has(id)) return; 

            // If we have a real system notification for this booking confirmation, we might prefer that.
            // But checking for duplicates is hard. 
            // We use createdAt if available, else visit date.
            const dateVal = b.createdAt || resolveDate(b.date, b.time);
            
            feed.push({
                id: id,
                subject: b.status === 'pending' ? 'طلب حجز قيد المراجعة' : 'موعد زيارة مجدول',
                description: `موعد بتاريخ ${b.date} الساعة ${b.time}`,
                date: dateVal,
                type: b.status === 'pending' ? 'booking_pending' : 'booking_confirmed'
            });
        });

        // 3. Tasks
        visitTasks.filter(t => t.clientId === userId && t.isCompleted).forEach(t => {
            const id = `t-${t.id}`;
            if (clearedIds.has(id)) return;

            const dateVal = t.visitDate ? resolveDate(t.visitDate) : new Date().toISOString();

            feed.push({
                id: id,
                subject: 'إنجاز مهمة',
                description: t.text,
                date: dateVal,
                type: 'completed_task'
            });
        });

        return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
    }, [localTickets, bookings, visitTasks, user, clearedIds, isSessionCleared]);

    // --- REFACTORED CLEAR FUNCTION (Bulletproof) ---
    const handleClearAll = async (e: React.MouseEvent) => {
        // Prevent event bubbling issues
        e.preventDefault();
        e.stopPropagation();

        if (isClearing) return;

        if (!window.confirm("هل أنت متأكد من مسح سجل التنبيهات؟ ستصبح الصفحة فارغة تماماً.")) return;
        
        setIsClearing(true);
        const userId = user?.id;
        
        try {
            // 1. Force UI Update Immediately
            setIsSessionCleared(true);
            setLocalTickets([]); 

            if (userId) {
                // 2. Identify all current visible IDs to blacklist them locally
                // This covers items that are NOT in the 'notifications' table (like bookings/tasks)
                const currentVisibleIds = combinedNotifications.map(n => n.id);
                const newClearedSet = new Set([...clearedIds, ...currentVisibleIds]);
                
                setClearedIds(newClearedSet);
                localStorage.setItem(`ctrlz_cleared_ids_${userId}`, JSON.stringify(Array.from(newClearedSet)));

                // 3. Delete real notifications from DB
                await supabase.from('notifications').delete().eq('client_id', userId);
                
                // 4. Notify Parent to refresh context
                if(onClear) await onClear();
            }
        } catch (err: any) {
            console.error("Deletion Error:", err);
            alert("حدث خطأ بسيط أثناء المسح، لكن تم تحديث العرض.");
        } finally {
            setIsClearing(false);
        }
    };

    // --- Grouping By Date ---
    const groupedNotifications = useMemo(() => {
        const groups: Record<string, any[]> = {};
        
        combinedNotifications.forEach(item => {
            const dateObj = new Date(item.date);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let key = dateObj.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            if (dateObj.toDateString() === today.toDateString()) {
                key = 'اليوم';
            } else if (dateObj.toDateString() === yesterday.toDateString()) {
                key = 'أمس';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        return groups;
    }, [combinedNotifications]);

    const handleWhatsAppExport = () => {
        if (!adminPhone) {
            alert("لم يتم إعداد رقم واتساب للإدارة.");
            return;
        }
        
        // --- Data Sources ---
        const client = clients.find(c => c.id === user?.id);
        const companyName = client?.companyName || user?.name || 'غير معروف';
        const contactPerson = client?.name || 'غير محدد';
        const currentDate = new Date().toLocaleDateString('ar-EG');

        // --- Upcoming Visits ---
        const upcomingVisits = bookings
            .filter(b => b.clientId === user?.id && (b.status === 'confirmed' || b.status === 'pending') && new Date(b.date) >= new Date())
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5); // Reasonable limit

        let visitsText = "";
        if (upcomingVisits.length > 0) {
            visitsText = upcomingVisits.map(b => 
                `📅 *${b.date}* – ⏰ *${b.time || 'غير محدد'}*\n   📌 ${b.branchName || 'المقر الرئيسي'}`
            ).join('\n');
        } else {
            visitsText = "— لا توجد زيارات مجدولة حالياً —";
        }

        // --- Recent Activity (Notifications) ---
        // We use combinedNotifications but slice top 5 to keep message readable
        const recentActivity = combinedNotifications.slice(0, 8); 
        let activityText = "";
        if (recentActivity.length > 0) {
            activityText = recentActivity.map(n => {
                // Ensure text isn't too long for one line if possible
                const desc = n.description.length > 60 ? n.description.substring(0, 60) + '...' : n.description;
                return `• ${n.subject}: ${desc} (${new Date(n.date).toLocaleDateString('ar-EG')})`;
            }).join('\n');
        } else {
            activityText = "— لا توجد تنبيهات مسجلة —";
        }

        // --- Message Assembly ---
        const messageBody = `*تقرير متابعة العميل | Ctrl Z*

🏢 *الشركة:* ${companyName}
👤 *المسؤول:* ${contactPerson}
📅 *تاريخ التقرير:* ${currentDate}

──────────────────

📍 *الزيارات القادمة:*
${visitsText}

──────────────────

🔔 *آخر التنبيهات والنشاطات:*
${activityText}

──────────────────

يرجى التكرم بالمراجعة.
*نظام Ctrl Z الذكي*`;

        const encodedMessage = encodeURIComponent(messageBody);
        window.open(`https://wa.me/${adminPhone}?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative min-h-[600px]">
            
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-[#0c2444] flex items-center gap-2">
                        <Bell size={24} className="text-[#0071e3]"/> سجل التنبيهات
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">آخر المستجدات المتعلقة بحسابك</p>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {combinedNotifications.length > 0 && (
                        <>
                            <button 
                                onClick={handleWhatsAppExport}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border border-green-200"
                            >
                                <Share2 size={16}/> إرسال تنبيه إلى Ctrl Z
                            </button>
                            <button 
                                onClick={handleClearAll}
                                disabled={isClearing}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-500 hover:bg-red-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border border-red-200 disabled:opacity-50"
                            >
                                {isClearing ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                                مسح السجل
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-8">
                {Object.keys(groupedNotifications).length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Bell size={32} className="opacity-30" />
                        </div>
                        <p className="font-bold">لا توجد تنبيهات جديدة</p>
                        <p className="text-sm">أنت مطلع على كل شيء!</p>
                    </div>
                ) : (
                    Object.entries(groupedNotifications).map(([dateLabel, items]) => (
                        <div key={dateLabel} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Date Separator */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px bg-gray-100 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full flex items-center gap-2">
                                    <Calendar size={12}/> {dateLabel}
                                </span>
                                <div className="h-px bg-gray-100 flex-1"></div>
                            </div>

                            <div className="space-y-3">
                                {(items as any[]).map((item) => (
                                    <div 
                                        key={item.id}
                                        className="bg-white p-4 rounded-2xl border border-gray-100 flex items-start gap-4 hover:shadow-md transition-all hover:border-blue-100 group"
                                    >
                                        <div className="w-12 h-12 bg-[#f8fafc] rounded-2xl flex items-center justify-center shadow-inner shrink-0 group-hover:bg-blue-50 transition-colors">
                                            <NotificationIcon subject={item.subject} type={item.type} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-[#0c2444] text-sm group-hover:text-blue-700 transition-colors">{item.subject}</h4>
                                                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
                                                    {new Date(item.date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsView;
