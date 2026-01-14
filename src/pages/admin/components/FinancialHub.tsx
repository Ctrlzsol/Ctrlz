import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, Search, Plus, Check, Loader2, X, Send, FileText, TrendingUp, TrendingDown, DollarSign, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../../../modules/billing/context';
import { useClientData } from '../../../modules/clients/context';
import { Invoice, InvoiceStatus, ClientProfile, Expense } from '../../../core/types';
import { PACKAGES } from '../../../core/constants';
import { getStatusLabel } from '../../../core/utils';
import { supabase } from '../../../lib/supabase';

const FinancialHub: React.FC = () => {
    const { invoices, addInvoice } = useInvoice();
    const { clients } = useClientData();
    
    const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'reports'>('invoices');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'general', customCategory: '' });
    const [isExpenseProcessing, setIsExpenseProcessing] = useState(false);
    const [processingDeleteId, setProcessingDeleteId] = useState<string | null>(null);

    const fetchExpenses = async () => {
        setIsLoadingExpenses(true);
        try {
            const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
            if (error) throw error;
            // Since we are now using hard delete, we don't need to filter by is_deleted anymore.
            setExpenses(data as Expense[] || []);
        } catch (error: any) {
            console.error("Error fetching expenses:", error);
            alert(`فشل جلب المصروفات: ${error.message}`);
        } finally {
            setIsLoadingExpenses(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'expenses' || activeTab === 'reports') {
            fetchExpenses();
        }
    }, [activeTab]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);
    
    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const categoryToSave = newExpense.category === 'other' ? newExpense.customCategory : newExpense.category;
        if (newExpense.category === 'other' && !categoryToSave.trim()) {
            alert('يرجى إدخال وصف لفئة "أخرى".');
            return;
        }

        const amountValue = parseFloat(newExpense.amount);
        if (isNaN(amountValue)) {
            alert('يرجى إدخال مبلغ صحيح.');
            return;
        }

        setIsExpenseProcessing(true);
        
        const payload = { 
            description: newExpense.description, 
            amount: amountValue, 
            date: newExpense.date, 
            category: categoryToSave,
        };

        try {
            const { error } = await supabase.from('expenses').insert([payload]);
            if (error) throw error;
            
            alert('تم إضافة المصروف بنجاح.');
            setIsExpenseModalOpen(false);
            setNewExpense({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'general', customCategory: '' });
            await fetchExpenses();

        } catch (error: any) {
            console.error("Add Expense Error:", error);
            const errorMessage = error.message || JSON.stringify(error);
            alert(`فشل إضافة المصروف: ${errorMessage}`);
        } finally {
            setIsExpenseProcessing(false);
        }
    };
    
    const handleDeleteExpense = async (id: string) => {
        setProcessingDeleteId(id);
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) {
                alert('فشل في قاعدة البيانات: ' + error.message);
            } else {
                alert('تم الحذف من القاعدة بنجاح!');
                setExpenses(prev => prev.filter(exp => exp.id !== id));
            }
        } catch (err: any) {
            alert('خطأ برمجي: ' + err.message);
        } finally {
            setProcessingDeleteId(null);
        }
    };

    const totalRevenue = useMemo(() => invoices.reduce((acc, curr) => curr.status === 'paid' ? acc + curr.totalAmount : acc, 0), [invoices]);
    const totalExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + Number(curr.amount), 0), [expenses]);
    const netProfit = totalRevenue - totalExpenses;

    const handleExportFinancials = () => {
        const headers = ["البيان", "المبلغ", "العملة"];
        const rows = [
            ["إجمالي الإيرادات", totalRevenue.toFixed(2), "JOD"],
            ["إجمالي المصاريف", totalExpenses.toFixed(2), "JOD"],
            ["صافي الربح", netProfit.toFixed(2), "JOD"]
        ];

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financial_summary_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs = [{ id: 'invoices', label: 'الفواتير والإيرادات' }, { id: 'expenses', label: 'المصاريف والتكاليف' }, { id: 'reports', label: 'التقارير المالية' }];
    const expenseCategories = [{ id: 'salaries', label: 'رواتب' }, { id: 'rent', label: 'إيجار' }, { id: 'utilities', label: 'فواتير وخدمات' }, { id: 'marketing', label: 'تسويق' }, { id: 'supplies', label: 'مستلزمات مكتبية' }, { id: 'general', label: 'مصاريف عامة' }, { id: 'other', label: 'أخرى' }];
    
    const FinancialCard = ({ title, value, icon, colorClass }: { title: string; value: string; icon: React.ReactNode; colorClass: string }) => (
        <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center`}>
            <div><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{title}</p><p className={`text-3xl font-bold ${colorClass} mt-2`}>{value}</p></div>
            <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-')} bg-opacity-10 ${colorClass}`}>{icon}</div>
        </div>
    );

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#0c2444] flex items-center gap-2"><Briefcase size={24} className="text-[#0071e3]"/> المركز المالي</h3></div>
            <div className="bg-gray-100 p-1.5 rounded-full flex relative cursor-default mb-8">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="flex-1 relative z-10 py-3 text-sm font-bold rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700">{activeTab === tab.id && <motion.div layoutId="financetab" className="absolute inset-0 bg-white rounded-full shadow-sm border border-gray-200" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}/>}<span className={`relative z-10 ${activeTab === tab.id && 'text-[#0c2444]'}`}>{tab.label}</span></button>))}</div>
            
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {activeTab === 'invoices' && (<div><div className="flex justify-between items-center mb-6"><div className="flex gap-4"><div className="relative flex-1"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ابحث بالاسم أو رقم الفاتورة..." className="w-full bg-gray-50 border-gray-200 p-3 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"/></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-gray-50 border-gray-200 p-3 rounded-xl font-bold text-sm outline-none w-48"><option value="all">كل الحالات</option><option value="pending">غير مدفوعة</option><option value="paid">مدفوعة</option><option value="overdue">متأخرة</option></select></div></div><div className="border border-gray-100 rounded-2xl overflow-hidden"><table className="w-full text-right"><thead className="bg-[#f9fafb]"><tr className="text-xs font-bold text-gray-500 border-b"><th className="p-4">العميل</th><th className="p-4">رقم الفاتورة</th><th className="p-4">البيان والوصف</th><th className="p-4">التاريخ</th><th className="p-4">المبلغ</th><th className="p-4">الحالة</th></tr></thead><tbody className="divide-y divide-gray-50">{filteredInvoices.map(inv => (<tr key={inv.id} className="hover:bg-gray-50"><td className="p-4 font-bold text-[#0c2444]">{inv.clientName}</td><td className="p-4 text-xs font-mono text-gray-500">{inv.invoiceNumber}</td><td className="p-4 text-sm text-gray-600">{inv.items[0]?.description || inv.billingPeriod}</td><td className="p-4 text-sm text-gray-600">{inv.issueDate}</td><td className="p-4 text-sm font-bold text-green-600">{inv.totalAmount.toFixed(2)} JOD</td><td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-md ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{getStatusLabel(inv.status)}</span></td></tr>))}</tbody></table></div></div>)}
                    {activeTab === 'expenses' && (<div><div className="flex justify-end mb-6"><button onClick={() => setIsExpenseModalOpen(true)} className="bg-green-600 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 shadow-sm"><Plus size={16}/> إضافة مصروف جديد</button></div><div className="border border-gray-100 rounded-2xl overflow-hidden"><table className="w-full text-right"><thead className="bg-[#f9fafb]"><tr className="text-xs font-bold text-gray-500 border-b"><th className="p-4">البيان والوصف</th><th className="p-4">التاريخ</th><th className="p-4">الفئة</th><th className="p-4">المبلغ</th><th className="p-4 w-20"></th></tr></thead><tbody className="divide-y divide-gray-50">{isLoadingExpenses ? (<tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin inline-block"/></td></tr>) : expenses.map(exp => (<tr key={exp.id} className="hover:bg-gray-50"><td className="p-4 font-bold text-[#0c2444]">{exp.description}</td><td className="p-4 text-sm text-gray-600">{exp.date}</td><td className="p-4 text-xs font-bold text-gray-500">{expenseCategories.find(cat => cat.id === exp.category)?.label || exp.category}</td><td className="p-4 text-sm font-bold text-red-600">{Number(exp.amount).toFixed(2)} JOD</td><td className="p-4 text-center"><button onClick={() => handleDeleteExpense(exp.id)} disabled={processingDeleteId === exp.id} className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50">{processingDeleteId === exp.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}</button></td></tr>))}</tbody></table></div></div>)}
                    {activeTab === 'reports' && (<div><div className="flex justify-end mb-6"><button onClick={handleExportFinancials} className="bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Download size={16}/> تصدير كملف CSV</button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FinancialCard title="إجمالي الإيرادات" value={`${totalRevenue.toFixed(2)} JOD`} icon={<TrendingUp size={24}/>} colorClass="text-green-600"/><FinancialCard title="إجمالي المصاريف" value={`${totalExpenses.toFixed(2)} JOD`} icon={<TrendingDown size={24}/>} colorClass="text-red-600"/><FinancialCard title="صافي الربح" value={`${netProfit.toFixed(2)} JOD`} icon={<DollarSign size={24}/>} colorClass="text-blue-600"/></div></div>)}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>{isExpenseModalOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"><motion.form onSubmit={handleAddExpense} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative"><button type="button" onClick={() => setIsExpenseModalOpen(false)} className="absolute top-6 left-6 p-1 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button><h3 className="text-xl font-bold text-[#0c2444] mb-6">إضافة مصروف جديد</h3><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">البيان / الوصف</label><input required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#0071e3] bg-white text-[#0c2444]" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">المبلغ (JOD)</label><input required type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#0071e3] bg-white text-[#0c2444]" /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">التاريخ</label><input required type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#0071e3] bg-white text-[#0c2444]" /></div></div><div><label className="block text-xs font-bold text-gray-500 mb-1">الفئة</label><select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-white font-bold text-sm outline-none">{expenseCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}</select></div>{newExpense.category === 'other' && (<AnimatePresence><motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}}><label className="block text-xs font-bold text-gray-500 mb-1 mt-3">وصف فئة "أخرى"</label><input required value={newExpense.customCategory} onChange={e => setNewExpense({...newExpense, customCategory: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#0071e3] bg-white text-[#0c2444]" placeholder="مثال: صيانة سيارة"/></motion.div></AnimatePresence>)}<button type="submit" disabled={isExpenseProcessing} className="w-full bg-[#0c2444] text-white py-3 rounded-xl font-bold hover:bg-[#0a1f3b] transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50">{isExpenseProcessing ? <Loader2 className="animate-spin"/> : <Check/>} {isExpenseProcessing ? 'جاري الحفظ...':'حفظ المصروف'}</button></div></motion.form></div>)}</AnimatePresence>
        </div>
    );
};

export default FinancialHub;