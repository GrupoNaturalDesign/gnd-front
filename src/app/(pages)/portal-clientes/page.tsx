'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { extractApiErrorMessage } from '@/lib/apiErrorMessage';
import { obtenerLinkPortalClientes } from '@/app/services/portalClientes.service';

type Estado = { estado: string; emailVerificado: boolean };

export default function PortalClientesPage() {
  const { sessionState, isLoading } = useAuth();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [documento, setDocumento] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function consultar() {
    setError(''); setBusy(true);
    try {
      const res = await apiClient.get<Estado>('/portal-clientes/identidad', { cache: 'no-store' });
      if (!res.data) throw new Error('No pudimos consultar tu solicitud.');
      setEstado(res.data);
    } catch (e) { setError(extractApiErrorMessage(e, 'No pudimos consultar tu solicitud.')); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (isLoading) return;
    if (!sessionState) { router.replace('/auth/login?callbackUrl=/portal-clientes'); return; }
    void consultar();
  }, [isLoading, sessionState?.uid, router]);

  async function enviar(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const res = await apiClient.post<{ estado: string }>('/portal-clientes/identidad', { documento });
      if (!res.data) throw new Error('No pudimos guardar tu solicitud.');
      setDocumento(''); setEstado({ estado: res.data.estado, emailVerificado: true });
    } catch (e) { setError(extractApiErrorMessage(e, 'No pudimos guardar tu solicitud.')); }
    finally { setBusy(false); }
  }

  async function ingresar() {
    setBusy(true); setError('');
    try { window.location.assign((await obtenerLinkPortalClientes()).url); }
    catch (e) { setError(extractApiErrorMessage(e, 'No pudimos abrir el portal.')); setBusy(false); }
  }

  if (isLoading || !sessionState) return <p className="p-8">Cargando…</p>;
  return <main className="mx-auto max-w-xl px-6 py-12 space-y-6">
    <h1 className="text-2xl font-semibold">Acceso al Portal Clientes</h1>
    <p>Para acceder al portal de tu empresa necesitamos vincular tu cuenta con tu identidad. La revisión se realiza una sola vez; después podés ingresar desde el menú.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!estado && <button onClick={consultar} disabled={busy}>Consultar mi solicitud</button>}
    {estado && !estado.emailVerificado && <p>Primero verificá tu email. <Link className="underline" href="/auth/verify-email?callbackUrl=/portal-clientes">Verificar email</Link></p>}
    {estado?.estado === 'aprobado' && <><p role="status">Tu identidad está vinculada. El portal comprobará si estás habilitado en la nómina.</p><button onClick={ingresar} disabled={busy} className="rounded-lg bg-neutral-900 px-5 py-3 text-white">{busy ? 'Ingresando…' : 'Ingresar al portal'}</button></>}
    {estado?.estado === 'pendiente' && <div className="space-y-4"><p role="status">Recibimos tu solicitud. Nuestro equipo debe confirmar la vinculación con tu empresa antes de habilitar el acceso. No necesitás volver a enviarla.</p><button onClick={consultar} disabled={busy} className="underline">Comprobar estado</button></div>}
    {estado?.estado === 'rechazado' && <p>La vinculación no pudo confirmarse. Revisá los datos o contactá a tu empresa antes de volver a solicitarla.</p>}
    {estado?.emailVerificado && ['sin_solicitud', 'rechazado'].includes(estado.estado) && <form onSubmit={enviar} className="space-y-4">
      <label className="block" htmlFor="portal-documento">Tu DNI o CUIL personal</label>
      <input id="portal-documento" value={documento} onChange={(e) => setDocumento(e.target.value)} required maxLength={24} inputMode="numeric" autoComplete="off" aria-describedby="portal-explicacion" className="w-full rounded-lg border p-3" />
      <p id="portal-explicacion" className="text-sm text-neutral-600">Usamos este dato para revisar la vinculación de tu cuenta. Enviarlo no habilita el acceso hasta que confirmemos tu identidad.</p>
      <button disabled={busy} className="rounded-lg bg-neutral-900 px-5 py-3 text-white">{busy ? 'Enviando…' : 'Solicitar vinculación'}</button>
    </form>}
    <Link className="inline-block underline" href="/perfil">Volver a mi perfil</Link>
  </main>;
}
