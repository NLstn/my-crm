# My CRM System

A modern CRM (Customer Relationship Management) system built with React and Go, leveraging OData v4 for the backend API.

## Project Structure

```
my-crm/
├── backend/                 # Go backend service
│   ├── cmd/
│   │   └── server/         # Main server application
│   ├── models/             # GORM database models
│   ├── database/           # Database connection and migrations
│   └── README.md
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components (Accounts, Contacts, Issues)
│   │   ├── contexts/      # React contexts (Theme)
│   │   ├── lib/           # Utilities (API client)
│   │   └── types/         # TypeScript type definitions
│   └── package.json
└── .devcontainer/         # Development container configuration
```

## Features

### Current Features (v1.0)

- **Accounts Management**: Create, view, and update customer/business accounts
- **Contacts Management**: Manage contacts associated with accounts
- **Issues/Tickets**: Track support tickets and issues
- **Dark Mode**: Automatic dark mode support based on system preferences
- **Responsive Design**: Works on desktop and mobile devices
- **OData v4 API**: Full OData v4 compliant API with query support

### OData v4 Query Support

All APIs support standard OData v4 query options:
- `$filter` - Filter results
- `$select` - Choose specific properties
- `$expand` - Include related entities
- `$orderby` - Sort results
- `$top` / `$skip` - Pagination
- `$count` - Get total count
- `$search` - Full-text search

## Technology Stack

### Backend
- **Go 1.23**: Programming language
- **go-odata**: OData v4 library (MANDATORY for all APIs)
- **GORM**: ORM for database operations
- **PostgreSQL**: Relational database

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **React Router**: Client-side routing

## Getting Started

### Prerequisites

- Docker and Docker Compose
- VS Code with Dev Containers extension

### Development Setup

1. **Clone the repository** (if not already done)

2. **Open in Dev Container**:
   - Open the project in VS Code
   - Press `F1` and select "Dev Containers: Reopen in Container"
   - Wait for the container to build and start

3. **Start the Backend**:
   ```bash
   cd /workspace/backend
   go mod download
   go run cmd/server/main.go
   ```
   
   Backend will be available at `http://localhost:8080`

4. **Start the Frontend**:
   ```bash
   cd /workspace/frontend
   npm install
   npm run dev
   ```
   
   Frontend will be available at `http://localhost:3000`

### Database

The PostgreSQL database is automatically configured in the dev container:
- **Host**: `db`
- **Port**: `5432`
- **Database**: `crm`
- **User**: `crmuser`
- **Password**: `crmpassword`

The database is automatically migrated and seeded with sample data on first run.

## Project Guidelines

### Backend Development

⚠️ **CRITICAL**: All backend APIs MUST use the `go-odata` library. This is non-negotiable.

- Follow OData v4 specification strictly
- If you need a feature not supported by `go-odata`, STOP and report it
- Use GORM for all database operations
- Follow Go best practices and idiomatic patterns

### Frontend Development

- Use the defined color scheme from TailwindCSS config (NO custom colors!)
- Support dark mode for all new components
- Use React Query for all API calls
- Follow TypeScript strict mode
- Keep components small and focused

### Color Scheme

The application uses a predefined color palette:
- **Primary**: Blue shades (for main actions and branding)
- **Secondary**: Purple shades (for accents)
- **Success**: Green shades (for success states)
- **Warning**: Yellow/Orange shades (for warnings)
- **Error**: Red shades (for errors)
- **Gray**: Neutral colors (for text and backgrounds)

Dark mode is automatically supported for all colors.

## API Examples

### Get all accounts with their contacts
```bash
GET http://localhost:8080/Accounts?$expand=Contacts
```

### Filter high priority issues
```bash
GET http://localhost:8080/Issues?$filter=Priority eq 'High'
```

### Get accounts in Technology industry
```bash
GET http://localhost:8080/Accounts?$filter=Industry eq 'Technology'&$orderby=Name
```

### Search for specific contact
```bash
GET http://localhost:8080/Contacts?$search=Smith
```

### Get paginated results
```bash
GET http://localhost:8080/Accounts?$top=10&$skip=0&$count=true
```

## Contributing

When contributing to this project:

1. Follow the established patterns and conventions
2. Use the go-odata library for ALL backend APIs
3. Respect the color scheme - no custom colors
4. Support dark mode in all new features
5. Write clean, maintainable code
6. Test your changes thoroughly

## Future Enhancements

Potential features for future versions:
- User authentication and authorization
- Activity/audit logging
- Email integration
- Document attachments
- Advanced reporting and analytics
- Custom fields
- Workflow automation
- Mobile apps

## License

This project is private and proprietary.

## Support

For questions or issues, please contact the development team.
