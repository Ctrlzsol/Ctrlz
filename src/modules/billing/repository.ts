
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../core/types';
import { isValidUUID } from '../../core/utils';

export const InvoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            company_name,
            reference_number
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase Invoices Fetch Error:", error.message);
        return [];
    }

    if (data) return data.map((inv: any) => mapInvoice(inv));
    return [];
  },

  async create(inv: any) { 
      const payload = { 
          ...inv,
          is_deleted: false
      };
      const result = await supabase.from('invoices').insert([payload]);
      if (result.error) {
          console.error("Supabase insert error in InvoiceRepository:", result.error);
      }
      return result;
  },

  async update(id: string, updates: any) { 
      if (!isValidUUID(id)) return { data: null, error: { message: 'Invalid ID' } };
      return await supabase.from('invoices').update(updates).eq('id', id); 
  },

  async delete(id: string) { 
      if (!isValidUUID(id)) throw new Error('Invalid UUID provided for deletion.');
      const { error } = await supabase
        .from('invoices')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) {
        console.error("Supabase Invoice Soft Delete Error:", error);
        throw error;
      }
  }
};

function mapInvoice(inv: any): Invoice {
    const clientData = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    return {
        id: inv.id,
        clientId: inv.client_id,
        clientName: clientData?.company_name || inv.client_name || 'Unknown Client',
        invoiceNumber: inv.invoice_number || `INV-${String(inv.id).substring(0,6)}`,
        issueDate: inv.issue_date || inv.created_at || new Date().toISOString(),
        dueDate: inv.due_date,
        status: inv.status,
        totalAmount: inv.total_amount,
        currency: inv.currency || 'JOD',
        billingPeriod: inv.billing_period || 'One Time',
        items: inv.items || [], 
        subTotal: inv.sub_total || inv.total_amount,
        discountApplied: inv.discount_applied || 0,
        isPublished: inv.is_published
    };
}
