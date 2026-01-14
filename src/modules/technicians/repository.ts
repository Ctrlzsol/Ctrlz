
import { supabase } from '../../lib/supabase';
import { Technician } from '../../core/types';
import { isValidUUID } from '../../core/utils';

export const TechnicianRepository = {
    async getAll(): Promise<Technician[]> {
        const { data, error } = await supabase
            .from('technicians')
            .select('*')
            .eq('is_deleted', false)
            .order('name', { ascending: true });
        
        if (error) {
            console.error("Supabase error fetching technicians:", error.message);
            return [];
        }
        return (data as Technician[]) || [];
    },

    async create(technician: Partial<Omit<Technician, 'id' | 'created_at'>>): Promise<{ data: Technician | null, error: any }> {
        // Exclude 'permissions' from the payload as the column does not exist in the database schema
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { permissions, ...dbPayload } = technician;

        const { data, error } = await supabase
            .from('technicians')
            .insert([dbPayload])
            .select()
            .single();
        return { data: data as Technician, error };
    },

    async update(id: string, updates: Partial<Technician>): Promise<{ data: Technician | null, error: any }> {
        if (!isValidUUID(id)) return { data: null, error: { message: 'Invalid ID' }};
        
        // Exclude 'permissions' from the payload as the column does not exist in the database schema
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { permissions, ...dbPayload } = updates;

        const { data, error } = await supabase
            .from('technicians')
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();
        return { data: data as Technician, error };
    },

    async delete(id: string): Promise<{ error: any }> {
        if (!isValidUUID(id)) return { error: { message: 'Invalid ID' }};
        const { error } = await supabase
            .from('technicians')
            .update({ is_deleted: true })
            .eq('id', id);
        return { error };
    }
};
