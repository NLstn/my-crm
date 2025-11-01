package models

import (
	"errors"
	"fmt"
	"math"
	"strings"
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
	ID                 uint             `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID          uint             `json:"AccountID" gorm:"not null;index" odata:"required"`
	ContactID          *uint            `json:"ContactID" gorm:"index"`
	OwnerEmployeeID    *uint            `json:"OwnerEmployeeID" gorm:"index"`
	Name               string           `json:"Name" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Amount             float64          `json:"Amount" gorm:"not null;type:numeric(12,2)" odata:"required"`
	CurrencyCode       string           `json:"CurrencyCode" gorm:"type:char(3);not null;default:USD" odata:"maxlength(3)"`
	Probability        int              `json:"Probability" gorm:"not null;type:integer;default:50" odata:"required"`
	ExpectedCloseDate  *time.Time       `json:"ExpectedCloseDate"`
	Stage              OpportunityStage `json:"Stage" gorm:"not null;type:integer;default:1" odata:"required,enum=OpportunityStage"`
	Description        string           `json:"Description" gorm:"type:text"`
	ClosedAt           *time.Time       `json:"ClosedAt"`
	CloseReason        string           `json:"CloseReason" gorm:"type:text"`
	ClosedByEmployeeID *uint            `json:"ClosedByEmployeeID" gorm:"index"`
	CreatedAt          time.Time        `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt          time.Time        `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account      *Account                  `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Contact      *Contact                  `json:"Contact" gorm:"foreignKey:ContactID" odata:"navigation"`
	Owner        *Employee                 `json:"Owner" gorm:"foreignKey:OwnerEmployeeID" odata:"navigation"`
	ClosedBy     *Employee                 `json:"ClosedBy" gorm:"foreignKey:ClosedByEmployeeID" odata:"navigation"`
	LineItems    []OpportunityLineItem     `json:"LineItems,omitempty" gorm:"constraint:OnDelete:CASCADE;foreignKey:OpportunityID" odata:"navigation"`
	Activities   []Activity                `json:"Activities,omitempty" gorm:"foreignKey:OpportunityID" odata:"navigation"`
	Tasks        []Task                    `json:"Tasks,omitempty" gorm:"foreignKey:OpportunityID" odata:"navigation"`
	StageHistory []OpportunityStageHistory `json:"StageHistory,omitempty" gorm:"constraint:OnDelete:CASCADE;foreignKey:OpportunityID" odata:"navigation"`

	stageHistoryShouldRecord bool             `json:"-" gorm:"-"`
	stageHistoryHadPrevious  bool             `json:"-" gorm:"-"`
	previousStageValue       OpportunityStage `json:"-" gorm:"-"`
}

// TableName specifies the table name for GORM
func (Opportunity) TableName() string {
	return "opportunities"
}

// BeforeSave validates relationships before persisting changes
func (opportunity *Opportunity) BeforeSave(tx *gorm.DB) error {
	opportunity.CurrencyCode = NormalizeCurrencyCode(opportunity.CurrencyCode)

	opportunity.stageHistoryShouldRecord = false
	opportunity.stageHistoryHadPrevious = false

	if opportunity.ID == 0 {
		opportunity.stageHistoryShouldRecord = true
	}

	if opportunity.ContactID != nil {
		var contact Contact
		if err := tx.Select("account_id").First(&contact, *opportunity.ContactID).Error; err != nil {
			return err
		}

		if contact.AccountID != opportunity.AccountID {
			return fmt.Errorf("contact %d does not belong to account %d", *opportunity.ContactID, opportunity.AccountID)
		}
	}

	// Handle closed stage logic
	previousWasClosed := false

	if opportunity.ID != 0 {
		var existing Opportunity
		if err := tx.Select("stage").First(&existing, opportunity.ID).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		} else {
			if existing.Stage != opportunity.Stage {
				opportunity.stageHistoryShouldRecord = true
				opportunity.stageHistoryHadPrevious = true
				opportunity.previousStageValue = existing.Stage
			}

			previousWasClosed = existing.Stage == OpportunityStageClosedWon || existing.Stage == OpportunityStageClosedLost
		}
	}

	isClosedStage := opportunity.Stage == OpportunityStageClosedWon || opportunity.Stage == OpportunityStageClosedLost
	stageBecameClosed := !previousWasClosed && isClosedStage

	if opportunity.CloseReason != "" {
		opportunity.CloseReason = strings.TrimSpace(opportunity.CloseReason)
	}

	if stageBecameClosed {
		if opportunity.ClosedAt == nil {
			now := time.Now().UTC()
			opportunity.ClosedAt = &now
		}

		if opportunity.ClosedByEmployeeID == nil && opportunity.OwnerEmployeeID != nil {
			opportunity.ClosedByEmployeeID = opportunity.OwnerEmployeeID
		}
	} else if previousWasClosed && !isClosedStage {
		opportunity.ClosedAt = nil
		opportunity.CloseReason = ""
		opportunity.ClosedByEmployeeID = nil
	}

	if opportunity.Stage == OpportunityStageClosedLost {
		if opportunity.CloseReason == "" {
			return fmt.Errorf("close reason is required when opportunity is Closed Lost")
		}
	}

	if opportunity.CurrencyCode == "" {
		defaultCurrency, err := GetDefaultCurrencyCode(tx)
		if err != nil {
			return err
		}
		opportunity.CurrencyCode = defaultCurrency
	}

	// Calculate total from line items if present
	if len(opportunity.LineItems) > 0 {
		total := 0.0
		lineCurrency := opportunity.CurrencyCode
		for i := range opportunity.LineItems {
			opportunity.LineItems[i].CurrencyCode = NormalizeCurrencyCode(opportunity.LineItems[i].CurrencyCode)
			if opportunity.LineItems[i].CurrencyCode == "" {
				opportunity.LineItems[i].CurrencyCode = opportunity.CurrencyCode
			}

			if lineCurrency == "" {
				lineCurrency = opportunity.LineItems[i].CurrencyCode
			}

			if lineCurrency != "" && opportunity.LineItems[i].CurrencyCode != "" && opportunity.LineItems[i].CurrencyCode != lineCurrency {
				return fmt.Errorf("opportunity line item currency %s does not match %s", opportunity.LineItems[i].CurrencyCode, lineCurrency)
			}

			total += opportunity.LineItems[i].Total
		}
		if lineCurrency != "" && opportunity.CurrencyCode != lineCurrency {
			return fmt.Errorf("opportunity currency %s does not match line item currency %s", opportunity.CurrencyCode, lineCurrency)
		}
		if lineCurrency != "" {
			opportunity.CurrencyCode = lineCurrency
		}
		opportunity.Amount = math.Round(total*100) / 100
	}

	return nil
}

// AfterSave records a stage history entry when a new opportunity is created or when the stage changes
func (opportunity *Opportunity) AfterSave(tx *gorm.DB) error {
	if !opportunity.stageHistoryShouldRecord {
		return nil
	}

	history := OpportunityStageHistory{
		OpportunityID: opportunity.ID,
		Stage:         opportunity.Stage,
	}

	if opportunity.stageHistoryHadPrevious {
		prev := int64(opportunity.previousStageValue)
		history.PreviousStage = &prev
	}

	if opportunity.Stage == OpportunityStageClosedWon || opportunity.Stage == OpportunityStageClosedLost {
		if opportunity.ClosedByEmployeeID != nil {
			history.ChangedByEmployeeID = opportunity.ClosedByEmployeeID
		} else if opportunity.OwnerEmployeeID != nil {
			history.ChangedByEmployeeID = opportunity.OwnerEmployeeID
		}
	} else if opportunity.OwnerEmployeeID != nil {
		history.ChangedByEmployeeID = opportunity.OwnerEmployeeID
	}

	if err := tx.Omit("Opportunity").Create(&history).Error; err != nil {
		return err
	}

	opportunity.stageHistoryShouldRecord = false
	opportunity.stageHistoryHadPrevious = false

	return nil
}
