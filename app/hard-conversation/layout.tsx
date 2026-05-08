import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Hard Conversation | Kasanoff.ai',
  description:
    'For the conversation you\'ve been avoiding. Walk through it here first, with someone who will ask the questions no one else in your life will ask you.',
  robots: 'noindex, nofollow',
};

export default function HardConversationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
