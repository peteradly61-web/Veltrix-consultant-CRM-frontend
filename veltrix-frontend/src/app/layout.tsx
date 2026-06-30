import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Veltrix | BDR Lead Management Platform',
  description: 'High-performance outbound lead routing & real-time monitoring.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 selection:bg-violet-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
