package analytics

import (
	"fmt"
	"math"
	"net/http"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/nlstn/go-odata"
	"github.com/nlstn/my-crm/backend/models"
	"gorm.io/gorm"
)

type Filter struct {
	StartDate *time.Time
	EndDate   *time.Time
	OwnerID   *uint
}

type PipelineStageMetric struct {
	Stage            string  `json:"Stage"`
	TotalValue       float64 `json:"TotalValue"`
	OpportunityCount int64   `json:"OpportunityCount"`
}

type IssueSLABreachMetric struct {
	Priority string `json:"Priority"`
	Count    int64  `json:"Count"`
}

type ActivityCompletionMetric struct {
	Type  string `json:"Type"`
	Count int64  `json:"Count"`
}

type ProductRevenueMetric struct {
	ProductID    uint    `json:"ProductID"`
	ProductName  string  `json:"ProductName"`
	DealCount    int64   `json:"DealCount"`
	TotalRevenue float64 `json:"TotalRevenue"`
}

type AtRiskAccountMetric struct {
	AccountID             uint       `json:"AccountID"`
	AccountName           string     `json:"AccountName"`
	OpenIssueCount        int64      `json:"OpenIssueCount"`
	DaysSinceLastActivity *int64     `json:"DaysSinceLastActivity"`
	LastActivityAt        *time.Time `json:"LastActivityAt"`
	RiskReasons           string     `json:"RiskReasons"`
}

var filterParameterDefinitions = []odata.ParameterDefinition{
	{Name: "startDate", Type: reflect.TypeOf(""), Required: false},
	{Name: "endDate", Type: reflect.TypeOf(""), Required: false},
	{Name: "ownerId", Type: reflect.TypeOf(int64(0)), Required: false},
}

// Register attaches the analytics OData functions to the provided service.
func Register(service *odata.Service, db *gorm.DB) error {
	registrars := []func(*odata.Service, *gorm.DB) error{
		registerPipelineFunction,
		registerIssueSLAFunction,
		registerActivitiesFunction,
		registerProductRevenueFunction,
		registerAtRiskAccountsFunction,
	}

	for _, registrar := range registrars {
		if err := registrar(service, db); err != nil {
			return err
		}
	}
	return nil
}

func registerPipelineFunction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterFunction(odata.FunctionDefinition{
		Name:       "GetPipelineValueByStage",
		IsBound:    false,
		Parameters: filterParameterDefinitions,
		ReturnType: reflect.TypeOf([]PipelineStageMetric{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) (interface{}, error) {
			filter, err := parseFilters(params)
			if err != nil {
				return nil, err
			}

			return computePipelineMetrics(db, filter)
		},
	})
}

func registerIssueSLAFunction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterFunction(odata.FunctionDefinition{
		Name:       "GetIssuesBreachingSLA",
		IsBound:    false,
		Parameters: filterParameterDefinitions,
		ReturnType: reflect.TypeOf([]IssueSLABreachMetric{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) (interface{}, error) {
			filter, err := parseFilters(params)
			if err != nil {
				return nil, err
			}

			return computeIssueSLAMetrics(db, filter)
		},
	})
}

func registerActivitiesFunction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterFunction(odata.FunctionDefinition{
		Name:       "GetActivitiesCompleted",
		IsBound:    false,
		Parameters: filterParameterDefinitions,
		ReturnType: reflect.TypeOf([]ActivityCompletionMetric{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) (interface{}, error) {
			filter, err := parseFilters(params)
			if err != nil {
				return nil, err
			}

			return computeActivityMetrics(db, filter)
		},
	})
}

func registerProductRevenueFunction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterFunction(odata.FunctionDefinition{
		Name:       "GetProductRevenue",
		IsBound:    false,
		Parameters: filterParameterDefinitions,
		ReturnType: reflect.TypeOf([]ProductRevenueMetric{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) (interface{}, error) {
			filter, err := parseFilters(params)
			if err != nil {
				return nil, err
			}

			return computeProductRevenueMetrics(db, filter)
		},
	})
}

