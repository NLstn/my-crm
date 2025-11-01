package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/nlstn/go-odata"
	"github.com/nlstn/my-crm/backend/database"
	"github.com/nlstn/my-crm/backend/models"
	"github.com/nlstn/my-crm/backend/workflows"
	"gorm.io/gorm"
)

// DEVELOPMENT ONLY: Fake JWT secret key
// TODO: Replace with proper authentication provider integration (e.g., Auth0, Okta, Azure AD)
const devJWTSecret = "development-only-secret-key-replace-in-production"

func main() {
	// Connect to database
	db, err := database.Connect()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.AutoMigrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Seed database with sample data
	if err := database.SeedData(db); err != nil {
		log.Fatal("Failed to seed database:", err)
	}

	// Initialize OData service
	service := odata.NewService(db)

	// Initialize workflow automation engine
	workflowEngine := workflows.NewEngine(db)
	if err := workflowEngine.RegisterCallbacks(db); err != nil {
		log.Fatal("Failed to register workflow callbacks:", err)
	}
	workflowEngine.Start()

	// Set custom namespace
	if err := service.SetNamespace("CRM"); err != nil {
		log.Fatal("Failed to set namespace:", err)
	}

	// Register enums for Issue Status and Priority
	// NOTE: Starting at 1 to work around go-odata validation bug with zero values
	if err := odata.RegisterEnumType(models.IssueStatus(1), map[string]int64{
		"New":        1,
		"InProgress": 2,
		"Pending":    3,
		"Resolved":   4,
		"Closed":     5,
	}); err != nil {
		log.Fatal("Failed to register IssueStatus enum:", err)
	}

	if err := odata.RegisterEnumType(models.IssuePriority(1), map[string]int64{
		"Low":      1,
		"Medium":   2,
		"High":     3,
		"Critical": 4,
	}); err != nil {
		log.Fatal("Failed to register IssuePriority enum:", err)
	}

	if err := odata.RegisterEnumType(models.OpportunityStage(1), map[string]int64{
		"Prospecting":   int64(models.OpportunityStageProspecting),
		"Qualification": int64(models.OpportunityStageQualification),
		"NeedsAnalysis": int64(models.OpportunityStageNeedsAnalysis),
		"Proposal":      int64(models.OpportunityStageProposal),
		"Negotiation":   int64(models.OpportunityStageNegotiation),
		"ClosedWon":     int64(models.OpportunityStageClosedWon),
		"ClosedLost":    int64(models.OpportunityStageClosedLost),
	}); err != nil {
		log.Fatal("Failed to register OpportunityStage enum:", err)
	}

	if err := odata.RegisterEnumType(models.TaskStatus(1), map[string]int64{
		"NotStarted": 1,
		"InProgress": 2,
		"Completed":  3,
		"Deferred":   4,
		"Cancelled":  5,
	}); err != nil {
		log.Fatal("Failed to register TaskStatus enum:", err)
	}

	// Register entities - must use go-odata for ALL APIs
	if err := service.RegisterEntity(&models.Account{}); err != nil {
		log.Fatal("Failed to register Account entity:", err)
	}

	if err := service.RegisterEntity(&models.Tag{}); err != nil {
		log.Fatal("Failed to register Tag entity:", err)
	}

	if err := service.RegisterEntity(&models.Contact{}); err != nil {
		log.Fatal("Failed to register Contact entity:", err)
	}

	if err := service.RegisterEntity(&models.Lead{}); err != nil {
		log.Fatal("Failed to register Lead entity:", err)
	}

	if err := service.RegisterEntity(&models.Issue{}); err != nil {
		log.Fatal("Failed to register Issue entity:", err)
	}

	if err := service.RegisterEntity(&models.IssueUpdate{}); err != nil {
		log.Fatal("Failed to register IssueUpdate entity:", err)
	}

	if err := service.RegisterEntity(&models.Activity{}); err != nil {
		log.Fatal("Failed to register Activity entity:", err)
	}

	if err := service.RegisterEntity(&models.Task{}); err != nil {
		log.Fatal("Failed to register Task entity:", err)
	}

	if err := service.RegisterEntity(&models.Employee{}); err != nil {
		log.Fatal("Failed to register Employee entity:", err)
	}

	if err := service.RegisterEntity(&models.Product{}); err != nil {
		log.Fatal("Failed to register Product entity:", err)
	}

	if err := service.RegisterEntity(&models.Opportunity{}); err != nil {
		log.Fatal("Failed to register Opportunity entity:", err)
	}

	if err := service.RegisterEntity(&models.OpportunityLineItem{}); err != nil {
		log.Fatal("Failed to register OpportunityLineItem entity:", err)
	}

	if err := service.RegisterEntity(&models.OpportunityStageHistory{}); err != nil {
		log.Fatal("Failed to register OpportunityStageHistory entity:", err)
	}

	if err := service.RegisterEntity(&models.WorkflowRule{}); err != nil {
		log.Fatal("Failed to register WorkflowRule entity:", err)
	}

	if err := service.RegisterEntity(&models.WorkflowExecution{}); err != nil {
		log.Fatal("Failed to register WorkflowExecution entity:", err)
	}

	if err := registerBulkDataActions(service, db); err != nil {
		log.Fatal("Failed to register bulk data actions:", err)
	}

	if err := registerLeadConversionAction(service, db); err != nil {
		log.Fatal("Failed to register lead conversion action:", err)
	}

	if err := registerGlobalSearchFunction(service, db); err != nil {
		log.Fatal("Failed to register global search function:", err)
	}

	// Register fake authentication action (DEVELOPMENT ONLY)
	// TODO: Replace with proper authentication provider integration in production
	if err := registerDevAuthAction(service, db); err != nil {
		log.Fatal("Failed to register authentication action:", err)
	}

	// Create HTTP server with logging and CORS middleware
	mux := http.NewServeMux()
	mux.Handle("/", loggingMiddleware(corsMiddleware(service)))

	// Health check endpoint
	mux.HandleFunc("/health", loggingMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	})).ServeHTTP)

	// Start server
	port := "8080"
	fmt.Println("🚀 CRM Backend Server Starting...")
	fmt.Println("========================================")
	fmt.Println("Service Document:  http://localhost:" + port + "/")
	fmt.Println("Metadata:          http://localhost:" + port + "/$metadata")
	fmt.Println("Accounts:          http://localhost:" + port + "/Accounts")
	fmt.Println("Contacts:          http://localhost:" + port + "/Contacts")
	fmt.Println("Leads:             http://localhost:" + port + "/Leads")
	fmt.Println("Issues:            http://localhost:" + port + "/Issues")
	fmt.Println("Activities:        http://localhost:" + port + "/Activities")
	fmt.Println("Tasks:             http://localhost:" + port + "/Tasks")
	fmt.Println("Opportunities:     http://localhost:" + port + "/Opportunities")
	fmt.Println("Opportunity Items: http://localhost:" + port + "/OpportunityLineItems")
	fmt.Println("Stage History:     http://localhost:" + port + "/OpportunityStageHistory")
	fmt.Println("Employees:         http://localhost:" + port + "/Employees")
	fmt.Println("Products:          http://localhost:" + port + "/Products")
	fmt.Println("========================================")
	fmt.Println("All APIs are built using go-odata (OData v4 compliant)")
	fmt.Println("Health Check:      http://localhost:" + port + "/health")
	fmt.Println("")

	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// responseWriter wraps http.ResponseWriter to capture the status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// loggingMiddleware logs every request with its response code and time taken
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap the ResponseWriter to capture the status code
		wrapped := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK, // Default status code
		}

		// Call the next handler
		next.ServeHTTP(wrapped, r)

		// Calculate duration
		duration := time.Since(start)

		// Log the request
		log.Printf("%s %s - %d - %v", r.Method, r.URL.Path, wrapped.statusCode, duration)
	})
}

