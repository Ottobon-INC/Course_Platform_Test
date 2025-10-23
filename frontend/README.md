# Frontend

React + Vite single page application for the course platform prototype.

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```
The app is served at `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview   # optional: serve the built assets locally
```

### Environment variables

Create a `.env` file (copy `.env.example` if present) to override Vite variables such as `VITE_API_BASE_URL` when the backend is ready.

### Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Generate production assets into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Placeholder for future linting (add tooling as needed) |

Shared TypeScript types live in `../shared` and are imported using the `@shared/*` alias configured in `vite.config.ts`.