package repository

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/my-crm/backend/internal/domain"
)

// ErrNotFound is returned when a record cannot be located.
var ErrNotFound = errors.New("record not found")

// Repository defines the operations required by the HTTP layer.
type Repository interface {
	GetAccount(ctx context.Context, id string) (domain.Account, error)
	CreateAccount(ctx context.Context, input CreateAccountInput) (domain.Account, error)
	SearchAccounts(ctx context.Context, query string) ([]domain.Account, error)

	GetContactsByAccount(ctx context.Context, accountID string) ([]domain.Contact, error)
	CreateContact(ctx context.Context, input CreateContactInput) (domain.Contact, error)
	SearchContacts(ctx context.Context, query string) ([]domain.Contact, error)

	GetTicketsByAccount(ctx context.Context, accountID string) ([]domain.Ticket, error)
	CreateTicket(ctx context.Context, input CreateTicketInput) (domain.Ticket, error)
	UpdateTicketStatus(ctx context.Context, ticketID string, status string) (domain.Ticket, error)
}

// CreateAccountInput captures the data needed to create an account.
type CreateAccountInput struct {
	Name     string
	Industry string
}

// CreateContactInput captures the data needed to create a contact.
type CreateContactInput struct {
	AccountID string
	FullName  string
	Email     string
}

// CreateTicketInput captures the data needed to create a ticket.
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

func (r *MemoryRepository) CreateAccount(_ context.Context, input CreateAccountInput) (domain.Account, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now().UTC()
	// Generate a simple numeric displayId based on the number of accounts
	displayId := len(r.accounts) + 1
	account := domain.Account{
		ID:        uuid.NewString(),
		DisplayID: displayId,
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

func (r *MemoryRepository) SearchAccounts(_ context.Context, query string) ([]domain.Account, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	res := make([]domain.Account, 0)

	// If query is empty, return all accounts
	if query == "" {
		for _, account := range r.accounts {
			res = append(res, account)
		}
		return res, nil
	}

	// Simple case-insensitive search in name, industry, and displayId
	queryLower := toLower(query)
	for _, account := range r.accounts {
		// Convert displayId to string for search comparison
		displayIdStr := intToString(account.DisplayID)
		if contains(toLower(account.Name), queryLower) ||
			contains(toLower(account.Industry), queryLower) ||
			contains(displayIdStr, queryLower) {
			res = append(res, account)
		}
	}

	return res, nil
}

func toLower(s string) string {
	// Simple ASCII lowercase conversion
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			result[i] = c + 32
		} else {
			result[i] = c
		}
	}
	return string(result)
}

