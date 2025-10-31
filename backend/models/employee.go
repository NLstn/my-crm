package models

import (
	"time"
)

// Employee represents an employee in the CRM
type Employee struct {
	ID          uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	FirstName   string    `json:"FirstName" gorm:"not null;type:varchar(100)" odata:"required,maxlength(100)"`
	LastName    string    `json:"LastName" gorm:"not null;type:varchar(100)" odata:"required,maxlength(100)"`
	Email       string    `json:"Email" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Phone       string    `json:"Phone" gorm:"type:varchar(50)" odata:"maxlength(50)"`
	Department  string    `json:"Department" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	Position    string    `json:"Position" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	HireDate    *time.Time `json:"HireDate"`
	Notes       string    `json:"Notes" gorm:"type:text"`
	CreatedAt   time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for GORM
func (Employee) TableName() string {
	return "employees"
}
