package workflows

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"reflect"
	"sync"
	"time"

	"github.com/nlstn/my-crm/backend/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type EventType string

const (
	EventTypeCreated   EventType = "Created"
	EventTypeUpdated   EventType = "Updated"
	EventTypeDeleted   EventType = "Deleted"
	EventTypeScheduled EventType = "Scheduled"
)

// Event represents an entity change dispatched by the workflow engine.
type Event struct {
	Entity     string
	ModelName  string
	Type       EventType
	PrimaryKey interface{}
	NewState   map[string]interface{}
	OldState   map[string]interface{}
	Timestamp  time.Time
	Source     string
}

// Engine wires GORM model callbacks to workflow rule evaluation.
type Engine struct {
	db           *gorm.DB
	events       chan Event
	stop         chan struct{}
	once         sync.Once
	overdueCache map[string]struct{}
	cacheMu      sync.Mutex
}

// NewEngine constructs a workflow engine bound to the provided database connection.
func NewEngine(db *gorm.DB) *Engine {
	return &Engine{
		db:           db,
		events:       make(chan Event, 128),
		stop:         make(chan struct{}),
		overdueCache: make(map[string]struct{}),
	}
}

// RegisterCallbacks hooks into GORM lifecycle events to emit workflow events.
func (e *Engine) RegisterCallbacks(db *gorm.DB) error {
	if err := db.Callback().Create().After("gorm:after_create").Register("workflow:after_create", e.afterCreate); err != nil {
		return fmt.Errorf("register create callback: %w", err)
	}

	if err := db.Callback().Update().Before("gorm:before_update").Register("workflow:before_update", e.beforeUpdate); err != nil {
		return fmt.Errorf("register before update callback: %w", err)
	}

	if err := db.Callback().Update().After("gorm:after_update").Register("workflow:after_update", e.afterUpdate); err != nil {
		return fmt.Errorf("register after update callback: %w", err)
	}

	if err := db.Callback().Delete().After("gorm:after_delete").Register("workflow:after_delete", e.afterDelete); err != nil {
		return fmt.Errorf("register delete callback: %w", err)
	}

	return nil
}

// Start begins processing workflow events and scheduled checks.
func (e *Engine) Start() {
	e.once.Do(func() {
		go e.run()
		go e.monitorOverdueTasks()
	})
}

// Stop signals goroutines to exit.
func (e *Engine) Stop() {
	close(e.stop)
}

func (e *Engine) run() {
	for {
		select {
		case event := <-e.events:
			e.handleEvent(event)
		case <-e.stop:
			return
		}
	}
}

func (e *Engine) emit(event Event) {
	event.Timestamp = time.Now().UTC()
	select {
	case e.events <- event:
	default:
		log.Printf("workflow engine queue full, dropping event for %s", event.ModelName)
	}
}

func (e *Engine) afterCreate(tx *gorm.DB) {
	event := e.buildEvent(tx, EventTypeCreated)
	if event == nil {
		return
	}
	e.emit(*event)
}

func (e *Engine) beforeUpdate(tx *gorm.DB) {
	if tx.Statement == nil || tx.Statement.Schema == nil {
		return
	}

	primaryField := tx.Statement.Schema.PrioritizedPrimaryField
	if primaryField == nil {
		return
	}

	value, zero := primaryField.ValueOf(tx.Statement.Context, tx.Statement.ReflectValue)
	if zero {
		return
	}

	modelType := tx.Statement.Schema.ModelType
	if modelType == nil {
		return
	}

	// Fetch the current persisted state before updates are applied.
	oldValue := reflect.New(modelType).Interface()
	if err := tx.Session(&gorm.Session{NewDB: true}).Clauses(clause.Locking{Strength: "UPDATE"}).Where(fmt.Sprintf("%s = ?", primaryField.DBName), value).Take(oldValue).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return
		}
		log.Printf("workflow engine failed to load previous state: %v", err)
		return
	}

	tx.InstanceSet("workflow:old_state", modelToMap(oldValue))
}

func (e *Engine) afterUpdate(tx *gorm.DB) {
	event := e.buildEvent(tx, EventTypeUpdated)
	if event == nil {
		return
	}

	if old, ok := tx.InstanceGet("workflow:old_state"); ok {
		if oldMap, ok := old.(map[string]interface{}); ok {
			event.OldState = oldMap
		}
	}

	e.emit(*event)
}

func (e *Engine) afterDelete(tx *gorm.DB) {
	event := e.buildEvent(tx, EventTypeDeleted)
	if event == nil {
		return
	}
	e.emit(*event)
}

