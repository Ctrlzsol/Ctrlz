
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ClientProfile } from '../../core/types';
import { ClientService } from './service';
import { supabase } from '../../lib/supabase';

interface ClientDataContextType {
  clients: ClientProfile[];
  updateClient: (id: string, updates: Partial<ClientProfile>) => Promise<void>;
  addClient: (client: Omit<ClientProfile, 'id' | 'role' | 'joinedDate'>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  deleteUserFromTeam: (clientId: string, userIdToDelete: string) => Promise<boolean>; 
  refreshClients: () => Promise<void>;
  isLoading: boolean;
}

const ClientDataContext = createContext<ClientDataContextType | undefined>(undefined);

export const ClientDataProvider = ({ children }: { children?: React.ReactNode }) => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClients = useCallback(async () => {
    // Only set loading on initial fetch to avoid flickering
    if (clients.length === 0) setIsLoading(true);
    try {
        const data = await ClientService.getAllClients();
        setClients(data);
        if (data.length > 0) {
            ClientService.checkExpiringContracts(data).catch(err => console.error("Contract check error:", err));
        }
    } catch (err) {
        console.error("Error refreshing clients:", err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClients();
    const sub = supabase.channel('clients_ctx_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, refreshClients)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [refreshClients]);

  const addClient = async (clientData: Omit<ClientProfile, 'id' | 'role' | 'joinedDate'>) => {
      const success = await ClientService.addNewClient(clientData);
      if (success) await refreshClients();
      return success;
  };

  const updateClient = async (id: string, updates: Partial<ClientProfile>) => {
    await ClientService.updateClientDetails(id, updates);
    await refreshClients();
  };

  // --- DELETE USER FUNCTION ---
  const deleteUserFromTeam = async (clientId: string, userIdToDelete: string): Promise<boolean> => {
      const success = await ClientService.deleteUserFromTeam(clientId, userIdToDelete);
      if (success) {
          setClients(prevClients => prevClients.map(client => {
              if (client.id === clientId) {
                  const currentList = Array.isArray(client.usersList) ? client.usersList : [];
                  const updatedList = currentList.filter(u => String(u.id) !== String(userIdToDelete));
                  return {
                      ...client,
                      usersList: updatedList,
                      activeUsers: updatedList.length
                  };
              }
              return client;
          }));
      }
      return success;
  };

  // --- HARD DELETE CLIENT & ALL RELATED DATA ---
  const deleteClient = async (id: string): Promise<boolean> => {
    console.log(`[CONTEXT] Hard deleteClient cascade initiated for ID: ${id}`);
    
    // تأكيد إضافي قبل البدء (اختياري، عادة يتم في واجهة المستخدم)
    // const confirm = window.confirm("تحذير: هذا الإجراء سيحذف العميل وكل بياناته (تذاكر، فواتير، سجلات) نهائياً. هل أنت متأكد؟");
    // if (!confirm) return false;

    try {
        // 1. Delete Related Data Explicitly (Hard Delete)
        // Note: We use .delete() without filters other than client_id to permanently remove rows.
        const deletePromises = [
            // New Modules
            supabase.from('remote_support_tickets').delete().eq('client_id', id),
            supabase.from('consultations').delete().eq('client_id', id),
            supabase.from('orders').delete().eq('client_id', id),
            
            // Core Modules
            supabase.from('tickets').delete().eq('client_id', id),
            supabase.from('bookings').delete().eq('client_id', id),
            supabase.from('visit_tasks').delete().eq('client_id', id),
            supabase.from('invoices').delete().eq('client_id', id),
            supabase.from('reports').delete().eq('client_id', id),
            supabase.from('notifications').delete().eq('client_id', id),
            supabase.from('calendar_days').delete().eq('client_id', id)
        ];

        await Promise.all(deletePromises);

        // 2. Finally, delete the Client itself
        // We bypass the Service soft-delete and go direct to Supabase for hard delete
        const { error } = await supabase.from('clients').delete().eq('id', id);

        if (error) throw error;

        // 3. Update UI
        setClients(prevClients => prevClients.filter(item => item.id !== id));
        
        alert("✅ تم حذف العميل وجميع بياناته المرتبطة (تذاكر، استشارات، طلبات) نهائياً.");
        return true;
    } catch (err: any) {
        console.error("[CONTEXT] Caught Cascade Delete Client Error:", err);
        let userMessage = `❌ فشلت عملية الحذف.\n\n`;
        userMessage += `الرسالة: ${err.message || 'حدث خطأ غير متوقع.'}\n`;
        alert(userMessage);
        return false;
    }
  };

  return (
    <ClientDataContext.Provider value={{ clients, updateClient, addClient, deleteClient, deleteUserFromTeam, refreshClients, isLoading }}>
      {children}
    </ClientDataContext.Provider>
  );
};

export const useClientData = () => {
  const context = useContext(ClientDataContext);
  if (!context) {
    throw new Error('useClientData must be used within a ClientDataProvider');
  }
  return context;
};
