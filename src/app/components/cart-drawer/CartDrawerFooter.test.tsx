import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartDrawerFooter } from './CartDrawerFooter';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('CartDrawerFooter', () => {
  it('muestra el total de transferencia con IVA', () => {
    render(
      <CartDrawerFooter
        isEmpty={false}
        items={[]}
        itemCount={1}
        subtotal={37181.818}
        totalLista={44990}
        totalTransfer={38241.5}
        isInCheckout={false}
        isWholesaleLimitReached={false}
        config={{
          WHOLESALE_ROUTE: '/mayorista',
          SHOP_ROUTE: '/shoponline',
          CHECKOUT_ROUTE: '/checkout',
        }}
        handleGoToCart={vi.fn()}
        handleClearCart={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Con transferencia')).toBeTruthy();
    expect(screen.getByText('$38.241,50')).toBeTruthy();
    expect(screen.queryByText('$31.604,55')).toBeNull();
  });
});
