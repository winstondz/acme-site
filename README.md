# acme-site

A fictional "ACME Corp" investor-relations site built with [Next.js](https://nextjs.org). It serves dummy quarterly reports (earnings releases, financial statements, presentations, price data) for 2022–2025 and is intended as a demo / test fixture.

All companies, figures and documents are fictitious.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/investors](http://localhost:3000/investors).

## Scripts

| Command            | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `npm run dev`      | Start the dev server                                           |
| `npm run build`    | Production build                                               |
| `npm start`        | Serve the production build                                     |
| `npm run lint`     | Run ESLint                                                     |
| `npm run generate` | Regenerate the dummy documents in `public/files/` (and `expected.json`) |

## Project layout

- `app/` – routes (`/investors`, `/investors/archive`, `/investors/reports/[year]`)
- `components/` – shared React components
- `data/reports.ts` – report metadata
- `scripts/generate-files.mjs` – generates the dummy PDF/XLSX/PPTX/CSV files

## License

[MIT](LICENSE)
