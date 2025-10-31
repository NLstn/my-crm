package models

import (
	"time"
)

// Contact represents a person associated with an account
type Contact struct {
	ID        uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID uint      `json:"AccountID" gorm:"not null;index" odata:"required"`
	FirstName string    `json:"FirstName" gorm:"not null;type:varchar(100)" odata:"required,maxlength(100)"`
	LastName  string    `json:"LastName" gorm:"not null;type:varchar(100)" odata:"required,maxlength(100)"`
	Title     string    `json:"Title" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	Email     string    `json:"Email" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Phone     string    `json:"Phone" gorm:"type:varchar(50)" odata:"maxlength(50)"`
	Mobile    string    `json:"Mobile" gorm:"type:varchar(50)" odata:"maxlength(50)"`
	IsPrimary bool      `json:"IsPrimary" gorm:"default:false"`
	Notes     string    `json:"Notes" gorm:"type:text"`
	CreatedAt time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account    *Account   `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Activities []Activity `json:"Activities" gorm:"foreignKey:ContactID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Contact) TableName() string {
	return "contacts"
}
