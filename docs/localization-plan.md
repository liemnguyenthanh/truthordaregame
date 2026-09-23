# Vietnamese–English implementation plan

Scope: keep existing Vietnamese URLs and add English UI, published question content, AI generation, offline support and SEO/GEO. Prices and settlement stay in VND. A purchase unlocks the same canonical pack across available languages.

## Workstreams

1. Shared locale helpers, request-derived server language, client provider and language switching.
2. Shared UI with an English dictionary, localized validation/errors, dates and currency labels.
3. Locale-aware bundled/database content, additive translation storage and admin publishing; locale in AI input/hash/output.
4. English public routes, canonical/hreflang/sitemap, truthful structured data, useful explanatory content and localized share metadata.
5. Offline content isolation, localized manifest/fallback, regression tests and browser verification.

All five workstreams are implemented in the working tree. Source question IDs and trial IDs remain aligned across translations. Normal game progress and purchase identities are shared; AI-generated packs retain their creation language.

## Verification

- TypeScript and unit tests cover routing, interpolation, translated content parity, AI locale validation, translation editor URLs, error messages and service-worker isolation.
- Embedded PostgreSQL checks exercise translation migrations, publish conflicts, canonical product protection, immutable versions and permissions without accessing production.
- Production browser tests cover server HTML, metadata, redirects, language switching during play, mobile layout and real offline caching.
- Existing Vietnamese game, group, mocked commerce and mocked AI tests remain part of regression coverage. External AI generation, bank transfers and production deployment are separate from these local checks.

## Rollout

See [content-localization.md](content-localization.md) for migration and publishing details, and [SEO-GEO.md](SEO-GEO.md) for crawl/index prerequisites and post-launch measurement.

The connected live catalog has edits that differ from the bundled source: one friends pack has a different title, and another has different questions, tier and trial settings. These must be translated from their current Vietnamese source in admin. The loader deliberately withholds incompatible bundled translations, and the language switch falls back to the translated category listing.

Deployment, production migration and Search Console submission have not been performed by this implementation task. Technical SEO/GEO supports discovery and clear source attribution; recommendations and rankings are determined by search/AI providers.
