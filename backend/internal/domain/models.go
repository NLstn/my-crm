package domain

import "time"

// Account represents a company or organization tracked in the CRM.
type Account struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Industry  string    `json:"industry"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Contact represents a person tied to an account.
type Contact struct {
	ID        string    `json:"id"`
	AccountID string    `json:"accountId"`
	FullName  string    `json:"fullName"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Ticket represents a support interaction linked to an account.
type Ticket struct {
	ID        string    `json:"id"`
	AccountID string    `json:"accountId"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
