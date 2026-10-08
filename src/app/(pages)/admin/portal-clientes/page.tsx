'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { extractApiErrorMessage } from '@/lib/apiErrorMessage';

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

  return <main className="p-6 space-y-6 max-w-4xl">
    <h1 className="text-2xl font-semibold">Vinculaciones del Portal Clientes</h1>
    <p>Confirmá con la empresa o RR. HH. que la cuenta pertenece al colaborador antes de aprobar. El rol del usuario no cambia.</p>
    {message && <p role="status">{message}</p>}
    <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Email</th><th>DNI</th><th>Estado</th><th>Revisar</th></tr></thead><tbody>{rows.map((r) => <tr key={r.usuarioId}><td className="py-3">{r.email}</td><td>{r.dni}</td><td>{r.estado}</td><td><button className="underline" onClick={() => { setEmail(r.email); setDocumento(r.dni); setMotivo(''); setComprobada(false); }}>Revisar</button></td></tr>)}</tbody></table></div>
    <form onSubmit={guardar} className="space-y-4 max-w-xl">
      <h2 className="font-semibold">Revisar solicitud o vincular una cuenta existente</h2>
      <label className="block">Email de la cuenta<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded border p-2" /></label>
      <label className="block">DNI o CUIL personal<input required maxLength={24} inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value)} className="block w-full rounded border p-2" /></label>
      <label className="block">Decisión<select value={aprobar ? 'aprobar' : 'rechazar'} onChange={(e) => setAprobar(e.target.value === 'aprobar')} className="block w-full rounded border p-2"><option value="aprobar">Aprobar vinculación</option><option value="rechazar">Rechazar o revocar vinculación</option></select></label>
      <label className="block">Motivo y fuente de verificación<textarea required minLength={10} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="block w-full rounded border p-2" /></label>
      <label className="flex gap-2"><input type="checkbox" required checked={comprobada} onChange={(e) => setComprobada(e.target.checked)} />Confirmé con una fuente autorizada la identidad y la decisión sobre esta cuenta.</label>
      <button disabled={busy} className="rounded bg-neutral-900 px-4 py-2 text-white">{busy ? 'Guardando…' : 'Guardar decisión'}</button>
    </form>
  </main>;
}
