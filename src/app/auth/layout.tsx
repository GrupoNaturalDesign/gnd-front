import type { Metadata } from 'next';
import { noIndexRobots } from '@/app/utils/seo';

export const metadata: Metadata = {
  robots: noIndexRobots,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
