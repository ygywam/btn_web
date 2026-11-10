import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '북튜닝 | 의미 있는 독서로 삶을 튜닝하자',
  description: '노션보다 빠르고 편리한 소셜 독서 플랫폼. 개인 서재와 날짜별 공개 피드 커뮤니티.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', sizes: 'any' },
    ],
    apple: [
      { url: '/icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '북튜닝',
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF8F0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-screen bg-[#FAF8F0] text-[#1E232A] antialiased selection:bg-amber-200">
        {children}
      </body>
    </html>
  );
}
