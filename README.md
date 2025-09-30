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

### Backend API server

```bash
cd backend
cp .env.sample .env # configure DATABASE_URL and DATA_BACKEND
go run ./cmd/server
```

Set `DATA_BACKEND=postgres` and `DATABASE_URL=postgres://user:pass@localhost:5432/mycrm?sslmode=disable` to enable PostgreSQL persistence. When the variable is omitted, the server defaults to an in-memory store that is ideal for rapid prototyping and automated tests.

### Database migrations

The `backend/migrations` directory contains SQL scripts for bootstrapping a PostgreSQL database. Tools such as `golang-migrate`, `atlas`, or `dbmate` can apply them as part of your deployment pipeline.

## Quality checks

- `frontend`: ESLint (`npm run lint`) and Vitest (`npm run test`).
- `backend`: `go vet ./...` and `go test ./...`.

GitHub Actions runs these checks on every push and pull request targeting `main`.

## Next steps

- Wire the frontend components to live API endpoints using a typed client.
- Expand the domain model with activities, notes, and assignment workflows.
- Add authentication and role-based access control.
