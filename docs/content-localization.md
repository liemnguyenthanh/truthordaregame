# Vietnamese and English content

Published local catalogs are `public/vi` and `public/en`. Pack IDs, question IDs, types, trial IDs, category IDs, product IDs and prices are shared. URL locale determines language. Vietnamese routes and question URLs remain compatible. English DB question URLs carry `?locale=en`; caches must retain query strings.

`getPacks(locale)`, `getPack(slug, locale)`, `getCategories(locale)` and `getCategory(slug, locale)` default to `vi`. `getQuestionSet(pack)` reads `pack.locale`. English loaders never label Vietnamese content as English. With a configured database, unavailable English translation storage only falls back to bundled translations if the source question text/order/IDs/types, trial IDs and semantic metadata match exactly (imported UUID revisions may differ). A live source content edit hides stale translations until republished. Canonical prices can change without invalidating a bundled translation.

## Deployment

Apply `20260923040847_content_translations.sql` through your existing deployment migration process before publishing translations. This adds two service-role-only tables and a security-invoker transaction RPC; no existing Vietnamese table or commerce identity changes. The seed is conditional on exact bundled Vietnamese content so customized live questions are not paired with outdated English text. Review English copy before production. No remote database was modified during implementation.

Admin selects English and opens an existing Vietnamese pack to create a translation. Save sends `locale: "en"`, `sourceRevision` (current Vietnamese revision), and `expected` (existing translation revision or null). The server rejects source/editor conflicts and changed question/trial identities. Pricing, slug, product identity, age rating and other canonical metadata come from Vietnamese source. Only translated title, description, questions and publication state are editable. Updating a Vietnamese pack requires reviewing and republishing the corresponding English translation.

Versions are immutable and distinct per translation. Purchases remain keyed by the canonical `packId`, so access applies across available languages. Prices and payment currency remain VND.

AI generation input includes locale (default `vi` for older clients and persisted data). Locale participates in the normalized input hash, prompts and saved output; an idempotency key cannot accidentally return a pack generated in a different language. Existing generations retain their original language. No model/provider change is made.

## Checks

`npm test` validates both catalogs and identity parity, AI locale behavior and admin URLs. `npm run build` validates both content trees. Run `npm ci` and `npm run test:db` for the local SQL integration test using the pinned PGlite development dependency. It checks source/editor conflicts, question parity, immutable versions, canonical price isolation, and client-role denial. It uses an ephemeral embedded database; it does not connect to production.
