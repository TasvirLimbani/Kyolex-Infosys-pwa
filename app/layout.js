import './globals.css';
import RegisterSW from '@/components/RegisterSW';

export const metadata = {
  title: 'Kyolex Infosys',
  description: 'Kyolex Infosys: tasks, employees and party reports',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Kyolex Infosys', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport = {
  themeColor: '#22242b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
