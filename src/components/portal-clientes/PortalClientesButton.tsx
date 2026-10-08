'use client';

import { ExternalLink, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePortalClientesSso } from './usePortalClientesSso';

const LABEL = 'Portal Clientes';

interface PortalClientesButtonProps {
  /** `menu`: ítem de lista (menú de usuario). `button`: botón del design system. */
  appearance?: 'menu' | 'button';
  className?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}

export function PortalClientesButton({
  appearance = 'button',
  className,
  variant,
  size,
}: PortalClientesButtonProps) {
  const { abrirPortal, isLoading } = usePortalClientesSso();

  if (appearance === 'menu') {
    return (
      <button
        type="button"
        onClick={abrirPortal}
        disabled={isLoading}
        aria-busy={isLoading}
        className={cn(
          'w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors',
          isLoading && 'opacity-60 cursor-wait',
          className
        )}
      >
        {LABEL}
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" aria-hidden />
        ) : (
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" aria-hidden />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      onClick={abrirPortal}
      loading={isLoading}
      variant={variant}
      size={size}
      rightIcon={<ExternalLink className="w-4 h-4" aria-hidden />}
      className={className}
    >
      {LABEL}
    </Button>
  );
}
