import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Explore | Bruce Kasanoff',
  description: 'Guided conversations for self-discovery.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
