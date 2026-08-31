import { QueryClient } from '@tanstack/react-query';
import { productoService } from '@/app/services/producto.service';
import { productosKeys } from './productosKeys';
import type { ProductoQueryParams } from '@/app/types/producto.types';
import type { ProductosFilters } from '@/app/filters/hooks/useProductosFilters';

interface PrefetchProductosTableParams {
  empresaId: number;
  page: number;
  limit: number;
  search?: string;
  filters?: Partial<ProductosFilters>;
}

/**
 * Prefetch de datos de productos para SSR
 */
export async function prefetchProductosTable(
  queryClient: QueryClient,
  params: PrefetchProductosTableParams
) {
  const queryParams: ProductoQueryParams = {
    empresaId: params.empresaId,
    includeVariantes: true,
    variantesScope: 'todas',
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    rubroId: params.filters?.rubroId,
    subrubroId: params.filters?.subrubroId,
    publicado: params.filters?.publicado,
    sortBy: params.filters?.orderBy,
    sortOrder: params.filters?.orderDirection,
  };

  await queryClient.prefetchQuery({
    queryKey: productosKeys.list(
      params.empresaId,
      params.page,
      params.limit,
      params.search,
      params.filters?.rubroId,
      params.filters?.subrubroId,
      params.filters?.sexo,
      params.filters?.color,
      params.filters?.talle,
      params.filters?.publicado,
      params.filters?.stockMin,
      params.filters?.stockMax,
      params.filters?.orderBy,
      params.filters?.orderDirection
    ),
    queryFn: () => productoService.getAll(queryParams),
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

