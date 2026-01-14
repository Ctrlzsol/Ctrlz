
import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, CalendarPlus, Ticket, Shield, Monitor, CheckCircle, Loader2, ArrowLeft, Zap, ShoppingBag, Key, Clock, XCircle, Check, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientProfile } from '../../../core/types';
import { useTicket } from '../../../modules/tickets/context';
import { supabase } from '../../../lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

// Static Configuration for UI elements (Icons, Colors, Descriptions)
const REQUEST_CONFIG = [
    { 
        id: 'user', 
        label: 'مستخدم إضافي', 
        icon: UserPlus, 
        gradient: 'from-blue-500 to-blue-600', 
        shadow: 'shadow-blue-500/30', 
        desc: 'خدمة مستخدم اضافي داخل الشركة او زيادة عدد متلقي الخدمة.', 
        unit: ' / شهر',
        placeholder: 'مثال: اسم الموظف الجديد، القسم، ورقم هاتفه...'
    },
    { 
        id: 'visit', 
        label: 'زيارة ميدانية إضافية', 
        icon: CalendarPlus, 
        gradient: 'from-purple-500 to-purple-600', 
        shadow: 'shadow-purple-500/30', 
        desc: 'طلب زيارة صيانة تقنية مجدولة خلال الشهر التعاقدي.', 
        unit: '',
        placeholder: 'مثال: نحتاج زيارة لفحص الشبكة في الطابق الثاني...'
    },
    { 
        id: 'emergency_visit', 
        label: 'زيارة طارئة', 
        icon: Shield, 
        gradient: 'from-red-500 to-red-600', 
        shadow: 'shadow-red-500/30', 
        desc: 'استجابة فورية لعطل حرج.',
        unit: '',
        placeholder: 'مثال: السيرفر متوقف تماماً عن العمل، نحتاج تدخل فوري...'
    },
    { 
        id: 'ticket', 
        label: 'شراء تذكرة عن بعد', 
        icon: Ticket, 
        gradient: 'from-orange-500 to-orange-600', 
        shadow: 'shadow-orange-500/30', 
        desc: 'شراء تذكرة دعم فني إضافية لمرة واحدة.',
        unit: '',
        placeholder: 'مثال: نحتاج دعم لحل مشكلة في البريد الإلكتروني لأحد الموظفين...'
    },
    { 
        id: 'license', 
        label: 'رخصة برنامج', 
        icon: Monitor, 
        gradient: 'from-emerald-500 to-emerald-600', 
        shadow: 'shadow-emerald-500/30', 
        desc: 'Microsoft 365, Antivirus, Adobe, etc.',
        unit: '',
        placeholder: 'مثال: نحتاج تجديد رخصة مضاد الفيروسات لـ 5 أجهزة...'
    },
];

