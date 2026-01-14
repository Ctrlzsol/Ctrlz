import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Ticket, Consultation, Order, TicketMessage, RemoteSupportTicket } from '../../core/types';
import { TicketRepository } from './repository';
import { supabase } from '../../lib/supabase';

interface TicketContextType {
  tickets: Ticket[];
  consultations: Consultation[];
  orders: Order[];
  notifications: any[];
  remoteSupportTickets: RemoteSupportTicket[];
  
  // Remote Support Actions
  createRemoteSupport: (data: Omit<RemoteSupportTicket, 'id' | 'created_at' | 'status'>) => Promise<{success: boolean, error?: string}>;
  resolveRemoteSupport: (id: string, closingMsg?: any) => Promise<boolean>; 
  markRemoteSupportAsViewed: (id: string) => Promise<void>;

  // Support Actions
  addTicket: (ticket: any) => Promise<void>;
  updateTicketStatus: (id: string, status: any) => Promise<void>;
  addReply: (ticketId: string, reply: TicketMessage) => Promise<void>;
  deleteTicket: (id: string) => Promise<boolean>;
  
  // Consultation Actions
  createConsultation: (data: any) => Promise<void>;
  addConsultationReply: (id: string, reply: TicketMessage, currentMessages: TicketMessage[]) => Promise<void>;
  resolveConsultation: (id: string, closingMessage?: TicketMessage) => Promise<boolean>; 

