import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "What's Alive In You Right Now?",
  description: 'A guided conversation to explore what you\'re feeling in this moment.',
};

export default function AliveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
