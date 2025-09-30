package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

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
func (a *API) RegisterRoutes(router chi.Router) {
	router.Get("/healthz", a.handleHealth)

	router.Route("/accounts", func(r chi.Router) {
		r.Get("/", a.handleListAccounts)
		r.Post("/", a.handleCreateAccount)
		r.Get("/{accountID}", a.handleGetAccount)

		r.Get("/{accountID}/contacts", a.handleListContacts)
		r.Post("/{accountID}/contacts", a.handleCreateContact)

		r.Get("/{accountID}/tickets", a.handleListTickets)
		r.Post("/{accountID}/tickets", a.handleCreateTicket)
	})
}

type healthResponse struct {
	Status string `json:"status"`
}

type accountResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Industry string `json:"industry"`
}

type contactResponse struct {
	ID        string `json:"id"`
	AccountID string `json:"accountId"`
	FullName  string `json:"fullName"`
	Email     string `json:"email"`
}

type ticketResponse struct {
	ID        string `json:"id"`
	AccountID string `json:"accountId"`
	Title     string `json:"title"`
	Status    string `json:"status"`
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

func (a *API) handleListAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := a.repo.ListAccounts(r.Context())
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
	id := chi.URLParam(r, "accountID")
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

type createContactRequest struct {
	FullName string `json:"fullName"`
	Email    string `json:"email"`
}

func (a *API) handleListContacts(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "accountID")
	contacts, err := a.repo.ListContacts(r.Context(), accountID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toContactResponses(contacts))
}

func (a *API) handleCreateContact(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "accountID")
	var req createContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid payload"})
		return
	}

	if req.FullName == "" || req.Email == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "fullName and email are required"})
		return
	}

	contact, err := a.repo.CreateContact(r.Context(), repository.CreateContactInput{
		AccountID: accountID,
		FullName:  req.FullName,
		Email:     req.Email,
	})
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, toContactResponse(contact))
}

type createTicketRequest struct {
	Title  string `json:"title"`
	Status string `json:"status"`
}

func (a *API) handleListTickets(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "accountID")
	tickets, err := a.repo.ListTickets(r.Context(), accountID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toTicketResponses(tickets))
}

func (a *API) handleCreateTicket(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "accountID")
	var req createTicketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid payload"})
		return
	}

	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "title is required"})
		return
	}

	status := req.Status
	if status == "" {
		status = "open"
	}

	if !isValidTicketStatus(status) {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid status"})
		return
	}

	ticket, err := a.repo.CreateTicket(r.Context(), repository.CreateTicketInput{
		AccountID: accountID,
		Title:     req.Title,
		Status:    status,
	})
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, toTicketResponse(ticket))
}

func isValidTicketStatus(status string) bool {
	switch status {
	case "open", "in_progress", "closed":
		return true
	default:
		return false
	}
}

func toAccountResponses(accounts []domain.Account) []accountResponse {
	res := make([]accountResponse, 0, len(accounts))
	for _, acc := range accounts {
		res = append(res, toAccountResponse(acc))
	}
	return res
}

func toAccountResponse(account domain.Account) accountResponse {
	return accountResponse{ID: account.ID, Name: account.Name, Industry: account.Industry}
}

func toContactResponses(contacts []domain.Contact) []contactResponse {
	res := make([]contactResponse, 0, len(contacts))
	for _, contact := range contacts {
		res = append(res, toContactResponse(contact))
	}
	return res
}

func toContactResponse(contact domain.Contact) contactResponse {
	return contactResponse{ID: contact.ID, AccountID: contact.AccountID, FullName: contact.FullName, Email: contact.Email}
}

func toTicketResponses(tickets []domain.Ticket) []ticketResponse {
	res := make([]ticketResponse, 0, len(tickets))
	for _, ticket := range tickets {
		res = append(res, toTicketResponse(ticket))
	}
	return res
}

func toTicketResponse(ticket domain.Ticket) ticketResponse {
	return ticketResponse{ID: ticket.ID, AccountID: ticket.AccountID, Title: ticket.Title, Status: ticket.Status}
}
