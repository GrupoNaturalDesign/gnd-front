'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Select from '@/app/components/ui/Select';
import BaseModal from '@/app/components/modal/BaseModal';
import { useVariantesStock } from '@/app/hooks/useVariantesStock';
import { useBulkSelection } from '@/app/hooks/useBulkSelection';
import { useEmpresaPrecioConfig, calcularPreciosDerivados } from '@/app/hooks/useEmpresaPrecioConfig';
import type { ProductoPadreConVariantes, ProductoWebResponse, MotivoInactivoVariante } from '@/app/types/producto.types';
import { formatNombreConGenero } from './columns';
import { badgeClassMotivoInactivo, labelMotivoInactivo } from '@/app/utils/varianteInactiva.util';
import { Search, Save, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { productosKeys } from '@/app/utils/productosKeys';

/**
 * Stock “sucio” solo si el número editado difiere del guardado.
 * null/undefined se tratan como 0 (evita “Modificado” por 0 vs null tras sync).
 */
function isStockDirty(
  edited: number | null | undefined,
  saved: number | string | null | undefined
): boolean {
  return Number(edited ?? 0) !== Number(saved ?? 0);
}

interface VariantesStockTableProps {
  producto: ProductoPadreConVariantes;
  variantes: ProductoWebResponse[];
  onSuccess?: () => void;
  onHasChangesChange?: (hasChanges: boolean) => void;
}

interface EditableVariante extends ProductoWebResponse {
  editedStock?: number | null;
  editedPrecio?: number | null;
  precioPersonalizado?: boolean; // Si tiene precio personalizado (no hereda del padre)
}

export function VariantesStockTable({
  producto,
  variantes: initialVariantes,
  onSuccess,
  onHasChangesChange,
}: VariantesStockTableProps) {
  // Calcular precio general inicial (promedio o primer precio no nulo)
  const precioGeneralInicial = useMemo(() => {
    const precios = initialVariantes
      .map(v => v.precioCache)
      .filter(p => p !== null && p !== undefined) as number[];
    if (precios.length === 0) return null;
    return precios[0]; // Usar el primer precio como base
  }, [initialVariantes]);

  const [precioGeneral, setPrecioGeneral] = useState<number | null>(precioGeneralInicial);
  const [precioGeneralChanged, setPrecioGeneralChanged] = useState(false);

  const [variantes, setVariantes] = useState<EditableVariante[]>(
    initialVariantes.map(v => ({
      ...v,
      editedStock: v.stockCache ?? 0,
      editedPrecio: v.precioCache ?? precioGeneralInicial,
      precioPersonalizado: v.precioCache !== null && v.precioCache !== precioGeneralInicial,
    }))
  );

  const [filters, setFilters] = useState({
    color: '',
    talle: '',
    search: '',
  });
  const [showInactivas, setShowInactivas] = useState(true);

  const inactivasCount = useMemo(
    () => variantes.filter((v) => !v.activoSfactory).length,
    [variantes]
  );

  const queryClient = useQueryClient();
  const { updateBulk, isUpdating } = useVariantesStock();
  const bulkSelection = useBulkSelection(variantes);
  const lastProductIdRef = useRef<number | null>(null);
  const lastVariantesSyncKeyRef = useRef<string>('');
  const selectionInitializedRef = useRef(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [showCacheInfo, setShowCacheInfo] = useState(false);

  // Sincronizar variantes cuando cambia el producto o la lista (refetch con scope=todas)
  useEffect(() => {
    if (producto?.id == null) return;
    const syncKey = `${producto.id}:${initialVariantes.map((v) => v.id).join(',')}`;
    if (lastVariantesSyncKeyRef.current === syncKey) return;
    lastVariantesSyncKeyRef.current = syncKey;
    lastProductIdRef.current = producto.id;
    selectionInitializedRef.current = false;
    const precios = initialVariantes.map(v => v.precioCache).filter(p => p != null) as number[];
    const precioBase = precios.length > 0 ? precios[0] : null;
    setVariantes(
      initialVariantes.map(v => ({
        ...v,
        editedStock: v.stockCache ?? 0,
        editedPrecio: v.precioCache ?? precioBase,
        precioPersonalizado: false,
      }))
    );
    setPrecioGeneral(precioBase);
    setPrecioGeneralChanged(false);
    setSyncVersion((v) => v + 1);
  }, [producto?.id, initialVariantes]);

  // Solo seleccionar todas al cargar/sincronizar producto (una vez por sync); evita "Maximum update depth"
  useEffect(() => {
    if (
      producto?.id != null &&
      variantes.length > 0 &&
      !selectionInitializedRef.current &&
      lastProductIdRef.current === producto.id
    ) {
      bulkSelection.selectAll();
      selectionInitializedRef.current = true;
    }
  }, [producto?.id, syncVersion]);

  // Obtener valores únicos para filtros
  const coloresUnicos = useMemo(() => 
    Array.from(new Set(variantes.map(v => v.color).filter(Boolean))).sort() as string[],
    [variantes]
  );
  const tallesUnicos = useMemo(() => 
    Array.from(new Set(variantes.map(v => v.talle).filter(Boolean))).sort() as string[],
    [variantes]
  );

  // Filtrar variantes
  const filteredVariantes = useMemo(() => {
    return variantes.filter(v => {
      if (!showInactivas && !v.activoSfactory) return false;
      if (filters.color && v.color !== filters.color) return false;
      if (filters.talle && v.talle !== filters.talle) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          v.sfactoryCodigo?.toLowerCase().includes(searchLower) ||
          v.color?.toLowerCase().includes(searchLower) ||
          v.talle?.toLowerCase().includes(searchLower) ||
          producto.nombre?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [variantes, filters, producto.nombre, showInactivas]);

  // Habilitar Guardar solo si hay selección y algo cambió respecto a valores iniciales (inputs)
  const hasChanges = useMemo(() => {
    if (bulkSelection.selectedCount === 0) return false;
    const selected = variantes.filter(v => bulkSelection.selectedIds.has(v.id));
    return selected.some(
      v =>
        isStockDirty(v.editedStock, v.stockCache) ||
        (v.editedPrecio ?? v.precioCache) !== (v.precioCache ?? null)
    );
  }, [variantes, bulkSelection.selectedIds, bulkSelection.selectedCount]);

  // Notificar cambios al modal
  useEffect(() => {
    onHasChangesChange?.(hasChanges);
  }, [hasChanges, onHasChangesChange]);

  const handleStockChange = (varianteId: number, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setVariantes(prev => prev.map(v => 
      v.id === varianteId 
        ? { ...v, editedStock: (value === '' || isNaN(numValue)) ? 0 : numValue }
        : v
    ));
  };

  const handlePrecioGeneralChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newPrecio = isNaN(numValue as number) ? null : numValue;
    setPrecioGeneral(newPrecio);
    setPrecioGeneralChanged(newPrecio !== precioGeneralInicial);
    // Aplicar solo a las variantes seleccionadas
    setVariantes(prev =>
      prev.map(v =>
        bulkSelection.selectedIds.has(v.id)
          ? { ...v, editedPrecio: newPrecio, precioPersonalizado: false }
          : v
      )
    );
  };

  // Stock único para seleccionadas: valor mostrado y aplicación en vivo
  const selectedVariantes = useMemo(
    () => variantes.filter(v => bulkSelection.selectedIds.has(v.id)),
    [variantes, bulkSelection.selectedIds]
  );
  const selectedStockCommon =
    selectedVariantes.length > 0
      ? (() => {
          const first = selectedVariantes[0].editedStock ?? 0;
          const allSame = selectedVariantes.every(v => (v.editedStock ?? 0) === first);
          return allSame ? first : null;
        })()
      : null;
  const [stockInputValue, setStockInputValue] = useState<string>('');
  const stockInputDisplay =
    stockInputValue !== ''
      ? stockInputValue
      : selectedStockCommon !== null
        ? String(selectedStockCommon)
        : '';

  const selectionKey = useMemo(
    () => Array.from(bulkSelection.selectedIds).sort((a, b) => a - b).join(','),
    [bulkSelection.selectedIds]
  );
  useEffect(() => {
    setStockInputValue('');
  }, [producto?.id, selectionKey]);

  const handleStockInputChange = (value: string) => {
    setStockInputValue(value);
    const num = value.trim() === '' ? 0 : parseFloat(value);
    const finalNum = isNaN(num) ? 0 : Math.max(0, num);
    setVariantes(prev =>
      prev.map(v =>
        bulkSelection.selectedIds.has(v.id) ? { ...v, editedStock: finalNum } : v
      )
    );
  };

  const handlePrecioChange = (varianteId: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newPrecio = isNaN(numValue as number) ? null : numValue;
    
    setVariantes(prev => prev.map(v => {
      if (v.id === varianteId) {
        const precioPersonalizado = newPrecio !== precioGeneral;
        return { 
          ...v, 
          editedPrecio: newPrecio,
          precioPersonalizado,
        };
      }
      return v;
    }));
  };

  const handleSaveAll = async () => {
    // Solo las variantes seleccionadas: precio general y stock editado por fila
    const selected = variantes.filter(v => bulkSelection.selectedIds.has(v.id));
    const updates = selected.map(v => ({
      id: v.id,
      stockCache: Number(v.editedStock ?? 0),
      precioCache: Number(precioGeneral ?? v.editedPrecio ?? v.precioCache ?? 0),
    }));

    if (updates.length === 0) return;

    try {
      await updateBulk(updates);
      const newPrecioGeneral = precioGeneral;
      setVariantes(prev => prev.map(v => {
        const update = updates.find(u => u.id === v.id);
        if (update) {
          return {
            ...v,
            stockCache: update.stockCache ?? 0,
            precioCache: update.precioCache ?? null,
            editedStock: update.stockCache ?? 0,
            editedPrecio: update.precioCache ?? null,
            precioPersonalizado: false,
          };
        }
        return v;
      }));
      setPrecioGeneralChanged(false);
      setStockInputValue('');
      await queryClient.refetchQueries({ queryKey: productosKeys.completo(producto.id) });
      onSuccess?.();
      toast.success(`Cambios guardados exitosamente. ${updates.length} variante(s) actualizada(s).`);
    } catch (error) {
      console.error('Error guardando cambios:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar los cambios';
      toast.error(`Error al guardar cambios: ${errorMessage}`);
    }
  };

  const colorOptions = useMemo(
    () => [{ value: '', label: 'Todos los colores' }, ...coloresUnicos.map((c) => ({ value: c, label: c }))],
    [coloresUnicos]
  );
  const talleOptions = useMemo(
    () => [{ value: '', label: 'Todos los talles' }, ...tallesUnicos.map((t) => ({ value: t, label: t }))],
    [tallesUnicos]
  );

  const { data: config } = useEmpresaPrecioConfig();

  const preciosDerivados = useMemo(
    () => calcularPreciosDerivados(precioGeneral, config ?? undefined),
    [precioGeneral, config]
  );

  const formatPrecio = (n: number) =>
    n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Precio, stock y precios derivados en una sola fila */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shrink-0">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-sm font-medium text-gray-700">Precio</label>
              <button
                type="button"
                onClick={() => setShowCacheInfo(true)}
                className="p-0.5 rounded-full hover:bg-gray-200 text-gray-500"
                aria-label="Información sobre caché ecommerce"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={precioGeneral ?? ''}
                onChange={(e) => handlePrecioGeneralChange(e.target.value)}
                className={`
                  w-32 px-3 py-2 border rounded text-right text-sm font-medium
                  focus:outline-none focus:ring-2 focus:ring-black
                  ${precioGeneralChanged ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                `}
                placeholder="0.00"
              />
              {precioGeneralChanged && (
                <span className="text-sm text-blue-600 font-medium">• Modificado</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              min="0"
              step="1"
              value={stockInputDisplay}
              onChange={(e) => handleStockInputChange(e.target.value)}
              disabled={bulkSelection.selectedCount === 0}
              className="w-24 px-3 py-2 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:text-gray-500"
              placeholder={bulkSelection.selectedCount === 0 ? '—' : '0'}
            />
          </div>
          {precioGeneral != null && precioGeneral > 0 && (
            <>
              <div className="hidden sm:block w-px h-10 bg-gray-200 self-center" aria-hidden />
              <div>
                <span className="text-gray-500 block text-xs">
                  Transferencia ({config ? (config.descuentoTransferencia * 100).toFixed(0) : 15}% desc.)
                </span>
                <span className="font-medium text-gray-800 text-sm">
                  ${preciosDerivados.precioTransfer != null ? formatPrecio(preciosDerivados.precioTransfer) : '–'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Precio sin imp.</span>
                <span className="font-medium text-gray-800 text-sm">
                  ${preciosDerivados.precioSinImp != null ? formatPrecio(preciosDerivados.precioSinImp) : '–'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <BaseModal
        isOpen={showCacheInfo}
        onClose={() => setShowCacheInfo(false)}
        title="Caché ecommerce (por producto padre)"
        size="sm"
        zIndex={1000001}
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          Los valores de <strong>precio</strong> y <strong>stock</strong> que guardás acá actualizan la base de la tienda para las variantes seleccionadas (misma idea que las imágenes: todo el producto desde un solo lugar). En{' '}
          <strong>S-Factory</strong> cada SKU es un ítem distinto; para alinear precio/stock con el ERP usá la edición/sync correspondiente.
        </p>
      </BaseModal>

      {/* Selección bulk */}
      <div className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-100 shrink-0">
        <span className="text-sm text-gray-600">
          {bulkSelection.selectedCount} de {variantes.length} seleccionada{bulkSelection.selectedCount !== 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={bulkSelection.toggleSelectAll}>
          {bulkSelection.selectedCount === variantes.length ? 'Quitar todas' : 'Seleccionar todas'}
        </Button>
        <Button variant="ghost" size="sm" onClick={bulkSelection.clearSelection}>
          Quitar selección
        </Button>
      </div>

      {/* Filtros rápidos: padding para que los focus rings no se corten */}
      <div className="flex flex-wrap gap-3 overflow-visible py-1 px-1 -mx-1 shrink-0">
        <div className="relative flex-shrink-0 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-64 min-w-0 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
          />
        </div>
        <div className="flex-shrink-0 overflow-visible">
          <Select
            options={colorOptions}
            value={filters.color}
            onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
            variant="ghost"
            size="sm"
            className="min-w-[140px]"
          />
        </div>
        <div className="flex-shrink-0 overflow-visible">
          <Select
            options={talleOptions}
            value={filters.talle}
            onChange={(e) => setFilters(prev => ({ ...prev, talle: e.target.value }))}
            variant="ghost"
            size="sm"
            className="min-w-[140px]"
          />
        </div>
        {inactivasCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={showInactivas}
              onChange={(e) => setShowInactivas(e.target.checked)}
              className="rounded border-gray-300 text-black focus:ring-black"
            />
            Mostrar inactivas ({inactivasCount})
          </label>
        )}
        <div className="flex items-center justify-end flex-shrink-0 ml-auto">
          <Button
            onClick={handleSaveAll}
            disabled={!hasChanges || isUpdating || bulkSelection.selectedCount === 0}
            variant="black"
            size="md"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabla con scroll interno */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto border border-gray-200 rounded-lg mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={variantes.length > 0 && bulkSelection.selectedCount === variantes.length}
                  onChange={bulkSelection.toggleSelectAll}
                  className="rounded border-gray-300 text-black focus:ring-black"
                  aria-label="Seleccionar todas las variantes"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">SKU</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Color</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Talle</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Stock</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Precio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVariantes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No hay variantes que coincidan con los filtros
                </td>
              </tr>
            ) : (
              filteredVariantes.map((variante, index) => {
                const stockChanged = isStockDirty(
                  variante.editedStock,
                  variante.stockCache
                );
                const precioChanged = variante.precioPersonalizado
                  ? variante.editedPrecio !== variante.precioCache
                  : (variante.editedPrecio !== precioGeneral);
                const stockValue = variante.editedStock ?? 0;
                const isStockBajo = stockValue > 0 && stockValue < 10;
                const isStockAgotado = stockValue === 0;
                const motivo: MotivoInactivoVariante | undefined =
                  !variante.activoSfactory ? variante.motivoInactivo ?? 'sin_stock_deposito' : undefined;

                return (
                  <motion.tr
                    key={variante.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`
                      hover:bg-gray-50 transition-colors
                      ${!variante.activoSfactory ? 'opacity-75 bg-gray-50/80' : ''}
                      ${stockChanged || precioChanged ? 'bg-blue-50' : ''}
                    ${bulkSelection.selectedIds.has(variante.id) ? 'bg-blue-50/70' : ''}
                    `}
                  >
                    <td className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={bulkSelection.selectedIds.has(variante.id)}
                        onChange={() => bulkSelection.toggleSelect(variante.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-black focus:ring-black"
                        aria-label={`Seleccionar ${variante.sfactoryCodigo}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs">{variante.sfactoryCodigo}</span>
                        {motivo && motivo !== 'activa' && (
                          <span
                            className={`inline-flex w-fit text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeClassMotivoInactivo(motivo)}`}
                          >
                            {labelMotivoInactivo(motivo)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm">{formatNombreConGenero(producto.nombre, producto.genero)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{variante.color || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{variante.talle || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variante.editedStock ?? 0}
                        onChange={(e) => handleStockChange(variante.id, e.target.value)}
                        className={`
                          w-24 px-2 py-1 border rounded text-right text-sm
                          focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1
                          ${stockChanged ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                          ${isStockBajo ? 'border-orange-300 bg-orange-50' : ''}
                          ${isStockAgotado ? 'border-red-300 bg-red-50' : ''}
                        `}
                      />
                      {(stockChanged || isStockBajo || isStockAgotado) && (
                        <div className="text-xs mt-1">
                          {stockChanged && (
                            <span className="text-blue-600">• Modificado</span>
                          )}
                          {isStockBajo && !stockChanged && (
                            <span className="text-orange-600">• Stock bajo</span>
                          )}
                          {isStockAgotado && !stockChanged && (
                            <span className="text-red-600">• Agotado</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variante.editedPrecio ?? ''}
                        onChange={(e) => handlePrecioChange(variante.id, e.target.value)}
                        className={`
                          w-32 px-2 py-1 border rounded text-right text-sm
                          focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1
                          ${precioChanged ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                          ${!variante.precioPersonalizado ? 'bg-gray-50' : ''}
                        `}
                        placeholder={precioGeneral != null && typeof precioGeneral === 'number' ? precioGeneral.toFixed(2) : "0.00"}
                      />
                      {precioChanged && (
                        <div className="text-xs mt-1 text-blue-600">• Modificado</div>
                      )}
                      {!variante.precioPersonalizado && (
                        <div className="text-xs mt-1 text-gray-500">• Hereda del padre</div>
                      )}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t flex-shrink-0">
        <span>
          Mostrando {filteredVariantes.length} de {variantes.length} variantes
        </span>
      </div>
    </div>
  );
}

