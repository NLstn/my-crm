package migration

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/nlstn/my-crm/backend/database"
	"github.com/nlstn/my-crm/backend/models"
	"gorm.io/gorm"
)

type ImportResult struct {
	Imported         int
	ValidationErrors []database.RowError
	SuccessMessage   string
	ErrorMessage     string
}

type ExportResult struct {
	CSV            []byte
	Count          int
	SuccessMessage string
}

type ImportHandler func(db *gorm.DB, csvPayload string) (ImportResult, error)
type ExportHandler func(db *gorm.DB) (ExportResult, error)

type Processor struct {
	db *gorm.DB
}

func NewProcessor(db *gorm.DB) *Processor {
	return &Processor{db: db}
}

func (p *Processor) EnqueueImport(entity string, fileName string, csvPayload string, handler ImportHandler) (*models.MigrationJob, error) {
	job := models.MigrationJob{
		Entity:    strings.ToLower(entity),
		Operation: models.MigrationJobOperationImport,
		Status:    models.MigrationJobStatusPending,
	}

	if strings.TrimSpace(fileName) != "" {
		job.FileName = &fileName
	}

	job.CsvPayload = &csvPayload

	if err := p.db.Create(&job).Error; err != nil {
		return nil, err
	}

	go p.runImportJob(job.ID, handler)

	job.CsvPayload = nil
	return &job, nil
}

func (p *Processor) EnqueueExport(entity string, handler ExportHandler) (*models.MigrationJob, error) {
	lowerEntity := strings.ToLower(entity)
	defaultFileName := fmt.Sprintf("%s-export.csv", lowerEntity)

	job := models.MigrationJob{
		Entity:    lowerEntity,
		Operation: models.MigrationJobOperationExport,
		Status:    models.MigrationJobStatusPending,
		FileName:  &defaultFileName,
	}

	if err := p.db.Create(&job).Error; err != nil {
		return nil, err
	}

	go p.runExportJob(job.ID, handler)

	job.ResultCsv = nil
	return &job, nil
}

func (p *Processor) runImportJob(jobID uint, handler ImportHandler) {
	session := p.db.Session(&gorm.Session{})

	var job models.MigrationJob
	if err := session.First(&job, jobID).Error; err != nil {
		log.Printf("migration: failed to load import job %d: %v", jobID, err)
		return
	}

	payload := ""
	if job.CsvPayload != nil {
		payload = *job.CsvPayload
	} else {
		session.Model(&job).Updates(map[string]interface{}{
			"Status":       models.MigrationJobStatusFailed,
			"ErrorMessage": "CSV payload is missing",
			"CompletedAt":  time.Now().UTC(),
		})
		return
	}

	start := time.Now().UTC()
	if err := session.Model(&job).Updates(map[string]interface{}{
		"Status":       models.MigrationJobStatusRunning,
		"StartedAt":    start,
		"ErrorMessage": nil,
		"ErrorDetails": []byte(nil),
	}).Error; err != nil {
		log.Printf("migration: failed to mark job %d running: %v", jobID, err)
		return
	}

	result, err := handler(session, payload)

	updates := map[string]interface{}{
		"CsvPayload":  nil,
		"UpdatedAt":   time.Now().UTC(),
		"CompletedAt": time.Now().UTC(),
	}

	if err != nil {
		updates["Status"] = models.MigrationJobStatusFailed
		updates["ErrorMessage"] = err.Error()
		updates["ResultMessage"] = nil
		updates["ImportedCount"] = nil
	} else if len(result.ValidationErrors) > 0 || strings.TrimSpace(result.ErrorMessage) != "" {
		updates["Status"] = models.MigrationJobStatusFailed
		message := result.ErrorMessage
		if strings.TrimSpace(message) == "" {
			message = "Import failed due to validation errors."
		}
		updates["ErrorMessage"] = message
		if len(result.ValidationErrors) > 0 {
			if details, marshalErr := json.Marshal(result.ValidationErrors); marshalErr == nil {
				updates["ErrorDetails"] = details
			} else {
				log.Printf("migration: failed to marshal validation errors for job %d: %v", jobID, marshalErr)
			}
		}
		updates["ResultMessage"] = nil
		updates["ImportedCount"] = nil
	} else {
		updates["Status"] = models.MigrationJobStatusCompleted
		updates["ImportedCount"] = result.Imported
		message := result.SuccessMessage
		if strings.TrimSpace(message) == "" {
			message = fmt.Sprintf("Imported %d records successfully.", result.Imported)
		}
		updates["ResultMessage"] = message
		updates["ErrorMessage"] = nil
		updates["ErrorDetails"] = []byte(nil)
	}

	if err := session.Model(&job).Updates(updates).Error; err != nil {
		log.Printf("migration: failed to update import job %d: %v", jobID, err)
	}
}

func (p *Processor) runExportJob(jobID uint, handler ExportHandler) {
	session := p.db.Session(&gorm.Session{})

	var job models.MigrationJob
	if err := session.First(&job, jobID).Error; err != nil {
		log.Printf("migration: failed to load export job %d: %v", jobID, err)
		return
	}

	start := time.Now().UTC()
	if err := session.Model(&job).Updates(map[string]interface{}{
		"Status":       models.MigrationJobStatusRunning,
		"StartedAt":    start,
		"ErrorMessage": nil,
		"ErrorDetails": []byte(nil),
	}).Error; err != nil {
		log.Printf("migration: failed to mark export job %d running: %v", jobID, err)
		return
	}

	result, err := handler(session)

	updates := map[string]interface{}{
		"UpdatedAt":   time.Now().UTC(),
		"CompletedAt": time.Now().UTC(),
	}

	if err != nil {
		updates["Status"] = models.MigrationJobStatusFailed
		updates["ErrorMessage"] = err.Error()
		updates["ResultMessage"] = nil
		updates["ResultCsv"] = nil
		updates["ExportedCount"] = nil
	} else {
		updates["Status"] = models.MigrationJobStatusCompleted
		updates["ResultCsv"] = result.CSV
		updates["ExportedCount"] = result.Count
		message := result.SuccessMessage
		if strings.TrimSpace(message) == "" {
			message = fmt.Sprintf("Exported %d records successfully.", result.Count)
		}
		updates["ResultMessage"] = message
		updates["ErrorMessage"] = nil
		updates["ErrorDetails"] = []byte(nil)
	}

	if err := session.Model(&job).Updates(updates).Error; err != nil {
		log.Printf("migration: failed to update export job %d: %v", jobID, err)
	}
}
