import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { syncService } from '@/app/services/sync.service';
import { productosKeys } from '@/app/utils/productosKeys';
import { rubrosKeys } from '@/app/utils/rubrosKeys';
import { subrubrosKeys } from '@/app/utils/subrubrosKeys';
import { useSync } from '@/components/admin/SyncContext';

/** Segundos de cooldown en el botón tras un sync exitoso (evitar doble clic / sync seguidos) */
const SYNC_COOLDOWN_SECONDS = 90;

interface UseProductosSyncParams {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Hook para sincronizar productos desde API externa
 * Usa SyncContext para deshabilitar toda la UI durante la sincronización.
 * Tras éxito, aplica cooldown en el botón para limitar llamadas costosas.
 */
export function useProductosSync({ onSuccess, onError }: UseProductosSyncParams = {}) {
  const queryClient = useQueryClient();
  const { setIsSyncing } = useSync();
  const cooldownUntilRef = useRef(0);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntilRef.current - Date.now()) / 1000));
      setCooldownRemainingSeconds(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      try {
        return await syncService.syncProductos();
      } finally {
        setIsSyncing(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productosKeys.all });
      queryClient.invalidateQueries({ queryKey: rubrosKeys.all });
      queryClient.invalidateQueries({ queryKey: subrubrosKeys.all });
      cooldownUntilRef.current = Date.now() + SYNC_COOLDOWN_SECONDS * 1000;
      setCooldownRemainingSeconds(SYNC_COOLDOWN_SECONDS);

      const resumen = data.resumen;
      const paso1 = data.syncSfactory;
      const paso2 = data.procesamiento;
      const rubrosExtra =
        data.rubros != null
          ? ` · rubros ${data.rubros.exitosos}/${data.rubros.procesados}`
          : '';
      const subrubrosExtra =
        data.subrubros != null
          ? ` · subrubros ${data.subrubros.exitosos}/${data.subrubros.procesados}`
          : '';
      const base = 'Sincronización completada';
      const stats = resumen
        ? `${rubrosExtra}${subrubrosExtra} · ${resumen.exitosos ?? '?'} exitosos · ${resumen.productosWeb ?? 0} variantes escritas · ${resumen.productosWebOmitidos ?? 0} omitidas · paso1 omitidos ${paso1?.omitidos ?? resumen.productosSfactoryOmitidos ?? 0} · grupos ${paso2?.gruposProcesados ?? resumen.gruposProcesados ?? '?'}`
        : `${rubrosExtra}${subrubrosExtra}`;
      const stockExtra =
        data.stockPrecios != null
          ? ` · Stock depósito: ${data.stockPrecios.variantesActualizadas} actualizadas`
          : '';

      const bloqueadasResumen = data.resumen?.variantesBloqueadasPorWhitelist ?? 0;
      const bloqueadasStock = data.stockPrecios?.variantesBloqueadasPorWhitelist ?? 0;
      const bloqueadasCount = Math.max(bloqueadasResumen, bloqueadasStock);
      const detalleRaw = [
        ...(data.resumen?.detalleBloqueadasWhitelist ?? []),
        ...(data.procesamiento?.detalleBloqueadasWhitelist ?? []),
        ...(data.stockPrecios?.detalleBloqueadasWhitelist ?? []),
      ];
      const detalleUnico = detalleRaw.filter(
        (row, i, arr) =>
          arr.findIndex((r) => r.sfactoryCodigo === row.sfactoryCodigo) === i
      );
      const bloqueadasExtra =
        bloqueadasCount > 0
          ? ` · ${bloqueadasCount} color(es) nuevo(s) para revisar`
          : '';

      const msg = `${base}${stats}${stockExtra}${bloqueadasExtra}`;
      toast.success(msg, { duration: bloqueadasCount > 0 ? 12000 : 7000 });

      if (detalleUnico.length > 0) {
        const preview = detalleUnico
          .slice(0, 5)
          .map((r) => `${r.sfactoryCodigo} (${r.color})`)
          .join(', ');
        const suffix =
          detalleUnico.length > 5 ? ` y ${detalleUnico.length - 5} más` : '';
        toast(
          `Con stock en Ecommerce, pendientes de aprobar: ${preview}${suffix}. Revisá Gestionar variantes.`,
          { duration: 14000, icon: '⚠️' }
        );
      }

      onSuccess?.(msg);
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error
          ? error.message
          : error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Error al sincronizar productos';
      toast.error(msg, { duration: 8000 });
      onError?.(msg);
    },
  });

  return {
    sync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    cooldownRemainingSeconds,
  };
}

