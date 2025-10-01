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
}

// CreateAccountInput captures the data needed to create an account.
type CreateAccountInput struct {
	Name     string
	Industry string
}

// MemoryRepository provides an in-memory implementation suitable for tests and development.
type MemoryRepository struct {
	mu       sync.RWMutex
	accounts map[string]domain.Account
}

// NewMemoryRepository seeds the in-memory repository with optional fixtures.
func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		accounts: make(map[string]domain.Account),
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
		// Search in name, industry, and displayId fields using ILIKE for case-insensitive matching
		searchPattern := "%" + query + "%"
		if err := db.Where("name ILIKE ? OR industry ILIKE ? OR display_id ILIKE ?", searchPattern, searchPattern, searchPattern).
			Order("created_at DESC").
			Find(&accounts).Error; err != nil {
			return nil, err
		}
	}

	return accounts, nil
}
