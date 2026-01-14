
import { Invoice, InvoiceStatus } from '../../core/types';
import { InvoiceRepository } from './repository';
import { supabase } from '../../lib/supabase';

export const BillingService = {
  async getAllInvoices(): Promise<Invoice[]> {
    return await InvoiceRepository.getAll();
  },

  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<void> {
    const payload = {
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      invoice_number: invoice.invoiceNumber,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      status: invoice.status,
      total_amount: invoice.totalAmount,
      currency: invoice.currency,
      billing_period: invoice.billingPeriod,
      items: invoice.items,
      sub_total: invoice.subTotal ?? invoice.totalAmount,
      discount_applied: invoice.discountApplied ?? 0,
      is_published: invoice.isPublished ?? false
    };
    const { error } = await InvoiceRepository.create(payload);
    if (error) {
        console.error("Invoice service failed to create invoice. Error:", error);
        throw error;
    }
  },

  async updateStatus(id: string, status: InvoiceStatus): Promise<void> {
      await InvoiceRepository.update(id, { status });
  },

  async updateInvoiceDetails(id: string, updates: Partial<Invoice>): Promise<void> {
      // Map UI fields to DB fields
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
      if (updates.items) dbUpdates.items = updates.items;
      if (updates.issueDate) dbUpdates.issue_date = updates.issueDate;
      if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
      if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
      if (updates.subTotal !== undefined) dbUpdates.sub_total = updates.subTotal;
      if (updates.discountApplied !== undefined) dbUpdates.discount_applied = updates.discountApplied;

      await InvoiceRepository.update(id, dbUpdates);
  },

  async updatePublishStatus(id: string, isPublished: boolean): Promise<void> {
      await InvoiceRepository.update(id, { is_published: isPublished });
  },

  subscribe(callback: () => void) {
    const sub = supabase.channel('invoices_service_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, callback)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }
};
