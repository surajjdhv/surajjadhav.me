# surajjadhav.me

A fresh personal website and blog for Suraj Jadhav, built with **Astro** and **AstroPaper**. No content from the existing website was used.

## Run locally

Use Node.js 24, as specified in `.nvmrc` and the deployment workflow.

```sh
npm ci
npm run dev
```

```sh
npm run build       # Type check, static site, social images, Pagefind index
npm test            # Check the built site's routes, links, feeds, series, and drafts
npm run preview     # Preview the production build, including working search
```

Search uses Pagefind. Run a build before testing search in development; rebuild after editing posts to refresh the index.

## Content organization

- **Writing** (`/posts/`): all published posts, paginated.
- **Categories** (`/categories/`): Learning, Building, Thoughts.
- **Tags** (`/tags/`): smaller topics that can span categories.
- **Series** (`/series/`): ordered journeys with their own landing page, day tracker, and previous/next entry navigation.
- **Archives**, **RSS**, **search**, **sitemap**, and generated social images are included.

The blog begins with **“After a decade in tech, I’m going deeper into AI”**, an introduction to the upcoming learning journey. It is not a numbered series entry, so progress stays at **0/100** until the first daily note is published. The earlier starter posts and draft template have been removed.

### Add a post

Create a Markdown or MDX file under `src/content/posts/`:

```yaml
---
title: What I learned today
description: A short description for the listing, search, and social previews.
pubDatetime: 2026-10-27T09:00:00+05:30
category: Learning
tags: [ai, learning-in-public]
draft: true
---
```

Write below the frontmatter. Set `draft: false` when ready. Drafts are excluded from routes, listings, feeds, search, and day counts. Future posts are excluded from production until their publication time; a static site must be rebuilt to publish scheduled content. Dates display in Asia/Kolkata.

### Publish a series day

Create a post such as `src/content/posts/learning-ai/day-001.md` using the frontmatter above, then add:

```yaml
series: 100-days-of-learning-ai
seriesDay: 1
```

Write the note, set its publication date, and set `draft: false`. Entries appear in day order regardless of publication date. Progress counts published entries, so a skipped day doesn't inflate completion. The schema rejects unknown series, missing or invalid day numbers, and days beyond the target. Duplicate days also fail the build.

Add a new series in `src/data/series.ts`. Category labels live there too; if adding a category, also update the category enum in `src/content.config.ts`.

Post URLs follow filenames and folders. Keep published filenames stable to preserve links. Giscus maps to a specific term using the post ID; set `commentId` to a permanent identifier before renaming a published post if you need to preserve its discussion (use the original post ID).

## Giscus comments

The lazy-loaded component is integrated on every post. It follows the site's light/dark theme and provides a GitHub fallback if the embed fails. Until configured, it displays a quiet link to your GitHub profile.