// corsMiddleware adds CORS headers to allow frontend access
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, OData-Version, Prefer")
		w.Header().Set("Access-Control-Expose-Headers", "OData-Version, OData-EntityId")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func registerBulkDataActions(service *odata.Service, db *gorm.DB) error {
	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportAccountsCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			accounts, _, validationErrors, err := database.ParseAccountsCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}
			if len(validationErrors) > 0 {
				return writeValidationErrors(w, "One or more account rows could not be imported", validationErrors)
			}
			if len(accounts) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No account rows were found in the CSV file")
			}

			if err := db.Create(&accounts).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(accounts),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportAccountsCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var accounts []models.Account
			if err := db.Order("id ASC").Find(&accounts).Error; err != nil {
				return err
			}

			csvData, err := database.AccountsToCSV(accounts)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "accounts", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportContactsCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			contacts, contactRows, validationErrors, err := database.ParseContactsCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}
			dependencyErrors, depErr := validateContactDependencies(db, contacts, contactRows)
			if depErr != nil {
				return depErr
			}

			if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
				combined := append(validationErrors, dependencyErrors...)
				return writeValidationErrors(w, "One or more contact rows could not be imported", combined)
			}
			if len(contacts) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No contact rows were found in the CSV file")
			}

			if err := db.Create(&contacts).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(contacts),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportContactsCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var contacts []models.Contact
			if err := db.Order("id ASC").Find(&contacts).Error; err != nil {
				return err
			}

			csvData, err := database.ContactsToCSV(contacts)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "contacts", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportLeadsCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			leads, _, validationErrors, err := database.ParseLeadsCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}
			if len(validationErrors) > 0 {
				return writeValidationErrors(w, "One or more lead rows could not be imported", validationErrors)
			}
			if len(leads) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No lead rows were found in the CSV file")
			}

			if err := db.Create(&leads).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(leads),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportLeadsCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var leads []models.Lead
			if err := db.Order("id ASC").Find(&leads).Error; err != nil {
				return err
			}

			csvData, err := database.LeadsToCSV(leads)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "leads", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportActivitiesCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			activities, rowNumbers, validationErrors, err := database.ParseActivitiesCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}

			dependencyErrors, depErr := validateActivityDependencies(db, activities, rowNumbers)
			if depErr != nil {
				return depErr
			}

			if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
				combined := append(validationErrors, dependencyErrors...)
				return writeValidationErrors(w, "One or more activity rows could not be imported", combined)
			}

			if len(activities) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No activity rows were found in the CSV file")
			}

			if err := db.Create(&activities).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(activities),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportActivitiesCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var activities []models.Activity
			if err := db.Order("id ASC").Find(&activities).Error; err != nil {
				return err
			}

			csvData, err := database.ActivitiesToCSV(activities)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "activities", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportIssuesCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			issues, rowNumbers, validationErrors, err := database.ParseIssuesCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}

			dependencyErrors, depErr := validateIssueDependencies(db, issues, rowNumbers)
			if depErr != nil {
				return depErr
			}

			if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
				combined := append(validationErrors, dependencyErrors...)
				return writeValidationErrors(w, "One or more issue rows could not be imported", combined)
			}

			if len(issues) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No issue rows were found in the CSV file")
			}

			if err := db.Create(&issues).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(issues),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportIssuesCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var issues []models.Issue
			if err := db.Order("id ASC").Find(&issues).Error; err != nil {
				return err
			}

			csvData, err := database.IssuesToCSV(issues)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "issues", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportTasksCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			tasks, rowNumbers, validationErrors, err := database.ParseTasksCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}

			dependencyErrors, depErr := validateTaskDependencies(db, tasks, rowNumbers)
			if depErr != nil {
				return depErr
			}

			if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
				combined := append(validationErrors, dependencyErrors...)
				return writeValidationErrors(w, "One or more task rows could not be imported", combined)
			}

			if len(tasks) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No task rows were found in the CSV file")
			}

			if err := db.Create(&tasks).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(tasks),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportTasksCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var tasks []models.Task
			if err := db.Order("id ASC").Find(&tasks).Error; err != nil {
				return err
			}

			csvData, err := database.TasksToCSV(tasks)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "tasks", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportOpportunitiesCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			opportunities, rowNumbers, validationErrors, err := database.ParseOpportunitiesCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}

			dependencyErrors, depErr := validateOpportunityDependencies(db, opportunities, rowNumbers)
			if depErr != nil {
				return depErr
			}

			if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
				combined := append(validationErrors, dependencyErrors...)
				return writeValidationErrors(w, "One or more opportunity rows could not be imported", combined)
			}

			if len(opportunities) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No opportunity rows were found in the CSV file")
			}

			if err := db.Create(&opportunities).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(opportunities),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportOpportunitiesCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var opportunities []models.Opportunity
			if err := db.Order("id ASC").Find(&opportunities).Error; err != nil {
				return err
			}

			csvData, err := database.OpportunitiesToCSV(opportunities)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "opportunities", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportOpportunityLineItemsCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			items, rowNumbers, validationErrors, err := database.ParseOpportunityLineItemsCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}

			dependencyErrors, depErr := validateOpportunityLineItemDependencies(db, items, rowNumbers)
			if depErr != nil {
				return depErr
			}

			if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
				combined := append(validationErrors, dependencyErrors...)
				return writeValidationErrors(w, "One or more opportunity line item rows could not be imported", combined)
			}

			if len(items) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No opportunity line item rows were found in the CSV file")
			}

			if err := db.Create(&items).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(items),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportOpportunityLineItemsCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var items []models.OpportunityLineItem
			if err := db.Order("id ASC").Find(&items).Error; err != nil {
				return err
			}

			csvData, err := database.OpportunityLineItemsToCSV(items)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "opportunity-line-items", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportEmployeesCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			employees, _, validationErrors, err := database.ParseEmployeesCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}

			if len(validationErrors) > 0 {
				return writeValidationErrors(w, "One or more employee rows could not be imported", validationErrors)
			}

			if len(employees) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No employee rows were found in the CSV file")
			}

			if err := db.Create(&employees).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(employees),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportEmployeesCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var employees []models.Employee
			if err := db.Order("id ASC").Find(&employees).Error; err != nil {
				return err
			}

			csvData, err := database.EmployeesToCSV(employees)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "employees", csvData)
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:      "ImportProductsCSV",
		IsBound:   false,
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "Csv", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			csvPayload, ok := params["Csv"].(string)
			if !ok || strings.TrimSpace(csvPayload) == "" {
				return writeJSONError(w, http.StatusBadRequest, "Csv parameter is required")
			}

			products, _, validationErrors, err := database.ParseProductsCSV(strings.NewReader(csvPayload))
			if err != nil {
				return writeJSONError(w, http.StatusBadRequest, err.Error())
			}

			if len(validationErrors) > 0 {
				return writeValidationErrors(w, "One or more product rows could not be imported", validationErrors)
			}

			if len(products) == 0 {
				return writeJSONError(w, http.StatusBadRequest, "No product rows were found in the CSV file")
			}

			if err := db.Create(&products).Error; err != nil {
				return err
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"imported": len(products),
			})
		},
	}); err != nil {
		return err
	}

	if err := service.RegisterAction(odata.ActionDefinition{
		Name:       "ExportProductsCSV",
		IsBound:    false,
		EntitySet:  "",
		Parameters: nil,
		ReturnType: nil,
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			var products []models.Product
			if err := db.Order("id ASC").Find(&products).Error; err != nil {
				return err
			}

			csvData, err := database.ProductsToCSV(products)
			if err != nil {
				return err
			}

			return writeCSVResponse(w, "products", csvData)
		},
	}); err != nil {
		return err
	}

	return nil
}

