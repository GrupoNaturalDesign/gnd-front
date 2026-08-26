import { apiClient } from '@/lib/apiClient';
import type {
  ProductoPadreConVariantes,
  ProductoQueryParams,
  PaginatedResponse,
} from '../types/producto.types';

// Tipos para SFactory
export interface SFactoryItemCreateData {
  codigo?: string | null;
  tipo: string;
  descripcion: string;
  descrip_corta?: string | null;
  detalle?: string | null;
  precio_costo?: number | null;
  precio_venta?: number | null;
  moneda_id?: number | null;
  utilidad_planificada?: number | null;
  iva?: number | null;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  rubro_id?: number | null;
  subrubro_id?: number | null;
  stockeable?: number;
  item_compra?: number | null;
  item_venta?: number;
  item_alquiler?: number | null;
  um_id?: number | null;
  um_compra_id?: number | null;
  usa_lote?: boolean;
  usa_serie?: number;
  usa_vencimiento?: number | null;
  cta_ingresos_id?: number | null;
  cta_costo_venta_id?: number | null;
  cta_egresos_id?: number | null;
  barcode?: string | null;
  clase_id?: number | null;
  linea_id?: number | null;
  ctb_id?: number | null;
}

export interface SFactoryItemEditData extends SFactoryItemCreateData {
  item_id: number;
}

export interface ValidarCodigoResponse {
  existe: boolean;
  disponible: boolean;
  codigo: string;
  mensaje?: string;
}

export interface VariantesPorCodigoBaseResponse {
  codigoBase: string;
  variantes: Array<{
    codigo: string;
    talle: string | null;
    color: string | null;
    numero: number;
  }>;
  ultimoNumero: number;
  siguienteSugerido: number;
  productoPadre: {
    id: number;
    nombre: string;
    sexo: string | null;
  } | null;
}

export interface CombinacionesResponse {
  combinaciones: Array<{ talle: string | null; color: string | null }>;
  total: number;
}

export interface ProductoPadreBusqueda {
  id: number;
  nombre: string;
  sexo: string | null;
  genero?: string | null;
  codigoAgrupacion: string;
  rubro: { id: number; nombre: string } | null;
  variantesCount: number;
}

export interface BuscarProductosPadreResponse {
  productos: ProductoPadreBusqueda[];
  total: number;
}

export interface DatosPlantillaResponse {
  datosSFactory: SFactoryItemCreateData;
  datosLocales: {
    nombre: string;
    descripcion: string | null;
    descripcionCorta: string | null;
    descripcionMarketing: string | null;
    destacado: boolean;
  };
  primeraVariante: {
    talle: string | null;
    color: string | null;
  };
}

export interface ProductoCompletoResponse {
  datosSFactory: SFactoryItemEditData;
  datosLocales: {
    id: number;
    nombre: string;
    descripcion: string | null;
    descripcionCorta: string | null;
    descripcionMarketing: string | null;
    destacado: boolean;
    rubroId: number | null;
    subrubroId: number | null;
  };
  variante: {
    id: number;
    talle: string | null;
    color: string | null;
    sfactoryCodigo: string;
    sfactoryId: number;
  } | null;
  productoPadre: {
    id: number;
    nombre: string;
    sexo: string | null;
    codigoAgrupacion: string;
  };
}

export interface ColorPendienteResponse {
  color: string;
  variantesCount: number;
  stockTotal: number;
  tieneImagen: boolean;
}

class ProductoService {
  /**
   * Construye query string desde un objeto de parámetros
   */
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return '';

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  async getAll(
    params?: ProductoQueryParams
  ): Promise<PaginatedResponse<ProductoPadreConVariantes>> {
    const queryString = this.buildQueryString(params as Record<string, unknown>);
    const endpoint = `/productos${queryString}`;

    const response = await apiClient.getPaginated<ProductoPadreConVariantes>(endpoint);

    return {
      data: response.data || [],
      pagination: response.pagination || {
        page: 1,
        limit: 10,
        total: response.data?.length || 0,
        totalPages: 1,
      },
    };
  }

  async getById(
    id: number,
    options?: { includeVariantes?: boolean; variantesScope?: 'activas' | 'todas' }
  ): Promise<ProductoPadreConVariantes> {
    const includeVariantes = options?.includeVariantes ?? false;
    const scope = options?.variantesScope ?? 'activas';
    const endpoint = `/productos/${id}?includeVariantes=${includeVariantes}&variantesScope=${scope}`;
    const response = await apiClient.get<ProductoPadreConVariantes>(endpoint);
    if (!response.data) {
      throw new Error('Producto no encontrado');
    }
    return response.data;
  }

