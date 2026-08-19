import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import ProductDetailPageContent from '@/app/components/producto/ProductDetailPageContent';
import ProductDetailSkeleton from '@/app/components/producto/ProductDetailSkeleton';
import type { ProductoPadreConVariantes } from '@/app/types/producto-detail.types';
import { getEmpresaId } from '@/app/utils/getEmpresaId';
import { adaptProductoPadreToGroupedProduct } from '@/app/utils/adaptProductoDetail';
import {
  buildProductMicrodata,
  type ProductPageQuery,
} from '@/app/utils/productMicrodata';
import type { ProductoDetailResponse } from '@/app/services/producto-detail.service';
import { noIndexRobots } from '@/app/utils/seo';

const META_DESCRIPTION_MAX = 160;

function buildMetaDescription(producto: ProductoPadreConVariantes): string | undefined {
  const raw =
    producto.metaDescription?.trim() ||
    producto.descripcionCorta?.trim() ||
    producto.descripcionMarketing?.trim() ||
    producto.descripcion?.trim();
  if (!raw) return undefined;
  if (raw.length <= META_DESCRIPTION_MAX) return raw;
  return `${raw.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…`;
}

// SSR: Fetch inicial del producto
async function getProductData(slug: string): Promise<ProductoDetailResponse | null> {
  try {
    const empresaId = getEmpresaId();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

    const encodedSlug = slug.includes('%') ? slug : encodeURIComponent(slug);
    const url = `${apiUrl}/productos/slug/${encodedSlug}?empresaId=${empresaId}&includeVariantes=true`;

    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      console.error('[ProductDetailPage] Error response:', errorText);
      throw new Error(`Failed to fetch product: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.success && data.data) {
      return data.data as ProductoDetailResponse;
    }

    return null;
  } catch (error) {
    console.error('[ProductDetailPage] Error fetching product:', error);
    return null;
  }
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductPageQuery>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const productData = await getProductData(slug);

  if (!productData?.producto) {
    return { title: 'Producto no encontrado' };
  }

  const p = productData.producto;
  const title = p.metaTitle?.trim() || p.nombre;
  const description = buildMetaDescription(p);
  const grouped = adaptProductoPadreToGroupedProduct(p);
  const microdata = buildProductMicrodata(
    grouped,
    p.slug?.trim() || slug,
    query,
    description
  );
  const ogImage = microdata?.imageUrl || grouped.displayProduct.imagen;

  const pathSlug = p.slug?.trim() || slug;
  const canonicalPath = `/producto/${pathSlug}`;
  const hasVariantQuery = Boolean(query.color || query.talle);

  const keywords = [p.rubro?.nombre, p.subrubro?.nombre].filter(
    (k): k is string => Boolean(k)
  );

  return {
    title,
    description,
    ...(keywords.length > 0 && { keywords }),
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalPath,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: {
      canonical: canonicalPath,
    },
    ...(hasVariantQuery ? { robots: noIndexRobots } : {}),
    ...(microdata
      ? {
          other: {
            ...microdata.openGraphProduct,
          },
        }
      : {}),
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const productData = await getProductData(slug);

  if (!productData?.producto) {
    notFound();
  }

  const p = productData.producto;
  const description = buildMetaDescription(p);
  const grouped = adaptProductoPadreToGroupedProduct(p);
  const microdata = buildProductMicrodata(
    grouped,
    p.slug?.trim() || slug,
    query,
    description
  );

  return (
    <ErrorBoundary>
      {microdata ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(microdata.jsonLd),
          }}
        />
      ) : null}
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailPageContent
          initialData={productData}
          slug={slug}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
