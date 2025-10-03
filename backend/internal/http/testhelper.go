package api

import (
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/my-crm/backend/internal/domain"
	"github.com/my-crm/backend/internal/repository"
)

// setupTestDB creates an in-memory SQLite database for testing.
// It automatically migrates all domain models and returns a repository backed by SQLite.
func setupTestDB(t *testing.T) repository.Repository {
	t.Helper()

	// Create in-memory SQLite database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(
		&domain.Account{},
		&domain.Contact{},
		&domain.Ticket{},
		&domain.Employee{},
	); err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	return repository.NewPostgresRepository(db)
}
