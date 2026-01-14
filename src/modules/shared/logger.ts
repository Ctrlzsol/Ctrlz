import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export type LogAction = 
  | 'CREATE_CLIENT' | 'UPDATE_CLIENT' | 'DELETE_CLIENT' 
  | 'CREATE_BOOKING' | 'UPDATE_BOOKING_STATUS' | 'CANCEL_BOOKING'
  | 'CREATE_TICKET' | 'DELETE_TICKET'
  | 'SYSTEM_ERROR';

export const Logger = {
  async log(action: LogAction, entity: string, entityId: string, details?: any) {
    if (!isSupabaseConfigured) return;

    // Don't log operations on local/demo data to the DB
    if (entityId.startsWith('demo-') || entityId.startsWith('local-')) {
        console.log(`[Local Log] ${action}: ${entityId}`, details);
        return;
    }

    try {
      const { error } = await supabase.from('system_logs').insert([{
        action,
        entity,
        entity_id: entityId,
        details: details || {}
      }]);
      
      if (error) console.error("Failed to write log:", error);
    } catch (err) {
      console.error("Logger exception:", err);
    }
  }
};
