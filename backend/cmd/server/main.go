package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"reflect"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/nlstn/go-odata"
	"github.com/nlstn/my-crm/backend/database"
	"github.com/nlstn/my-crm/backend/models"
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

	if err := service.RegisterEntity(&models.Contact{}); err != nil {
		log.Fatal("Failed to register Contact entity:", err)
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
	fmt.Println("Issues:            http://localhost:" + port + "/Issues")
	fmt.Println("Activities:        http://localhost:" + port + "/Activities")
	fmt.Println("Tasks:             http://localhost:" + port + "/Tasks")
	fmt.Println("Opportunities:     http://localhost:" + port + "/Opportunities")
	fmt.Println("Opportunity Items: http://localhost:" + port + "/OpportunityLineItems")
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
