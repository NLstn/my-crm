# AI Agent Instructions for CRM System

This document provides critical instructions for AI coding agents (like GitHub Copilot, Cursor, or other AI assistants) working on this CRM system.

## Project Overview

This is a custom CRM (Customer Relationship Management) system with:
- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Go + GORM + PostgreSQL
- **API Protocol**: OData v4 (using go-odata library)
- **Testing**: Playwright MCP for browser automation

## 🚨 CRITICAL REQUIREMENTS - READ FIRST

### Backend: go-odata Library is MANDATORY

**⚠️ MISSION CRITICAL**: ALL backend APIs MUST be built using the `go-odata` library (https://github.com/NLstn/go-odata).

**Rules:**
1. **NO exceptions**: Every API endpoint must use go-odata
2. **No custom REST APIs**: Do not create custom REST endpoints
3. **No workarounds**: Do not try to bypass or work around go-odata
4. **Report missing features**: If you encounter something that cannot be built with go-odata:
   - **STOP immediately**
   - **DO NOT implement a workaround**
   - **Report the missing feature** to the user
   - Explain what you were trying to accomplish
   - Ask for guidance on how to proceed

**Why this matters:**
- go-odata is the user's own library
- The library strictly follows OData v4 specification
- Extensions that don't break OData spec are possible
- Extension points already exist (check documentation)
- User wants to know about gaps to improve the library

**Valid approaches:**
- ✅ Use go-odata's RegisterEntity for CRUD operations
- ✅ Use go-odata's RegisterAction for custom actions
- ✅ Use go-odata's RegisterFunction for custom functions
- ✅ Use OData query options ($filter, $expand, etc.)
- ✅ Use go-odata's navigation properties
- ❌ Create custom REST endpoints
- ❌ Bypass go-odata for "convenience"
- ❌ Use gin/echo/chi routers for business logic

### Frontend: Reusable UI Components are MANDATORY

**⚠️ CRITICAL**: ALL UI elements MUST use components from `src/components/ui/` when available.

**See `frontend/COMPONENTS.md` for complete documentation and examples.**

**Quick Rules:**
1. **Use `<Button>`** instead of `<button className="btn">`
2. **Use `<Input>`** instead of `<input className="input">`
3. **Use `<Textarea>`** instead of `<textarea className="input">`
4. **Import from `@/components/ui`**: `import { Button, Input, Textarea } from '@/components/ui'`

### Frontend: Strict Color Scheme

**⚠️ MANDATORY**: NO custom colors are allowed in the frontend.

**Rules:**
1. **Only use predefined colors** from `tailwind.config.js`
2. **No inline styles** with color values
3. **No arbitrary values** like `bg-[#ff0000]`
4. **Always include dark mode** variants for all colors

**Predefined color categories:**
- `primary-*` (blue) - Main actions, branding
- `secondary-*` (purple) - Accents, secondary actions
- `success-*` (green) - Success states
- `warning-*` (orange) - Warnings, alerts
- `error-*` (red) - Errors, destructive actions
- `gray-*` - Text, backgrounds, borders

**Examples:**
```tsx
// ✅ GOOD - Using UI components
import { Button } from '@/components/ui'

<Button variant="primary">Save</Button>

<div className="text-gray-900 dark:text-gray-100">
  Content
</div>

// ❌ BAD - Custom colors
<button style={{ backgroundColor: '#3b82f6' }}>Save</button>
<div className="bg-[#1e40af]">Content</div>
<span style={{ color: 'blue' }}>Text</span>

// ❌ BAD - Not using UI components
<button className="btn btn-primary">Save</button>
```

**Dark mode is required:**
- All new components must support dark mode
- Use `dark:` prefix for dark mode variants
- Theme switching is handled by ThemeContext
- Test in both light and dark modes

## Project Architecture

### Backend Structure

```
backend/
├── cmd/server/       # Main application entry point
├── models/           # GORM models (Account, Contact, Issue)
├── database/         # Database connection, migrations, seeding
└── go.mod           # Go dependencies
```

**Current Entities:**
- **Account**: Companies/customers with contact info, address
- **Contact**: People linked to accounts (with primary contact flag)
- **Issue**: Support tickets with status, priority, assignments

**Database Models:**
- Use GORM tags for database schema
- Use OData tags for API behavior
- Include navigation properties for relationships
- Follow existing patterns in models/

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/        # Reusable UI components (Button, Input, Textarea) - MANDATORY
│   │   └── Layout.tsx # App layout with navigation
│   ├── contexts/      # React contexts (ThemeContext)
│   ├── lib/           # API client, utilities
│   ├── pages/         # Page components (Accounts, Contacts, Issues)
│   ├── types/         # TypeScript definitions
│   └── App.tsx        # Main app with routing
├── COMPONENTS.md      # Component library documentation (READ THIS!)
├── tailwind.config.js # Color scheme configuration
└── package.json
```

### Frontend: Reusable Component Library is MANDATORY

**⚠️ CRITICAL**: All UI components in `src/components/ui/` MUST be used throughout the application.

**Rules:**
1. **Use Button component**: For all buttons, use `<Button>` from `@/components/ui`
2. **Use Input component**: For all text inputs, use `<Input>` from `@/components/ui`
3. **Use Textarea component**: For all multi-line inputs, use `<Textarea>` from `@/components/ui`
4. **Read COMPONENTS.md**: Comprehensive documentation with examples: `frontend/COMPONENTS.md`
5. **No raw HTML elements**: Do not create `<button>`, `<input>`, or `<textarea>` with btn/input classes

**Why this matters:**
- Ensures consistent styling and behavior
- Simplifies maintenance and updates
- Supports dark mode automatically
- Provides TypeScript type safety
- Centralizes accessibility features

**Valid approaches:**
- ✅ Import from `@/components/ui`: `import { Button, Input } from '@/components/ui'`
- ✅ Use Button for actions: `<Button variant="primary" onClick={handleSave}>Save</Button>`
- ✅ Use Input with label: `<Input label="Email" type="email" name="email" />`
- ✅ Link styled as button: `<Link to="/path" className="btn btn-primary">Navigate</Link>`
- ❌ Raw button: `<button className="btn btn-primary">Save</button>`
- ❌ Raw input: `<input className="input" type="text" />`

## Common Tasks

### Adding a New Entity

**Backend:**
1. Create model in `backend/models/` following existing patterns
2. Add GORM and OData tags
3. Include navigation properties for relationships
4. Register in `database/database.go` AutoMigrate
5. Register with go-odata in `cmd/server/main.go`:
   ```go
   if err := service.RegisterEntity(&models.YourEntity{}); err != nil {
       log.Fatal("Failed to register YourEntity:", err)
   }
   ```

**Frontend:**
1. Add TypeScript type in `src/types/index.ts`
2. Create pages in `src/pages/YourEntity/`:
   - `YourEntityList.tsx` - List view
   - `YourEntityDetail.tsx` - Detail view
   - `YourEntityForm.tsx` - Create/edit form
3. Add routes in `src/App.tsx`
4. Add navigation link in `src/components/Layout.tsx`
5. Use predefined colors and include dark mode support

### Adding Custom Backend Logic

**Use OData Actions or Functions (NOT custom REST):**

**Actions** (for operations that modify state):
```go
service.RegisterAction(odata.ActionDefinition{
    Name:      "CloseIssue",
    IsBound:   true,
    EntitySet: "Issues",
    Parameters: []odata.ParameterDefinition{
        {Name: "resolution", Type: reflect.TypeOf(""), Required: true},
    },
    ReturnType: nil,
    Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
        issue := ctx.(*models.Issue)
        resolution := params["resolution"].(string)
        
        issue.Status = models.IssueStatusClosed
        issue.Resolution = resolution
        now := time.Now()
        issue.ResolvedAt = &now
        
        if err := db.Save(issue).Error; err != nil {
            return err
        }
        
        w.WriteHeader(http.StatusNoContent)
        return nil
    },
})
```

**Functions** (for read-only operations):
```go
service.RegisterFunction(odata.FunctionDefinition{
    Name:      "GetOpenIssuesCount",
    IsBound:   false,
    Parameters: []odata.ParameterDefinition{},
    ReturnType: reflect.TypeOf(int64(0)),
    Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) (interface{}, error) {
        var count int64
        db.Model(&models.Issue{}).
            Where("status != ?", models.IssueStatusClosed).
            Count(&count)
        return count, nil
    },
})
```

### Making API Calls from Frontend

Always use the configured API client:

```typescript
import api from '@/lib/api'

