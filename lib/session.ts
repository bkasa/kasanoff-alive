import { SessionOptions } from 'iron-session';

export const SESSION_VERSION = 1;

export interface SessionData {
  customerEmail?: string;
  isAdmin?: boolean;
  version?: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'fallback-dev-secret-must-be-at-least-32-chars-long',
  cookieName: 'explorations-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 365, // 1 year — permanent access per spec
  },
};
