package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// IssueStatus represents the status of an issue/ticket
// NOTE: Starting at 1 to work around go-odata validation bug with zero values
type IssueStatus int64

const (
	IssueStatusNew        IssueStatus = 1
	IssueStatusInProgress IssueStatus = 2
	IssueStatusPending    IssueStatus = 3
	IssueStatusResolved   IssueStatus = 4
	IssueStatusClosed     IssueStatus = 5
)

// String returns the string representation of IssueStatus
func (s IssueStatus) String() string {
	switch s {
	case IssueStatusNew:
		return "New"
	case IssueStatusInProgress:
		return "InProgress"
	case IssueStatusPending:
		return "Pending"
	case IssueStatusResolved:
		return "Resolved"
	case IssueStatusClosed:
		return "Closed"
	default:
		return "Unknown"
	}
}

// IssuePriority represents the priority level of an issue
type IssuePriority int64

const (
	IssuePriorityLow      IssuePriority = 1
	IssuePriorityMedium   IssuePriority = 2
	IssuePriorityHigh     IssuePriority = 3
	IssuePriorityCritical IssuePriority = 4
)

// String returns the string representation of IssuePriority
func (p IssuePriority) String() string {
	switch p {
	case IssuePriorityLow:
		return "Low"
	case IssuePriorityMedium:
		return "Medium"
	case IssuePriorityHigh:
		return "High"
	case IssuePriorityCritical:
		return "Critical"
	default:
		return "Unknown"
	}
}

// Issue represents a support ticket or issue in the CRM
type Issue struct {
	ID          uint          `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID   uint          `json:"AccountID" gorm:"not null;index" odata:"required"`
	ContactID   *uint         `json:"ContactID" gorm:"index"`
	Title       string        `json:"Title" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Description string        `json:"Description" gorm:"type:text"`
	Status      IssueStatus   `json:"Status" gorm:"not null;type:integer;default:1" odata:"required,enum=IssueStatus"`
	Priority    IssuePriority `json:"Priority" gorm:"not null;type:integer;default:2" odata:"required,enum=IssuePriority"`
	AssignedTo  string        `json:"AssignedTo" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Resolution  string        `json:"Resolution" gorm:"type:text"`
	EmployeeID  *uint         `json:"EmployeeID" gorm:"index"`
	DueDate     *time.Time    `json:"DueDate"`
	ResolvedAt  *time.Time    `json:"ResolvedAt"`
	CreatedAt   time.Time     `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time     `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account  *Account  `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Contact  *Contact  `json:"Contact" gorm:"foreignKey:ContactID" odata:"navigation"`
	Employee *Employee `json:"Employee" gorm:"foreignKey:EmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Issue) TableName() string {
	return "issues"
}

// BeforeSave validates relationships before persisting changes
func (issue *Issue) BeforeSave(tx *gorm.DB) error {
	if issue.ContactID == nil {
		return nil
	}

	var contact Contact
	if err := tx.Select("account_id").First(&contact, *issue.ContactID).Error; err != nil {
		return err
	}

	if contact.AccountID != issue.AccountID {
		return fmt.Errorf("contact %d does not belong to account %d", *issue.ContactID, issue.AccountID)
	}

	return nil
}
