# ML Concept Map

An interactive map of how the ideas in a data science master's fit together — from high-school math foundations up through core concepts, algorithms, and the problems they solve. It's meant for orientation: see the whole field at once, see *why* things connect, and trace any confusing topic back to the idea you're missing.

**Live site:** https://trel725.github.io/ml-ds-map/

## Features

- **Layered map** — every node sits in one of six layers (foundations → math → core → algorithms → problems, plus tools), with typed edges such as "needs", "is trained by", "solves".
- **Five-slot recipe** — each algorithm is described by the same template: problem, model family, loss, optimizer, evaluation.
- **Guided tours** — short walkthroughs like *How a model learns* or *From tree to forest*.
- **Interactive visualizations** — gallery of small widgets (backpropagation, regularization, classification threshold, …).
- **List view** — searchable list with full panels, used automatically on narrow screens.

## Development

```sh
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run ci         # lint, typecheck, strict content check, unit tests, build
npm run e2e        # Playwright end-to-end tests
```

## Content

All map content lives in YAML under [`content/`](content/):

- `nodes/<layer>/` — concepts, one file per node
- `edges/` — typed relationships between nodes
- `tours/` — guided walkthroughs
- `groups.yaml` — visual groupings

`npm run content:check` validates the content; `npm run content:report` writes a readable summary to `content-report.md`.

## Deployment

Pushes to `main` run CI and deploy `dist/` to GitHub Pages via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
