import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ClientProfile } from '../../core/types';
import { AuthService } from './service';

interface AuthContextType {
  user: User | null;
  login: (credential: string, role: 'admin' | 'client' | 'technician') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isTechnician: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('ctrlz_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      try {
        // Create a copy of the user object to avoid mutating the component's state.
        const userToStore = { ...user };

        // The 'logo' property, if it exists (on ClientProfile), can be a very large
        // base64 string for the image, which often exceeds the localStorage quota (around 5MB).
        // To prevent the "QuotaExceededError", we remove this property before storing the session.
        // The full client profile, including the logo, is fetched from the database by the
        // ClientDataProvider, so the logo will still be available in the UI after login.
        // This just affects session persistence, not the live application state.
        if ('logo' in userToStore) {
          delete (userToStore as Partial<ClientProfile>).logo;
        }

        localStorage.setItem('ctrlz_user', JSON.stringify(userToStore));
      } catch (error) {
        console.error("Error saving user session to localStorage:", error);
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
          console.warn("LocalStorage quota exceeded. User session will not be persisted across page reloads.");
          // To recover from a completely full state, we can try to remove the item.
          localStorage.removeItem('ctrlz_user');
        }
      }
    } else {
      localStorage.removeItem('ctrlz_user');
    }
  }, [user]);

  const login = useCallback(async (credential: string, role: 'admin' | 'client' | 'technician'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const authenticatedUser = await AuthService.login(credential, role);
      if (authenticatedUser) {
          setUser(authenticatedUser);
          return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ctrlz_user');
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    isTechnician: user?.role === 'technician',
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