func writeValidationErrors(w http.ResponseWriter, message string, details []database.RowError) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	return json.NewEncoder(w).Encode(map[string]interface{}{
		"error":   "validation_failed",
		"message": message,
		"details": details,
	})
}

func writeCSVResponse(w http.ResponseWriter, prefix string, data []byte) error {
	filename := fmt.Sprintf("%s-%s.csv", prefix, time.Now().UTC().Format("20060102-150405"))
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	_, err := w.Write(data)
	return err
}

func validateContactDependencies(db *gorm.DB, contacts []models.Contact, rowNumbers []int) ([]database.RowError, error) {
	accountIDSet := make(map[uint]struct{})
	for _, contact := range contacts {
		accountIDSet[contact.AccountID] = struct{}{}
	}

	existingAccounts, err := fetchExistingIDs(db, &models.Account{}, keysFromSet(accountIDSet))
	if err != nil {
		return nil, err
	}

	var errors []database.RowError
	for idx, contact := range contacts {
		if _, ok := existingAccounts[contact.AccountID]; !ok {
			errors = append(errors, database.RowError{
				Row:     rowNumbers[idx],
				Field:   "AccountID",
				Message: fmt.Sprintf("account %d does not exist", contact.AccountID),
			})
		}
	}

	return errors, nil
}

