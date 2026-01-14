
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceStatus } from '../../core/types';
import { BillingService } from './service';
import { supabase } from '../../lib/supabase';

// Helper to access Repository directly for delete since Service might not expose it identically
import { InvoiceRepository } from './repository';

interface InvoiceContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  updateInvoiceDetails: (id: string, updates: Partial<Invoice>) => Promise<void>;
  togglePublishStatus: (id: string, isPublished: boolean) => Promise<void>;
  deleteInvoice: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider = ({ children }: { children?: React.ReactNode }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshInvoices = useCallback(async () => {
    setIsLoading(true);
    const data = await BillingService.getAllInvoices();
    setInvoices(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshInvoices();
    const sub = supabase.channel('invoices_ctx_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, refreshInvoices)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [refreshInvoices]);

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    try {
        await BillingService.createInvoice(invoice);
        refreshInvoices();
    } catch (error: any) {
        console.error("Error creating invoice in context:", error);
        alert(`فشل إنشاء الفاتورة. الخطأ من قاعدة البيانات: ${error.message}`);
    }
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    await BillingService.updateStatus(id, status);
    refreshInvoices();
  };

  const updateInvoiceDetails = async (id: string, updates: Partial<Invoice>) => {
      await BillingService.updateInvoiceDetails(id, updates);
      refreshInvoices();
  };

  const togglePublishStatus = async (id: string, isPublished: boolean) => {
    await BillingService.updatePublishStatus(id, isPublished);
    refreshInvoices();
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
      console.log(`[CONTEXT] deleteInvoice initiated for ID: ${id}`);
      try {
          console.log(`[CONTEXT] Calling InvoiceRepository.delete for ID: ${id}`);
          await InvoiceRepository.delete(id);
          console.log(`[CONTEXT] deleteInvoice successful in repository for ID: ${id}`);
          
          setInvoices(prev => {
              console.log(`[CONTEXT] Updating local state. Removing invoice with ID: ${id}`);
              return prev.filter(inv => inv.id !== id);
          });

          alert("✅ تمت إزالة الفاتورة بنجاح.");
          return true;
      } catch (err: any) {
          console.error("Caught Delete Invoice Error in Context:", err);
          let userMessage = `❌ فشل حذف الفاتورة.\n\n`;
          userMessage += `الرسالة: ${err.message || 'حدث خطأ غير متوقع.'}\n`;
          if (err.details) userMessage += `التفاصيل: ${err.details}\n`;
          if (err.hint) userMessage += `تلميح من قاعدة البيانات: ${err.hint}\n`;

          if (err.message && (err.message.includes('permission denied') || err.message.includes('policy'))) {
              userMessage += "\n--- سبب محتمل ---\nقد تكون صلاحيات الحذف (Row Level Security) غير مفعلة في قاعدة البيانات. يرجى مراجعة الصلاحيات في Supabase.";
          }
          alert(userMessage);
          return false;
      }
  };

  return (
    <InvoiceContext.Provider value={{ invoices, addInvoice, updateInvoiceStatus, updateInvoiceDetails, togglePublishStatus, deleteInvoice, isLoading }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within a InvoiceProvider');
  }
  return context;
};
