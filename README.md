# Supabase + GitHub + Vercel Demo App

This is a small demo web app for testing the workflow:

1. Build code locally.
2. Push code to GitHub.
3. Connect Supabase database.
4. Deploy on Vercel.

The app is a student request tracker. It saves form submissions into a Supabase table named `demo_requests` and reads the latest rows back into the UI.

## Tech Stack

- React
- Vite
- Supabase JavaScript client
- Vercel deployment-ready

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase values inside `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run the SQL inside `supabase/schema.sql`.
4. Copy Project URL and Publishable/Anon key.
5. Add them to `.env.local` locally and to Vercel Environment Variables during deployment.

## Push to GitHub

Create an empty GitHub repository first, then run:

```bash
git init
git add .
git commit -m "Create Supabase Vercel demo app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Deploy on Vercel

1. Open Vercel Dashboard.
2. Click New Project.
3. Import your GitHub repository.
4. Framework Preset: Vite.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
8. Click Deploy.

Every push to GitHub after this will trigger a fresh Vercel deployment.
