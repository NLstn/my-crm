package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/nlstn/my-crm/backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect establishes a connection to the PostgreSQL database
func Connect() (*gorm.DB, error) {
	host := getEnv("POSTGRES_HOST", "localhost")
	port := getEnv("POSTGRES_PORT", "5432")
	user := getEnv("POSTGRES_USER", "crmuser")
	password := getEnv("POSTGRES_PASSWORD", "crmpassword")
	dbname := getEnv("POSTGRES_DB", "crm")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		host, user, password, dbname, port)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL database")
	return db, nil
}

// AutoMigrate runs automatic migrations for all models
func AutoMigrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&models.Account{},
		&models.Contact{},
		&models.Issue{},
		&models.Employee{},
	)

	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// SeedData populates the database with initial sample data
func SeedData(db *gorm.DB) error {
	// Check if data already exists
	var count int64
	db.Model(&models.Account{}).Count(&count)
	if count > 0 {
		log.Println("Database already contains data, skipping seed")
		return nil
	}

	log.Println("Seeding database with sample data...")

	// Create sample accounts
	accounts := []models.Account{
		{
			Name:        "Acme Corporation",
			Industry:    "Technology",
			Website:     "https://acme.example.com",
			Phone:       "+1-555-0100",
			Email:       "contact@acme.example.com",
			Address:     "123 Tech Street",
			City:        "San Francisco",
			State:       "CA",
			Country:     "USA",
			PostalCode:  "94105",
			Description: "Leading technology solutions provider",
		},
		{
			Name:        "Global Industries Inc",
			Industry:    "Manufacturing",
			Website:     "https://globalindustries.example.com",
			Phone:       "+1-555-0200",
			Email:       "info@globalindustries.example.com",
			Address:     "456 Industrial Blvd",
			City:        "Detroit",
			State:       "MI",
			Country:     "USA",
			PostalCode:  "48201",
			Description: "International manufacturing company",
		},
		{
			Name:        "Retail Masters Ltd",
			Industry:    "Retail",
			Website:     "https://retailmasters.example.com",
			Phone:       "+1-555-0300",
			Email:       "support@retailmasters.example.com",
			Address:     "789 Commerce Ave",
			City:        "New York",
			State:       "NY",
			Country:     "USA",
			PostalCode:  "10001",
			Description: "Premier retail solutions company",
		},
	}

	for i := range accounts {
		if err := db.Create(&accounts[i]).Error; err != nil {
			return fmt.Errorf("failed to create account: %w", err)
		}
	}

	// Create sample contacts
	contacts := []models.Contact{
		{
			AccountID: accounts[0].ID,
			FirstName: "John",
			LastName:  "Smith",
			Title:     "CTO",
			Email:     "john.smith@acme.example.com",
			Phone:     "+1-555-0101",
			Mobile:    "+1-555-0102",
			IsPrimary: true,
			Notes:     "Primary technical contact",
		},
		{
			AccountID: accounts[0].ID,
			FirstName: "Sarah",
			LastName:  "Johnson",
			Title:     "VP of Engineering",
			Email:     "sarah.johnson@acme.example.com",
			Phone:     "+1-555-0103",
			IsPrimary: false,
		},
		{
			AccountID: accounts[1].ID,
			FirstName: "Michael",
			LastName:  "Brown",
			Title:     "Operations Manager",
			Email:     "michael.brown@globalindustries.example.com",
			Phone:     "+1-555-0201",
			IsPrimary: true,
		},
		{
			AccountID: accounts[2].ID,
			FirstName: "Emily",
			LastName:  "Davis",
			Title:     "Director of Sales",
			Email:     "emily.davis@retailmasters.example.com",
			Phone:     "+1-555-0301",
			Mobile:    "+1-555-0302",
			IsPrimary: true,
		},
	}

	for i := range contacts {
		if err := db.Create(&contacts[i]).Error; err != nil {
			return fmt.Errorf("failed to create contact: %w", err)
		}
	}

	// Create sample issues
	issues := []models.Issue{
		{
			AccountID:   accounts[0].ID,
			ContactID:   &contacts[0].ID,
			Title:       "System integration issue",
			Description: "Need help integrating our API with your platform",
			Status:      models.IssueStatusInProgress,
			Priority:    models.IssuePriorityHigh,
			AssignedTo:  "Tech Support Team",
		},
		{
			AccountID:   accounts[0].ID,
			Title:       "Feature request: Custom reporting",
			Description: "Would like to see custom reporting capabilities",
			Status:      models.IssueStatusNew,
			Priority:    models.IssuePriorityMedium,
		},
		{
			AccountID:   accounts[1].ID,
			ContactID:   &contacts[2].ID,
			Title:       "Performance optimization needed",
			Description: "System is running slower than expected during peak hours",
			Status:      models.IssueStatusInProgress,
			Priority:    models.IssuePriorityCritical,
			AssignedTo:  "Engineering Team",
		},
		{
			AccountID:   accounts[2].ID,
			ContactID:   &contacts[3].ID,
			Title:       "Training request",
			Description: "Need training session for new team members",
			Status:      models.IssueStatusNew,
			Priority:    models.IssuePriorityLow,
		},
	}

	for i := range issues {
		if err := db.Create(&issues[i]).Error; err != nil {
			return fmt.Errorf("failed to create issue: %w", err)
		}
	}

	// Create sample employees
	hireDate1 := time.Date(2020, 5, 15, 0, 0, 0, 0, time.UTC)
	hireDate2 := time.Date(2019, 3, 10, 0, 0, 0, 0, time.UTC)
	hireDate3 := time.Date(2021, 8, 1, 0, 0, 0, 0, time.UTC)

	employees := []models.Employee{
		{
			FirstName:  "Alice",
			LastName:   "Johnson",
			Email:      "alice.johnson@company.com",
			Phone:      "+1-555-1001",
			Department: "Sales",
			Position:   "Sales Manager",
			HireDate:   &hireDate1,
			Notes:      "Leads the sales team",
		},
		{
			FirstName:  "Bob",
			LastName:   "Williams",
			Email:      "bob.williams@company.com",
			Phone:      "+1-555-1002",
			Department: "Engineering",
			Position:   "Senior Developer",
			HireDate:   &hireDate2,
			Notes:      "Full-stack developer",
		},
		{
			FirstName:  "Carol",
			LastName:   "Martinez",
			Email:      "carol.martinez@company.com",
			Phone:      "+1-555-1003",
			Department: "Support",
			Position:   "Support Specialist",
			HireDate:   &hireDate3,
			Notes:      "Handles customer support",
		},
	}

	for i := range employees {
		if err := db.Create(&employees[i]).Error; err != nil {
			return fmt.Errorf("failed to create employee: %w", err)
		}
	}

	log.Println("Database seeding completed successfully")
	return nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
