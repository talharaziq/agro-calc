# Агро Калькулятори — Astro source

Багатосторінковий україномовний сайт для фермерів України на Astro, Tailwind CSS v4 і звичайному JavaScript. У каталозі 26 окремих калькуляторів із власними URL, метаданими, формулами та FAQ. Розрахунки виконуються у браузері; історія зберігається локально в браузері на пристрої.

## Local development 

Requirements: Node.js compatible with Astro 5 and npm.

```bash
npm install
npm run dev
```

Build static output: `npm run build`. Astro writes production files to `dist/`. The static `public/robots.txt` points to the Astro sitemap index.

## Cloudflare Pages

For a Git-connected build, use build command `npm run build` and output directory `dist`. The production domain configured in metadata is `https://agrocalculator.pp.ua`; add it under **Workers & Pages → your Pages project → Custom domains** and configure DNS in the owner account. Do not rely on a DNS record alone without associating the domain with the Pages project.

## Account-specific launch steps

- Verify the domain and DNS routing to the correct Pages project.
- Enable Cloudflare Web Analytics from the owner's Cloudflare dashboard and confirm actual data collection.
- Apply for Google AdSense from the owner account and wait for review. Do not publish an invented publisher ID or an `ads.txt` entry; use only the real ID supplied by Google after account setup.
- Create a Google Search Console Domain property, complete the DNS verification, then submit the deployed sitemap.
- Review privacy / cookie disclosures after the analytics and advertising services are actually active.
- Test the live site on mobile, check all calculator results and mailto link, and re-submit the sitemap after deployment.

## Accuracy and editorial notes

Example values are demonstrations, not crop or application recommendations. Formula pages explain assumptions and limits; pesticide/fertilizer application rates are not prescribed. Do not present estimated query demand as measured search volume. Use Search Console queries and impressions after launch to refine SEO priorities.
Deployment configuration updated for Cloudflare Pages.
