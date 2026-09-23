# Vietnamese / English discovery

Public pages render their localized text on the server. Vietnamese URLs are preserved; English uses `/en`, `/en/packs/:slug`, `/en/categories`, `/en/categories/:slug`, `/en/how-to-play`, `/en/contact`, `/en/payment-policy`, and `/en/privacy`. Pack/category slugs remain stable across languages. Legacy English URLs containing Vietnamese route segments permanently redirect to English canonical paths. Unsupported locales return 404.

Each public page has a self canonical, reciprocal `vi` / `en` alternate links, and Vietnamese `x-default`. Pack alternates and sitemap entries are generated only for available published translations. Do not advertise a translation until its full question set and metadata are published. Checkout, recovery, games, and private AI workflows carry `noindex` and are absent from the sitemap. Robots allows crawling public pages, including search crawlers used by AI search; preview deployments disallow crawling. Do not block noindex pages in robots: crawlers must fetch the exclusion directive.

The homepage directly answers game rules, registration, and pricing-model questions. The rules article explains play, consent/skip, replay, and offline limitations. Pack pages expose actual trial question samples and factual question/player counts. Structured data matches rendered content (WebSite, FAQPage, CollectionPage and breadcrumbs); there are no fabricated ratings, reviews, prices, endorsements, or promises of AI recommendations. FAQ markup is descriptive; it does not imply eligibility for Google's restricted FAQ rich results.

## Deployment and measurement

1. Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS production origin (no trailing slash); a localhost fallback is for development only. Supply the real support email before accepting payments.
2. Deploy, verify 200 pages, 308 old English paths, language attributes, canonical/hreflang reciprocity, and the production sitemap and robots response.
3. Verify the domain in Google Search Console and Bing Webmaster Tools, submit `/sitemap.xml`, and inspect both languages. Infrastructure/CDN must permit the desired crawlers as well as app robots.
4. Track index coverage, impressions and clicks by language/page and queries, plus actual AI referral traffic when analytics is deliberately configured. Test relevant questions manually over time; recommendations and indexing are not guaranteed.
5. Keep claims, content, support information and translations current. Publish new useful packs with complete original descriptions; do not mass-produce near-duplicate SEO pages.

Google's AI Search guidance says normal technical SEO and helpful visible content apply; no special AI text file or schema is required. This implementation does not add an unsupported `llms.txt` requirement or alter model-training permissions. Search access and model-training permissions are different policies.

References checked 23 September 2026:

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
