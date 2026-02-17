# What's Alive In You Right Now?

A zero-friction guided conversation experience for kasanoff.ai.

No login, no email, no barriers — just click and begin exploring.

## Setup & Deployment

### 1. Create the project on Vercel

```bash
# Navigate to your projects directory
cd ~/projects  # or wherever you keep projects

# Create the project folder and copy all files into it
# (Copy all files from the delivery into this folder)

# Initialize git
cd kasanoff-alive
git init
git add .
git commit -m "Initial commit"
```

### 2. Push to GitHub

```bash
# Create a new repo on GitHub called "kasanoff-alive"
# Then:
git remote add origin https://github.com/YOUR_USERNAME/kasanoff-alive.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import the `kasanoff-alive` repository
3. Framework Preset should auto-detect **Next.js**
4. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your Anthropic API key
5. Click **Deploy**

### 4. Connect your domain

1. In Vercel, go to your project → **Settings → Domains**
2. Add `kasanoff.ai` (or a subdomain like `alive.kasanoff.ai`)
3. Follow Vercel's DNS instructions to point the domain

### Alternative: Subdirectory on kasanoff.ai

If kasanoff.ai is hosted elsewhere (like Squarespace), you can:
- Deploy this to Vercel on its own domain (e.g., `alive.kasanoff.ai`)
- Link to it from your main kasanoff.ai site

## Files

```
kasanoff-alive/
├── package.json          # Dependencies
├── next.config.mjs       # Next.js config
├── tsconfig.json         # TypeScript config
├── .env.example          # Environment variables template
├── app/
│   ├── layout.tsx        # Root layout & metadata
│   ├── globals.css       # All styling (watercolor theme)
│   ├── page.tsx          # Conversation interface
│   └── api/
│       └── chat/
│           └── route.ts  # Anthropic API proxy (streaming)
└── README.md
```

## Customization

- **System prompt**: Edit `app/api/chat/route.ts` — the `SYSTEM_PROMPT` constant
- **Colors**: Edit CSS variables at the top of `app/globals.css`
- **Initial greeting**: Edit `INITIAL_GREETING` in `app/page.tsx`
- **Fonts**: Change the Google Fonts import in `app/globals.css`

## Local Development

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Visit http://localhost:3000
