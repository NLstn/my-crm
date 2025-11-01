package database

import (
	"fmt"
	"log"
	"math"
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
		&models.Lead{},
		&models.Issue{},
		&models.IssueUpdate{},
		&models.Activity{},
		&models.Task{},
		&models.Employee{},
		&models.Product{},
		&models.Opportunity{},
		&models.OpportunityLineItem{},
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

	// Create 21 employees (including Lonny Lohnsteich)
	firstNames := []string{"Alice", "Bob", "Carol", "David", "Emma", "Frank", "Grace", "Henry", "Iris", "Jack", "Kate", "Liam", "Maya", "Noah", "Olivia", "Paul", "Quinn", "Rachel", "Sam", "Tina", "Lonny"}
	lastNames := []string{"Johnson", "Williams", "Martinez", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Robinson", "Clark", "Rodriguez", "Lohnsteich"}
	departments := []string{"Sales", "Engineering", "Support", "Marketing", "Finance", "HR", "Operations", "Product", "Legal", "IT"}
	positions := []string{"Manager", "Senior Developer", "Specialist", "Director", "Analyst", "Coordinator", "Lead", "Associate", "Consultant", "Engineer"}

	employees := make([]models.Employee, 21)
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

	// Add Lonny Lohnsteich as employee #21
	lonnyHireDate := time.Date(2024, time.October, 1, 0, 0, 0, 0, time.UTC)
	employees[20] = models.Employee{
		FirstName:  "Lonny",
		LastName:   "Lohnsteich",
		Email:      "lonny.lohnsteich@outlook.com",
		Phone:      "+1-555-1021",
		Department: "Engineering",
		Position:   "Developer",
		HireDate:   &lonnyHireDate,
		Notes:      "Test employee account",
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

	contactIDsByAccount := make(map[uint][]uint)
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
		contactIDsByAccount[contacts[i].AccountID] = append(contactIDsByAccount[contacts[i].AccountID], contacts[i].ID)
	}

	// Create 18 opportunities tied to existing accounts, contacts, and employees
	opportunityNames := []string{
		"CRM Expansion",
		"Support Renewal",
		"Analytics Suite Upgrade",
		"Global Rollout",
		"Integration Project",
		"Premium Support Upsell",
		"Training Program",
		"Mobile App Deployment",
		"Data Migration",
		"Customer Portal Refresh",
		"Automation Initiative",
		"Security Review",
		"Multi-year Renewal",
		"Executive Workshop",
		"Cloud Migration",
		"Regional Rollout",
		"Strategic Partnership",
		"AI Enablement",
	}
	stageRotation := []models.OpportunityStage{
		models.OpportunityStageProspecting,
		models.OpportunityStageQualification,
		models.OpportunityStageNeedsAnalysis,
		models.OpportunityStageProposal,
		models.OpportunityStageNegotiation,
		models.OpportunityStageClosedWon,
		models.OpportunityStageClosedLost,
	}

	closeWonReasons := []string{
		"Signed multi-year agreement",
		"Expanded footprint after pilot",
		"Customer upgraded to enterprise tier",
		"Bundled services sealed the deal",
	}

	closeLostReasons := []string{
		"Chose incumbent vendor",
		"Budget was reallocated",
		"Scope delayed until next fiscal year",
		"Lost to lower-cost competitor",
	}

	opportunities := make([]models.Opportunity, len(opportunityNames))
	for i := range opportunityNames {
		account := accounts[i%len(accounts)]
		owner := employees[(i*3)%len(employees)]
		stage := stageRotation[i%len(stageRotation)]

		var contactID *uint
		if ids := contactIDsByAccount[account.ID]; len(ids) > 0 {
			id := ids[i%len(ids)]
			contactID = &id
		}

		amount := 25000.0 + float64((i%6))*12500.0
		probability := 35 + (i%5)*12
		expectedClose := time.Now().AddDate(0, (i%6)-1, 12+(i%7))
		if stage == models.OpportunityStageClosedWon {
			probability = 100
			expectedClose = time.Now().AddDate(0, -1, -i)
		} else if stage == models.OpportunityStageClosedLost {
			probability = 0
			expectedClose = time.Now().AddDate(0, -2, -i)
		} else if probability > 95 {
			probability = 95
		}

		description := fmt.Sprintf("%s opportunity for %s with focus on solution alignment and value realization.", opportunityNames[i], account.Name)

		opportunity := models.Opportunity{
			Name:              fmt.Sprintf("%s - %s", account.Name, opportunityNames[i]),
			AccountID:         account.ID,
			ContactID:         contactID,
			OwnerEmployeeID:   &owner.ID,
			Amount:            amount,
			Probability:       probability,
			ExpectedCloseDate: &expectedClose,
			Stage:             stage,
			Description:       description,
		}

		if stage == models.OpportunityStageClosedWon || stage == models.OpportunityStageClosedLost {
			closedAt := expectedClose.AddDate(0, 0, -2+(i%5))
			opportunity.ClosedAt = &closedAt
			opportunity.ClosedByEmployeeID = &owner.ID

			if stage == models.OpportunityStageClosedWon {
				opportunity.CloseReason = closeWonReasons[i%len(closeWonReasons)]
			} else {
				opportunity.CloseReason = closeLostReasons[i%len(closeLostReasons)]
			}
		}

		opportunities[i] = opportunity
	}

	for i := range opportunities {
		if err := db.Create(&opportunities[i]).Error; err != nil {
			return fmt.Errorf("failed to create opportunity: %w", err)
		}
	}

	opportunityIDsByAccount := make(map[uint][]uint)
	for _, opportunity := range opportunities {
		opportunityIDsByAccount[opportunity.AccountID] = append(opportunityIDsByAccount[opportunity.AccountID], opportunity.ID)
	}

	accountContactIDs := make(map[uint][]uint)
	for _, contact := range contacts {
		accountContactIDs[contact.AccountID] = append(accountContactIDs[contact.AccountID], contact.ID)
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
		employeeIndex := i % 21 // Updated to 21 employees
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
		issues[i] = models.Issue{
			AccountID:   accounts[accountIndex].ID,
			ContactID:   contactID,
			Title:       fmt.Sprintf("%s - #%d", issueTitles[i%len(issueTitles)], i+1),
			Description: issueDescriptions[i%len(issueDescriptions)],
			Status:      statuses[i%len(statuses)],
			Priority:    priorities[i%len(priorities)],
			AssignedTo:  teams[i%len(teams)],
			EmployeeID:  &employees[employeeIndex].ID,
		}
	}

	for i := range issues {
		if err := db.Create(&issues[i]).Error; err != nil {
			return fmt.Errorf("failed to create issue: %w", err)
		}
	}

	currentTime := time.Now()

	updateMessages := []string{
		"Initial triage completed and logs captured",
		"Shared progress update with the customer",
		"Coordinated with engineering for deeper analysis",
		"Implemented fix and awaiting customer confirmation",
		"Scheduled follow-up to ensure resolution holds",
	}

	issueUpdates := make([]models.IssueUpdate, 0, len(issues)*3)
	for i, issue := range issues {
		updatesToCreate := 3
		for j := 0; j < updatesToCreate; j++ {
			var employeeID *uint
			if issue.EmployeeID != nil && j == 0 {
				employeeID = issue.EmployeeID
			} else {
				id := employees[(i+j)%len(employees)].ID
				employeeID = &id
			}

			createdAt := currentTime.Add(-time.Duration((i%6*48)+(j*12)) * time.Hour)
			body := fmt.Sprintf("%s - %s", updateMessages[(i+j)%len(updateMessages)], issue.Title)

			issueUpdates = append(issueUpdates, models.IssueUpdate{
				IssueID:    issue.ID,
				EmployeeID: employeeID,
				Body:       body,
				CreatedAt:  createdAt,
				UpdatedAt:  createdAt,
			})
		}
	}

	if len(issueUpdates) > 0 {
		if err := db.Create(&issueUpdates).Error; err != nil {
			return fmt.Errorf("failed to create issue updates: %w", err)
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

	// Create opportunity line items for detailed deal composition
	computeLineTotal := func(quantity int, unitPrice, discountAmount, discountPercent float64) float64 {
		if quantity <= 0 {
			quantity = 1
		}

		subtotal := float64(quantity) * unitPrice
		percentDiscount := subtotal * (discountPercent / 100)
		totalDiscount := math.Min(subtotal, math.Max(0, discountAmount+percentDiscount))
		total := subtotal - totalDiscount
		if total < 0 {
			total = 0
		}

		return math.Round(total*100) / 100
	}

	if len(opportunities) > 0 && len(products) > 0 {
		lineItems := make([]models.OpportunityLineItem, 0, len(opportunities)*2)
		amountByOpportunity := make(map[uint]float64)
		maxOpportunities := len(opportunities)
		if maxOpportunities > 12 {
			maxOpportunities = 12
		}

		for i := 0; i < maxOpportunities; i++ {
			opportunity := opportunities[i]
			primaryProduct := products[i%len(products)]
			secondaryProduct := products[(i*3+5)%len(products)]

			quantityA := 1 + (i % 3)
			quantityB := 2 + (i % 2)
			discountAmountA := 0.0
			if i%4 == 0 {
				discountAmountA = 75.0
			}
			discountPercentB := float64((i % 3) * 5)

			itemA := models.OpportunityLineItem{
				OpportunityID:  opportunity.ID,
				ProductID:      primaryProduct.ID,
				Quantity:       quantityA,
				UnitPrice:      primaryProduct.Price,
				DiscountAmount: discountAmountA,
			}

			itemB := models.OpportunityLineItem{
				OpportunityID:   opportunity.ID,
				ProductID:       secondaryProduct.ID,
				Quantity:        quantityB,
				UnitPrice:       secondaryProduct.Price,
				DiscountPercent: discountPercentB,
			}

			amountByOpportunity[opportunity.ID] += computeLineTotal(itemA.Quantity, itemA.UnitPrice, itemA.DiscountAmount, itemA.DiscountPercent)
			amountByOpportunity[opportunity.ID] += computeLineTotal(itemB.Quantity, itemB.UnitPrice, itemB.DiscountAmount, itemB.DiscountPercent)

			lineItems = append(lineItems, itemA, itemB)
		}

		if len(lineItems) > 0 {
			if err := db.Create(&lineItems).Error; err != nil {
				return fmt.Errorf("failed to create opportunity line items: %w", err)
			}

			for i := range opportunities {
				if total, ok := amountByOpportunity[opportunities[i].ID]; ok {
					total = math.Round(total*100) / 100
					opportunities[i].Amount = total
					if err := db.Model(&models.Opportunity{}).Where("id = ?", opportunities[i].ID).Update("amount", total).Error; err != nil {
						return fmt.Errorf("failed to update opportunity amount: %w", err)
					}
				}
			}
		}
	}

	// Create activities for accounts
	activityTypes := []string{"Call", "Email", "Meeting", "Note"}
	activitySubjects := []string{"Quarterly Check-in", "Product Demo", "Support Follow-up", "Contract Renewal", "Training Session"}
	activityOutcomes := []string{"Connected", "Left Voicemail", "Meeting Scheduled", "Awaiting Response", "Completed"}

	activities := make([]models.Activity, 0, len(accounts)*3)
	for i, account := range accounts {
		for j := 0; j < 3; j++ {
			activityIndex := i*3 + j
			contactIDs := accountContactIDs[account.ID]
			var contactID *uint
			if len(contactIDs) > 0 {
				id := contactIDs[activityIndex%len(contactIDs)]
				contactID = &id
			}

			employee := employees[(activityIndex)%len(employees)]
			employeeID := employee.ID

			var opportunityID *uint
			opportunityIDs := opportunityIDsByAccount[account.ID]
			if len(opportunityIDs) > 0 && (activityIndex%3 != 2) {
				id := opportunityIDs[activityIndex%len(opportunityIDs)]
				opportunityID = &id
			}

			activities = append(activities, models.Activity{
				AccountID:     account.ID,
				ContactID:     contactID,
				EmployeeID:    &employeeID,
				OpportunityID: opportunityID,
				ActivityType:  activityTypes[activityIndex%len(activityTypes)],
				Subject:       activitySubjects[activityIndex%len(activitySubjects)],
				Outcome:       activityOutcomes[activityIndex%len(activityOutcomes)],
				Notes:         fmt.Sprintf("Interaction #%d with %s", activityIndex+1, account.Name),
				ActivityTime:  currentTime.Add(-time.Duration(activityIndex*12) * time.Hour),
			})
		}
	}

	if len(activities) > 0 {
		if err := db.Create(&activities).Error; err != nil {
			return fmt.Errorf("failed to create activities: %w", err)
		}
	}

	// Create tasks for accounts
	taskTitles := []string{"Follow-up Call", "Prepare Proposal", "Schedule Demo", "Send Documentation", "Review Contract"}
	taskDescriptions := []string{
		"Follow up on the latest discussion and capture feedback.",
		"Prepare the requested proposal and send to stakeholders.",
		"Coordinate a demo session with the account team.",
		"Share the latest documentation package with the customer.",
		"Review the contract details and provide recommendations.",
	}
	taskStatuses := []models.TaskStatus{
		models.TaskStatusNotStarted,
		models.TaskStatusInProgress,
		models.TaskStatusCompleted,
		models.TaskStatusDeferred,
		models.TaskStatusInProgress,
	}

	tasks := make([]models.Task, 0, len(accounts)*2)
	for i, account := range accounts {
		for j := 0; j < 2; j++ {
			taskIndex := i*2 + j
			contactIDs := accountContactIDs[account.ID]
			var contactID *uint
			if len(contactIDs) > 0 {
				id := contactIDs[taskIndex%len(contactIDs)]
				contactID = &id
			}

			employee := employees[(taskIndex*2)%len(employees)]
			employeeID := employee.ID
			dueDate := currentTime.Add(time.Duration((taskIndex%7)+3) * 24 * time.Hour)

			var opportunityID *uint
			opportunityIDs := opportunityIDsByAccount[account.ID]
			if len(opportunityIDs) > 0 && (taskIndex%3 != 0) {
				id := opportunityIDs[taskIndex%len(opportunityIDs)]
				opportunityID = &id
			}

			task := models.Task{
				AccountID:     account.ID,
				ContactID:     contactID,
				EmployeeID:    &employeeID,
				OpportunityID: opportunityID,
				Title:         taskTitles[taskIndex%len(taskTitles)],
				Description:   taskDescriptions[taskIndex%len(taskDescriptions)],
				Owner:         fmt.Sprintf("%s %s", employee.FirstName, employee.LastName),
				Status:        taskStatuses[taskIndex%len(taskStatuses)],
				DueDate:       dueDate,
			}

			if task.Status == models.TaskStatusCompleted {
				completedAt := dueDate.Add(-12 * time.Hour)
				task.CompletedAt = &completedAt
			}

			tasks = append(tasks, task)
		}
	}

	if len(tasks) > 0 {
		if err := db.Create(&tasks).Error; err != nil {
			return fmt.Errorf("failed to create tasks: %w", err)
		}
	}

	// Create sample leads representing prospects awaiting conversion
	leadOwners := []*uint{
		&employees[0].ID,
		&employees[3].ID,
		&employees[6].ID,
		&employees[9].ID,
		&employees[12].ID,
		&employees[15].ID,
		&employees[18].ID,
		&employees[20].ID,
	}

	leads := []models.Lead{
		{
			Name:            "Megan Rivers",
			Email:           "megan.rivers@greenretail.io",
			Phone:           "+1-555-3401",
			Company:         "Green Retail Co",
			Title:           "Operations Director",
			Website:         "https://www.greenretail.io",
			Source:          "Website",
			Status:          models.LeadStatusNew,
			Notes:           "Interested in centralizing customer activity tracking across new store locations.",
			OwnerEmployeeID: leadOwners[0],
		},
		{
			Name:            "Adrian Cole",
			Email:           "adrian.cole@skyship.ai",
			Phone:           "+1-555-7821",
			Company:         "Skyship AI",
			Title:           "Head of Revenue",
			Website:         "https://skyship.ai",
			Source:          "Referral",
			Status:          models.LeadStatusContacted,
			Notes:           "Requested a follow-up demo highlighting AI-powered forecasting.",
			OwnerEmployeeID: leadOwners[1],
		},
		{
			Name:            "Priya Desai",
			Email:           "priya.desai@orbitlogistics.com",
			Phone:           "+1-555-2294",
			Company:         "Orbit Logistics",
			Title:           "IT Program Manager",
			Website:         "https://orbitlogistics.com",
			Source:          "Conference",
			Status:          models.LeadStatusQualified,
			Notes:           "Budget approved for Q3 rollout if integrations look feasible.",
			OwnerEmployeeID: leadOwners[2],
		},
		{
			Name:            "Marcus Lee",
			Email:           "marcus.lee@apexlabs.org",
			Phone:           "+1-555-9152",
			Company:         "Apex Research Labs",
			Title:           "Innovation Lead",
			Source:          "Inbound Call",
			Status:          models.LeadStatusContacted,
			Notes:           "Evaluating CRM platforms that support strict compliance auditing.",
			OwnerEmployeeID: leadOwners[3],
		},
		{
			Name:            "Sofia Hernandez",
			Email:           "sofia.hernandez@lumenenergy.co",
			Phone:           "+1-555-6638",
			Company:         "Lumen Energy Cooperative",
			Title:           "Customer Programs Manager",
			Source:          "Webinar",
			Status:          models.LeadStatusNew,
			Notes:           "Needs better segmentation tools to drive renewable adoption campaigns.",
			OwnerEmployeeID: leadOwners[4],
		},
		{
			Name:            "Jonah Patel",
			Email:           "jonah.patel@urbanwellness.studio",
			Phone:           "+1-555-4459",
			Company:         "Urban Wellness Studio",
			Title:           "Founder",
			Source:          "Social Media",
			Status:          models.LeadStatusQualified,
			Notes:           "Expanding locations and seeking automated nurture journeys.",
			OwnerEmployeeID: leadOwners[5],
		},
		{
			Name:            "Helena Griggs",
			Email:           "helena.griggs@northwindmarine.com",
			Phone:           "+1-555-7810",
			Company:         "Northwind Marine",
			Title:           "Sales Enablement Director",
			Source:          "Partner",
			Status:          models.LeadStatusContacted,
			Notes:           "Comparing vendors; wants integrated quoting workflow demo.",
			OwnerEmployeeID: leadOwners[6],
		},
		{
			Name:            "Damien Cho",
			Email:           "damien.cho@terrafoods.co",
			Phone:           "+1-555-2744",
			Company:         "Terra Foods Cooperative",
			Title:           "Business Development",
			Source:          "Website",
			Status:          models.LeadStatusNew,
			Notes:           "Requested sample dashboards; heavy emphasis on analytics.",
			OwnerEmployeeID: leadOwners[7],
		},
	}

	for i := range leads {
		if err := db.Create(&leads[i]).Error; err != nil {
			return fmt.Errorf("failed to create lead: %w", err)
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
