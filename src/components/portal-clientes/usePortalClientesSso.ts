'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  mensajeErrorPortalClientes,
  obtenerLinkPortalClientes,
} from '@/app/services/portalClientes.service';

/**
 * El token vence a los 3 minutos: se pide en el clic y se redirige enseguida,
 * nunca se guarda ni se arma un href por adelantado.
 */
export function usePortalClientesSso() {
  const [isLoading, setIsLoading] = useState(false);
  const enCurso = useRef(false);

  useEffect(() => {
    // Volver con "atrás" desde el portal restaura la página (bfcache) con el loading activo.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      enCurso.current = false;
      setIsLoading(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const abrirPortal = useCallback(async () => {
    if (enCurso.current) return;
    enCurso.current = true;
    setIsLoading(true);
    try {
      const { url } = await obtenerLinkPortalClientes();
      window.location.assign(url);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
        window.location.assign('/portal-clientes');
        enCurso.current = false;
        setIsLoading(false);
        return;
      }
      toast.error(mensajeErrorPortalClientes(error));
      enCurso.current = false;
      setIsLoading(false);
    }
  }, []);

  return { abrirPortal, isLoading };
}
