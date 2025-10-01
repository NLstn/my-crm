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

func setupTestRouter() (*API, *repository.MemoryRepository, *http.ServeMux) {
	repo := repository.NewMemoryRepository()
	api := NewAPI(repo)
	mux := http.NewServeMux()
	api.RegisterRoutes(mux)
	return api, repo, mux
}

func TestHandleCreateAndSearchAccounts(t *testing.T) {
	_, repo, router := setupTestRouter()

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
	_, repo, router := setupTestRouter()

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
	_, _, router := setupTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/accounts/non-existent-id", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", resp.Code)
	}
}

func TestHandleCreateAccountValidation(t *testing.T) {
	_, _, router := setupTestRouter()

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
