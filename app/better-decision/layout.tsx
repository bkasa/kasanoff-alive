import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Better Decision — Explorations',
  description: 'A guided conversation with an AI advisor that helps you move from confusion to clarity — and from clarity to commitment.',
  robots: 'noindex, nofollow',
};

export default function ExplorationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
