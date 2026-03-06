# Instruments Tracker

Firebase-based web app that migrates an instrument tracking system from Google Sheets / Google Apps Script to a modern React stack.

**Tech stack:** React 18 + TypeScript + Vite, Firebase (Auth + Firestore + Hosting), shadcn/ui + Tailwind, TanStack Query/Form, CASL, Recharts.

See `docs/` for full architecture, data model, RBAC, and implementation plan.

## Git Workflow

After every stable change, create a conventional commit:

```
<type>(<scope>): <short description>
```

**Types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`

**Scope:** the affected area, e.g. `types`, `auth`, `instruments`, `seed`, `permissions`, `idgen`

**Examples:**
- `feat(types): add Firestore document interfaces for all collections`
- `fix(idgen): read document ID instead of querying field`
- `refactor(permissions): separate seed ID from document body`

Rules:
- Commit only when a logical unit of work is stable and the build passes.
- Keep the subject line under 72 characters.
- Do not push unless explicitly asked.
