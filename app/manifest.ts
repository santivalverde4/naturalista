import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Naturalista',
    short_name: 'Naturalista',
    description: 'Registro personal de plantas',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0fdf4',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
