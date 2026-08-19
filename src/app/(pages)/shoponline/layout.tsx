import type { Metadata } from 'next';
import { BRAND_NAME } from '@/app/utils/constants';
import { generatePageMetadata } from '@/app/utils/seo';

export const metadata: Metadata = generatePageMetadata(
  `Shop Online | ${BRAND_NAME}`,
  `Comprá uniformes profesionales, ropa de trabajo y merchandising de ${BRAND_NAME}. Envío a todo el país, hasta 3 cuotas y 15% off con transferencia.`,
  '/shoponline'
);

export default function ShopOnlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
