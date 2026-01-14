
import { Booking, VisitTask } from '../../core/types';
import { BookingRepository } from './repository';
import { supabase } from '../../lib/supabase';

export const BookingService = {
  async getBookingsAndTasks(): Promise<{ bookings: Booking[], tasks: VisitTask[], blockedRecords: Booking[] }> {
    const [bookingsData, tasksData, blockedDaysData] = await Promise.all([
      BookingRepository.getAll(),
      BookingRepository.getTasks(),
      BookingRepository.getBlockedDays()
    ]);

    return { bookings: bookingsData, tasks: tasksData, blockedRecords: blockedDaysData };
  },

  async createBooking(booking: Omit<Booking, 'id'>): Promise<boolean> {
    const payload = {
      client_id: booking.clientId,
      client_name: booking.clientName,
      date: booking.date,
      type: booking.type,
      status: booking.status || 'pending',
      time: booking.time || '09:00 AM',
      branch_id: booking.branchId,
      branch_name: booking.branchName,
    };
    const { error } = await BookingRepository.create(payload);
    if (error) {
      console.error("Supabase createBooking error:", error);
    }
    return !error;
  },

  async updateStatus(id: string, status: string): Promise<boolean> {
    const { error } = await BookingRepository.update(id, { status });
    return !error;
  },

  async reschedule(id: string, newDate: string, newTime: string): Promise<boolean> {
    const { error } = await BookingRepository.update(id, { date: newDate, time: newTime });
    return !error;
  },

  async deleteBooking(id: string) {
    await BookingRepository.delete(id);
  },

  async unblockDate(date: string, filterClientId: string | null): Promise<void> {
      const { data: existingBlock, error: findError } = await BookingRepository.findBlock(date, filterClientId);
      if (findError) {
          console.error("Error finding block to unblock:", findError);
          throw findError;
      }
      if (existingBlock && existingBlock.status === 'closed') {
          const { error: updateError } = await BookingRepository.updateBlock(existingBlock.id, { status: 'open' });
          if (updateError) {
              console.error("Error updating block status to open:", updateError);
              throw updateError;
          }
      }
  },

  subscribe(callback: () => void) {
    const sub = supabase.channel('bookings_service_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_tasks' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_days' }, callback)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  },

  async toggleBlockDate(date: string, clientId: string | null): Promise<void> {
    const { data: existingBlock, error: findError } = await BookingRepository.findBlock(date, clientId);
    if (findError) {
        console.error("Error finding block:", findError);
        throw findError;
    }

    if (existingBlock) {
        const newStatus = existingBlock.status === 'closed' ? 'open' : 'closed';
        const { error: updateError } = await BookingRepository.updateBlock(existingBlock.id, { status: newStatus });
        if (updateError) {
            console.error("Error updating block:", updateError);
            throw updateError;
        }
    } else {
        const newBlock = { date, client_id: clientId, status: 'closed' };
        const { error: createError } = await BookingRepository.createBlock(newBlock);
        if (createError) {
            console.error("Error creating block:", createError);
            throw createError;
        }
    }
  },

  async unblockAll(): Promise<void> {
      const { error } = await BookingRepository.unblockAllDates();
      if (error) throw error;
  },

  async createTask(task: any): Promise<void> {
      await BookingRepository.createTask(task);
  },

  async updateTask(id: string, updates: any): Promise<{ success: boolean; error?: any }> {
      const { error } = await BookingRepository.updateTask(id, updates);
      if (error) {
        return { success: false, error };
      }
      return { success: true };
  },

  async deleteTask(id: string): Promise<void> {
      await BookingRepository.deleteTask(id);
  },

  async markClientTasksAsViewed(): Promise<boolean> {
      // First, get all tasks that need to be updated.
      const { data: tasksToUpdate, error: fetchError } = await supabase
          .from('visit_tasks')
          .select('id')
          .eq('is_viewed_by_admin', false)
          .eq('type', 'client_request');
      
      if (fetchError) {
          console.error("Error fetching tasks to mark as viewed:", JSON.stringify(fetchError, null, 2));
          return false;
      }
      
      // FIX: If no tasks found, return false to prevent unnecessary context refresh
      if (!tasksToUpdate || tasksToUpdate.length === 0) {
          return false; 
      }
      
      // Then, update each task individually.
      const updatePromises = tasksToUpdate.map(task => 
          supabase
              .from('visit_tasks')
              .update({ is_viewed_by_admin: true })
              .eq('id', task.id)
      );
      
      const results = await Promise.all(updatePromises);
      const errors = results.filter(res => res.error);

      if (errors.length > 0) {
          console.error("Failed to update one or more tasks:", JSON.stringify(errors.map(e => e.error), null, 2));
          // We return true anyway if partial success, to trigger refresh, 
          // but logging errors helps debug RLS issues.
          return true;
      }

      return true;
  },

  canEditBooking: (dateStr: string, timeStr?: string) => {
    if (!timeStr) {
        const visitDate = new Date(dateStr);
        const now = new Date();
        return (visitDate.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24;
    }
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) {
        hours = modifier.toUpperCase() === 'AM' ? 0 : 12;
    } else if (modifier.toUpperCase() === 'PM') {
        hours += 12;
    }
    const visitDateTime = new Date(dateStr);
    visitDateTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    return (visitDateTime.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24;
  }
};
