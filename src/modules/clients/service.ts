
import { ClientProfile } from '../../core/types';
import { ClientRepository } from './repository';
import { supabase } from '../../lib/supabase';

export const ClientService = {
  async getAllClients(): Promise<ClientProfile[]> {
    return await ClientRepository.getAll();
  },

  async addNewClient(data: Partial<ClientProfile>): Promise<boolean> {
    const generatedAccessCode = data.accessCode || Math.floor(100000 + Math.random() * 900000).toString();
    const timestamp = Date.now().toString().slice(-4);
    const generatedReference = `CZ-${timestamp}-NEW`;

    const branchesPayload = Array.isArray(data.branches) ? JSON.stringify(data.branches) : (data.branches || '[]');
    const usersListPayload = Array.isArray(data.usersList) ? data.usersList : [];

    const payload = {
        company_name: data.companyName,
        contact_person: data.name,
        email: data.email,
        phone: data.phone,
        package_id: data.packageId,
        access_code: generatedAccessCode,
        reference_number: data.referenceNumber || generatedReference,
        logo: data.logo,
        status: 'active',
        total_visits: data.totalVisits || 0,
        remaining_visits: data.totalVisits || 0,
        total_tickets: data.totalTickets || 0,
        remaining_tickets: data.totalTickets || 0,
        total_users_limit: data.totalUsersLimit || 10,
        active_users: usersListPayload.length,
        contract_start_date: data.contractStartDate || null,
        contract_duration_months: data.contractDurationMonths || 12,
        discount_percentage: data.discountPercentage || 0,
        net_price: data.netPrice || null,
        branches: branchesPayload,
        users_list: usersListPayload,
        payment_config: data.paymentConfig,
    };
    
    const { error } = await ClientRepository.create(payload);
    if (error) {
        console.error("Critical Client Creation Error:", error.message);
        return false;
    }
    return true;
  },

  async updateClientDetails(id: string, updates: Partial<ClientProfile>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.contact_person = updates.name;
    if (updates.companyName) dbUpdates.company_name = updates.companyName;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.packageId) dbUpdates.package_id = updates.packageId;
    if (updates.logo) dbUpdates.logo = updates.logo;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.accessCode) dbUpdates.access_code = updates.accessCode;
    if (updates.totalVisits !== undefined) dbUpdates.total_visits = updates.totalVisits;
    if (updates.totalTickets !== undefined) dbUpdates.total_tickets = updates.totalTickets;
    
    if (updates.usersList) {
        dbUpdates.users_list = updates.usersList;
        if (Array.isArray(updates.usersList)) {
            dbUpdates.active_users = updates.usersList.length;
        }
    }
    
    if (updates.activeUsers !== undefined) dbUpdates.active_users = updates.activeUsers;
    
    if (updates.branches) {
        dbUpdates.branches = typeof updates.branches === 'string' 
            ? updates.branches 
            : JSON.stringify(updates.branches);
    }

    if (updates.contractUrl) dbUpdates.contract_url = updates.contractUrl;
    if (updates.licenseKeys) dbUpdates.license_keys = updates.licenseKeys;
    if (updates.contractStartDate !== undefined) dbUpdates.contract_start_date = updates.contractStartDate;
    if (updates.contractDurationMonths !== undefined) dbUpdates.contract_duration_months = updates.contractDurationMonths;
    if (updates.discountPercentage !== undefined) dbUpdates.discount_percentage = updates.discountPercentage;
    if (updates.netPrice !== undefined) dbUpdates.net_price = updates.netPrice;
    if (updates.assignedTechnicianId !== undefined) dbUpdates.assigned_technician_id = updates.assignedTechnicianId;
    if (updates.paymentConfig) dbUpdates.payment_config = updates.paymentConfig; 
    if (updates.adminNotes !== undefined) dbUpdates.admin_notes = updates.adminNotes;

    const { error } = await ClientRepository.update(id, dbUpdates);
    if (error) {
        console.error("Update client error:", error);
        throw error; 
    }
  },

  // --- REWRITTEN FUNCTION BASED ON YOUR PROMPT ---
  async deleteUserFromTeam(clientId: string, userIdToDelete: string): Promise<boolean> {
    console.log('1. بدأت الدالة deleteUserFromTeam');
    console.log('Target Client ID:', clientId);
    console.log('Target User ID to Delete:', userIdToDelete);

    if (!clientId) {
        console.error("❌ خطأ: Client ID غير موجود (undefined/null)");
        return false;
    }

    try {
        // 1. جلب بيانات العميل الحالية (Fetch Current Data)
        const { data: clientData, error: fetchError } = await supabase
            .from('clients')
            .select('users_list, active_users')
            .eq('id', clientId)
            .single();

        if (fetchError) {
            console.error('Fetch Error:', fetchError);
            throw fetchError;
        }

        let currentUsers = clientData?.users_list;

        // Robust Parsing for JSONB
        if (!Array.isArray(currentUsers)) {
             if (typeof currentUsers === 'string') {
                 try { currentUsers = JSON.parse(currentUsers); } catch { currentUsers = []; }
             } else {
                 currentUsers = [];
             }
        }

        console.log('2. جاري الفلترة. العدد الحالي للمستخدمين:', currentUsers.length);

        // 2. تصفية القائمة (Filter logic with String casting safety for UUIDs)
        const updatedList = currentUsers.filter((u: any) => String(u.id) !== String(userIdToDelete));
        
        console.log('العدد بعد الفلترة:', updatedList.length);

        if (updatedList.length === currentUsers.length) {
            console.warn("⚠️ تحذير: لم يتم العثور على المستخدم لحذفه (قد تكون IDs غير متطابقة أو الأنواع مختلفة).");
        }

        // 3. تحديث قاعدة البيانات (Update Supabase)
        console.log('3. جاري إرسال الطلب لسوبابيس لتحديث القائمة...');
        
        const { error: updateError } = await supabase
            .from('clients')
            .update({ 
                users_list: updatedList,
                active_users: Math.max(0, updatedList.length) 
            })
            .eq('id', clientId);

        if (updateError) {
            console.error('❌ خطأ أثناء تحديث سوبابيس:', updateError);
            throw updateError;
        }

        console.log("✅ تم تحديث قاعدة البيانات وحذف المستخدم بنجاح.");
        return true;

    } catch (err: any) {
        console.error("❌ فشل عملية الحذف:", err.message);
        return false;
    }
  },

  async deleteClient(id: string): Promise<void> {
    await ClientRepository.delete(id);
  },

  async checkExpiringContracts(clients: ClientProfile[]): Promise<void> {
    // Contract expiry logic...
  },

  subscribe(callback: () => void) {
    const sub = supabase.channel('clients_service_sync_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, callback)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }
};
