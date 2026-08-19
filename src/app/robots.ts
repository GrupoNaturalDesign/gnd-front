import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://naturalonline.com.ar'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/auth/',
                    '/checkout/',
                    '/perfil',
                    '/unauthorized',
                    '/maintenance',
                    '/_next/',
                    '/private/',
                    '*.json',
                    '/temp/',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/auth/',
                    '/checkout/',
                    '/perfil',
                    '/unauthorized',
                    '/maintenance',
                    '/private/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    }
}