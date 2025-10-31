package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// Activity represents an interaction or note recorded against an account
// ActivityTime captures when the interaction took place rather than when it was logged.
type Activity struct {
	ID           uint      `json:"ID" gorm:"primaryKey" odata:"key"`
	AccountID    uint      `json:"AccountID" gorm:"not null;index" odata:"required"`
	ContactID    *uint     `json:"ContactID" gorm:"index"`
	EmployeeID   *uint     `json:"EmployeeID" gorm:"index"`
	ActivityType string    `json:"ActivityType" gorm:"not null;type:varchar(100)" odata:"required,maxlength(100)"`
	Subject      string    `json:"Subject" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Outcome      string    `json:"Outcome" gorm:"type:varchar(150)" odata:"maxlength(150)"`
	Notes        string    `json:"Notes" gorm:"type:text"`
	ActivityTime time.Time `json:"ActivityTime" gorm:"not null" odata:"required"`
	CreatedAt    time.Time `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"UpdatedAt" gorm:"autoUpdateTime"`

	// Navigation properties
	Account  *Account  `json:"Account" gorm:"foreignKey:AccountID" odata:"navigation"`
	Contact  *Contact  `json:"Contact" gorm:"foreignKey:ContactID" odata:"navigation"`
	Employee *Employee `json:"Employee" gorm:"foreignKey:EmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Activity) TableName() string {
	return "activities"
}

// BeforeSave validates relationships before persisting changes
func (activity *Activity) BeforeSave(tx *gorm.DB) error {
	if activity.ContactID == nil {
		return nil
	}

	var contact Contact
	if err := tx.Select("account_id").First(&contact, *activity.ContactID).Error; err != nil {
		return err
	}

	if contact.AccountID != activity.AccountID {
		return fmt.Errorf("contact %d does not belong to account %d", *activity.ContactID, activity.AccountID)
	}

	return nil
}
