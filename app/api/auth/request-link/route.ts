import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import sgMail from '@sendgrid/mail';
import { hasPurchased, createMagicLink } from '@/lib/queries';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const LINK_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const { email, explorationId } = await request.json();

    if (!email || !explorationId) {
      return Response.json({ error: 'Missing email or explorationId' }, { status: 400 });
    }

    // Check they have actually purchased this Exploration
    const purchased = await hasPurchased(email, explorationId);
    if (!purchased) {
      // Return generic message to avoid leaking purchase info
      return Response.json({ ok: true });
    }

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    await createMagicLink(email, token, explorationId, expiresAt);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/${explorationId}?token=${token}`;

    await sgMail.send({
      to: email,
      from: 'hello@kasanoff.ai',
      subject: 'Your access link',
      text: `Here is your access link (valid for ${LINK_EXPIRY_HOURS} hour):\n\n${link}\n\nThis link can only be used once.`,
      html: `
        <p>Here is your access link, valid for ${LINK_EXPIRY_HOURS} hour:</p>
        <p><a href="${link}">${link}</a></p>
        <p>This link can only be used once.</p>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Magic link error:', error);
    return Response.json({ error: 'Failed to send link' }, { status: 500 });
  }
}
