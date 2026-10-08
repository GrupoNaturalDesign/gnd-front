'use client';

import { apiClient } from '@/lib/apiClient';
import { extractApiErrorMessage } from '@/lib/apiErrorMessage';

export interface PortalClientesSsoLink {
  url: string;
  expiresAt: string;
}

const MENSAJES_POR_STATUS: Record<number, string> = {
  409: 'No encontramos un CUIT/CUIL asociado a tu cuenta. Escribinos para habilitar tu acceso al Portal Clientes.',
  403: 'Tu cuenta está inactiva. Escribinos para revisar tu acceso.',
  503: 'El Portal Clientes no está disponible en este momento. Intentá de nuevo más tarde.',
};

const MENSAJE_GENERICO = 'No pudimos abrir el Portal Clientes. Intentá de nuevo.';

function esLinkValido(data: unknown): data is PortalClientesSsoLink {
  if (!data || typeof data !== 'object') return false;
  const { url, expiresAt } = data as Record<string, unknown>;
  if (typeof url !== 'string' || typeof expiresAt !== 'string') return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Mensaje para el usuario según el status de `GET /portal-clientes/sso` (ver api/docs/portal-clientes.md). */
export function mensajeErrorPortalClientes(error: unknown): string {
  const status =
    error && typeof error === 'object' && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 0;
  return MENSAJES_POR_STATUS[status] ?? extractApiErrorMessage(error, MENSAJE_GENERICO);
}

export async function obtenerLinkPortalClientes(): Promise<PortalClientesSsoLink> {
  const res = await apiClient.get<unknown>('/portal-clientes/sso', { cache: 'no-store' });
  if (!res.success || !esLinkValido(res.data)) {
    throw new Error(MENSAJE_GENERICO);
  }
  return res.data;
}
