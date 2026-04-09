# Masters Pool 2026 - Setup Guide

## Step 1: Create a Supabase Project (Free)

1. Go to **https://supabase.com** and click "Start your project"
2. Sign up with GitHub (or email)
3. Click "New project"
4. Name it `masters-pool`, set a database password (save this!), pick a region near you
5. Wait for the project to be created

## Step 2: Set Up the Database

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `supabase/schema.sql` from this project, copy the entire contents, paste it in, and click **Run**
4. Click "New query" again
5. Open `supabase/seed-golfers.sql`, copy the entire contents, paste it in, and click **Run**
6. You should now see tables in **Table Editor**: profiles, pool_settings, golfers, picks, tiebreakers

## Step 3: Configure Supabase Auth

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. **IMPORTANT**: Go to **Authentication** > **URL Configuration**
4. Set **Site URL** to your local URL: `http://localhost:3000`
5. Add to **Redirect URLs**: `http://localhost:3000/api/auth/callback`

> When you deploy to Vercel later, you'll update these to your Vercel URL.

## Step 4: Get Your API Keys

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy the **Project URL** (looks like `https://abc123.supabase.co`)
3. Copy the **anon/public** key
4. Copy the **service_role** key (click "Reveal")

## Step 5: Configure the App

1. In the project folder, copy `.env.local.example` to `.env.local`:
   ```
   cp .env.local.example .env.local
   ```
2. Edit `.env.local` and paste in your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## Step 6: Run Locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

## Step 7: First-Time Setup

1. Go to `/login` and create an account (Sign Up)
2. Go to `/admin` and click **"Claim Commissioner Role"**
3. Share the login link with your friends
4. Set the entry deadline to before Round 1 tee time (April 10, 8:00 AM ET)

## Step 8: Deploy to Vercel (Make it live)

1. Push the code to a GitHub repository
2. Go to **https://vercel.com** and sign in with GitHub
3. Click "Import Project" and select your repo
4. Add the same environment variables from `.env.local` in the Vercel dashboard
5. Click Deploy

After deploying:
- Go back to Supabase **Authentication** > **URL Configuration**
- Update **Site URL** to your Vercel URL (e.g., `https://masters-pool.vercel.app`)
- Add your Vercel URL to **Redirect URLs**: `https://masters-pool.vercel.app/api/auth/callback`
- Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables

## How It Works

- **Everyone signs up** at the login page
- **Each person picks 1 golfer per tier** (6 tiers, 6 picks)
- **Worst 2 scores are dropped** from each person's total
- **Lowest combined score wins**
- If tied, the **tiebreaker** (predicted winner's total strokes) breaks it
- **Missed cut** golfers receive a +8 penalty per missed round
- **Scores update automatically** every 60 seconds from ESPN during the tournament
