package models

import "time"

// OpportunityStageHistory tracks each stage transition for an opportunity
type OpportunityStageHistory struct {
	ID                  uint             `json:"ID" gorm:"primaryKey" odata:"key"`
	OpportunityID       uint             `json:"OpportunityID" gorm:"not null;index" odata:"required"`
	Stage               OpportunityStage `json:"Stage" gorm:"not null;type:integer" odata:"required,enum=OpportunityStage"`
	PreviousStage       *int64           `json:"PreviousStage,omitempty" gorm:"type:integer" odata:"nullable"`
	ChangedAt           time.Time        `json:"ChangedAt" gorm:"autoCreateTime"`
	ChangedByEmployeeID *uint            `json:"ChangedByEmployeeID,omitempty" gorm:"index"`

	// Navigation properties
	Opportunity *Opportunity `json:"Opportunity,omitempty" gorm:"foreignKey:OpportunityID" odata:"navigation"`
	ChangedBy   *Employee    `json:"ChangedBy,omitempty" gorm:"foreignKey:ChangedByEmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (OpportunityStageHistory) TableName() string {
	return "opportunity_stage_history"
}
