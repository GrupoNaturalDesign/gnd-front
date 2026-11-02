import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { CartState, CartProduct, CartItem, CustomerData, ShippingData, PaymentData } from '../types/cart';
import { trackMetaAddToCart } from '@/app/analytics/metaPixel/metaPixel.client';

import { WHATSAPP_PHONE_NUMBER, getWhatsAppNumberForUrl } from '@/app/utils/constants';
import { calculateTotals } from '@/app/stores/cartTotals';
import { canAddQuantity } from '@/app/services/stockService';
import { SALES_CONFIG } from '../config/sales.config';

const safeLocalStorage: StateStorage = {
    getItem: (name) => {
        const value = localStorage.getItem(name);
        if (value === null) return null;

        try {
            JSON.parse(value);
            return value;
        } catch {
            // Una entrada corrupta no debe impedir iniciar sesión ni usar la web.
            localStorage.removeItem(name);
            return null;
        }
    },
    setItem: (name, value) => localStorage.setItem(name, value),
    removeItem: (name) => localStorage.removeItem(name),
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            customerData: null,
            shippingData: null,
            paymentData: null,
            itemCount: 0,
            subtotal: 0,
            subtotalTransfer: 0,
            totalLista: 0,
            totalTransfer: 0,
            iva: 0,
            total: 0,
            cuponAplicado: null,
            cuponDescuento: 0,

            addItem: (product: CartProduct, quantity = 1, especificaciones = '', bordado = false) => {
                // Validar stock antes de agregar
                const existingItem = get().items.find(
                    (item) => item.product.id === product.id && 
                    item.especificaciones === especificaciones &&
                    item.bordado === bordado
                );
                const currentQuantity = existingItem?.quantity || 0;
                const stock = product.stock ?? null;
                
                if (!canAddQuantity(stock, currentQuantity, quantity)) {
                    // Stock insuficiente - no agregar
                    return;
                }

                set((state) => {
                    const existingIndex = state.items.findIndex(
                        (item) => item.product.id === product.id && 
                        item.especificaciones === especificaciones &&
                        item.bordado === bordado
                    );

                    let newItems: CartItem[];

                    // Usar precioLista como precio base (si no está, usar precio como fallback)
                    const precioLista = product.precioLista ?? product.precio ?? 0;
                    const precioTransfer = product.precioTransfer ?? null;
                    const precioSinImp = product.precioSinImp ?? null;
                    
                    if (existingIndex > -1) {
                        newItems = [...state.items];
                        const item = newItems[existingIndex];
                        item.quantity += quantity;
                        item.subtotal = item.quantity * precioLista;
                        item.subtotalTransfer = precioTransfer ? item.quantity * precioTransfer : undefined;
                        item.subtotalSinImp = precioSinImp ? item.quantity * precioSinImp : undefined;
                    } else {
                        const newItem: CartItem = {
                            product: {
                                ...product,
                                precio: precioLista, // Mantener compatibilidad
                                precioLista: precioLista,
                                precioTransfer: precioTransfer,
                                precioSinImp: precioSinImp,
                            },
                            quantity,
                            subtotal: quantity * precioLista,
                            subtotalTransfer: precioTransfer ? quantity * precioTransfer : undefined,
                            subtotalSinImp: precioSinImp ? quantity * precioSinImp : undefined,
                            especificaciones: especificaciones || undefined,
                            bordado: bordado || false,
                        };
                        newItems = [...state.items, newItem];
                    }

                    return {
                        items: newItems,
                        ...calculateTotals(newItems),
                    };
                });

                trackMetaAddToCart(product, quantity);
            },

            removeItem: (productId: number) => {
                set((state) => {
                    const newItems = state.items.filter(
                        (item) => item.product.id !== productId
                    );
                    return {
                        items: newItems,
                        ...calculateTotals(newItems),
                    };
                });
            },

            updateQuantity: (productId: number, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }

                set((state) => {
                    const newItems = state.items.map((item) => {
                        if (item.product.id === productId) {
                            // Validar stock disponible (lógica separada y delicada)
                            const stock = item.product.stock;
                            const currentQuantity = item.quantity;
                            if (!canAddQuantity(stock, currentQuantity, quantity - currentQuantity)) {
                                // No permitir incrementar más allá del stock disponible
                                return item;
                            }
                            
                            // Usar precioLista como precio base
                            const precioLista = item.product.precioLista || item.product.precio || 0;
                            const precioTransfer = item.product.precioTransfer || null;
                            const precioSinImp = item.product.precioSinImp || null;
                            
                            return {
                                ...item,
                                quantity,
                                subtotal: quantity * precioLista,
                                subtotalTransfer: precioTransfer ? quantity * precioTransfer : undefined,
                                subtotalSinImp: precioSinImp ? quantity * precioSinImp : undefined,
                            };
                        }
                        return item;
                    });

                    return {
                        items: newItems,
                        ...calculateTotals(newItems),
                    };
                });
            },

            updateEspecificaciones: (productId: number, especificaciones: string) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.product.id === productId
                            ? { ...item, especificaciones }
                            : item
                    ),
                }));
            },

            updateBordado: (productId: number, bordado: boolean) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.product.id === productId
                            ? { ...item, bordado }
                            : item
                    ),
                }));
            },

            clearCart: () => {
                set({
                    items: [],
                    customerData: null,
                    shippingData: null,
                    paymentData: null,
                    itemCount: 0,
                    subtotal: 0,
                    subtotalTransfer: 0,
                    totalLista: 0,
                    totalTransfer: 0,
                    iva: 0,
                    total: 0,
                    cuponAplicado: null,
                    cuponDescuento: 0,
                });
            },

            clearCheckoutSession: () => {
                set((state) => ({
                    customerData: null,
                    shippingData: null,
                    paymentData: null,
                    cuponAplicado: null,
                    cuponDescuento: 0,
                    ...calculateTotals(state.items),
                }));
            },

            setCustomerData: (data: CustomerData) => set({ customerData: data }),
            setShippingData: (data: ShippingData) => set({ shippingData: data }),
            setPaymentData: (data: PaymentData) => set({ paymentData: data }),

            setCuponAplicado: (cupon) => set({
                cuponAplicado: cupon,
                cuponDescuento: cupon ? cupon.descuentoTotal : 0,
            }),

            generateWhatsAppMessage: () => {
                const state = get();
                const { items, customerData, shippingData, subtotal, iva, total, itemCount } = state;

                if (!customerData) return '';

                const isWholesale = itemCount >= SALES_CONFIG.WHOLESALE_MIN_ITEMS;

                let message = `🛍️ *${isWholesale ? 'PEDIDO MAYORISTA' : 'NUEVO PEDIDO'} - NTDS*\n\n`;
                if (isWholesale) {
                    message += `🏢 *PEDIDO MAYORISTA* (${itemCount} unidades)\n`;
                    message += `Este pedido requiere cotización personalizada mayorista.\n\n`;
                }
                message += `📋 *DATOS DEL CLIENTE*\n`;
                message += `Nombre: ${customerData.nombre} ${customerData.apellido}\n`;
                message += `Email: ${customerData.email}\n`;
                message += `Teléfono: ${customerData.telefono}\n`;
                if (customerData.empresa) message += `Empresa: ${customerData.empresa}\n`;
                message += `\n`;

                if (shippingData) {
                    message += `📦 *${shippingData.tipo === 'envio' ? 'ENVÍO' : 'RETIRO'}*\n`;
                    if (shippingData.tipo === 'envio') {
                        message += `Dirección: ${shippingData.direccion}\n`;
                        message += `Localidad: ${shippingData.localidad}, ${shippingData.provincia}\n`;
                        message += `CP: ${shippingData.codigo_postal}\n`;
                    }
                    if (shippingData.fecha_entrega) {
                        message += `Fecha entrega: ${shippingData.fecha_entrega}\n`;
                    }
                    if (shippingData.notas) message += `Notas: ${shippingData.notas}\n`;
                    message += `\n`;
                }

                message += `🛒 *PRODUCTOS*\n`;
                items.forEach((item, index) => {
                    message += `${index + 1}. ${item.product.nombre}\n`;
                    message += `   Cantidad: ${item.quantity}\n`;
                    message += `   Precio unit: $${item.product.precio.toLocaleString('es-AR')}\n`;
                    if (item.especificaciones) {
                        message += `   Detalles: ${item.especificaciones}\n`;
                    }
                    if (item.bordado) {
                        message += `   ✨ Bordado: SÍ\n`;
                    }
                    message += `   Subtotal: $${item.subtotal.toLocaleString('es-AR')}\n\n`;
                });

                message += `💰 *RESUMEN*\n`;
                message += `Total de unidades: ${itemCount}\n`;
                if (isWholesale) {
                    message += `\n🏢 *⚠️ PEDIDO MAYORISTA - REQUIERE COTIZACIÓN ⚠️*\n`;
                    message += `Este pedido de ${itemCount} unidades requiere compra mayorista (mínimo ${SALES_CONFIG.WHOLESALE_MIN_ITEMS} prendas).\n`;
                    message += `Un asesor especializado se pondrá en contacto para ofrecer:\n`;
                    message += `• Precios mayoristas personalizados\n`;
                    message += `• Opciones de personalización (bordado/estampa)\n`;
                    message += `• Formas de pago preferenciales\n`;
                    message += `• Producción programada y logística a medida\n\n`;
                } else {
                    message += `Subtotal: $${subtotal.toLocaleString('es-AR')}\n`;
                    if (iva > 0) message += `IVA (21%): $${iva.toLocaleString('es-AR')}\n`;
                    message += `*TOTAL: $${total.toLocaleString('es-AR')}*\n\n`;
                }
                message += `_Pedido desde naturalonline.com.ar_`;

                return message;
            },
        }),
        {
            name: 'ntds-cart-storage',
            storage: createJSONStorage(() => safeLocalStorage),
            merge: (persistedState, currentState) => {
                const persisted = persistedState && typeof persistedState === 'object'
                    ? persistedState as Partial<CartState>
                    : {};

                return {
                    ...currentState,
                    ...persisted,
                    items: Array.isArray(persisted.items) ? persisted.items : [],
                };
            },
            partialize: (state) => ({
                items: state.items,
                customerData: state.customerData,
                shippingData: state.shippingData,
                paymentData: state.paymentData,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.items = Array.isArray(state.items) ? state.items : [];
                    state.cuponAplicado = null;
                    state.cuponDescuento = 0;
                    const totals = calculateTotals(state.items);
                    state.itemCount = totals.itemCount;
                    state.subtotal = totals.subtotal;
                    state.subtotalTransfer = totals.subtotalTransfer;
                    state.totalLista = totals.totalLista;
                    state.totalTransfer = totals.totalTransfer;
                    state.iva = totals.iva;
                    state.total = totals.total;
                }
            },
        }
    )
);

/** Limpia cupón y datos de checkout sin vaciar productos (p. ej. logout o salir del funnel). */
export function clearCheckoutSession() {
    useCartStore.getState().clearCheckoutSession();
}

export const sendOrderViaWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${getWhatsAppNumberForUrl()}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
};
