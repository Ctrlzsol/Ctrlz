
import React, { useEffect } from 'react';
import { Invoice } from '../../core/types';
import { Phone, Globe, X, Printer, FileText, Wrench, Mail, ShieldCheck } from 'lucide-react';
import { useLogo } from '../../core/contexts/LogoContext';

interface InvoiceTemplateProps {
  invoice: Invoice;
  onClose?: () => void;
  onPrint?: () => void;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, onClose }) => {
  const { customLogoData } = useLogo();
  
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} JD`;
  };

  const handlePrint = () => {
      // Small delay to ensure render
      setTimeout(() => {
          window.print();
      }, 300);
  };

  const subTotal = invoice.subTotal || invoice.totalAmount;
  const discountAmount = invoice.discountApplied || 0;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex justify-center overflow-y-auto font-sans">
      
      {/* Controls */}
      <div className="fixed top-6 left-6 flex gap-3 z-[100000] print:hidden pointer-events-auto">
        <button 
          onClick={handlePrint} 
          className="bg-[#0C2444] text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-[#0a1f3b] transition-all flex items-center gap-2 border border-white/10 cursor-pointer active:scale-95"
        >
          <Printer size={18}/> طباعة / حفظ PDF
        </button>
        <button 
          onClick={onClose} 
          className="bg-white text-gray-700 w-12 h-12 rounded-full font-bold shadow-2xl hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer active:scale-95"
        >
          <X size={20}/>
        </button>
      </div>

      {/* Container */}
      <div className="min-h-full w-full flex items-start justify-center p-8 md:p-12 print:p-0 print:m-0 print:block">
          <div className="shadow-2xl print:shadow-none bg-white rounded-lg overflow-hidden ring-1 ring-gray-200 w-full max-w-[210mm] print:w-full print:max-w-none relative z-10 print:static">
              {/* PRINT AREA ID IS CRITICAL FOR CSS ISOLATION */}
              <div id="invoice-print-area" className="bg-white w-[210mm] min-h-[297mm] relative mx-auto text-[#0C2444] flex flex-col justify-between print:w-full print:h-auto print:absolute print:top-0 print:left-0 print:m-0" dir="rtl">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 print:opacity-[0.03]" 
                     style={{ backgroundImage: 'radial-gradient(#0C2444 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }}>
                </div>

                {/* Top Border Strip */}
                <div className="h-4 w-full bg-[#0C2444] print:h-4 print:bg-[#0C2444] print-color-adjust-exact"></div>

                {/* === CONTENT WRAPPER === */}
                <div className="p-14 pb-6 flex-1 relative z-10 print:p-10">
                    
                    {/* 1. HEADER */}
                    <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-10">
                        
                        {/* Right: Brand & Contact Info */}
                        <div className="flex flex-col items-start pt-2 w-[60%]">
                            
                            {/* Logo - INCREASED SIZE HERE (h-64) */}
                            <div className="h-64 w-auto relative flex items-center justify-start mb-6 -mr-4">
                                {customLogoData ? (
                                    <img 
                                        src={customLogoData} 
                                        alt="Logo" 
                                        className="h-full w-auto object-contain drop-shadow-xl" 
                                    />
                                ) : (
                                    <div className="text-[#0C2444]">
                                        <h1 className="text-8xl font-black tracking-tighter font-logo drop-shadow-xl">Ctrl <span className="text-[#0071E3]">z</span></h1>
                                    </div>
                                )}
                            </div>
                            
                            {/* Contact Details */}
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5 text-xs font-bold text-gray-500">
                                    <p className="flex items-center justify-start gap-2" dir="ltr">
                                        <span className="font-mono text-sm text-[#0c2444] text-right w-full">+962 7 8887 7285</span> 
                                        <Phone size={16} className="text-[#0071E3]"/>
                                    </p>
                                    <p className="flex items-center justify-start gap-2" dir="ltr">
                                        <span className="font-medium text-[#0c2444] text-right w-full">www.be-canvas.com</span> 
                                        <Globe size={16} className="text-[#0071E3]"/>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Left: Invoice Title & Meta */}
                        <div className="text-left flex flex-col items-end pt-8 w-[40%]">
                            <h1 className="text-4xl font-black text-[#0C2444] uppercase tracking-tighter mb-2 whitespace-nowrap">فاتورة خدمات تقنية</h1>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-10">Technical Services Invoice</p>
                            
                            <div className="bg-white rounded-2xl border-2 border-gray-100 w-full max-w-[260px] overflow-hidden shadow-sm print:border-2 print:border-gray-300">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center gap-4">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">رقم الفاتورة</span>
                                    <span className="font-mono font-black text-[#0c2444] text-lg">{invoice.invoiceNumber}</span>
                                </div>
                                <div className="p-4 flex justify-between items-center gap-4">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">التاريخ</span>
                                    <span className="font-bold text-[#0c2444] text-sm font-mono">{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. CLIENT SECTION */}
                    <div className="mb-14">
                        <div className="flex flex-col md:flex-row gap-8 items-stretch">
                            <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-8 border border-gray-200 relative group overflow-hidden print:bg-gray-50 print:border print:border-gray-300 print-color-adjust-exact">
                                <div className="absolute top-0 right-0 w-2 h-full bg-[#0C2444] print:bg-[#0C2444]"></div>
                                
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                    <UserIcon /> بيانات العميل (Bill To)
                                </p>
                                <h2 className="text-3xl font-black text-[#0C2444] mb-3 relative z-10">{invoice.clientName}</h2>
                                <p className="text-base text-gray-600 font-medium relative z-10 leading-relaxed">نقدر ثقتكم بنا في تطوير بنيتكم التقنية.</p>
                            </div>
                            <div className="hidden md:block w-1/4"></div>
                        </div>
                    </div>

                    {/* 3. TABLE */}
                    <div className="mb-12">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#0C2444] text-white text-xs font-bold uppercase tracking-wider print:bg-[#0C2444] print:text-white print-color-adjust-exact">
                                    <th className="py-4 px-6 text-right rounded-r-xl w-1/2 print:rounded-none">الوصف / الخدمة</th>
                                    <th className="py-4 px-6 text-center">الكمية</th>
                                    <th className="py-4 px-6 text-center">السعر الفردي</th>
                                    <th className="py-4 px-6 text-left rounded-l-xl print:rounded-none">المجموع</th>
                                </tr>
                            </thead>
                            <tbody className="text-[#0C2444]">
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors print:border-gray-200">
                                        <td className="py-6 px-6">
                                            <p className="font-bold text-base mb-1">{item.description}</p>
                                        </td>
                                        <td className="py-6 px-6 text-center font-mono font-bold text-base text-gray-600">{item.quantity}</td>
                                        <td className="py-6 px-6 text-center font-mono font-bold text-base text-gray-600">{item.amount.toFixed(2)}</td>
                                        <td className="py-6 px-6 text-left font-black text-lg">
                                            {formatCurrency(item.amount * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. FOOTER LAYOUT */}
                    <div className="flex flex-col md:flex-row items-start justify-between gap-12 mt-auto relative break-inside-avoid">
                        
                        {/* Right Side: Notes */}
                        <div className="w-full md:w-1/2 order-2 md:order-1 pt-4">
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 relative print:border-2 print:border-gray-300">
                                <div className="flex items-center gap-2 mb-4 text-[#0c2444]">
                                    <FileText size={18} className="text-[#0071E3]" />
                                    <h4 className="font-bold text-sm uppercase tracking-wide">شروط الدفع والملاحظات</h4>
                                </div>
                                <ul className="text-xs font-bold text-gray-500 space-y-3 leading-relaxed list-disc list-inside marker:text-[#0071E3]">
                                    <li>يرجى إتمام عملية الدفع خلال 5 أيام عمل من تاريخ الفاتورة.</li>
                                    <li>جميع الأسعار بالدينار الأردني (JOD).</li>
                                    <li>للاستفسارات التقنية، يرجى التواصل مع الدعم الفني.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Left Side: Total Box & Stamp */}
                        <div className="w-full md:w-1/2 order-1 md:order-2 flex flex-col items-end gap-8 relative">
                            
                            <div className="bg-[#0C2444] text-white rounded-3xl p-10 min-w-[340px] shadow-2xl relative overflow-hidden z-10 print:bg-[#0C2444] print:text-white print:border-none print-color-adjust-exact">
                                <div className="relative z-20 space-y-5">
                                    <div className="flex justify-between items-center text-sm text-blue-100/80 border-b border-white/10 pb-4">
                                        <span>المجموع الفرعي</span>
                                        <span className="font-mono text-white tracking-wider text-base">{formatCurrency(subTotal)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                                        <span className="text-green-400 font-bold flex items-center gap-2">
                                            قيمة الخصم
                                            {discountAmount > 0 && <span className="bg-green-500/20 px-2 py-0.5 rounded text-[10px] text-green-300 print:text-green-600 print:bg-transparent">Applied</span>}
                                        </span>
                                        <span className="font-mono tracking-wider text-green-400 font-bold text-base print:text-green-400">
                                            {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : '0.00 JD'}
                                        </span>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-[#0071E3] mb-2 print:text-blue-300">الإجمالي المطلوب</p>
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="text-6xl font-black tracking-tighter">{invoice.totalAmount.toFixed(2)}</span>
                                            <span className="text-xl font-bold opacity-80 bg-white/10 px-3 py-1 rounded print:bg-transparent print:text-white">JOD</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stamp */}
                            <div className="relative w-full h-32 flex justify-center md:justify-end mt-[-40px] z-0 opacity-80 pointer-events-none select-none print:opacity-100">
                                <div className="transform rotate-[-10deg] border-[4px] border-[#0071E3] rounded-full w-48 h-48 flex items-center justify-center opacity-40 p-2 print:border-4 print:border-[#0071E3]">
                                    <div className="border-2 border-dashed border-[#0071E3] rounded-full w-full h-full flex flex-col items-center justify-center text-center">
                                        <ShieldCheck size={32} className="text-[#0071E3] mb-2"/>
                                        <span className="text-[#0c2444] font-black text-2xl uppercase tracking-tight leading-none">Ctrl Z</span>
                                        <span className="text-[#0071E3] font-bold text-[10px] uppercase tracking-[0.4em] mt-1">Certified</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* 5. FOOTER STRIP */}
                <div className="bg-[#0C2444] text-white px-14 py-8 mt-6 relative print:bg-[#0C2444] print-color-adjust-exact">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Wrench size={16} className="text-[#0071E3]"/> نعيد أجهزتكم إلى أفضل أداء!
                            </h3>
                            <p className="text-[9px] text-blue-200/60 uppercase tracking-widest font-bold mt-1">Canvas Technical Ecosystem v2.1</p>
                        </div>
                        
                        <div className="flex items-center gap-10 text-[11px] font-bold text-gray-300">
                            <div className="flex items-center gap-2" dir="ltr">
                                <Mail size={16} className="text-[#0071E3]"/> <span>info@be-canvas.com</span>
                            </div>
                            <div className="flex items-center gap-2" dir="ltr">
                                <Globe size={16} className="text-[#0071E3]"/> <span>www.be-canvas.com</span>
                            </div>
                        </div>
                    </div>
                </div>

              </div>
          </div>
      </div>
      
      <style>{`
        @media print {
            /* Hide all body elements by default */
            body > * {
                visibility: hidden !important;
                display: none !important;
            }
            
            /* Show only the print area and its children */
            body > div:has(#invoice-print-area),
            #invoice-print-area, 
            #invoice-print-area * {
                visibility: visible !important;
                display: block !important;
            }

            /* Reset body/page for printing */
            body, html {
                background: white !important;
                height: 100%;
                overflow: visible !important;
            }

            /* Positioning the print area absolutely at top left */
            #invoice-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 999999 !important;
            }

            /* Force color printing */
            .print-color-adjust-exact {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            @page {
                size: A4;
                margin: 0;
            }
        }
      `}</style>
    </div>
  );
};

// Simple User Icon Component for cleaner code
const UserIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

export default InvoiceTemplate;
