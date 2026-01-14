import { supabase } from '../../lib/supabase';
import { ClientProfile, Technician, User } from '../../core/types';

export const AuthRepository = {
  async findClientByAccessCode(code: string): Promise<ClientProfile | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('access_code', code)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error || !data) {
        console.warn("Auth check failed or client not found:", error?.message);
        return null;
      }

      return mapClient(data);
    } catch (err) {
      console.error("Critical error in findClientByAccessCode:", err);
      return null;
    }
  },

  async findTechnicianByCredential(credential: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('technicians')
            .select('*')
            .eq('credential', credential)
            .eq('is_deleted', false)
            .maybeSingle();

        if (error || !data) {
            console.warn("Technician auth check failed:", error?.message);
            return null;
        }

        return {
            id: data.id,
            name: data.name,
            email: `${data.credential}@ctrlz.jo`, // Placeholder email
            role: 'technician',
        };
    } catch (err) {
        console.error("Critical error in findTechnicianByCredential:", err);
        return null;
    }
  }
};

function mapClient(data: any): ClientProfile {
    return {
        id: data.id,
        name: data.contact_person || 'Unknown',
        email: data.email,
        role: 'client',
        companyName: data.company_name || 'Unknown Company',
        phone: data.phone || '',
        status: data.status || 'active',
        packageId: data.package_id || 'business-core',
        accessCode: data.access_code || '',
        // الرقم المرجعي هو المفتاح الأساسي للمزامنة بين اللوحات
        referenceNumber: data.reference_number || `CZ-${String(data.id).slice(0, 5)}`,
        logo: data.logo || '',
        remainingVisits: data.remaining_visits || 0,
        remainingTickets: data.remaining_tickets || 0,
        totalVisits: data.total_visits || 0,
        totalTickets: data.total_tickets || 0,
        activeUsers: data.active_users || 0,
        totalUsersLimit: data.total_users_limit || 0,
        joinedDate: data.created_at || new Date().toISOString(),
        licenseKeys: data.license_keys || {},
        usersList: data.users_list || [],
        contractStartDate: data.contract_start_date || '',
        contractDurationMonths: data.contract_duration_months || 12,
        discountPercentage: data.discount_percentage || 0
    };
}