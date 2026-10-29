import type { StockPreciosSyncData } from '@/app/services/sync.service';

export type StockSyncFeedback = {
  tone: 'success' | 'warning' | 'error';
  message: string;
};

export function stockSyncFeedback(data: StockPreciosSyncData): StockSyncFeedback {
  if (data.skippedDueToLock) {
    return {
      tone: 'warning',
      message: 'Ya hay una sincronización de stock en curso. No se hizo otra consulta.',
    };
  }
  if (data.mode === 'initial') {
    return {
      tone: 'success',
      message: `Inventario inicial: ${data.rowsReceived ?? 0} ítems recibidos · depósito ${data.warehouseId} · ${data.llamadasApi} llamada API`,
    };
  }
  if (data.mode === 'incremental' && (data.rowsReceived ?? 0) === 0) {
    return {
      tone: 'success',
      message: `Stock al día · sin cambios desde la última sincronización · depósito ${data.warehouseId}`,
    };
  }
  if (data.mode === 'incremental') {
    const prices = data.preciosActualizados > 0
      ? ` · ${data.preciosActualizados} precio(s)`
      : '';
    return {
      tone: 'success',
      message: `Stock incremental: ${data.rowsReceived ?? 0} cambio(s) recibido(s) · ${data.variantesActualizadas} variante(s) actualizada(s)${prices} · 1 llamada API`,
    };
  }
  if (data.variantesActualizadas === 0 && data.variantesOmitidas > 0) {
    return {
      tone: 'success',
      message: `Stock: sin cambios (${data.variantesOmitidas} variantes omitidas) · depósito ${data.warehouseId}`,
    };
  }
  if (data.variantesActualizadas === 0) {
    return {
      tone: 'error',
      message: 'Stock: no se encontraron variantes para actualizar.',
    };
  }
  return {
    tone: data.codigosOmitidos?.length ? 'warning' : 'success',
    message: `Stock: ${data.variantesActualizadas} variantes actualizadas · depósito ${data.warehouseId} · ${data.llamadasApi ?? data.lotes} llamada(s) API`,
  };
}
