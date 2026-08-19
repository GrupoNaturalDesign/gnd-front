import type { Metadata } from 'next';
import { BRAND_NAME } from '@/app/utils/constants';
import { generatePageMetadata } from '@/app/utils/seo';

export const metadata: Metadata = generatePageMetadata(
  `Compra Mayorista | ${BRAND_NAME}`,
  `Uniformes mayoristas con hasta 40% OFF, atención personalizada y logística a medida. ${BRAND_NAME} — más de 25 años vistiendo empresas en Córdoba y todo el país.`,
  '/mayorista'
);

export default function MayoristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
