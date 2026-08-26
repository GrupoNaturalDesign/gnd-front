import React from 'react';
import { TableColumn } from '@/components/ui/Table';
import type { ProductoPadreConVariantes } from '@/app/types/producto.types';
import { CheckSquare, Square, Edit, Star, StarOff, Loader2 } from 'lucide-react';

/** Nombre para mostrar: "Camisa Drill Hombre" / "Camisa Drill Mujer" / "Camisa Drill Unisex". Exportado para uso en modales/tablas. */
export function formatNombreConGenero(nombre: string, genero?: string | null): string {
  if (!genero) return nombre;
  const label = genero === 'Masculino' ? 'Hombre' : genero === 'Femenino' ? 'Mujer' : genero;
  return `${nombre} ${label}`;
}

interface GetProductosColumnsParams {
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (producto: ProductoPadreConVariantes) => void;
  onTogglePublicado: (producto: ProductoPadreConVariantes) => void;
  onToggleDestacado: (producto: ProductoPadreConVariantes) => void;
  onManageVariantes: (producto: ProductoPadreConVariantes) => void;
  updatingProductoId: number | null;
  productosCount: number;
}

/**
 * Genera las columnas de la tabla de productos
 */
export function getProductosColumns({
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onTogglePublicado,
  onToggleDestacado,
  onManageVariantes,
  updatingProductoId,
  productosCount,
}: GetProductosColumnsParams): TableColumn<ProductoPadreConVariantes & { 
  variantesCount?: number;
  precioPromedio?: number | null;
  precioRango?: { min: number; max: number } | null;
  stockTotal?: number;
  stockBajo?: number;
}>[] {
  return [
    {
      id: 'select',
      header: () => (
        <button
          onClick={onToggleSelectAll}
          className="flex items-center justify-center"
          title="Seleccionar todos"
        >
          {selectedIds.size === productosCount && productosCount > 0 ? (
            <CheckSquare className="w-5 h-5 text-black" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const productoPadre = row.original as ProductoPadreConVariantes;
        const isSelected = selectedIds.has(productoPadre.id);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(productoPadre.id);
            }}
            className="flex items-center justify-center"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-black" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600 font-medium">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'codigoAgrupacion',
      header: 'SKU',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">
          {row.original.codigoAgrupacion}
        </span>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex flex-wrap items-center gap-2">
            <span>{formatNombreConGenero(row.original.nombre, row.original.genero)}</span>
            {(row.original.coloresPendientesCount ?? 0) > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                {row.original.coloresPendientesCount} color
                {row.original.coloresPendientesCount === 1 ? '' : 'es'} nuevo
                {row.original.coloresPendientesCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {row.original.descripcionCorta && (
            <div className="text-xs text-neutral-500 mt-1">
              {row.original.descripcionCorta}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'rubro',
      header: 'Rubro / Subrubro',
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-medium">{row.original.rubro?.nombre || '-'}</div>
          {row.original.subrubro?.nombre && (
            <div className="text-neutral-500 mt-0.5">
              {row.original.subrubro.nombre}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'genero',
      header: 'Género',
      cell: ({ row }) => {
        const g = row.original.genero;
        if (!g) return <span className="text-sm text-neutral-400">-</span>;
        const label = g === 'Masculino' ? 'Hombre' : g === 'Femenino' ? 'Mujer' : g;
        return <span className="text-sm">{label}</span>;
      },
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="text-sm">{row.original.descripcionCorta || row.original.descripcion || '-'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'variantes',
      header: 'Variantes',
      cell: ({ row }) => {
        const producto = row.original as ProductoPadreConVariantes & { variantesCount?: number };
        const count = producto.variantesCount ?? producto.productosWeb?.length ?? 0;
        return (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-medium">
              {count}
            </span>
            {count > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManageVariantes(producto);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
              >
                Gestionar
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'precio',
      header: 'Precio',
      cell: ({ row }) => {
        const producto = row.original as ProductoPadreConVariantes & { 
          precioRango?: { min: number; max: number } | null;
          precioPromedio?: number | null;
        };
        
        if (producto.precioRango) {
          const { min, max } = producto.precioRango;
          if (min === max) {
            return <span className="text-sm font-medium">${min.toLocaleString()}</span>;
          }
          return (
            <span className="text-sm font-medium">
              ${min.toLocaleString()} - ${max.toLocaleString()}
            </span>
          );
        }
        
        if (producto.precioPromedio) {
          return <span className="text-sm font-medium">${Math.round(producto.precioPromedio).toLocaleString()}</span>;
        }
        
        return <span className="text-sm text-neutral-400">-</span>;
      },
    },
    {
      accessorKey: 'publicado',
      header: 'Estado',
      cell: ({ row }) => {
        const productoPadre = row.original as ProductoPadreConVariantes;
        const isUpdating = updatingProductoId === productoPadre.id;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePublicado(productoPadre);
            }}
            disabled={isUpdating}
            className="flex items-center justify-center"
            title={productoPadre.publicado ? 'Despublicar' : 'Publicar'}
          >
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                productoPadre.publicado ? 'bg-green-500' : 'bg-gray-300'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isUpdating ? (
                <Loader2 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white" />
              ) : (
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    productoPadre.publicado ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              )}
            </div>
          </button>
        );
      },
    },
    {
      accessorKey: 'destacado',
      header: 'Destacado',
      cell: ({ row }) => {
        const productoPadre = row.original as ProductoPadreConVariantes;
        const isUpdating = updatingProductoId === productoPadre.id;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDestacado(productoPadre);
            }}
            disabled={isUpdating}
            className="flex items-center justify-center"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            ) : productoPadre.destacado ? (
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="w-5 h-5 text-neutral-400" />
            )}
          </button>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const productoPadre = row.original as ProductoPadreConVariantes;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(productoPadre);
              }}
              className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];
}

