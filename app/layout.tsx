import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Naturalista',
  description: 'Registro personal de plantas',
  // Meta tags especiales para PWA en iPhone
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Naturalista',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Evita zoom accidental en inputs de iOS
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Apple touch icon para "Agregar a pantalla de inicio" */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png?v=2"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
