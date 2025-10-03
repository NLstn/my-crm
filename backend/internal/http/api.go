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
	mux.HandleFunc("GET /accounts/{accountID}/contacts", a.handleGetContactsByAccount)
	mux.HandleFunc("POST /accounts/{accountID}/contacts", a.handleCreateContact)
	mux.HandleFunc("GET /accounts/{accountID}/tickets", a.handleGetTicketsByAccount)
	mux.HandleFunc("POST /accounts/{accountID}/tickets", a.handleCreateTicket)
	mux.HandleFunc("PATCH /accounts/{accountID}/tickets/{ticketID}", a.handleUpdateTicketStatus)
	mux.HandleFunc("GET /contacts", a.handleSearchContacts)
	mux.HandleFunc("GET /employees", a.handleSearchEmployees)
	mux.HandleFunc("POST /employees", a.handleCreateEmployee)
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

type contactResponse struct {
	ID        string `json:"id"`
	AccountID string `json:"accountId"`
	FullName  string `json:"fullName"`
	Email     string `json:"email"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type ticketResponse struct {
	ID        string `json:"id"`
	DisplayID int    `json:"displayId"`
	AccountID string `json:"accountId"`
	ContactID string `json:"contactId"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func (a *API) handleGetContactsByAccount(w http.ResponseWriter, r *http.Request) {
	accountID := r.PathValue("accountID")
	if accountID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "accountID is required"})
		return
	}

	// Verify account exists
	_, err := a.repo.GetAccount(r.Context(), accountID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	contacts, err := a.repo.GetContactsByAccount(r.Context(), accountID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toContactResponses(contacts))
}

type createContactRequest struct {
	FullName string `json:"fullName"`
	Email    string `json:"email"`
}

func (a *API) handleCreateContact(w http.ResponseWriter, r *http.Request) {
	accountID := r.PathValue("accountID")
	if accountID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "accountID is required"})
		return
	}

	// Verify account exists
	_, err := a.repo.GetAccount(r.Context(), accountID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	var req createContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid payload"})
		return
	}

	if req.FullName == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "fullName is required"})
		return
	}

	if req.Email == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "email is required"})
		return
	}

	contact, err := a.repo.CreateContact(r.Context(), repository.CreateContactInput{
		AccountID: accountID,
		FullName:  req.FullName,
		Email:     req.Email,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, toContactResponse(contact))
}

func (a *API) handleGetTicketsByAccount(w http.ResponseWriter, r *http.Request) {
	accountID := r.PathValue("accountID")
	if accountID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "accountID is required"})
		return
	}

	// Verify account exists
	_, err := a.repo.GetAccount(r.Context(), accountID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	tickets, err := a.repo.GetTicketsByAccount(r.Context(), accountID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toTicketResponses(tickets))
}

type createTicketRequest struct {
	ContactID string `json:"contactId"`
	Title     string `json:"title"`
	Status    string `json:"status"`
}

func (a *API) handleCreateTicket(w http.ResponseWriter, r *http.Request) {
	accountID := r.PathValue("accountID")
	if accountID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "accountID is required"})
		return
	}

	// Verify account exists
	_, err := a.repo.GetAccount(r.Context(), accountID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	var req createTicketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid payload"})
		return
	}

	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "title is required"})
		return
	}

	if req.ContactID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "contactId is required"})
		return
	}

	// Verify contact exists and belongs to the account
	contacts, err := a.repo.GetContactsByAccount(r.Context(), accountID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}
	
	contactFound := false
	for _, c := range contacts {
		if c.ID == req.ContactID {
			contactFound = true
			break
		}
	}
	
	if !contactFound {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "contact not found or does not belong to account"})
		return
	}

	// Default to "open" if no status provided
	status := req.Status
	if status == "" {
		status = "open"
	}

	ticket, err := a.repo.CreateTicket(r.Context(), repository.CreateTicketInput{
		AccountID: accountID,
		ContactID: req.ContactID,
		Title:     req.Title,
		Status:    status,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, toTicketResponse(ticket))
}

func toContactResponses(contacts []domain.Contact) []contactResponse {
	res := make([]contactResponse, 0, len(contacts))
	for _, contact := range contacts {
		res = append(res, toContactResponse(contact))
	}
	return res
}

func toContactResponse(contact domain.Contact) contactResponse {
	return contactResponse{
		ID:        contact.ID,
		AccountID: contact.AccountID,
		FullName:  contact.FullName,
		Email:     contact.Email,
		CreatedAt: contact.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: contact.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func (a *API) handleSearchContacts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")

	contacts, err := a.repo.SearchContacts(r.Context(), query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toContactResponses(contacts))
}

func toTicketResponses(tickets []domain.Ticket) []ticketResponse {
	res := make([]ticketResponse, 0, len(tickets))
	for _, ticket := range tickets {
		res = append(res, toTicketResponse(ticket))
	}
	return res
}

func toTicketResponse(ticket domain.Ticket) ticketResponse {
	return ticketResponse{
		ID:        ticket.ID,
		DisplayID: ticket.DisplayID,
		AccountID: ticket.AccountID,
		ContactID: ticket.ContactID,
		Title:     ticket.Title,
		Status:    ticket.Status,
		CreatedAt: ticket.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: ticket.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

type updateTicketStatusRequest struct {
	Status string `json:"status"`
}

func (a *API) handleUpdateTicketStatus(w http.ResponseWriter, r *http.Request) {
	accountID := r.PathValue("accountID")
	if accountID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "accountID is required"})
		return
	}

	ticketID := r.PathValue("ticketID")
	if ticketID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "ticketID is required"})
		return
	}

	// Verify account exists
	_, err := a.repo.GetAccount(r.Context(), accountID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "account not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	var req updateTicketStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid payload"})
		return
	}

	if req.Status == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "status is required"})
		return
	}

	// Update the ticket status
	ticket, err := a.repo.UpdateTicketStatus(r.Context(), ticketID, req.Status)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "ticket not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	// Verify the ticket belongs to the specified account
	if ticket.AccountID != accountID {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "ticket not found"})
		return
	}

	writeJSON(w, http.StatusOK, toTicketResponse(ticket))
}

type employeeResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func (a *API) handleSearchEmployees(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")

	employees, err := a.repo.SearchEmployees(r.Context(), query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, toEmployeeResponses(employees))
}

type createEmployeeRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (a *API) handleCreateEmployee(w http.ResponseWriter, r *http.Request) {
	var req createEmployeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid payload"})
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "name is required"})
		return
	}

	if req.Email == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "email is required"})
		return
	}

	employee, err := a.repo.CreateEmployee(r.Context(), repository.CreateEmployeeInput{
		Name:  req.Name,
		Email: req.Email,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, toEmployeeResponse(employee))
}

func toEmployeeResponses(employees []domain.Employee) []employeeResponse {
	res := make([]employeeResponse, 0, len(employees))
	for _, employee := range employees {
		res = append(res, toEmployeeResponse(employee))
	}
	return res
}

func toEmployeeResponse(employee domain.Employee) employeeResponse {
	return employeeResponse{
		ID:        employee.ID,
		Name:      employee.Name,
		Email:     employee.Email,
		CreatedAt: employee.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: employee.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
