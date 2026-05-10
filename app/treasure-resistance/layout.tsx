import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Treasure Resistance | Kasanoff.ai',
  description:
    'Resistance is a treasure map. Find the markers. Read what they\'re pointing toward. Start small.',
  robots: 'noindex, nofollow',
};

export default function TreasureResistanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
