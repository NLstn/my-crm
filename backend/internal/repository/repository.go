package repository

import (
	"context"
	"database/sql"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/my-crm/backend/internal/domain"
)

// ErrNotFound is returned when a record cannot be located.
var ErrNotFound = errors.New("record not found")

// Repository defines the operations required by the HTTP layer.
type Repository interface {
	ListAccounts(ctx context.Context) ([]domain.Account, error)
	CreateAccount(ctx context.Context, input CreateAccountInput) (domain.Account, error)
	GetAccount(ctx context.Context, id string) (domain.Account, error)

	ListContacts(ctx context.Context, accountID string) ([]domain.Contact, error)
	CreateContact(ctx context.Context, input CreateContactInput) (domain.Contact, error)

	ListTickets(ctx context.Context, accountID string) ([]domain.Ticket, error)
	CreateTicket(ctx context.Context, input CreateTicketInput) (domain.Ticket, error)
}

// CreateAccountInput captures the data needed to create an account.
type CreateAccountInput struct {
	Name     string
	Industry string
}

// CreateContactInput captures data needed to create a contact.
type CreateContactInput struct {
	AccountID string
	FullName  string
	Email     string
}

// CreateTicketInput captures data needed to create a ticket.
type CreateTicketInput struct {
	AccountID string
	Title     string
	Status    string
}

// MemoryRepository provides an in-memory implementation suitable for tests and development.
type MemoryRepository struct {
	mu       sync.RWMutex
	accounts map[string]domain.Account
	contacts map[string]domain.Contact
	tickets  map[string]domain.Ticket
}

// NewMemoryRepository seeds the in-memory repository with optional fixtures.
func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		accounts: make(map[string]domain.Account),
		contacts: make(map[string]domain.Contact),
		tickets:  make(map[string]domain.Ticket),
	}
}

func (r *MemoryRepository) ListAccounts(_ context.Context) ([]domain.Account, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	res := make([]domain.Account, 0, len(r.accounts))
	for _, account := range r.accounts {
		res = append(res, account)
	}

	return res, nil
}

func (r *MemoryRepository) CreateAccount(_ context.Context, input CreateAccountInput) (domain.Account, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now().UTC()
	account := domain.Account{
		ID:        uuid.NewString(),
		Name:      input.Name,
		Industry:  input.Industry,
		CreatedAt: now,
		UpdatedAt: now,
	}

	r.accounts[account.ID] = account
	return account, nil
}

func (r *MemoryRepository) GetAccount(_ context.Context, id string) (domain.Account, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	account, ok := r.accounts[id]
	if !ok {
		return domain.Account{}, ErrNotFound
	}

	return account, nil
}

func (r *MemoryRepository) ListContacts(_ context.Context, accountID string) ([]domain.Contact, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if _, ok := r.accounts[accountID]; !ok {
		return nil, ErrNotFound
	}

	res := make([]domain.Contact, 0)
	for _, contact := range r.contacts {
		if contact.AccountID == accountID {
			res = append(res, contact)
		}
	}

	return res, nil
}

func (r *MemoryRepository) CreateContact(_ context.Context, input CreateContactInput) (domain.Contact, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.accounts[input.AccountID]; !ok {
		return domain.Contact{}, ErrNotFound
	}

	now := time.Now().UTC()
	contact := domain.Contact{
		ID:        uuid.NewString(),
		AccountID: input.AccountID,
		FullName:  input.FullName,
		Email:     input.Email,
		CreatedAt: now,
		UpdatedAt: now,
	}

	r.contacts[contact.ID] = contact
	return contact, nil
}

func (r *MemoryRepository) ListTickets(_ context.Context, accountID string) ([]domain.Ticket, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if _, ok := r.accounts[accountID]; !ok {
		return nil, ErrNotFound
	}

	res := make([]domain.Ticket, 0)
	for _, ticket := range r.tickets {
		if ticket.AccountID == accountID {
			res = append(res, ticket)
		}
	}

	return res, nil
}

func (r *MemoryRepository) CreateTicket(_ context.Context, input CreateTicketInput) (domain.Ticket, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.accounts[input.AccountID]; !ok {
		return domain.Ticket{}, ErrNotFound
	}

	now := time.Now().UTC()
	status := input.Status
	if status == "" {
		status = "open"
	}
	ticket := domain.Ticket{
		ID:        uuid.NewString(),
		AccountID: input.AccountID,
		Title:     input.Title,
		Status:    status,
		CreatedAt: now,
		UpdatedAt: now,
	}

	r.tickets[ticket.ID] = ticket
	return ticket, nil
}