func contains(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	if len(s) < len(substr) {
		return false
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if s[i+j] != substr[j] {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func intToString(num int) string {
	if num == 0 {
		return "0"
	}
	str := ""
	for num > 0 {
		str = string(rune('0'+(num%10))) + str
		num /= 10
	}
	return str
}

func (r *MemoryRepository) GetContactsByAccount(_ context.Context, accountID string) ([]domain.Contact, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

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

func (r *MemoryRepository) SearchContacts(_ context.Context, query string) ([]domain.Contact, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	res := make([]domain.Contact, 0)

	// If query is empty, return all contacts
	if query == "" {
		for _, contact := range r.contacts {
			res = append(res, contact)
		}
		return res, nil
	}

	// Simple case-insensitive search in fullName and email
	queryLower := toLower(query)
	for _, contact := range r.contacts {
		if contains(toLower(contact.FullName), queryLower) ||
			contains(toLower(contact.Email), queryLower) {
			res = append(res, contact)
		}
	}

	return res, nil
}

func (r *MemoryRepository) GetTicketsByAccount(_ context.Context, accountID string) ([]domain.Ticket, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

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

	now := time.Now().UTC()
	ticket := domain.Ticket{
		ID:        uuid.NewString(),
		AccountID: input.AccountID,
		Title:     input.Title,
		Status:    input.Status,
		CreatedAt: now,
		UpdatedAt: now,
	}

	r.tickets[ticket.ID] = ticket
	return ticket, nil
}

func (r *MemoryRepository) UpdateTicketStatus(_ context.Context, ticketID string, status string) (domain.Ticket, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	ticket, ok := r.tickets[ticketID]
	if !ok {
		return domain.Ticket{}, ErrNotFound
	}

	ticket.Status = status
	ticket.UpdatedAt = time.Now().UTC()
	r.tickets[ticketID] = ticket

	return ticket, nil
}

// PostgresRepository is a database-backed implementation using GORM.
type PostgresRepository struct {
	db *gorm.DB
}

// NewPostgresRepository returns a repository backed by PostgreSQL using GORM.
func NewPostgresRepository(db *gorm.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) CreateAccount(ctx context.Context, input CreateAccountInput) (domain.Account, error) {
	// Get the next display ID by counting existing accounts
	var count int64
	if err := r.db.WithContext(ctx).Model(&domain.Account{}).Count(&count).Error; err != nil {
		return domain.Account{}, err
	}

	account := domain.Account{
		ID:        uuid.NewString(),
		DisplayID: int(count) + 1,
		Name:      input.Name,
		Industry:  input.Industry,
	}

	if err := r.db.WithContext(ctx).Create(&account).Error; err != nil {
		return domain.Account{}, err
	}

	return account, nil
}

func (r *PostgresRepository) GetAccount(ctx context.Context, id string) (domain.Account, error) {
	var account domain.Account

	if err := r.db.WithContext(ctx).First(&account, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.Account{}, ErrNotFound
		}
		return domain.Account{}, err
	}

	return account, nil
}

func (r *PostgresRepository) SearchAccounts(ctx context.Context, query string) ([]domain.Account, error) {
	var accounts []domain.Account

	db := r.db.WithContext(ctx)

	if query == "" {
		// Return all accounts when no query provided
		if err := db.Order("created_at DESC").Find(&accounts).Error; err != nil {
			return nil, err
		}
	} else {
		// Search in name and industry fields using LOWER for database-agnostic case-insensitive matching
		searchPattern := "%" + query + "%"
		if err := db.Where("LOWER(name) LIKE LOWER(?) OR LOWER(industry) LIKE LOWER(?)", searchPattern, searchPattern).
			Order("created_at DESC").
			Find(&accounts).Error; err != nil {
			return nil, err
		}
	}

	return accounts, nil
}

func (r *PostgresRepository) GetContactsByAccount(ctx context.Context, accountID string) ([]domain.Contact, error) {
	var contacts []domain.Contact

	if err := r.db.WithContext(ctx).Where("account_id = ?", accountID).Order("created_at DESC").Find(&contacts).Error; err != nil {
		return nil, err
	}

	return contacts, nil
}

func (r *PostgresRepository) CreateContact(ctx context.Context, input CreateContactInput) (domain.Contact, error) {
	contact := domain.Contact{
		ID:        uuid.NewString(),
		AccountID: input.AccountID,
		FullName:  input.FullName,
		Email:     input.Email,
	}

	if err := r.db.WithContext(ctx).Create(&contact).Error; err != nil {
		return domain.Contact{}, err
	}

	return contact, nil
}

func (r *PostgresRepository) SearchContacts(ctx context.Context, query string) ([]domain.Contact, error) {
	var contacts []domain.Contact

	db := r.db.WithContext(ctx)

	if query == "" {
		// Return all contacts when no query provided
		if err := db.Order("created_at DESC").Find(&contacts).Error; err != nil {
			return nil, err
		}
	} else {
		// Search in full_name and email fields using LOWER for database-agnostic case-insensitive matching
		searchPattern := "%" + query + "%"
		if err := db.Where("LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?)", searchPattern, searchPattern).
			Order("created_at DESC").
			Find(&contacts).Error; err != nil {
			return nil, err
		}
	}

	return contacts, nil
}

func (r *PostgresRepository) GetTicketsByAccount(ctx context.Context, accountID string) ([]domain.Ticket, error) {
	var tickets []domain.Ticket

	if err := r.db.WithContext(ctx).Where("account_id = ?", accountID).Order("created_at DESC").Find(&tickets).Error; err != nil {
		return nil, err
	}

	return tickets, nil
}

func (r *PostgresRepository) CreateTicket(ctx context.Context, input CreateTicketInput) (domain.Ticket, error) {
	ticket := domain.Ticket{
		ID:        uuid.NewString(),
		AccountID: input.AccountID,
		Title:     input.Title,
		Status:    input.Status,
	}

	if err := r.db.WithContext(ctx).Create(&ticket).Error; err != nil {
		return domain.Ticket{}, err
	}

	return ticket, nil
}

func (r *PostgresRepository) UpdateTicketStatus(ctx context.Context, ticketID string, status string) (domain.Ticket, error) {
	var ticket domain.Ticket

	if err := r.db.WithContext(ctx).First(&ticket, "id = ?", ticketID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.Ticket{}, ErrNotFound
		}
		return domain.Ticket{}, err
	}

	ticket.Status = status
	if err := r.db.WithContext(ctx).Save(&ticket).Error; err != nil {
		return domain.Ticket{}, err
	}

	return ticket, nil
}