// List with query options
const response = await api.get('/Accounts?$expand=Contacts&$filter=Industry eq \'Technology\'')
const accounts = response.data.items

// Get single entity
const response = await api.get('/Accounts(1)?$expand=Contacts,Issues')
const account = response.data

// Create
await api.post('/Accounts', {
  Name: 'New Company',
  Industry: 'Technology',
  Email: 'contact@example.com',
})

// Update (PATCH)
await api.patch('/Accounts(1)', {
  Phone: '+1-555-0123',
})

// Delete
await api.delete('/Accounts(1)')

// Call action
await api.post('/Issues(1)/CloseIssue', {
  resolution: 'Fixed the bug'
})

// Call function
const response = await api.get('/GetOpenIssuesCount()')
const count = response.data.value
```

## OData v4 Reference

### Query Options

- `$filter` - Filter results: `$filter=Status eq 'New'`
- `$select` - Choose fields: `$select=Name,Email`
- `$expand` - Include relations: `$expand=Contacts,Issues`
- `$orderby` - Sort: `$orderby=Name desc`
- `$top` - Limit: `$top=10`
- `$skip` - Offset: `$skip=20`
- `$count` - Include total: `$count=true`
- `$search` - Full-text: `$search=technology`

### Filter Operators

- Comparison: `eq`, `ne`, `gt`, `ge`, `lt`, `le`
- Logical: `and`, `or`, `not`
- String: `contains`, `startswith`, `endswith`
- Collections: `any`, `all`

### Entity Addressing

- Collection: `/Accounts`
- Single entity: `/Accounts(1)`
- Property: `/Accounts(1)/Name`
- Navigation: `/Accounts(1)/Contacts`

## Styling Guidelines

### UI Components (MANDATORY)

**Use the reusable components from `@/components/ui`. See `frontend/COMPONENTS.md` for full documentation.**

```tsx
import { Button, Input, Textarea } from '@/components/ui'