func validateActivityDependencies(db *gorm.DB, activities []models.Activity, rowNumbers []int) ([]database.RowError, error) {
	accountIDSet := make(map[uint]struct{})
	leadIDSet := make(map[uint]struct{})
	contactIDSet := make(map[uint]struct{})
	employeeIDSet := make(map[uint]struct{})
	opportunityIDSet := make(map[uint]struct{})

	for _, activity := range activities {
		if activity.AccountID != nil {
			accountIDSet[*activity.AccountID] = struct{}{}
		}
		if activity.LeadID != nil {
			leadIDSet[*activity.LeadID] = struct{}{}
		}
		if activity.ContactID != nil {
			contactIDSet[*activity.ContactID] = struct{}{}
		}
		if activity.EmployeeID != nil {
			employeeIDSet[*activity.EmployeeID] = struct{}{}
		}
		if activity.OpportunityID != nil {
			opportunityIDSet[*activity.OpportunityID] = struct{}{}
		}
	}

	existingAccounts, err := fetchExistingIDs(db, &models.Account{}, keysFromSet(accountIDSet))
	if err != nil {
		return nil, err
	}

	existingLeads, err := fetchExistingIDs(db, &models.Lead{}, keysFromSet(leadIDSet))
	if err != nil {
		return nil, err
	}

	existingEmployees, err := fetchExistingIDs(db, &models.Employee{}, keysFromSet(employeeIDSet))
	if err != nil {
		return nil, err
	}

	contactAccounts, err := fetchContactAccounts(db, keysFromSet(contactIDSet))
	if err != nil {
		return nil, err
	}

	opportunityAccounts, err := fetchOpportunityAccounts(db, keysFromSet(opportunityIDSet))
	if err != nil {
		return nil, err
	}

	var errors []database.RowError
	for idx, activity := range activities {
		row := rowNumbers[idx]

		if activity.AccountID != nil {
			if _, ok := existingAccounts[*activity.AccountID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "AccountID", Message: fmt.Sprintf("account %d does not exist", *activity.AccountID)})
			}
		}

		if activity.LeadID != nil {
			if _, ok := existingLeads[*activity.LeadID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "LeadID", Message: fmt.Sprintf("lead %d does not exist", *activity.LeadID)})
			}
		}

		if activity.EmployeeID != nil {
			if _, ok := existingEmployees[*activity.EmployeeID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "EmployeeID", Message: fmt.Sprintf("employee %d does not exist", *activity.EmployeeID)})
			}
		}

		if activity.ContactID != nil {
			accountID, ok := contactAccounts[*activity.ContactID]
			if !ok {
				errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not exist", *activity.ContactID)})
			} else if activity.AccountID != nil {
				if accountID != *activity.AccountID {
					errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not belong to account %d", *activity.ContactID, *activity.AccountID)})
				}
			}
		}

		if activity.OpportunityID != nil {
			accountID, ok := opportunityAccounts[*activity.OpportunityID]
			if !ok {
				errors = append(errors, database.RowError{Row: row, Field: "OpportunityID", Message: fmt.Sprintf("opportunity %d does not exist", *activity.OpportunityID)})
			} else if activity.AccountID != nil {
				if accountID != *activity.AccountID {
					errors = append(errors, database.RowError{Row: row, Field: "OpportunityID", Message: fmt.Sprintf("opportunity %d does not belong to account %d", *activity.OpportunityID, *activity.AccountID)})
				}
			}
		}
	}

	return errors, nil
}

func validateIssueDependencies(db *gorm.DB, issues []models.Issue, rowNumbers []int) ([]database.RowError, error) {
	accountIDSet := make(map[uint]struct{})
	contactIDSet := make(map[uint]struct{})
	employeeIDSet := make(map[uint]struct{})

	for _, issue := range issues {
		accountIDSet[issue.AccountID] = struct{}{}
		if issue.ContactID != nil {
			contactIDSet[*issue.ContactID] = struct{}{}
		}
		if issue.EmployeeID != nil {
			employeeIDSet[*issue.EmployeeID] = struct{}{}
		}
	}

	existingAccounts, err := fetchExistingIDs(db, &models.Account{}, keysFromSet(accountIDSet))
	if err != nil {
		return nil, err
	}

	contactAccounts, err := fetchContactAccounts(db, keysFromSet(contactIDSet))
	if err != nil {
		return nil, err
	}

	existingEmployees, err := fetchExistingIDs(db, &models.Employee{}, keysFromSet(employeeIDSet))
	if err != nil {
		return nil, err
	}

	var errors []database.RowError
	for idx, issue := range issues {
		row := rowNumbers[idx]
		if _, ok := existingAccounts[issue.AccountID]; !ok {
			errors = append(errors, database.RowError{Row: row, Field: "AccountID", Message: fmt.Sprintf("account %d does not exist", issue.AccountID)})
		}

		if issue.ContactID != nil {
			accountID, ok := contactAccounts[*issue.ContactID]
			if !ok {
				errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not exist", *issue.ContactID)})
			} else if accountID != issue.AccountID {
				errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not belong to account %d", *issue.ContactID, issue.AccountID)})
			}
		}

		if issue.EmployeeID != nil {
			if _, ok := existingEmployees[*issue.EmployeeID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "EmployeeID", Message: fmt.Sprintf("employee %d does not exist", *issue.EmployeeID)})
			}
		}
	}

	return errors, nil
}

