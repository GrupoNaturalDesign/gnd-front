import { apiClient } from '@/lib/apiClient';

interface SyncProgress {
  current: number;
  total: number;
  message?: string;
}

export interface StockPreciosSyncData {
  warehouseId: number;
  codigosConsultados: number;
  variantesActualizadas: number;
  variantesOmitidas: number;
  preciosActualizados: number;
  lotes: number;
  llamadasApi: number;
  codigosOmitidos: string[];
  variantesBloqueadasPorWhitelist?: number;
  detalleBloqueadasWhitelist?: VarianteBloqueadaWhitelist[];
}

export interface CatalogoSyncStats {
  procesados: number;
  exitosos: number;
  fallidos: number;
}

export interface VarianteBloqueadaWhitelist {
  codigoAgrupacion: string;
  sfactoryCodigo: string;
  color: string;
  stock: number;
}

export interface ProductosSyncResumen {
  productosSfactory?: number;
  productosSfactoryOmitidos?: number;
  productosPadre?: number;
  productosWeb?: number;
  productosWebOmitidos?: number;
  gruposProcesados?: number;
  gruposOmitidos?: number;
  exitosos?: number;
  fallidos?: number;
  variantesBloqueadasPorWhitelist?: number;
  detalleBloqueadasWhitelist?: VarianteBloqueadaWhitelist[];
}

export interface ProductosSyncResult {
  rubros?: CatalogoSyncStats;
  subrubros?: CatalogoSyncStats;
  syncSfactory?: {
    procesados: number;
    insertados: number;
    actualizados: number;
    omitidos: number;
  };
  procesamiento?: {
    gruposProcesados: number;
    gruposOmitidos: number;
    productosWebOmitidos: number;
    productosPadreCreados: number;
    productosWebCreados: number;
    exitosos: number;
    fallidos: number;
    variantesBloqueadasPorWhitelist?: number;
    detalleBloqueadasWhitelist?: VarianteBloqueadaWhitelist[];
  };
  resumen?: ProductosSyncResumen;
  stockPrecios?: StockPreciosSyncData;
}

class SyncService {
  /**
   * Stock y precios desde depósito ecommerce (S-Factory inventario), solo variantes WORKWEAR/OFFICE.
   */
  async syncStockPrecios(warehouseId?: number): Promise<{
    success: boolean;
    message?: string;
    data: StockPreciosSyncData;
  }> {
    const endpoint = `/sync/stock-precios`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await apiClient.post<StockPreciosSyncData>(
        endpoint,
        warehouseId != null ? { warehouseId } : {},
        { signal: controller.signal }
      );

      if (!response.success || response.data === undefined) {
        throw new Error(response.message || 'Error al sincronizar stock y precios');
      }

      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : error && typeof error === 'object' && 'message' in error
            ? String((error as { message: string }).message)
            : 'Error desconocido';
      throw new Error(errorMessage);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sincroniza productos desde SFactory
   * @param onProgress - Callback opcional para recibir progreso de la sincronización
   */
  async syncProductos(
    onProgress?: (progress: SyncProgress) => void,
    options?: { forceReprocess?: boolean }
  ): Promise<ProductosSyncResult> {
    const qs = options?.forceReprocess ? '?forceReprocess=true' : '';
    const endpoint = `/sync/productos${qs}`;
    
    try {
      // Notificar inicio
      onProgress?.({ current: 0, total: 100, message: 'Iniciando sincronización...' });
      
      // Crear AbortController para timeout de 5 minutos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 300000); // 5 minutos
      
      // Notificar progreso intermedio (fetch no soporta progreso real)
      onProgress?.({ current: 25, total: 100, message: 'Sincronizando productos...' });
      
      const response = await apiClient.post<ProductosSyncResult>(
        endpoint,
        {},
        {
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.data) {
        throw new Error('Error al sincronizar productos');
      }
      
      onProgress?.({ current: 100, total: 100, message: 'Sincronización completada' });
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Error desconocido';
      
      onProgress?.({ 
        current: 0, 
        total: 100, 
        message: `Error: ${errorMessage}` 
      });
      
      // Re-lanzar el error para que el llamador pueda manejarlo
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(errorMessage);
    }
  }
}

export const syncService = new SyncService();