func (e *Engine) buildEvent(tx *gorm.DB, eventType EventType) *Event {
	if tx.Statement == nil || tx.Statement.Schema == nil {
		return nil
	}

	payload := modelToMap(tx.Statement.Dest)
	if payload == nil {
		return nil
	}

	primaryField := tx.Statement.Schema.PrioritizedPrimaryField
	var primaryValue interface{}
	if primaryField != nil {
		if value, zero := primaryField.ValueOf(tx.Statement.Context, tx.Statement.ReflectValue); !zero {
			primaryValue = value
		}
	}

	event := &Event{
		Entity:     tx.Statement.Table,
		ModelName:  tx.Statement.Schema.Name,
		Type:       eventType,
		NewState:   payload,
		PrimaryKey: primaryValue,
	}

	if eventType == EventTypeDeleted {
		event.OldState = payload
		event.NewState = nil
	}

	return event
}

func (e *Engine) handleEvent(event Event) {
	e.updateOverdueCache(event)

	var rules []models.WorkflowRule
	if err := e.db.Where("is_active = ? AND entity_type = ?", true, event.ModelName).Find(&rules).Error; err != nil {
		log.Printf("workflow engine failed to load rules: %v", err)
		return
	}

	for _, rule := range rules {
		shouldRun, evalErr := e.evaluateRule(&rule, event)
		if evalErr != nil {
			log.Printf("workflow rule %d evaluation error: %v", rule.ID, evalErr)
			e.recordExecution(&rule, event, models.WorkflowExecutionStatusFailed, "", evalErr)
			continue
		}

		if !shouldRun {
			continue
		}

		if rule.TriggerType == models.WorkflowTriggerTaskOverdue {
			if e.hasSuccessfulExecution(rule.ID, fmt.Sprint(event.PrimaryKey)) {
				continue
			}
		}

		summary, actionErr := e.executeAction(&rule, event)
		status := models.WorkflowExecutionStatusSucceeded
		if actionErr != nil {
			status = models.WorkflowExecutionStatusFailed
		}
		e.recordExecution(&rule, event, status, summary, actionErr)
	}
}

func (e *Engine) evaluateRule(rule *models.WorkflowRule, event Event) (bool, error) {
	switch rule.TriggerType {
	case models.WorkflowTriggerLeadStatusChanged:
		if event.ModelName != "Lead" || event.Type != EventTypeUpdated {
			return false, nil
		}
		var config LeadStatusTriggerConfig
		if err := decodeJSONMap(rule.TriggerConfig, &config); err != nil {
			return false, err
		}
		if config.Status == "" {
			return false, errors.New("lead status trigger requires a status value")
		}
		newStatus, newOK := event.NewState["Status"].(string)
		oldStatus, oldOK := "", false
		if event.OldState != nil {
			if v, ok := event.OldState["Status"].(string); ok {
				oldStatus = v
				oldOK = true
			}
		}
		if !newOK {
			return false, errors.New("unable to determine new lead status")
		}
		if !oldOK {
			return false, nil
		}
		return oldStatus != newStatus && newStatus == config.Status, nil

	case models.WorkflowTriggerTaskOverdue:
		if event.ModelName != "Task" {
			return false, nil
		}
		var config TaskOverdueTriggerConfig
		if err := decodeJSONMap(rule.TriggerConfig, &config); err != nil {
			return false, err
		}
		return isTaskOverdue(event.NewState, config.GraceMinutes), nil
	default:
		return false, fmt.Errorf("unsupported trigger type: %s", rule.TriggerType)
	}
}

func (e *Engine) executeAction(rule *models.WorkflowRule, event Event) (string, error) {
	switch rule.ActionType {
	case models.WorkflowActionCreateFollowUpTask:
		var config FollowUpTaskActionConfig
		if err := decodeJSONMap(rule.ActionConfig, &config); err != nil {
			return "", err
		}
		return e.createFollowUpTask(config, event)
	case models.WorkflowActionSendNotification:
		var config NotificationActionConfig
		if err := decodeJSONMap(rule.ActionConfig, &config); err != nil {
			return "", err
		}
		if config.Message == "" {
			return "", errors.New("notification action requires a message")
		}
		summary := fmt.Sprintf("Notification queued: %s", config.Message)
		return summary, nil
	default:
		return "", fmt.Errorf("unsupported action type: %s", rule.ActionType)
	}
}

