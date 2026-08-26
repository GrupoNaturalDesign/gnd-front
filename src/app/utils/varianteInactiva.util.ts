import type { MotivoInactivoVariante } from '@/app/types/producto.types';

export function labelMotivoInactivo(motivo: MotivoInactivoVariante): string {
  switch (motivo) {
    case 'pendiente_aprobacion':
      return 'Pendiente de aprobar';
    case 'sin_stock_deposito':
      return 'Sin stock Ecommerce';
    case 'sin_color':
      return 'Sin color';
    default:
      return '';
  }
}

export function badgeClassMotivoInactivo(motivo: MotivoInactivoVariante): string {
  switch (motivo) {
    case 'pendiente_aprobacion':
      return 'bg-amber-100 text-amber-900';
    case 'sin_stock_deposito':
      return 'bg-gray-100 text-gray-600';
    case 'sin_color':
      return 'bg-red-50 text-red-700';
    default:
      return '';
  }
}

/** @deprecated usar pendiente_aprobacion */
export function normalizeMotivoInactivo(
  motivo: MotivoInactivoVariante | 'color_no_permitido' | undefined
): MotivoInactivoVariante | undefined {
  if (motivo === 'color_no_permitido') return 'pendiente_aprobacion';
  return motivo;
}