func registerAtRiskAccountsFunction(service *odata.Service, db *gorm.DB) error {
	return service.RegisterFunction(odata.FunctionDefinition{
		Name:       "GetAtRiskAccounts",
		IsBound:    false,
		Parameters: filterParameterDefinitions,
		ReturnType: reflect.TypeOf([]AtRiskAccountMetric{}),
		Handler: func(w http.ResponseWriter, r *http.Request, ctx interface{}, params map[string]interface{}) (interface{}, error) {
			filter, err := parseFilters(params)
			if err != nil {
				return nil, err
			}

			return computeAtRiskAccounts(db, filter)
		},
	})
}

func parseFilters(params map[string]interface{}) (Filter, error) {
	filter := Filter{}

	if start, err := parseTimeParam(params["startDate"]); err != nil {
		return filter, fmt.Errorf("invalid startDate: %w", err)
	} else {
		filter.StartDate = start
	}

	if end, err := parseTimeParam(params["endDate"]); err != nil {
		return filter, fmt.Errorf("invalid endDate: %w", err)
	} else {
		filter.EndDate = end
	}

	if owner, err := parseUintParam(params["ownerId"]); err != nil {
		return filter, fmt.Errorf("invalid ownerId: %w", err)
	} else {
		filter.OwnerID = owner
	}

	return filter, nil
}

func parseTimeParam(value interface{}) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}

	switch v := value.(type) {
	case string:
		trimmed := strings.TrimSpace(v)
		if trimmed == "" {
			return nil, nil
		}
		parsed, err := time.Parse(time.RFC3339, trimmed)
		if err != nil {
			return nil, err
		}
		parsed = parsed.UTC()
		return &parsed, nil
	case time.Time:
		t := v.UTC()
		return &t, nil
	case *time.Time:
		if v == nil {
			return nil, nil
		}
		t := v.UTC()
		return &t, nil
	default:
		return nil, fmt.Errorf("unsupported time parameter type %T", value)
	}
}

func parseUintParam(value interface{}) (*uint, error) {
	if value == nil {
		return nil, nil
	}

	switch v := value.(type) {
	case uint:
		copy := v
		return &copy, nil
	case uint64:
		copy := uint(v)
		return &copy, nil
	case int:
		if v < 0 {
			return nil, fmt.Errorf("expected positive integer")
		}
		copy := uint(v)
		return &copy, nil
	case int64:
		if v < 0 {
			return nil, fmt.Errorf("expected positive integer")
		}
		copy := uint(v)
		return &copy, nil
	case float64:
		if v < 0 {
			return nil, fmt.Errorf("expected positive integer")
		}
		if math.Mod(v, 1) != 0 {
			return nil, fmt.Errorf("expected whole number value")
		}
		copy := uint(v)
		return &copy, nil
	case string:
		trimmed := strings.TrimSpace(v)
		if trimmed == "" {
			return nil, nil
		}
		parsed, err := strconv.ParseUint(trimmed, 10, 64)
		if err != nil {
			return nil, err
		}
		copy := uint(parsed)
		return &copy, nil
	default:
		return nil, fmt.Errorf("unsupported numeric parameter type %T", value)
	}
}

