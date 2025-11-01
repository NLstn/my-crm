package models

import "time"

// LeadStatus represents the lifecycle status of a lead
type LeadStatus string

const (
	LeadStatusNew          LeadStatus = "New"
	LeadStatusContacted    LeadStatus = "Contacted"
	LeadStatusQualified    LeadStatus = "Qualified"
	LeadStatusConverted    LeadStatus = "Converted"
	LeadStatusDisqualified LeadStatus = "Disqualified"
)

// Lead captures prospect information before conversion to an account/contact
type Lead struct {
	ID                 uint       `json:"ID" gorm:"primaryKey" odata:"key"`
	Name               string     `json:"Name" gorm:"not null;type:varchar(255)" odata:"required,maxlength(255)"`
	Email              string     `json:"Email" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Phone              string     `json:"Phone" gorm:"type:varchar(50)" odata:"maxlength(50)"`
	Company            string     `json:"Company" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Title              string     `json:"Title" gorm:"type:varchar(150)" odata:"maxlength(150)"`
	Website            string     `json:"Website" gorm:"type:varchar(255)" odata:"maxlength(255)"`
	Source             string     `json:"Source" gorm:"type:varchar(100)" odata:"maxlength(100)"`
	Status             LeadStatus `json:"Status" gorm:"type:varchar(50);default:'New'" odata:"maxlength(50)"`
	Notes              string     `json:"Notes" gorm:"type:text"`
	OwnerEmployeeID    *uint      `json:"OwnerEmployeeID" gorm:"index"`
	ConvertedAccountID *uint      `json:"ConvertedAccountID" gorm:"index"`
	ConvertedContactID *uint      `json:"ConvertedContactID" gorm:"index"`
	ConvertedAt        *time.Time `json:"ConvertedAt"`
	CreatedAt          time.Time  `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt          time.Time  `json:"UpdatedAt" gorm:"autoUpdateTime"`

	ConvertedAccount *Account  `json:"ConvertedAccount" gorm:"foreignKey:ConvertedAccountID" odata:"navigation"`
	ConvertedContact *Contact  `json:"ConvertedContact" gorm:"foreignKey:ConvertedContactID" odata:"navigation"`
	OwnerEmployee    *Employee `json:"OwnerEmployee" gorm:"foreignKey:OwnerEmployeeID" odata:"navigation"`
}

// TableName specifies the table name for GORM
func (Lead) TableName() string {
	return "leads"
}
