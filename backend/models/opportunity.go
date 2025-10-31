package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// OpportunityStage represents the lifecycle stage of a sales opportunity
// NOTE: Starting at 1 to work around go-odata validation bug with zero values
type OpportunityStage int64

const (
	OpportunityStageProspecting   OpportunityStage = 1
	OpportunityStageQualification OpportunityStage = 2
	OpportunityStageNeedsAnalysis OpportunityStage = 3
	OpportunityStageProposal      OpportunityStage = 4
	OpportunityStageNegotiation   OpportunityStage = 5
	OpportunityStageClosedWon     OpportunityStage = 6
	OpportunityStageClosedLost    OpportunityStage = 7
)

// String returns the string representation of OpportunityStage
func (s OpportunityStage) String() string {
	switch s {
	case OpportunityStageProspecting:
		return "Prospecting"
	case OpportunityStageQualification:
		return "Qualification"
	case OpportunityStageNeedsAnalysis:
		return "NeedsAnalysis"
	case OpportunityStageProposal:
		return "Proposal"
	case OpportunityStageNegotiation:
		return "Negotiation"
	case OpportunityStageClosedWon:
		return "ClosedWon"
	case OpportunityStageClosedLost:
		return "ClosedLost"
	default:
		return "Unknown"
	}
}

// Opportunity represents a sales opportunity tied to an account/contact
type Opportunity struct {
	ID                uint             `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID         uint             `json:"AccountID" gorm:"not null;index" odata:"required"`
	ContactID         *uint            `json:"ContactID" gorm:"index"`
	OwnerEmployeeID   *uint            `json:"OwnerEmployeeID" gorm:"index"`
	Name              string           `json:"Name" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Amount            float64          `json:"Amount" gorm:"not null;type:numeric(12,2)" odata:"required"`
	Probability       int              `json:"Probability" gorm:"not null;type:integer;default:50" odata:"required"`
	ExpectedCloseDate *time.Time       `json:"ExpectedCloseDate"`
	Stage             OpportunityStage `json:"Stage" gorm:"not null;type:integer;default:1" odata:"required,enum=OpportunityStage"`
	Description       string           `json:"Description" gorm:"type:text"`
	CreatedAt         time.Time        `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt         time.Time        `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account *Account  `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Contact *Contact  `json:"Contact" gorm:"foreignKey:ContactID" odata:"navigation"`
	Owner   *Employee `json:"Owner" gorm:"foreignKey:OwnerEmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Opportunity) TableName() string {
	return "opportunities"
}

// BeforeSave validates relationships before persisting changes
func (opportunity *Opportunity) BeforeSave(tx *gorm.DB) error {
	if opportunity.ContactID == nil {
		return nil
	}

	var contact Contact
	if err := tx.Select("account_id").First(&contact, *opportunity.ContactID).Error; err != nil {
		return err
	}

	if contact.AccountID != opportunity.AccountID {
		return fmt.Errorf("contact %d does not belong to account %d", *opportunity.ContactID, opportunity.AccountID)
	}

	return nil
}