  async updateDestacado(id: number, destacado: boolean): Promise<ProductoPadreConVariantes> {
    const endpoint = `/productos/${id}`;
    const response = await apiClient.patch<ProductoPadreConVariantes>(endpoint, { destacado });
    if (!response.data) {
      throw new Error('Error al actualizar producto');
    }
    return response.data;
  }

  async updatePublicado(id: number, publicado: boolean): Promise<ProductoPadreConVariantes> {
    const endpoint = `/productos/${id}`;
    const response = await apiClient.patch<ProductoPadreConVariantes>(endpoint, { publicado });
    if (!response.data) {
      throw new Error('Error al actualizar producto');
    }
    return response.data;
  }

  async delete(id: number): Promise<void> {
    const endpoint = `/productos/${id}`;
    await apiClient.delete<{ success: boolean }>(endpoint);
  }

  async bulkUpdatePublicado(ids: number[], publicado: boolean): Promise<void> {
    const endpoint = `/productos/bulk/publicado`;
    await apiClient.patch<{ success: boolean }>(endpoint, { ids, publicado });
  }

  async bulkUpdateDestacado(ids: number[], destacado: boolean): Promise<void> {
    const endpoint = `/productos/bulk/destacado`;
    await apiClient.patch<{ success: boolean }>(endpoint, { ids, destacado });
  }