func validateTaskDependencies(db *gorm.DB, tasks []models.Task, rowNumbers []int) ([]database.RowError, error) {
	accountIDSet := make(map[uint]struct{})
	leadIDSet := make(map[uint]struct{})
	contactIDSet := make(map[uint]struct{})
	employeeIDSet := make(map[uint]struct{})
	opportunityIDSet := make(map[uint]struct{})

	for _, task := range tasks {
		if task.AccountID != nil {
			accountIDSet[*task.AccountID] = struct{}{}
		}
		if task.LeadID != nil {
			leadIDSet[*task.LeadID] = struct{}{}
		}
		if task.ContactID != nil {
			contactIDSet[*task.ContactID] = struct{}{}
		}
		if task.EmployeeID != nil {
			employeeIDSet[*task.EmployeeID] = struct{}{}
		}
		if task.OpportunityID != nil {
			opportunityIDSet[*task.OpportunityID] = struct{}{}
		}
	}

	existingAccounts, err := fetchExistingIDs(db, &models.Account{}, keysFromSet(accountIDSet))
	if err != nil {
		return nil, err
	}

	existingLeads, err := fetchExistingIDs(db, &models.Lead{}, keysFromSet(leadIDSet))
	if err != nil {
		return nil, err
	}

	existingEmployees, err := fetchExistingIDs(db, &models.Employee{}, keysFromSet(employeeIDSet))
	if err != nil {
		return nil, err
	}

	contactAccounts, err := fetchContactAccounts(db, keysFromSet(contactIDSet))
	if err != nil {
		return nil, err
	}

	opportunityAccounts, err := fetchOpportunityAccounts(db, keysFromSet(opportunityIDSet))
	if err != nil {
		return nil, err
	}

	var errors []database.RowError
	for idx, task := range tasks {
		row := rowNumbers[idx]

		if task.AccountID != nil {
			if _, ok := existingAccounts[*task.AccountID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "AccountID", Message: fmt.Sprintf("account %d does not exist", *task.AccountID)})
			}
		}

		if task.LeadID != nil {
			if _, ok := existingLeads[*task.LeadID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "LeadID", Message: fmt.Sprintf("lead %d does not exist", *task.LeadID)})
			}
		}

		if task.EmployeeID != nil {
			if _, ok := existingEmployees[*task.EmployeeID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "EmployeeID", Message: fmt.Sprintf("employee %d does not exist", *task.EmployeeID)})
			}
		}

		if task.ContactID != nil {
			accountID, ok := contactAccounts[*task.ContactID]
			if !ok {
				errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not exist", *task.ContactID)})
			} else if task.AccountID != nil {
				if accountID != *task.AccountID {
					errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not belong to account %d", *task.ContactID, *task.AccountID)})
				}
			}
		}

		if task.OpportunityID != nil {
			accountID, ok := opportunityAccounts[*task.OpportunityID]
			if !ok {
				errors = append(errors, database.RowError{Row: row, Field: "OpportunityID", Message: fmt.Sprintf("opportunity %d does not exist", *task.OpportunityID)})
			} else if task.AccountID != nil {
				if accountID != *task.AccountID {
					errors = append(errors, database.RowError{Row: row, Field: "OpportunityID", Message: fmt.Sprintf("opportunity %d does not belong to account %d", *task.OpportunityID, *task.AccountID)})
				}
			}
		}
	}

	return errors, nil
}

func validateOpportunityDependencies(db *gorm.DB, opportunities []models.Opportunity, rowNumbers []int) ([]database.RowError, error) {
	accountIDSet := make(map[uint]struct{})
	contactIDSet := make(map[uint]struct{})
	ownerIDSet := make(map[uint]struct{})
	closedByIDSet := make(map[uint]struct{})

	for _, opportunity := range opportunities {
		accountIDSet[opportunity.AccountID] = struct{}{}
		if opportunity.ContactID != nil {
			contactIDSet[*opportunity.ContactID] = struct{}{}
		}
		if opportunity.OwnerEmployeeID != nil {
			ownerIDSet[*opportunity.OwnerEmployeeID] = struct{}{}
		}
		if opportunity.ClosedByEmployeeID != nil {
			closedByIDSet[*opportunity.ClosedByEmployeeID] = struct{}{}
		}
	}

	existingAccounts, err := fetchExistingIDs(db, &models.Account{}, keysFromSet(accountIDSet))
	if err != nil {
		return nil, err
	}

	contactAccounts, err := fetchContactAccounts(db, keysFromSet(contactIDSet))
	if err != nil {
		return nil, err
	}

	employeeIDSet := mergeSets(ownerIDSet, closedByIDSet)
	existingEmployees, err := fetchExistingIDs(db, &models.Employee{}, keysFromSet(employeeIDSet))
	if err != nil {
		return nil, err
	}

	var errors []database.RowError
	for idx, opportunity := range opportunities {
		row := rowNumbers[idx]
		if _, ok := existingAccounts[opportunity.AccountID]; !ok {
			errors = append(errors, database.RowError{Row: row, Field: "AccountID", Message: fmt.Sprintf("account %d does not exist", opportunity.AccountID)})
		}

		if opportunity.ContactID != nil {
			accountID, ok := contactAccounts[*opportunity.ContactID]
			if !ok {
				errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not exist", *opportunity.ContactID)})
			} else if accountID != opportunity.AccountID {
				errors = append(errors, database.RowError{Row: row, Field: "ContactID", Message: fmt.Sprintf("contact %d does not belong to account %d", *opportunity.ContactID, opportunity.AccountID)})
			}
		}

		if opportunity.OwnerEmployeeID != nil {
			if _, ok := existingEmployees[*opportunity.OwnerEmployeeID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "OwnerEmployeeID", Message: fmt.Sprintf("employee %d does not exist", *opportunity.OwnerEmployeeID)})
			}
		}

		if opportunity.ClosedByEmployeeID != nil {
			if _, ok := existingEmployees[*opportunity.ClosedByEmployeeID]; !ok {
				errors = append(errors, database.RowError{Row: row, Field: "ClosedByEmployeeID", Message: fmt.Sprintf("employee %d does not exist", *opportunity.ClosedByEmployeeID)})
			}
		}
	}

	return errors, nil
}

