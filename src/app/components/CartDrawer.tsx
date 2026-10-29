'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './hooks/useCart';
import ConfirmModal from './modal/ConfirmModal';
import { useConfirmModal } from './hooks/useModal';
import { useCartQuantityUpdate } from './hooks/useCartQuantityUpdate';
import { useCartActions } from './hooks/useCartActions';
import { useSales } from '../contexts/SalesContext';
import { useMounted } from './hooks/useMounted';
import { useCartDrawerAutoClose } from './hooks/useCartDrawerAutoClose';
import { useCartBordadoAutoDisable } from './hooks/useCartBordadoAutoDisable';
import { useSortedCartItems } from './hooks/useSortedCartItems';
import { CartDrawerOverlay } from './cart-drawer/CartDrawerOverlay';
import { CartDrawerHeader } from './cart-drawer/CartDrawerHeader';
import { CartDrawerContent } from './cart-drawer/CartDrawerContent';
import { CartDrawerFooter } from './cart-drawer/CartDrawerFooter';
import { BordadoProgress } from './bordado/BordadoProgress';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const mounted = useMounted();
    
    const {
        itemCount,
        subtotal,
        totalLista,
        totalTransfer,
        isEmpty,
        updateBordado,
        removeFromCart,
        canAddToCart,
    } = useCart();
    
    const { isOpen: isConfirmModalOpen, loading, modalOptions, closeModal, handleConfirm, showModal } = useConfirmModal();
    const { config, isWholesaleLimitReached } = useSales();
    const { updateQuantity } = useCartQuantityUpdate({
        validateWholesaleLimit: true,
    });
    const { 
        handleGoToCart, 
        handleClearCart,
        isInCheckout,
    } = useCartActions({ onClose, showConfirmModal: showModal });

    // Hooks para lógica de negocio
    useCartDrawerAutoClose({ isInCheckout, isOpen, onClose });
    useCartBordadoAutoDisable();
    const sortedItems = useSortedCartItems();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const drawerContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    <CartDrawerOverlay onClose={onClose} />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-screen w-full sm:w-[480px] bg-white shadow-2xl flex flex-col overflow-hidden"
                        style={{ zIndex: 100000 }}
                    >
                        <CartDrawerHeader itemCount={itemCount} onClose={onClose} />

                        {/* Content — solo ítems; scroll cuando desbordan */}
                        <div
                            className={cn(
                                'flex-1 min-h-0 p-3 bg-gray-50',
                                isEmpty ? 'overflow-hidden' : 'overflow-y-auto',
                            )}
                        >
                            <CartDrawerContent
                                isEmpty={isEmpty}
                                sortedItems={sortedItems}
                                itemCount={itemCount}
                                isInCheckout={isInCheckout}
                                canAddToCart={canAddToCart}
                                updateQuantity={updateQuantity}
                                removeFromCart={removeFromCart}
                                updateBordado={updateBordado}
                                onClose={onClose}
                            />
                        </div>

                        {!isEmpty && (
                            <div className="shrink-0 border-t border-gray-200 px-3 pt-2.5 pb-2 bg-white">
                                <BordadoProgress
                                    current={itemCount}
                                    minItems={config.BORDADO_MIN_ITEMS}
                                />
                            </div>
                        )}

                        <CartDrawerFooter
                            isEmpty={isEmpty}
                            items={sortedItems}
                            itemCount={itemCount}
                            subtotal={subtotal}
                            totalLista={totalLista}
                            totalTransfer={totalTransfer}
                            isInCheckout={isInCheckout}
                            isWholesaleLimitReached={isWholesaleLimitReached}
                            config={config}
                            handleGoToCart={handleGoToCart}
                            handleClearCart={handleClearCart}
                            onClose={onClose}
                        />
                    </motion.div>
                    
                    <ConfirmModal
                        isOpen={isConfirmModalOpen}
                        onClose={closeModal}
                        loading={loading}
                        {...modalOptions}
                        onConfirm={handleConfirm}
                    />
                </>
            )}
        </AnimatePresence>
    );

    if (!mounted) return null;

    return createPortal(drawerContent, document.body);
};

export default CartDrawer;
