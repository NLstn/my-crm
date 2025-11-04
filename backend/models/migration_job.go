package models

import (
	"time"
)

type MigrationJobOperation string

const (
	MigrationJobOperationImport MigrationJobOperation = "import"
	MigrationJobOperationExport MigrationJobOperation = "export"
)

type MigrationJobStatus string

const (
	MigrationJobStatusPending   MigrationJobStatus = "pending"
	MigrationJobStatusRunning   MigrationJobStatus = "running"
	MigrationJobStatusCompleted MigrationJobStatus = "completed"
	MigrationJobStatusFailed    MigrationJobStatus = "failed"
)

type MigrationJob struct {
	ID            uint                  `json:"ID" gorm:"primaryKey" odata:"key"`
	Entity        string                `json:"Entity" gorm:"type:varchar(64);not null" odata:"filterable"`
	Operation     MigrationJobOperation `json:"Operation" gorm:"type:varchar(16);not null" odata:"filterable"`
	Status        MigrationJobStatus    `json:"Status" gorm:"type:varchar(16);not null" odata:"filterable"`
	FileName      *string               `json:"FileName" gorm:"type:varchar(255)" odata:"filterable"`
	CreatedAt     time.Time             `json:"CreatedAt" gorm:"autoCreateTime" odata:"sortable"`
	UpdatedAt     time.Time             `json:"UpdatedAt" gorm:"autoUpdateTime" odata:"sortable"`
	StartedAt     *time.Time            `json:"StartedAt" odata:"sortable"`
	CompletedAt   *time.Time            `json:"CompletedAt" odata:"sortable"`
	ResultMessage *string               `json:"ResultMessage" gorm:"type:text"`
	ErrorMessage  *string               `json:"ErrorMessage" gorm:"type:text"`
	ImportedCount *int                  `json:"ImportedCount"`
	ExportedCount *int                  `json:"ExportedCount"`
	ErrorDetails  []byte                `json:"ErrorDetails" gorm:"type:jsonb"`

	CsvPayload *string `json:"-" gorm:"type:text"`
	ResultCsv  []byte  `json:"-" gorm:"type:bytea"`
}

func (MigrationJob) TableName() string {
	return "migration_jobs"
}
