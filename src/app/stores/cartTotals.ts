import type { CartItem } from '@/app/types/cart';
import { IVA_RATE } from '@/app/utils/constants';

export function calculateTotals(items: CartItem[] | null | undefined) {
  // El carrito se restaura desde localStorage. Versiones viejas o datos
  // corruptos pueden no incluir `items`; nunca deben bloquear el login.
  const safeItems = Array.isArray(items) ? items : [];
  const itemCount = safeItems.reduce((acc, item) => acc + item.quantity, 0);

  const totalLista = safeItems.reduce((acc, item) => {
    if (item.subtotal === 0 && item.product.precioLista && item.product.precioLista > 0) {
      return acc + item.quantity * item.product.precioLista;
    }
    return acc + item.subtotal;
  }, 0);

  const totalTransfer = safeItems.reduce((acc, item) => {
    if (item.subtotalTransfer !== undefined) {
      return acc + item.subtotalTransfer;
    }
    if (item.product.precioTransfer && item.product.precioTransfer > 0) {
      return acc + item.quantity * item.product.precioTransfer;
    }
    return acc;
  }, 0);

  const subtotalSinImpuestos = totalLista / (1 + IVA_RATE);
  const iva = totalLista - subtotalSinImpuestos;

  return {
    itemCount,
    subtotal: subtotalSinImpuestos,
    subtotalTransfer: totalTransfer / (1 + IVA_RATE),
    totalLista,
    totalTransfer,
    iva,
    total: totalLista,
  };
}
