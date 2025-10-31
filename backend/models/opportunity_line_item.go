package models

import (
	"math"
	"time"

	"gorm.io/gorm"
)

// OpportunityLineItem represents an individual product or service on an opportunity
type OpportunityLineItem struct {
	ID              uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	OpportunityID   uint      `json:"OpportunityID" gorm:"not null;index" odata:"required"`
	ProductID       uint      `json:"ProductID" gorm:"not null;index" odata:"required"`
	Quantity        int       `json:"Quantity" gorm:"not null;default:1" odata:"required"`
	UnitPrice       float64   `json:"UnitPrice" gorm:"not null;type:numeric(12,2)" odata:"required"`
	DiscountAmount  float64   `json:"DiscountAmount" gorm:"type:numeric(12,2);default:0"`
	DiscountPercent float64   `json:"DiscountPercent" gorm:"type:numeric(5,2);default:0"`
	Subtotal        float64   `json:"Subtotal" gorm:"not null;type:numeric(12,2);default:0"`
	Total           float64   `json:"Total" gorm:"not null;type:numeric(12,2);default:0"`
	CreatedAt       time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt       time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`

	Opportunity *Opportunity `json:"Opportunity" gorm:"foreignKey:OpportunityID" odata:"navigation"`
	Product     *Product     `json:"Product" gorm:"foreignKey:ProductID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (OpportunityLineItem) TableName() string {
	return "opportunity_line_items"
}

// BeforeSave calculates subtotal and total values before persisting the record
func (item *OpportunityLineItem) BeforeSave(tx *gorm.DB) error {
	if item.Quantity <= 0 {
		item.Quantity = 1
	}

	subtotal := float64(item.Quantity) * item.UnitPrice
	percentDiscount := subtotal * (item.DiscountPercent / 100)
	totalDiscount := math.Min(subtotal, math.Max(0, item.DiscountAmount+percentDiscount))
	total := subtotal - totalDiscount

	// Guard against negative values due to rounding or extreme discounts
	if total < 0 {
		total = 0
	}

	item.Subtotal = math.Round(subtotal*100) / 100
	item.Total = math.Round(total*100) / 100

	return nil
}
