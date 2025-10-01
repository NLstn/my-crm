package domain

import (
	"time"

	"gorm.io/gorm"
)

// Account represents a company or organization tracked in the CRM.
type Account struct {
	ID        string         `json:"id" gorm:"primaryKey;type:uuid"`
	DisplayID int            `json:"displayId" gorm:"uniqueIndex;autoIncrement:false"`
	Name      string         `json:"name" gorm:"not null"`
	Industry  string         `json:"industry"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Contact represents a person tied to an account.
type Contact struct {
	ID        string         `json:"id" gorm:"primaryKey;type:uuid"`
	AccountID string         `json:"accountId" gorm:"type:uuid;not null;index"`
	FullName  string         `json:"fullName" gorm:"not null"`
	Email     string         `json:"email" gorm:"not null"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Ticket represents a support interaction linked to an account.
type Ticket struct {
	ID        string         `json:"id" gorm:"primaryKey;type:uuid"`
	AccountID string         `json:"accountId" gorm:"type:uuid;not null;index"`
	Title     string         `json:"title" gorm:"not null"`
	Status    string         `json:"status" gorm:"not null;default:'open'"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
