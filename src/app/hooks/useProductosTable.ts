import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productoService } from '@/app/services/producto.service';
import { productosKeys } from '@/app/utils/productosKeys';
import type { ProductoPadreConVariantes, ProductoQueryParams, ProductoWebResponse } from '@/app/types/producto.types';
import type { ProductosFilters } from '@/app/filters/hooks/useProductosFilters';

interface UseProductosTableParams {
  empresaId: number;
  page: number;
  limit: number;
  search?: string;
  filters?: ProductosFilters;
}

/**
 * Hook para manejar el fetch y estado de la tabla de productos
 */
export function useProductosTable({ empresaId, page, limit, search, filters }: UseProductosTableParams) {
  const queryParams: ProductoQueryParams = {
    empresaId,
    includeVariantes: true,
    variantesScope: 'todas',
    page,
    limit,
    search: search || undefined,
    rubroId: filters?.rubroId,
    subrubroId: filters?.subrubroId,
    publicado: filters?.publicado,
    sortBy: filters?.orderBy,
    sortOrder: filters?.orderDirection,
  };

  // Query key incluye filtros para cache correcto
  const queryKey = productosKeys.list(
    empresaId,
    page,
    limit,
    search,
    filters?.rubroId,
    filters?.subrubroId,
    filters?.sexo,
    filters?.color,
    filters?.talle,
    filters?.publicado,
    filters?.stockMin,
    filters?.stockMax,
    filters?.orderBy,
    filters?.orderDirection
  );

  const query = useQuery({
    queryKey,
    queryFn: () => productoService.getAll(queryParams),
    staleTime: 1000 * 60 * 30, // 30 minutos - usar cache si los datos son frescos
    gcTime: 1000 * 60 * 60 * 24, // 24 horas - mantener en cache
    refetchOnMount: false, // No refetch si hay datos en cache
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnReconnect: false, // No refetch al reconectar
  });

  // Calcular datos agregados para cada ProductoPadre (NO flatten)
  const productosConVariantes = React.useMemo(() => {
    if (!query.data?.data) return [];
    
    type ProductoConDatosAgregados = ProductoPadreConVariantes & {
      variantesCount: number;
      precioPromedio: number | null;
      precioRango: { min: number; max: number } | null;
      stockTotal: number;
      stockBajo: number; // Cantidad de variantes con stock bajo (< 10)
    };
    
    const productos: ProductoConDatosAgregados[] = query.data.data.map((producto) => {
      const variantes = producto.productosWeb || [];
      // Preferir total en BD (_count) por si el scope filtrara; con scope=todas coincide.
      const variantesCount = Math.max(
        variantes.length,
        producto._count?.productosWeb ?? 0
      );
      
      // Calcular precios
      const precios = variantes
        .map(v => v.precioCache)
        .filter((p): p is number => p !== null && p !== undefined);
      
      const precioPromedio = precios.length > 0 
        ? precios.reduce((sum, p) => sum + p, 0) / precios.length 
        : null;
      
      const precioRango = precios.length > 0
        ? { min: Math.min(...precios), max: Math.max(...precios) }
        : null;
      
      // Calcular stock
      const stockTotal = variantes.reduce((sum, v) => sum + (v.stockCache ?? 0), 0);
      const stockBajo = variantes.filter(v => (v.stockCache ?? 0) < 10).length;
      
      return {
        ...producto,
        variantesCount,
        precioPromedio,
        precioRango,
        stockTotal,
        stockBajo,
      };
    });
    
    // Aplicar filtros frontend (filtrar ProductoPadre basado en sus variantes)
    let filtered = productos;
    
    if (filters?.sexo) {
      const sexoLower = filters.sexo.toLowerCase();
      filtered = filtered.filter((producto) => {
        // Comparar case-insensitive: API devuelve "Masculino"/"Femenino"/"Unisex"
        return producto.productosWeb?.some(v => {
          const vSexo = v.sexo?.toLowerCase() ?? '';
          return vSexo === sexoLower || vSexo === 'unisex';
        });
      });
    }
    
    if (filters?.color) {
      filtered = filtered.filter((producto) => {
        return producto.productosWeb?.some(v => 
          v.color?.toLowerCase() === filters.color?.toLowerCase()
        );
      });
    }
    
    if (filters?.talle) {
      filtered = filtered.filter((producto) => {
        return producto.productosWeb?.some(v => v.talle === filters.talle);
      });
    }
    
    if (filters?.stockMin !== undefined || filters?.stockMax !== undefined) {
      filtered = filtered.filter((producto) => {
        const tieneVarianteConStock = producto.productosWeb?.some(v => {
          const stock = v.stockCache ?? 0;
          if (filters.stockMin !== undefined && stock < filters.stockMin) return false;
          if (filters.stockMax !== undefined && stock > filters.stockMax) return false;
          return true;
        });
        return tieneVarianteConStock;
      });
    }
    
    // Ordenamiento frontend
    if (filters?.orderBy) {
      filtered.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        
        if (filters.orderBy === 'name') {
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
        } else if (filters.orderBy === 'price') {
          aValue = a.precioPromedio ?? 0;
          bValue = b.precioPromedio ?? 0;
        }
        
        if (aValue < bValue) return filters.orderDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.orderDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [query.data?.data, filters]);

  return {
    ...query,
    productosConVariantes,
  };
}

