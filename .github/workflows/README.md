# CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### Backend CI (`backend-ci.yml`)

**Trigger Conditions:**
- Push to `main` or `develop` branches with changes in `backend/**`
- Pull requests to `main` or `develop` branches with changes in `backend/**`

**Steps:**
1. Checkout code
2. Set up Go 1.24 with dependency caching
3. Download and verify Go dependencies
4. Build the backend application
5. Run tests with race detection and coverage
6. Upload coverage report as artifact

**Artifacts:**
- `backend-coverage`: Test coverage report

### Frontend CI (`frontend-ci.yml`)

**Trigger Conditions:**
- Push to `main` or `develop` branches with changes in `frontend/**`
- Pull requests to `main` or `develop` branches with changes in `frontend/**`

**Steps:**
1. Checkout code
2. Set up Node.js 20 with npm caching
3. Install dependencies using `npm ci`
4. Run ESLint linter
5. Build the frontend application
6. Upload build artifacts

**Artifacts:**
- `frontend-build`: Production build files

## Path Filtering

Both workflows use GitHub Actions path filtering to run only when relevant files change:

- **Backend CI** runs when files in the `backend/` directory or the backend workflow file itself changes
- **Frontend CI** runs when files in the `frontend/` directory or the frontend workflow file itself changes

This ensures efficient CI runs and faster feedback for developers.

## Local Testing

Before pushing changes, you can test the build and test processes locally:

### Backend
```bash
cd backend
go mod download
go mod verify
go build -v ./cmd/server/main.go
go test -v -race ./...
```

### Frontend
```bash
cd frontend
npm ci
npx eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 10
npm run build
```