  // Order Actions
  createOrder: (data: any) => Promise<void>;
  updateOrderStatus: (id: string, status: any) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  clearNotifications: (clientId?: string) => Promise<boolean>;
  markNotificationsAsRead: (clientId: string) => Promise<void>; 
  refreshTickets: () => Promise<void>;
  isLoading: boolean;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider = ({ children }: { children?: React.ReactNode }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [remoteSupportTickets, setRemoteSupportTickets] = useState<RemoteSupportTicket[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to prevent multiple simultaneous refreshes which cause "Failed to fetch"
  const isRefreshingRef = useRef(false);
  const debounceTimeoutRef = useRef<any>(null);

  const refreshAll = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
        // Fetch tickets
        try {
            const t = await TicketRepository.getAllTickets();
            setTickets(t);
        } catch (e) { console.error("Failed to fetch tickets", e); }

        // Fetch consultations
        try {
            const c = await TicketRepository.getAllConsultations();
            setConsultations(c);
        } catch (e) { console.error("Failed to fetch consultations", e); }

        // Fetch orders
        try {
            const o = await TicketRepository.getAllOrders();
            setOrders(o);
        } catch (e) { console.error("Failed to fetch orders", e); }

        // Fetch remote support tickets
        try {
            const remote = await TicketRepository.getRemoteSupportTickets();
            setRemoteSupportTickets(remote);
        } catch (e) { console.error("Failed to fetch remote support", e); }

        // Fetch notifications
        try {
            const n = await supabase.from('notifications')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            setNotifications(n.data || []);
        } catch (e) { console.error("Failed to fetch notifications", e); }
        
    } finally {
        isRefreshingRef.current = false;
        setIsLoading(false);
    }
  }, []);

  // Debounced refresh handler for realtime events
  const handleRealtimeUpdate = useCallback(() => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
          refreshAll();
      }, 2000); // 2 second debounce to aggregate rapid updates
  }, [refreshAll]);

  useEffect(() => {
    refreshAll();
    
    // Consolidated subscription to reduce connection overhead
    const channel = supabase.channel('tickets_global_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, handleRealtimeUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, handleRealtimeUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleRealtimeUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, handleRealtimeUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'remote_support_tickets' }, handleRealtimeUpdate)
        .subscribe();

    return () => { 
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        supabase.removeChannel(channel);
    };
  }, [refreshAll, handleRealtimeUpdate]);

  // --- REMOTE SUPPORT ---
  const createRemoteSupport = async (data: any) => {
      const result: any = await TicketRepository.createRemoteSupportTicket(data);
      if (result.error) {
          return { success: false, error: result.error.message };
      }
      refreshAll();
      return { success: true };
  };

  const resolveRemoteSupport = async (id: string, closingMsg?: any): Promise<boolean> => {
      const ticket = remoteSupportTickets.find(t => t.id === id);
      
      const { error } = await TicketRepository.updateRemoteSupportStatus(id, 'resolved'); 
      
      if (error) {
          console.error("Resolve Error:", error);
          return false;
      }

      if (ticket) {
          const { error: notifError } = await supabase.from('notifications').insert([{
              client_id: ticket.client_id,
              client_name: ticket.client_name,
              title: 'تحديث دعم فني',
              description: 'تم معالجة تذكرة الدعم عن بعد بنجاح ✅',
              is_deleted: false,
              is_read: false
          }]);
          
          if (notifError) console.error("Notification Insert Error:", notifError);
      }
      
      refreshAll();
      return true;
  };

  const markRemoteSupportAsViewed = async (id: string) => {
      await TicketRepository.updateRemoteSupportStatus(id, 'viewed'); 
      refreshAll();
  };

  // --- SUPPORT ---
  const addTicket = async (ticket: any) => { await TicketRepository.createTicket(ticket); refreshAll(); };
  const updateTicketStatus = async (id: string, status: any) => { await TicketRepository.updateTicket(id, { status }); refreshAll(); };
  const deleteTicket = async (id: string) => { await TicketRepository.deleteTicket(id); refreshAll(); return true; };
  const addReply = async (ticketId: string, reply: TicketMessage) => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
          const msgs = [...ticket.messages, reply];
          const isAdminReply = reply.sender === 'admin';
          await TicketRepository.updateTicket(ticketId, { messages: msgs, client_has_unread: isAdminReply, admin_has_unread: !isAdminReply });
          refreshAll();
      }
  };

  // --- CONSULTATIONS ---
  const createConsultation = async (data: any) => { await TicketRepository.createConsultation(data); refreshAll(); };
  
  const addConsultationReply = async (id: string, reply: TicketMessage, currentMessages: TicketMessage[]) => {
      const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
      const msgs = [...safeMessages, reply];
      await TicketRepository.updateConsultation(id, { messages: msgs, last_updated: new Date().toISOString() });
      refreshAll();
  };

  const resolveConsultation = async (id: string, closingMessage?: TicketMessage): Promise<boolean> => { 
      try {
          const { data: latestData, error: fetchError } = await TicketRepository.getConsultationById(id);
          
          if (fetchError || !latestData) {
              throw new Error("Could not fetch consultation data.");
          }

          const currentMessages = Array.isArray(latestData.messages) ? latestData.messages : [];
          const updates: any = { status: 'resolved' };
          
          if (closingMessage) {
              updates.messages = [...currentMessages, closingMessage];
              updates.last_updated = new Date().toISOString();
          }

          const { error: updateError } = await TicketRepository.updateConsultation(id, updates);
          
          if (updateError) {
              throw updateError;
          }

          setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
          
          return true;
      } catch (err: any) {
          console.error("Resolve Consultation Failed:", err);
          return false;
      }
  };

  // --- ORDERS ---
  const createOrder = async (data: any) => { await TicketRepository.createOrder(data); refreshAll(); };
  const updateOrderStatus = async (id: string, status: any) => { await TicketRepository.updateOrder(id, { status }); refreshAll(); };
  const deleteOrder = async (id: string) => { await TicketRepository.deleteOrder(id); refreshAll(); };

  // --- NOTIFICATIONS ---
  const clearNotifications = async (clientId?: string) => { await TicketRepository.softDeleteNotifications(clientId); refreshAll(); return true; };
  
  const markNotificationsAsRead = async (clientId: string) => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('client_id', clientId)
        .eq('is_read', false);
      
      refreshAll();
  };

  return (
    <TicketContext.Provider value={{ 
        tickets, consultations, orders, notifications, remoteSupportTickets,
        addTicket, updateTicketStatus, addReply, deleteTicket,
        createConsultation, addConsultationReply, resolveConsultation,
        createOrder, updateOrderStatus, deleteOrder,
        clearNotifications, markNotificationsAsRead, refreshTickets: refreshAll, isLoading,
        createRemoteSupport, resolveRemoteSupport, markRemoteSupportAsViewed
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTicket = () => {
  const context = useContext(TicketContext);
  if (!context) throw new Error('useTicket must be used within a TicketProvider');
  return context;
};