func (e *Engine) createFollowUpTask(config FollowUpTaskActionConfig, event Event) (string, error) {
	if config.Title == "" {
		return "", errors.New("follow-up task action requires a title")
	}
	if config.Owner == "" {
		return "", errors.New("follow-up task action requires an owner")
	}

	accountID, err := config.ResolveAccountID(event)
	if err != nil {
		return "", err
	}

	dueDate := time.Now().UTC().Add(24 * time.Duration(config.DueInDays) * time.Hour)
	if config.DueInDays == 0 {
		dueDate = time.Now().UTC().Add(48 * time.Hour)
	}

	task := models.Task{
		AccountID:   accountID,
		Title:       config.Title,
		Description: config.Description,
		Owner:       config.Owner,
		Status:      models.TaskStatusNotStarted,
		DueDate:     dueDate,
	}

	if config.EmployeeID != nil {
		task.EmployeeID = config.EmployeeID
	}

	if config.ContactIDField != "" {
		if contactVal, ok := event.NewState[config.ContactIDField]; ok {
			switch v := contactVal.(type) {
			case int:
				id := uint(v)
				task.ContactID = &id
			case int64:
				id := uint(v)
				task.ContactID = &id
			case float64:
				id := uint(v)
				task.ContactID = &id
			case uint:
				id := v
				task.ContactID = &id
			}
		}
	}

	if err := e.db.Create(&task).Error; err != nil {
		return "", fmt.Errorf("create follow-up task: %w", err)
	}

	return fmt.Sprintf("Created Task #%d", task.ID), nil
}

func (e *Engine) recordExecution(rule *models.WorkflowRule, event Event, status models.WorkflowExecutionStatus, summary string, execErr error) {
	payload := map[string]interface{}{}
	if event.NewState != nil {
		payload["new"] = event.NewState
	}
	if event.OldState != nil {
		payload["old"] = event.OldState
	}

	execution := models.WorkflowExecution{
		WorkflowRuleID: rule.ID,
		TriggerEvent:   string(event.Type),
		EntityType:     event.ModelName,
		EntityID:       fmt.Sprint(event.PrimaryKey),
		EventSource:    event.Source,
		Status:         status,
		ResultSummary:  summary,
		EventPayload:   payload,
		ActionType:     rule.ActionType,
	}

	if execErr != nil {
		execution.ErrorMessage = execErr.Error()
	}

	if status != models.WorkflowExecutionStatusPending {
		now := time.Now().UTC()
		execution.CompletedAt = &now
	}

	if err := e.db.Create(&execution).Error; err != nil {
		log.Printf("workflow engine failed to record execution: %v", err)
	}
}

func (e *Engine) hasSuccessfulExecution(ruleID uint, entityID string) bool {
	if entityID == "" {
		return false
	}
	var count int64
	if err := e.db.Model(&models.WorkflowExecution{}).
		Where("workflow_rule_id = ? AND entity_id = ? AND status = ?", ruleID, entityID, models.WorkflowExecutionStatusSucceeded).
		Count(&count).Error; err != nil {
		log.Printf("workflow engine failed to query execution history: %v", err)
		return false
	}
	return count > 0
}

func (e *Engine) monitorOverdueTasks() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			e.dispatchOverdueTasks()
		case <-e.stop:
			return
		}
	}
}

func (e *Engine) dispatchOverdueTasks() {
	var tasks []models.Task
	now := time.Now().UTC()
	if err := e.db.Where("due_date < ? AND (completed_at IS NULL) AND status <> ?", now, models.TaskStatusCompleted).Find(&tasks).Error; err != nil {
		log.Printf("workflow engine failed to scan overdue tasks: %v", err)
		return
	}

	for _, task := range tasks {
		if !e.markOverdueEmitted(task.ID) {
			continue
		}
		e.emit(Event{
			Entity:     "tasks",
			ModelName:  "Task",
			Type:       EventTypeScheduled,
			PrimaryKey: task.ID,
			NewState:   modelToMap(&task),
			Source:     "scheduler",
		})
	}
}

func (e *Engine) markOverdueEmitted(id uint) bool {
	key := fmt.Sprint(id)
	e.cacheMu.Lock()
	defer e.cacheMu.Unlock()
	if _, exists := e.overdueCache[key]; exists {
		return false
	}
	e.overdueCache[key] = struct{}{}
	return true
}

func (e *Engine) clearOverdueMark(id string) {
	e.cacheMu.Lock()
	defer e.cacheMu.Unlock()
	delete(e.overdueCache, id)
}

