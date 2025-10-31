package models

import (
	"time"
)

// Account represents a customer or business account in the CRM
type Account struct {
	ID          uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	Name        string    `json:"Name" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Industry    string    `json:"Industry" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	Website     string    `json:"Website" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Phone       string    `json:"Phone" gorm:"type:varchar(50)" odata:"maxlength(50)"`
	Email       string    `json:"Email" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Address     string    `json:"Address" gorm:"type:text"`
	City        string    `json:"City" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	State       string    `json:"State" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	Country     string    `json:"Country" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	PostalCode  string    `json:"PostalCode" gorm:"type:varchar(20)" odata:"maxlength(20)"`
	Description string    `json:"Description" gorm:"type:text"`
	EmployeeID  *uint     `json:"EmployeeID" gorm:"index"`
	CreatedAt   time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Contacts      []Contact     `json:"Contacts" gorm:"foreignKey:AccountID" odata:"navigation"`
	Issues        []Issue       `json:"Issues" gorm:"foreignKey:AccountID" odata:"navigation"`
	Opportunities []Opportunity `json:"Opportunities" gorm:"foreignKey:AccountID" odata:"navigation"`
	Activities    []Activity    `json:"Activities" gorm:"foreignKey:AccountID" odata:"navigation"`
	Employee      *Employee     `json:"Employee" gorm:"foreignKey:EmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Account) TableName() string {
	return "accounts"
}
