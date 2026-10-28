# UI and content rules for Агро Калькулятори

- Build for farmers who may be using a phone in a field: obvious labels, short sentences, generous hit areas and visible result summaries.
- Keep every user-facing string in Ukrainian.
- Use semantic HTML first. Every field needs a visible associated label; buttons and links must be keyboard accessible and have visible focus states.
- Preserve browser zoom, native copy/paste, and keyboard operation. Do not use icon-only controls without accessible names.
- Keep a single clear H1 per page, useful H2/H3 structure, unique titles and descriptions, canonical URLs, sitemap, robots file, and relevant JSON-LD.
- Use natural Ukrainian search phrases where they explain the tool. Do not repeat keywords unnaturally or promise search rankings.
- Calculator formulas must be visible on the page. Label assumptions and distinguish arithmetic estimates from agronomic recommendations.
- Prefer static pages and browser-side calculations. Do not send users' calculator inputs to a server.
- Prefer CSS transitions over JavaScript animations and respect `prefers-reduced-motion`.
- Avoid external fonts, trackers, and unnecessary JavaScript by default.
