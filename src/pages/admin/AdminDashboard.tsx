
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { useAuth } from '../../modules/auth/AuthContext';
import { useBooking } from '../../modules/bookings/context';
import { useTicket } from '../../modules/tickets/context';
import { useClientData } from '../../modules/clients/context';
import { PACKAGES } from '../../core/constants';
import { ClientProfile, Ticket as TicketType, Branch, Booking } from '../../core/types';
import FloatingTechBackground from '../../ui/components/FloatingTechBackground';
import { AnimatePresence, motion } from 'framer-motion';
// FIX: Import LogOut and Cpu (Tech Icon)
import { LogOut, Cpu } from 'lucide-react';
import Logo from '../../ui/components/Logo';

import ClientDetailModal from './components/ClientDetailModal';
import BillingManager from './components/BillingManager';
import ReportGenerator from './components/ReportGenerator';
import AdminSidebar from './components/AdminSidebar';
import ClientFormModal from './components/ClientFormModal';
import TicketDetailModal from './components/TicketDetailModal';
import CtrlZCalendar from './components/CtrlZCalendar';
import FinancialHub from './components/FinancialHub'; 
import TechniciansManager from './components/TechniciansManager';
import TasksManager from './components/TasksManager'; 
import BookingActionModal from './components/BookingActionModal'; // Imported new modal

import DashboardTab from './tabs/DashboardTab';
import ClientsTab from './tabs/ClientsTab';
import SupportHub from './tabs/SupportHub'; // Legacy, kept if needed, but replaced in nav
import RemoteSupportHub from './tabs/RemoteSupportHub'; // NEW
import OrdersTab from './tabs/OrdersTab';
import SettingsTab from './tabs/SettingsTab';
import NotificationsTab from './tabs/NotificationsTab';
import ConsultationsHub from './tabs/ConsultationsHub';

