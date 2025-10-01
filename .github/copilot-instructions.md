# Project briefing for AI agents

Welcome! This document helps autonomous agents, copilots, or other AI-powered tools work effectively inside the **My CRM** monorepo.

## Goals

- Deliver a simple CRM experience that tracks **accounts**, their **contacts**, and **support tickets**.
- Provide a clean separation between the React frontend (`frontend/`) and Go backend (`backend/`), sharing documentation in `docs/`.
- Provide production-ready PostgreSQL persistence for the backend.

## Key components

| Folder | Purpose |
| --- | --- |
| `frontend/` | React + Vite SPA written in TypeScript. Uses ESLint, Vitest, and Testing Library. |
| `backend/` | Go HTTP API exposing REST endpoints for accounts, contacts, and tickets. Repository pattern allows swapping storage backends. |
| `docs/` | Architectural notes, onboarding guides, and technical documentation. |

## Technical Documentation

For detailed technical specifications and guidelines, please refer to:
- **Frontend**: See `docs/technical/frontend/README.md` for comprehensive frontend architecture, theme system, component patterns, and development guidelines
- **General**: See `docs/README.md` for documentation structure overview

## Developer workflows

1. **Frontend**
   - Install dependencies with `npm install` (Node 20+).
   - Run the dev server via `npm run dev` (Vite, port 5173).
   - Execute linting/tests with `npm run lint` and `npm run test`.

2. **Backend**
   - Configure environment variables using `.env.sample`.
   - Start the API with `go run ./cmd/server`.
   - Quality gates: `go vet ./...` and `go test ./...`.
   - PostgreSQL connection handled through `DATABASE_URL`; migrations live under `backend/migrations/`.

## Current API surface

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Health check |
| `GET` | `/accounts` | List all accounts |
| `POST` | `/accounts` | Create an account |
| `GET` | `/accounts/{accountID}` | Fetch a single account |
| `GET` | `/accounts/{accountID}/contacts` | List contacts for an account |
| `POST` | `/accounts/{accountID}/contacts` | Create a contact |
| `GET` | `/accounts/{accountID}/tickets` | List tickets for an account |
| `POST` | `/accounts/{accountID}/tickets` | Create a ticket |

JSON payloads and response shapes are defined in `backend/internal/http/api.go`.

## Tooling and CI

- GitHub Actions workflow `.github/workflows/ci.yml` runs linting and tests for both frontend and backend on pushes and pull requests.
- Frontend uses ESLint (with React, TypeScript, and accessibility rules) plus Vitest with Testing Library.
- Backend relies on Go's standard tooling (`go vet`, `go test`) with tests using an in-memory SQLite database for isolation; PostgreSQL implementation is used in production.

## Extending the system

- Expand the domain in `backend/internal/domain/` and expose new endpoints via `backend/internal/http/`.
- For persistence, update `backend/migrations/` and extend `repository.PostgresRepository`.
- Create typed API hooks or state management in the frontend (e.g., React Query) to consume new endpoints.

Please keep this document up to date when you introduce significant architectural changes so future agents can jump in quickly.