func (e *Engine) updateOverdueCache(event Event) {
	if event.ModelName != "Task" {
		return
	}
	id := fmt.Sprint(event.PrimaryKey)
	if event.Type == EventTypeDeleted {
		e.clearOverdueMark(id)
		return
	}

	if event.NewState == nil {
		return
	}

	if !isTaskOverdue(event.NewState, 0) {
		e.clearOverdueMark(id)
	}
}

func decodeJSONMap(data map[string]interface{}, dest interface{}) error {
	if data == nil {
		data = map[string]interface{}{}
	}
	raw, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, dest)
}

// LeadStatusTriggerConfig describes the JSON payload for lead status triggers.
type LeadStatusTriggerConfig struct {
	Status string `json:"status"`
}

// TaskOverdueTriggerConfig describes the JSON payload for overdue task triggers.
type TaskOverdueTriggerConfig struct {
	GraceMinutes int `json:"graceMinutes"`
}

// FollowUpTaskActionConfig describes how follow-up tasks should be created.
type FollowUpTaskActionConfig struct {
	Title          string `json:"title"`
	Description    string `json:"description"`
	Owner          string `json:"owner"`
	DueInDays      int    `json:"dueInDays"`
	AccountID      *uint  `json:"accountId"`
	AccountIDField string `json:"accountIdField"`
	EmployeeID     *uint  `json:"employeeId"`
	ContactIDField string `json:"contactIdField"`
}

// ResolveAccountID determines which account ID should be associated to the follow-up task.
func (c FollowUpTaskActionConfig) ResolveAccountID(event Event) (uint, error) {
	if c.AccountID != nil {
		return *c.AccountID, nil
	}
	if c.AccountIDField != "" && event.NewState != nil {
		if value, ok := event.NewState[c.AccountIDField]; ok {
			switch v := value.(type) {
			case int:
				return uint(v), nil
			case int64:
				return uint(v), nil
			case float64:
				return uint(v), nil
			case uint:
				return v, nil
			}
		}
	}
	return 0, errors.New("follow-up task action requires an account reference")
}

// NotificationActionConfig describes simple notification payloads.
type NotificationActionConfig struct {
	Message string `json:"message"`
	Channel string `json:"channel"`
}

func modelToMap(value interface{}) map[string]interface{} {
	if value == nil {
		return nil
	}

	rv := reflect.ValueOf(value)
	if rv.Kind() == reflect.Pointer {
		if rv.IsNil() {
			return nil
		}
		rv = rv.Elem()
	}

	if !rv.IsValid() || rv.Kind() != reflect.Struct {
		return nil
	}

	rt := rv.Type()
	result := make(map[string]interface{})
	for i := 0; i < rt.NumField(); i++ {
		field := rt.Field(i)
		if !field.IsExported() || field.Anonymous {
			continue
		}
		fv := rv.Field(i)

		if !fv.IsValid() {
			continue
		}

		if fv.Kind() == reflect.Struct && field.Type != reflect.TypeOf(time.Time{}) {
			continue
		}

		if fv.Kind() == reflect.Pointer {
			if fv.IsNil() {
				result[field.Name] = nil
				continue
			}
			if fv.Type().Elem().Kind() == reflect.Struct && fv.Type().Elem() != reflect.TypeOf(time.Time{}) {
				continue
			}
			result[field.Name] = fv.Interface()
			continue
		}

		if fv.Kind() == reflect.Slice || fv.Kind() == reflect.Map {
			continue
		}

		result[field.Name] = fv.Interface()
	}

	return result
}

func isTaskOverdue(state map[string]interface{}, graceMinutes int) bool {
	if state == nil {
		return false
	}
	statusVal, hasStatus := state["Status"]
	if hasStatus {
		switch v := statusVal.(type) {
		case int64:
			if models.TaskStatus(v) == models.TaskStatusCompleted {
				return false
			}
		case int:
			if models.TaskStatus(v) == models.TaskStatusCompleted {
				return false
			}
		case float64:
			if models.TaskStatus(int(v)) == models.TaskStatusCompleted {
				return false
			}
		}
	}

	if completed, ok := state["CompletedAt"].(*time.Time); ok && completed != nil {
		return false
	}

	rawDue, ok := state["DueDate"]
	if !ok {
		return false
	}

	var due time.Time
	switch v := rawDue.(type) {
	case time.Time:
		due = v
	case string:
		parsed, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return false
		}
		due = parsed
	default:
		return false
	}

	grace := time.Duration(graceMinutes) * time.Minute
	if grace < 0 {
		grace = 0
	}

	return due.Add(grace).Before(time.Now().UTC())
}
