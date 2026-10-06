import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat, Cormorant_Garamond } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ViewportInitializer } from "@/hooks/use-viewport-geometry";
import { DebugLoggerHud } from "@/components/debug/debug-logger-hud";
import { getDeviceDetectionInlineScript } from "@/lib/device-detection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif-accent",
  subsets: ["latin", "cyrillic"],
  style: ["italic"],
  weight: ["500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://namipmu.com"),
  title: {
    default: "NAMI PMU | Перманентний макіяж брів, губ та очей",
    template: "%s | NAMI PMU",
  },
  description:
    "Преміальна студія перманентного макіяжу NAMI PMU. Авторські пудрові брови, акварельні губи, міжвійка та професійне навчання. Природний результат на 1,5–2 роки.",
  appleWebApp: {
    capable: true,
    title: "NAMI PMU",
  },
  keywords: [
    "перманентний макіяж",
    "пудрові брови",
    "перманент брів",
    "акварельні губи",
    "перманент губ",
    "татуаж брів",
    "міжвійка",
    "видалення татуажу",
    "навчання перманентному макіяжу",
    "курси перманент",
    "PMU studio",
    "permanent makeup",
  ],
  alternates: {
    canonical: "https://namipmu.com",
    languages: {
      uk: "https://namipmu.com",
      ru: "https://namipmu.com",
      en: "https://namipmu.com",
      de: "https://namipmu.com",
    },
  },
  openGraph: {
    title: "NAMI PMU | Перманентний макіяж брів, губ та очей",
    description:
      "Преміальна студія перманентного макіяжу NAMI PMU. Авторські пудрові брови, акварельні губи, міжвійка та курси навчання.",
    url: "https://namipmu.com",
    siteName: "NAMI PMU",
    locale: "uk_UA",
    type: "website",
    images: [
      {
        url: "/images/image (3).png",
        width: 1200,
        height: 630,
        alt: "NAMI PMU Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NAMI PMU | Перманентний макіяж брів, губ та очей",
    description:
      "Преміальна студія перманентного макіяжу NAMI PMU. Авторські пудрові брови, акварельні губи, міжвійка.",
    images: ["/images/image (3).png"],
  },
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BeautySalon",
      "@id": "https://namipmu.com/#salon",
      name: "NAMI PMU Studio",
      url: "https://namipmu.com",
      logo: "https://namipmu.com/images/logo.png",
      image: "https://namipmu.com/images/image (3).png",
      description:
        "Преміальна студія перманентного макіяжу: пудрові брови, акварельні губи, міжвійка та професійні курси навчання PMU.",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "вул. Прикладна, 1",
        addressLocality: "Київ",
        addressCountry: "UA",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "19:00",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Послуги перманентного макіяжу",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Перманентний макіяж брів (Пудрові брови)",
              description: "М'яке пудрове напилення та волоскова техніка",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Акварельний перманентний макіяж губ",
              description: "Нюдовий градієнт, акварельна техніка та помадний ефект",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Міжвійковий контур та стрілки з розтушовкою",
              description: "Виразний погляд та заповнення міжвійкового простору",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Курси та майстер-класи перманентного макіяжу",
              description: "Індивідуальні та онлайн програми навчання PMU з постановкою руки",
            },
          },
        ],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: getDeviceDetectionInlineScript(),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${cormorant.variable} font-sans antialiased bg-[#F8F9FB] text-[#1A1F25] isolate relative`}
        suppressHydrationWarning
      >
        <DebugLoggerHud />
        <LanguageProvider>
          <SmoothScrollProvider>
            <ViewportInitializer />
            <div className="relative isolate min-h-screen w-full">{children}</div>
          </SmoothScrollProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
