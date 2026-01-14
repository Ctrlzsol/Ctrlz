
import { supabase } from '../../lib/supabase';
import { Ticket, Consultation, Order, RemoteSupportTicket } from '../../core/types';
import { isValidUUID } from '../../core/utils';

const isNetworkError = (error: any) => {
    const msg = (error?.message || '').toLowerCase();
    return (
        msg.includes('failed to fetch') ||
        msg.includes('network request failed') ||
        msg.includes('fetch failed') ||
        msg.includes('connection error') ||
        msg.includes('timeout')
    );
};

export const TicketRepository = {
  // --- REMOTE SUPPORT TICKETS (UPDATED) ---
  async createRemoteSupportTicket(ticket: Omit<RemoteSupportTicket, 'id' | 'created_at' | 'status'>) {
      
      // 1. Check Balance First
      const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('remaining_tickets')
          .eq('id', ticket.client_id)
          .single();

      if (clientError || !clientData) {
          console.error("Client fetch error:", clientError);
          return { error: { message: "Could not fetch client data" } };
      }

      if (clientData.remaining_tickets <= 0) {
          return { error: { message: "INSUFFICIENT_BALANCE" } };
      }

      // 2. Create Ticket
      const { data: newTicket, error: ticketError } = await supabase.from('remote_support_tickets').insert([{
          client_id: ticket.client_id,
          client_name: ticket.client_name,
          user_id: ticket.user_id,
          user_name: ticket.user_name,
          issue_details: ticket.issue_details,
          anydesk_id: ticket.anydesk_id,
          ip_address: ticket.ip_address,
          status: 'sent'
      }]).select().single();

      if (ticketError) {
          console.error("Ticket create error:", ticketError);
          return { error: ticketError };
      }

      // 3. Decrement Balance
      const newBalance = Math.max(0, clientData.remaining_tickets - 1);
      const { error: updateError } = await supabase
          .from('clients')
          .update({ remaining_tickets: newBalance })
          .eq('id', ticket.client_id);

      if (updateError) {
          console.error("Balance update error:", updateError);
      }

      return { data: newTicket };
  },

  async getRemoteSupportTickets(): Promise<RemoteSupportTicket[]> {
      let retries = 3;
      while (retries > 0) {
          const { data, error } = await supabase
              .from('remote_support_tickets')
              .select('*')
              .order('created_at', { ascending: false });
          
          if (!error) {
              return data as RemoteSupportTicket[];
          }
          
          if (isNetworkError(error)) {
              console.warn(`Remote support tickets fetch retry (${4 - retries}/3)`);
              retries--;
              if (retries > 0) await new Promise(r => setTimeout(r, 2000));
          } else {
              console.error("Fatal error fetching remote support tickets:", error);
              return [];
          }
      }
      return [];
  },

  async updateRemoteSupportStatus(id: string, status: string) {
      return await supabase
          .from('remote_support_tickets')
          .update({ status })
          .eq('id', id);
  },

  // --- EXISTING SUPPORT TICKETS (Legacy/General) ---
  async getAllTickets(): Promise<Ticket[]> {
    let retries = 3;
    while (retries > 0) {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            // Only checking is_deleted on main tickets table which is known to have it
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (!error) {
            return (data || []).map((t: any) => mapTicket(t));
        }

        if (isNetworkError(error)) {
            console.warn(`Support Tickets fetch retry (${4 - retries}/3)`);
            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 2000));
        } else {
            console.error("Support Tickets Error:", error.message);
            return [];
        }
    }
    return [];
  },

  async createTicket(ticket: any) { 
      return await supabase.from('tickets').insert([{
          client_id: ticket.client_id,
          client_name: ticket.client_name,
          subject: ticket.subject,
          description: ticket.description,
          status: 'open',
          priority: ticket.priority,
          messages: ticket.messages,
          affected_user_id: ticket.affected_user_id,
          affected_user_name: ticket.affected_user_name,
          type: ticket.type || 'support', 
          admin_has_unread: true,
          client_has_unread: false
      }]);
  },

  async updateTicket(id: string, updates: any) {
    return await supabase.from('tickets').update(updates).eq('id', id);
  },

  async deleteTicket(id: string) { 
      return await supabase.from('tickets').update({ is_deleted: true }).eq('id', id);
  },

  // 2. CONSULTATIONS
  async getAllConsultations(): Promise<Consultation[]> {
      let retries = 3;
      while (retries > 0) {
          const { data, error } = await supabase
              .from('consultations')
              .select('*')
              // Removed explicit is_deleted check if column is missing/optional
              .order('last_updated', { ascending: false });

          if (!error) {
              // Manually filter is_deleted if it exists in data
              const validData = (data || []).filter((c: any) => c.is_deleted !== true);

              return validData.map((c: any) => ({
                  id: c.id,
                  clientId: c.client_id,
                  clientName: c.client_name || 'Unknown',
                  subject: c.subject,
                  status: c.status,
                  messages: c.messages || [],
                  lastUpdated: c.last_updated,
                  createdAt: c.created_at
              }));
          }

          if (isNetworkError(error)) {
              console.warn(`Consultations fetch retry (${4 - retries}/3)`);
              retries--;
              if (retries > 0) await new Promise(r => setTimeout(r, 2000));
          } else {
              console.error("Consultations Error:", error.message);
              return [];
          }
      }
      return [];
  },

  async getConsultationById(id: string) {
      return await supabase.from('consultations').select('*').eq('id', id).single();
  },

  async createConsultation(data: any) {
      return await supabase.from('consultations').insert([{
          client_id: data.client_id,
          client_name: data.client_name,
          subject: data.subject,
          status: 'open',
          messages: data.messages
      }]);
  },

  async updateConsultation(id: string, updates: any) {
      return await supabase.from('consultations').update(updates).eq('id', id).select();
  },

  // 3. ORDERS
  async getAllOrders(): Promise<Order[]> {
      let retries = 3;
      while (retries > 0) {
          const { data, error } = await supabase
              .from('orders')
              .select('*')
              // Removed explicit is_deleted check to prevent failures if column missing
              .order('created_at', { ascending: false });

          if (!error) {
              const validData = (data || []).filter((o: any) => o.is_deleted !== true);
              return validData.map((o: any) => ({
                  id: o.id,
                  clientId: o.client_id,
                  clientName: o.client_name || 'Unknown',
                  type: o.type,
                  details: o.details,
                  status: o.status,
                  createdAt: o.created_at
              }));
          }

          if (isNetworkError(error)) {
              console.warn(`Orders fetch retry (${4 - retries}/3)`);
              retries--;
              if (retries > 0) await new Promise(r => setTimeout(r, 2000));
          } else {
              console.error("Orders Error:", error.message);
              return [];
          }
      }
      return [];
  },

  async createOrder(data: any) {
      return await supabase.from('orders').insert([{
          client_id: data.client_id,
          client_name: data.client_name,
          type: data.type,
          details: data.details,
          status: 'pending'
      }]);
  },

  async updateOrder(id: string, updates: any) {
      return await supabase.from('orders').update(updates).eq('id', id);
  },

  async deleteOrder(id: string) {
      // Try soft delete first, if column missing DB error will be caught by caller usually
      return await supabase.from('orders').update({ is_deleted: true }).eq('id', id);
  },

  async softDeleteNotifications(clientId?: string) {
    if (!clientId) return { error: { message: "Client ID required" } };
    return await supabase.from('notifications').delete().eq('client_id', clientId);
  }
};

function mapTicket(t: any): Ticket {
    return {
        id: t.id,
        clientId: t.client_id,
        clientName: t.client_name || 'Unknown',
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        type: t.type || 'support', 
        date: t.created_at,
        messages: t.messages || [],
        affectedUserId: t.affected_user_id,
        affectedUserName: t.affected_user_name,
        adminHasUnread: t.admin_has_unread,
        clientHasUnread: t.client_has_unread
    };
}
