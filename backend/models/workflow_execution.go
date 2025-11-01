package models

import "time"

// WorkflowExecutionStatus tracks the outcome of a workflow run.
type WorkflowExecutionStatus string

const (
	WorkflowExecutionStatusPending   WorkflowExecutionStatus = "Pending"
	WorkflowExecutionStatusSucceeded WorkflowExecutionStatus = "Succeeded"
	WorkflowExecutionStatusFailed    WorkflowExecutionStatus = "Failed"
)

// WorkflowExecution captures the history of rule executions for observability.
type WorkflowExecution struct {
	ID             uint                    `json:"ID" gorm:"primaryKey" odata:"key"`
	WorkflowRuleID uint                    `json:"WorkflowRuleID" gorm:"not null;index" odata:"required"`
	TriggerEvent   string                  `json:"TriggerEvent" gorm:"type:varchar(50);not null"`
	EventSource    string                  `json:"EventSource" gorm:"type:varchar(50)"`
	EntityType     string                  `json:"EntityType" gorm:"type:varchar(100);not null"`
	EntityID       string                  `json:"EntityID" gorm:"type:varchar(100);not null"`
	ActionType     WorkflowActionType      `json:"ActionType" gorm:"type:varchar(100);not null"`
	Status         WorkflowExecutionStatus `json:"Status" gorm:"type:varchar(50);not null;default:'Pending'"`
	ResultSummary  string                  `json:"ResultSummary" gorm:"type:text"`
	ErrorMessage   string                  `json:"ErrorMessage" gorm:"type:text"`
	EventPayload   map[string]interface{}  `json:"EventPayload" gorm:"type:jsonb;serializer:json"`
	CreatedAt      time.Time               `json:"CreatedAt" gorm:"autoCreateTime"`
	CompletedAt    *time.Time              `json:"CompletedAt"`

	WorkflowRule *WorkflowRule `json:"WorkflowRule" gorm:"foreignKey:WorkflowRuleID" odata:"navigation"`
}

// TableName defines the persisted table name for workflow executions.
func (WorkflowExecution) TableName() string {
	return "workflow_executions"
}