// PostgresRepository is a database-backed implementation that can be wired once migrations are applied.
type PostgresRepository struct {
	db *sql.DB
}

// NewPostgresRepository returns a repository backed by PostgreSQL.
func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) ListAccounts(ctx context.Context) ([]domain.Account, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, industry, created_at, updated_at FROM accounts ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []domain.Account
	for rows.Next() {
		var acc domain.Account
		if err := rows.Scan(&acc.ID, &acc.Name, &acc.Industry, &acc.CreatedAt, &acc.UpdatedAt); err != nil {
			return nil, err
		}
		accounts = append(accounts, acc)
	}

	return accounts, rows.Err()
}

func (r *PostgresRepository) CreateAccount(ctx context.Context, input CreateAccountInput) (domain.Account, error) {
	now := time.Now().UTC()
	id := uuid.NewString()
	_, err := r.db.ExecContext(
		ctx,
		`INSERT INTO accounts (id, name, industry, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
		id, input.Name, input.Industry, now, now,
	)
	if err != nil {
		return domain.Account{}, err
	}

	return domain.Account{ID: id, Name: input.Name, Industry: input.Industry, CreatedAt: now, UpdatedAt: now}, nil
}

func (r *PostgresRepository) GetAccount(ctx context.Context, id string) (domain.Account, error) {
	var acc domain.Account
	err := r.db.QueryRowContext(ctx, `SELECT id, name, industry, created_at, updated_at FROM accounts WHERE id = $1`, id).
		Scan(&acc.ID, &acc.Name, &acc.Industry, &acc.CreatedAt, &acc.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Account{}, ErrNotFound
	}
	if err != nil {
		return domain.Account{}, err
	}

	return acc, nil
}

func (r *PostgresRepository) ListContacts(ctx context.Context, accountID string) ([]domain.Contact, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, account_id, full_name, email, created_at, updated_at FROM contacts WHERE account_id = $1 ORDER BY created_at DESC`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []domain.Contact
	for rows.Next() {
		var contact domain.Contact
		if err := rows.Scan(&contact.ID, &contact.AccountID, &contact.FullName, &contact.Email, &contact.CreatedAt, &contact.UpdatedAt); err != nil {
			return nil, err
		}
		contacts = append(contacts, contact)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(contacts) == 0 {
		// Ensure the account exists to distinguish between "no contacts" and "missing account"
		if _, err := r.GetAccount(ctx, accountID); err != nil {
			return nil, err
		}
	}

	return contacts, nil
}

func (r *PostgresRepository) CreateContact(ctx context.Context, input CreateContactInput) (domain.Contact, error) {
	if _, err := r.GetAccount(ctx, input.AccountID); err != nil {
		return domain.Contact{}, err
	}

	now := time.Now().UTC()
	id := uuid.NewString()
	_, err := r.db.ExecContext(
		ctx,
		`INSERT INTO contacts (id, account_id, full_name, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		id, input.AccountID, input.FullName, input.Email, now, now,
	)
	if err != nil {
		return domain.Contact{}, err
	}

	return domain.Contact{ID: id, AccountID: input.AccountID, FullName: input.FullName, Email: input.Email, CreatedAt: now, UpdatedAt: now}, nil
}

func (r *PostgresRepository) ListTickets(ctx context.Context, accountID string) ([]domain.Ticket, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, account_id, title, status, created_at, updated_at FROM tickets WHERE account_id = $1 ORDER BY created_at DESC`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tickets []domain.Ticket
	for rows.Next() {
		var ticket domain.Ticket
		if err := rows.Scan(&ticket.ID, &ticket.AccountID, &ticket.Title, &ticket.Status, &ticket.CreatedAt, &ticket.UpdatedAt); err != nil {
			return nil, err
		}
		tickets = append(tickets, ticket)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(tickets) == 0 {
		if _, err := r.GetAccount(ctx, accountID); err != nil {
			return nil, err
		}
	}

	return tickets, nil
}

func (r *PostgresRepository) CreateTicket(ctx context.Context, input CreateTicketInput) (domain.Ticket, error) {
	if _, err := r.GetAccount(ctx, input.AccountID); err != nil {
		return domain.Ticket{}, err
	}

	now := time.Now().UTC()
	id := uuid.NewString()
	status := input.Status
	if status == "" {
		status = "open"
	}
	_, err := r.db.ExecContext(
		ctx,
		`INSERT INTO tickets (id, account_id, title, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		id, input.AccountID, input.Title, status, now, now,
	)
	if err != nil {
		return domain.Ticket{}, err
	}

	return domain.Ticket{ID: id, AccountID: input.AccountID, Title: input.Title, Status: status, CreatedAt: now, UpdatedAt: now}, nil
}
