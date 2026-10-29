import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { syncService } from '@/app/services/sync.service';
import { productosKeys } from '@/app/utils/productosKeys';
import { useSync } from '@/components/admin/SyncContext';
import { stockSyncFeedback } from '@/app/utils/stockSyncFeedback';

interface UseStockSyncParams {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Error al sincronizar stock';
}

/**
 * Sincroniza solo stock/precios desde el depósito ecommerce (S-Factory inventario).
 */
export function useStockSync({ onSuccess, onError }: UseStockSyncParams = {}) {
  const queryClient = useQueryClient();
  const { setIsSyncing } = useSync();

  const mutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      try {
        return await syncService.syncStockPrecios();
      } finally {
        setIsSyncing(false);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: productosKeys.all });

      const d = result.data;
      if (d) {
        const feedback = stockSyncFeedback(d);
        if (feedback.tone === 'error') toast.error(feedback.message, { duration: 8000 });
        else if (feedback.tone === 'warning') toast(feedback.message, { duration: 8000, icon: '⚠️' });
        else toast.success(feedback.message, { duration: 6000 });
        onSuccess?.(feedback.message);
        return;
      }

      const fallback = result.message || 'Stock actualizado';
      toast.success(fallback);
      onSuccess?.(fallback);
    },
    onError: (error: unknown) => {
      const msg = errorToMessage(error);
      toast.error(msg, { duration: 8000 });
      onError?.(msg);
    },
  });

  return {
    syncStock: mutation.mutateAsync,
    isStockSyncing: mutation.isPending,
  };
}
