import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tell Your Story Better — Kasanoff.ai',
  description: 'An AI ghostwriter that interviews you and then uses your words to produce top-quality, genuine copy for your LinkedIn and website and other uses',
  robots: 'noindex, nofollow',
};

export default function ExplorationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
