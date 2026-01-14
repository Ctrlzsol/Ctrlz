
import React, { useState, useMemo } from 'react';
import { Trash2, ShoppingCart, UserPlus, CalendarPlus, Shield, Monitor, Ticket, Plus, Save, X, CheckCircle, Search, Loader2, User, ChevronDown, ChevronUp, Building2, Phone, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientProfile, Order } from '../../../core/types';
import { useTicket } from '../../../modules/tickets/context';
import { useClientData } from '../../../modules/clients/context';
import { useInvoice } from '../../../modules/billing/context';
import { supabase } from '../../../lib/supabase';

const OrdersTab: React.FC = () => {
    const { orders, updateOrderStatus, deleteOrder } = useTicket();
    const { clients, updateClient } = useClientData();
    const { addInvoice } = useInvoice();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'new' | 'processed'>('all');
    const [expandedClientIds, setExpandedClientIds] = useState<Set<string>>(new Set());

    // License Approval State
    const [approvingLicenseOrder, setApprovingLicenseOrder] = useState<Order | null>(null);
    const [licensePrice, setLicensePrice] = useState('');
    const [licenseDescription, setLicenseDescription] = useState('');
    const [isProcessingLicense, setIsProcessingLicense] = useState(false);

    // Grouping Logic
    const groupedOrders = useMemo(() => {
        // 1. Filter
        const filtered = orders.filter(o => {
            const matchesSearch = o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  o.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesStatus = true;
            if (filterType === 'new') matchesStatus = o.status === 'pending';
            if (filterType === 'processed') matchesStatus = o.status !== 'pending';

            return matchesSearch && matchesStatus;
        }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 2. Group by Client ID
        const groups: Record<string, Order[]> = {};
        filtered.forEach(order => {
            const clientId = order.clientId || 'unknown';
            if (!groups[clientId]) groups[clientId] = [];
            groups[clientId].push(order);
        });

        return groups;
    }, [orders, searchTerm, filterType]);

    const toggleExpandClient = (clientId: string) => {
        setExpandedClientIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(clientId)) newSet.delete(clientId);
            else newSet.add(clientId);
            return newSet;
        });
    };

    const getAutoPrice = (type: string, clientPackageId: string): number => {
        const pkg = clientPackageId; 
        switch (type) {
            case 'emergency_visit':
                if (pkg === 'managed-it') return 0;
                if (pkg === 'business-plus') return 12;
                return 18;
            case 'visit': return 25;
            case 'user':
                if (pkg === 'managed-it') return 4;
                if (pkg === 'business-plus') return 5;
                return 6;
            case 'ticket': return 10;
            default: return 0;
        }
    };

    const getServiceDescription = (type: string) => {
        switch(type) {
            case 'user': return 'إضافة مستخدم جديد';
            case 'visit': return 'زيارة ميدانية إضافية';
            case 'emergency_visit': return 'زيارة طارئة';
            case 'ticket': return 'شراء تذكرة عن بعد'; // UPDATED LABEL
            default: return 'خدمة إضافية';
        }
    };

    const notifyOrderAccepted = async (clientId: string, clientName: string, orderDetails: string, clientPhone?: string) => {
        await supabase.from('notifications').insert([{
            client_id: clientId,
            client_name: clientName,
            subject: 'تم قبول طلبك الإضافي',
            description: `تمت الموافقة على الطلب: ${orderDetails}، وتم إصدار الفاتورة في حسابك.`,
            is_deleted: false
        }]);

        // WhatsApp Logic: Use Client Phone as Target
        const msg = `مرحباً ${clientName}،\nتمت الموافقة على طلبكم (${orderDetails}).\nتم إصدار الفاتورة في حسابكم.`;
        if (confirm("هل تود إرسال تنبيه واتساب للعميل؟")) {
             // FALLBACK: If client phone missing, use system number (from previous context if available, otherwise blank)
             const finalPhone = clientPhone || ""; 
             window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        }
    };

    const handleProcessOrder = async (orderId: string, status: 'approved' | 'rejected') => {
        if (status === 'rejected') {
            await updateOrderStatus(orderId, 'rejected');
            return;
        }

        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        if (order.type === 'license') {
            setApprovingLicenseOrder(order);
            setLicenseDescription(order.details || 'رخصة برنامج');
            setLicensePrice('');
            return;
        }

        const client = clients.find(c => c.id === order.clientId);
        if (client) {
            const unitPrice = getAutoPrice(order.type, client.packageId);
            const desc = getServiceDescription(order.type);
            
            // Extract Quantity from Details String (Format: "العدد المطلوب: X" or "العدد: X")
            // Updated regex to catch both forms to be safe
            const qtyMatch = order.details.match(/(?:العدد|العدد المطلوب):\s*(\d+)/);
            const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

            // Generate invoice with Quantity
            await generateInvoice(client, unitPrice, `${desc} - (طلب: ${order.id.slice(0,4)})`, quantity);
            
            await updateOrderStatus(orderId, 'approved');
            await notifyOrderAccepted(client.id, client.companyName, desc, client.phone);
            alert(`تم قبول طلب العميل ${client.companyName} بنجاح وتم إنشاء الفاتورة بقيمة ${unitPrice * quantity} JOD`);
        } else {
            alert('تعذر العثور على العميل لإنشاء الفاتورة.');
        }
    };

    const confirmLicenseApproval = async () => {
        if (!approvingLicenseOrder || !licensePrice || !licenseDescription) {
            alert('يرجى إدخال السعر والوصف.');
            return;
        }
        
        setIsProcessingLicense(true);
        const client = clients.find(c => c.id === approvingLicenseOrder.clientId);
        
        if (client) {
            const priceVal = parseFloat(licensePrice);
            // License usually Qty 1 unless specified in description manual parsing, defaulting to 1 here for manual entry
            const qtyMatch = approvingLicenseOrder.details.match(/(?:العدد|العدد المطلوب):\s*(\d+)/);
            const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

            await generateInvoice(client, priceVal, licenseDescription, quantity);
            await updateOrderStatus(approvingLicenseOrder.id, 'approved');
            await notifyOrderAccepted(client.id, client.companyName, licenseDescription, client.phone);
            alert(`تم قبول طلب العميل ${client.companyName} بنجاح وتم إنشاء الفاتورة`);
            setApprovingLicenseOrder(null);
        } else {
            alert('خطأ: العميل غير موجود.');
        }
        setIsProcessingLicense(false);
    };

    const generateInvoice = async (client: ClientProfile, unitPrice: number, description: string, quantity: number = 1) => {
        const totalAmount = unitPrice * quantity;
        const newInv = {
            clientId: client.id,
            clientName: client.companyName,
            invoiceNumber: `INV-AUTO-${Date.now().toString().slice(-5)}`,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0], 
            status: 'pending', 
            totalAmount: totalAmount,
            currency: 'JOD',
            billingPeriod: 'One Time',
            items: [{ 
                description: description, 
                amount: unitPrice, 
                quantity: quantity, 
                type: 'addon_one_time' 
            }],
            subTotal: totalAmount,
            discountApplied: 0,
            isPublished: true
        };
        await addInvoice(newInv as any);
    };

    // Modern Visual Configuration
    const getOrderVisuals = (type: string) => {
        switch(type) {
            case 'user': return { 
                icon: UserPlus, 
                label: 'مستخدم إضافي', 
                bg: 'bg-blue-600', 
                text: 'text-white', 
                border: 'border-blue-200', 
                gradient: 'from-blue-500 to-cyan-500' 
            };
            case 'visit': return { 
                icon: CalendarPlus, 
                label: 'زيارة إضافية', 
                bg: 'bg-purple-600', 
                text: 'text-white', 
                border: 'border-purple-200', 
                gradient: 'from-purple-500 to-indigo-500' 
            };
            case 'emergency_visit': return { 
                icon: Shield, 
                label: 'زيارة طارئة', 
                bg: 'bg-red-600', 
                text: 'text-white', 
                border: 'border-red-200', 
                gradient: 'from-red-500 to-rose-600' 
            };
            case 'ticket': return { 
                icon: Ticket, 
                label: 'باقة تذاكر', 
                bg: 'bg-orange-500', 
                text: 'text-white', 
                border: 'border-orange-200', 
                gradient: 'from-orange-400 to-amber-500' 
            };
            case 'license': return { 
                icon: Monitor, 
                label: 'رخصة برنامج', 
                bg: 'bg-emerald-600', 
                text: 'text-white', 
                border: 'border-emerald-200', 
                gradient: 'from-emerald-500 to-teal-500' 
            };
            default: return { 
                icon: ShoppingCart, 
                label: 'طلب عام', 
                bg: 'bg-gray-700', 
                text: 'text-white', 
                border: 'border-gray-200', 
                gradient: 'from-gray-600 to-slate-700' 
            };
        }
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
            {/* Header Controls */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black text-[#0c2444] mb-1 flex items-center gap-2">
                        <ShoppingCart size={24} className="text-[#0071e3]"/> الطلبات والإضافات
                    </h3>
                    <p className="text-gray-500 text-sm font-medium">متابعة طلبات العملاء وإدارة التراخيص</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                        <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pr-10 pl-4 outline-none font-bold text-[#0c2444] text-sm"/>
                    </div>
                    <div className="flex bg-[#f8fafc] p-1 rounded-xl border border-gray-200">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-[#0c2444]' : 'text-gray-500'}`}>الكل</button>
                        <button onClick={() => setFilterType('new')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'new' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>جديد</button>
                        <button onClick={() => setFilterType('processed')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'processed' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>مكتمل</button>
                    </div>
                </div>
            </div>

            {/* Orders Grouped by Client */}
            <div className="space-y-6">
                {Object.keys(groupedOrders).length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <ShoppingCart size={32} className="mx-auto mb-3 opacity-20"/>
                        <p className="font-bold">لا توجد طلبات مطابقة</p>
                    </div>
                ) : (
                    Object.entries(groupedOrders).map(([clientId, clientOrders]) => {
                        const ordersList = clientOrders as Order[];
                        const client = clients.find(c => c.id === clientId);
                        const clientName = client?.companyName || ordersList[0]?.clientName || 'Unknown Client';
                        const pendingCount = ordersList.filter(o => o.status === 'pending').length;
                        const isExpanded = expandedClientIds.has(clientId) || pendingCount > 0;

                        return (
                            <div key={clientId} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                                {/* Client Header */}
                                <div 
                                    onClick={() => toggleExpandClient(clientId)}
                                    className="p-6 flex justify-between items-center bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden">
                                            {client?.logo ? <img src={client.logo} className="w-full h-full object-contain p-2"/> : <Building2 className="text-gray-400"/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#0c2444] text-lg">{clientName}</h4>
                                            {client?.phone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12}/> <span dir="ltr">{client.phone}</span></div>}
                                        </div>
                                        {pendingCount > 0 && <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-md shadow-rose-500/30">{pendingCount} طلبات جديدة</span>}
                                    </div>
                                    <div className="text-gray-400">
                                        {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                    </div>
                                </div>

                                {/* Orders List for Client - NEW CREATIVE DESIGN */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-100"
                                        >
                                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {ordersList.map(order => {
                                                    const visual = getOrderVisuals(order.type);
                                                    const Icon = visual.icon;
                                                    
                                                    return (
                                                        <motion.div 
                                                            key={order.id} 
                                                            whileHover={{ y: -3 }}
                                                            className="relative bg-white border border-gray-100 rounded-[1.8rem] p-6 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
                                                        >
                                                            {/* Background Glow */}
                                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${visual.gradient} opacity-[0.08] rounded-bl-[4rem] pointer-events-none transition-transform group-hover:scale-110`}></div>
                                                            
                                                            <div className="flex items-start gap-5 relative z-10">
                                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                                                    <Icon size={26} />
                                                                </div>
                                                                
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <h5 className="font-bold text-[#0c2444] text-lg">{visual.label}</h5>
                                                                        {order.status === 'pending' ? (
                                                                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold flex items-center gap-1 border border-orange-200">
                                                                                <Zap size={10}/> جديد
                                                                            </span>
                                                                        ) : order.status === 'approved' ? (
                                                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold border border-green-200">
                                                                                مقبول
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-md font-bold border border-red-200">
                                                                                مرفوض
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                                                                        <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">{order.details}</p>
                                                                    </div>

                                                                    <div className="flex items-center justify-between mt-auto">
                                                                        <p className="text-[10px] text-gray-400 font-mono">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                                                                        
                                                                        {/* Action Buttons for Pending */}
                                                                        {order.status === 'pending' && (
                                                                            <div className="flex gap-2">
                                                                                <button 
                                                                                    onClick={(e) => { e.stopPropagation(); handleProcessOrder(order.id, 'approved'); }} 
                                                                                    className="bg-[#0c2444] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#0a1f3b] flex items-center gap-1 shadow-lg shadow-blue-900/10 transition-all active:scale-95"
                                                                                >
                                                                                    <CheckCircle size={14}/> قبول وإصدار فاتورة
                                                                                </button>
                                                                                <button 
                                                                                    onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }} 
                                                                                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                                                                                >
                                                                                    <Trash2 size={16}/>
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* License Approval Modal */}
            <AnimatePresence>
                {approvingLicenseOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative">
                            <button onClick={() => setApprovingLicenseOrder(null)} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                            <h3 className="text-xl font-bold text-[#0c2444] mb-2">تحديد سعر الرخصة</h3>
                            <p className="text-sm text-gray-500 mb-6">يرجى إدخال تفاصيل الفاتورة لهذا الطلب</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">وصف البرنامج / الخدمة</label>
                                    <input value={licenseDescription} onChange={e => setLicenseDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none font-bold text-[#0c2444]"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">سعر الوحدة (JOD)</label>
                                    <input type="number" step="0.01" value={licensePrice} onChange={e => setLicensePrice(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none font-bold text-[#0c2444]" placeholder="0.00"/>
                                </div>
                                <button 
                                    onClick={confirmLicenseApproval} 
                                    disabled={isProcessingLicense}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 mt-4"
                                >
                                    {isProcessingLicense ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>} تأكيد وإنشاء الفاتورة
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
export default OrdersTab;
