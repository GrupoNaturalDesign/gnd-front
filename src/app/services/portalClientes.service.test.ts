import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
vi.mock('@/lib/apiClient', () => ({ apiClient: { get: (...args: unknown[]) => get(...args) } }));

import {
  mensajeErrorPortalClientes,
  obtenerLinkPortalClientes,
} from './portalClientes.service';

const LINK = {
  url: 'https://clientes.naturalonline.com.ar/ssfi/login?token=abc',
  expiresAt: '2026-10-03T12:03:00.000Z',
};

describe('portalClientes.service', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('devuelve el link y pide sin cache', async () => {
    get.mockResolvedValue({ success: true, data: LINK });
    await expect(obtenerLinkPortalClientes()).resolves.toEqual(LINK);
    expect(get).toHaveBeenCalledWith('/portal-clientes/sso', { cache: 'no-store' });
  });

  it('rechaza respuestas sin url https', async () => {
    get.mockResolvedValue({ success: true, data: { ...LINK, url: 'http://evil.test/?token=abc' } });
    await expect(obtenerLinkPortalClientes()).rejects.toThrow('No pudimos abrir el Portal Clientes');

    get.mockResolvedValue({ success: true, data: { url: 'no-es-url', expiresAt: LINK.expiresAt } });
    await expect(obtenerLinkPortalClientes()).rejects.toThrow();

    get.mockResolvedValue({ success: true, data: undefined });
    await expect(obtenerLinkPortalClientes()).rejects.toThrow();
  });

  it('mapea los status del endpoint a mensajes para el usuario', () => {
    expect(mensajeErrorPortalClientes({ status: 409, message: 'x' })).toMatch(/CUIT\/CUIL/);
    expect(mensajeErrorPortalClientes({ status: 403, message: 'x' })).toMatch(/inactiva/);
    expect(mensajeErrorPortalClientes({ status: 503, message: 'x' })).toMatch(/no está disponible/);
  });

  it('otros errores: usa el mensaje de la API o el genérico', () => {
    expect(mensajeErrorPortalClientes({ status: 404, message: 'Usuario no encontrado.' })).toBe(
      'Usuario no encontrado.'
    );
    expect(mensajeErrorPortalClientes(null)).toMatch(/No pudimos abrir el Portal Clientes/);
  });
});
