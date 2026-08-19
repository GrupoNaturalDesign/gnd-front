import type { Metadata } from 'next';
import { BRAND_NAME } from '@/app/utils/constants';
import { generatePageMetadata } from '@/app/utils/seo';

export const metadata: Metadata = generatePageMetadata(
  `Uniformes Personalizados | ${BRAND_NAME}`,
  `Diseño y producción de uniformes personalizados para empresas. ${BRAND_NAME} — bordado, estampa y desarrollo textil a medida. Más de 500 clientes en Córdoba y Argentina.`,
  '/personalizados'
);

export default function PersonalizadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
