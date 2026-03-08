import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TEMPLATE_TITLE — Explorations',
  description: 'TEMPLATE_DESCRIPTION',
  robots: 'noindex, nofollow',
};

export default function ExplorationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
