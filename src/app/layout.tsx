import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BODA } from "@/config/boda";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Este archivo NO hace falta tocarlo: título y descripción salen de src/config/boda.ts
//
// >>> CAMBIAR AQUI (opcional) <<<
// La imagen que sale al compartir el enlace por WhatsApp es el ARCHIVO
//   src/app/opengraph-image.jpg   (1200 x 630 píxeles)
// Sustitúyelo por otro con el mismo nombre. Si no, se queda el que hay.

const TITULO = `${BODA.nombres} · ${BODA.fechaTexto}`;
const NOMBRE_APP = `Boda ${BODA.nombres}`;

export const metadata: Metadata = {
  metadataBase: new URL(BODA.url),
  title: TITULO,
  description: BODA.descripcion,
  applicationName: NOMBRE_APP,
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: BODA.url,
    siteName: NOMBRE_APP,
    title: TITULO,
    description: BODA.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: BODA.descripcion,
  },
  // El muro cambia durante la boda: que no se indexe ni se cachee en buscadores.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#7C9885",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