// Buttons - Use Button component
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Delete</Button>

// Cards
<div className="card p-6">
  Card content
</div>

// Forms - Use Input/Textarea components
<Input label="Field Name" name="field" value={value} onChange={handleChange} />
<Textarea label="Description" name="description" rows={4} value={value} onChange={handleChange} />

// Badges
<span className="badge badge-primary">New</span>
<span className="badge badge-success">Resolved</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Critical</span>
```

### Dark Mode Pattern

Always include dark mode for colors:

```tsx
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-100">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
  <div className="border border-gray-200 dark:border-gray-800">
    Content
  </div>
</div>
```

## Development Workflow

### Before Making Changes

1. **Check existing patterns** in similar files
2. **For backend**: Verify go-odata supports what you need
3. **For frontend**: Confirm colors exist in theme
4. **Read related code** to understand context

### When You're Stuck

**Backend - if go-odata doesn't support something:**
1. STOP - do not implement workaround
2. Tell the user: "I need to implement [feature] but go-odata doesn't support [specific capability]"
3. Explain what you tried to find in the library
4. Ask: "Should I report this as a missing feature, or is there an OData v4 compliant way to achieve this?"

**Frontend - if you need a color that doesn't exist:**
1. Check if an existing color can work
2. If not, tell the user: "I need a [description] color for [purpose], but it's not in the theme"
3. Suggest adding it to the theme configuration
4. Wait for user to update `tailwind.config.js`

### Testing Changes

**Backend:**
```bash
cd /workspace/backend
go run cmd/server/main.go
```
Test endpoints:
- Service document: `http://localhost:8080/`
- Metadata: `http://localhost:8080/$metadata`
- Entities: `http://localhost:8080/Accounts`

**Frontend:**
```bash
cd /workspace/frontend
npm run dev
```
Test in browser:
- Light mode: Check all colors
- Dark mode: Toggle theme and verify
- Responsive: Test mobile and desktop

## Common Pitfalls

### Backend

❌ **Don't:**
- Create REST endpoints outside go-odata
- Use gin/echo/chi for business logic routes
- Implement custom JSON serialization
- Skip OData tags on models
- Ignore navigation properties

✅ **Do:**
- Use go-odata for all APIs
- Follow OData v4 specification
- Use RegisterEntity, RegisterAction, RegisterFunction
- Include proper GORM and OData tags
- Test with OData query options

### Frontend

❌ **Don't:**
- Use custom color values
- Forget dark mode variants
- Skip TypeScript types
- Ignore React Query patterns
- Create custom API clients

✅ **Do:**
- Use predefined theme colors
- Include dark: variants for all colors
- Define proper TypeScript types
- Use React Query for data fetching
- Use the configured api client

## Resources

- **go-odata**: https://github.com/NLstn/go-odata
- **OData v4 Spec**: https://www.odata.org/documentation/
- **GORM**: https://gorm.io/docs/
- **React Query**: https://tanstack.com/query/latest
- **TailwindCSS**: https://tailwindcss.com/docs
- **Playwright MCP**: https://github.com/microsoft/playwright-mcp (see MCP_PLAYWRIGHT.md)

## Testing with Playwright MCP

This repository includes Playwright MCP server configuration for AI-driven browser automation:

- **Configuration**: `.mcp/settings.json`
- **Documentation**: `MCP_PLAYWRIGHT.md`
- **Use cases**: Navigate pages, test functionality, take screenshots, verify UI

When testing or verifying web functionality, AI agents can use the Playwright MCP tools to interact with the running application at `http://localhost:5173`.

## Questions?

When in doubt:
1. **Look at existing code** for patterns
2. **Check documentation** for libraries
3. **Ask the user** before making assumptions
4. **Report limitations** rather than work around them

Remember: This project values **consistency**, **standards compliance**, and **maintainability** over quick hacks.
