package models

import (
	"time"

	"gorm.io/gorm"
)

// OrganizationSetting represents organization-wide configuration values such as default currency.
type OrganizationSetting struct {
	ID                  uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	DefaultCurrencyCode string    `json:"DefaultCurrencyCode" gorm:"type:char(3);not null" odata:"required,maxlength(3)"`
	CreatedAt           time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt           time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for GORM.
func (OrganizationSetting) TableName() string {
	return "organization_settings"
}

// BeforeSave normalizes the stored currency code and ensures a fallback value is present.
func (setting *OrganizationSetting) BeforeSave(tx *gorm.DB) error {
	_ = tx
	setting.DefaultCurrencyCode = NormalizeCurrencyCode(setting.DefaultCurrencyCode)
	if setting.DefaultCurrencyCode == "" {
		setting.DefaultCurrencyCode = DefaultCurrencyCode
	}
	return nil
}
