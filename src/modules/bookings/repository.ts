
import { supabase } from '../../lib/supabase';
import { Booking, VisitTask } from '../../core/types';
import { isValidUUID } from '../../core/utils';

export const BookingRepository = {
  async getAll() {
    // FIX: Switched to standard join and in-memory filtering to improve stability
    // and avoid 'Failed to fetch' errors that can occur with complex !inner joins on some connections.
    const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (
            company_name,
            reference_number,
            is_deleted
          )
        `)
        .eq('is_deleted', false)
        .order('date', { ascending: true });
        
    if (error) {
        console.error("Supabase Booking Fetch Error:", JSON.stringify(error, null, 2));
        return [];
    }
    
    // Filter out bookings where client is null or deleted
    const validData = (data || []).filter((b: any) => {
        const client = Array.isArray(b.clients) ? b.clients[0] : b.clients;
        // If client is missing (null), it might be a data integrity issue, but we still valid the booking if it exists.
        // However, the requirement is usually to show active clients' bookings.
        // If client is explicitly marked deleted, hide it.
        return !client?.is_deleted;
    });

    return validData.map((b: any) => mapBooking(b));
  },

  async getBlockedDays() {
    // FIX: Filter out blocked days for deleted clients by joining.
    // We cannot use .eq('is_deleted', false) on calendar_days if the column doesn't exist.
    const { data, error } = await supabase
        .from('calendar_days')
        .select(`
            *,
            clients (
                is_deleted
            )
        `)
        .eq('status', 'closed');

    if (error) {
        console.error("Supabase Blocked Days Fetch Error:", JSON.stringify(error, null, 2));
        return [];
    }

    // Filter in memory: Keep blocks that have no client (global) OR have a non-deleted client.
    const validData = (data || []).filter((d: any) => {
        if (!d.client_id) return true; // Global block
        const client = Array.isArray(d.clients) ? d.clients[0] : d.clients;
        return !client?.is_deleted;
    });

    // Map to a Booking-like structure for compatibility
    return validData.map((d: any) => ({
        id: d.id,
        clientId: d.client_id,
        clientName: 'Blocked Day',
        date: d.date,
        time: '00:00',
        type: 'system',
        status: 'Blocked',
        is_blocked: true,
        createdAt: d.created_at,
    }));
  },

  async getTasks() {
    const { data, error } = await supabase
        .from('visit_tasks')
        .select(`
            *,
            bookings ( date )
        `)
        .eq('is_deleted', false);
    
    if (error) {
        console.error("Tasks Fetch Error:", JSON.stringify(error, null, 2));
        return [];
    }
    return data ? data.map((t: any) => mapTask(t)) : [];
  },

  async create(booking: any) {
    const clientId = booking.client_id || booking.clientId;

    if (!clientId) {
        const errorMessage = "A client ID is required to create a booking.";
        console.error(errorMessage, booking);
        return { data: null, error: { message: errorMessage } };
    }

    const dbPayload: any = {
        date: booking.date,
        time: booking.time,
        type: booking.type,
        status: booking.status,
        is_deleted: false,
        client_id: clientId,
        client_name: booking.client_name,
        branch_id: booking.branch_id,
        branch_name: booking.branch_name,
    };

    return await supabase.from('bookings').insert([dbPayload]).select().single();
  },

  async update(id: string, updates: any) { 
      if (!isValidUUID(id)) return { data: null, error: { message: 'Invalid ID' } };
      return await supabase.from('bookings').update(updates).eq('id', id);
  },
  
  async delete(id: string) { 
    if (!isValidUUID(id)) throw new Error('Invalid UUID provided for deletion.');
    const { error } = await supabase
      .from('bookings')
      .update({ is_deleted: true })
      .eq('id', id);
    if (error) {
        console.error("Supabase Booking Soft Delete Error:", JSON.stringify(error, null, 2));
        throw error;
    }
  },

  async unblockAllDates() {
    const { error } = await supabase.from('calendar_days').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.error("Supabase 'unblockAllDates' (delete) error:", JSON.stringify(error, null, 2));
        throw error;
    }
    return { error: null };
  },

  async createTask(task: any) { 
      const dbPayload = {
          client_id: task.client_id,
          booking_id: task.booking_id, 
          task_name: task.text,
          is_completed: task.is_completed || false,
          status: 'pending',
          is_deleted: false,
          type: task.type || 'standard',
          // FIX: Include is_viewed_by_admin flag in task creation payload.
          is_viewed_by_admin: task.is_viewed_by_admin || false,
      };
      return await supabase.from('visit_tasks').insert([dbPayload]).select().single();
  },

  async updateTask(id: string, updates: any) {
    if (!isValidUUID(id)) return { data: null, error: { message: 'Invalid ID' } };

    // Explicitly map camelCase properties to snake_case DB columns
    const dbPayload: any = {};
    
    if (updates.text !== undefined) dbPayload.task_name = updates.text;
    if (updates.bookingId !== undefined) dbPayload.booking_id = updates.bookingId;
    if (updates.clientId !== undefined) dbPayload.client_id = updates.clientId;
    if (updates.isCompleted !== undefined) dbPayload.is_completed = updates.isCompleted;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.notes !== undefined) dbPayload.notes = updates.notes;
    if (updates.reason !== undefined) dbPayload.reason = updates.reason;
    if (updates.type !== undefined) dbPayload.type = updates.type;
    if (updates.isViewedByAdmin !== undefined) dbPayload.is_viewed_by_admin = updates.isViewedByAdmin;

    console.log('[BookingRepository] Updating task:', id, 'Payload:', dbPayload);

    const { data, error } = await supabase
        .from('visit_tasks')
        .update(dbPayload)
        .eq('id', id)
        .select();

    if (error) {
        console.error('[BookingRepository] Update Error:', JSON.stringify(error, null, 2));
        return { data: null, error };
    }

    return { data, error: null };
  },

  async deleteTask(id: string) { 
      if (!isValidUUID(id)) throw new Error('Invalid UUID provided for deletion.');
      const { error } = await supabase
        .from('visit_tasks')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) {
        console.error("Supabase Task Soft Delete Error:", JSON.stringify(error, null, 2));
        throw error;
      }
  },
  
  // FIX: Add methods to manage calendar day blocks
  async findBlock(date: string, clientId: string | null) {
    let query = supabase.from('calendar_days').select('*').eq('date', date);
    if (clientId) {
        query = query.eq('client_id', clientId);
    } else {
        query = query.is('client_id', null);
    }
    return query.maybeSingle();
  },

  async updateBlock(id: string, updates: any) {
      return await supabase.from('calendar_days').update(updates).eq('id', id);
  },

  async createBlock(block: any) {
      return await supabase.from('calendar_days').insert([block]).select().single();
  },
};

function mapBooking(b: any): Booking {
    // Supabase returns related objects differently based on version/query
    const clientData = Array.isArray(b.clients) ? b.clients[0] : b.clients;
    return {
        id: b.id,
        clientId: b.client_id,
        clientName: clientData?.company_name || b.client_name || 'عميل محذوف',
        date: b.date,
        time: b.time || '09:00 AM',
        type: b.type || 'on-site', 
        status: b.status,
        is_blocked: b.status === 'Blocked',
        branchId: b.branch_id,
        branchName: b.branch_name,
        createdAt: b.created_at
    };
}

function mapTask(t: any): VisitTask {
    const bookingData = Array.isArray(t.bookings) ? t.bookings[0] : t.bookings;
    return {
        id: t.id, 
        bookingId: t.booking_id, 
        text: t.task_name, 
        isCompleted: t.is_completed, 
        status: t.status || (t.is_completed ? 'completed' : 'pending'),
        notes: t.notes || '',
        reason: t.reason || '',
        type: t.type || 'standard', 
        clientId: t.client_id, 
        visitDate: bookingData?.date || t.created_at,
        // FIX: Map is_viewed_by_admin from database to the application type.
        isViewedByAdmin: t.is_viewed_by_admin || false,
    };
}
