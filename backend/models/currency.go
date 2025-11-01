package models

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

// DefaultCurrencyCode is the fallback currency for monetary amounts.
const DefaultCurrencyCode = "USD"

// NormalizeCurrencyCode trims whitespace and uppercases ISO-4217 codes.
func NormalizeCurrencyCode(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}

// GetDefaultCurrencyCode resolves the active organization currency, falling back to DefaultCurrencyCode.
func GetDefaultCurrencyCode(tx *gorm.DB) (string, error) {
	if tx == nil {
		return DefaultCurrencyCode, nil
	}

	var setting OrganizationSetting
	if err := tx.Select("default_currency_code").Order("id asc").First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return DefaultCurrencyCode, nil
		}
		return "", err
	}

	normalized := NormalizeCurrencyCode(setting.DefaultCurrencyCode)
	if normalized == "" {
		return DefaultCurrencyCode, nil
	}
	return normalized, nil
}
