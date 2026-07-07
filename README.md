# BGS Teachers Portal — Supabase Setup Guide

This project is a **Serverless React Single Page Application (SPA)** backed by **Supabase**. It runs entirely in the browser and requires zero backend server installation. It can be hosted for free on **Vercel**, **Netlify**, or **GitHub Pages**.

---

## 1. Supabase Setup (Database & Auth)

Supabase handles the database, Google OAuth, and security rules. Follow these steps to set it up:

### A. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up for a free account.
2. Click **New Project** and select a name (e.g., `BGS Teachers Portal`).
3. Set a database password and choose the region closest to you.
4. Wait a couple of minutes for your database to provision.

### B. Run the Database SQL Script
1. Once your project is ready, click on **SQL Editor** in the left sidebar menu (the `SQL` icon).
2. Click **New Query**.
3. Open the file [supabase_setup.sql](file:///c:/Users/ADMIN/Desktop/Teachers%20Portal/supabase_setup.sql) in this directory, copy all of its contents, and paste them into the Supabase SQL Editor.
4. Click **Run** at the bottom right. This will instantly build all the tables, configure automatic profile creation, and set up Row Level Security (RLS) rules.

*Note: In `supabase_setup.sql`, line 59 has a placeholder for your admin email: `CASE WHEN new.email = 'admin@example.com' THEN 'admin' ELSE 'teacher' END`. You can change `'admin@example.com'` to your Google email to be promoted automatically on login.*

### C. Enable Google Login in Supabase
1. In your Supabase Dashboard, go to **Authentication** > **Providers** > **Google**.
2. Toggle Google login to **Enabled**.
3. You will see a **Redirect URI** displayed near the bottom (it looks like `https://xxxx.supabase.co/auth/v1/callback`). Copy this URL.
4. Go to your [Google Cloud Console](https://console.cloud.google.com/), edit your OAuth Client ID credentials, and paste this URL into the **Authorized redirect URIs** section.
5. In the Supabase Google Provider page, paste your Google **Client ID** and **Client Secret** into their fields, then click **Save**.

---

## 2. Project Configuration

1. In the `client` directory, copy/rename the file `.env.example` to `.env`.
2. Go to your Supabase Project **Project Settings** > **API** (in the sidebar).
3. Copy the **Project URL** and paste it as `VITE_SUPABASE_URL` in `.env`.
4. Copy the **anon public** API key and paste it as `VITE_SUPABASE_ANON_KEY` in `.env`.

---

## 3. Running the App Locally

Open a terminal (PowerShell or Command Prompt) and run:

```bash
cd "C:\Users\ADMIN\Desktop\Teachers Portal\client"
npm install
npm run dev
```

The app will start on [http://localhost:5173](http://localhost:5173). 

Because we configured Vite with `--host`, you and your teachers can access it immediately on any device connected to the same Wi-Fi by typing:
`http://192.168.0.111:5173` into the browser!

---

## 4. Deploying to the Internet (Free Hosting)

To deploy the app permanently online so teachers can use it from home or on mobile data:

1. Install the Vercel CLI tool:
   ```bash
   npm install -g vercel
   ```
2. Navigate to your client directory:
   ```bash
   cd "C:\Users\ADMIN\Desktop\Teachers Portal\client"
   ```
3. Run the deployment command:
   ```bash
   vercel
   ```
4. Follow the prompts (link it, choose defaults).
5. In your Vercel Dashboard, go to **Project Settings** > **Environment Variables** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` there.
6. Once deployed, you will get a permanent `https://...vercel.app` URL. Update your Google Cloud Console JavaScript origins to match this new Vercel URL!