const RequestsView = ({ client }: { client: ClientProfile }) => {
    const { createOrder, orders } = useTicket(); 
    const [activeRequest, setActiveRequest] = useState<any | null>(null);
    const [details, setDetails] = useState('');
    const [quantity, setQuantity] = useState(1); // Added Quantity State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminPhone, setAdminPhone] = useState<string>('');
    
    const location = useLocation();
    const navigate = useNavigate();

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

    const licenses = client.licenseKeys || {};
    const hasLicenses = Object.keys(licenses).length > 0;

    const clientHistory = useMemo(() => {
        return orders
            .filter(o => o.clientId === client.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [orders, client.id]);

    const requestTypes = useMemo(() => {
        const pkg = client.packageId; 

        return REQUEST_CONFIG.map(item => {
            let priceDisplay = '';

            switch (item.id) {
                case 'emergency_visit':
                    if (pkg === 'managed-it') priceDisplay = 'مشمولة بالباقة';
                    else if (pkg === 'business-plus') priceDisplay = '12 JOD';
                    else priceDisplay = '18 JOD'; 
                    break;

                case 'visit': 
                    priceDisplay = '25 JOD';
                    break;

                case 'user': 
                    if (pkg === 'managed-it') priceDisplay = '4 JOD';
                    else if (pkg === 'business-plus') priceDisplay = '5 JOD';
                    else priceDisplay = '6 JOD'; 
                    break;

                case 'ticket': 
                    priceDisplay = '10 JOD';
                    break;

                case 'license':
                    priceDisplay = 'حسب الرخصة';
                    break;
                
                default:
                    priceDisplay = 'غير محدد';
            }

            return {
                ...item,
                price: priceDisplay + (item.unit && priceDisplay !== 'مشمولة بالباقة' && priceDisplay !== 'حسب الرخصة' ? item.unit : '')
            };
        });
    }, [client.packageId]);

    // Handle auto-selection from navigation state AND clear it to prevent sticking
    useEffect(() => {
        if (location.state?.preSelectedRequest) {
            const reqId = location.state.preSelectedRequest;
            const targetRequest = requestTypes.find(r => r.id === reqId);
            if (targetRequest) {
                setActiveRequest(targetRequest);
                // Clear the state so it doesn't persist on subsequent tab switches
                navigate(location.pathname, { replace: true, state: { ...location.state, preSelectedRequest: null } });
            }
        }
    }, [location.state, requestTypes, navigate, location.pathname]);

    // Reset quantity when request type changes
    useEffect(() => {
        setQuantity(1);
        setDetails('');
    }, [activeRequest]);

    const handleSendRequest = async () => {
        if (!activeRequest) return;
        setIsSubmitting(true);
        try {
            // Include Quantity in details so Admin can parse it
            const formattedDetails = `الطلب: ${activeRequest.label}\nالعدد المطلوب: ${quantity}\nتفاصيل: ${details || 'لا يوجد تفاصيل إضافية'}`;

            await createOrder({
                client_id: client.id,
                client_name: client.companyName,
                type: activeRequest.id,
                details: formattedDetails 
            });
            
            alert('✅ تم إرسال الطلب بنجاح وسيتم مراجعته من قبل الإدارة.');

            // WHATSAPP LOGIC - ASK FIRST
            if (activeRequest.id === 'emergency_visit' && adminPhone) {
                if (window.confirm("هل ترغب بإرسال تنبيه واتساب للإدارة بخصوص هذا الطلب الطارئ؟")) {
                    const msg = encodeURIComponent(`🚨 تنبيه طارئ 🚨\nمرحباً، أنا ${client.companyName}. قمت بطلب زيارة طارئة عبر النظام.\nالتفاصيل: ${details}`);
                    window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank');
                }
            }

            setActiveRequest(null); 
            setDetails('');
            setQuantity(1);
        } catch (error) {
            console.error("Error sending request:", error);
            alert("حدث خطأ أثناء إرسال الطلب.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'approved': return <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold"><CheckCircle size={12}/> تمت الموافقة</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold"><XCircle size={12}/> مرفوض</span>;
            default: return <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold"><Clock size={12}/> قيد المراجعة</span>;
        }
    };

    const getOrderLabel = (type: string) => {
        const item = REQUEST_CONFIG.find(r => r.id === type);
        return item ? item.label : type;
    };

    return (
        <div className="space-y-12 pb-10">
            
            {/* SECTION 1: Active Subscriptions / Licenses */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Key size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-[#0c2444]">اشتراكاتي الفعالة</h3>
                </div>
                
                {hasLicenses ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(licenses).map(([name, key]) => (
                            <motion.div 
                                key={name} 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:border-emerald-200 transition-colors group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                                <div className="flex justify-between items-center mb-3 relative z-10">
                                    <span className="font-bold text-[#0c2444] text-lg">{name}</span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                        <CheckCircle size={10}/> Active
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center group-hover:bg-emerald-50/30 transition-colors">
                                    <code className="text-xs text-gray-600 font-mono break-all select-all">{key}</code>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(key || '')}
                                        className="text-gray-400 hover:text-[#0c2444] transition-colors text-[10px] font-bold"
                                    >
                                        نسخ
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 text-gray-400">
                        <Monitor size={32} className="mx-auto mb-3 opacity-50"/>
                        <p className="text-sm font-bold">لا توجد رخص إضافية مسجلة حالياً.</p>
                        <p className="text-xs mt-1">اطلب رخصة جديدة من القائمة أدناه.</p>
                    </div>
                )}
            </div>

            {/* SECTION 2: Service Store */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><ShoppingBag size={24} /></div>
                    <div><h3 className="text-2xl font-bold text-[#0c2444]">متجر الخدمات والإضافات</h3><p className="text-gray-500 text-sm">اطلب خدمات إضافية لتعزيز باقتك الحالية</p></div>
                </div>
                
                <AnimatePresence mode="wait">
                    {!activeRequest ? (
                        <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requestTypes.map((req) => (
                                <motion.button key={req.id} onClick={() => setActiveRequest(req)} whileHover={{ y: -5 }} className="relative bg-white rounded-[2rem] p-6 text-right shadow-sm border border-gray-100 hover:shadow-xl transition-all group overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${req.gradient} opacity-5 rounded-bl-full -mr-5 -mt-5 transition-transform group-hover:scale-150`}></div>
                                    <div className="relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${req.gradient} flex items-center justify-center mb-6 text-white shadow-lg ${req.shadow}`}><req.icon size={28} strokeWidth={1.5} /></div>
                                        <h4 className="font-bold text-[#0c2444] text-lg mb-2">{req.label}</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4 min-h-[40px]">{req.desc}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50"><span className={`text-xs font-bold ${req.price.includes('مشمولة') ? 'text-green-600 bg-green-50' : 'text-[#0c2444] bg-gray-100'} px-3 py-1 rounded-full`}>{req.price}</span><div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#0c2444] group-hover:text-white transition-colors"><ArrowLeft size={16} className="rtl:rotate-0 ltr:rotate-180"/></div></div>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-full h-2 bg-gradient-to-r ${activeRequest.gradient}`}></div>
                                <button onClick={() => setActiveRequest(null)} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600"><ArrowLeft size={20} className="rtl:rotate-180 ltr:rotate-0"/></button>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeRequest.gradient} flex items-center justify-center text-white shadow-lg`}><activeRequest.icon size={32} /></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-[#0c2444]">تأكيد طلب {activeRequest.label}</h3>
                                        <p className="text-sm text-gray-500 font-medium mt-1">{activeRequest.desc}</p>
                                        <p className="text-xs font-bold text-green-600 mt-2 bg-green-50 px-2 py-1 rounded w-fit">سعر الوحدة: {activeRequest.price}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {/* QUANTITY INPUT */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#0c2444] mb-3 flex items-center gap-2">
                                            <Hash size={16}/> العدد المطلوب
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="100" 
                                                value={quantity} 
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                                                className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl p-4 text-[#0c2444] font-bold text-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all text-center"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">QTY</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#0c2444] mb-3">تفاصيل إضافية</label>
                                        <textarea 
                                            rows={4} 
                                            value={details} 
                                            onChange={(e) => setDetails(e.target.value)} 
                                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl p-5 text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none text-sm font-medium" 
                                            placeholder={activeRequest.placeholder || "تفاصيل إضافية..."} 
                                            autoFocus
                                        ></textarea>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-xs font-bold"><Zap size={16} className="shrink-0"/> سيتم إصدار فاتورة بالقيمة الإجمالية (السعر × العدد) بعد الموافقة.</div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={handleSendRequest} disabled={isSubmitting} className={`flex-1 bg-gradient-to-r ${activeRequest.gradient} text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50`}>{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} {isSubmitting ? 'جاري الإرسال...' : 'تأكيد وإرسال الطلب'}</button>
                                        <button onClick={() => setActiveRequest(null)} className="px-8 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* SECTION 3: Order History */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-[#0c2444]">سجل الطلبات</h3>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    {clientHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <p className="text-sm font-bold">لا يوجد سجل طلبات سابق.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {clientHistory.map((order) => (
                                <div key={order.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.type === 'license' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {order.type === 'user' && <UserPlus size={18}/>}
                                            {order.type === 'visit' && <CalendarPlus size={18}/>}
                                            {order.type === 'ticket' && <Ticket size={18}/>}
                                            {order.type === 'license' && <Monitor size={18}/>}
                                            {order.type === 'emergency_visit' && <Shield size={18}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#0c2444] text-sm">{getOrderLabel(order.type)}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{order.details}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        {getStatusBadge(order.status)}
                                        <p className="text-[9px] text-gray-400 mt-1 font-mono">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default RequestsView;
