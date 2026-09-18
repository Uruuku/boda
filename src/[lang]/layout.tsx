import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BODA } from "@/config/boda";
import "@/app/globals.css";
import { getDictionary } from "@/dictionaries/getDictionary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Props = {
  params: Promise<{ lang: 'es' | 'en' | 'sq' }>;
};

// Generamos los metadatos dinámicamente según el idioma
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang);
  const TITULO = `${BODA.nombres} · ${dict.config.fechaTexto}`;
  const NOMBRE_APP = `Boda ${BODA.nombres}`;

  return {
    metadataBase: new URL(BODA.url),
    title: TITULO,
    description: dict.config.descripcion,
    applicationName: NOMBRE_APP,
    openGraph: {
      type: "website",
      locale: resolvedParams.lang === 'en' ? 'en_US' : resolvedParams.lang === 'sq' ? 'sq_AL' : 'es_ES',
      url: BODA.url,
      siteName: NOMBRE_APP,
      title: TITULO,
      description: dict.config.descripcion,
    },
    twitter: {
      card: "summary_large_image",
      title: TITULO,
      description: dict.config.descripcion,
    },
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#7C9885",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: 'es' | 'en' | 'sq' }>;
}>) {
  const resolvedParams = await params;
  return (
    <html
      lang={resolvedParams.lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}