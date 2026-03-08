# Claude Code Master Brief — explore.kasanoff.ai

## What This Project Is

A Next.js platform (App Router, TypeScript) hosting AI-guided self-discovery tools called "Explorations." Each costs $18, is gated behind Stripe payment + email auth, and runs a Claude-powered conversation. Live at explore.kasanoff.ai, deployed via Vercel, repo on GitHub.

---

## How to Build a New Exploration

When asked to build a new exploration, follow these steps in order. Do not skip any.

### Step 1 — Gather inputs
You need three things:
- `SLUG` — lowercase, hyphenated (e.g. `shadow-work`, `life-chapter`)
- `TITLE` — display name (e.g. "Shadow Work", "Life Chapter")
- `DESCRIPTION` — one sentence describing what it does (used in metadata and prompt)

### Step 2 — Copy the template
```bash
cp -r app/_template app/SLUG
cp -r app/api/_template app/api/SLUG
cp lib/prompts/_template.ts lib/prompts/SLUG.ts
```

### Step 3 — Replace all placeholders
In every copied file, replace:
- `TEMPLATE_SLUG` → the actual slug
- `TEMPLATE_TITLE` → the actual title
- `TEMPLATE_DESCRIPTION` → the one-sentence description

These appear in:
- `app/SLUG/page.tsx` (3 places)
- `app/SLUG/layout.tsx` (2 places)
- `app/api/SLUG/chat/route.ts` (2 places + the import path)
- `lib/prompts/SLUG.ts` (1 place — the const name, and the prompt content)

### Step 4 — Write the system prompt
Open `lib/prompts/SLUG.ts` and write a real, thoughtful system prompt for this exploration. The prompt should:
- Open by welcoming the person warmly and asking the first question
- Guide a deep, reflective conversation (10-20 exchanges)
- Stay in the voice of a wise, warm, unhurried guide
- Be specific to this exploration's theme — not generic
- End naturally when the exploration feels complete, offering a closing reflection

Study `lib/prompts/ikigai.ts` as a reference for tone and structure.

### Step 5 — Create the Stripe product
```bash
# Create product
PRODUCT_ID=$(stripe products create \
  --name="TITLE Exploration" \
  --description="DESCRIPTION" \
  --metadata[exploration_id]="SLUG" \
  | grep '"id"' | head -1 | sed 's/.*"id": "\(.*\)",/\1/')

# Create price
PRICE_ID=$(stripe prices create \
  --product="$PRODUCT_ID" \
  --unit-amount=1800 \
  --currency=usd \
  | grep '"id"' | head -1 | sed 's/.*"id": "\(.*\)",/\1/')

echo "Price ID: $PRICE_ID"
```

Then add the price ID to `lib/exploration-config.ts` (or wherever price IDs are stored — check how ikigai's price ID is configured and follow the same pattern).

### Step 6 — Register the route (if needed)
Check `app/page.tsx` (the homepage) — if explorations are listed there, add the new one following the existing pattern.

### Step 7 — Commit and deploy
```bash
git add -A
git commit -m "Add TITLE Exploration"
git push origin main
```

Vercel auto-deploys on push. Confirm the deploy succeeded with:
```bash
vercel ls
```

### Step 8 — Report back
Tell Bruce:
- The live URL (e.g. `https://explore.kasanoff.ai/SLUG`)
- The Stripe price ID (he'll need it if setting up a payment link manually)
- Any env vars he needs to add in Vercel dashboard (if any new ones were required)

---

## Stack Reference

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Inline styles (no Tailwind, no CSS modules) |
| Auth | Iron Session + magic link / email claim |
| Payments | Stripe Checkout |
| AI | Anthropic API (claude-sonnet-4-6, called directly) |
| DB | Queries via `@/lib/queries` (Postgres or similar) |
| Deploy | Vercel (auto-deploys on push to main) |

## Design System

All explorations use these exact colors and fonts. Do not deviate.

```typescript
const C = {
  cream: '#FDF8F0',
  warmWhite: '#FFFDF9',
  charcoal: '#3D3229',
  charcoalLight: '#6B5D50',
  gold: '#D4A574',
  terracotta: '#C4836A',
  rose: '#D4A0A0',
  blue: '#8BA4B8',
};
// Fonts: 'Cormorant Garamond' (body/serif), 'Source Sans 3' (UI/labels)
```

## Key Library Files (do not modify without reason)

- `lib/exploration-access.ts` — checks if a user has paid access to a given exploration
- `lib/queries.ts` — all DB operations (saveMessage, getSessionMessages, upsertCustomer, recordPurchase, etc.)
- `lib/session.ts` — iron-session config
- `app/api/auth/` — magic link + claim + session endpoints (shared across all explorations)
- `app/api/stripe/` — Stripe webhook + verify endpoints (shared)

## Conversation Architecture

Each exploration has its own chat API route at `app/api/SLUG/chat/route.ts`. This route:
1. Checks access via `checkAccess(EXPLORATION_ID)`
2. Saves the user message
3. Loads full history, trims to context window (6 anchor + 40 recent)
4. Calls Anthropic API with the exploration-specific system prompt
5. Saves and returns the assistant response

The UI (`app/SLUG/page.tsx`) is a single-file React component handling four phases: `loading → claim → magic-link-sent → chat`.

---

## Important Rules

- Never modify shared lib files unless explicitly asked
- Never change the color palette or fonts
- Always use `EXPLORATION_ID` as a constant at the top of each file
- The `BackgroundWash` component lives in each page.tsx — copy it from template, don't import it
- All explorations are `noindex, nofollow` in metadata
- Price is always $18 (1800 cents)
- Model is always `claude-sonnet-4-6`
- Max tokens per response: 1024
