import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "./components/ConditionalLayout";
import { Providers } from "./components/Providers";
import NewsletterPopup from "./components/newsletter/NewsletterPopup";
import { BRAND_NAME, BRAND_SHORT, WHATSAPP_PHONE_NUMBER, WHATSAPP_PHONE_NUMBER_FORMATTED } from "./utils/constants";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-NB3MKBCM";

// Fuentes según el manual de marca NTDS
// Franklin Gothic Heavy no está en Google Fonts, usamos Poppins como fallback principal
// Optimizado: solo cargamos los pesos necesarios (400, 600, 700) para reducir bundle size
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Solo los pesos usados en el sitio
  display: "swap",
  preload: true,
});

// Montserrat como alternativa adicional
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Solo los pesos usados en el sitio
  display: "swap",
  preload: false, // No preload ya que es alternativa
});

export const metadata: Metadata = {
  // Base URL para resolver URLs relativas en metadata
  metadataBase: new URL('https://naturalonline.com.ar'),
  
  // Título optimizado para SEO
  title: {
    default: `${BRAND_NAME} - Indumentaria para empresas de diseño`,
    template: `%s | ${BRAND_NAME}`
  },

  // Descripción optimizada con keywords
  description: `${BRAND_NAME}: Indumentaria para empresas, ropa de trabajo y merchandising de diseño en Córdoba. +25 años de experiencia, +500 clientes satisfechos. Calidad y diseño en uniformes profesionales.`,

  // Keywords principales
  keywords: [
    "uniformes empresariales",
    "ropa de trabajo",
    "uniformes escolares",
    "merchandising empresarial",
    "uniformes Córdoba",
    "Natural Design",
    "NTDS",
    "uniformes de diseño",
    "ropa corporativa",
    "uniformes profesionales",
    "indumentaria laboral",
    "uniformes administrativos",
    "uniformes gastronomía",
    "uniformes industriales",
    "uniformes salud",
    "textil empresarial"
  ],

  // Información del sitio
  applicationName: BRAND_NAME,
  authors: [{ name: BRAND_NAME, url: "https://naturalonline.com.ar" }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,

  // Configuración de idioma y región
  alternates: {
    canonical: "https://naturalonline.com.ar",
    languages: {
      "es-AR": "https://naturalonline.com.ar",
    },
  },

  // Open Graph para redes sociales
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://naturalonline.com.ar",
    title: `${BRAND_NAME} - Indumentaria para empresas de Diseño`,
    description: "Indumentaria para empresas, ropa de trabajo y merchandising de diseño en Córdoba. +25 años de experiencia vistiendo empresas con calidad y estilo.",
    siteName: BRAND_NAME,
    images: [
      {
        url: "/icon-512.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} - Indumentaria para empresas`,
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} - Indumentaria para empresas de Diseño`,
    description: "Indumentaria para empresas y ropa de trabajo de calidad en Córdoba. +25 años de experiencia, +500 clientes satisfechos.",
    images: ["/twitter-image.jpg"],
    creator: "@naturaldesign_ntds",
  },

  // Datos estructurados básicos
  other: {
    "business:contact_data:street_address": "Rivera Indarte 2143",
    "business:contact_data:locality": "Córdoba",
    "business:contact_data:region": "Córdoba",
    "business:contact_data:postal_code": "5000",
    "business:contact_data:country_name": "Argentina",
    "business:contact_data:phone_number": WHATSAPP_PHONE_NUMBER,
    "business:contact_data:email": "ventas@naturalonline.com.ar",
  },

  // Robots y indexación
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verificación y herramientas
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),

  // Categorización
  category: "Business",
  classification: "Indumentaria para empresas, Ropa de Trabajo, Textil",

  // Información adicional
  generator: "Next.js",
  referrer: "origin-when-cross-origin",

  // Configuración de formato
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Favicon e iconos - Natural Design Logo
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      { url: 'https://naturalonline.com.ar/logos/logo-1.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },

  // Manifest
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17610803161"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-17610803161');
      `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": BRAND_NAME,
              "alternateName": BRAND_SHORT,
              "url": "https://naturalonline.com.ar",
              "logo": "https://naturalonline.com.ar/icon-512.png",
              "image": "https://naturalonline.com.ar/og-image.jpg",
              "description": "Empresa especializada en uniformes empresariales de diseño, ropa de trabajo y merchandising de diseño con más de 25 años de experiencia en Córdoba, Argentina.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Rivera Indarte 2143",
                "addressLocality": "Córdoba",
                "addressRegion": "Córdoba",
                "postalCode": "5000",
                "addressCountry": "AR"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": WHATSAPP_PHONE_NUMBER_FORMATTED,
                "contactType": "customer service",
                "email": "ventas@naturalonline.com.ar",
                "availableLanguage": "Spanish"
              },
              "sameAs": [
                "https://www.instagram.com/naturaldesign.ntds/"
              ],
              "foundingDate": "1999",
              "numberOfEmployees": "10-50",
              "areaServed": {
                "@type": "Country",
                "name": "Argentina"
              },
              "serviceType": [
                "Indumentaria para empresas",
                "Ropa de trabajo",
                "Merchandising textil",
                "Uniformes escolares",
                "Indumentaria corporativa"
              ],
              "knowsAbout": [
                "Diseño de uniformes",
                "Textil empresarial",
                "Ropa corporativa",
                "Merchandising promocional"
              ]
            })
          }}
        />

        {/* Preconnect para optimización de fuentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon - Natural Design Logo */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-icon-180.png" sizes="180x180" />
        <meta name="apple-mobile-web-app-title" content="NTDS" />

        {/* Optimización de recursos */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//api.placeholder.com" />

        {/* Theme color */}
        <meta name="theme-color" content="#Ed3237" />
        <meta name="msapplication-TileColor" content="#Ed3237" />

        {/* Security headers */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body
        className={`${poppins.variable} ${montserrat.variable} antialiased`}
        style={{
          fontFamily: "var(--font-poppins), 'Franklin Gothic Heavy', 'Arial Black', sans-serif"
        }}
        suppressHydrationWarning
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <NewsletterPopup />
        </Providers>
      </body>
    </html>
  );
}
