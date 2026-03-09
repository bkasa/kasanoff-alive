# Claude Code Master Brief — explore.kasanoff.ai

## What This Project Is

A Next.js platform (App Router, TypeScript) hosting AI-guided self-discovery tools called "Explorations." Each costs $18, is gated behind Stripe payment + email auth, and runs a Claude-powered conversation. Live at explore.kasanoff.ai, deployed via Vercel, repo on GitHub.

---

## Exploration Spec Format

Bruce will provide specs in this format. Read every field carefully before writing any code.

```
SLUG: kebab-case-name
TITLE: Display Name
DESCRIPTION: One sentence shown on the site and used in metadata
OPENING QUESTION: The exact first question the guide asks
TONE: How the guide should sound
ARC: The journey the conversation takes, step by step
APPROACH: Specific guidance on how to handle this topic
TYPE: conversation | document-generator
```

If TYPE is not specified, default to `conversation`.

---

## Exploration Types

### Type 1: `conversation`
A reflective dialogue that ends with insight. No documents produced.
Examples: Ikigai Discovery, Shadow Work, Life Chapter.
→ Use the standard `_template` as-is.

### Type 2: `document-generator`
An interview that produces real written deliverables (bios, LinkedIn copy, etc.).
Examples: Tell Your Story Better.
→ Requires a custom page.tsx with a two-panel layout and document output area.
→ Requires higher `max_tokens` (2048 or more per response).
→ Must include a "Copy" button for each document produced.
→ Must save all generated documents to the DB so the user can return and access them.
→ The system prompt must explicitly instruct Claude to:
   1. Interview first, write later
   2. Signal clearly when it is producing a document (e.g. wrap in `[DOCUMENT: Title]...[/DOCUMENT]`)
   3. Seek feedback and offer revisions
   4. Confirm when all requested documents are complete

For document-generator explorations, the page.tsx should parse `[DOCUMENT: Title]...[/DOCUMENT]` tags out of assistant responses and render them in a separate "Documents" panel on the right side of the screen, with a copy button under each one.

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
Open `lib/prompts/SLUG.ts` and write a real, thoughtful system prompt using the TONE, ARC, OPENING QUESTION, and APPROACH from the spec.

**For `conversation` type:**
- Open by welcoming the person warmly and asking the opening question from the spec
- Guide a deep, reflective conversation (10-20 exchanges)
- Stay in the voice specified in TONE — never generic
- Follow the ARC precisely
- End naturally when the exploration feels complete, offering a closing reflection
- Study `lib/prompts/ikigai.ts` as a reference for structure

**For `document-generator` type:**
- Interview thoroughly before producing any document
- Follow the ARC to move from discovery → document selection → writing → feedback → revision
- Wrap every produced document in `[DOCUMENT: Title]...[/DOCUMENT]` tags so the UI can parse them
- After producing documents, always ask: "Does this feel like you? What would you change?"
- Confirm explicitly when all requested documents are complete
- Use max_tokens: 2048 in the API call for this type

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
Tell Bruce everything he needs to finish the launch. Provide this as a checklist:

**Done automatically:**
- ✅ Code written and deployed to `https://explore.kasanoff.ai/SLUG`
- ✅ Stripe product + price created

**Bruce does manually (takes ~5 minutes):**

1. **Stripe Payment Link** — go to dashboard.stripe.com/payment-links → Create link
   - Price: [PRICE_ID]
   - Success URL: `https://explore.kasanoff.ai/SLUG?payment=success`
   - ⚠️ CRITICAL: After creating the link, click into it → Edit → Metadata → Add: `exploration_id` = `SLUG`
   - Without this metadata, purchases will not be recorded and customers will be locked out

2. **Squarespace page** — add a new page on kasanoff.ai for this exploration
   - Headline: [TITLE]
   - Subhead: [DESCRIPTION]
   - Body: [Write 2-3 sentences expanding on what the user will experience and walk away with]
   - Price: $18
   - Button text: Begin Exploration →
   - Button URL: [the Stripe Payment Link from step 1]

3. **Any new Vercel env vars** (list here if any were added, otherwise say "none")

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
- Max tokens per response: 1024 (2048 for document-generator type)

## Known Issues & Lessons Learned

- **Stripe Payment Link metadata is critical**: The webhook identifies which exploration was purchased via `exploration_id` in the payment link metadata. If this is missing, purchases are not recorded and customers are locked out. Always add `exploration_id` = `SLUG` to every payment link after creating it.
- **The Stripe CLI cannot update payment links**: The restricted API key does not have permission for this endpoint. Payment link metadata must be set manually in the Stripe dashboard.
- **The template file import**: `app/api/_template/chat/route.ts` imports from `@/lib/prompts/_template` — do not change this to `TEMPLATE_SLUG` or the build will fail.
- **node_modules must never be committed**: The `.gitignore` includes `node_modules/`. Never run `git add` without verifying this is excluded.
