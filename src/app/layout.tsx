import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anestesia Dr. Sanches | Adote Vi.Ca',
  description: 'Sistema Hands-Free de Registro Anestésico Veterinário por Voz para o Dr. Daniel Sanches no Centro Cirúrgico Adote Vi.Ca.',
  icons: {
    icon: '/logo-vica.png',
    apple: '/logo-vica.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1ea58d',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-vica-teal/20">
        {children}
      </body>
    </html>
  );
}
