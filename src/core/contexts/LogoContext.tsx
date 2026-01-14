
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface LogoContextType {
  logoMode: 'default' | 'custom';
  customLogoData: string | null;
  logoScale: number;
  saveLogoSettings: (base64Data: string, scale: number) => Promise<void>;
  resetLogo: () => Promise<void>;
  isLoading: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider = ({ children }: { children?: React.ReactNode }) => {
  const [logoMode, setLogoMode] = useState<'default' | 'custom'>('default');
  const [customLogoData, setCustomLogoData] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch settings from Supabase on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('logo_data, logo_size')
          .eq('id', 'global_config')
          .single();

        if (error) {
            // It's okay if no row exists yet (first run), we just use defaults
            if (error.code !== 'PGRST116') {
                console.warn('Error fetching system settings (Logo):', error.message);
            }
        } else if (data) {
            if (data.logo_data) {
                setCustomLogoData(data.logo_data);
                setLogoMode('custom');
            }
            if (data.logo_size) {
                setLogoScale(data.logo_size);
            }
        }
      } catch (err) {
        console.error('Unexpected error fetching logo settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // 2. Subscribe to realtime changes (sync across tabs/users)
    const subscription = supabase
      .channel('system_settings_logo_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: "id=eq.global_config" }, 
        (payload) => {
            const newData = payload.new;
            if (newData) {
                if (newData.logo_data) {
                    setCustomLogoData(newData.logo_data);
                    setLogoMode('custom');
                } else {
                    setCustomLogoData(null);
                    setLogoMode('default');
                }
                setLogoScale(newData.logo_size || 1);
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const saveLogoSettings = async (base64Data: string, scale: number) => {
    // Optimistic Update for immediate UI feedback
    setCustomLogoData(base64Data);
    setLogoScale(scale);
    setLogoMode('custom');

    try {
        const { error } = await supabase
            .from('system_settings')
            .upsert({ 
                id: 'global_config', 
                logo_data: base64Data, 
                logo_size: scale,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
    } catch (err: any) {
        console.error("Failed to save logo to database:", err);
        alert("فشل حفظ الشعار في قاعدة البيانات: " + err.message);
    }
  };

  const resetLogo = async () => {
    // Optimistic Update
    setCustomLogoData(null);
    setLogoScale(1);
    setLogoMode('default');

    try {
        const { error } = await supabase
            .from('system_settings')
            .upsert({ 
                id: 'global_config', 
                logo_data: null, 
                logo_size: 1.0, 
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    } catch (err: any) {
        console.error("Failed to reset logo in database:", err);
        alert("فشل استعادة الشعار الافتراضي: " + err.message);
    }
  };

  return (
    <LogoContext.Provider value={{ logoMode, customLogoData, logoScale, saveLogoSettings, resetLogo, isLoading }}>
      {!isLoading && children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
