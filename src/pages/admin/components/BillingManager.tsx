
import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, AlertCircle, CreditCard, FileText, Loader2, Calendar as CalendarIcon, Percent, Plus, Eye, EyeOff, Download, X, Users, Trash2, TrendingUp, CheckCircle, Wallet, ArrowUpRight, Settings, Edit2, Hash, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../../../modules/billing/context';
import { useClientData } from '../../../modules/clients/context';
import { PACKAGES } from '../../../core/constants';
import { Invoice, InvoiceStatus, InvoiceItem } from '../../../core/types';
import { getStatusLabel } from '../../../core/utils';
import { InvoiceTemplate } from '../../../ui/components/InvoiceTemplate';

const BillingManager = ({ t, preSelectedClientId }: { t: any, preSelectedClientId?: string }) => { 
    const { invoices, updateInvoiceStatus, addInvoice, togglePublishStatus, deleteInvoice, updateInvoiceDetails } = useInvoice(); 
    const { clients } = useClientData();
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    
    // Form state handling both create and edit - UPDATED FOR MULTI-ITEM & DISCOUNT
    const [invoiceForm, setInvoiceForm] = useState({ 
        id: null as string | null,
        items: [{ description: '', amount: 0, quantity: 1, type: 'addon_one_time' }] as InvoiceItem[],
        date: new Date().toISOString().split('T')[0], 
        status: 'pending' as InvoiceStatus, 
        discount: 0,
        isPublished: true 
    });
    
    const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
    const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
    
    // Effect to set selected client if passed from props
    useEffect(() => {
        if (preSelectedClientId) {
            setSelectedClientId(preSelectedClientId);
        }
    }, [preSelectedClientId]);

    const selectedClient = clients.find(c => c.id === selectedClientId);
    
    // GROUP INVOICES BY MONTH
    const groupedInvoices = useMemo<Record<string, Invoice[]>>(() => {
        const filtered = invoices.filter(i => i.clientId === selectedClientId);
        
        const grouped: Record<string, Invoice[]> = {};
        filtered.forEach(inv => {
            const date = new Date(inv.issueDate);
            const key = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(inv);
        });
        
        return grouped;
    }, [invoices, selectedClientId]);

    const currentPackage = selectedClient ? PACKAGES.find(p => p.id === selectedClient.packageId) : null;

    const contractDetails = useMemo(() => {
        if (!selectedClient || !currentPackage) return null;
        const basePrice = currentPackage.price;
        const netPrice = selectedClient.netPrice ?? (basePrice * (1 - (selectedClient.discountPercentage ?? 0) / 100));
        const discountPercentage = selectedClient.discountPercentage ?? (basePrice > 0 ? (1 - netPrice / basePrice) * 100 : 0);
        
        return {
            startDate: selectedClient.contractStartDate || '',
            duration: selectedClient.contractDurationMonths || 12,
            basePrice: basePrice,
            netPrice: netPrice,
            discount: parseFloat(discountPercentage.toFixed(2))
        };
    }, [selectedClient, currentPackage]);

    const calculateSubTotal = (items: InvoiceItem[]) => {
        return items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    };

    const calculateFinalTotal = () => {
        const sub = calculateSubTotal(invoiceForm.items);
        return Math.max(0, sub - (invoiceForm.discount || 0));
    };

    const handleAddItem = () => {
        setInvoiceForm({
            ...invoiceForm,
            items: [...invoiceForm.items, { description: '', amount: 0, quantity: 1, type: 'addon_one_time' }]
        });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...invoiceForm.items];
        newItems.splice(index, 1);
        setInvoiceForm({ ...invoiceForm, items: newItems });
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...invoiceForm.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setInvoiceForm({ ...invoiceForm, items: newItems });
    };

    const handleSaveInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        
        const subTotal = calculateSubTotal(invoiceForm.items);
        const discountApplied = invoiceForm.discount || 0;
        const totalAmount = Math.max(0, subTotal - discountApplied);
        
        if (invoiceForm.id) {
            // Update Existing
            await updateInvoiceDetails(invoiceForm.id, {
                totalAmount: totalAmount,
                items: invoiceForm.items,
                issueDate: invoiceForm.date,
                status: invoiceForm.status,
                isPublished: invoiceForm.isPublished,
                subTotal: subTotal,
                discountApplied: discountApplied,
            });
            alert("تم تحديث الفاتورة بنجاح.");
        } else {
            // Create New
            const newInv: Omit<Invoice, 'id'> = {
                clientId: selectedClient.id,
                clientName: selectedClient.companyName,
                invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                issueDate: invoiceForm.date,
                dueDate: invoiceForm.date, 
                status: invoiceForm.status, 
                totalAmount: totalAmount,
                currency: 'JOD',
                billingPeriod: invoiceForm.date,
                items: invoiceForm.items,
                subTotal: subTotal,
                discountApplied: discountApplied,
                isPublished: invoiceForm.isPublished
            };
            await addInvoice(newInv);
            alert("تم إنشاء الفاتورة وإضافتها لسجل العميل.");
        }
        
        setShowInvoiceForm(false);
        // Reset form
        setInvoiceForm({ 
            id: null, 
            items: [{ description: '', amount: 0, quantity: 1, type: 'addon_one_time' }], 
            date: new Date().toISOString().split('T')[0], 
            status: 'pending', 
            discount: 0,
            isPublished: true 
        });
    };

    const openEditInvoice = (inv: Invoice) => {
        setInvoiceForm({
            id: inv.id,
            items: inv.items.length > 0 ? inv.items : [{ description: '', amount: inv.totalAmount, quantity: 1, type: 'addon_one_time' }],
            date: inv.issueDate.split('T')[0],
            status: inv.status,
            discount: inv.discountApplied || 0,
            isPublished: inv.isPublished || false
        });
        setShowInvoiceForm(true);
    };

    const handleDeleteInvoice = async (id: string) => {
        setDeletingInvoiceId(id);
        const success = await deleteInvoice(id);
        if (!success) console.warn('[UI] Context reported failed invoice deletion.');
        setDeletingInvoiceId(null);
    };

    const prefillPackageInvoice = () => {
        if (!contractDetails) {
            alert('يرجى التأكد من اختيار العميل وأن لديه باقة وتفاصيل عقد محددة أولاً.');
            return;
        }
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        const currentMonthName = monthNames[new Date().getMonth()];
        const packageNameArabic = currentPackage ? (t.packages.items[currentPackage.name]?.name || currentPackage.name) : '';

        // Note: For package invoices, we use the net price directly as the amount, so discount is 0 on the invoice itself
        // unless you want to show Base Price and Discount explicitly. Here we use Net Price.
        setInvoiceForm({
            id: null,
            items: [{
                description: `تجديد اشتراك ${packageNameArabic} - شهر ${currentMonthName}`,
                amount: contractDetails.netPrice,
                quantity: 1,
                type: 'package'
            }],
            isPublished: true,
            status: 'pending',
            discount: 0,
            date: new Date().toISOString().split('T')[0]
        });
        setShowInvoiceForm(true);
    };

    const handlePrintInvoice = (inv: Invoice) => {
        setPrintingInvoice(inv);
    };

    const totalRevenue = invoices.reduce((acc, curr) => curr.status === 'paid' ? acc + curr.totalAmount : acc, 0);
    const pendingAmount = invoices.reduce((acc, curr) => curr.status === 'pending' || curr.status === 'overdue' ? acc + curr.totalAmount : acc, 0);

    return ( 
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
            {/* INVOICE PRINT MODAL */}
            <AnimatePresence>
                {printingInvoice && (
                    <div className="fixed inset-0 z-[9999]">
                        <InvoiceTemplate 
                            invoice={printingInvoice} 
                            onClose={() => setPrintingInvoice(null)} 
                            onPrint={() => window.print()}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* 1. Creative Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-[#0c2444] to-[#1e3a8a] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
                            <h3 className="text-5xl font-black tracking-tight">{totalRevenue.toLocaleString()}<span className="text-xl font-bold text-blue-300 ml-1">JOD</span></h3>
                            <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
                                <TrendingUp size={16} className="text-green-400" />
                                <span className="font-bold">معدل التحصيل ممتاز</span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Wallet size={32} className="text-blue-200" />
                        </div>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -ml-10 -mt-10"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">مبالغ معلقة</p>
                            <h3 className="text-5xl font-black text-[#0c2444] tracking-tight">{pendingAmount.toLocaleString()}<span className="text-xl font-bold text-gray-400 ml-1">JOD</span></h3>
                            <div className="mt-4 flex items-center gap-2 text-sm bg-orange-50 w-fit px-3 py-1.5 rounded-full border border-orange-100">
                                <AlertCircle size={16} className="text-orange-500" />
                                <span className="font-bold text-orange-600">فواتير تحتاج للمتابعة</span>
                            </div>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-2xl text-orange-500 border border-orange-100">
                            <FileText size={32} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 2. Main Workspace */}
            <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl border border-gray-100 relative min-h-[800px] flex flex-col">
                
                {/* Header Control */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 shrink-0">
                    <div>
                        <h2 className="text-3xl font-black text-[#0c2444] flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <CreditCard size={24}/>
                            </div>
                            إدارة الفوترة والعقود
                        </h2>
                        <p className="text-gray-400 font-bold mt-2 mr-16">إدارة شاملة للاشتراكات والمدفوعات</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative z-20 group w-full md:w-auto">
                            <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071e3] transition-colors" size={20} />
                            <select 
                                value={selectedClientId} 
                                onChange={(e) => setSelectedClientId(e.target.value)} 
                                className="bg-[#f8fafc] border-2 border-transparent hover:border-blue-100 focus:border-[#0071e3] focus:bg-white rounded-2xl py-4 px-12 text-sm font-bold text-[#0c2444] outline-none cursor-pointer w-full md:w-80 shadow-sm transition-all appearance-none"
                            >
                                <option value="">-- اختر عميلاً للمتابعة --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <ArrowUpRight size={16} className="rotate-45" />
                            </div>
                        </div>
                    </div>
                </div>

                {!selectedClient ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                            <Users size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400">ابدأ باختيار عميل</h3>
                        <p className="text-gray-300 text-sm mt-2">ستظهر تفاصيل العقد والفواتير هنا</p>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-8">
                        
                        {/* Interactive Contract Card & Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                            
                            {/* COMPACT CARD VISUAL */}
                            <div className="lg:col-span-2 relative group perspective-1000">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] transform rotate-1 scale-[0.98] opacity-20 blur-lg group-hover:opacity-30 transition-opacity"></div>
                                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl transition-transform transform group-hover:-translate-y-1 min-h-[180px] flex flex-col justify-between">
                                    {/* Abstract Patterns */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">بطاقة العضوية</p>
                                                <h3 className="text-xl font-black tracking-wide">{selectedClient.companyName}</h3>
                                            </div>
                                            <div className="bg-white/10 px-2 py-1 rounded-lg backdrop-blur-md border border-white/10">
                                                <span className="text-[10px] font-bold">
                                                    {currentPackage ? (t.packages.items[currentPackage.name]?.name || currentPackage.name) : 'باقة مخصصة'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-[9px] font-bold uppercase">تاريخ البدء</p>
                                                <p className="font-mono font-bold text-sm">{contractDetails?.startDate || '---'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-[9px] font-bold uppercase">المدة</p>
                                                <p className="font-mono font-bold text-sm">{contractDetails?.duration} شهر</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-[9px] font-bold uppercase">الاستحقاق</p>
                                                <p className="font-mono font-bold text-sm text-green-400">{contractDetails?.netPrice.toFixed(2)} JOD</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex justify-between items-center pt-3 mt-2 border-t border-white/10">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${contractDetails?.startDate ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                            <span className="text-[10px] font-bold text-gray-300">{contractDetails?.startDate ? 'ساري المفعول' : 'بانتظار التفعيل'}</span>
                                        </div>
                                        {contractDetails?.discount > 0 && (
                                            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                                                خصم: {contractDetails.discount}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Compact Quick Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={prefillPackageInvoice} 
                                    className="flex-1 bg-white border-2 border-dashed border-gray-200 rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-gray-400 hover:border-[#0071e3] hover:bg-blue-50 hover:text-[#0071e3] transition-all group min-h-[90px]"
                                >
                                    <Plus size={20} className="mb-1 text-gray-300 group-hover:text-blue-500"/>
                                    <span className="font-bold text-xs">إصدار فاتورة شهرية</span>
                                </button>
                                
                                <button 
                                    onClick={() => { setShowInvoiceForm(true); setInvoiceForm({id: null, items: [{ description: '', amount: 0, quantity: 1, type: 'addon_one_time' }], date: new Date().toISOString().split('T')[0], status: 'pending', discount: 0, isPublished: true}); }}
                                    className="bg-[#0c2444] text-white py-3 rounded-[1.2rem] font-bold shadow-lg hover:bg-[#0a1f3b] transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    <FileText size={14}/> فاتورة مخصصة
                                </button>
                            </div>
                        </div>

                        {/* Invoices List - Grouped by Month */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[#0c2444]">سجل العمليات المالية</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {Object.keys(groupedInvoices).length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                        <FileText size={32} className="mx-auto mb-2 text-gray-300"/>
                                        <p className="text-gray-400 text-sm">لا توجد فواتير مسجلة لهذا العميل.</p>
                                    </div>
                                ) : (
                                    (Object.entries(groupedInvoices) as [string, Invoice[]][]).map(([monthYear, invoicesInMonth]) => (
                                        <div key={monthYear} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                                            <div className="bg-[#f8fafc] px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                                <h4 className="font-bold text-[#0c2444] text-sm">{monthYear}</h4>
                                                <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">{invoicesInMonth.length} فواتير</span>
                                            </div>
                                            <table className="w-full text-right">
                                                <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white">
                                                    <tr>
                                                        <th className="p-4 w-24">رقم الفاتورة</th>
                                                        <th className="p-4">التاريخ</th>
                                                        <th className="p-4">البيان</th>
                                                        <th className="p-4">المبلغ</th>
                                                        <th className="p-4">الحالة</th>
                                                        <th className="p-4">نشر</th>
                                                        <th className="p-4 text-center">إجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 text-xs font-bold text-[#0c2444]">
                                                    {invoicesInMonth.map(inv => (
                                                        <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                                                            <td className="p-4 font-mono text-gray-500">{inv.invoiceNumber}</td>
                                                            <td className="p-4">{new Date(inv.issueDate).toLocaleDateString()}</td>
                                                            <td className="p-4 text-gray-600 font-medium truncate max-w-[200px]">
                                                                {inv.items.length > 1 ? `${inv.items[0]?.description} + ${inv.items.length - 1} بنود أخرى` : inv.items[0]?.description}
                                                            </td>
                                                            <td className="p-4 text-sm font-black">{inv.totalAmount.toFixed(2)} JOD</td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-1 rounded-md text-[9px] uppercase tracking-wide ${
                                                                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                    inv.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                    {getStatusLabel(inv.status)}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <button onClick={() => togglePublishStatus(inv.id, !inv.isPublished)} className={`p-1.5 rounded-lg transition-all ${inv.isPublished ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                                                    {inv.isPublished ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                                </button>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => openEditInvoice(inv)} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-gray-400" title="تعديل">
                                                                        <Edit2 size={14}/>
                                                                    </button>
                                                                    <button onClick={() => updateInvoiceStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all text-gray-400" title="تبديل الحالة">
                                                                        <DollarSign size={14}/>
                                                                    </button>
                                                                    <button onClick={() => handlePrintInvoice(inv)} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-gray-400" title="تحميل">
                                                                        <Download size={14}/>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteInvoice(inv.id)} disabled={deletingInvoiceId === inv.id} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-gray-400">
                                                                        {deletingInvoiceId === inv.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </motion.div>
                )}
            </div>

            {/* Modal for Creating/Editing Invoice (Multi-Item Support) */}
            <AnimatePresence>
                {showInvoiceForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
                            
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-[#0c2444] mb-1">{invoiceForm.id ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}</h3>
                                    <p className="text-xs text-gray-400">أدخل تفاصيل البنود والأسعار</p>
                                </div>
                                <button onClick={() => setShowInvoiceForm(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
                            </div>
                            
                            <form onSubmit={handleSaveInvoice} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                                    {/* Items Section */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-500">بنود الفاتورة</label>
                                        {invoiceForm.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="flex-1 space-y-2">
                                                    <input 
                                                        placeholder="الوصف (مثال: رسوم صيانة)" 
                                                        value={item.description} 
                                                        onChange={e => handleItemChange(idx, 'description', e.target.value)} 
                                                        className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm font-bold text-[#0c2444] outline-none focus:border-blue-300"
                                                        required
                                                    />
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <DollarSign size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                            <input 
                                                                type="number" 
                                                                placeholder="السعر" 
                                                                value={item.amount} 
                                                                onChange={e => handleItemChange(idx, 'amount', parseFloat(e.target.value))} 
                                                                className="w-full p-2 pr-8 bg-white rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-300"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="relative w-24">
                                                            <Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                            <input 
                                                                type="number" 
                                                                placeholder="العدد" 
                                                                value={item.quantity} 
                                                                onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value))} 
                                                                className="w-full p-2 pr-8 bg-white rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-300"
                                                                min="1"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {invoiceForm.items.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg mt-1">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddItem} className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                                            <Plus size={14}/> إضافة بند جديد
                                        </button>
                                    </div>

                                    {/* Discount & Meta Data */}
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        
                                        {/* Discount Field */}
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 mb-2 block flex items-center gap-2">
                                                <Tag size={14}/> إضافة خصم
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    placeholder="0.00" 
                                                    value={invoiceForm.discount} 
                                                    onChange={e => setInvoiceForm({...invoiceForm, discount: parseFloat(e.target.value) || 0})} 
                                                    className="w-full p-3 pr-10 rounded-xl bg-white border border-gray-200 outline-none text-sm font-bold text-green-700" 
                                                    min="0"
                                                    step="0.01"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">JOD</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2">تاريخ الإصدار</label>
                                                <input required type="date" value={invoiceForm.date} onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm font-bold text-[#0c2444]" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2">الحالة</label>
                                                <select value={invoiceForm.status} onChange={e => setInvoiceForm({...invoiceForm, status: e.target.value as InvoiceStatus})} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm font-bold text-[#0c2444]">
                                                    <option value="pending">غير مدفوعة</option>
                                                    <option value="paid">مدفوعة</option>
                                                    <option value="overdue">متأخرة</option>
                                                    <option value="cancelled">ملغاة</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-[#0c2444] p-4 rounded-xl text-white">
                                        <div className="flex flex-col">
                                            <label className="flex items-center gap-2 cursor-pointer mb-1">
                                                <input type="checkbox" checked={invoiceForm.isPublished} onChange={e => setInvoiceForm({...invoiceForm, isPublished: e.target.checked})} className="w-4 h-4 accent-blue-500" />
                                                <span className="text-xs font-bold">نشر للعميل</span>
                                            </label>
                                            <span className="text-[10px] opacity-70">المجموع الفرعي: {calculateSubTotal(invoiceForm.items).toFixed(2)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs opacity-70 block mb-1">الإجمالي النهائي</span>
                                            <span className="text-2xl font-black">{calculateFinalTotal().toFixed(2)} JOD</span>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#0071e3] text-white py-4 rounded-2xl font-bold hover:bg-[#0062c9] transition-all shadow-lg mt-6 active:scale-[0.98]">
                                    {invoiceForm.id ? 'حفظ التعديلات' : 'تأكيد وإضافة'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div> 
    ); 
};

export default BillingManager;
