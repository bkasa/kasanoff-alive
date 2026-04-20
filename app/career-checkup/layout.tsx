import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Checkup — Kasanoff.ai Guide',
  description: 'A deep coaching conversation for successful professionals who want to stay clear, focused, and aligned.',
  robots: 'noindex, nofollow',
};

export default function ExplorationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
