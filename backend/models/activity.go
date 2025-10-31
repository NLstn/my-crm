package models

import "time"

// ActivityType represents the type of CRM activity.
type ActivityType string

const (
	ActivityTypeCall    ActivityType = "Call"
	ActivityTypeEmail   ActivityType = "Email"
	ActivityTypeMeeting ActivityType = "Meeting"
	ActivityTypeTask    ActivityType = "Task"
	ActivityTypeNote    ActivityType = "Note"
)

// Activity captures completed or scheduled CRM activities tied to accounts and contacts.
type Activity struct {
	ID          uint         `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID   uint         `json:"AccountID" gorm:"not null;index" odata:"required"`
	ContactID   *uint        `json:"ContactID" gorm:"index"`
	EmployeeID  *uint        `json:"EmployeeID" gorm:"index"`
	Type        ActivityType `json:"Type" gorm:"column:activity_type;not null;type:varchar(50)" odata:"required,maxlength(50)"`
	Subject     string       `json:"Subject" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Notes       string       `json:"Notes" gorm:"type:text"`
	Completed   bool         `json:"Completed" gorm:"default:false"`
	CompletedAt *time.Time   `json:"CompletedAt"`
	DueDate     *time.Time   `json:"DueDate"`
	CreatedAt   time.Time    `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time    `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account  *Account  `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Contact  *Contact  `json:"Contact" gorm:"foreignKey:ContactID" odata:"navigation"`
	Employee *Employee `json:"Employee" gorm:"foreignKey:EmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM.
func (Activity) TableName() string {
	return "activities"
}