func validateOpportunityLineItemDependencies(db *gorm.DB, items []models.OpportunityLineItem, rowNumbers []int) ([]database.RowError, error) {
	opportunityIDSet := make(map[uint]struct{})
	productIDSet := make(map[uint]struct{})

	for _, item := range items {
		opportunityIDSet[item.OpportunityID] = struct{}{}
		productIDSet[item.ProductID] = struct{}{}
	}

	existingOpportunities, err := fetchExistingIDs(db, &models.Opportunity{}, keysFromSet(opportunityIDSet))
	if err != nil {
		return nil, err
	}

	existingProducts, err := fetchExistingIDs(db, &models.Product{}, keysFromSet(productIDSet))
	if err != nil {
		return nil, err
	}

	var errors []database.RowError
	for idx, item := range items {
		row := rowNumbers[idx]
		if _, ok := existingOpportunities[item.OpportunityID]; !ok {
			errors = append(errors, database.RowError{Row: row, Field: "OpportunityID", Message: fmt.Sprintf("opportunity %d does not exist", item.OpportunityID)})
		}
		if _, ok := existingProducts[item.ProductID]; !ok {
			errors = append(errors, database.RowError{Row: row, Field: "ProductID", Message: fmt.Sprintf("product %d does not exist", item.ProductID)})
		}
	}

	return errors, nil
}

func fetchExistingIDs(db *gorm.DB, model interface{}, ids []uint) (map[uint]struct{}, error) {
	result := make(map[uint]struct{})
	if len(ids) == 0 {
		return result, nil
	}

	var found []uint
	if err := db.Model(model).Where("id IN ?", ids).Pluck("id", &found).Error; err != nil {
		return nil, err
	}

	for _, id := range found {
		result[id] = struct{}{}
	}

	return result, nil
}

func fetchContactAccounts(db *gorm.DB, ids []uint) (map[uint]uint, error) {
	result := make(map[uint]uint)
	if len(ids) == 0 {
		return result, nil
	}

	type contactRow struct {
		ID        uint
		AccountID uint
	}

	var rows []contactRow
	if err := db.Model(&models.Contact{}).Where("id IN ?", ids).Select("id", "account_id").Find(&rows).Error; err != nil {
		return nil, err
	}

	for _, row := range rows {
		result[row.ID] = row.AccountID
	}

	return result, nil
}

func fetchOpportunityAccounts(db *gorm.DB, ids []uint) (map[uint]uint, error) {
	result := make(map[uint]uint)
	if len(ids) == 0 {
		return result, nil
	}

	type opportunityRow struct {
		ID        uint
		AccountID uint
	}

	var rows []opportunityRow
	if err := db.Model(&models.Opportunity{}).Where("id IN ?", ids).Select("id", "account_id").Find(&rows).Error; err != nil {
		return nil, err
	}

	for _, row := range rows {
		result[row.ID] = row.AccountID
	}

	return result, nil
}

func keysFromSet(set map[uint]struct{}) []uint {
	keys := make([]uint, 0, len(set))
	for id := range set {
		keys = append(keys, id)
	}
	return keys
}

func mergeSets(sets ...map[uint]struct{}) map[uint]struct{} {
	merged := make(map[uint]struct{})
	for _, set := range sets {
		for id := range set {
			merged[id] = struct{}{}
		}
	}
	return merged
}

