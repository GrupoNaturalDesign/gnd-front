'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { pedidoService } from '@/app/services/pedido.service';
import { productoService } from '@/app/services/producto.service';
import { productosKeys } from '@/app/utils/productosKeys';
import { getEmpresaId } from '@/app/utils/getEmpresaId';
import { useDebounce } from '@/app/hooks/useDebounce';
import { extractApiErrorMessage } from '@/lib/apiErrorMessage';
import type { ProductoWebResponse } from '@/app/types/producto.types';

interface Cliente {
  id?: number;
  sfactoryId?: number;
  sfactoryCodigo?: string;
  razonSocial?: string;
  nombre?: string;
  email?: string;
  telefono?: string | null;
  movil?: string | null;
  cuit?: string | null;
  tipo?: string;
  activo?: boolean;
  datosCompletos?: {
    tax_id?: number;
    email?: string;
    phones?: string;
    mobile?: string;
    fiscal_address?: string;
  };
}

interface Producto {
  Codigo: string;
  Descripcion?: string;
  PrecioVenta?: number;
  precio?: number;
  nombre?: string;
  Stock?: number;
  stockCache?: number;
}

interface PedidoItem {
  id: string;
  sku: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

async function buscarClientesAPI(search: string): Promise<Cliente[]> {
  const result = await pedidoService.buscarClientes(search);
  // pedidoService devuelve response.data (el array); no el sobre { success, data }
  if (Array.isArray(result)) return result;
  if (
    result &&
    typeof result === 'object' &&
    'success' in result &&
    (result as { success: boolean }).success &&
    Array.isArray((result as { data?: unknown }).data)
  ) {
    return (result as { data: Cliente[] }).data;
  }
  return [];
}

async function buscarProductosAPI(search: string): Promise<Producto[]> {
  const result = await pedidoService.buscarProductos(search);
  const slice = (arr: Producto[]) => arr.slice(0, 10);
  if (Array.isArray(result)) return slice(result);
  if (result && typeof result === 'object' && 'success' in result && (result as { success: boolean }).success) {
    const data = (result as { data?: unknown }).data;
    if (Array.isArray(data)) return slice(data as Producto[]);
    if (data && typeof data === 'object' && Array.isArray((data as { data?: Producto[] }).data)) {
      return slice((data as { data: Producto[] }).data);
    }
  }
  return [];
}

const CATALOG_PAGE_SIZE = 12;

function varianteToPedidoProducto(padreNombre: string, v: ProductoWebResponse): Producto | null {
  if (!v.activoSfactory) return null;
  const codigo = v.sfactoryCodigo?.trim();
  if (!codigo) return null;
  const precio = v.precioCache != null ? Number(v.precioCache) : 0;
  const attrs = [v.talle, v.color].filter(Boolean).join(' · ');
  const descripcion = attrs ? `${padreNombre} — ${attrs}` : v.nombre || padreNombre;
  return {
    Codigo: codigo,
    Descripcion: descripcion,
    PrecioVenta: precio,
    nombre: v.nombre,
    Stock: v.stockCache != null ? Number(v.stockCache) : undefined,
  };
}

export function CrearPedidoForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteResults, setClienteResults] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);
  const [busquedaClienteHecha, setBusquedaClienteHecha] = useState(false);
  const [productoSearch, setProductoSearch] = useState('');
  const [productoResults, setProductoResults] = useState<Producto[]>([]);
  const [isSearchingProducto, setIsSearchingProducto] = useState(false);
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [titulo, setTitulo] = useState('');
  const [refCliente, setRefCliente] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const empresaId = getEmpresaId();
  const [catalogSearchInput, setCatalogSearchInput] = useState('');
  const debouncedCatalogSearch = useDebounce(catalogSearchInput, 400);
  const [catalogPage, setCatalogPage] = useState(1);

  useEffect(() => {
    setCatalogPage(1);
  }, [debouncedCatalogSearch]);

  const catalogQuery = useQuery({
    queryKey: productosKeys.list(
      empresaId,
      catalogPage,
      CATALOG_PAGE_SIZE,
      debouncedCatalogSearch.trim() || undefined
    ),
    queryFn: () =>
      productoService.getAll({
        empresaId,
        includeVariantes: true,
        page: catalogPage,
        limit: CATALOG_PAGE_SIZE,
        search: debouncedCatalogSearch.trim() || undefined,
      }),
    enabled: step === 2,
    staleTime: 60_000,
  });

  const catalogRows = useMemo(() => {
    const padres = catalogQuery.data?.data ?? [];
    const rows: { key: string; producto: Producto }[] = [];
    for (const padre of padres) {
      for (const v of padre.productosWeb ?? []) {
        const producto = varianteToPedidoProducto(padre.nombre, v);
        if (producto) rows.push({ key: `${padre.id}-${v.id}`, producto });
      }
    }
    return rows;
  }, [catalogQuery.data?.data]);

  const catalogPagination = catalogQuery.data?.pagination;
  const catalogTotalPages = catalogPagination?.totalPages ?? 1;

  const handleBuscarCliente = async () => {
    if (!clienteSearch.trim()) return;
    setIsSearchingCliente(true);
    setBusquedaClienteHecha(true);
    const results = await buscarClientesAPI(clienteSearch);
    setClienteResults(results);
    setIsSearchingCliente(false);
  };

  const handleBuscarProducto = async () => {
    if (!productoSearch.trim()) return;
    setIsSearchingProducto(true);
    const results = await buscarProductosAPI(productoSearch);
    setProductoResults(results);
    setIsSearchingProducto(false);
  };

  const agregarProducto = (producto: Producto) => {
    const newItem: PedidoItem = {
      id: crypto.randomUUID(),
      sku: producto.Codigo,
      descripcion: producto.Descripcion || producto.nombre || producto.Codigo,
      cantidad: 1,
      precio: producto.PrecioVenta || producto.precio || 0,
    };
    setItems([...items, newItem]);
    setProductoSearch('');
    setProductoResults([]);
  };

  const actualizarItem = (id: string, field: keyof PedidoItem, value: number | string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const crearMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCliente) throw new Error('Debe seleccionar un cliente');
      if (items.length === 0) throw new Error('Debe agregar al menos un producto');

      const extOrderId = `MANUAL-${Date.now()}`;

      const clientePayload: {
        razon_social?: string;
        nombre?: string;
        cuit?: string;
        email?: string;
      } = {};
      if (selectedCliente.razonSocial) clientePayload.razon_social = selectedCliente.razonSocial;
      if (selectedCliente.nombre) clientePayload.nombre = selectedCliente.nombre;
      if (selectedCliente.cuit) clientePayload.cuit = selectedCliente.cuit.replace(/\D/g, '');
      const emailTrim = selectedCliente.email?.trim() ?? '';
      const emailLooksValid =
        emailTrim.length > 0 &&
        emailTrim !== '-' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
      if (emailLooksValid) {
        clientePayload.email = emailTrim;
      } else if (emailTrim && !clientePayload.cuit) {
        throw new Error(
          'El email del cliente no tiene un formato válido. Corregilo en la ficha del cliente e intentá de nuevo.'
        );
      }

      const itemsPayload = items.map(item => ({
        sku: item.sku,
        cantidad: item.cantidad,
        precio: item.precio,
        descripcion: item.descripcion,
      }));

      return pedidoService.crearSFactory({
        ext_order_id: extOrderId,
        titulo: titulo || undefined,
        observaciones: observaciones || undefined,
        ref_cliente: refCliente || undefined,
        cliente: clientePayload,
        items: itemsPayload,
      });
    },
    onSuccess: () => {
      toast.success('Pedido creado correctamente');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err, 'Error al crear pedido'));
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    setIsSubmitting(true);
    crearMutation.mutate();
  };

  const total = items.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

  return (
    <div className="space-y-6">
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarCliente()}
                  placeholder="Buscar por nombre, CUIT o email..."
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
                />
                {isSearchingCliente && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              <Button size="sm" variant="black" onClick={handleBuscarCliente} className="h-10">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {busquedaClienteHecha && !isSearchingCliente && clienteResults.length === 0 && (
              <div className="mt-2 p-3 text-sm text-gray-500 border rounded-md">
                No se encontraron clientes para "{clienteSearch}"
              </div>
            )}
            {busquedaClienteHecha && clienteResults.length > 0 && !selectedCliente && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto bg-white">
                {clienteResults.map((cliente, idx) => (
                  <button
                    key={cliente.id || idx}
                    type="button"
                    onClick={() => { 
                      console.log('[seleccionar cliente]', cliente);
                      setSelectedCliente(cliente); 
                      setClienteResults([]); 
                      setClienteSearch(''); 
                      setBusquedaClienteHecha(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 cursor-pointer"
                  >
                    <div className="font-medium text-sm">{cliente.razonSocial || cliente.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {cliente.cuit && `CUIT: ${cliente.cuit}`}
                      {cliente.email && ` | ${cliente.email}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCliente && (
            <div className="bg-gray-50 p-3 rounded-md border">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">{selectedCliente.razonSocial || selectedCliente.nombre}</div>
                  <div className="text-xs text-gray-500">
                    {selectedCliente.cuit && `CUIT: ${selectedCliente.cuit}`}
                    {selectedCliente.email && ` | ${selectedCliente.email}`}
                  </div>
                </div>
                <button onClick={() => setSelectedCliente(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" variant="black" disabled={!selectedCliente} onClick={() => setStep(2)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Productos</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={productoSearch}
                  onChange={(e) => setProductoSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarProducto()}
                  placeholder="Buscar por código o descripción..."
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
                />
                {isSearchingProducto && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              <Button size="sm" variant="black" onClick={handleBuscarProducto} className="h-10">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {productoResults.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {productoResults.map((producto, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => agregarProducto(producto)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-sm">{producto.Codigo}</div>
                      <div className="text-xs text-gray-500">{producto.Descripcion || producto.nombre}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${(producto.PrecioVenta || producto.precio || 0).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Catálogo local (variantes)
            </label>
            <p className="text-xs text-gray-500">
              Listado desde tu catálogo GND; mismo código que en S-Factory. Podés filtrar sin buscar en la caja de arriba.
            </p>
            <div className="relative">
              <input
                type="text"
                value={catalogSearchInput}
                onChange={(e) => setCatalogSearchInput(e.target.value)}
                placeholder="Filtrar por nombre o código de variante..."
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
              />
              {catalogQuery.isFetching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            {catalogQuery.isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                Cargando catálogo…
              </div>
            )}
            {catalogQuery.isError && (
              <p className="text-sm text-red-600">
                No se pudo cargar el catálogo. Intentá de nuevo.
              </p>
            )}
            {!catalogQuery.isLoading && !catalogQuery.isError && catalogRows.length === 0 && (
              <div className="p-3 text-sm text-gray-500 border rounded-md">
                No hay variantes activas en esta página. Probá otro filtro o pasá de página.
              </div>
            )}
            {!catalogQuery.isLoading && catalogRows.length > 0 && (
              <div className="border rounded-md max-h-56 overflow-y-auto bg-white">
                {catalogRows.map(({ key, producto }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => agregarProducto(producto)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{producto.Codigo}</div>
                      <div className="text-xs text-gray-500 truncate">{producto.Descripcion || producto.nombre}</div>
                    </div>
                    <div className="text-sm text-gray-600 shrink-0">
                      ${(producto.PrecioVenta || producto.precio || 0).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {catalogTotalPages > 1 && (
              <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
                <span>
                  Página {catalogPagination?.page ?? catalogPage} de {catalogTotalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    disabled={catalogPage <= 1 || catalogQuery.isFetching}
                    onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    disabled={catalogPage >= catalogTotalPages || catalogQuery.isFetching}
                    onClick={() => setCatalogPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">SKU</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Descripción</th>
                    <th className="px-3 py-2 w-20 text-left font-medium text-gray-600">Cant.</th>
                    <th className="px-3 py-2 w-24 text-left font-medium text-gray-600">Precio</th>
                    <th className="px-3 py-2 w-24 text-right font-medium text-gray-600">Subtotal</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">{item.sku}</td>
                      <td className="px-3 py-2">{item.descripcion}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-16 h-8 px-2 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precio}
                          onChange={(e) => actualizarItem(item.id, 'precio', parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 px-2 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">${(item.cantidad * item.precio).toFixed(2)}</td>
                      <td className="px-2 py-2">
                        <button onClick={() => eliminarItem(item.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right font-medium">Total:</td>
                    <td className="px-3 py-2 text-right font-bold">${total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
              Volver
            </Button>
            <Button size="sm" variant="black" disabled={items.length === 0} onClick={() => setStep(3)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del Pedido</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Pedido Uniformes 2026"
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia Cliente</label>
            <input
              type="text"
              value={refCliente}
              onChange={(e) => setRefCliente(e.target.value)}
              placeholder="Número de orden de compra del cliente"
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-black resize-none"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md border space-y-4">
            <h4 className="font-medium text-sm">Resumen del pedido</h4>

            <div className="text-sm space-y-1.5 border-b border-gray-200 pb-3">
              <div>
                <span className="text-gray-500">Cliente:</span>{' '}
                <span className="font-medium">{selectedCliente?.razonSocial || selectedCliente?.nombre}</span>
              </div>
              {selectedCliente?.cuit && (
                <div>
                  <span className="text-gray-500">CUIT:</span> {selectedCliente.cuit}
                </div>
              )}
              {selectedCliente?.email && (
                <div>
                  <span className="text-gray-500">Email:</span> {selectedCliente.email}
                </div>
              )}
            </div>

            {(titulo.trim() || refCliente.trim() || observaciones.trim()) && (
              <div className="text-sm space-y-1.5 border-b border-gray-200 pb-3">
                {titulo.trim() && (
                  <div>
                    <span className="text-gray-500">Título:</span> {titulo.trim()}
                  </div>
                )}
                {refCliente.trim() && (
                  <div>
                    <span className="text-gray-500">Ref. cliente:</span> {refCliente.trim()}
                  </div>
                )}
                {observaciones.trim() && (
                  <div>
                    <span className="text-gray-500">Observaciones:</span>
                    <p className="mt-0.5 whitespace-pre-wrap text-gray-800">{observaciones.trim()}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                Productos ({items.length})
              </p>
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-left text-xs text-gray-600">
                    <tr>
                      <th className="px-2 py-2 font-medium">SKU</th>
                      <th className="px-2 py-2 font-medium">Descripción</th>
                      <th className="px-2 py-2 font-medium w-14 text-right">Cant.</th>
                      <th className="px-2 py-2 font-medium w-20 text-right">P. unit.</th>
                      <th className="px-2 py-2 font-medium w-24 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-2 py-2 align-top font-mono text-xs">{item.sku}</td>
                        <td className="px-2 py-2 align-top text-gray-800">{item.descripcion}</td>
                        <td className="px-2 py-2 align-top text-right tabular-nums">{item.cantidad}</td>
                        <td className="px-2 py-2 align-top text-right tabular-nums">${item.precio.toFixed(2)}</td>
                        <td className="px-2 py-2 align-top text-right tabular-nums font-medium">
                          ${(item.cantidad * item.precio).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-right text-gray-600 font-medium">
                        Total
                      </td>
                      <td className="px-2 py-2 text-right font-bold tabular-nums">${total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button size="sm" variant="ghost" onClick={() => setStep(2)} disabled={isSubmitting}>
              Volver
            </Button>
            <Button
              size="sm"
              variant="black"
              onClick={handleSubmit}
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Crear Pedido
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}