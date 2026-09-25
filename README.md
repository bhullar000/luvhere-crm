# Luvhere CRM — frontend (React)

React + Vite + TypeScript + Tailwind admin UI for Luvhere, themed with the app's dark
pink/violet design tokens. Talks to **kive-crm-backend** (Laravel).

```bash
cp .env.example .env      # VITE_API_URL=http://localhost:8001
npm install
npm run dev               # http://localhost:5174
npm run build             # type-check + production bundle in dist/
```
Set `CORS_ALLOWED_ORIGINS` in the backend `.env` to wherever this is served.

## Sections
Dashboard · Analytics · Users (+detail actions) · Photo moderation · Verification · Reports ·
Blocks · Reference data · Notifications · App config · Admins · Audit log.
Menu items and routes are hidden by role (super_admin, admin, moderator, support).
