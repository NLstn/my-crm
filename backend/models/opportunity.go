package models

import "time"

// OpportunityStage represents the sales pipeline stage for an opportunity.
type OpportunityStage string

const (
	OpportunityStageProspecting   OpportunityStage = "Prospecting"
	OpportunityStageQualification OpportunityStage = "Qualification"
	OpportunityStageProposal      OpportunityStage = "Proposal"
	OpportunityStageNegotiation   OpportunityStage = "Negotiation"
	OpportunityStageClosedWon     OpportunityStage = "ClosedWon"
	OpportunityStageClosedLost    OpportunityStage = "ClosedLost"
)

// Opportunity represents a revenue opportunity in the CRM pipeline.
type Opportunity struct {
	ID                uint             `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID         uint             `json:"AccountID" gorm:"not null;index" odata:"required"`
	EmployeeID        *uint            `json:"EmployeeID" gorm:"index"`
	ProductID         *uint            `json:"ProductID" gorm:"index"`
	Name              string           `json:"Name" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Stage             OpportunityStage `json:"Stage" gorm:"not null;type:varchar(50)" odata:"required,maxlength(50)"`
	Amount            float64          `json:"Amount" gorm:"type:decimal(15,2)" odata:"required"`
	Probability       float64          `json:"Probability" gorm:"type:decimal(5,2)"`
	ExpectedCloseDate *time.Time       `json:"ExpectedCloseDate"`
	ClosedAt          *time.Time       `json:"ClosedAt"`
	CreatedAt         time.Time        `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt         time.Time        `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account  *Account  `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Employee *Employee `json:"Employee" gorm:"foreignKey:EmployeeID" odata:"navigation"`
	Product  *Product  `json:"Product" gorm:"foreignKey:ProductID" odata:"navigation"`
}

// TableName specifies the table name for GORM.
func (Opportunity) TableName() string {
	return "opportunities"
}
