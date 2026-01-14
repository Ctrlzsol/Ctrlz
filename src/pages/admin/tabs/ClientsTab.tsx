
import React, { useState } from 'react';
import { Search, Plus, Edit2, Calendar as CalendarIcon, Ticket, ChevronLeft, Building2, Clock, MapPin, Phone, Mail, ArrowUpRight, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../../core/contexts/LanguageContext';
import { useClientData } from '../../../modules/clients/context';
import { useTicket } from '../../../modules/tickets/context';
import { useBooking } from '../../../modules/bookings/context';
import { PACKAGES } from '../../../core/constants';
import { ClientProfile } from '../../../core/types';

interface ClientsTabProps {
    openAddModal: () => void;
    openEditModal: (c: ClientProfile) => void;
    setSelectedClientForDetail: (c: ClientProfile) => void;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ openAddModal, openEditModal, setSelectedClientForDetail }) => {
    const { clients } = useClientData();
    const { tickets } = useTicket();
    const { bookings } = useBooking();
    const { t } = useLanguage();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all'|'active'|'expired'>('all');

    // Helper to calculate expiration
    const checkExpiration = (startDateStr?: string, durationMonths?: number) => {
        if (!startDateStr || !durationMonths) return { isExpired: false, daysLeft: 0, progress: 0 };
        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + durationMonths);
        const today = new Date();
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = today.getTime() - startDate.getTime();
        
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        
        return { isExpired: daysLeft <= 0, daysLeft, progress };
    };

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const { isExpired } = checkExpiration(c.contractStartDate, c.contractDurationMonths);
        
        let matchesStatus = true;
        if (filterStatus === 'active') matchesStatus = c.status === 'active' && !isExpired;
        if (filterStatus === 'expired') matchesStatus = isExpired;

        return matchesSearch && matchesStatus;
    }).sort((a,b) => a.companyName.localeCompare(b.companyName));

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm sticky top-4 z-20">
                <div className="relative group w-full md:w-96">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071e3] transition-colors" size={20} />
                    <input type="text" placeholder="بحث عن عميل (الاسم، البريد)..." className="w-full bg-[#f8fafc] border-transparent rounded-xl py-3 pr-12 pl-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 font-bold text-[#0c2444] transition-all" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex bg-[#f8fafc] p-1 rounded-xl w-full md:w-auto">
                        <button onClick={() => setFilterStatus('all')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-white text-[#0c2444] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الكل</button>
                        <button onClick={() => setFilterStatus('active')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'active' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>النشطة</button>
                        <button onClick={() => setFilterStatus('expired')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'expired' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>المنتهية</button>
                    </div>
                    <button onClick={openAddModal} className="bg-[#0c2444] text-white p-3 rounded-xl hover:bg-[#0a1f3b] transition-all shadow-lg shadow-blue-900/10 active:scale-95 shrink-0 flex items-center gap-2">
                        <Plus size={20}/> <span className="hidden md:inline font-bold text-sm">عميل جديد</span>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClients.map(client => {
                    const { isExpired, daysLeft, progress } = checkExpiration(client.contractStartDate, client.contractDurationMonths);
                    const clientRealBookings = bookings.filter(b => b.clientId === client.id);
                    const visitsDone = clientRealBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
                    const clientRealTickets = tickets.filter(t => t.clientId === client.id && !t.subject.startsWith('طلب') && !t.subject.startsWith('استشارة')).length;
                    const pkgName = PACKAGES.find(p => p.id === client.packageId)?.name || client.packageId;
                    const translatedPkgName = t.packages.items[pkgName]?.name || pkgName;

                    return (
                        <motion.div 
                            key={client.id} 
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            {/* Blue Header Section */}
                            <div className="bg-[#0c2444] p-6 pb-8 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-[40px] -mr-10 -mt-10"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-md">
                                            {client.logo ? 
                                                <img src={client.logo} className="w-full h-full object-contain" alt="Logo"/> : 
                                                <Building2 className="text-gray-300" size={28}/>
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight mb-1 line-clamp-1">{client.companyName}</h3>
                                            <p className="text-xs text-blue-200 mb-2">{client.name}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-md border border-white/10 font-bold backdrop-blur-sm">
                                                    {translatedPkgName}
                                                </span>
                                                {client.status === 'suspended' && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-bold">معلق</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e)=>{e.stopPropagation();openEditModal(client)}} 
                                            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                                            title="تعديل"
                                        >
                                            <Edit2 size={14}/>
                                        </button>
                                        <button 
                                            onClick={() => setSelectedClientForDetail(client)}
                                            className="p-2 rounded-xl bg-white text-[#0c2444] hover:bg-blue-50 transition-colors shadow-sm"
                                            title="التفاصيل الكاملة"
                                        >
                                            <ArrowUpRight size={14}/>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* White Body Section */}
                            <div className="p-6 pt-0 flex flex-col flex-1 relative -mt-4">
                                <div className="bg-white rounded-t-2xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col">
                                    
                                    {/* Contract Bar */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-gray-400">
                                            <span>حالة العقد</span>
                                            <span className={isExpired ? 'text-red-500' : 'text-green-600'}>
                                                {isExpired ? 'منتهي' : `متبقي ${daysLeft} يوم`}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={`h-full rounded-full ${isExpired ? 'bg-red-500' : 'bg-[#0c2444]'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-[#f8fafc] p-3 rounded-xl border border-gray-100 text-center hover:bg-blue-50 transition-colors">
                                            <div className="flex justify-center text-blue-500 mb-1"><MapPin size={16}/></div>
                                            <div className="text-lg font-black text-[#0c2444]">
                                                {visitsDone} <span className="text-[10px] text-gray-400 font-bold">/ {client.totalVisits}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">زيارات</p>
                                        </div>
                                        <div className="bg-[#f8fafc] p-3 rounded-xl border border-gray-100 text-center hover:bg-purple-50 transition-colors">
                                            <div className="flex justify-center text-purple-500 mb-1"><Ticket size={16}/></div>
                                            <div className="text-lg font-black text-[#0c2444]">
                                                {clientRealTickets} <span className="text-[10px] text-gray-400 font-bold">/ {client.totalTickets}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">تذاكر</p>
                                        </div>
                                    </div>

                                    {/* ENHANCED INTERACTIVE FOOTER */}
                                    <div className="mt-auto flex justify-between items-center gap-3 pt-3 border-t border-gray-50">
                                        <div className="flex gap-2">
                                            <a 
                                                href={`mailto:${client.email}`} 
                                                className="group flex items-center justify-center p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 hover:border-blue-200 transition-all"
                                                title="إرسال بريد إلكتروني"
                                            >
                                                <Mail size={16} className="group-hover:scale-110 transition-transform"/>
                                            </a>
                                            <a 
                                                href={`tel:${client.phone}`} 
                                                className="group flex items-center justify-center p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600 border border-gray-100 hover:border-green-200 transition-all"
                                                title="اتصال هاتفي"
                                            >
                                                <Phone size={16} className="group-hover:scale-110 transition-transform"/>
                                            </a>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                            <div className={`w-2 h-2 rounded-full ${client.activeUsers > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                            <span className="text-[10px] font-bold text-gray-600">
                                                {client.activeUsers}/{client.totalUsersLimit} مستخدم
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default ClientsTab;
