
import React from 'react';
import { Users, Headphones, ShoppingCart, CreditCard, FileText, Settings, ChevronRight, Calendar, Bell, Briefcase, Wrench, ClipboardList, TrendingUp, MessageSquare, Zap } from 'lucide-react';
import Logo from '../../../ui/components/Logo';
import { AnimatePresence, motion } from 'framer-motion';

interface AdminSidebarProps {
    activeTab: 'dashboard' | 'tasks' | 'clients' | 'support' | 'consultations' | 'orders' | 'billing' | 'reports' | 'settings' | 'calendar' | 'notifications' | 'financials' | 'technicians';
    setActiveTab: (tab: any) => void;
    pendingTicketsCount: number;
    pendingConsultationsCount: number;
    pendingBookingsCount: number;
    pendingOrdersCount: number;
    pendingNotificationsCount: number;
    pendingTasksCount: number;
    logout: () => void;
    permissions?: string[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, pendingTicketsCount, pendingConsultationsCount, pendingBookingsCount, pendingOrdersCount, pendingNotificationsCount, pendingTasksCount, permissions }) => {
    
    // Default to full access if permissions is not provided (backward compatibility)
    const hasPermission = (id: string) => {
        if (!permissions || permissions.includes('*')) return true;
        return permissions.includes(id);
    };

    // Calculate Total Action Items for the Action Center Badge (Aggregated from parent)
    const totalActions = pendingNotificationsCount;

    const navItems = [
        { id: 'dashboard', icon: TrendingUp, label: 'لوحة التحكم' },
        { id: 'notifications', icon: Zap, label: 'مركز الإجراءات', badge: totalActions > 0 ? totalActions : null },
        { id: 'calendar', icon: Calendar, label: 'تقويم Ctrl Z', badge: pendingBookingsCount > 0 ? pendingBookingsCount : null },
        { id: 'tasks', icon: ClipboardList, label: 'المهام', badge: pendingTasksCount > 0 ? pendingTasksCount : null },
        { id: 'clients', icon: Users, label: 'العملاء' },
        { id: 'technicians', icon: Wrench, label: 'الفنيين' },
        { id: 'support', icon: Headphones, label: 'تذاكر الدعم عن بعد', badge: pendingTicketsCount > 0 ? pendingTicketsCount : null },
        { id: 'consultations', icon: MessageSquare, label: 'الاستشارات التقنية', badge: pendingConsultationsCount > 0 ? pendingConsultationsCount : null },
        { id: 'orders', icon: ShoppingCart, label: 'طلبات الإضافة', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
        { id: 'billing', icon: CreditCard, label: 'الفوترة' },
        { id: 'financials', icon: Briefcase, label: 'المركز المالي' },
        { id: 'reports', icon: FileText, label: 'التقارير' },
        { id: 'settings', icon: Settings, label: 'الإعدادات' },
    ];
    
    // Filter items based on permissions
    const filteredNavItems = navItems.filter(item => hasPermission(item.id));

    return (
      <aside className={`w-20 lg:w-72 bg-white/90 backdrop-blur-xl border-gray-200 z-20 flex flex-col fixed inset-y-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-l left-auto right-0 transition-all duration-300`}>
         {/* Logo Area */}
         <div className="h-28 flex items-center justify-center border-b border-gray-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>
            <div className="h-14 w-full px-6 flex justify-center items-center transform transition-transform hover:scale-105 duration-300">
                <Logo className="h-full w-auto object-contain translate-x-2" />
            </div>
         </div>

         {/* Navigation Items */}
         <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto custom-scrollbar">
            {filteredNavItems.map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id as any)} 
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all duration-300 group relative overflow-hidden ${
                        activeTab === item.id 
                        ? 'bg-[#0c2444] text-white shadow-xl shadow-blue-900/15 scale-[1.02] ring-1 ring-black/5' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#0c2444]'
                    }`}
                >
                    {/* Active Background Glow Effect */}
                    {activeTab === item.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20 pointer-events-none"></div>
                    )}

                    <item.icon size={24} className={`ml-2 shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={activeTab === item.id ? 2 : 1.5} />
                    
                    <span className={`hidden lg:block text-[15px] truncate tracking-wide transition-all ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>
                        {item.label}
                    </span>
                    
                    {/* Creative Modern Badge */}
                    <AnimatePresence>
                        {item.badge && item.badge > 0 && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute top-1/2 -translate-y-1/2 left-4 flex items-center justify-center"
                            >
                                <div className="relative flex items-center justify-center">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex h-6 min-w-[24px] px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 border border-white/20 text-white text-[10px] font-black items-center justify-center shadow-lg shadow-rose-500/30">
                                    {item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Active Indicator Chevron */}
                    {activeTab === item.id && <ChevronRight size={18} className="hidden lg:block opacity-50 mr-auto rotate-180" />}
                </button>
            ))}
         </nav>

         {/* Bottom User Profile / Logout Area (Optional Visual) */}
         <div className="p-4 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                    A
                </div>
                <div className="hidden lg:block overflow-hidden">
                    <p className="text-xs font-bold text-[#0c2444] truncate">Admin User</p>
                    <p className="text-[10px] text-gray-400 truncate">System Manager</p>
                </div>
            </div>
         </div>
      </aside>
    );
};
export default AdminSidebar;
