import { seoConfig } from './seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

/** Rutas públicas indexables (sin query params). */
export const INDEXABLE_STATIC_PATHS = [
  '/',
  '/shoponline',
  '/personalizados',
  '/mayorista',
  '/politicas-cambio-devolucion',
] as const;

/** Rutas legacy del sitemap anterior → destino canónico. */
export const LEGACY_SEO_REDIRECTS: Record<string, string> = {
  '/nosotros': '/#nosotros',
  '/contacto': '/#contacto',
  '/preguntas-frecuentes': '/#preguntas',
  '/merchandising': '/shoponline',
  '/uniformes-empresariales': '/personalizados',
  '/uniformes-gastronomia': '/personalizados',
  '/uniformes-industriales': '/personalizados',
  '/uniformes-salud': '/personalizados',
};

interface PublicadosApiResponse {
  success?: boolean;
  data?: Array<{ slug: string | null }>;
  pagination?: { page: number; totalPages: number };
}

export async function fetchPublishedProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  let totalPages = 1;

  try {
    while (page <= totalPages) {
      const url = `${API_URL}/productos/publicados?page=${page}&limit=100&sortBy=nombre&sortOrder=asc`;
      const response = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) break;

      const json = (await response.json()) as PublicadosApiResponse;
      if (!json.success || !Array.isArray(json.data)) break;

      for (const product of json.data) {
        const slug = product.slug?.trim();
        if (slug) slugs.push(slug);
      }

      totalPages = json.pagination?.totalPages ?? 1;
      page += 1;
    }
  } catch {
    return slugs;
  }

  return slugs;
}

export function buildStaticSitemapEntries(): Array<{
  url: string;
  lastModified: Date;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
  priority: number;
}> {
  const baseUrl = seoConfig.siteUrl;
  const now = new Date();

  const priorities: Record<string, { changeFrequency: 'weekly' | 'monthly' | 'yearly'; priority: number }> = {
    '/': { changeFrequency: 'weekly', priority: 1 },
    '/shoponline': { changeFrequency: 'weekly', priority: 0.9 },
    '/personalizados': { changeFrequency: 'monthly', priority: 0.85 },
    '/mayorista': { changeFrequency: 'monthly', priority: 0.85 },
    '/politicas-cambio-devolucion': { changeFrequency: 'yearly', priority: 0.5 },
  };

  return INDEXABLE_STATIC_PATHS.map((path) => {
    const meta = priorities[path] ?? { changeFrequency: 'monthly' as const, priority: 0.7 };
    return {
      url: path === '/' ? baseUrl : `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: meta.changeFrequency,
      priority: meta.priority,
    };
  });
}
