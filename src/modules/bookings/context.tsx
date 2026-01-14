
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Booking, VisitTask } from '../../core/types';
import { BookingService } from './service';
import { supabase } from '../../lib/supabase';

interface BookingContextType {
  bookings: Booking[];
  visitTasks: VisitTask[];
  blockedRecords: Booking[];
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<boolean>;
  updateBookingStatus: (id: string, status: string) => Promise<boolean>;
  rescheduleBooking: (id: string, newDate: string, newTime: string) => Promise<boolean>;
  deleteBooking: (id: string) => Promise<boolean>;
  toggleBlockedDate: (date: string, clientId: string | null) => Promise<void>;
  unblockDate: (date: string, clientId: string | null) => Promise<void>;
  unblockAllDates: () => Promise<void>;
  addTask: (bookingId: string, text: string, type: 'standard' | 'client_request', clientId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string, isCompleted: boolean) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<VisitTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<boolean>;
  markClientTasksAsViewed: () => Promise<void>;
  isLoading: boolean;
  refreshBookings: () => Promise<void>;
  canEditBooking: (dateStr: string) => boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children?: React.ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [visitTasks, setVisitTasks] = useState<VisitTask[]>([]);
  const [blockedRecords, setBlockedRecords] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBookings = useCallback(async () => {
    try {
      const { bookings: b, tasks: t, blockedRecords: br } = await BookingService.getBookingsAndTasks();
      setBookings(b);
      setVisitTasks(t);
      setBlockedRecords(br);
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBookings();
    const unsubscribe = BookingService.subscribe(refreshBookings);
    return () => {
        unsubscribe();
    };
  }, [refreshBookings]);

  const addBooking = useCallback(async (booking: Omit<Booking, 'id'>) => {
      if ('createdAt' in booking) {
          delete (booking as Partial<Booking>).createdAt;
      }
      const success = await BookingService.createBooking(booking);
      if (success) {
        await refreshBookings();
      } else {
        alert("فشل إنشاء الحجز. قد يكون الوقت محجوزاً أو أن هناك خطأ في البيانات. يرجى مراجعة وحدة التحكم للمطورين.");
      }
      return success;
  }, [refreshBookings]);

  const updateBookingStatus = useCallback(async (id: string, status: string) => {
      const success = await BookingService.updateStatus(id, status);
      if (success) await refreshBookings();
      return success;
  }, [refreshBookings]);

  const rescheduleBooking = useCallback(async (id: string, newDate: string, newTime: string) => {
      const success = await BookingService.reschedule(id, newDate, newTime);
      if (success) await refreshBookings();
      return success;
  }, [refreshBookings]);
  
  const deleteBooking = useCallback(async (id: string): Promise<boolean> => {
    console.log(`[CONTEXT] deleteBooking initiated for ID: ${id}`);
    try {
        console.log(`[CONTEXT] Calling BookingService.deleteBooking for ID: ${id}`);
        await BookingService.deleteBooking(id);
        console.log(`[CONTEXT] deleteBooking successful in service for ID: ${id}`);

        setBookings(prevBookings => {
            console.log(`[CONTEXT] Updating local state. Removing booking with ID: ${id}`);
            const updatedBookings = prevBookings.filter(b => b.id !== id);
            return updatedBookings;
        });

        alert("✅ تمت إزالة الموعد بنجاح.");
        return true;
    } catch (err: any) {
        console.error("[CONTEXT] Caught Delete Booking Error:", err);
        let userMessage = `❌ فشل حذف الموعد.\n\n`;
        userMessage += `الرسالة: ${err.message || 'حدث خطأ غير متوقع.'}\n`;
        if (err.details) userMessage += `التفاصيل: ${err.details}\n`;
        if (err.hint) userMessage += `تلميح من قاعدة البيانات: ${err.hint}\n`;
        
        if (err.message && (err.message.includes('permission denied') || err.message.includes('policy'))) {
            userMessage += "\n--- سبب محتمل ---\nقد تكون صلاحيات الحذف (Row Level Security) غير مفعلة في قاعدة البيانات. يرجى مراجعة الصلاحيات في Supabase.";
        }
        alert(userMessage);
        return false;
    }
  }, []);

  const unblockDate = useCallback(async (date: string, clientId: string | null) => {
    try {
      await BookingService.unblockDate(date, clientId);
      await refreshBookings();
    } catch (err: any) {
      console.error("[CONTEXT] Unblock Date Error:", err);
      alert(`❌ فشلت عملية فتح اليوم المحدد: ${err.message}`);
      throw err;
    }
  }, [refreshBookings]);

  const toggleBlockedDate = useCallback(async (date: string, clientId: string | null) => {
      try {
        await BookingService.toggleBlockDate(date, clientId);
        await refreshBookings();
      } catch (err: any) {
        console.error("[CONTEXT] Caught Toggle Block Date Error:", err.message, err);
        let userMessage = `❌ فشلت عملية قفل/فتح اليوم.\n\n`;
        userMessage += `الرسالة: ${err.message || 'حدث خطأ غير متوقع.'}\n`;
        if (err.details) userMessage += `التفاصيل: ${err.details}\n`;
        if (err.hint) userMessage += `تلميح من قاعدة البيانات: ${err.hint}\n`;
        
        if (err.message && (err.message.includes('permission denied') || err.message.includes('policy'))) {
            userMessage += "\n--- سبب محتمل ---\nقد تكون صلاحيات الحذف (Row Level Security) غير مفعلة في قاعدة البيانات لجدول 'bookings'. يرجى مراجعة سياسة الحذف (DELETE policy) والتأكد من أنها تسمح للمدير بحذف السجلات.";
        }
        alert(userMessage);
        throw err;
      }
  }, [refreshBookings]);

  const unblockAllDates = useCallback(async (): Promise<void> => {
    try {
        await BookingService.unblockAll();
        await refreshBookings();
    } catch (err: any) {
        console.error("[CONTEXT] Caught Unblock All Dates Error:", err);
        throw err;
    }
  }, [refreshBookings]);
  
  const addTask = useCallback(async (bookingId: string, text: string, type: 'standard' | 'client_request', clientId: string) => {
    await BookingService.createTask({ booking_id: bookingId || null, client_id: clientId, text, type, is_completed: false, is_viewed_by_admin: false });
    await refreshBookings();
  }, [refreshBookings]);

  const markClientTasksAsViewed = useCallback(async () => {
      // FIX: Only refresh if updates were actually made to avoid infinite loops and network spam
      const wasUpdated = await BookingService.markClientTasksAsViewed();
      if (wasUpdated) {
          await refreshBookings();
      }
  }, [refreshBookings]);

  const toggleTaskCompletion = useCallback(async (taskId: string, isCompleted: boolean) => {
    // 1. Optimistic Update
    const originalTasks = [...visitTasks];
    setVisitTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, isCompleted, status: isCompleted ? 'completed' : 'pending' } : t
    ));

