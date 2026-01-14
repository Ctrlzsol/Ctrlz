
import React from 'react';
import { LanguageProvider } from './LanguageContext';
import { LogoProvider } from './LogoContext';
import { AuthProvider } from '../../modules/auth/AuthContext';
import { BookingProvider } from '../../modules/bookings/context';
import { TicketProvider } from '../../modules/tickets/context';
import { InvoiceProvider } from '../../modules/billing/context';
import { ClientDataProvider } from '../../modules/clients/context';
import { TechnicianProvider } from '../../modules/technicians/context';

export const AppProviders = ({ children }: { children?: React.ReactNode }) => {
  return (
    <LanguageProvider>
      <LogoProvider>
        <TechnicianProvider>
          <ClientDataProvider>
            <TicketProvider>
              <BookingProvider>
                <InvoiceProvider>
                  <AuthProvider>
                    {children}
                  </AuthProvider>
                </InvoiceProvider>
              </BookingProvider>
            </TicketProvider>
          </ClientDataProvider>
        </TechnicianProvider>
      </LogoProvider>
    </LanguageProvider>
  );
};
