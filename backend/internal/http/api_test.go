package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/my-crm/backend/internal/repository"
)

func setupTestRouter(t *testing.T) (*API, repository.Repository, *http.ServeMux) {
	repo := setupTestDB(t)
	api := NewAPI(repo)
	mux := http.NewServeMux()
	api.RegisterRoutes(mux)
	return api, repo, mux
}

func TestHandleCreateAndSearchAccounts(t *testing.T) {
	_, repo, router := setupTestRouter(t)

	// Create first account
	payload := map[string]string{
		"name":     "Acme Corp",
		"industry": "Manufacturing",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/accounts", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", resp.Code)
	}

	// Create second account
	payload2 := map[string]string{
		"name":     "TechStart",
		"industry": "Technology",
	}
	body2, _ := json.Marshal(payload2)

	req2 := httptest.NewRequest(http.MethodPost, "/accounts", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	resp2 := httptest.NewRecorder()

	router.ServeHTTP(resp2, req2)

	if resp2.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", resp2.Code)
	}

	// Search all accounts (no query)
	reqList := httptest.NewRequest(http.MethodGet, "/accounts", nil)
	respList := httptest.NewRecorder()

	router.ServeHTTP(respList, reqList)

	if respList.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", respList.Code)
	}

	var data []map[string]any
	if err := json.Unmarshal(respList.Body.Bytes(), &data); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(data) != 2 {
		t.Fatalf("expected 2 accounts, got %d", len(data))
	}

	// Verify account is persisted
	if _, err := repo.GetAccount(context.Background(), data[0]["id"].(string)); err != nil {
		t.Fatalf("account not persisted: %v", err)
	}

	// Search with query
	reqSearch := httptest.NewRequest(http.MethodGet, "/accounts?q=Acme", nil)
	respSearch := httptest.NewRecorder()

	router.ServeHTTP(respSearch, reqSearch)

	if respSearch.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", respSearch.Code)
	}

	var searchData []map[string]any
	if err := json.Unmarshal(respSearch.Body.Bytes(), &searchData); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(searchData) != 1 {
		t.Fatalf("expected 1 account in search results, got %d", len(searchData))
	}

	if searchData[0]["name"] != "Acme Corp" {
		t.Fatalf("expected account name 'Acme Corp', got %v", searchData[0]["name"])
	}

	// Verify displayId is present and is a number
	displayId, ok := searchData[0]["displayId"].(float64)
	if !ok || displayId <= 0 {
		t.Fatalf("expected displayId to be a positive number, got %v", searchData[0]["displayId"])
	}
}

