// Este archivo NO hace falta tocarlo.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // El plan Hobby incluye 5.000 transformaciones de imagen al mes, y Vercel
    // cobra una por cada ancho distinto que pida un movil de cada foto. Por
    // defecto Next puede generar hasta 15 anchos por foto.
    //
    // Al quitar el limite de 5 fotos por envio caben muchas mas fotos en el
    // muro, asi que apuramos un ancho mas: quitando el 828 cada foto gasta
    // como mucho tres transformaciones en vez de cuatro. No se pierde calidad,
    // los moviles que antes pedian 828 ahora piden 1200. La mayoria (miniatura
    // a media pantalla) se queda en 640 igual que antes.
    deviceSizes: [640, 1200],
    imageSizes: [256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
