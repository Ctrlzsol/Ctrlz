
import React, { useState, useEffect, useMemo } from 'react';
import { Activity, CreditCard, FileText, Download, CheckCircle, Clock, AlertTriangle, Building, Banknote, Copy, Check, X, TrendingUp } from 'lucide-react';
import { Invoice, ClientProfile } from '../../../core/types';
import { getStatusColor, getStatusLabel } from '../../../core/utils';
import { InvoiceTemplate } from '../../../ui/components/InvoiceTemplate';
import { AnimatePresence, motion } from 'framer-motion';

interface BillingViewProps {
    invoices: Invoice[];
    currency: string;
    t: any;
    packagePrice: number;
    client?: ClientProfile;
}

const BillingView: React.FC<BillingViewProps> = ({ invoices, currency, t, packagePrice, client }) => {
    const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [copiedCliq, setCopiedCliq] = useState(false);
    
    // Default settings if client specific config is missing
    const defaultPaymentConfig = {
        cliqAlias: 'CTRLZ.JO',
        receiverName: 'Ctrl Z Tech',
        bankDetails: 'Arab Bank\nIBAN: JO00 0000 0000 0000 0000 0000\nAcc: 123456'
    };

    const paymentConfig = client?.paymentConfig || defaultPaymentConfig;

    // Calculate actual monthly subscription amount
    const subscriptionAmount = client?.netPrice !== undefined && client?.netPrice !== null ? client.netPrice : packagePrice;

    const publishedInvoices = invoices.filter(inv => inv.isPublished);

    // Calculate Total Outstanding Balance (Pending + Overdue)
    const outstandingBalance = publishedInvoices
        .filter(inv => (inv.status === 'pending' || inv.status === 'overdue'))
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // GROUP INVOICES BY MONTH
    const groupedInvoices = useMemo<Record<string, Invoice[]>>(() => {
        const grouped: Record<string, Invoice[]> = {};
        publishedInvoices.forEach(inv => {
            const date = new Date(inv.issueDate);
            const key = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(inv);
        });
        return grouped;
    }, [publishedInvoices]);

    const getDisplayStatus = (invoice: Invoice) => {
        const today = new Date();
        if (invoice.status === 'pending' && today.getDate() > 5) {
            return 'overdue';
        }
        return invoice.status;
    };

    const handleCopyCliq = () => {
        navigator.clipboard.writeText(paymentConfig.cliqAlias || defaultPaymentConfig.cliqAlias);
        setCopiedCliq(true);
        setTimeout(() => setCopiedCliq(false), 2000);
    };

    const whatsappMessage = encodeURIComponent(`مرحباً، أنا ${client?.companyName || 'عميل'}. قمت بتحويل مبلغ ${outstandingBalance > 0 ? outstandingBalance : subscriptionAmount} ${currency} عن طريق (كليك / حوالة بنكية). يرجى التأكيد.`);
    
    return (
        <div className="space-y-8">
            <AnimatePresence>
                {printingInvoice && (
                    <InvoiceTemplate 
                        invoice={printingInvoice} 
                        onClose={() => setPrintingInvoice(null)} 
                        onPrint={() => window.print()}
                    />
                )}
            </AnimatePresence>

            {/* 1. Payment Hero Card (Updated Layout) */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#0c2444] to-[#1e3a8a] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none"></div>
                
                {/* Financial Summary Column */}
                <div className="flex-1 space-y-8 relative z-10 w-full">
                    
                    {/* Subscription Row */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <div className="flex items-center gap-2 text-blue-200 mb-1">
                                <TrendingUp size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">قيمة الاشتراك الشهري</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter">{subscriptionAmount}</span>
                                <span className="text-lg font-bold opacity-70">{currency}</span>
                            </div>
                        </div>
                        <div className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                            <span className="text-[10px] font-bold">تجديد تلقائي</span>
                        </div>
                    </div>

                    {/* Outstanding Balance Row */}
                    <div>
                        <div className="flex items-center gap-2 text-blue-200 mb-1">
                            <FileText size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">المستحقات المعلقة (فواتير)</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter">{outstandingBalance.toFixed(2)}</span>
                                <span className="text-xl font-bold opacity-70">{currency}</span>
                            </div>
                            
                            {outstandingBalance > 0 ? (
                                <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-2 rounded-xl backdrop-blur-md">
                                    <AlertTriangle size={18} className="text-red-200"/>
                                    <span className="text-xs font-bold">يرجى السداد</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/50 text-green-100 px-4 py-2 rounded-xl backdrop-blur-md">
                                    <CheckCircle size={18} className="text-green-200"/>
                                    <span className="text-xs font-bold">لا توجد مستحقات</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Column */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-full md:w-auto min-w-[320px] relative z-10 shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <CreditCard size={24} className="text-white" />
                        <span className={`text-xs font-bold px-2 py-1 rounded ${outstandingBalance > 0 ? 'bg-orange-500/80 text-white' : 'bg-green-500/80 text-white'}`}>
                            {outstandingBalance > 0 ? 'Pending' : 'Paid'}
                        </span>
                    </div>
                    <div className="space-y-2 mb-6 text-sm text-blue-100">
                        <p>يرجى تسديد المبلغ قبل تاريخ 5 من كل شهر لضمان استمرارية الخدمة.</p>
                    </div>
                    <button 
                        onClick={() => setShowPaymentModal(true)} 
                        className="w-full bg-white text-[#0c2444] py-3 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                        تفاصيل الدفع / تسجيل حوالة
                    </button>
                </div>
            </motion.div>

            {/* 2. Invoices List Grouped by Month */}
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-[#0c2444] mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-[#0071e3]"/> {t.client.billing.invoices}
                </h3>
                
                <div className="space-y-8">
                    {Object.keys(groupedInvoices).length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <FileText size={40} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-400 font-bold">لا توجد فواتير منشورة حالياً.</p>
                        </div>
                    ) : (
                        (Object.entries(groupedInvoices) as [string, Invoice[]][]).map(([monthYear, monthInvoices]) => (
                            <div key={monthYear}>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">{monthYear}</h4>
                                <div className="space-y-3">
                                    {monthInvoices.map((inv, idx) => {
                                        const displayStatus = getDisplayStatus(inv);
                                        const statusLabel = getStatusLabel(displayStatus);
                                        let statusStyle = "bg-gray-100 text-gray-600";
                                        let StatusIcon = Clock;
                                        if (displayStatus === 'paid') { statusStyle = "bg-green-100 text-green-700"; StatusIcon = CheckCircle; }
                                        else if (displayStatus === 'overdue') { statusStyle = "bg-red-100 text-red-700"; StatusIcon = AlertTriangle; }
                                        else if (displayStatus === 'pending') { statusStyle = "bg-orange-100 text-orange-700"; StatusIcon = Clock; }

                                        return (
                                            <motion.div 
                                                key={inv.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group flex flex-col md:flex-row justify-between items-center p-5 rounded-2xl bg-white border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all cursor-pointer"
                                                onClick={() => setPrintingInvoice(inv)}
                                            >
                                                <div className="flex items-center gap-5 w-full md:w-auto mb-4 md:mb-0">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${statusStyle.replace('text-', 'bg-').split(' ')[0].replace('100', '50')} ${statusStyle.split(' ')[1]}`}>
                                                        <FileText size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[#0c2444] text-base mb-1">
                                                            {inv.items.length > 1 ? `${inv.items[0]?.description} + ${inv.items.length - 1} بنود أخرى` : inv.items[0]?.description}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                                                            <span>{inv.invoiceNumber}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span>{new Date(inv.issueDate).toLocaleDateString('en-GB')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between w-full md:w-auto gap-8">
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${statusStyle}`}>
                                                        <StatusIcon size={14} />
                                                        <span>{statusLabel}</span>
                                                    </div>
                                                    
                                                    <div className="text-right">
                                                        <p className="font-black text-[#0c2444] text-lg">{inv.totalAmount.toFixed(2)} <span className="text-xs font-bold text-gray-400">{inv.currency}</span></p>
                                                    </div>

                                                    <button 
                                                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#0c2444] hover:text-white transition-all shadow-sm"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Payment Details Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
                        >
                            <div className="bg-[#0c2444] p-6 text-center text-white relative">
                                <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 left-6 text-white/70 hover:text-white"><X size={20}/></button>
                                <h3 className="text-xl font-bold mb-1">تفاصيل الدفع</h3>
                                <p className="text-sm text-blue-200">طرق الدفع المتاحة للعملاء</p>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    {/* CliQ Option */}
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                            <Building size={20}/>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#0c2444] text-sm">محفظة كليك (CliQ)</h4>
                                            <p className="text-xs text-gray-500 mt-1 mb-2">للتحويل الفوري والمباشر</p>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-white px-3 py-2 rounded-lg border border-blue-200 inline-block font-mono font-bold text-blue-700 text-sm">
                                                    {paymentConfig.cliqAlias || 'غير محدد'}
                                                </div>
                                                <button onClick={handleCopyCliq} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors">
                                                    {copiedCliq ? <Check size={16}/> : <Copy size={16}/>}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">اسم المستلم: {paymentConfig.receiverName || 'غير محدد'}</p>
                                        </div>
                                    </div>

                                    {/* Bank Transfer Option */}
                                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 shrink-0">
                                            <Banknote size={20}/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#0c2444] text-sm">التحويل البنكي</h4>
                                            <p className="text-xs text-gray-500 mt-1 mb-2 whitespace-pre-wrap leading-relaxed">{paymentConfig.bankDetails || 'لا توجد تفاصيل بنكية'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-[#0c2444] text-sm mb-2">بعد إتمام التحويل:</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                        يرجى إرسال صورة إشعار التحويل عبر الواتساب للرقم المعتمد، ليتم تحديث رصيدكم.
                                    </p>
                                    <a 
                                        href={`https://wa.me/962788877285?text=${whatsappMessage}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block w-full bg-green-500 text-white text-center py-3 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        تأكيد الدفع عبر الواتساب
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
export default BillingView;
