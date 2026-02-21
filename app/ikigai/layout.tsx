import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ikigai Discovery — Explorations',
  description: 'A deep, guided exploration of your purpose — what you love, what the world needs, what you\'re good at, and what you can be paid for.',
  robots: 'noindex, nofollow',
};

export default function IkigaiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
