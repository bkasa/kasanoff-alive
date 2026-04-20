import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { Resend } from 'resend';
import { hasPurchased, createMagicLink } from '@/lib/queries';

const resend = new Resend(process.env.RESEND_API_KEY);

const LINK_EXPIRY_MINUTES = 30;

const EXPLORATION_TITLES: Record<string, string> = {
  'ikigai': 'Ikigai Discovery',
  'tell-your-story': 'Tell Your Story Better',
  'better-decision': 'Better Decision',
  'career-checkup': 'Career Checkup',
};

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, explorationId } = await request.json();
    const email = rawEmail?.toLowerCase();

    if (!email || !explorationId) {
      return Response.json({ error: 'Missing email or explorationId' }, { status: 400 });
    }

    // Check purchase — return generic ok to avoid leaking purchase info
    const purchased = await hasPurchased(email, explorationId);
    if (!purchased) {
      return Response.json({ ok: true });
    }

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + LINK_EXPIRY_MINUTES * 60 * 1000).toISOString();

    await createMagicLink(email, token, explorationId, expiresAt);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/${explorationId}?token=${token}`;
    const title = EXPLORATION_TITLES[explorationId] || explorationId;

    await resend.emails.send({
      from: 'Bruce Kasanoff <bruce@kasanoff.ai>',
      to: email,
      subject: `Your ${title} link`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #3D3229;">
          <p style="font-size: 16px; line-height: 1.7;">Here is your one-click access link for <strong>${title}</strong>:</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background: #D4A574; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-family: sans-serif; font-size: 14px; font-weight: 500;">
              Open ${title} →
            </a>
          </p>
          <p style="font-size: 13px; color: #6B5D50; line-height: 1.6;">This link is valid for ${LINK_EXPIRY_MINUTES} minutes and can only be used once. If you didn't request this, you can safely ignore it.</p>
          <p style="font-size: 13px; color: #6B5D50;">Or copy this URL into your browser:<br />${link}</p>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Magic link error:', error);
    return Response.json({ error: 'Failed to send link' }, { status: 500 });
  }
}