1. Choose a **public GitHub repository** for discussions.
2. Enable Discussions in that repository's settings.
3. Install the [Giscus GitHub app](https://github.com/apps/giscus) for that repository.
4. At [giscus.app](https://giscus.app/), choose the repository and a discussion category (Announcements is recommended). Copy `data-repo`, `data-repo-id`, `data-category`, and `data-category-id` into the corresponding values below.
5. Copy `.env.example` to `.env`, fill in the values, then restart development or rebuild for production. Add the same values to your hosting provider's build environment.

```dotenv
PUBLIC_GISCUS_REPO=your-user/your-repository
PUBLIC_GISCUS_REPO_ID=actual-id-from-giscus
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=actual-category-id-from-giscus
```

These are public embed identifiers, **not access tokens**. No GitHub access token belongs in browser code. The integration uses a stable specific-term mapping and strict matching; don't change the mapping in the component after launch without migrating discussions. Live posting could not be tested without a configured repository.

## GitHub contribution chart

The homepage loads real activity for **surajjdhv**, configured in `src/data/integrations.ts`. It fetches in the visitor's browser when the chart approaches the viewport, so activity refreshes without rebuilding. No GitHub token is needed. Colors adapt to the site's theme, daily cells have tooltips, and a screen-reader summary and GitHub profile link are provided.

Public contribution data comes from the third-party [GitHub Contributions API](https://github.com/grubersjoe/github-contributions-api), which caches results for about an hour. A visitor's browser connects to that provider. If the service is unavailable, the profile link remains usable and no activity data is fabricated.

## Customize

- `astro-paper.config.ts`: name, domain, description, social links, timezone, pagination.
- `src/styles/theme.css`: light/dark palettes and contribution colors.
- `src/styles/global.css`: layouts and component styles.
- `src/content/pages/about.md`: About page.
- `src/data/series.ts`: categories and series definitions.

## Deploy with GitHub Pages

The [GitHub Pages workflow](.github/workflows/lighthouse.yml) builds the site with Node.js 24, runs the site tests, and requires every audited page to score 100 in all four Lighthouse categories on mobile and desktop. Once both checks pass on `main`, it publishes the exact `dist` artifact from the mobile check. Pull requests run the same checks without deploying. You can also run the workflow manually from Actions.

One-time repository setup:

1. Open **Settings → Pages → Build and deployment** and select **GitHub Actions** as the source.
2. In **Settings → Secrets and variables → Actions → Variables**, add the public Giscus values listed above when ready. The workflow also accepts `PUBLIC_GOOGLE_SITE_VERIFICATION`. No personal access token is needed; deployment uses GitHub's built-in token.
3. Set **Custom domain** to `surajjadhav.me` in Pages settings. The Astro site URL and `public/CNAME` already use that domain, and `public/.nojekyll` is included in the export.
4. When ready to switch away from the VPS, follow [GitHub's custom-domain DNS instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Point the apex domain at GitHub Pages and, if using `www`, point its CNAME to `surajjdhv.github.io`. Enable **Enforce HTTPS** once GitHub has issued the certificate.

The site is configured for the custom domain at `/`; it does not use the `/surajjadhav.me/` project-path base. Configure the custom domain before checking the published site's navigation and assets. Changing workflow files does not change DNS or move traffic away from the VPS. Check old URLs and arrange any needed redirects before the DNS switch; the old content was intentionally not inspected.

## Credits

Built on [AstroPaper](https://github.com/satnaing/astro-paper) by Sat Naing, under its included MIT license. The theme foundation is retained, with a new personal design, content model, series system, and integrations.

## Typography

- **Instrument Serif**: display headings, article titles, and post titles. The homepage accent line uses its real italic face.
- **Manrope**: body text and interface, with 18–19px article text, 16–18px summaries, and 14–15px navigation.
- **Google Sans Code**: code, dates, tags, chart labels, and day numbers.

Astro downloads the font files during the build and serves them locally. Body and display faces are preloaded; `font-display: swap` keeps text visible during loading. Article text is limited to 42rem, with generous line spacing. Font families are configured in `astro.config.ts`; their roles are in `src/styles/theme.css` and `src/styles/global.css`.

## Logo & favicons

The **SJ monogram** lives in `src/assets/brand/sj-monogram.svg`. Its overlapping serif letterforms are outlined from Instrument Serif, so the mark stays consistent without loading a font. The header uses an open terracotta mark beside a quiet name wordmark.

Run `npm run icons` after changing the master SVG. This generates the reusable `public/logo.svg`, SVG favicon, 32px PNG favicon, a 16/32/48px ICO, and a 180px Apple touch icon. The build runs this step automatically. Favicons use the same letterforms with a slightly stronger stroke on an ink circle for legibility at small sizes.

## Lighthouse

```sh
npm run build
npm run audit                    # Every regular HTML page, mobile and desktop
npm run audit -- --mobile /      # A focused homepage check
npm run audit -- --desktop /resume/
npm run audit -- --url=https://surajjadhav.me / /posts/a-decade-in-tech-learning-ai/
```

Requires a local Chrome installation (set `CHROME_PATH` if it is not detected). The audit uses Lighthouse's standard mobile and desktop presets with cold browser profiles. Local runs serve the real `dist` export with production compression and the same immutable asset policy declared for Netlify. Reports and a score summary are saved under `.lighthouse/`, which is not committed.

The command fails if any tested page scores below 100 in Performance, Accessibility, Best Practices, or SEO. The GitHub Actions workflow runs the same audit for every normal page on pushes and pull requests, and retains the reports for inspection. The 404 page is intentionally excluded because its expected HTTP error and `noindex` policy are incompatible with a normal-page SEO audit.

A local production-build result does not certify the live domain: hosting, network conditions, enabled third-party integrations, browser versions, and future content can affect scores. Use `--url` after deployment to measure the public site as served.
