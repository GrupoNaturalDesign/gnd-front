'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productoService } from '@/app/services/producto.service';
import { productosKeys } from '@/app/utils/productosKeys';
import type { ColorPendienteResponse } from '@/app/services/producto.service';

interface ColoresPendientesPanelProps {
  productoPadreId: number;
  onAprobado?: () => void;
}

export function ColoresPendientesPanel({
  productoPadreId,
  onAprobado,
}: ColoresPendientesPanelProps) {
  const queryClient = useQueryClient();
  const [aprobandoColor, setAprobandoColor] = useState<string | null>(null);

  const { data: colores = [], isLoading } = useQuery({
    queryKey: [...productosKeys.all, 'colores-pendientes', productoPadreId],
    queryFn: () => productoService.getColoresPendientes(productoPadreId),
  });

  const aprobarMutation = useMutation({
    mutationFn: (color: string) => productoService.aprobarColor(productoPadreId, color),
    onSuccess: (result) => {
      toast.success(
        `${result.color}: ${result.variantesActivadas} variante(s) publicada(s) en tienda`
      );
      queryClient.invalidateQueries({ queryKey: productosKeys.all });
      onAprobado?.();
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'No se pudo aprobar el color';
      toast.error(msg);
    },
    onSettled: () => setAprobandoColor(null),
  });

  if (isLoading) {
    return (
      <p className="text-sm text-gray-500 mb-3">Buscando colores nuevos para revisar…</p>
    );
  }

  if (colores.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex-shrink-0">
      <h3 className="text-sm font-semibold text-amber-900 mb-1">
        Colores nuevos para revisar
      </h3>
      <p className="text-xs text-amber-800 mb-3">
        Tienen stock en Ecommerce pero no están en el assortiment configurado. Aprobá para
        publicarlos en la tienda.
      </p>
      <ul className="space-y-2">
        {colores.map((item: ColorPendienteResponse) => (
          <li
            key={item.color}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 border border-amber-100"
          >
            <div className="text-sm">
              <span className="font-medium text-gray-900">{item.color}</span>
              <span className="text-gray-500 ml-2">
                {item.variantesCount} variante(s) · stock {item.stockTotal}
                {!item.tieneImagen && (
                  <span className="text-amber-700 ml-1">· sin imagen</span>
                )}
              </span>
            </div>
            <button
              type="button"
              disabled={aprobandoColor === item.color}
              onClick={() => {
                setAprobandoColor(item.color);
                aprobarMutation.mutate(item.color);
              }}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {aprobandoColor === item.color ? 'Publicando…' : 'Aceptar y publicar en la tienda'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
