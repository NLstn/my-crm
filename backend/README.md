# CRM Backend - Go + OData v4

This is the backend service for the CRM system, built with Go and using the `go-odata` library to provide OData v4 compliant APIs.

## Technology Stack

- **Go 1.25**: Programming language
- **GORM**: ORM for database operations
- **PostgreSQL**: Database
- **go-odata**: OData v4 API framework (MANDATORY for all APIs)

## Architecture

### Models

- `Account`: Customer/business accounts
- `Contact`: People associated with accounts
- `Issue`: Support tickets/issues

All models include proper relationships and are exposed via OData v4 endpoints.

### Database

PostgreSQL database with automatic migrations via GORM. The devcontainer includes a PostgreSQL service that's automatically configured.

## OData v4 API Endpoints

All APIs are built using `go-odata` and strictly follow the OData v4 specification:

### Service Root & Metadata
- `GET /` - Service document
- `GET /$metadata` - Full metadata document

### Accounts
- `GET /Accounts` - List all accounts
- `GET /Accounts(1)` - Get specific account
- `POST /Accounts` - Create account
- `PATCH /Accounts(1)` - Update account
- `DELETE /Accounts(1)` - Delete account

### Contacts
- `GET /Contacts` - List all contacts
- `GET /Contacts(1)` - Get specific contact
- `POST /Contacts` - Create contact
- `PATCH /Contacts(1)` - Update contact
- `DELETE /Contacts(1)` - Delete contact

### Issues
- `GET /Issues` - List all issues
- `GET /Issues(1)` - Get specific issue
- `POST /Issues` - Create issue
- `PATCH /Issues(1)` - Update issue
- `DELETE /Issues(1)` - Delete issue

## OData Query Options

All endpoints support standard OData v4 query options:

- `$filter` - Filter results (e.g., `$filter=Status eq 'New'`)
- `$select` - Select specific properties
- `$expand` - Include related entities (e.g., `$expand=Contacts,Issues`)
- `$orderby` - Sort results
- `$top` / `$skip` - Pagination
- `$count` - Include total count
- `$search` - Full-text search

### Examples

```bash
# Get all accounts with their contacts
GET /Accounts?$expand=Contacts

# Get high priority issues
GET /Issues?$filter=Priority eq 'High'

# Get accounts in Technology industry, sorted by name
GET /Accounts?$filter=Industry eq 'Technology'&$orderby=Name

# Get first 10 contacts with pagination
GET /Contacts?$top=10&$skip=0

# Search for specific account
GET /Accounts?$search=Acme
```

## Development

### Prerequisites

- Docker and Dev Containers extension in VS Code

### Getting Started

1. Open the project in VS Code
2. Reopen in container (Command Palette: "Reopen in Container")
3. The backend will automatically install dependencies

### Running the Server

#### With Hot Reloading (Recommended for Development)

The project uses [Air](https://github.com/air-verse/air) for automatic hot reloading during development:

```bash
cd /workspace/backend
air
```

Air will automatically rebuild and restart the server whenever you make changes to `.go` files.

**Using VS Code Tasks:**
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Run "Tasks: Run Task" → "Start Backend"

#### Manual Run (Without Hot Reloading)

```bash
cd /workspace/backend
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

#### Air Configuration

Air is configured via `.air.toml` in the backend directory. Key settings:
- Build output: `tmp/main`
- Watches: All `.go` files (excluding tests)
- Delay: 1 second after file changes
- Temporary build files are stored in `tmp/` (gitignored)

### Database Connection

The devcontainer automatically configures PostgreSQL:
- Host: `db`
- Port: `5432`
- Database: `crm`
- User: `crmuser`
- Password: `crmpassword`

## Important Notes

⚠️ **MANDATORY**: All APIs MUST be built using the `go-odata` library. This is mission critical!

If you encounter a feature that cannot be built with `go-odata`, **STOP** and report the missing feature. The library follows OData v4 specification strictly, and extensions are possible within the specification boundaries.

## Next Steps

- Add custom OData actions and functions as needed
- Implement authentication/authorization
- Add more entities as the CRM grows
- Implement change tracking for delta queries (if needed)