// registerLeadConversionAction exposes a bound OData action that converts a lead into an account and contact
func registerLeadConversionAction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterAction(odata.ActionDefinition{
		Name:      "ConvertLead",
		IsBound:   true,
		EntitySet: "Leads",
		Parameters: []odata.ParameterDefinition{
			{Name: "AccountName", Type: reflect.TypeOf(""), Required: false},
			{Name: "ExistingAccountID", Type: reflect.TypeOf(uint(0)), Required: false},
			{Name: "ExistingContactID", Type: reflect.TypeOf(uint(0)), Required: false},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			lead, ok := ctx.(*models.Lead)
			if !ok || lead == nil {
				return fmt.Errorf("invalid lead context for conversion")
			}

			var currentLead models.Lead
			if err := db.First(&currentLead, lead.ID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusNotFound)
					return json.NewEncoder(w).Encode(map[string]string{
						"error": "Lead not found",
					})
				}
				return err
			}

			if currentLead.Status == models.LeadStatusConverted || currentLead.ConvertedAccountID != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				return json.NewEncoder(w).Encode(map[string]string{
					"error": "Lead has already been converted",
				})
			}

			var existingAccountID *uint
			if rawAccountID, ok := params["ExistingAccountID"]; ok {
				parsedID, err := parseUintParam(rawAccountID)
				if err != nil {
					return writeJSONError(w, http.StatusBadRequest, "Invalid ExistingAccountID provided")
				}
				existingAccountID = &parsedID
			}

			var existingContactID *uint
			if rawContactID, ok := params["ExistingContactID"]; ok {
				parsedID, err := parseUintParam(rawContactID)
				if err != nil {
					return writeJSONError(w, http.StatusBadRequest, "Invalid ExistingContactID provided")
				}
				existingContactID = &parsedID
			}

			accountName := strings.TrimSpace(currentLead.Company)
			if overrideName, ok := params["AccountName"].(string); ok {
				if trimmed := strings.TrimSpace(overrideName); trimmed != "" {
					accountName = trimmed
				}
			}
			if accountName == "" {
				accountName = currentLead.Name
			}

			firstName, lastName := splitLeadName(currentLead.Name)

			var account models.Account
			var contact models.Contact
			var reusedAccount bool
			var reusedContact bool

			var (
				errAccountNotFound        = errors.New("existing account not found")
				errContactNotFound        = errors.New("existing contact not found")
				errContactAccountMismatch = errors.New("existing contact does not belong to the selected account")
			)

			err := db.Transaction(func(tx *gorm.DB) error {
				if existingAccountID != nil {
					if err := tx.First(&account, *existingAccountID).Error; err != nil {
						if errors.Is(err, gorm.ErrRecordNotFound) {
							return errAccountNotFound
						}
						return err
					}
					reusedAccount = true
				}

				if existingContactID != nil {
					if err := tx.First(&contact, *existingContactID).Error; err != nil {
						if errors.Is(err, gorm.ErrRecordNotFound) {
							return errContactNotFound
						}
						return err
					}
					reusedContact = true

					if reusedAccount {
						if contact.AccountID != account.ID {
							return errContactAccountMismatch
						}
					} else {
						if err := tx.First(&account, contact.AccountID).Error; err != nil {
							if errors.Is(err, gorm.ErrRecordNotFound) {
								return errAccountNotFound
							}
							return err
						}
						reusedAccount = true
					}
				}

				if !reusedAccount {
					account = models.Account{
						Name:        accountName,
						Email:       currentLead.Email,
						Phone:       currentLead.Phone,
						Website:     currentLead.Website,
						Description: currentLead.Notes,
					}
					if err := tx.Create(&account).Error; err != nil {
						return err
					}
				}

				if !reusedContact {
					contact = models.Contact{
						AccountID: account.ID,
						FirstName: firstName,
						LastName:  lastName,
						Title:     currentLead.Title,
						Email:     currentLead.Email,
						Phone:     currentLead.Phone,
						IsPrimary: true,
						Notes:     currentLead.Notes,
					}
					if err := tx.Create(&contact).Error; err != nil {
						return err
					}
				}

				now := time.Now().UTC()
				currentLead.Status = models.LeadStatusConverted
				currentLead.ConvertedAt = &now
				currentLead.ConvertedAccountID = &account.ID
				currentLead.ConvertedContactID = &contact.ID

				if err := tx.Model(&models.Lead{}).
					Where("id = ?", currentLead.ID).
					Updates(map[string]interface{}{
						"status":               currentLead.Status,
						"converted_at":         currentLead.ConvertedAt,
						"converted_account_id": currentLead.ConvertedAccountID,
						"converted_contact_id": currentLead.ConvertedContactID,
					}).Error; err != nil {
					return err
				}

				return nil
			})
			if err != nil {
				switch {
				case errors.Is(err, errAccountNotFound):
					return writeJSONError(w, http.StatusNotFound, "Existing account could not be found")
				case errors.Is(err, errContactNotFound):
					return writeJSONError(w, http.StatusNotFound, "Existing contact could not be found")
				case errors.Is(err, errContactAccountMismatch):
					return writeJSONError(w, http.StatusBadRequest, "Existing contact is not associated with the selected account")
				default:
					return err
				}
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"LeadID":        currentLead.ID,
				"AccountID":     account.ID,
				"ContactID":     contact.ID,
				"AccountReused": reusedAccount,
				"ContactReused": reusedContact,
			})
		},
	})
}

func registerGlobalSearchFunction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterFunction(odata.FunctionDefinition{
		Name:       "GlobalSearch",
		IsBound:    false,
		Parameters: []odata.ParameterDefinition{{Name: "query", Type: reflect.TypeOf(""), Required: true}, {Name: "limit", Type: reflect.TypeOf(int64(0)), Required: false}},
		ReturnType: reflect.TypeOf([]map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) (interface{}, error) {
			rawQuery, ok := params["query"].(string)
			if !ok {
				return []map[string]interface{}{}, nil
			}

			trimmedQuery := strings.TrimSpace(rawQuery)
			if trimmedQuery == "" {
				return []map[string]interface{}{}, nil
			}

			resultLimit := 5
			if rawLimit, exists := params["limit"]; exists {
				switch v := rawLimit.(type) {
				case int64:
					if v > 0 {
						resultLimit = int(v)
					}
				case int:
					if v > 0 {
						resultLimit = v
					}
				}
			}

			escapedQuery := strings.ReplaceAll(trimmedQuery, "\\", "\\\\")
			escapedQuery = strings.ReplaceAll(escapedQuery, "%", "\\%")
			escapedQuery = strings.ReplaceAll(escapedQuery, "_", "\\_")
			likePattern := fmt.Sprintf("%%%s%%", escapedQuery)

			results := make([]map[string]interface{}, 0, resultLimit*4)

			var accounts []models.Account
			if err := db.Limit(resultLimit).Where("name ILIKE ?", likePattern).Order("name ASC").Find(&accounts).Error; err != nil {
				return nil, err
			}
			for _, account := range accounts {
				results = append(results, map[string]interface{}{
					"entityType": "Account",
					"entityId":   account.ID,
					"name":       account.Name,
					"path":       fmt.Sprintf("/accounts/%d", account.ID),
				})
			}

			var contacts []models.Contact
			if err := db.Limit(resultLimit).
				Where("(first_name || ' ' || last_name) ILIKE ? OR (last_name || ' ' || first_name) ILIKE ?", likePattern, likePattern).
				Order("first_name ASC, last_name ASC").
				Find(&contacts).Error; err != nil {
				return nil, err
			}
			for _, contact := range contacts {
				fullName := strings.TrimSpace(strings.Join([]string{contact.FirstName, contact.LastName}, " "))
				results = append(results, map[string]interface{}{
					"entityType": "Contact",
					"entityId":   contact.ID,
					"name":       fullName,
					"path":       fmt.Sprintf("/contacts/%d", contact.ID),
				})
			}

			var leads []models.Lead
			if err := db.Limit(resultLimit).Where("name ILIKE ?", likePattern).Order("name ASC").Find(&leads).Error; err != nil {
				return nil, err
			}
			for _, lead := range leads {
				results = append(results, map[string]interface{}{
					"entityType": "Lead",
					"entityId":   lead.ID,
					"name":       lead.Name,
					"path":       fmt.Sprintf("/leads/%d", lead.ID),
				})
			}

			var opportunities []models.Opportunity
			if err := db.Limit(resultLimit).Where("name ILIKE ?", likePattern).Order("name ASC").Find(&opportunities).Error; err != nil {
				return nil, err
			}
			for _, opportunity := range opportunities {
				results = append(results, map[string]interface{}{
					"entityType": "Opportunity",
					"entityId":   opportunity.ID,
					"name":       opportunity.Name,
					"path":       fmt.Sprintf("/opportunities/%d", opportunity.ID),
				})
			}

			return results, nil
		},
	})
}

