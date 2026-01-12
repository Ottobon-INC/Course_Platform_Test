# CP_Frontend

React + Vite SPA for Course_Platform_Test.

Highlights:
- Course player renders block-based lesson content from `topics.text_content`.
- Cohort Project modal pulls assignment data from `/cohort-projects/:courseKey`.
- Study personas (normal/sports/cooking/adventure) switch text variants client-side.

Dev:
```bash
cd frontend
npm install
npm run dev
```

Env:
- `VITE_API_BASE_URL` should point to the backend (default `http://localhost:4000`).

Build:
```bash
npm run build
```
