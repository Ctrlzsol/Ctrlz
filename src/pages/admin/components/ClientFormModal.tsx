
import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Fingerprint, Upload, Building2, User, Mail, Phone, Package, Edit, Plus, MapPin, Trash2, FileClock, CheckCircle, ArrowRight, ArrowLeft, CreditCard, Wallet, Landmark, DollarSign, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PACKAGES, JORDAN_BANKS, JORDAN_WALLETS } from '../../../core/constants';
import { Branch } from '../../../core/types';

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    clientForm: any;
    setClientForm: (form: any) => void;
    handleClientSubmit: (e: React.FormEvent) => void;
    handleLogoFormUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handlePackageChange: (id: string) => void;
    t: any;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, isEditing, clientForm, setClientForm, handleClientSubmit, handleLogoFormUpload, handlePackageChange, t }) => {
    const [activeStep, setActiveStep] = useState<'info' | 'contract' | 'financial' | 'branches' | 'package'>('info');
    const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
    
    const [paymentMethod, setPaymentMethod] = useState<'cliq' | 'bank'>('cliq');
    
    useEffect(() => {
        if (isOpen && clientForm.paymentConfig) {
            if (clientForm.paymentConfig.bankDetails && !clientForm.paymentConfig.cliqAlias) {
                setPaymentMethod('bank');
            } else {
                setPaymentMethod('cliq');
            }
        }
    }, [isOpen, clientForm.paymentConfig]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'info', label: 'البيانات الأساسية', icon: User },
        { id: 'contract', label: 'العقد والوصول', icon: FileClock },
        { id: 'package', label: 'الباقة والحدود', icon: Package },
        { id: 'financial', label: 'الإعدادات المالية', icon: CreditCard },
        { id: 'branches', label: 'الفروع', icon: MapPin },
    ];

    const handleAddBranch = () => {
        if (!newBranch.name) {
            alert('اسم الفرع مطلوب.');
            return;
        }
        const updatedBranches = [...(clientForm.branches || []), { id: `br-${Date.now()}`, ...newBranch }];
        setClientForm({ ...clientForm, branches: updatedBranches });
        setNewBranch({ name: '', address: '', phone: '' });
    };

    const handleRemoveBranch = (branchId: string) => {
        const updatedBranches = (clientForm.branches || []).filter((b: Branch) => b.id !== branchId);
        setClientForm({ ...clientForm, branches: updatedBranches });
    };

    const updatePaymentConfig = (key: string, value: string) => {
        setClientForm({
            ...clientForm,
            paymentConfig: {
                ...clientForm.paymentConfig,
                [key]: value
            }
        });
    };

    // --- Financial Calculations ---
    const getSelectedPackagePrice = () => {
        const pkg = PACKAGES.find(p => p.id === clientForm.packageId);
        return pkg ? pkg.price : 0;
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const discount = parseFloat(e.target.value) || 0;
        const basePrice = getSelectedPackagePrice();
        const net = basePrice - (basePrice * (discount / 100));
        setClientForm({ 
            ...clientForm, 
            discountPercentage: discount,
            netPrice: parseFloat(net.toFixed(2))
        });
    };

    const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const net = parseFloat(e.target.value) || 0;
        const basePrice = getSelectedPackagePrice();
        let discount = 0;
        if (basePrice > 0) {
            discount = ((basePrice - net) / basePrice) * 100;
        }
        setClientForm({ 
            ...clientForm, 
            netPrice: net,
            discountPercentage: parseFloat(discount.toFixed(2))
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative"
            >
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-[#0c2444]">{isEditing ? 'تحديث ملف العميل' : 'إضافة عميل جديد'}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">يرجى ملء البيانات بدقة لضمان سير العمل</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm border border-gray-100"><X size={20}/></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-64 bg-gray-50 p-6 border-l border-gray-100 flex flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveStep(tab.id as any)}
                                className={`flex items-center gap-3 p-4 rounded-2xl transition-all text-right ${activeStep === tab.id ? 'bg-[#0c2444] text-white shadow-lg shadow-blue-900/10' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
                            >
                                <tab.icon size={18} />
                                <span className="font-bold text-sm">{tab.label}</span>
                                {activeStep === tab.id && <ArrowLeft size={16} className="mr-auto opacity-50"/>}
                            </button>
                        ))}
                        <div className="mt-auto bg-white p-4 rounded-2xl border border-gray-100 text-center">
                            <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center overflow-hidden mb-3 border-4 border-white shadow-sm cursor-pointer relative group">
                                {clientForm.logo ? (
                                    <img src={clientForm.logo} className="w-full h-full object-contain" alt="Logo"/>
                                ) : (
                                    <Building2 size={32} className="text-gray-300"/>
                                )}
                                <label htmlFor="logo-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs">
                                    <Upload size={16} className="mb-1"/> تغيير
                                </label>
                                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoFormUpload} className="hidden"/>
                            </div>
                            <p className="text-xs text-gray-400 font-bold">شعار الشركة</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 relative">
                        <form id="client-form" onSubmit={handleClientSubmit} className="max-w-3xl mx-auto space-y-8">
                            <AnimatePresence mode="wait">
                                {activeStep === 'info' && (
                                    <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-[#0c2444] mb-2">اسم الشركة (الجهة)</label>
                                                <div className="relative">
                                                    <Building2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input required value={clientForm.company} onChange={e => setClientForm({...clientForm, company: e.target.value})} className="w-full bg-white border border-gray-200 focus:border-blue-200 p-4 pr-12 rounded-2xl outline-none transition-all font-bold text-[#0c2444]" placeholder="أدخل اسم الشركة الرسمي"/>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-[#0c2444] mb-2">اسم المسؤول</label>
                                                <div className="relative">
                                                    <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full bg-white border border-gray-200 focus:border-blue-200 p-4 pr-12 rounded-2xl outline-none transition-all text-[#0c2444]" placeholder="اسم مدير الحساب"/>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-[#0c2444] mb-2">رقم الهاتف</label>
                                                <div className="relative">
                                                    <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input required value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full bg-white border border-gray-200 focus:border-blue-200 p-4 pr-12 rounded-2xl outline-none transition-all text-[#0c2444]" placeholder="079xxxxxxx"/>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-[#0c2444] mb-2">البريد الإلكتروني</label>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input required type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full bg-white border border-gray-200 focus:border-blue-200 p-4 pr-12 rounded-2xl outline-none transition-all text-[#0c2444]" placeholder="email@company.com"/>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeStep === 'contract' && (
                                    <motion.div key="contract" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm"><ShieldCheck size={24}/></div>
                                            <div>
                                                <h4 className="font-bold text-[#0c2444] text-lg">بيانات الاعتماد</h4>
                                                <p className="text-sm text-gray-500 mt-1">تستخدم هذه البيانات لربط العميل بالنظام</p>
                                                <div className="flex gap-4 mt-4">
                                                    <div className="bg-white px-4 py-2 rounded-xl border border-blue-100">
                                                        <span className="text-[10px] text-gray-400 block">Unique ID</span>
                                                        <span className="font-mono font-bold text-[#0c2444]">{clientForm.referenceNumber || 'Generated...'}</span>
                                                    </div>
                                                    <div className="bg-white px-4 py-2 rounded-xl border border-blue-100">
                                                        <span className="text-[10px] text-gray-400 block">Access Code</span>
                                                        <input value={clientForm.accessCode} onChange={e => setClientForm({...clientForm, accessCode: e.target.value})} className="font-mono font-bold text-[#0c2444] bg-transparent outline-none w-24"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-[#0c2444] mb-2">تاريخ بدء العقد</label>
                                                <input type="date" value={clientForm.contractStartDate || ''} onChange={e => setClientForm({...clientForm, contractStartDate: e.target.value})} className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none transition-all text-[#0c2444]"/>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-[#0c2444] mb-2">مدة العقد (أشهر)</label>
                                                <input type="number" value={clientForm.contractDurationMonths || 12} onChange={e => setClientForm({...clientForm, contractDurationMonths: parseInt(e.target.value)})} className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none transition-all text-[#0c2444]"/>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeStep === 'package' && (
                                    <motion.div key="package" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-[#0c2444] mb-3">الباقة المختارة</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {PACKAGES.filter(p=>p.type === 'subscription').map(pkg => (
                                                    <div 
                                                        key={pkg.id} 
                                                        onClick={() => handlePackageChange(pkg.id)}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${clientForm.packageId === pkg.id ? 'border-[#0c2444] bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="font-bold text-[#0c2444]">{t.packages.items[pkg.name]?.name}</span>
                                                            {clientForm.packageId === pkg.id && <CheckCircle size={18} className="text-[#0c2444]"/>}
                                                        </div>
                                                        <p className="text-xs text-gray-500">{pkg.price} JOD / شهر</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                            <h4 className="font-bold text-[#0c2444] mb-4 flex items-center gap-2"><Edit size={16}/> تخصيص الحدود</h4>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-2 block">عدد الزيارات</label>
                                                    <input type="number" value={clientForm.totalVisits} onChange={e => setClientForm({...clientForm, totalVisits: parseInt(e.target.value)})} className="w-full bg-white border border-gray-200 p-3 rounded-xl text-center font-bold text-[#0c2444]"/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-2 block">عدد التذاكر</label>
                                                    <input type="number" value={clientForm.totalTickets} onChange={e => setClientForm({...clientForm, totalTickets: parseInt(e.target.value)})} className="w-full bg-white border border-gray-200 p-3 rounded-xl text-center font-bold text-[#0c2444]"/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-2 block">المستخدمين</label>
                                                    <input type="number" value={clientForm.totalUsersLimit} onChange={e => setClientForm({...clientForm, totalUsersLimit: parseInt(e.target.value)})} className="w-full bg-white border border-gray-200 p-3 rounded-xl text-center font-bold text-[#0c2444]"/>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeStep === 'financial' && (
                                    <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                                        
                                        {/* Contract Value and Discounts (Moved Here) */}
                                        <div className="bg-[#f8fafc] p-6 rounded-3xl border border-gray-200">
                                            <h4 className="font-bold text-[#0c2444] mb-4 flex items-center gap-2"><DollarSign size={16}/> قيمة العقد والخصومات</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-2 block">السعر الأساسي للباقة</label>
                                                    <div className="w-full bg-gray-100 border border-gray-200 p-3 rounded-xl text-center font-bold text-gray-500 cursor-not-allowed">
                                                        {getSelectedPackagePrice()} JOD
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-2 block">نسبة الخصم %</label>
                                                    <div className="relative">
                                                        <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                        <input 
                                                            type="number" 
                                                            value={clientForm.discountPercentage || 0} 
                                                            onChange={handleDiscountChange} 
                                                            className="w-full bg-white border border-gray-200 p-3 pr-8 rounded-xl text-center font-bold text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-2 block">صافي قيمة العقد (بعد الخصم)</label>
                                                    <div className="relative">
                                                        <DollarSign size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"/>
                                                        <input 
                                                            type="number" 
                                                            value={clientForm.netPrice ?? getSelectedPackagePrice()} 
                                                            onChange={handleNetPriceChange} 
                                                            className="w-full bg-white border border-green-200 p-3 pr-8 rounded-xl text-center font-bold text-green-700 outline-none focus:ring-2 focus:ring-green-100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                                            <h4 className="font-bold text-green-800 flex items-center gap-2"><CreditCard size={20}/> إعدادات الدفع والاستقبال</h4>
                                            <p className="text-xs text-green-700 mt-2 opacity-80">اختر طريقة الدفع المفضلة والبيانات التي ستظهر للعميل.</p>
                                        </div>

                                        <div className="flex gap-4 p-1 bg-gray-100 rounded-xl mb-4">
                                            <button 
                                                type="button"
                                                onClick={() => setPaymentMethod('cliq')}
                                                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'cliq' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                                            >
                                                <Wallet size={16}/> محافظ إلكترونية (CliQ)
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setPaymentMethod('bank')}
                                                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'bank' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                                            >
                                                <Landmark size={16}/> حساب بنكي
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {paymentMethod === 'cliq' ? (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-bold text-[#0c2444] mb-2">اسم المحفظة / المزود</label>
                                                        <select 
                                                            value={clientForm.paymentConfig?.providerName || ''} 
                                                            onChange={e => updatePaymentConfig('providerName', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none transition-all font-bold text-[#0c2444]"
                                                        >
                                                            <option value="">-- اختر المحفظة --</option>
                                                            {JORDAN_WALLETS.map(wallet => <option key={wallet} value={wallet}>{wallet}</option>)}
                                                            <optgroup label="البنوك (CliQ)">
                                                                {JORDAN_BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                                            </optgroup>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-[#0c2444] mb-2">معرف كليك (Alias)</label>
                                                        <input 
                                                            value={clientForm.paymentConfig?.cliqAlias || ''} 
                                                            onChange={e => updatePaymentConfig('cliqAlias', e.target.value)} 
                                                            className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none transition-all text-[#0c2444] font-mono" 
                                                            placeholder="CTRLZ.JO"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-bold text-[#0c2444] mb-2">اسم البنك</label>
                                                        <select 
                                                            value={clientForm.paymentConfig?.providerName || ''} 
                                                            onChange={e => updatePaymentConfig('providerName', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none transition-all font-bold text-[#0c2444]"
                                                        >
                                                            <option value="">-- اختر البنك --</option>
                                                            {JORDAN_BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-[#0c2444] mb-2">رقم الحساب / IBAN</label>
                                                        <textarea 
                                                            rows={3}
                                                            value={clientForm.paymentConfig?.bankDetails || ''} 
                                                            onChange={e => updatePaymentConfig('bankDetails', e.target.value)} 
                                                            className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none transition-all text-[#0c2444] font-mono resize-none" 
                                                            placeholder="JO00 0000 0000 0000 0000 0000 0000"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <div>
                                                <label className="block text-sm font-bold text-[#0c2444] mb-2">اسم المستلم (Receiver Name)</label>
                                                <input 
                                                    value={clientForm.paymentConfig?.receiverName || ''} 
                                                    onChange={e => updatePaymentConfig('receiverName', e.target.value)} 
                                                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none transition-all text-[#0c2444]" 
                                                    placeholder="اسم الشركة أو الشخص كما يظهر في التطبيق"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeStep === 'branches' && (
                                    <motion.div key="branches" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">اسم الفرع</label>
                                                <input value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 bg-white text-[#0c2444]" placeholder="مثال: فرع العبدلي"/>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">العنوان</label>
                                                <input value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 bg-white text-[#0c2444]" placeholder="عمان - شارع..."/>
                                            </div>
                                            <button type="button" onClick={handleAddBranch} className="bg-[#0c2444] text-white p-3 rounded-xl font-bold hover:bg-[#0a1f3b] transition-all flex items-center justify-center gap-2">
                                                <Plus size={18}/> إضافة
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {(clientForm.branches || []).map((branch: Branch, idx: number) => (
                                                <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-100 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">{idx + 1}</div>
                                                        <div>
                                                            <h4 className="font-bold text-[#0c2444]">{branch.name}</h4>
                                                            <p className="text-xs text-gray-500">{branch.address || 'لا يوجد عنوان'}</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveBranch(branch.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                                                </div>
                                            ))}
                                            {(!clientForm.branches || clientForm.branches.length === 0) && (
                                                <div className="text-center py-10 text-gray-400">لا يوجد فروع مضافة</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex gap-2">
                        {activeStep !== 'info' && (
                            <button type="button" onClick={() => {
                                const idx = tabs.findIndex(t => t.id === activeStep);
                                if (idx > 0) setActiveStep(tabs[idx - 1].id as any);
                            }} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors">السابق</button>
                        )}
                    </div>
                    
                    {activeStep === 'branches' ? (
                        <button onClick={handleClientSubmit} className="bg-[#0c2444] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0a1f3b] shadow-lg shadow-blue-900/10 flex items-center gap-2">
                            <CheckCircle size={18}/> {isEditing ? 'حفظ التعديلات' : 'تأكيد وإضافة'}
                        </button>
                    ) : (
                        <button type="button" onClick={() => {
                            const idx = tabs.findIndex(t => t.id === activeStep);
                            if (idx < tabs.length - 1) setActiveStep(tabs[idx + 1].id as any);
                        }} className="bg-[#0c2444] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0a1f3b] flex items-center gap-2 shadow-lg">
                            التالي <ArrowRight size={18} className="rtl:rotate-180"/>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ClientFormModal;
