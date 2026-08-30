# accounting-system

Multi-tenant invoices, quotations, and delivery orders. Next.js + Supabase. Live domain: [accounting.anyismart.com](https://accounting.anyismart.com).

Heat Up Collection is a separate product (`heatupcollection` / `system.heatupcollection.com`).

## Local

```bash
cp env.example .env.local
npm install
npm run dev
```

## Vercel

Import this GitHub repo. Root directory is the repo root (this Next.js app).

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

Point `accounting.anyismart.com` at the Vercel project after the first deploy.
