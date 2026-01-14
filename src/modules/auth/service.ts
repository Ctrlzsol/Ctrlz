
import { User } from '../../core/types';
import { AuthRepository } from './repository';
import { supabase } from '../../lib/supabase';

export const AuthService = {
  async login(credential: string, role: 'admin' | 'client' | 'technician'): Promise<User | null> {
    if (role === 'admin') {
      // 1. Check Super Admin (Hardcoded)
      if (credential === '2061294423') {
        return {
          id: 'admin-1',
          name: 'Super Admin',
          email: 'admin@ctrlz.jo',
          role: 'admin',
          avatar: 'https://ui-avatars.com/api/?name=Admin&background=0f346e&color=fff',
          permissions: ['*'] // All permissions
        };
      }

      // 2. Check Database for Custom System Users
      try {
        const { data, error } = await supabase
          .from('system_users')
          .select('*')
          .eq('access_code', credential)
          .eq('is_deleted', false) // Check deleted status
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            email: `${data.name.replace(/\s+/g, '.')}@ctrlz.jo`,
            role: 'admin',
            avatar: `https://ui-avatars.com/api/?name=${data.name}&background=0c2444&color=fff`,
            permissions: data.permissions || []
          };
        }
      } catch (err) {
        console.error("System user auth error:", err);
      }

      return null;
    } 
    
    if (role === 'technician') {
        return await AuthRepository.findTechnicianByCredential(credential);
    }

    return await AuthRepository.findClientByAccessCode(credential);
  }
};
