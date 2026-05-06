# Capstone Leadership Dashboard v2

A multi-page PWA dashboard for tracking MRR, client health, and business KPIs.

## Prerequisites

- **Node.js** (https://nodejs.org)
- **Supabase account** (free at https://supabase.com)

## Quick Setup

### 1. Set up the database

1. In Supabase, go to **SQL Editor** > **New query**
2. Paste the contents of `supabase-schema.sql` and click **Run**

### 2. Get your API credentials

1. Go to **Settings** > **API Keys**
2. Copy the **Publishable key** (this is the anon key)
3. For the project URL, click **Connect** at the top or check the API settings

### 3. Configure the app

```bash
copy .env.example .env
```

Edit `.env` and paste your Supabase URL and publishable key.

### 4. Install and run

```bash
npm install
npm run dev
```

### 5. Create your first account

Open the app, click **Sign Up**, enter email + password, confirm via email, then sign in.

## Deploying to GitHub Pages

### Update deploy.yml

Add env vars to the build step:

```yaml
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Add GitHub Secrets

Go to repo **Settings** > **Secrets and variables** > **Actions** and add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then push and it deploys automatically.

## Pages

- **Executive** - MRR overview, trend chart, recent activity
- **Sales** - Add/manage clients, track MRR changes
- **Client Health** - All clients with status, tenure, churn rate
- **MRR Calculator** - Standalone revenue projection tool
- **Operations** - Coming soon (BrightGauge)
- **Accounting** - Coming soon (QuickBooks)