func splitLeadName(fullName string) (string, string) {
	trimmed := strings.TrimSpace(fullName)
	if trimmed == "" {
		return "Lead", "Prospect"
	}

	parts := strings.Fields(trimmed)
	if len(parts) == 1 {
		return parts[0], "Lead"
	}

	return parts[0], strings.Join(parts[1:], " ")
}

func parseUintParam(value interface{}) (uint, error) {
	switch v := value.(type) {
	case uint:
		if v == 0 {
			return 0, fmt.Errorf("value must be greater than zero")
		}
		return v, nil
	case *uint:
		if v == nil || *v == 0 {
			return 0, fmt.Errorf("value must be greater than zero")
		}
		return *v, nil
	case int:
		if v <= 0 {
			return 0, fmt.Errorf("value must be greater than zero")
		}
		return uint(v), nil
	case int64:
		if v <= 0 {
			return 0, fmt.Errorf("value must be greater than zero")
		}
		return uint(v), nil
	case float64:
		if v <= 0 {
			return 0, fmt.Errorf("value must be greater than zero")
		}
		if float64(uint(v)) != v {
			return 0, fmt.Errorf("value must be a whole number")
		}
		return uint(v), nil
	case json.Number:
		parsed, err := v.Int64()
		if err != nil {
			return 0, err
		}
		if parsed <= 0 {
			return 0, fmt.Errorf("value must be greater than zero")
		}
		return uint(parsed), nil
	case string:
		trimmed := strings.TrimSpace(v)
		if trimmed == "" {
			return 0, fmt.Errorf("value cannot be empty")
		}
		parsed, err := strconv.ParseUint(trimmed, 10, 64)
		if err != nil {
			return 0, err
		}
		if parsed == 0 {
			return 0, fmt.Errorf("value must be greater than zero")
		}
		return uint(parsed), nil
	default:
		return 0, fmt.Errorf("unsupported value type %T", value)
	}
}

func writeJSONError(w http.ResponseWriter, status int, message string) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

// registerDevAuthAction registers a fake authentication action for development purposes
// DEVELOPMENT ONLY: This is NOT a secure authentication implementation
// TODO: Replace with proper authentication provider integration (e.g., Auth0, Okta, Azure AD)
func registerDevAuthAction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterAction(odata.ActionDefinition{
		Name:      "LoginWithEmail",
		IsBound:   false, // Unbound action - not tied to a specific entity
		EntitySet: "",
		Parameters: []odata.ParameterDefinition{
			{Name: "email", Type: reflect.TypeOf(""), Required: true},
		},
		ReturnType: reflect.TypeOf(map[string]interface{}{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) error {
			// Extract email from parameters
			email, ok := params["email"].(string)
			if !ok || email == "" {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{
					"error": "email parameter is required",
				})
				return nil
			}

			// Find employee by email
			var employee models.Employee
			result := db.Where("email = ?", email).First(&employee)
			if result.Error != nil {
				if result.Error == gorm.ErrRecordNotFound {
					w.WriteHeader(http.StatusUnauthorized)
					json.NewEncoder(w).Encode(map[string]string{
						"error": "No employee found with this email address",
					})
					return nil
				}
				return result.Error
			}

			// Generate JWT token with employee ID
			// DEVELOPMENT ONLY: Using a static secret key
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"employeeId": employee.ID,
				"email":      employee.Email,
				"name":       employee.FirstName + " " + employee.LastName,
				"exp":        time.Now().Add(24 * time.Hour).Unix(), // Token expires in 24 hours
				"iat":        time.Now().Unix(),
			})

			tokenString, err := token.SignedString([]byte(devJWTSecret))
			if err != nil {
				return err
			}

			// Return token and user info
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return json.NewEncoder(w).Encode(map[string]interface{}{
				"token": tokenString,
				"user": map[string]interface{}{
					"id":        employee.ID,
					"firstName": employee.FirstName,
					"lastName":  employee.LastName,
					"email":     employee.Email,
				},
				"_devWarning": "DEVELOPMENT ONLY - This is fake authentication. Replace with proper auth provider.",
			})
		},
	})
}
