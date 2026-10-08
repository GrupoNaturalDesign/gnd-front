'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { extractApiErrorMessage } from '@/lib/apiErrorMessage';
import Link from 'next/link';

type Solicitud = { usuarioId: number; email: string; dni: string; estado: string };

export default function PortalClientesAdminPage() {
  const [rows, setRows] = useState<Solicitud[]>([]);
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [motivo, setMotivo] = useState('');
  const [comprobada, setComprobada] = useState(false);
  const [aprobar, setAprobar] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function cargar() {
    const res = await apiClient.get<Solicitud[]>('/admin/portal-clientes', { cache: 'no-store' });
    setRows(res.data ?? []);
  }
  useEffect(() => { void cargar().catch((e) => setMessage(extractApiErrorMessage(e, 'No pudimos cargar las solicitudes.'))); }, []);

  async function guardar(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await apiClient.post('/admin/portal-clientes', { email, documento, motivo, aprobar, identidadComprobada: comprobada });
      setMessage(aprobar ? 'Vinculación aprobada.' : 'Vinculación rechazada y acceso manual revocado.');
      setComprobada(false); setMotivo(''); await cargar();
    } catch (e) { setMessage(extractApiErrorMessage(e, 'No pudimos guardar la decisión.')); }
    finally { setBusy(false); }
  }

  return <main className="w-full min-w-0 max-w-4xl space-y-6 px-3 py-4 sm:p-6">
    <h1 className="text-2xl font-semibold">Vinculaciones del Portal Clientes</h1>
    <p>Confirmá con la empresa o RR. HH. que la cuenta pertenece al colaborador antes de aprobar. El rol del usuario no cambia.</p>
    {message && <div role="status" className="rounded-lg border bg-white p-4 space-y-2"><p>{message}</p>{message === 'Vinculación aprobada.' && <p className="text-sm text-neutral-600">La cuenta aprobada ya puede ingresar desde Portal Clientes en la tienda. Esta pantalla administra vinculaciones.</p>}</div>}
    <nav className="flex flex-col gap-3 sm:flex-row" aria-label="Acceso a la tienda">
      <Link href="/portal-clientes" className="rounded-lg bg-neutral-900 px-4 py-3 text-center text-white">Probar mi acceso como cliente</Link>
      <Link href="/" className="rounded-lg border px-4 py-3 text-center">Volver a la tienda</Link>
    </nav>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {rows.map((r) => <article key={r.usuarioId} className="min-w-0 rounded-lg border bg-white p-4 space-y-3">
        <p className="break-all font-medium">{r.email}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="text-neutral-500">DNI</dt><dd>{r.dni}</dd></div><div><dt className="text-neutral-500">Estado</dt><dd className="capitalize">{r.estado}</dd></div></dl>
        <button type="button" className="w-full rounded-lg border px-4 py-2 text-sm" onClick={() => { setEmail(r.email); setDocumento(r.dni); setMotivo(''); setComprobada(false); }}>Revisar vinculación</button>
      </article>)}
      {rows.length === 0 && <p className="text-sm text-neutral-600">Todavía no hay solicitudes de vinculación.</p>}
    </div>
    <form onSubmit={guardar} className="w-full min-w-0 space-y-4 max-w-xl">
      <h2 className="font-semibold">Revisar solicitud o vincular una cuenta existente</h2>
      <label className="block">Email de la cuenta<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded border p-2" /></label>
      <label className="block">DNI o CUIL personal<input required maxLength={24} inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value)} className="block w-full rounded border p-2" /></label>
      <label className="block">Decisión<select value={aprobar ? 'aprobar' : 'rechazar'} onChange={(e) => setAprobar(e.target.value === 'aprobar')} className="block w-full rounded border p-2"><option value="aprobar">Aprobar vinculación</option><option value="rechazar">Rechazar o revocar vinculación</option></select></label>
      <label className="block">Motivo y fuente de verificación<textarea required minLength={10} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="block w-full rounded border p-2" /></label>
      <label className="flex gap-2"><input type="checkbox" required checked={comprobada} onChange={(e) => setComprobada(e.target.checked)} />Confirmé con una fuente autorizada la identidad y la decisión sobre esta cuenta.</label>
      <button disabled={busy} className="w-full rounded bg-neutral-900 px-4 py-3 text-white sm:w-auto">{busy ? 'Guardando…' : 'Guardar decisión'}</button>
    </form>
  </main>;
}