interface ClientFormState { 
    id: string; 
    name: string; 
    company: string; 
    email: string; 
    phone: string; 
    packageId: string; 
    accessCode: string; 
    referenceNumber: string;
    logo: string | null; 
    totalUsersLimit: number; 
    totalVisits: number; 
    totalTickets: number; 
    contractStartDate: string; 
    contractDurationMonths: number; 
    branches?: Branch[];
    paymentConfig?: any;
    netPrice?: number; // Added
    discountPercentage?: number; // Added
}

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const { t, dir } = useLanguage();
  const { clients, addClient, updateClient } = useClientData();
  const { tickets, orders, notifications, remoteSupportTickets, updateTicketStatus, addReply, deleteTicket, addTicket, clearNotifications } = useTicket();
  const { bookings, visitTasks, refreshBookings } = useBooking();

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modals & State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<ClientProfile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedClientForBilling, setSelectedClientForBilling] = useState<string>('');
  
  // Booking Action Modal State (Lifted from Calendar)
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  const [isBookingActionModalOpen, setIsBookingActionModalOpen] = useState(false);

  const [clientForm, setClientForm] = useState<ClientFormState>({ 
      id: '', name: '', company: '', email: '', phone: '', packageId: 'business-core', accessCode: '', referenceNumber: '', logo: null, totalUsersLimit: 10, totalVisits: 2, totalTickets: 3, contractStartDate: '', contractDurationMonths: 12, branches: [], paymentConfig: {}, netPrice: undefined, discountPercentage: 0 
  });
  
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [replyText, setReplyText] = useState('');

  // PERMISSIONS CHECK
  const hasPermission = (tabId: string) => {
      if (!user?.permissions || user.permissions.includes('*')) return true;
      return user.permissions.includes(tabId);
  };

  useEffect(() => {
      if (!hasPermission(activeTab)) {
          const allowedTabs = ['dashboard', 'notifications', 'calendar', 'tasks', 'clients', 'technicians', 'support', 'consultations', 'orders', 'billing', 'financials', 'reports', 'settings'];
          const firstAllowed = allowedTabs.find(t => hasPermission(t));
          if (firstAllowed) setActiveTab(firstAllowed);
      }
  }, [activeTab, user]);

  const isOrder = (t: TicketType) => t.subject.startsWith('طلب إضافة:') || t.subject.startsWith('Add-on Request:') || t.subject.startsWith('طلب حذف:');
  
  const supportTickets = useMemo(() => tickets.filter(t => !isOrder(t) && !t.subject.startsWith('استشارة تقنية:') && t.status !== 'resolved' && t.adminHasUnread), [tickets]);
  const consultationTickets = useMemo(() => tickets.filter(t => t.subject.startsWith('استشارة تقنية:') && t.adminHasUnread), [tickets]);
  const pendingOrdersCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);
  
  // NEW: Calculate pending remote support tickets (ONLY SENT status)
  const pendingRemoteSupportCount = useMemo(() => remoteSupportTickets.filter(t => t.status === 'sent').length, [remoteSupportTickets]);

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const clientRequestedTasksCount = useMemo(() => visitTasks.filter(t => t.type === 'client_request' && !t.isViewedByAdmin).length, [visitTasks]);

  const pendingNotificationsCount = pendingOrdersCount + pendingBookingsCount + supportTickets.length + consultationTickets.length + clientRequestedTasksCount + pendingRemoteSupportCount;


  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
        setNotification(null);
    }, 4000);
  };

  const handleOpenBookingAction = (booking: Booking) => {
      setSelectedBookingForAction(booking);
      setIsBookingActionModalOpen(true);
  };

  const handlePackageChange = (packageId: string) => {
      const selectedPackage = PACKAGES.find(p => p.id === packageId);
      setClientForm(prevForm => ({
          ...prevForm,
          packageId: packageId,
          totalVisits: selectedPackage?.limits?.visits || 0,
          totalTickets: selectedPackage?.limits?.tickets || 0,
          totalUsersLimit: selectedPackage?.limits?.users || 0,
      }));
  };
  
  const handleLogoFormUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClientForm(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!isEditing) { 
          const success = await addClient({ 
              name: clientForm.name, 
              companyName: clientForm.company, 
              email: clientForm.email,
              phone: clientForm.phone,
              packageId: clientForm.packageId, 
              accessCode: clientForm.accessCode, 
              referenceNumber: clientForm.referenceNumber,
              logo: clientForm.logo, 
              totalVisits: clientForm.totalVisits, 
              totalTickets: clientForm.totalTickets, 
              totalUsersLimit: clientForm.totalUsersLimit,
              remainingVisits: clientForm.totalVisits, 
              remainingTickets: clientForm.totalTickets, 
              activeUsers: 0, 
              status: 'active', 
              contractStartDate: '', 
              contractDurationMonths: 12,
              branches: clientForm.branches,
              paymentConfig: clientForm.paymentConfig,
              netPrice: clientForm.netPrice, // FIX: Added
              discountPercentage: clientForm.discountPercentage // FIX: Added
            });
            if (success) {
                showNotification(`تم اضافة العميل ${clientForm.company} بنجاح`);
            }
      } else { 
          if(clientForm.id) {
              await updateClient(clientForm.id, { 
                  name: clientForm.name, 
                  companyName: clientForm.company, 
                  email: clientForm.email, 
                  phone: clientForm.phone, 
                  packageId: clientForm.packageId, 
                  logo: clientForm.logo || undefined, 
                  accessCode: clientForm.accessCode,
                  contractStartDate: clientForm.contractStartDate, 
                  contractDurationMonths: clientForm.contractDurationMonths, 
                  totalVisits: clientForm.totalVisits, 
                  totalTickets: clientForm.totalTickets, 
                  totalUsersLimit: clientForm.totalUsersLimit,
                  branches: clientForm.branches,
                  paymentConfig: clientForm.paymentConfig,
                  netPrice: clientForm.netPrice, // FIX: Added
                  discountPercentage: clientForm.discountPercentage // FIX: Added
              }); 
              showNotification("تم تعديل بيانات العميل بنجاح ✅");
          }
      } 
      setIsClientModalOpen(false); 
  };

  const openAddModal = () => {
      setIsEditing(false);
      const defaultPackageId = 'business-core';
      const defaultPackage = PACKAGES.find(p => p.id === defaultPackageId);
      const tempRef = `CZ-${Date.now().toString().slice(-4)}-NEW`;
      setClientForm({
          id: '', name: '', company: '', email: '', phone: '',
          packageId: defaultPackageId,
          accessCode: Math.floor(100000 + Math.random() * 900000).toString(),
          referenceNumber: tempRef,
          logo: null,
          totalUsersLimit: defaultPackage?.limits?.users || 0,
          totalVisits: defaultPackage?.limits?.visits || 0,
          totalTickets: defaultPackage?.limits?.tickets || 0,
          contractStartDate: '',
          contractDurationMonths: 12,
          branches: [],
          paymentConfig: {},
          netPrice: undefined, // Reset
          discountPercentage: 0 // Reset
      });
      setIsClientModalOpen(true);
  };
  
  const openEditModal = (c: ClientProfile) => { 
      setIsEditing(true); 
      setClientForm({ 
          id: c.id, 
          name: c.name, 
          company: c.companyName, 
          email: c.email, 
          phone: c.phone, 
          packageId: c.packageId || 'business-core', 
          accessCode: c.accessCode, 
          referenceNumber: c.referenceNumber || '',
          logo: c.logo || null, 
          totalUsersLimit: c.totalUsersLimit, 
          totalVisits: c.totalVisits, 
          totalTickets: c.totalTickets, 
          contractStartDate: c.contractStartDate || '', 
          contractDurationMonths: c.contractDurationMonths || 12,
          branches: c.branches || [],
          paymentConfig: c.paymentConfig || {},
          netPrice: c.netPrice, // Load from profile
          discountPercentage: c.discountPercentage || 0 // Load from profile
      }); 
      setIsClientModalOpen(true); 
  };
  
  const handleSendReply = (e: React.FormEvent) => { e.preventDefault(); if(!selectedTicket || !replyText) return; addReply(selectedTicket.id, {id:`m${Date.now()}`, sender:'admin', senderName:'Admin', text:replyText, timestamp:new Date().toISOString()}); setReplyText(''); };

  const getHeaderTitle = () => {
      switch (activeTab) {
          case 'dashboard': return 'لوحة التحكم';
          case 'notifications': return 'مركز الإجراءات الموحد'; 
          case 'calendar': return 'تقويم المواعيد';
          case 'tasks': return 'إدارة المهام';
          case 'clients': return 'قاعدة العملاء';
          case 'technicians': return 'فريق العمل الفني';
          case 'support': return 'تذاكر الدعم عن بعد'; // Title for new view
          case 'consultations': return 'الاستشارات التقنية';
          case 'orders': return 'الطلبات والإضافات';
          case 'billing': return 'الفوترة والعقود';
          case 'financials': return 'المركز المالي';
          case 'reports': return 'إنشاء التقارير';
          case 'settings': return 'إعدادات النظام';
          default: return 'لوحة التحكم';
      }
  };

  const handleNavigateToBilling = (clientId: string) => {
      setSelectedClientForBilling(clientId);
      setSelectedClientForDetail(null); 
      setActiveTab('billing');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
        case 'dashboard': return <DashboardTab setActiveTab={setActiveTab} />;
        case 'tasks': return <TasksManager />;
        case 'clients': return <ClientsTab openAddModal={openAddModal} openEditModal={openEditModal} setSelectedClientForDetail={setSelectedClientForDetail} />;
        case 'technicians': return <TechniciansManager />;
        case 'calendar': return <CtrlZCalendar bookings={bookings} clients={clients} dir={dir} refresh={refreshBookings} addTicket={addTicket} showNotification={showNotification} onOpenBookingAction={handleOpenBookingAction} />;
        case 'support': return <RemoteSupportHub />; // Switched to new Hub
        case 'consultations': return <ConsultationsHub />;
        case 'orders': return <OrdersTab />;
        case 'billing': return <BillingManager t={t} preSelectedClientId={selectedClientForBilling} />;
        case 'financials': return <FinancialHub />;
        case 'reports': return <ReportGenerator clients={clients} t={t} visitTasks={visitTasks} />;
        case 'settings': return <SettingsTab />;
        case 'notifications': return <NotificationsTab onNavigate={(tab) => setActiveTab(tab)} onOpenBookingAction={handleOpenBookingAction} />;
        default: return <DashboardTab setActiveTab={setActiveTab} />;
    }
  }

  const filteredSidebarProps = {
      activeTab: activeTab as any,
      setActiveTab,
      pendingTicketsCount: hasPermission('support') ? pendingRemoteSupportCount : 0, // Pass specific count (Sent only)
      pendingConsultationsCount: hasPermission('consultations') ? consultationTickets.length : 0,
      pendingBookingsCount: hasPermission('calendar') ? pendingBookingsCount : 0,
      pendingOrdersCount: hasPermission('orders') ? pendingOrdersCount : 0,
      pendingNotificationsCount: hasPermission('notifications') ? pendingNotificationsCount : 0,
      pendingTasksCount: hasPermission('tasks') ? clientRequestedTasksCount : 0,
      logout,
      permissions: user?.permissions
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex font-sans" dir="rtl">
      <FloatingTechBackground />
      <AnimatePresence>
          {notification && (
              <motion.div
                  initial={{ opacity: 0, y: -50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl bg-green-500 text-white font-bold"
              >
                  {notification}
              </motion.div>
          )}
      </AnimatePresence>
      <AdminSidebar {...filteredSidebarProps} />
      <main className="flex-1 mr-20 lg:mr-64 p-6 lg:p-10 relative z-10 transition-all duration-300 text-right">
          <header className="flex justify-between items-start mb-10 bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] border border-white/50 shadow-sm sticky top-4 z-30">
              <div className="px-2">
                  <h1 className="text-3xl font-bold text-[#0c2444]">
                    {getHeaderTitle()}
                  </h1>
                  <p className="text-gray-500 text-sm font-medium mt-1 font-bold text-[#0071e3]">
                    Admin Ctrl Z
                  </p>
              </div>
              
              <div className="flex items-center gap-4 px-2">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#0c2444] text-white rounded-xl shadow-md border border-gray-200">
                      <Cpu size={24} />
                  </div>

                  <button onClick={logout} className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-sm border border-gray-100 transition-colors" title="تسجيل الخروج">
                      <LogOut size={20} />
                  </button>
              </div>
          </header>
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    {renderActiveTab()}
                </motion.div>
            </AnimatePresence>
          </div>
      </main>
      <AnimatePresence>
        {selectedClientForDetail && (
            <ClientDetailModal 
                client={selectedClientForDetail} 
                onClose={() => setSelectedClientForDetail(null)} 
                bookings={bookings} 
                tickets={tickets} 
                onUpdateClient={updateClient} 
                showNotification={showNotification} 
                onNavigateToBilling={handleNavigateToBilling}
            />
        )}
      </AnimatePresence>
      <AnimatePresence><ClientFormModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} isEditing={isEditing} clientForm={clientForm} setClientForm={setClientForm} handleClientSubmit={handleClientSubmit} handleLogoFormUpload={handleLogoFormUpload} handlePackageChange={handlePackageChange} t={t} /></AnimatePresence>
      {selectedTicket && <TicketDetailModal selectedTicket={selectedTicket} setSelectedTicket={setSelectedTicket} replyText={replyText} setReplyText={setReplyText} handleSendReply={handleSendReply} />}
      
      {/* Universal Booking Action Modal */}
      <AnimatePresence>
          {isBookingActionModalOpen && selectedBookingForAction && (
              <BookingActionModal 
                  isOpen={isBookingActionModalOpen}
                  onClose={() => setIsBookingActionModalOpen(false)}
                  booking={selectedBookingForAction}
                  onSuccess={showNotification}
              />
          )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