    // 2. Call Service
    const { success, error } = await BookingService.updateTask(taskId, { isCompleted, status: isCompleted ? 'completed' : 'pending' });
    
    // 3. Revert on failure
    if (!success) {
      setVisitTasks(originalTasks);
      alert(`❌ فشل تحديث حالة المهمة: ${error?.message || 'خطأ غير معروف'}`);
    }
  }, [visitTasks]);
  
  const updateTask = useCallback(async (taskId: string, updates: Partial<VisitTask>) => {
      const originalTasks = [...visitTasks];
      setVisitTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      ));

      const { success, error } = await BookingService.updateTask(taskId, updates);
      
      if (!success) {
        setVisitTasks(originalTasks);
        alert(`❌ فشل حفظ التغييرات للمهمة: ${error?.message || 'خطأ غير معروف'}`);
      }
  }, [visitTasks]);

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    console.log(`[CONTEXT] deleteTask initiated for ID: ${taskId}`);
    try {
        console.log(`[CONTEXT] Calling BookingService.deleteTask for ID: ${taskId}`);
        await BookingService.deleteTask(taskId);
        console.log(`[CONTEXT] deleteTask successful in service for ID: ${taskId}`);
        
        setVisitTasks(prev => {
            console.log(`[CONTEXT] Updating local state. Removing task with ID: ${taskId}`);
            return prev.filter(t => t.id !== taskId);
        });
        
        alert("✅ تمت إزالة المهمة بنجاح.");
        return true;
    } catch (err: any) {
        console.error("Caught Delete Task Error in Context:", err);
        let userMessage = `❌ فشل حذف المهمة.\n\n`;
        userMessage += `الرسالة: ${err.message || 'حدث خطأ غير متوقع.'}\n`;
        if (err.details) userMessage += `التفاصيل: ${err.details}\n`;
        if (err.hint) userMessage += `تلميح من قاعدة البيانات: ${err.hint}\n`;

        if (err.message && (err.message.includes('permission denied') || err.message.includes('policy'))) {
            userMessage += "\n--- سبب محتمل ---\nقد تكون صلاحيات الحذف (Row Level Security) غير مفعلة في قاعدة البيانات. يرجى مراجعة الصلاحيات في Supabase.";
        }
        alert(userMessage);
        return false;
    }
  }, []);

  return (
    <BookingContext.Provider value={{ 
        bookings, visitTasks, blockedRecords, 
        addBooking, updateBookingStatus, rescheduleBooking, deleteBooking, toggleBlockedDate, unblockDate, unblockAllDates,
        addTask, toggleTaskCompletion, updateTask, deleteTask, markClientTasksAsViewed,
        isLoading, refreshBookings, 
        canEditBooking: BookingService.canEditBooking 
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within a BookingProvider');
  return context;
};