func TestHandleGetAccount(t *testing.T) {
	_, repo, router := setupTestRouter(t)

	// Create an account
	account, err := repo.CreateAccount(context.Background(), repository.CreateAccountInput{
		Name:     "Test Company",
		Industry: "Testing",
	})
	if err != nil {
		t.Fatalf("failed to create account: %v", err)
	}

	// Get the account
	req := httptest.NewRequest(http.MethodGet, "/accounts/"+account.ID, nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var data map[string]any
	if err := json.Unmarshal(resp.Body.Bytes(), &data); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if data["id"] != account.ID {
		t.Fatalf("expected account ID %s, got %v", account.ID, data["id"])
	}

	if data["name"] != "Test Company" {
		t.Fatalf("expected account name 'Test Company', got %v", data["name"])
	}
}

func TestHandleGetAccountNotFound(t *testing.T) {
	_, _, router := setupTestRouter(t)

	req := httptest.NewRequest(http.MethodGet, "/accounts/non-existent-id", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", resp.Code)
	}
}

func TestHandleCreateAccountValidation(t *testing.T) {
	_, _, router := setupTestRouter(t)

	// Test missing name
	payload := map[string]string{
		"industry": "Manufacturing",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/accounts", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.Code)
	}
}

func TestHandleSearchContacts(t *testing.T) {
	_, repo, router := setupTestRouter(t)

	// Create test accounts
	account1, err := repo.CreateAccount(context.Background(), repository.CreateAccountInput{
		Name:     "Acme Corp",
		Industry: "Manufacturing",
	})
	if err != nil {
		t.Fatalf("failed to create account1: %v", err)
	}

	account2, err := repo.CreateAccount(context.Background(), repository.CreateAccountInput{
		Name:     "TechStart",
		Industry: "Technology",
	})
	if err != nil {
		t.Fatalf("failed to create account2: %v", err)
	}

	// Create test contacts
	_, err = repo.CreateContact(context.Background(), repository.CreateContactInput{
		AccountID: account1.ID,
		FullName:  "John Doe",
		Email:     "john.doe@acme.com",
	})
	if err != nil {
		t.Fatalf("failed to create contact1: %v", err)
	}

	_, err = repo.CreateContact(context.Background(), repository.CreateContactInput{
		AccountID: account2.ID,
		FullName:  "Jane Smith",
		Email:     "jane.smith@techstart.com",
	})
	if err != nil {
		t.Fatalf("failed to create contact2: %v", err)
	}

	_, err = repo.CreateContact(context.Background(), repository.CreateContactInput{
		AccountID: account1.ID,
		FullName:  "Bob Johnson",
		Email:     "bob.johnson@acme.com",
	})
	if err != nil {
		t.Fatalf("failed to create contact3: %v", err)
	}

	// Test 1: Search all contacts (no query)
	req := httptest.NewRequest(http.MethodGet, "/contacts", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var allContacts []map[string]any
	if err := json.Unmarshal(resp.Body.Bytes(), &allContacts); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(allContacts) != 3 {
		t.Fatalf("expected 3 contacts, got %d", len(allContacts))
	}

	// Test 2: Search by name
	reqSearch := httptest.NewRequest(http.MethodGet, "/contacts?q=John", nil)
	respSearch := httptest.NewRecorder()

	router.ServeHTTP(respSearch, reqSearch)

	if respSearch.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", respSearch.Code)
	}

	var searchContacts []map[string]any
	if err := json.Unmarshal(respSearch.Body.Bytes(), &searchContacts); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(searchContacts) != 2 {
		t.Fatalf("expected 2 contacts matching 'John', got %d", len(searchContacts))
	}

	// Test 3: Search by email
	reqEmail := httptest.NewRequest(http.MethodGet, "/contacts?q=techstart.com", nil)
	respEmail := httptest.NewRecorder()

	router.ServeHTTP(respEmail, reqEmail)

	if respEmail.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", respEmail.Code)
	}

	var emailContacts []map[string]any
	if err := json.Unmarshal(respEmail.Body.Bytes(), &emailContacts); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(emailContacts) != 1 {
		t.Fatalf("expected 1 contact with 'techstart.com', got %d", len(emailContacts))
	}

	if emailContacts[0]["fullName"] != "Jane Smith" {
		t.Fatalf("expected contact name 'Jane Smith', got %v", emailContacts[0]["fullName"])
	}
}

func TestHandleUpdateTicketStatus(t *testing.T) {
	_, repo, router := setupTestRouter(t)

	// Create an account
	account, err := repo.CreateAccount(context.Background(), repository.CreateAccountInput{
		Name:     "Test Company",
		Industry: "Testing",
	})
	if err != nil {
		t.Fatalf("failed to create account: %v", err)
	}

	// Create a ticket
	ticket, err := repo.CreateTicket(context.Background(), repository.CreateTicketInput{
		AccountID: account.ID,
		Title:     "Test Ticket",
		Status:    "open",
	})
	if err != nil {
		t.Fatalf("failed to create ticket: %v", err)
	}

	// Update the ticket status
	payload := map[string]string{
		"status": "in_progress",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPatch, "/accounts/"+account.ID+"/tickets/"+ticket.ID, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var data map[string]any
	if err := json.Unmarshal(resp.Body.Bytes(), &data); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if data["status"] != "in_progress" {
		t.Fatalf("expected status 'in_progress', got %v", data["status"])
	}

	if data["id"] != ticket.ID {
		t.Fatalf("expected ticket ID %s, got %v", ticket.ID, data["id"])
	}
}

func TestHandleUpdateTicketStatusNotFound(t *testing.T) {
	_, repo, router := setupTestRouter(t)

	// Create an account
	account, err := repo.CreateAccount(context.Background(), repository.CreateAccountInput{
		Name:     "Test Company",
		Industry: "Testing",
	})
	if err != nil {
		t.Fatalf("failed to create account: %v", err)
	}

	payload := map[string]string{
		"status": "closed",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPatch, "/accounts/"+account.ID+"/tickets/non-existent-ticket", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", resp.Code)
	}
}

func TestHandleUpdateTicketStatusValidation(t *testing.T) {
	_, repo, router := setupTestRouter(t)

	// Create an account
	account, err := repo.CreateAccount(context.Background(), repository.CreateAccountInput{
		Name:     "Test Company",
		Industry: "Testing",
	})
	if err != nil {
		t.Fatalf("failed to create account: %v", err)
	}

	// Create a ticket
	ticket, err := repo.CreateTicket(context.Background(), repository.CreateTicketInput{
		AccountID: account.ID,
		Title:     "Test Ticket",
		Status:    "open",
	})
	if err != nil {
		t.Fatalf("failed to create ticket: %v", err)
	}

	// Test missing status
	payload := map[string]string{}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPatch, "/accounts/"+account.ID+"/tickets/"+ticket.ID, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.Code)
	}
}
