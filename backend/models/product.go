package models

import (
	"time"

	"gorm.io/gorm"
)

// Product represents a product or service in the CRM
type Product struct {
	ID           uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	Name         string    `json:"Name" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	SKU          string    `json:"SKU" gorm:"type:varchar(100);uniqueIndex" odata:"maxlength(100)"`
	Category     string    `json:"Category" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	Description  string    `json:"Description" gorm:"type:text"`
	CurrencyCode string    `json:"CurrencyCode" gorm:"type:char(3);not null;default:USD" odata:"maxlength(3)"`
	Price        float64   `json:"Price" gorm:"type:decimal(10,2)"`
	Cost         float64   `json:"Cost" gorm:"type:decimal(10,2)"`
	Stock        int       `json:"Stock" gorm:"type:integer;default:0"`
	IsActive     bool      `json:"IsActive" gorm:"type:boolean;default:true"`
	CreatedAt    time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for GORM
func (Product) TableName() string {
	return "products"
}

// BeforeSave enforces a currency code on the product.
func (product *Product) BeforeSave(tx *gorm.DB) error {
	product.CurrencyCode = NormalizeCurrencyCode(product.CurrencyCode)
	if product.CurrencyCode == "" {
		defaultCurrency, err := GetDefaultCurrencyCode(tx)
		if err != nil {
			return err
		}
		product.CurrencyCode = defaultCurrency
	}
	return nil
}
