#!/bin/bash
# new-exploration.sh
# Usage: ./scripts/new-exploration.sh <slug> "<Title>" "<One-sentence description>"
# Example: ./scripts/new-exploration.sh shadow-work "Shadow Work" "A guided journey to name and integrate the parts of yourself you've kept hidden."
#
# This script handles all the mechanical steps after Claude Code has written the files.
# Run it from the repo root.

set -e

SLUG=$1
TITLE=$2
DESCRIPTION=$3

if [ -z "$SLUG" ] || [ -z "$TITLE" ] || [ -z "$DESCRIPTION" ]; then
  echo "Usage: ./scripts/new-exploration.sh <slug> \"<Title>\" \"<Description>\""
  exit 1
fi

echo ""
echo "🌿 Creating Exploration: $TITLE ($SLUG)"
echo "────────────────────────────────────────"

# ── 1. Verify files exist ─────────────────────────────────────────────────────
echo "→ Checking files..."

if [ ! -f "app/$SLUG/page.tsx" ]; then
  echo "✗ app/$SLUG/page.tsx not found. Claude Code should have created this first."
  exit 1
fi

if [ ! -f "app/api/$SLUG/chat/route.ts" ]; then
  echo "✗ app/api/$SLUG/chat/route.ts not found."
  exit 1
fi

if [ ! -f "lib/prompts/$SLUG.ts" ]; then
  echo "✗ lib/prompts/$SLUG.ts not found."
  exit 1
fi

echo "✓ All files present"

# ── 2. Create Stripe product + price ─────────────────────────────────────────
echo "→ Creating Stripe product..."

PRODUCT_JSON=$(stripe products create \
  --name="$TITLE Exploration" \
  --description="$DESCRIPTION" \
  -d "metadata[exploration_id]=$SLUG" \
  --output=json 2>/dev/null)

PRODUCT_ID=$(echo "$PRODUCT_JSON" | grep -o '"id": "prod_[^"]*"' | head -1 | sed 's/"id": "//;s/"//')

if [ -z "$PRODUCT_ID" ]; then
  echo "✗ Failed to create Stripe product. Check: stripe products list"
  exit 1
fi

echo "✓ Product created: $PRODUCT_ID"

echo "→ Creating Stripe price (\$18)..."

PRICE_JSON=$(stripe prices create \
  --product="$PRODUCT_ID" \
  --unit-amount=1800 \
  --currency=usd \
  --output=json 2>/dev/null)

PRICE_ID=$(echo "$PRICE_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | sed 's/"id": "//;s/"//')

if [ -z "$PRICE_ID" ]; then
  echo "✗ Failed to create Stripe price."
  exit 1
fi

echo "✓ Price created: $PRICE_ID"

# ── 3. Write price ID to a config note ───────────────────────────────────────
# This creates a simple record — Claude Code can wire it into the actual
# exploration config or payment link as needed.
echo ""                                    >> .stripe-price-ids.txt
echo "$SLUG: $PRICE_ID"                   >> .stripe-price-ids.txt
echo "✓ Price ID saved to .stripe-price-ids.txt"

# ── 4. Git commit + push ──────────────────────────────────────────────────────
echo "→ Committing to GitHub..."

git add -A
git commit -m "Add $TITLE Exploration ($SLUG)"
git push origin main

echo "✓ Pushed to main"

# ── 5. Watch Vercel deploy ────────────────────────────────────────────────────
echo "→ Vercel is deploying..."
sleep 3
vercel ls --scope=brucekasanoff 2>/dev/null | head -5 || true

echo ""
echo "────────────────────────────────────────"
echo "✅ Done. New exploration ready at:"
echo "   https://explore.kasanoff.ai/$SLUG"
echo ""
echo "Stripe Price ID (for payment links):"
echo "   $PRICE_ID"
echo ""
echo "Next step: Create a Stripe Payment Link at"
echo "   https://dashboard.stripe.com/payment-links"
echo "   using price ID: $PRICE_ID"
echo "   Success URL: https://explore.kasanoff.ai/$SLUG?payment=success"
echo "────────────────────────────────────────"
