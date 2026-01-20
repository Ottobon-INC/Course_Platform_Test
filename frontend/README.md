# CP_Frontend

React + Vite frontend for Course_Platform_Test.

## Quick start
```bash
cd frontend
npm install
npm run dev
```

## Env
- `VITE_API_BASE_URL` (default `http://localhost:4000`) used by `buildApiUrl`.

## Notes
- The marketing navbar OAuth flow uses `VITE_API_URL` in `src/App.tsx`; keep it aligned with `VITE_API_BASE_URL`.
