# Languages and agent documents

English is the default for first-time visitors. The EN / RU / 中文 selector translates static and dynamically created UI, placeholders, accessibility labels, modal contents, checkout messages and seasonal labels. Choices are saved locally; `?lang=en`, `?lang=ru` or `?lang=zh-CN` selects a shareable version. UI language changes do not regenerate orders or change any price, wallet, quantity or token mint.

The catalogue in assets/locales.js stores [English, Russian, Simplified Chinese] rows. assets/i18n.js preserves original DOM text and tracks later updates, including messages that refresh asynchronously. Addresses, code, user notes and chat transcripts are excluded. Generated AI replies use the user's language; the local project guide also supports Chinese. Keep business logic based on data identifiers, not translated labels.

Agent pages are ordinary static HTML with the same facts in three languages. llms.txt is a content index, not an access-control system, indexing guarantee or transaction API. data/catalog.json provides stable IDs, units, USD prices, merchant-published stock and capability limits. data/catalog.schema.json uses Schema.org offers and unit-price specifications. Token amounts are deliberately not cached in these documents: use the indicated live price source, freshness rules and exact rounding formula.

After modifying assets/market-core.js prices or inventory, run `npm run build:agents` and commit the generated agent pages/catalogue/JSON-LD together. This keeps frontend checkout and agent data consistent. Farm location is not present in any language or agent document. Impact and weather are explicitly illustrative; personal records are never exported by the build script.
