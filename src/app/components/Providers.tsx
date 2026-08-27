'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SalesProvider } from '../contexts/SalesContext';
import { MetaPixelRouteTracker } from '@/app/analytics/metaPixel/MetaPixelRouteTracker';
import { MetaPixelScript } from '@/app/analytics/metaPixel/MetaPixelScript';
import { ModalStackProvider } from '@/app/components/modal/ModalStackContext';

export function Providers({ children }: { children: ReactNode }) {
  // Crear el queryClient dentro del componente para evitar problemas de serialización
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 10, // 10 minutos (optimizado)
            gcTime: 1000 * 60 * 60, // 1 hora (optimizado)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Evitar refetch innecesario
          },
        },
      })
  );

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <SalesProvider>
          <ModalStackProvider>
            <MetaPixelScript />
            <MetaPixelRouteTracker />
            {children}
            <Toaster
              position="top-right"
              containerStyle={{
                zIndex: 1000000,
              }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '14px',
                  zIndex: 1000000,
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ModalStackProvider>
        </SalesProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
