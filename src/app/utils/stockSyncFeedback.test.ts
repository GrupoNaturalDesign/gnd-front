import { describe, expect, it } from 'vitest';
import { stockSyncFeedback } from './stockSyncFeedback';

const base = {
  warehouseId: 52624,
  codigosConsultados: 0,
  variantesActualizadas: 0,
  variantesOmitidas: 0,
  preciosActualizados: 0,
  lotes: 1,
  llamadasApi: 1,
  codigosOmitidos: [],
};

describe('stockSyncFeedback UX', () => {
  it('muestra un delta vacío como estado saludable', () => {
    const feedback = stockSyncFeedback({ ...base, mode: 'incremental', rowsReceived: 0 });
    expect(feedback.tone).toBe('success');
    expect(feedback.message).toContain('Stock al día');
    expect(feedback.message).not.toContain('error');
  });

  it('explica la carga inicial y la cantidad de llamadas', () => {
    const feedback = stockSyncFeedback({ ...base, mode: 'initial', rowsReceived: 2700 });
    expect(feedback.tone).toBe('success');
    expect(feedback.message).toContain('2700 ítems');
    expect(feedback.message).toContain('1 llamada API');
  });

  it('avisa cuando el lease evita una consulta duplicada', () => {
    const feedback = stockSyncFeedback({
      ...base,
      mode: 'incremental',
      skippedDueToLock: true,
      llamadasApi: 0,
    });
    expect(feedback.tone).toBe('warning');
    expect(feedback.message).toContain('No se hizo otra consulta');
  });
});
