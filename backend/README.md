# Backend

Go HTTP API for My CRM application.

## Prerequisites

- Go 1.22 or higher
- PostgreSQL (optional, uses in-memory storage by default)
- [Air](https://github.com/cosmtrek/air) (optional, for hot reload during development)

## Installation

### Install Air (for hot reload)

Air provides automatic restarts when Go code changes during development.

**Using go install:**
```bash
go install github.com/cosmtrek/air@latest
```

**Using homebrew (macOS/Linux):**
```bash
brew install air
```

**Using curl (Linux/macOS):**
```bash
curl -sSfL https://raw.githubusercontent.com/cosmtrek/air/master/install.sh | sh -s -- -b $(go env GOPATH)/bin
```

## Development

### With Air (Hot Reload - Recommended)

Air will automatically restart the server when you make changes to `.go` files:

```bash
cd backend
air
```

Or use the VS Code task: `Start Backend`

### Without Air

Standard Go run:

```bash
cd backend
go run cmd/server/main.go
```

Or use the VS Code task: `Start Backend (No Hot Reload)`

## Configuration

Configuration is managed through environment variables. Copy `.env.sample` to `.env` and adjust as needed:

```bash
cp .env.sample .env
```

Key environment variables:
- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string (optional, uses in-memory storage if not set)

## Air Configuration

The Air configuration is stored in `.air.toml`. Key settings:

- **Build command**: `go build -o ./tmp/main ./cmd/server`
- **Watched extensions**: `.go`, `.tpl`, `.tmpl`, `.html`
- **Excluded directories**: `assets`, `tmp`, `vendor`, `testdata`, `migrations`
- **Excluded files**: `*_test.go` (test files don't trigger rebuilds)

## Testing

Run all tests:
```bash
go test ./...
```

Run tests with coverage:
```bash
go test -cover ./...
```

Tests use an in-memory SQLite database for fast, isolated test execution without requiring a real database connection.

## Database Migrations

Database migrations are located in `migrations/` directory. See the main project README for migration instructions.

## Project Structure

```
backend/
├── cmd/
│   └── server/          # Application entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── domain/          # Domain models
│   ├── http/            # HTTP handlers and API
│   ├── repository/      # Data persistence layer
│   └── server/          # HTTP server setup
├── migrations/          # Database migrations
├── .air.toml           # Air configuration
└── .env                # Environment variables (not in git)
```
