# My CRM Monorepo

A lightweight customer relationship management (CRM) starter kit featuring a React + Vite front end, a Go HTTP API, and PostgreSQL for persistent storage. The codebase is organised as a monorepo with dedicated workspaces for the web client, backend services, and documentation.

## Repository layout

```
frontend/   React + Vite single-page application
backend/    Go REST API with pluggable storage (memory, Postgres)
docs/       Reference guides and implementation notes
```

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- Go 1.22+
- PostgreSQL 14+ (for the database-backed repository)

### Frontend development server

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on http://localhost:5173 by default and proxies API calls to the Go backend (configure as needed in future iterations).

#### Component Library

The frontend includes a reusable component library in `frontend/src/components/`:

- **Layout**: Main layout wrapper with header and content structure
- **Header**: Application header with My CRM logo and profile menu
- **Dropdown**: Dropdown menu with keyboard navigation
- **ProfileDropdown**: User profile menu with theme switcher (placeholder)

The Layout component provides consistent page structure with a full-width header and is prepared for future footer integration.

See `frontend/src/components/README.md` for detailed documentation on all components.

### Backend API server

```bash
cd backend
cp .env.sample .env # optionally configure DATABASE_URL
go run ./cmd/server
```

The server uses an in-memory store by default, which is ideal for rapid prototyping and development. To enable PostgreSQL persistence, set `DATABASE_URL=postgres://user:pass@localhost:5432/mycrm?sslmode=disable` in your `.env` file.

### Database migrations

The `backend/migrations` directory contains SQL scripts for bootstrapping a PostgreSQL database. Tools such as `golang-migrate`, `atlas`, or `dbmate` can apply them as part of your deployment pipeline.

## Quality checks

- `frontend`: ESLint (`npm run lint`) and Vitest (`npm run test`).
- `backend`: `go vet ./...` and `go test ./...`. Tests use an in-memory SQLite database for isolation.

GitHub Actions runs these checks on every push and pull request targeting `main`.

## Next steps

- Wire the frontend components to live API endpoints using a typed client.
- Expand the domain model with activities, notes, and assignment workflows.
- Add authentication and role-based access control.
