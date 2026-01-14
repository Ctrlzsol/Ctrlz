
import { Ticket, TicketMessage } from '../../core/types';
import { TicketRepository } from './repository';
import { supabase } from '../../lib/supabase';

export const TicketService = {
  async getAllTickets(): Promise<Ticket[]> {
    return await TicketRepository.getAllTickets();
  },

  async createTicket(ticket: Omit<Ticket, 'id'>): Promise<void> {
    const payload = {
        client_id: ticket.clientId,
        client_name: ticket.clientName,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        // FIX: Pass new properties for affected user and set initial unread status.
        messages: ticket.messages,
        affected_user_id: ticket.affectedUserId,
        affected_user_name: ticket.affectedUserName,
        admin_has_unread: true, // New tickets are always unread for admin
        client_has_unread: false
    };
    await TicketRepository.createTicket(payload);
  },

  async updateStatus(id: string, status: string): Promise<void> {
      await TicketRepository.updateTicket(id, { status });
  },

  async deleteTicket(id: string) {
      await TicketRepository.deleteTicket(id);
  },

  async addReply(ticketId: string, reply: TicketMessage, currentMessages: TicketMessage[]): Promise<void> {
    // FIX: Update unread status based on who sent the reply.
    // Determine who the reply makes the ticket unread for.
    const isAdminReply = reply.sender === 'admin';
    const updatedMessages = [...currentMessages, reply];
    await TicketRepository.updateTicket(ticketId, { 
        messages: updatedMessages,
        client_has_unread: isAdminReply,
        admin_has_unread: !isAdminReply,
    });
  },

  // FIX: Add a function to mark a ticket as read by a specific role.
  async markAsRead(ticketId: string, readerRole: 'admin' | 'client'): Promise<void> {
      const updates = readerRole === 'admin' 
          ? { admin_has_unread: false }
          : { client_has_unread: false };
      await TicketRepository.updateTicket(ticketId, updates);
  },

  async clearNotifications(clientId?: string): Promise<void> {
    const { error } = await TicketRepository.softDeleteNotifications(clientId);
    if (error) throw error;
  },

  subscribe(callback: () => void) {
    const sub = supabase.channel('tickets_service_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, callback)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }
};