func computePipelineMetrics(db *gorm.DB, filter Filter) ([]PipelineStageMetric, error) {
	type result struct {
		Stage string
		Value float64
		Count int64
	}

	query := db.Model(&models.Opportunity{}).
		Select("stage, COALESCE(SUM(amount), 0) AS value, COUNT(*) AS count")

	if filter.OwnerID != nil {
		query = query.Where("employee_id = ?", *filter.OwnerID)
	}
	if filter.StartDate != nil {
		query = query.Where("COALESCE(expected_close_date, created_at) >= ?", *filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("COALESCE(expected_close_date, created_at) <= ?", *filter.EndDate)
	}

	var rows []result
	if err := query.Group("stage").Scan(&rows).Error; err != nil {
		return nil, err
	}

	stageOrder := map[string]int{
		string(models.OpportunityStageProspecting):   0,
		string(models.OpportunityStageQualification): 1,
		string(models.OpportunityStageProposal):      2,
		string(models.OpportunityStageNegotiation):   3,
		string(models.OpportunityStageClosedWon):     4,
		string(models.OpportunityStageClosedLost):    5,
	}

	metrics := make([]PipelineStageMetric, len(rows))
	for i, row := range rows {
		metrics[i] = PipelineStageMetric{
			Stage:            row.Stage,
			TotalValue:       row.Value,
			OpportunityCount: row.Count,
		}
	}

	sort.Slice(metrics, func(i, j int) bool {
		left, okLeft := stageOrder[metrics[i].Stage]
		right, okRight := stageOrder[metrics[j].Stage]
		if !okLeft {
			left = 99
		}
		if !okRight {
			right = 99
		}
		if left == right {
			return metrics[i].Stage < metrics[j].Stage
		}
		return left < right
	})

	return metrics, nil
}

func computeIssueSLAMetrics(db *gorm.DB, filter Filter) ([]IssueSLABreachMetric, error) {
	type result struct {
		Priority int64
		Count    int64
	}

	now := time.Now().UTC()
	query := db.Model(&models.Issue{}).
		Select("priority, COUNT(*) AS count").
		Where("status NOT IN (?, ?)", models.IssueStatusResolved, models.IssueStatusClosed).
		Where("due_date IS NOT NULL AND due_date < ?", now)

	if filter.OwnerID != nil {
		query = query.Where("employee_id = ?", *filter.OwnerID)
	}
	if filter.StartDate != nil {
		query = query.Where("due_date >= ?", *filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("due_date <= ?", *filter.EndDate)
	}

	var rows []result
	if err := query.Group("priority").Scan(&rows).Error; err != nil {
		return nil, err
	}

	sort.Slice(rows, func(i, j int) bool {
		return rows[i].Priority > rows[j].Priority
	})

	metrics := make([]IssueSLABreachMetric, len(rows))
	for i, row := range rows {
		metrics[i] = IssueSLABreachMetric{
			Priority: models.IssuePriority(row.Priority).String(),
			Count:    row.Count,
		}
	}

	return metrics, nil
}

func computeActivityMetrics(db *gorm.DB, filter Filter) ([]ActivityCompletionMetric, error) {
	type result struct {
		ActivityType string
		Count        int64
	}

	query := db.Model(&models.Activity{}).
		Select("activity_type, COUNT(*) AS count").
		Where("completed = ?", true)

	if filter.OwnerID != nil {
		query = query.Where("employee_id = ?", *filter.OwnerID)
	}
	if filter.StartDate != nil {
		query = query.Where("completed_at >= ?", *filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("completed_at <= ?", *filter.EndDate)
	}

	var rows []result
	if err := query.Group("activity_type").Scan(&rows).Error; err != nil {
		return nil, err
	}

	sort.Slice(rows, func(i, j int) bool {
		return rows[i].Count > rows[j].Count
	})

	metrics := make([]ActivityCompletionMetric, len(rows))
	for i, row := range rows {
		metrics[i] = ActivityCompletionMetric{
			Type:  row.ActivityType,
			Count: row.Count,
		}
	}

	return metrics, nil
}

func computeProductRevenueMetrics(db *gorm.DB, filter Filter) ([]ProductRevenueMetric, error) {
	type result struct {
		ProductID    uint
		ProductName  string
		DealCount    int64
		TotalRevenue float64
	}

	query := db.Model(&models.Opportunity{}).
		Joins("JOIN products ON products.id = opportunities.product_id").
		Select("products.id AS product_id, products.name AS product_name, COUNT(opportunities.id) AS deal_count, COALESCE(SUM(opportunities.amount), 0) AS total_revenue").
		Where("opportunities.stage = ?", models.OpportunityStageClosedWon)

	if filter.OwnerID != nil {
		query = query.Where("opportunities.employee_id = ?", *filter.OwnerID)
	}
	if filter.StartDate != nil {
		query = query.Where("COALESCE(opportunities.closed_at, opportunities.expected_close_date) >= ?", *filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("COALESCE(opportunities.closed_at, opportunities.expected_close_date) <= ?", *filter.EndDate)
	}

	var rows []result
	if err := query.Group("products.id, products.name").Order("total_revenue DESC").Scan(&rows).Error; err != nil {
		return nil, err
	}

	metrics := make([]ProductRevenueMetric, len(rows))
	for i, row := range rows {
		metrics[i] = ProductRevenueMetric{
			ProductID:    row.ProductID,
			ProductName:  row.ProductName,
			DealCount:    row.DealCount,
			TotalRevenue: row.TotalRevenue,
		}
	}

	return metrics, nil
}

func computeAtRiskAccounts(db *gorm.DB, filter Filter) ([]AtRiskAccountMetric, error) {
	type result struct {
		AccountID      uint
		AccountName    string
		OwnerID        *uint
		OpenIssueCount int64
		LastActivityAt *time.Time
	}

	openIssues := db.Table("issues").
		Select("account_id, COUNT(*) AS open_issue_count").
		Where("status NOT IN (?, ?)", models.IssueStatusResolved, models.IssueStatusClosed).
		Group("account_id")

	activitySummary := db.Table("activities").
		Select("account_id, MAX(completed_at) AS last_activity_at").
		Where("completed = ?", true).
		Group("account_id")

	query := db.Table("accounts AS a").
		Select("a.id AS account_id, a.name AS account_name, a.employee_id AS owner_id, COALESCE(open_issues.open_issue_count, 0) AS open_issue_count, activity_summary.last_activity_at").
		Joins("LEFT JOIN (?) AS open_issues ON open_issues.account_id = a.id", openIssues).
		Joins("LEFT JOIN (?) AS activity_summary ON activity_summary.account_id = a.id", activitySummary)

	if filter.OwnerID != nil {
		query = query.Where("a.employee_id = ?", *filter.OwnerID)
	}

	var rows []result
	if err := query.Scan(&rows).Error; err != nil {
		return nil, err
	}

	inactivityThreshold := time.Now().UTC().AddDate(0, 0, -30)
	if filter.StartDate != nil {
		inactivityThreshold = filter.StartDate.UTC()
	}

	metrics := make([]AtRiskAccountMetric, 0)
	for _, row := range rows {
		var reasons []string
		if row.OpenIssueCount >= 3 {
			reasons = append(reasons, "Many open issues")
		}

		var days *int64
		if row.LastActivityAt != nil {
			lastActivity := row.LastActivityAt.UTC()
			diffDays := int64(time.Since(lastActivity).Hours() / 24)
			if diffDays < 0 {
				diffDays = 0
			}
			days = &diffDays
			if lastActivity.Before(inactivityThreshold) {
				reasons = append(reasons, fmt.Sprintf("No activity in %d days", diffDays))
			}
		} else {
			reasons = append(reasons, "No recorded activities")
			diffDays := int64(time.Since(inactivityThreshold).Hours() / 24)
			if diffDays < 0 {
				diffDays = 0
			}
			days = &diffDays
		}

		if len(reasons) == 0 {
			continue
		}

		metric := AtRiskAccountMetric{
			AccountID:             row.AccountID,
			AccountName:           row.AccountName,
			OpenIssueCount:        row.OpenIssueCount,
			DaysSinceLastActivity: days,
			LastActivityAt:        row.LastActivityAt,
			RiskReasons:           strings.Join(reasons, ", "),
		}
		metrics = append(metrics, metric)
	}

	sort.Slice(metrics, func(i, j int) bool {
		if metrics[i].OpenIssueCount == metrics[j].OpenIssueCount {
			var leftDays, rightDays int64
			if metrics[i].DaysSinceLastActivity != nil {
				leftDays = *metrics[i].DaysSinceLastActivity
			}
			if metrics[j].DaysSinceLastActivity != nil {
				rightDays = *metrics[j].DaysSinceLastActivity
			}
			return leftDays > rightDays
		}
		return metrics[i].OpenIssueCount > metrics[j].OpenIssueCount
	})

	if len(metrics) > 10 {
		metrics = metrics[:10]
	}

	return metrics, nil
}