  async exportToCSV(params?: ProductoQueryParams): Promise<Blob> {
    // Por ahora, exportamos desde el frontend
    const response = await this.getAll(params || {});
    
    // Convertir a CSV
    const headers = ['ID', 'Código', 'Nombre', 'Descripción', 'Rubro', 'Subrubro', 'Publicado', 'Destacado', 'Variantes'];
    const rows = response.data.map((p) => [
      p.id,
      p.codigoAgrupacion,
      p.nombre,
      p.descripcion || '',
      p.rubro?.nombre || '',
      p.subrubro?.nombre || '',
      p.publicado ? 'Sí' : 'No',
      p.destacado ? 'Sí' : 'No',
      p._count?.productosWeb || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // Nuevos métodos para el wizard de productos

  async validarCodigo(codigo: string): Promise<ValidarCodigoResponse> {
    const endpoint = '/productos/validar-codigo';
    const response = await apiClient.post<ValidarCodigoResponse>(endpoint, { codigo });
    if (!response.data) {
      throw new Error('Error al validar código');
    }
    return response.data;
  }

  async obtenerVariantesPorCodigoBase(codigoBase: string): Promise<VariantesPorCodigoBaseResponse> {
    const endpoint = `/productos/variantes/${encodeURIComponent(codigoBase)}`;
    const response = await apiClient.get<VariantesPorCodigoBaseResponse>(endpoint);
    if (!response.data) {
      throw new Error('Error al obtener variantes');
    }
    return response.data;
  }

  async obtenerCombinaciones(productoPadreId: number): Promise<CombinacionesResponse> {
    const endpoint = `/productos/${productoPadreId}/combinaciones`;
    const response = await apiClient.get<CombinacionesResponse>(endpoint);
    if (!response.data) {
      throw new Error('Error al obtener combinaciones');
    }
    return response.data;
  }

  async buscarProductosPadre(params: {
    nombre?: string;
    sexo?: string;
    rubroId?: number;
    limit?: number;
  }): Promise<BuscarProductosPadreResponse> {
    // Limpiar el parámetro nombre antes de construir el query string
    const paramsLimpios = {
      ...params,
      nombre: params.nombre ? params.nombre.trim().replace(/[\t\n\r]/g, '') : undefined,
    };
    
    const queryString = this.buildQueryString(paramsLimpios as Record<string, unknown>);
    const endpoint = `/productos/buscar-padre${queryString}`;
    const response = await apiClient.get<any>(endpoint);
    
    console.log('[buscarProductosPadre] Response completa:', response);
    console.log('[buscarProductosPadre] response.data:', response.data);
    console.log('[buscarProductosPadre] response.total:', (response as any).total);
    
    if (!response.data) {
      throw new Error('Error al buscar productos padre');
    }
    
    // El backend devuelve { success: true, data: [...], total: 1 }
    // apiClient.get normaliza la respuesta como ApiResponse<T>
    // response.data es el array de productos directamente
    // response.total está en el objeto raíz (aunque no esté en el tipo ApiResponse)
    const productos = Array.isArray(response.data) ? response.data : [];
    const total = (response as any).total || 0;
    
    console.log('[buscarProductosPadre] Retornando:', { productos, total });
    
    return {
      productos,
      total,
    };
  }

  async obtenerDatosPlantilla(productoPadreId: number): Promise<DatosPlantillaResponse> {
    const endpoint = `/productos/${productoPadreId}/datos-plantilla`;
    const response = await apiClient.get<DatosPlantillaResponse>(endpoint);
    if (!response.data) {
      throw new Error('Error al obtener datos plantilla');
    }
    return response.data;
  }

  async crearProducto(data: SFactoryItemCreateData): Promise<ProductoPadreConVariantes> {
    const endpoint = '/productos';
    console.log('📤 Enviando a API:', JSON.stringify(data, null, 2));
    const response = await apiClient.post<ProductoPadreConVariantes>(endpoint, data);
    if (!response.data) {
      throw new Error('Error al crear producto');
    }
    console.log('📥 Respuesta completa de la API:', JSON.stringify(response.data, null, 2));
    return response.data;
  }

  async actualizarProductoEnSFactory(itemId: number, data: SFactoryItemEditData): Promise<ProductoPadreConVariantes> {
    const endpoint = `/productos/${itemId}/sfactory`;
    console.log('📤 Actualizando en API - ItemId:', itemId, 'Data:', JSON.stringify(data, null, 2));
    const response = await apiClient.put<ProductoPadreConVariantes>(endpoint, data);
    if (!response.data) {
      throw new Error('Error al actualizar producto en SFactory');
    }
    console.log('📥 Respuesta completa de la API (actualización):', JSON.stringify(response.data, null, 2));
    return response.data;
  }

  async obtenerProductoCompleto(id: number): Promise<ProductoCompletoResponse> {
    const endpoint = `/productos/${id}/completo`;
    const response = await apiClient.get<ProductoCompletoResponse>(endpoint);
    if (!response.data) {
      throw new Error('Error al obtener producto completo');
    }
    return response.data;
  }

  async actualizarDatosLocales(id: number, data: {
    descripcionMarketing?: string;
    descripcionCorta?: string;
    destacado?: boolean;
    nombre?: string;
    descripcion?: string;
  }): Promise<ProductoPadreConVariantes> {
    const endpoint = `/productos/${id}/local`;
    const response = await apiClient.patch<ProductoPadreConVariantes>(endpoint, data);
    if (!response.data) {
      throw new Error('Error al actualizar datos locales');
    }
    return response.data;
  }

  async actualizarDatosVariante(productoWebId: number, data: {
    talle?: string | null;
    color?: string | null;
  }): Promise<{ id: number; talle: string | null; color: string | null }> {
    const endpoint = `/productos/${productoWebId}/variante`;
    const response = await apiClient.patch<{ id: number; talle: string | null; color: string | null }>(endpoint, data);
    if (!response.data) {
      throw new Error('Error al actualizar variante');
    }
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Documentos: Tabla de Talles y Ficha Técnica
  // ---------------------------------------------------------------------------

  async uploadTablaTalles(
    productoPadreId: number,
    file: File
  ): Promise<{ id: number; tablaTallesUrl: string }> {
    const formData = new FormData();
    formData.append('documento', file);
    const response = await apiClient.patch<{ id: number; tablaTallesUrl: string }>(
      `/productos/${productoPadreId}/tabla-talles`,
      formData
    );
    if (!response.data) throw new Error('Error al subir tabla de talles');
    return response.data;
  }

  async deleteTablaTalles(productoPadreId: number): Promise<void> {
    await apiClient.delete(`/productos/${productoPadreId}/tabla-talles`);
  }

  async uploadFichaTecnica(
    productoPadreId: number,
    file: File
  ): Promise<{ id: number; fichaTecnicaUrl: string }> {
    const formData = new FormData();
    formData.append('documento', file);
    const response = await apiClient.patch<{ id: number; fichaTecnicaUrl: string }>(
      `/productos/${productoPadreId}/ficha-tecnica`,
      formData
    );
    if (!response.data) throw new Error('Error al subir ficha técnica');
    return response.data;
  }

  async deleteFichaTecnica(productoPadreId: number): Promise<void> {
    await apiClient.delete(`/productos/${productoPadreId}/ficha-tecnica`);
  }

  async getColoresPendientes(productoPadreId: number): Promise<ColorPendienteResponse[]> {
    const response = await apiClient.get<ColorPendienteResponse[]>(
      `/productos/${productoPadreId}/colores-pendientes`
    );
    return response.data ?? [];
  }

  async aprobarColor(
    productoPadreId: number,
    color: string
  ): Promise<{ color: string; variantesActivadas: number }> {
    const response = await apiClient.post<{ color: string; variantesActivadas: number }>(
      `/productos/${productoPadreId}/colores/aprobar`,
      { color }
    );
    if (!response.data) {
      throw new Error('Error al aprobar color');
    }
    return response.data;
  }
}

export const productoService = new ProductoService();

