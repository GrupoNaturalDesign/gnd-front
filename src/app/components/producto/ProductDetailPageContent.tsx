"use client";

import React, { Suspense, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import Section from '@/app/components/Section';
import { useProductDetail } from '@/app/hooks/useProductDetail';
import { useProductImages } from '@/app/hooks/useProductImages';
import { useProductVariants } from '@/app/hooks/useProductVariants';
import { useProductCart } from '@/app/hooks/useProductCart';
import { useBordado } from '@/app/hooks/useBordado';
import { useWholesaleModal } from '@/app/hooks/useWholesaleModal';
import { useRelatedProductsPrefetch } from '@/app/hooks/useRelatedProductsPrefetch';
import ProductHeader from '@/app/components/producto/ProductHeader';
import ProductImageGallery from '@/app/components/producto/ProductImageGallery';
import ProductInfo from '@/app/components/producto/ProductInfo';
import ProductVariantSelector from '@/app/components/producto/ProductVariantSelector';
// import ProductSpecs from '@/app/components/producto/ProductSpecs';
import QuantityControlsProductPage from '@/app/components/producto/QuantityControlsProductPage';
import ProductDetailMetaCard from '@/app/components/producto/ProductDetailMetaCard';
import ProductImageModal from '@/app/components/producto/ProductImageModal';
import ProductNotFound from '@/app/components/producto/ProductNotFound';
import RelatedProducts from '@/app/components/producto/RelatedProducts';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import { useProductDiscount } from '@/app/components/product-card/hooks/useProductDiscount';
import type { ProductoDetailResponse } from '@/app/services/producto-detail.service';

// Skeletons específicos
import { ProductHeaderSkeleton } from '../skeleton/ProductHeaderSkeleton';
import { ProductImageGallerySkeleton } from '../skeleton/ProductImageGallerySkeleton';
import { ProductInfoSkeleton } from '../skeleton/ProductInfoSkeleton';
import { ProductVariantsSkeleton } from '../skeleton/ProductVariantsSkeleton';
import { RelatedProductsSkeleton } from '../skeleton/RelatedProductsSkeleton';
import ProductDetailSkeleton from './ProductDetailSkeleton';
import { trackMetaViewContent } from '@/app/analytics/metaPixel/metaPixel.client';

interface ProductDetailPageContentProps {
  initialData: ProductoDetailResponse;
  slug?: string;
}

export default function ProductDetailPageContent({ 
  initialData, 
}: ProductDetailPageContentProps) {
  // Hook principal para cargar el producto (usa initialData)
  const { groupedProduct, relatedProducts, isLoading } = useProductDetail({
    initialData,
  });

  // Hook para modal de confirmación mayorista
  const { 
    isWholesaleModalOpen, 
    isWholesaleModalLoading, 
    wholesaleModalOptions, 
    showWholesaleModal, 
    closeWholesaleModal, 
    handleWholesaleConfirm 
  } = useWholesaleModal();

  // Memoizar productName para evitar recálculos innecesarios
  const productName = useMemo(
    () => groupedProduct?.displayProduct?.NOMBRE || groupedProduct?.skuBase || 'Sin nombre',
    [groupedProduct]
  );

  // Producto agotado: ninguna variante tiene stock
  const productOutOfStock = useMemo(
    () =>
      Boolean(
        groupedProduct?.variants?.length &&
          groupedProduct.variants.every((v) => (v.stock ?? 0) === 0)
      ),
    [groupedProduct]
  );

  // Hook para manejar variantes (debe llamarse siempre, incluso si no hay producto)
  const {
    selectedColor,
    selectedSize,
    selectedVariant,
    orderedAvailableSizes,
    hasColors,
    handleColorSelect,
    handleSizeSelect,
    colorSelectability,
  } = useProductVariants(groupedProduct);

  // Este color agotado: el color seleccionado no tiene stock en ningún talle
  const selectedColorOutOfStock = useMemo(
    () =>
      Boolean(
        selectedColor &&
          groupedProduct?.variants?.length &&
          groupedProduct.variants
            .filter((v) => v.color === selectedColor)
            .every((v) => (v.stock ?? 0) === 0)
      ),
    [groupedProduct, selectedColor]
  );
  const showOutOfStock = productOutOfStock || selectedColorOutOfStock;

  const precioListaDetail = useMemo(() => {
    const precio = selectedVariant?.producto?.PrecioVenta;
    return precio != null ? Number(precio) : null;
  }, [selectedVariant]);

  const { descuento: descuentoDetail } = useProductDiscount({
    precioLista: precioListaDetail,
    precioTransfer: selectedVariant?.producto?.precioTransfer ?? null,
  });

  const galleryImagenes = useMemo(() => {
    const variantImgs = selectedVariant?.producto?.imagenes;
    if (variantImgs && variantImgs.length > 0) return variantImgs;
    return groupedProduct?.displayProduct?.imagenes;
  }, [selectedVariant, groupedProduct?.displayProduct?.imagenes]);

  const galleryImagen = useMemo(() => {
    const variantImg = selectedVariant?.producto?.imagen;
    if (variantImg?.trim()) return variantImg;
    return groupedProduct?.displayProduct?.imagen ?? null;
  }, [selectedVariant, groupedProduct?.displayProduct?.imagen]);

  const {
    images,
    currentImageIndex,
    isImageModalOpen,
    modalImages,
    modalImageIndex,
    nextImage,
    prevImage,
    goToImage,
    openModal,
    closeModal,
    modalLabel,
  } = useProductImages(galleryImagenes, galleryImagen, 5);
    
  // Ref para el getter de bordado (se actualizará después de que useBordado se inicialice)
  const bordadoRef = React.useRef<boolean>(false);
  
  // Hook para manejar el carrito (debe llamarse primero para obtener cartItem)
  const { 
    handleIncrement, 
    handleDecrement,
    handleBordadoChange,
    isAdding, 
    inCart, 
    currentQuantity,
    canAddMore, 
    maxReached,
    cartItem,
  } = useProductCart(
    groupedProduct,
    groupedProduct?.displayProduct,
    selectedVariant,
    showWholesaleModal,
    () => bordadoRef.current // Getter de bordado desde ref
  );

  // Hook para manejar bordado (reutilizable)
  // Usa cartItem y handleBordadoChange de useProductCart
  const {
    bordado,
    canActivateBordado,
    handleBordadoToggle,
  } = useBordado({
    cartItem,
    handleBordadoChange,
  });

  const onBordadoChange = useCallback(
    (value: boolean) => {
      if (showOutOfStock && value) {
        toast.error('No podés activar bordado en un producto sin stock.', { duration: 4000 });
        return;
      }
      handleBordadoToggle(value);
    },
    [showOutOfStock, handleBordadoToggle],
  );

  // Sincronizar el ref con el valor de bordado del hook
  React.useEffect(() => {
    bordadoRef.current = bordado;
  }, [bordado]);

  // Prefetch productos relacionados cuando estén disponibles
  useRelatedProductsPrefetch(relatedProducts);

  const viewContentTrackedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (isLoading || !groupedProduct || !selectedVariant) return;

    const contentId =
      selectedVariant.codigo?.trim() ||
      String(selectedVariant.productoWebId ?? selectedVariant.sfactoryItemId ?? '');
    if (!contentId || viewContentTrackedRef.current === contentId) return;

    viewContentTrackedRef.current = contentId;

    const rawPrice = selectedVariant.producto?.PrecioVenta;
    const value =
      typeof rawPrice === 'number'
        ? rawPrice
        : parseFloat(String(rawPrice ?? '').replace(/[^0-9.-]+/g, '')) || 0;

    const display = groupedProduct.displayProduct;
    trackMetaViewContent({
      contentId,
      contentName: groupedProduct.skuBase || display?.NOMBRE || 'Producto',
      contentCategory: display?.Rubro ?? undefined,
      value,
    });
  }, [isLoading, groupedProduct, selectedVariant]);

  // Estados de carga y error (después de todos los hooks)
  // IMPORTANTE: Verificar loading primero para mostrar skeleton
  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  // ProductNotFound solo cuando realmente no hay producto o variantes
  if (!groupedProduct || !groupedProduct.variants?.length) {
    return <ProductNotFound />;
  }

  // selectedVariant se setea en useEffect de useProductVariants; hasta entonces mostrar skeleton
  if (!selectedVariant) {
    return <ProductDetailSkeleton />;
  }

  // Obtener datos del producto
  const displayProduct = groupedProduct.displayProduct;

  return (
    <div className="min-h-screen bg-white">
      {/* Header con Suspense - mismo ancho que Section/Navbar */}
      <Suspense fallback={<ProductHeaderSkeleton />}>
        <ProductHeader
          groupedProduct={groupedProduct}
          displayProduct={displayProduct}
        />
      </Suspense>

      {/* Contenido principal - mismo ancho que page.tsx y Navbar (px-4 lg:px-15) */}
      <Section
        id="product-content"
        padding="none"
        className="pt-2 sm:pt-3 pb-6 sm:pb-8"
        contentClassName="w-full px-4 lg:px-15"
        noPadding
      >
        {/* Galería (ancho de la img) + info (espacio restante) */}
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8 gap-4 sm:gap-6 mb-6 sm:mb-8" style={{ overflow: 'visible' }}>
          <div className="shrink-0 w-full lg:w-auto relative overflow-visible">
            <Suspense fallback={<ProductImageGallerySkeleton />}>
              <ProductImageGallery
                product={selectedVariant.producto}
                productName={productName}
                images={images}
                currentImageIndex={currentImageIndex}
                onImageChange={goToImage}
                onNext={nextImage}
                onPrev={prevImage}
                onOpenModal={openModal}
                isOutOfStock={showOutOfStock}
                stock={selectedVariant?.stock}
                destacado={groupedProduct.destacado}
                descuento={descuentoDetail}
              />
            </Suspense>
            {/* Código y Categoría — oculto por ahora
            <div className="mt-3 w-full">
              <ProductSpecs
                selectedVariant={selectedVariant}
                displayProduct={displayProduct}
              />
            </div>
            */}
          </div>

          {/* Info del producto */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex flex-col gap-4 sm:gap-5">
              {/* Nombre */}
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                  {productName}
                </h1>
              </div>

              <Suspense fallback={<ProductInfoSkeleton />}>
                <ProductInfo
                  productName={productName}
                  displayProduct={displayProduct}
                  selectedVariant={selectedVariant}
                  price={selectedVariant.producto.PrecioVenta}
                  hideTitle
                  bordado={bordado}
                  onBordadoChange={onBordadoChange}
                  canActivateBordado={canActivateBordado}
                />
              </Suspense>

              <Suspense fallback={<ProductVariantsSkeleton />}>
                <ProductVariantSelector
                  groupedProduct={groupedProduct}
                  selectedColor={selectedColor}
                  selectedSize={selectedSize}
                  availableSizes={orderedAvailableSizes}
                  hasColors={hasColors}
                  colorSelectability={colorSelectability}
                  onColorSelect={handleColorSelect}
                  onSizeSelect={handleSizeSelect}
                />
              </Suspense>

              <QuantityControlsProductPage
                currentQuantity={currentQuantity}
                isAdding={isAdding}
                isInCart={inCart}
                canAddMore={canAddMore}
                maxReached={maxReached}
                maxReachedStock={!canAddMore && !maxReached}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                disabled={selectedVariant?.producto?._isVirtual === true || showOutOfStock}
                outOfStock={(selectedVariant?.stock ?? 0) === 0 || showOutOfStock}
              />
            </div>

            <ProductDetailMetaCard
              product={selectedVariant.producto}
              selectedVariant={selectedVariant}
              displayProduct={displayProduct}
              onOpenImageModal={openModal}
              className="mt-6 sm:mt-8"
            />
          </div>
        </div>

        {/* Productos relacionados con Suspense */}
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts relatedProducts={relatedProducts} />
        </Suspense>
      </Section>

      {/* Modal de imagen expandida */}
      <ProductImageModal
        isOpen={isImageModalOpen}
        onClose={closeModal}
        images={modalImages}
        currentImageIndex={modalImageIndex}
        productName={modalLabel ?? productName}
        onNext={nextImage}
        onPrev={prevImage}
      />

      {/* Modal de confirmación mayorista */}
      <ConfirmModal
        isOpen={isWholesaleModalOpen}
        onClose={closeWholesaleModal}
        onConfirm={handleWholesaleConfirm}
        loading={isWholesaleModalLoading}
        {...wholesaleModalOptions}
      />
    </div>
  );
}

