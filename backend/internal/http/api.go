package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/my-crm/backend/internal/domain"
	"github.com/my-crm/backend/internal/repository"
)

// API wires the repository into HTTP handlers.
type API struct {
	repo repository.Repository
}

// NewAPI creates a new API instance.
func NewAPI(repo repository.Repository) *API {
	return &API{repo: repo}
}

// RegisterRoutes attaches all handlers to the provided router.
func (a *API) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /healthz", a.handleHealth)
	mux.HandleFunc("GET /accounts", a.handleSearchAccounts)
	mux.HandleFunc("POST /accounts", a.handleCreateAccount)
	mux.HandleFunc("GET /accounts/{accountID}", a.handleGetAccount)
}

type healthResponse struct {
	Status string `json:"status"`
}

type accountResponse struct {
	ID        string `json:"id"`
	DisplayID int    `json:"displayId"`
	Name      string `json:"name"`
	Industry  string `json:"industry"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (a *API) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
}

func (a *API) handleSearchAccounts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")

	accounts, err := a.repo.SearchAccounts(r.Context(), query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toAccountResponses(accounts))
}

type createAccountRequest struct {
	Name     string `json:"name"`
	Industry string `json:"industry"`
}

func (a *API) handleCreateAccount(w http.ResponseWriter, r *http.Request) {
	var req createAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid payload"})
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "name is required"})
		return
	}

	account, err := a.repo.CreateAccount(r.Context(), repository.CreateAccountInput{Name: req.Name, Industry: req.Industry})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, toAccountResponse(account))
}

func (a *API) handleGetAccount(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("accountID")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "accountID is required"})
		return
	}

	account, err := a.repo.GetAccount(r.Context(), id)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toAccountResponse(account))
}

func toAccountResponses(accounts []domain.Account) []accountResponse {
	res := make([]accountResponse, 0, len(accounts))
	for _, acc := range accounts {
		res = append(res, toAccountResponse(acc))
	}
	return res
}

func toAccountResponse(account domain.Account) accountResponse {
	return accountResponse{
		ID:        account.ID,
		DisplayID: account.DisplayID,
		Name:      account.Name,
		Industry:  account.Industry,
		CreatedAt: account.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: account.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
