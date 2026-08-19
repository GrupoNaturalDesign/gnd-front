import { BRAND_NAME, BRAND_SHORT, WHATSAPP_PHONE_NUMBER_FORMATTED } from './constants';

export const seoConfig = {
    defaultTitle: `${BRAND_NAME} - Indumentaria para empresas y Escolares de Diseño`,
    titleTemplate: `%s | ${BRAND_NAME}`,
    defaultDescription: `${BRAND_NAME}: Uniformes empresariales, ropa de trabajo y merchandising de diseño en Córdoba. +25 años de experiencia, +500 clientes satisfechos.`,
    siteUrl: 'https://naturalonline.com.ar',
    siteName: BRAND_NAME,

    // Structured data templates
    organizationSchema: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: BRAND_NAME,
        alternateName: BRAND_SHORT,
        url: 'https://naturalonline.com.ar',
        logo: 'https://naturalonline.com.ar/logo.png',
        description: 'Empresa especializada en indumentaria para empresas, ropa de trabajo y merchandising de diseño con más de 25 años de experiencia en Córdoba, Argentina.',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Rivera Indarte 2143',
            addressLocality: 'Córdoba',
            addressRegion: 'Córdoba',
            postalCode: '5000',
            addressCountry: 'AR'
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: WHATSAPP_PHONE_NUMBER_FORMATTED,
            contactType: 'customer service',
            email: 'ventas@naturalonline.com.ar',
            availableLanguage: 'Spanish'
        },
        sameAs: [
            'https://www.instagram.com/naturaldesign.ntds/'
        ],
        foundingDate: '1999',
        areaServed: {
            '@type': 'Country',
            name: 'Argentina'
        }
    },

    // Local business schema
    localBusinessSchema: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://naturalonline.com.ar',
        name: BRAND_NAME,
        image: 'https://naturalonline.com.ar/og-image.jpg',
        telephone: WHATSAPP_PHONE_NUMBER_FORMATTED,
        email: 'ventas@naturalonline.com.ar',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Rivera Indarte 2143',
            addressLocality: 'Córdoba',
            addressRegion: 'Córdoba',
            postalCode: '5000',
            addressCountry: 'AR'
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: -31.4201,
            longitude: -64.1888
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '09:00',
                closes: '18:00'
            }
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '127'
        },
        priceRange: '$$'
    }
}

export const noIndexRobots = {
    index: false,
    follow: false,
} as const;

// Función para generar metadata dinámica
export function generatePageMetadata(
    title: string,
    description: string,
    path: string = '',
    images?: string[]
) {
    const url = `${seoConfig.siteUrl}${path}`

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            siteName: seoConfig.siteName,
            images: images || ['/og-image.jpg'],
            locale: 'es_AR',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: images || ['/twitter-image.jpg'],
        },
    }
}
