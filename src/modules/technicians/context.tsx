
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Technician } from '../../core/types';
import { TechnicianService } from './service';
import { supabase } from '../../lib/supabase';

interface TechnicianContextType {
  technicians: Technician[];
  addTechnician: (technician: Omit<Technician, 'id' | 'created_at'>) => Promise<boolean>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<boolean>;
  deleteTechnician: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

export const TechnicianProvider = ({ children }: { children?: React.ReactNode }) => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshTechnicians = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await TechnicianService.getAll();
            setTechnicians(data);
        } catch (error) {
            console.error("Error refreshing technicians:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshTechnicians();
        const subscription = TechnicianService.subscribe(refreshTechnicians);
        return () => {
            subscription.unsubscribe();
        };
    }, [refreshTechnicians]);

    const addTechnician = async (data: Omit<Technician, 'id' | 'created_at'>) => {
        const success = await TechnicianService.create(data);
        if (success) {
            await refreshTechnicians();
        }
        return success;
    };

    const updateTechnician = async (id: string, updates: Partial<Technician>) => {
        const success = await TechnicianService.update(id, updates);
        if (success) {
            await refreshTechnicians();
        }
        return success;
    };

    const deleteTechnician = async (id: string) => {
        const success = await TechnicianService.delete(id);
        if (success) {
            await refreshTechnicians();
        }
        return success;
    };

    const value = {
        technicians,
        addTechnician,
        updateTechnician,
        deleteTechnician,
        isLoading,
    };

    return (
        <TechnicianContext.Provider value={value}>
            {children}
        </TechnicianContext.Provider>
    );
};

export const useTechnician = () => {
    const context = useContext(TechnicianContext);
    if (context === undefined) {
        throw new Error('useTechnician must be used within a TechnicianProvider');
    }
    return context;
};
