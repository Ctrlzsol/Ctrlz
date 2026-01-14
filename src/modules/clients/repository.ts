
import { supabase } from '../../lib/supabase';
import { ClientProfile } from '../../core/types';
import { isValidUUID } from '../../core/utils';

export const ClientRepository = {
  async getAll(): Promise<ClientProfile[]> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Supabase fetch error:", error.message);
        return [];
    }

    return (data || []).map((c: any) => mapClientFromDB(c));
  },

  async create(client: any) {
    const dbPayload = {
        company_name: client.company_name,
        contact_person: client.contact_person, 
        email: client.email,
        phone: client.phone,
        status: client.status || 'active',
        package_id: client.package_id,
        access_code: client.access_code,
        reference_number: client.reference_number,
        logo: client.logo,
        total_visits: client.total_visits || 0,
        remaining_visits: client.remaining_visits || 0,
        total_tickets: client.total_tickets || 0,
        remaining_tickets: client.remaining_tickets || 0,
        total_users_limit: client.total_users_limit || 10,
        active_users: client.active_users || 0,
        contract_start_date: client.contract_start_date || null,
        contract_duration_months: client.contract_duration_months || 12,
        discount_percentage: client.discount_percentage || 0,
        net_price: client.net_price || null,
        is_deleted: false,
        assigned_technician_id: client.assigned_technician_id || null,
        branches: client.branches || [],
        users_list: client.users_list || [], // Ensure users_list is saved
        payment_config: client.payment_config || {} 
    };

    return await supabase.from('clients').insert([dbPayload]).select().single();
  },

  async update(id: string, updates: any) {
    if (!isValidUUID(id)) return { data: null, error: { message: 'Invalid ID' } };
    return await supabase.from('clients').update(updates).eq('id', id);
  },

  async delete(id: string): Promise<void> {
    if (!isValidUUID(id)) {
        throw new Error('Invalid UUID provided for deletion.');
    }
    
    // SOFT DELETE: Update the is_deleted flag to true
    const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
        .eq('id', id);

    if (error) {
        console.error("Supabase Soft Delete Error:", error);
        throw error; 
    }
  }
};

function mapClientFromDB(c: any): ClientProfile {
    // Robust parsing for branches
    let parsedBranches = [];
    if (c.branches) {
        if (typeof c.branches === 'string') {
            try {
                const parsed = JSON.parse(c.branches);
                if (Array.isArray(parsed)) {
                    parsedBranches = parsed;
                }
            } catch (e) {
                console.error("Failed to parse branches JSON string from DB:", c.branches, e);
            }
        } else if (Array.isArray(c.branches)) {
            parsedBranches = c.branches;
        }
    }

    // Robust parsing for users_list (CRITICAL FIX)
    let parsedUsers = [];
    if (c.users_list) {
        if (typeof c.users_list === 'string') {
            try {
                const parsed = JSON.parse(c.users_list);
                if (Array.isArray(parsed)) {
                    parsedUsers = parsed;
                }
            } catch (e) {
                console.error("Failed to parse users_list JSON string from DB:", c.users_list, e);
            }
        } else if (Array.isArray(c.users_list)) {
            parsedUsers = c.users_list;
        }
    }

    return {
      id: c.id,
      name: c.contact_person || c.company_name || 'Unknown',
      companyName: c.company_name, 
      email: c.email,
      role: 'client',
      phone: c.phone || '',
      status: c.status || 'active',
      packageId: c.package_id || 'business-core', 
      accessCode: c.access_code || '', 
      referenceNumber: c.reference_number || `CZ-${String(c.id).slice(0, 5)}`,
      logo: c.logo || '',
      remainingVisits: c.remaining_visits || 0,
      remainingTickets: c.remaining_tickets || 0,
      totalVisits: c.total_visits || 0,
      totalTickets: c.total_tickets || 0,
      activeUsers: c.active_users || 0,
      totalUsersLimit: c.total_users_limit || 0,
      joinedDate: c.created_at || new Date().toISOString(),
      contractUrl: c.contract_url || '',
      usersList: parsedUsers, // Used the robustly parsed array
      branches: parsedBranches,
      licenseKeys: c.license_keys || {},
      contractStartDate: c.contract_start_date || '',
      contractDurationMonths: c.contract_duration_months || 12,
      discountPercentage: c.discount_percentage || 0,
      netPrice: c.net_price,
      adminNotes: c.admin_notes || '',
      assignedTechnicianId: c.assigned_technician_id,
      paymentConfig: c.payment_config || {} 
    };
}
