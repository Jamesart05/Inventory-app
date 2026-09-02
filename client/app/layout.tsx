import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import SWRegister from '@/components/SWRegister';

export const metadata: Metadata = {
  title: 'Inventory Manager',
  description: 'Track inventory items, scan barcodes, and record stock movements.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Inventory',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#c30f45',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem('inv-theme') || 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Runs before paint so the saved theme applies with no flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>
          {children}
          <SWRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
