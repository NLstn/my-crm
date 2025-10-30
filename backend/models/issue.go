package models

import (
	"time"
)

// IssueStatus represents the status of an issue/ticket
type IssueStatus string

const (
	IssueStatusNew        IssueStatus = "New"
	IssueStatusInProgress IssueStatus = "InProgress"
	IssueStatusPending    IssueStatus = "Pending"
	IssueStatusResolved   IssueStatus = "Resolved"
	IssueStatusClosed     IssueStatus = "Closed"
)

// IssuePriority represents the priority level of an issue
type IssuePriority string

const (
	IssuePriorityLow      IssuePriority = "Low"
	IssuePriorityMedium   IssuePriority = "Medium"
	IssuePriorityHigh     IssuePriority = "High"
	IssuePriorityCritical IssuePriority = "Critical"
)

// Issue represents a support ticket or issue in the CRM
type Issue struct {
	ID          uint          `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID   uint          `json:"AccountID" gorm:"not null;index" odata:"required"`
	ContactID   *uint         `json:"ContactID" gorm:"index"`
	Title       string        `json:"Title" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Description string        `json:"Description" gorm:"type:text"`
	Status      IssueStatus   `json:"Status" gorm:"not null;type:varchar(50);default:'New'" odata:"required"`
	Priority    IssuePriority `json:"Priority" gorm:"not null;type:varchar(50);default:'Medium'" odata:"required"`
	AssignedTo  string        `json:"AssignedTo" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Resolution  string        `json:"Resolution" gorm:"type:text"`
	DueDate     *time.Time    `json:"DueDate"`
	ResolvedAt  *time.Time    `json:"ResolvedAt"`
	CreatedAt   time.Time     `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time     `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account *Account `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Contact *Contact `json:"Contact" gorm:"foreignKey:ContactID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Issue) TableName() string {
	return "issues"
}
