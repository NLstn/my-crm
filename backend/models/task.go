package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// TaskStatus represents the lifecycle state of an account task
// NOTE: Start at 1 to align with go-odata enum expectations
type TaskStatus int64

const (
	TaskStatusNotStarted TaskStatus = 1
	TaskStatusInProgress TaskStatus = 2
	TaskStatusCompleted  TaskStatus = 3
	TaskStatusDeferred   TaskStatus = 4
	TaskStatusCancelled  TaskStatus = 5
)

// Task represents a follow-up item associated with an account
// Tasks capture accountability with an owner, status and due date.
type Task struct {
	ID            uint       `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID     *uint      `json:"AccountID" gorm:"index"`
	LeadID        *uint      `json:"LeadID" gorm:"index"`
	ContactID     *uint      `json:"ContactID" gorm:"index"`
	EmployeeID    *uint      `json:"EmployeeID" gorm:"index"`
	OpportunityID *uint      `json:"OpportunityID" gorm:"index"`
	Title         string     `json:"Title" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Description   string     `json:"Description" gorm:"type:text"`
	Owner         string     `json:"Owner" gorm:"not null;type:varchar(150)" odata:"required,maxlength(150)"`
	Status        TaskStatus `json:"Status" gorm:"not null;type:integer;default:1" odata:"required,enum=TaskStatus"`
	DueDate       time.Time  `json:"DueDate" gorm:"not null" odata:"required"`
	CompletedAt   *time.Time `json:"CompletedAt"`
	CreatedAt     time.Time  `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt     time.Time  `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account     *Account     `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Lead        *Lead        `json:"Lead" gorm:"foreignKey:LeadID" odata:"navigation"`
	Contact     *Contact     `json:"Contact" gorm:"foreignKey:ContactID" odata:"navigation"`
	Employee    *Employee    `json:"Employee" gorm:"foreignKey:EmployeeID" odata:"navigation"`
	Opportunity *Opportunity `json:"Opportunity" gorm:"foreignKey:OpportunityID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Task) TableName() string {
	return "tasks"
}

// BeforeSave validates relationships before persisting changes
func (task *Task) BeforeSave(tx *gorm.DB) error {
	// Require either an account or a lead
	if task.AccountID == nil && task.LeadID == nil {
		return fmt.Errorf("either an account or a lead must be associated with the task")
	}

	// Validate contact belongs to account (only applicable if both are set)
	if task.ContactID != nil {
		if task.AccountID == nil {
			return fmt.Errorf("contact can only be set when the task is linked to an account")
		}

		var contact Contact
		if err := tx.Select("account_id").First(&contact, *task.ContactID).Error; err != nil {
			return err
		}

		if contact.AccountID != *task.AccountID {
			return fmt.Errorf("contact %d does not belong to account %d", *task.ContactID, *task.AccountID)
		}
	}

	// Validate opportunity belongs to account (only applicable if both are set)
	if task.OpportunityID != nil {
		if task.AccountID == nil {
			return fmt.Errorf("opportunity can only be set when the task is linked to an account")
		}

		var opportunity Opportunity
		if err := tx.Select("account_id").First(&opportunity, *task.OpportunityID).Error; err != nil {
			return err
		}

		if opportunity.AccountID != *task.AccountID {
			return fmt.Errorf("opportunity %d does not belong to account %d", *task.OpportunityID, *task.AccountID)
		}
	}

	return nil
}
