package models

import "time"

// IssueUpdate represents a note or progress update recorded against an issue
// It captures the author, body text, and timestamps for building timelines.
type IssueUpdate struct {
	ID         uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	IssueID    uint      `json:"IssueID" gorm:"not null;index" odata:"required"`
	EmployeeID *uint     `json:"EmployeeID" gorm:"index"`
	Body       string    `json:"Body" gorm:"not null;type:text" odata:"required"`
	CreatedAt  time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt  time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Issue    *Issue    `json:"Issue" gorm:"foreignKey:IssueID" odata:"navigation"`
	Employee *Employee `json:"Employee" gorm:"foreignKey:EmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (IssueUpdate) TableName() string {
	return "issue_updates"
}
