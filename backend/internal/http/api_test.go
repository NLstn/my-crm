package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/my-crm/backend/internal/repository"
)

func setupTestRouter() (*API, *repository.MemoryRepository, chi.Router) {
	repo := repository.NewMemoryRepository()
	api := NewAPI(repo)
	r := chi.NewRouter()
	api.RegisterRoutes(r)
	return api, repo, r
}

func TestHandleCreateAndListAccounts(t *testing.T) {
	_, repo, router := setupTestRouter()

	payload := map[string]string{
		"name":     "Acme",
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

	if len(data) != 1 {
		t.Fatalf("expected 1 account, got %d", len(data))
	}

	if data[0]["name"] != "Acme" {
		t.Fatalf("expected account name Acme, got %v", data[0]["name"])
	}

	if _, err := repo.GetAccount(context.Background(), data[0]["id"].(string)); err != nil {
		t.Fatalf("account not persisted: %v", err)
	}
}

func TestHandleCreateContactRequiresAccount(t *testing.T) {
	_, _, router := setupTestRouter()

	payload := map[string]string{
		"fullName": "Jane Doe",
		"email":    "jane@example.com",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/accounts/non-existent/contacts", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.Code)
	}
}

func TestHandleCreateTicketValidatesStatus(t *testing.T) {
	_, repo, router := setupTestRouter()

	account, err := repo.CreateAccount(context.Background(), repository.CreateAccountInput{Name: "Acme", Industry: "Manufacturing"})
	if err != nil {
		t.Fatalf("failed to create account: %v", err)
	}

	payload := map[string]string{
		"title":  "Follow-up",
		"status": "invalid",
	}

	body, _ := json.Marshal(payload)
	path := "/accounts/" + account.ID + "/tickets"
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.Code)
	}
}
