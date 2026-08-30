# Accounting System Project Rules

## Deployment
- Deploy this repo to **Vercel** (domain: accounting.anyismart.com).
- Do **not** rsync this app to the AWS Ubuntu box.
- To deploy: commit and `git push`; Vercel builds from the repo root.
- Required Vercel env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.
- PDF uses `@sparticuz/chromium` (not full Puppeteer Chrome). Keep `generate-pdf` on the Node runtime.

## AWS
- The Ubuntu host (`54.169.78.6`) is for **AIGC API only** (`aigc-api`, port 3002).
- After Vercel DNS for accounting.anyismart.com is live, stop `pm2` process `doc-gen-saas` on that box. Do not terminate the instance.
