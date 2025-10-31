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
		&models.Product{},
		&models.Opportunity{},
		&models.Activity{},
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

	// Create 20 employees
	firstNames := []string{"Alice", "Bob", "Carol", "David", "Emma", "Frank", "Grace", "Henry", "Iris", "Jack", "Kate", "Liam", "Maya", "Noah", "Olivia", "Paul", "Quinn", "Rachel", "Sam", "Tina"}
	lastNames := []string{"Johnson", "Williams", "Martinez", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Robinson", "Clark", "Rodriguez"}
	departments := []string{"Sales", "Engineering", "Support", "Marketing", "Finance", "HR", "Operations", "Product", "Legal", "IT"}
	positions := []string{"Manager", "Senior Developer", "Specialist", "Director", "Analyst", "Coordinator", "Lead", "Associate", "Consultant", "Engineer"}

	employees := make([]models.Employee, 20)
	for i := 0; i < 20; i++ {
		hireDate := time.Date(2018+i%5, time.Month(1+(i%12)), 1+(i%28), 0, 0, 0, 0, time.UTC)
		employees[i] = models.Employee{
			FirstName:  firstNames[i],
			LastName:   lastNames[i],
			Email:      fmt.Sprintf("%s.%s@company.com", firstNames[i], lastNames[i]),
			Phone:      fmt.Sprintf("+1-555-%04d", 1001+i),
			Department: departments[i%len(departments)],
			Position:   positions[i%len(positions)],
			HireDate:   &hireDate,
			Notes:      fmt.Sprintf("Employee %d", i+1),
		}
	}

	if err := db.Create(&employees).Error; err != nil {
		return fmt.Errorf("failed to create employees: %w", err)
	}

	// Create 30 accounts
	accountNames := []string{"Acme Corporation", "Global Industries Inc", "Retail Masters Ltd", "Tech Innovations LLC", "Green Energy Solutions",
		"Medical Services Group", "Financial Advisors Inc", "Education Systems", "Transport Logistics", "Food Services Co",
		"Manufacturing Plus", "Software Systems", "Consulting Group", "Marketing Agency", "Real Estate Partners",
		"Construction Corp", "Telecom Services", "Insurance Providers", "Legal Associates", "Entertainment Media",
		"Fitness Centers", "Automotive Group", "Aerospace Technologies", "Pharmaceutical Labs", "Agriculture Corp",
		"Hospitality Services", "Fashion Retail", "Publishing House", "Security Systems", "Environmental Solutions"}
	accountDomains := []string{"acme", "globalindustries", "retailmasters", "techinnovations", "greenenergy",
		"medicalservices", "financialadvisors", "educationsystems", "transportlogistics", "foodservices",
		"manufacturingplus", "softwaresystems", "consultinggroup", "marketingagency", "realestatepartners",
		"constructioncorp", "telecomservices", "insuranceproviders", "legalassociates", "entertainmentmedia",
		"fitnesscenters", "automotivegroup", "aerospacetechnologies", "pharmalabs", "agriculturecorp",
		"hospitalityservices", "fashionretail", "publishinghouse", "securitysystems", "environmentalsolutions"}
	industries := []string{"Technology", "Manufacturing", "Retail", "Healthcare", "Finance", "Education", "Logistics", "Food & Beverage", "Consulting", "Marketing"}
	cities := []string{"San Francisco", "Detroit", "New York", "Austin", "Seattle", "Boston", "Chicago", "Denver", "Atlanta", "Los Angeles"}
	states := []string{"CA", "MI", "NY", "TX", "WA", "MA", "IL", "CO", "GA", "FL"}

	accounts := make([]models.Account, 30)
	for i := 0; i < 30; i++ {
		accounts[i] = models.Account{
			Name:        accountNames[i],
			Industry:    industries[i%len(industries)],
			Website:     fmt.Sprintf("https://%s.example.com", accountDomains[i]),
			Phone:       fmt.Sprintf("+1-555-%04d", 100+i*10),
			Email:       fmt.Sprintf("contact@%s.example.com", accountDomains[i]),
			Address:     fmt.Sprintf("%d Business Street", 100+i*10),
			City:        cities[i%len(cities)],
			State:       states[i%len(states)],
			Country:     "USA",
			PostalCode:  fmt.Sprintf("%05d", 10000+i*100),
			Description: fmt.Sprintf("Account for %s", accountNames[i]),
			EmployeeID:  &employees[i%len(employees)].ID,
		}
	}

	for i := range accounts {
		if err := db.Create(&accounts[i]).Error; err != nil {
			return fmt.Errorf("failed to create account: %w", err)
		}
	}

	// Create at least 1 contact per account (40 contacts total)
	contactFirstNames := []string{"John", "Sarah", "Michael", "Emily", "James", "Patricia", "Robert", "Jennifer", "William", "Linda",
		"Richard", "Barbara", "Joseph", "Susan", "Thomas", "Jessica", "Charles", "Karen", "Christopher", "Nancy",
		"Daniel", "Betty", "Matthew", "Helen", "Donald", "Margaret", "Mark", "Ruth", "Paul", "Sharon",
		"George", "Michelle", "Kenneth", "Laura", "Steven", "Sandra", "Edward", "Donna", "Brian", "Carol"}
	contactLastNames := []string{"Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas",
		"Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez",
		"Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Lopez", "Hill",
		"Scott", "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner"}
	titles := []string{"CTO", "VP of Engineering", "Operations Manager", "Director of Sales", "CEO", "CFO", "COO", "President", "Manager", "Director"}

	contacts := make([]models.Contact, 40)
	for i := 0; i < 40; i++ {
		accountIndex := i % 30 // Ensure at least 1 contact per account
		isPrimary := i < 30    // First contact for each account is primary
		contacts[i] = models.Contact{
			AccountID: accounts[accountIndex].ID,
			FirstName: contactFirstNames[i],
			LastName:  contactLastNames[i],
			Title:     titles[i%len(titles)],
			Email:     fmt.Sprintf("%s.%s@%s.example.com", contactFirstNames[i], contactLastNames[i], accountDomains[accountIndex]),
			Phone:     fmt.Sprintf("+1-555-%04d", 2000+i),
			Mobile:    fmt.Sprintf("+1-555-%04d", 3000+i),
			IsPrimary: isPrimary,
			Notes:     fmt.Sprintf("Contact %d for %s", i+1, accountNames[accountIndex]),
		}
	}

	for i := range contacts {
		if err := db.Create(&contacts[i]).Error; err != nil {
			return fmt.Errorf("failed to create contact: %w", err)
		}
	}

	// Create 80 issues (tickets)
	issueTitles := []string{"System integration issue", "Feature request", "Performance optimization needed", "Training request",
		"Bug report", "Data migration", "Security concern", "API documentation update", "UI improvement", "Database backup issue",
		"Network connectivity", "Software update", "Hardware replacement", "User account setup", "Email configuration",
		"Report generation", "Dashboard customization", "Mobile app issue", "Payment processing", "Invoice generation",
		"Data export", "User permissions", "System backup", "Server maintenance", "Load balancing",
		"SSL certificate", "DNS configuration", "Firewall rule", "VPN access", "Cloud migration",
		"Disaster recovery", "Performance tuning", "Code review", "Testing support", "Deployment issue",
		"Monitoring setup", "Logging configuration", "Alert setup", "Backup verification", "Recovery test",
		"Integration testing", "User acceptance", "Documentation update", "Knowledge base", "FAQ update",
		"Video tutorial", "Training material", "User guide", "API reference", "Release notes"}
	issueDescriptions := []string{"Need assistance with this issue", "Requesting this feature", "Performance needs improvement",
		"Training is required", "Bug needs to be fixed", "Data needs migration", "Security review needed", "Documentation needs update",
		"UI needs enhancement", "Backup issue detected"}
	statuses := []models.IssueStatus{models.IssueStatusNew, models.IssueStatusInProgress, models.IssueStatusPending, models.IssueStatusResolved, models.IssueStatusClosed}
	priorities := []models.IssuePriority{models.IssuePriorityLow, models.IssuePriorityMedium, models.IssuePriorityHigh, models.IssuePriorityCritical}
	teams := []string{"Tech Support Team", "Engineering Team", "Sales Team", "Operations Team", "IT Team", "Security Team", "DevOps Team", "QA Team"}

	issues := make([]models.Issue, 80)
	for i := 0; i < 80; i++ {
		accountIndex := i % 30
		employeeIndex := i % 20
		// Find a contact that belongs to this account
		// Since we have 40 contacts and first 30 are primary contacts for the 30 accounts,
		// we can safely use contacts that match the account index
		var contactID *uint
		for j := 0; j < len(contacts); j++ {
			if contacts[j].AccountID == accounts[accountIndex].ID {
				contactID = &contacts[j].ID
				break
			}
		}
		dueDate := time.Now().AddDate(0, 0, (i%14)-7)
		var resolvedAt *time.Time
		status := statuses[i%len(statuses)]
		if status == models.IssueStatusResolved || status == models.IssueStatusClosed {
			resolved := dueDate.AddDate(0, 0, -1)
			resolvedAt = &resolved
		}

		issues[i] = models.Issue{
			AccountID:   accounts[accountIndex].ID,
			ContactID:   contactID,
			Title:       fmt.Sprintf("%s - #%d", issueTitles[i%len(issueTitles)], i+1),
			Description: issueDescriptions[i%len(issueDescriptions)],
			Status:      status,
			Priority:    priorities[i%len(priorities)],
			AssignedTo:  teams[i%len(teams)],
			EmployeeID:  &employees[employeeIndex].ID,
			DueDate:     &dueDate,
			ResolvedAt:  resolvedAt,
		}
	}

	for i := range issues {
		if err := db.Create(&issues[i]).Error; err != nil {
			return fmt.Errorf("failed to create issue: %w", err)
		}
	}

	// Create 20 products
	productNames := []string{"CRM Enterprise License", "Support Package - Premium", "Training Session - Basic", "API Integration Module", "Custom Dashboard",
		"Mobile App License", "Analytics Module", "Reporting Tools", "Security Package", "Backup Service",
		"Cloud Storage", "Email Marketing", "Social Media Integration", "Payment Gateway", "Inventory Management",
		"HR Management Module", "Project Management", "Time Tracking", "Document Management", "Customer Portal"}
	categories := []string{"Software", "Service", "Module", "Customization", "Integration"}

	products := make([]models.Product, 20)
	for i := 0; i < 20; i++ {
		basePrice := float64(500 + i*500)
		products[i] = models.Product{
			Name:        productNames[i],
			SKU:         fmt.Sprintf("PRD-%03d", i+1),
			Category:    categories[i%len(categories)],
			Description: fmt.Sprintf("Description for %s", productNames[i]),
			Price:       basePrice,
			Cost:        basePrice * 0.5,
			Stock:       25 + i*5,
			IsActive:    true,
		}
	}

	for i := range products {
		if err := db.Create(&products[i]).Error; err != nil {
			return fmt.Errorf("failed to create product: %w", err)
		}
	}

	// Create opportunities across pipeline stages
	opportunityProbabilities := []float64{0.15, 0.3, 0.45, 0.6, 0.8, 0.95}
	opportunityStages := []models.OpportunityStage{
		models.OpportunityStageProspecting,
		models.OpportunityStageQualification,
		models.OpportunityStageProposal,
		models.OpportunityStageNegotiation,
		models.OpportunityStageClosedWon,
		models.OpportunityStageClosedLost,
	}

	opportunities := make([]models.Opportunity, 60)
	now := time.Now().UTC()
	for i := 0; i < len(opportunities); i++ {
		accountIndex := i % len(accounts)
		employeeIndex := (i * 3) % len(employees)
		productIndex := i % len(products)
		stage := opportunityStages[i%len(opportunityStages)]
		amount := 5000 + float64((i%12)*1500)
		expectedClose := now.AddDate(0, 0, (i%90)-45)
		var closedAt *time.Time
		if stage == models.OpportunityStageClosedWon || stage == models.OpportunityStageClosedLost {
			closed := expectedClose.AddDate(0, 0, (i%7)-3)
			closedAt = &closed
		}

		var employeeID *uint
		if employees[employeeIndex].ID != 0 {
			employeeID = &employees[employeeIndex].ID
		}

		var productID *uint
		if products[productIndex].ID != 0 {
			productID = &products[productIndex].ID
		}

		opportunities[i] = models.Opportunity{
			AccountID:         accounts[accountIndex].ID,
			EmployeeID:        employeeID,
			ProductID:         productID,
			Name:              fmt.Sprintf("%s Opportunity %d", accounts[accountIndex].Name, i+1),
			Stage:             stage,
			Amount:            amount,
			Probability:       opportunityProbabilities[i%len(opportunityProbabilities)],
			ExpectedCloseDate: &expectedClose,
			ClosedAt:          closedAt,
		}
	}

	if err := db.Create(&opportunities).Error; err != nil {
		return fmt.Errorf("failed to create opportunities: %w", err)
	}

	// Create completed CRM activities
	activitySubjects := []string{"Intro Call", "Follow-up Email", "Quarterly Review", "Product Demo", "Implementation Check-in", "Renewal Discussion"}
	activityTypes := []models.ActivityType{
		models.ActivityTypeCall,
		models.ActivityTypeEmail,
		models.ActivityTypeMeeting,
		models.ActivityTypeTask,
		models.ActivityTypeNote,
	}

	activities := make([]models.Activity, 160)
	for i := 0; i < len(activities); i++ {
		accountIndex := i % len(accounts)
		employeeIndex := (i * 5) % len(employees)

		var contactID *uint
		for j := range contacts {
			if contacts[j].AccountID == accounts[accountIndex].ID {
				contactID = &contacts[j].ID
				break
			}
		}

		baseDate := now.AddDate(0, 0, -((i % 75) + 5))
		completed := i%6 != 0
		// Force some accounts to have stale activities for at-risk highlighting
		if accountIndex%7 == 0 {
			baseDate = now.AddDate(0, 0, -90-(i%10))
			completed = true
		}

		var completedAt *time.Time
		var dueDate *time.Time
		if completed {
			completedCopy := baseDate
			completedAt = &completedCopy
		} else {
			due := baseDate.AddDate(0, 0, 7)
			dueDate = &due
		}

		activities[i] = models.Activity{
			AccountID:   accounts[accountIndex].ID,
			ContactID:   contactID,
			EmployeeID:  &employees[employeeIndex].ID,
			Type:        activityTypes[i%len(activityTypes)],
			Subject:     fmt.Sprintf("%s with %s", activitySubjects[i%len(activitySubjects)], accounts[accountIndex].Name),
			Notes:       fmt.Sprintf("Activity %d notes", i+1),
			Completed:   completed,
			CompletedAt: completedAt,
			DueDate:     dueDate,
		}
	}

	if err := db.Create(&activities).Error; err != nil {
		return fmt.Errorf("failed to create activities: %w", err)
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
