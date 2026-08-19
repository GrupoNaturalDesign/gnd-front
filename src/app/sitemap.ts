import type { MetadataRoute } from 'next';
import { seoConfig } from './utils/seo';
import {
  buildStaticSitemapEntries,
  fetchPublishedProductSlugs,
} from './utils/sitemap-data';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = buildStaticSitemapEntries();
  const slugs = await fetchPublishedProductSlugs();
  const now = new Date();
  const baseUrl = seoConfig.siteUrl;

  const productEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/producto/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
