
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../modules/auth/AuthContext';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { useBooking } from '../../modules/bookings/context';
import { useTicket } from '../../modules/tickets/context';
import { useInvoice } from '../../modules/billing/context';
import { useClientData } from '../../modules/clients/context';
import { PACKAGES } from '../../core/constants';
import { Building2, LogOut, X, Loader2, MessageSquare, Trash2, Check, Download } from 'lucide-react';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';
import { motion as m, AnimatePresence } from 'framer-motion';
import { ClientProfile, Booking, Report, ClientUser, Ticket, RemoteSupportTicket } from '../../core/types';
import { supabase } from '../../lib/supabase';
import Logo from '../../ui/components/Logo';
import { useLocation, useNavigate } from 'react-router-dom';

import DatePicker from './components/DatePicker';
import BillingView from './components/BillingView';
import ReportsView from './components/ReportsView';
import UsersView from './components/UsersView';
import ClientOverview from './components/ClientOverview';
import NotificationsView from './components/NotificationsView';
import VisitTasksView from './components/VisitTasksView';
import ConsultationsView from './components/ConsultationsView';
import RequestsView from './components/RequestsView';
import SupportView from './components/SupportView';
import RemoteSupportModal from './components/RemoteSupportModal';

const motion = m as any;

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data Contexts
  const { clients, updateClient, isLoading: clientsLoading, refreshClients } = useClientData(); 
  const { bookings, addBooking, rescheduleBooking, blockedRecords, updateBookingStatus, visitTasks, addTask, deleteTask, toggleTaskCompletion, updateTask, isLoading: bookingsLoading } = useBooking();
  // EXPOSED refreshTickets from context
  const { tickets, addTicket, notifications, clearNotifications, markNotificationsAsRead, addReply, orders, remoteSupportTickets, refreshTickets } = useTicket();
  const { invoices } = useInvoice(); 
  
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'requests' | 'users' | 'billing' | 'reports' | 'notifications' | 'consultations' | 'support'>('overview');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [clientReports, setClientReports] = useState<Report[]>([]);

  // NEW: State for Remote Support Modal
  const [isRemoteSupportModalOpen, setIsRemoteSupportModalOpen] = useState(false);

  // Admin WhatsApp Number State
  const [adminPhone, setAdminPhone] = useState<string>('');

  // 1. REAL-TIME SUBSCRIPTION FOR CLIENT'S TICKETS
  useEffect(() => {
      if (!user?.id) return;

      console.log("Setting up Realtime for Client Remote Support Tickets:", user.id);

      const channel = supabase.channel(`client_remote_support:${user.id}`)
          .on(
              'postgres_changes', 
              { 
                  event: '*', // Listen to INSERT, UPDATE, DELETE
                  schema: 'public', 
                  table: 'remote_support_tickets', 
                  filter: `client_id=eq.${user.id}` // Only for this client
              }, 
              (payload) => {
                  console.log("Realtime Update Received for Remote Support Ticket:", payload);
                  // Refresh data immediately
                  refreshTickets();
                  
                  if (payload.eventType === 'UPDATE' && payload.new.status === 'resolved') {
                      setNotification({ message: "تم معالجة تذكرة الدعم عن بعد بنجاح ✅", type: "success" });
                      setTimeout(() => setNotification(null), 5000);
                  }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [user?.id, refreshTickets]);

  // Handle External Navigation
  useEffect(() => {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('action') === 'remote_support') {
          setIsRemoteSupportModalOpen(true);
          navigate('/client', { replace: true });
      } else if (location.state && location.state.tab) {
          setActiveTab(location.state.tab);
          // Removed manual history manipulation; child components handle their specific state needs.
      }
  }, [location, navigate]);

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

  const liveClient = useMemo(() => {
    if (!user) return null;
    return clients.find(c => c.id === user.id) || (user as unknown as ClientProfile);
  }, [clients, user]);

  // --- Mark Notifications as Read when Tab is Active ---
  useEffect(() => {
      if (activeTab === 'notifications' && liveClient?.id) {
          markNotificationsAsRead(liveClient.id);
      }
  }, [activeTab, liveClient?.id, markNotificationsAsRead]);

  const fetchReports = useCallback(async () => {
      if (!liveClient?.id) return;
      try {
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('client_id', liveClient.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

          if (error) {
              console.error("Error fetching client reports:", error.message || JSON.stringify(error));
          } else if (data) {
              const mappedReports = data.map((r: any): Report => ({
                  id: r.id,
                  clientId: r.client_id,
                  month: r.month,
                  type: r.type,
                  content: r.content,
                  createdAt: r.created_at
              }));
              setClientReports(mappedReports);
          }
      } catch (err) {
          console.error("Fetch reports error:", err);
      }
  }, [liveClient?.id]);
  
  useEffect(() => {
      fetchReports();
      if (!liveClient?.id) return;
      
      const sub = supabase.channel(`reports-client-${liveClient.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `client_id=eq.${liveClient.id}` }, fetchReports)
          .subscribe();
      
      return () => { supabase.removeChannel(sub); };
  }, [fetchReports, liveClient?.id]);


  const currentPackage = PACKAGES.find(p => p.id === liveClient?.packageId);
  const packageName = currentPackage ? (t.packages.items[currentPackage.name]?.name || currentPackage.name) : 'Basic Plan';

  const clientBookings = useMemo(() => {
    if (!liveClient?.id) return [];
    return bookings.filter(b => b.clientId === liveClient.id);
  }, [bookings, liveClient?.id]);

  const upcomingBookings = useMemo(() => {
    return clientBookings
      .filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.date) >= new Date())
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [clientBookings]);

  const clientTickets = useMemo(() => {
      if (!liveClient?.id) return [];
      return tickets.filter(t => t.clientId === liveClient.id);
  }, [tickets, liveClient?.id]);
  
  // Filter notifications by client_id strictly
  const clientSystemNotifications = useMemo(() => {
    if (!liveClient?.id) return [];
    // Check both potential column names just in case, but prioritize the correct one
    return notifications.filter(n => n.client_id === liveClient.id || n.clientId === liveClient.id);
  }, [notifications, liveClient?.id]);
  
  // Count unread notifications
  const unreadNotificationsCount = useMemo(() => {
      return clientSystemNotifications.filter(n => n.is_read === false).length;
  }, [clientSystemNotifications]);

  const uncompletedAdminTasksCount = useMemo(() => {
    if (!liveClient?.id) return 0;
    return visitTasks.filter(t => t.clientId === liveClient.id && t.type === 'standard' && !t.isCompleted && t.status !== 'completed').length;
  }, [visitTasks, liveClient?.id]);

  const unresolvedConsultationsCount = useMemo(() => {
    if (!liveClient?.id) return 0;
    return tickets.filter(t => t.clientId === liveClient.id && t.subject.startsWith('استشارة') && t.clientHasUnread).length;
  }, [tickets, liveClient?.id]);

  const clientInvoices = useMemo(() => {
    if (!liveClient?.id) return [];
    return invoices.filter(i => i.clientId === liveClient.id);
  }, [invoices, liveClient?.id]);

  const relevantBlockedDates = useMemo(() => {
    if (!liveClient?.id) return [];
    return blockedRecords
      .filter(b => b.clientId === null || b.clientId === liveClient.id)
      .map(b => b.date);
  }, [blockedRecords, liveClient?.id]);

  const confirmedVisitsCount = clientBookings.filter(b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'completed').length;
  const actualRemainingVisits = Math.max(0, (liveClient?.totalVisits || 0) - confirmedVisitsCount);
  
  const clientRemoteSupportTickets = useMemo(() => {
      if (!liveClient?.id) return [];
      return remoteSupportTickets
        .filter(t => t.client_id === liveClient.id)
        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [remoteSupportTickets, liveClient?.id]);

  const actualRemainingTickets = Math.max(0, (liveClient?.totalTickets || 0) - clientRemoteSupportTickets.length);

  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{date: string, time: string} | null>(null);
  const [bookingToReschedule, setBookingToReschedule] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null; reason: string }>({ isOpen: false, booking: null, reason: '' });
  
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
  }, []);

  const handleVisitRequest = async () => {
    if (actualRemainingVisits > 0) {
        setBookingToReschedule(null); 
        setIsVisitModalOpen(true); 
        setBookingSuccess(null);
    } else { 
        if (window.confirm("لقد استنفدت رصيد الزيارات في باقتك. هل ترغب بطلب زيارة إضافية؟ سيتم إرسال طلب للإدارة وقد تترتب عليه رسوم إضافية.")) {
            if (!liveClient) return;
            await addTicket({
                clientId: liveClient.id, clientName: liveClient.companyName, subject: 'طلب زيارة إضافية',
                description: `يطلب العميل ${liveClient.companyName} زيارة ميدانية إضافية خارج الباقة.`,
                status: 'open', priority: 'medium', date: new Date().toISOString().split('T')[0],
                messages: [{ id: `m-${Date.now()}`, sender: 'client', senderName: liveClient.companyName, text: `طلب زيارة ميدانية إضافية.`, timestamp: new Date().toISOString() }]
            });
            showNotification("تم إرسال طلب الزيارة الإضافية بنجاح.");
        }
    }
  };

  const canEditBooking = (dateStr: string, timeStr?: string) => {
    if (!timeStr) { const visitDate = new Date(dateStr); const now = new Date(); return (visitDate.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24; }
    const [time, modifier] = timeStr.split(' '); let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) { hours = modifier.toUpperCase() === 'AM' ? 0 : 12; } else if (modifier.toUpperCase() === 'PM') { hours += 12; }
    const visitDateTime = new Date(dateStr); visitDateTime.setHours(hours, minutes, 0, 0); const now = new Date(); return (visitDateTime.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24;
  };

  const handleBookingDateConfirm = async (date: string, time: string, branchId?: string) => { 
      if (!liveClient?.id) return;
      try {
        const selectedBranch = branchId ? liveClient?.branches?.find(b => b.id === branchId) : undefined;
        if (bookingToReschedule) {
            const success = await rescheduleBooking(bookingToReschedule, date, time);
            if (success) { setBookingSuccess({ date, time }); showNotification("تم تعديل الموعد بنجاح"); } else { showNotification("فشل تعديل الموعد", "error"); }
        } else {
            const success = await addBooking({ clientId: liveClient.id, clientName: liveClient.companyName, date: date, time: time, type: 'on-site', status: 'pending', branchId: selectedBranch?.id, branchName: selectedBranch?.name });
            if (success) {
                setBookingSuccess({ date, time });
                showNotification("تم إرسال طلب الحجز، وهو الآن بانتظار التأكيد");
                
                // WHATSAPP LOGIC - ASK FIRST
                if (adminPhone) {
                    if (window.confirm("هل ترغب بإرسال تنبيه واتساب للإدارة بخصوص هذا الحجز؟")) {
                        const msg = encodeURIComponent(`تنبيه جديد: قام العميل ${liveClient.companyName} بحجز موعد جديد بتاريخ ${date} الساعة ${time}. يرجى المراجعة والتأكيد.`);
                        window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank');
                    }
                }

                await supabase.from('notifications').insert([{
                    client_id: liveClient.id,
                    client_name: liveClient.companyName,
                    title: 'طلب حجز موعد جديد',
                    description: `طلب العميل ${liveClient.companyName} حجز موعد جديد بتاريخ ${date} الساعة ${time}.`,
                    is_read: false
                }]);
            } else { showNotification("فشل الحجز", "error"); }
        }
      } catch (error) { showNotification("حدث خطأ غير متوقع", "error"); }
  };

  const handleCancelBooking = (booking: Booking) => {
    if (!canEditBooking(booking.date, booking.time)) { showNotification("لا يمكن إلغاء الموعد قبل أقل من 24 ساعة.", "error"); return; }
    setCancelModal({ isOpen: true, booking: booking, reason: '' });
  };

  const handleConfirmCancellation = async () => {
    if (!cancelModal.booking || !cancelModal.reason) { showNotification("يرجى كتابة سبب الإلغاء.", "error"); return; }
    if (!liveClient) return;
    const success = await updateBookingStatus(cancelModal.booking.id, 'cancelled');
    if (success) {
        showNotification("تم إلغاء الموعد بنجاح.");

        // WHATSAPP LOGIC - ASK FIRST
        if (adminPhone) {
            if (window.confirm("هل ترغب بإرسال تنبيه واتساب للإدارة بخصوص إلغاء الموعد؟")) {
                const msg = encodeURIComponent(`تنبيه إلغاء: قام العميل ${liveClient.companyName} بإلغاء الموعد المقرر بتاريخ ${cancelModal.booking.date}. السبب: ${cancelModal.reason}`);
                window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank');
            }
        }

        await supabase.from('notifications').insert([{
            client_id: liveClient.id,
            client_name: liveClient.companyName,
            title: `إلغاء موعد بتاريخ ${cancelModal.booking.date}`,
            description: `السبب: ${cancelModal.reason}`,
            is_read: false
        }]);

        setCancelModal({ isOpen: false, booking: null, reason: '' });
    } else { showNotification("فشل إلغاء الموعد.", "error"); }
  };
  
  const closeVisitModal = () => {
    setIsVisitModalOpen(false);
    setBookingSuccess(null);
    setBookingToReschedule(null);
  };

  const handleExportToCalendar = () => {
    if (!bookingSuccess || !liveClient) return;

    const { date, time } = bookingSuccess;
    const clientName = liveClient.companyName;

    const [timeValue, modifier] = time.split(' ');
    let [hours, minutes] = timeValue.split(':').map(Number);

    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

    const startDateTime = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const toIcsFormat = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const startDateIcs = toIcsFormat(startDateTime);
    const endDateIcs = toIcsFormat(endDateTime);
    const nowIcs = toIcsFormat(new Date());

    const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CtrlZ//IT Services//EN',
        'BEGIN:VEVENT', `UID:${Date.now()}@ctrlz.jo`, `DTSTAMP:${nowIcs}`,
        `DTSTART:${startDateIcs}`, `DTEND:${endDateIcs}`,
        'SUMMARY:Ctrl Z Technical Visit', `DESCRIPTION:Scheduled technical visit for ${clientName}.`,
        `LOCATION:${clientName}`, 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([`\uFEFF${icsContent}`], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'ctrlz-visit.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearClientNotifications = async () => {
      const userId = liveClient?.id; // تأكد من الحصول على UUID
      
      if (!userId) {
        alert("لم يتم العثور على معرف العميل");
        return;
      }

      const confirmClear = window.confirm("سيتم مسح جميع التنبيهات نهائياً، هل أنت موافق؟");
      if (!confirmClear) return;

      try {
        // محاولة الحذف المباشر
        const { data, error } = await supabase
          .from('notifications')
          .delete()
          .eq('client_id', userId)
          .select(); // إضافة select للتأكد من عدد الصفوف المحذوفة

        if (error) throw error;

        console.log("عدد الصفوف المحذوفة:", data?.length);
        
        // تحديث الواجهة فوراً
        await refreshTickets(); 
        alert("✅ تم مسح السجل بنجاح من قاعدة البيانات");
      } catch (err: any) {
        console.error("خطأ حذف حقيقي:", err);
        alert("حدث خطأ تقني أثناء الحذف: " + err.message);
      }
  };

  const handleAddUser = async (newUser: ClientUser) => {
      if (!liveClient) return;
      
      if ((liveClient.usersList?.length || 0) >= liveClient.totalUsersLimit) {
          showNotification("عذراً، لقد استهلكت الحد الأقصى من عدد المستخدمين المسموح به في باقتك.", "error");
          return;
      }

      const updatedUsers = [...(liveClient.usersList || []), newUser];
      
      await updateClient(liveClient.id, { 
          usersList: updatedUsers,
          activeUsers: updatedUsers.length
      });
      
      await supabase.from('notifications').insert([{
          client_id: liveClient.id,
          client_name: liveClient.companyName,
          title: 'إضافة مستخدم جديد',
          description: `قام العميل ${liveClient.companyName} بإضافة المستخدم: ${newUser.name}`,
          is_deleted: false,
          is_read: false
      }]);
      showNotification("تم إضافة المستخدم الجديد بنجاح ✅");
  };

  const handleUpdateUser = async (updatedUser: ClientUser) => {
      if (!liveClient) return;
      const updatedUsers = (liveClient.usersList || []).map(u => u.id === updatedUser.id ? updatedUser : u);
      await updateClient(liveClient.id, { usersList: updatedUsers });
      showNotification("تم تحديث بيانات المستخدم بنجاح ✅");
  };

  const handleDeleteUser = async (userId: string) => {
      // Direct Delete Logic handled in UsersView via context
  };

  const TABS = [
    {id: 'overview', label: 'نظرة عامة'},
    {id: 'tasks', label: 'مهام الزيارات', badge: uncompletedAdminTasksCount}, 
    {id: 'support', label: 'الدعم عن بعد'}, 
    {id: 'notifications', label: 'التنبيهات', badge: unreadNotificationsCount},
    {id: 'consultations', label: 'الاستشارات التقنية', badge: unresolvedConsultationsCount},
    {id: 'requests', label: 'الطلبات الإضافية'}, 
    {id: 'users', label: 'فريق العمل'},
    {id: 'billing', label: 'الفوترة'},
    {id: 'reports', label: 'التقارير'}
  ];

  if (clientsLoading || bookingsLoading) { return <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]"><Loader2 className="animate-spin text-[#0c2444]" size={40} /></div>; }

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans relative" dir="rtl">
      <FloatingTechBackground />
      <AnimatePresence>{notification && <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl ${notification.type==='success'?'bg-green-500':'bg-red-500'} text-white`}>{notification.message}</div>}</AnimatePresence>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 relative z-10">
          
          {/* Header with System Logo */}
          <div className="flex justify-end mb-8">
             <div className="h-12 translate-x-2">
                <Logo className="h-full w-auto" />
             </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                      {liveClient?.logo ? <img src={liveClient.logo} className="w-full h-full object-contain" alt="Logo" /> : <Building2 className="w-10 h-10 text-gray-300" />}
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                        <h1 className="text-3xl font-bold text-[#0c2444] tracking-tight whitespace-nowrap">
                            {t.client.hello}, {liveClient?.name?.split(' ')[0]}
                        </h1>
                        <h2 className="text-lg text-gray-500 font-medium whitespace-nowrap">
                            {liveClient?.companyName}
                        </h2>
                        <div className="mt-1">
                            <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 rounded-full shrink-0">
                                <span className="text-xs font-bold text-[#0071e3]">{packageName}</span>
                            </div>
                        </div>
                  </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto items-center">
                  <div className="flex bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar gap-1 max-w-full">
                      {TABS.map((tab) => (
                          <button 
                              key={tab.id} 
                              onClick={() => setActiveTab(tab.id as any)} 
                              className={`relative px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                                activeTab === tab.id 
                                ? 'bg-[#0c2444] text-white shadow-md' 
                                : 'text-gray-500 hover:text-[#0c2444] hover:bg-gray-50'
                              }`}
                          >
                              {tab.label}
                              
                              <AnimatePresence>
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <motion.div 
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="relative flex items-center justify-center -mr-1"
                                    >
                                        <div className="relative flex items-center justify-center">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                          <span className="relative inline-flex h-5 min-w-[20px] px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 border border-white/20 text-white text-[9px] font-black items-center justify-center shadow-md">
                                            {tab.badge}
                                          </span>
                                        </div>
                                    </motion.div>
                                )}
                              </AnimatePresence>
                          </button>
                      ))}
                  </div>
                  
                  <button onClick={logout} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-full font-bold shadow-sm hover:bg-red-100 transition-all border border-red-100 shrink-0"><LogOut size={18} /></button>
              </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'overview' && <ClientOverview t={t} actualRemainingVisits={actualRemainingVisits} actualRemainingTickets={actualRemainingTickets} upcomingBookings={upcomingBookings} canEditBooking={canEditBooking} setBookingToReschedule={setBookingToReschedule} setIsVisitModalOpen={setIsVisitModalOpen} handleVisitRequest={handleVisitRequest} setIsTicketModalOpen={() => setIsRemoteSupportModalOpen(true)} handleCancelBooking={handleCancelBooking} setBookingSuccess={setBookingSuccess} />}
                {activeTab === 'tasks' && liveClient && <VisitTasksView client={liveClient} bookings={clientBookings} visitTasks={visitTasks} addTask={addTask} deleteTask={deleteTask} toggleTaskCompletion={toggleTaskCompletion} updateTask={updateTask} />}
                {activeTab === 'support' && liveClient && <SupportView tickets={clientRemoteSupportTickets} onOpenTicket={() => setIsRemoteSupportModalOpen(true)} clientUsers={liveClient.usersList || []} />}
                {activeTab === 'requests' && liveClient && <RequestsView client={liveClient} />}
                {activeTab === 'users' && liveClient && <UsersView client={liveClient} users={liveClient.usersList || []} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />}
                {activeTab === 'billing' && liveClient && <BillingView invoices={clientInvoices} currency={currentPackage?.currency || 'JOD'} t={t} packagePrice={currentPackage?.price || 0} client={liveClient} />}
                {activeTab === 'reports' && <ReportsView reports={clientReports} t={t} />}
                {activeTab === 'notifications' && liveClient && <NotificationsView tickets={clientSystemNotifications} onClear={handleClearClientNotifications} />}
                {activeTab === 'consultations' && liveClient && <ConsultationsView client={liveClient} tickets={clientTickets} addTicket={addTicket} addReply={addReply} />}
            </motion.div>
          </AnimatePresence>
      </div>

      {isVisitModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"><div className="bg-white rounded-[2rem] p-4 sm:p-6 w-full max-w-4xl shadow-2xl relative animate-in fade-in zoom-in duration-300"><button onClick={closeVisitModal} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10 w-10 h-10 flex items-center justify-center"><X size={20}/></button>{!bookingSuccess ? (<DatePicker onSelect={handleBookingDateConfirm} blockedDates={relevantBlockedDates} bookings={bookings} clientBookings={clientBookings} branches={liveClient?.branches} />) : (<div className="text-center py-8 flex flex-col items-center justify-center min-h-[400px]"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}><div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100"><Check size={48} strokeWidth={3} /></div></motion.div><h3 className="text-2xl font-bold mb-2 text-[#0c2444]">تم إرسال طلب الحجز بنجاح!</h3><p className="text-gray-500 max-w-sm">موعدك المبدئي هو <span className="font-bold text-[#0c2444]">{bookingSuccess.date}</span> الساعة <span className="font-bold text-[#0c2444]">{bookingSuccess.time}</span>.<br/>سوف يصلك إشعار عند تأكيد الموعد من قبل الإدارة.</p><div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-sm"><button onClick={handleExportToCalendar} className="flex-1 bg-white border border-gray-200 text-[#0c2444] py-3 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"><Download size={16} /> إضافة إلى تقويمي</button><button onClick={closeVisitModal} className="flex-1 bg-[#0c2444] text-white py-3 rounded-xl font-bold hover:bg-[#0a1f3b] transition-all">إغلاق</button></div></div>)}</div></div>)}
      {cancelModal.isOpen && (<div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-lg"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative"><button onClick={() => setCancelModal({isOpen: false, booking: null, reason: ''})} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10 w-10 h-10 flex items-center justify-center"><X size={20}/></button><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center"><MessageSquare size={20}/></div><h3 className="text-xl font-bold text-[#0c2444]">سبب إلغاء الموعد</h3></div><p className="text-sm text-gray-500 mb-4">يرجى توضيح سبب الإلغاء. سيتم إرسال السبب للإدارة.</p><textarea value={cancelModal.reason} onChange={e => setCancelModal(s => ({...s, reason: e.target.value}))} required rows={4} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 resize-none" placeholder="مثال: تعارض الموعد مع اجتماع آخر..."></textarea><div className="flex gap-3 mt-6"><button type="button" onClick={() => setCancelModal({isOpen: false, booking: null, reason: ''})} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">تراجع</button><button onClick={handleConfirmCancellation} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"><Trash2 size={16}/> تأكيد الإلغاء</button></div></motion.div></div>)}
      
      {/* Remote Support Modal */}
      <AnimatePresence>
          {isRemoteSupportModalOpen && liveClient && (
              <RemoteSupportModal 
                  isOpen={isRemoteSupportModalOpen} 
                  onClose={() => setIsRemoteSupportModalOpen(false)} 
                  client={liveClient}
              />
          )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
