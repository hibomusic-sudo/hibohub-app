import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hibo Hub | Premium AI Music & Video',
  description: 'The ultimate AI-powered Somali music and video creation studio. Create, share, and monetize your AI generated songs.',
  openGraph: {
    title: 'Hibo Hub | Premium AI Music & Video',
    description: 'The ultimate AI-powered Somali music and video creation studio. Create, share, and monetize your AI generated songs.',
    url: 'https://hibohub.com',
    siteName: 'Hibo Hub',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Hibo Hub Preview Image',
      },
    ],
    locale: 'so_SO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hibo Hub | Premium AI Music & Video',
    description: 'The ultimate AI-powered Somali music and video creation studio.',
    images: ['https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=1200&h=630&fit=crop'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
