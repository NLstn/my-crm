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

	if err := registerLeadConversionAction(service, db); err != nil {
		log.Fatal("Failed to register lead conversion action:", err)
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
