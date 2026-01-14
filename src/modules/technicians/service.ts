import { Technician } from '../../core/types';
import { TechnicianRepository } from './repository';
import { supabase } from '../../lib/supabase';

export const TechnicianService = {
    async getAll(): Promise<Technician[]> {
        return await TechnicianRepository.getAll();
    },

    async create(data: Omit<Technician, 'id' | 'created_at'>): Promise<boolean> {
        const { error } = await TechnicianRepository.create(data);
        if (error) {
            console.error("Error creating technician:", error.message);
            return false;
        }
        return true;
    },

    async update(id: string, updates: Partial<Technician>): Promise<boolean> {
        const { error } = await TechnicianRepository.update(id, updates);
        if (error) {
            console.error("Error updating technician:", error.message);
            return false;
        }
        return true;
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await TechnicianRepository.delete(id);
        if (error) {
            console.error("Error deleting technician:", error.message);
            return false;
        }
        return true;
    },

    subscribe(callback: () => void) {
        return supabase
            .channel('technicians_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, callback)
            .subscribe();
    }
};
