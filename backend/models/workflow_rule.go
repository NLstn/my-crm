package models

import "time"

// WorkflowTriggerType represents supported workflow trigger identifiers.
type WorkflowTriggerType string

const (
	WorkflowTriggerLeadStatusChanged WorkflowTriggerType = "LeadStatusChanged"
	WorkflowTriggerTaskOverdue       WorkflowTriggerType = "TaskOverdue"
)

// WorkflowActionType represents the actions the workflow engine can perform.
type WorkflowActionType string

const (
	WorkflowActionCreateFollowUpTask WorkflowActionType = "CreateFollowUpTask"
	WorkflowActionSendNotification   WorkflowActionType = "SendNotification"
)

// WorkflowRule defines automation rules evaluated by the workflow engine.
type WorkflowRule struct {
	ID            uint                   `json:"ID" gorm:"primaryKey" odata:"key"`
	Name          string                 `json:"Name" gorm:"type:varchar(150);not null" odata:"required,maxlength(150)"`
	Description   string                 `json:"Description" gorm:"type:text"`
	EntityType    string                 `json:"EntityType" gorm:"type:varchar(100);not null" odata:"required,maxlength(100)"`
	TriggerType   WorkflowTriggerType    `json:"TriggerType" gorm:"type:varchar(100);not null" odata:"required,maxlength(100)"`
	TriggerConfig map[string]interface{} `json:"TriggerConfig" gorm:"type:jsonb;serializer:json"`
	ActionType    WorkflowActionType     `json:"ActionType" gorm:"type:varchar(100);not null" odata:"required,maxlength(100)"`
	ActionConfig  map[string]interface{} `json:"ActionConfig" gorm:"type:jsonb;serializer:json"`
	IsActive      bool                   `json:"IsActive" gorm:"not null;default:true"`
	CreatedAt     time.Time              `json:"CreatedAt" gorm:"autoCreateTime"`
	UpdatedAt     time.Time              `json:"UpdatedAt" gorm:"autoUpdateTime"`

	Executions []WorkflowExecution `json:"Executions,omitempty" gorm:"foreignKey:WorkflowRuleID" odata:"navigation"`
}

// TableName defines the persisted table name for workflow rules.
func (WorkflowRule) TableName() string {
	return "workflow_rules"
}
