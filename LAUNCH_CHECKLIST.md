# Pre-Launch To-Do List — Art Shop (Next.js → Vercel)

## 1. Finish the Site

- [ ] **Replace all placeholder content** — `"Your Name"`, `"Art Shop"`, `"example.com"` in `app/layout.tsx` metadata, and the `// TODO: Add your keywords here` comment
- [ ] **Fill in the `/about` page** — the `about/` directory exists but needs content
- [ ] **Add an OG image** — add `opengraph-image` or `twitter-image` to `app/` or set it in metadata
- [ ] **Add a favicon / app icons** — ensure `app/favicon.ico`, `app/icon.png`, or `app/apple-icon.png` exists
- [ ] **Final copy & design pass** — check all pages (Home, Work, About, Admin, Purchase flows) for typos, broken layouts, and mobile responsiveness
- [ ] **Test Stripe checkout flow end-to-end** — add product → cart → checkout → success/cancelled pages
- [ ] **Test Stripe webhook** (`/api/webhooks/stripe`) — ensure stock updates and order confirmation work in test mode
- [ ] **Test admin auth gate & CRUD** — add/edit product flows via `/admin`
- [ ] **Run `npm run build` locally** — fix any build errors or warnings before deploying

## 2. SEO Maximisation

- [ ] **Set `NEXT_PUBLIC_SITE_URL`** to the production domain (e.g. `https://clientdomain.com`) — this feeds `metadataBase`, sitemap, robots
- [ ] **Expand `sitemap.ts`** — dynamically include `/about` and any individual product/project pages from Supabase
- [ ] **Add per-page metadata** — ensure `/work`, `/about`, and product pages export their own `metadata` with unique `title` and `description`
- [ ] **Add structured data (JSON-LD)** — `Organization` schema on the homepage, `Product` schema on product pages, `BreadcrumbList` on inner pages
- [ ] **Finalise keyword list** in `app/layout.tsx` — research and add client-specific long-tail keywords
- [ ] **Ensure all images have `alt` text** — audit `<Image>` components across the site
- [ ] **Check Core Web Vitals** — run Lighthouse after deploy; `sharp` is already installed which helps with image optimisation
- [ ] **Verify `robots.ts`** allows all pages and links to the sitemap

## 3. Deploy to Vercel

- [ ] **Push repo to GitHub** (if not already)
- [ ] **Import project into Vercel** — connect the GitHub repo
- [ ] **Set environment variables on Vercel:**
  - `NEXT_PUBLIC_SITE_URL` — production URL
  - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (if used server-side)
  - `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET` — generate a new one for the production endpoint
  - `ADMIN_PASSWORD` or whatever your admin auth uses
- [ ] **Trigger first production build** — verify it succeeds on Vercel
- [ ] **Set Stripe webhook endpoint** to `https://yourdomain.com/api/webhooks/stripe` in the Stripe Dashboard (production mode)

## 4. Domain Setup

- [ ] **Purchase/transfer domain** (if the client hasn't already)
- [ ] **Add custom domain in Vercel** → Project Settings → Domains
- [ ] **Update DNS records** at the registrar:
  - `A` record → `76.76.21.21` (Vercel)
  - `CNAME` for `www` → `cname.vercel-dns.com`
- [ ] **Wait for DNS propagation** and verify domain shows the site
- [ ] **Verify SSL certificate** — Vercel auto-provisions Let's Encrypt; confirm HTTPS works
- [ ] **Set up redirect** — choose `www` → apex or apex → `www` in Vercel domain settings
- [ ] **Update `NEXT_PUBLIC_SITE_URL`** env var to match the final canonical domain

## 5. Post-Deploy Verification

- [ ] **Submit sitemap to Google Search Console** — `https://yourdomain.com/sitemap.xml`
- [ ] **Submit sitemap to Bing Webmaster Tools**
- [ ] **Run Lighthouse audit** on all key pages (aim for 90+ on Performance, Accessibility, SEO)
- [ ] **Test all purchase flows on production** with Stripe live mode
- [ ] **Check OpenGraph previews** — paste URL into [opengraph.xyz](https://opengraph.xyz) or social media debuggers (Facebook, Twitter/X)
- [ ] **Test on multiple devices/browsers** — Chrome, Safari, Firefox, mobile
- [ ] **Verify `/robots.txt`** and `/sitemap.xml` are accessible
- [ ] **Set up Vercel Analytics** (optional, free tier) for traffic monitoring
- [ ] **Set up error monitoring** — Vercel's built-in or Sentry

## 6. Client Handoff

- [ ] **Transfer Vercel project to client's Vercel account** (or add them as a team member)
- [ ] **Document env vars & third-party accounts** — Stripe, Supabase, domain registrar
- [ ] **Hand over Stripe Dashboard access** (or confirm client already has it)
- [ ] **Brief the client on admin panel usage** — adding/editing products
- [ ] **Set up Vercel notifications** for deploy failures (email to client or you)
