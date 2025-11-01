package database

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/nlstn/my-crm/backend/models"
)

// RowError represents a validation error that occurred while parsing a CSV row.
type RowError struct {
	Row     int    `json:"row"`
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e RowError) Error() string {
	return fmt.Sprintf("row %d (%s): %s", e.Row, e.Field, e.Message)
}

var (
	accountHeaders = []string{
		"Name",
		"Industry",
		"Website",
		"Phone",
		"Email",
		"Address",
		"City",
		"State",
		"Country",
		"PostalCode",
		"Description",
		"EmployeeID",
	}

	contactHeaders = []string{
		"AccountID",
		"FirstName",
		"LastName",
		"Title",
		"Email",
		"Phone",
		"Mobile",
		"IsPrimary",
		"Notes",
	}

	leadHeaders = []string{
		"Name",
		"Email",
		"Phone",
		"Company",
		"Title",
		"Website",
		"Source",
		"Status",
		"Notes",
		"OwnerEmployeeID",
	}

	activityHeaders = []string{
		"AccountID",
		"LeadID",
		"ContactID",
		"EmployeeID",
		"OpportunityID",
		"ActivityType",
		"Subject",
		"Outcome",
		"Notes",
		"ActivityTime",
	}

	issueHeaders = []string{
		"AccountID",
		"ContactID",
		"Title",
		"Description",
		"Status",
		"Priority",
		"AssignedTo",
		"Resolution",
		"EmployeeID",
		"DueDate",
		"ResolvedAt",
	}

	taskHeaders = []string{
		"AccountID",
		"LeadID",
		"ContactID",
		"EmployeeID",
		"OpportunityID",
		"Title",
		"Description",
		"Owner",
		"Status",
		"DueDate",
		"CompletedAt",
	}

	opportunityHeaders = []string{
		"AccountID",
		"ContactID",
		"OwnerEmployeeID",
		"Name",
		"Amount",
		"Probability",
		"ExpectedCloseDate",
		"Stage",
		"Description",
		"ClosedAt",
		"CloseReason",
		"ClosedByEmployeeID",
	}

	opportunityLineItemHeaders = []string{
		"OpportunityID",
		"ProductID",
		"Quantity",
		"UnitPrice",
		"DiscountAmount",
		"DiscountPercent",
	}

	employeeHeaders = []string{
		"FirstName",
		"LastName",
		"Email",
		"Phone",
		"Department",
		"Position",
		"HireDate",
		"Notes",
	}

	productHeaders = []string{
		"Name",
		"SKU",
		"Category",
		"Description",
		"Price",
		"Cost",
		"Stock",
		"IsActive",
	}

	issueStatusByName = map[string]models.IssueStatus{
		"new":        models.IssueStatusNew,
		"inprogress": models.IssueStatusInProgress,
		"pending":    models.IssueStatusPending,
		"resolved":   models.IssueStatusResolved,
		"closed":     models.IssueStatusClosed,
	}

	issuePriorityByName = map[string]models.IssuePriority{
		"low":      models.IssuePriorityLow,
		"medium":   models.IssuePriorityMedium,
		"high":     models.IssuePriorityHigh,
		"critical": models.IssuePriorityCritical,
	}

	taskStatusByName = map[string]models.TaskStatus{
		"notstarted": models.TaskStatusNotStarted,
		"inprogress": models.TaskStatusInProgress,
		"completed":  models.TaskStatusCompleted,
		"deferred":   models.TaskStatusDeferred,
		"cancelled":  models.TaskStatusCancelled,
	}

	opportunityStageByName = map[string]models.OpportunityStage{
		"prospecting":   models.OpportunityStageProspecting,
		"qualification": models.OpportunityStageQualification,
		"needsanalysis": models.OpportunityStageNeedsAnalysis,
		"proposal":      models.OpportunityStageProposal,
		"negotiation":   models.OpportunityStageNegotiation,
		"closedwon":     models.OpportunityStageClosedWon,
		"closedlost":    models.OpportunityStageClosedLost,
	}
)

func readCSV(reader io.Reader) ([]string, [][]string, error) {
	csvReader := csv.NewReader(reader)
	csvReader.TrimLeadingSpace = true

	records, err := csvReader.ReadAll()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse CSV: %w", err)
	}
	if len(records) == 0 {
		return nil, nil, fmt.Errorf("CSV file is empty")
	}

	headers := make([]string, len(records[0]))
	copy(headers, records[0])

	return headers, records[1:], nil
}

func indexHeaders(headers []string) map[string]int {
	index := make(map[string]int, len(headers))
	for i, header := range headers {
		normalized := strings.TrimSpace(header)
		if normalized != "" {
			index[normalized] = i
		}
	}
	return index
}

func valueFor(row []string, headerIndex map[string]int, key string) string {
	idx, ok := headerIndex[key]
	if !ok || idx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[idx])
}

func parseOptionalUint(value string) (*uint, *RowError) {
	if value == "" {
		return nil, nil
	}

	parsed, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return nil, &RowError{Field: "ID", Message: "must be a positive whole number"}
	}
	if parsed == 0 {
		return nil, &RowError{Field: "ID", Message: "must be greater than zero"}
	}
	cast := uint(parsed)
	return &cast, nil
}

func parseRequiredUint(value string, field string) (uint, *RowError) {
	if value == "" {
		return 0, &RowError{Field: field, Message: "is required"}
	}
	parsed, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, &RowError{Field: field, Message: "must be a positive whole number"}
	}
	if parsed == 0 {
		return 0, &RowError{Field: field, Message: "must be greater than zero"}
	}
	return uint(parsed), nil
}

func parseOptionalBool(value string, field string) (*bool, *RowError) {
	if value == "" {
		return nil, nil
	}
	lower := strings.ToLower(value)
	switch lower {
	case "true", "1", "yes", "y":
		result := true
		return &result, nil
	case "false", "0", "no", "n":
		result := false
		return &result, nil
	default:
		return nil, &RowError{Field: field, Message: "must be true or false"}
	}
}

func parseRequiredFloat(value string, field string) (float64, *RowError) {
	if value == "" {
		return 0, &RowError{Field: field, Message: "is required"}
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0, &RowError{Field: field, Message: "must be a valid number"}
	}
	return parsed, nil
}

func parseOptionalFloat(value string, field string) (float64, *RowError) {
	if value == "" {
		return 0, nil
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0, &RowError{Field: field, Message: "must be a valid number"}
	}
	return parsed, nil
}

func parseRequiredInt(value string, field string) (int, *RowError) {
	if value == "" {
		return 0, &RowError{Field: field, Message: "is required"}
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, &RowError{Field: field, Message: "must be a whole number"}
	}
	return parsed, nil
}

func parseOptionalInt(value string, field string) (int, *RowError) {
	if value == "" {
		return 0, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, &RowError{Field: field, Message: "must be a whole number"}
	}
	return parsed, nil
}

func parseRequiredTime(value string, field string) (time.Time, *RowError) {
	if value == "" {
		return time.Time{}, &RowError{Field: field, Message: "is required"}
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}, &RowError{Field: field, Message: "must be in RFC3339 format"}
	}
	return parsed.UTC(), nil
}

func parseOptionalTime(value string, field string) (*time.Time, *RowError) {
	if value == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil, &RowError{Field: field, Message: "must be in RFC3339 format"}
	}
	result := parsed.UTC()
	return &result, nil
}

func ParseAccountsCSV(reader io.Reader) ([]models.Account, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	if _, ok := headerIndex["Name"]; !ok {
		return nil, nil, nil, fmt.Errorf("CSV is missing required header: Name")
	}

	var (
		accounts   []models.Account
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2 // account for header row
		name := valueFor(row, headerIndex, "Name")
		if name == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Name", Message: "is required"})
			continue
		}

		account := models.Account{
			Name:        name,
			Industry:    valueFor(row, headerIndex, "Industry"),
			Website:     valueFor(row, headerIndex, "Website"),
			Phone:       valueFor(row, headerIndex, "Phone"),
			Email:       valueFor(row, headerIndex, "Email"),
			Address:     valueFor(row, headerIndex, "Address"),
			City:        valueFor(row, headerIndex, "City"),
			State:       valueFor(row, headerIndex, "State"),
			Country:     valueFor(row, headerIndex, "Country"),
			PostalCode:  valueFor(row, headerIndex, "PostalCode"),
			Description: valueFor(row, headerIndex, "Description"),
		}

		if employeeIDValue := valueFor(row, headerIndex, "EmployeeID"); employeeIDValue != "" {
			employeeID, parseErr := parseOptionalUint(employeeIDValue)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "EmployeeID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			account.EmployeeID = employeeID
		}

		accounts = append(accounts, account)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return accounts, rowNumbers, rowErrors, nil
}

func AccountsToCSV(accounts []models.Account) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(accountHeaders); err != nil {
		return nil, err
	}

	for _, account := range accounts {
		record := []string{
			account.Name,
			account.Industry,
			account.Website,
			account.Phone,
			account.Email,
			account.Address,
			account.City,
			account.State,
			account.Country,
			account.PostalCode,
			account.Description,
			uintPointerToString(account.EmployeeID),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseContactsCSV(reader io.Reader) ([]models.Contact, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"AccountID", "FirstName", "LastName"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		contacts   []models.Contact
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		accountIDValue := valueFor(row, headerIndex, "AccountID")
		accountID, parseErr := parseRequiredUint(accountIDValue, "AccountID")
		if parseErr != nil {
			parseErr.Row = currentRow
			rowErrors = append(rowErrors, *parseErr)
			continue
		}

		firstName := valueFor(row, headerIndex, "FirstName")
		if firstName == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "FirstName", Message: "is required"})
			continue
		}

		lastName := valueFor(row, headerIndex, "LastName")
		if lastName == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "LastName", Message: "is required"})
			continue
		}

		isPrimary := false
		if isPrimaryValue := valueFor(row, headerIndex, "IsPrimary"); isPrimaryValue != "" {
			parsed, boolErr := parseOptionalBool(isPrimaryValue, "IsPrimary")
			if boolErr != nil {
				boolErr.Row = currentRow
				rowErrors = append(rowErrors, *boolErr)
				continue
			}
			if parsed != nil {
				isPrimary = *parsed
			}
		}

		contact := models.Contact{
			AccountID: accountID,
			FirstName: firstName,
			LastName:  lastName,
			Title:     valueFor(row, headerIndex, "Title"),
			Email:     valueFor(row, headerIndex, "Email"),
			Phone:     valueFor(row, headerIndex, "Phone"),
			Mobile:    valueFor(row, headerIndex, "Mobile"),
			IsPrimary: isPrimary,
			Notes:     valueFor(row, headerIndex, "Notes"),
		}

		contacts = append(contacts, contact)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return contacts, rowNumbers, rowErrors, nil
}

func ContactsToCSV(contacts []models.Contact) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(contactHeaders); err != nil {
		return nil, err
	}

	for _, contact := range contacts {
		record := []string{
			strconv.FormatUint(uint64(contact.AccountID), 10),
			contact.FirstName,
			contact.LastName,
			contact.Title,
			contact.Email,
			contact.Phone,
			contact.Mobile,
			strconv.FormatBool(contact.IsPrimary),
			contact.Notes,
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseLeadsCSV(reader io.Reader) ([]models.Lead, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	if _, ok := headerIndex["Name"]; !ok {
		return nil, nil, nil, fmt.Errorf("CSV is missing required header: Name")
	}

	validStatuses := map[string]models.LeadStatus{
		"New":          models.LeadStatusNew,
		"Contacted":    models.LeadStatusContacted,
		"Qualified":    models.LeadStatusQualified,
		"Converted":    models.LeadStatusConverted,
		"Disqualified": models.LeadStatusDisqualified,
	}

	var (
		leads      []models.Lead
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		name := valueFor(row, headerIndex, "Name")
		if name == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Name", Message: "is required"})
			continue
		}

		lead := models.Lead{
			Name:    name,
			Email:   valueFor(row, headerIndex, "Email"),
			Phone:   valueFor(row, headerIndex, "Phone"),
			Company: valueFor(row, headerIndex, "Company"),
			Title:   valueFor(row, headerIndex, "Title"),
			Website: valueFor(row, headerIndex, "Website"),
			Source:  valueFor(row, headerIndex, "Source"),
			Notes:   valueFor(row, headerIndex, "Notes"),
		}

		if statusValue := valueFor(row, headerIndex, "Status"); statusValue != "" {
			if status, ok := validStatuses[statusValue]; ok {
				lead.Status = status
			} else {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Status", Message: "must be one of New, Contacted, Qualified, Converted, Disqualified"})
				continue
			}
		}

		if ownerValue := valueFor(row, headerIndex, "OwnerEmployeeID"); ownerValue != "" {
			ownerID, parseErr := parseOptionalUint(ownerValue)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "OwnerEmployeeID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			lead.OwnerEmployeeID = ownerID
		}

		leads = append(leads, lead)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return leads, rowNumbers, rowErrors, nil
}

func LeadsToCSV(leads []models.Lead) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(leadHeaders); err != nil {
		return nil, err
	}

	for _, lead := range leads {
		record := []string{
			lead.Name,
			lead.Email,
			lead.Phone,
			lead.Company,
			lead.Title,
			lead.Website,
			lead.Source,
			string(lead.Status),
			lead.Notes,
			uintPointerToString(lead.OwnerEmployeeID),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseActivitiesCSV(reader io.Reader) ([]models.Activity, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"ActivityType", "Subject", "ActivityTime"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		activities []models.Activity
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		var accountID *uint
		if value := valueFor(row, headerIndex, "AccountID"); value != "" {
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "AccountID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			accountID = parsed
		}

		var leadID *uint
		if value := valueFor(row, headerIndex, "LeadID"); value != "" {
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "LeadID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			leadID = parsed
		}

		if accountID == nil && leadID == nil {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "AccountID", Message: "either AccountID or LeadID is required"})
			continue
		}

		var contactID *uint
		if value := valueFor(row, headerIndex, "ContactID"); value != "" {
			if accountID == nil {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "ContactID", Message: "ContactID can only be set when AccountID is provided"})
				continue
			}
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "ContactID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			contactID = parsed
		}

		var employeeID *uint
		if value := valueFor(row, headerIndex, "EmployeeID"); value != "" {
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "EmployeeID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			employeeID = parsed
		}

		var opportunityID *uint
		if value := valueFor(row, headerIndex, "OpportunityID"); value != "" {
			if accountID == nil {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "OpportunityID", Message: "OpportunityID can only be set when AccountID is provided"})
				continue
			}
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "OpportunityID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			opportunityID = parsed
		}

		activityType := valueFor(row, headerIndex, "ActivityType")
		if activityType == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "ActivityType", Message: "is required"})
			continue
		}

		subject := valueFor(row, headerIndex, "Subject")
		if subject == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Subject", Message: "is required"})
			continue
		}

		activityTime, timeErr := parseRequiredTime(valueFor(row, headerIndex, "ActivityTime"), "ActivityTime")
		if timeErr != nil {
			timeErr.Row = currentRow
			rowErrors = append(rowErrors, *timeErr)
			continue
		}

		activity := models.Activity{
			AccountID:     accountID,
			LeadID:        leadID,
			ContactID:     contactID,
			EmployeeID:    employeeID,
			OpportunityID: opportunityID,
			ActivityType:  activityType,
			Subject:       subject,
			Outcome:       valueFor(row, headerIndex, "Outcome"),
			Notes:         valueFor(row, headerIndex, "Notes"),
			ActivityTime:  activityTime,
		}

		activities = append(activities, activity)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return activities, rowNumbers, rowErrors, nil
}

func ActivitiesToCSV(activities []models.Activity) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(activityHeaders); err != nil {
		return nil, err
	}

	for _, activity := range activities {
		record := []string{
			uintPointerToString(activity.AccountID),
			uintPointerToString(activity.LeadID),
			uintPointerToString(activity.ContactID),
			uintPointerToString(activity.EmployeeID),
			uintPointerToString(activity.OpportunityID),
			activity.ActivityType,
			activity.Subject,
			activity.Outcome,
			activity.Notes,
			activity.ActivityTime.UTC().Format(time.RFC3339),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseIssuesCSV(reader io.Reader) ([]models.Issue, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"AccountID", "Title"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		issues     []models.Issue
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		accountIDValue := valueFor(row, headerIndex, "AccountID")
		accountID, parseErr := parseRequiredUint(accountIDValue, "AccountID")
		if parseErr != nil {
			parseErr.Row = currentRow
			rowErrors = append(rowErrors, *parseErr)
			continue
		}

		var contactID *uint
		if value := valueFor(row, headerIndex, "ContactID"); value != "" {
			parsed, err := parseOptionalUint(value)
			if err != nil {
				err.Row = currentRow
				err.Field = "ContactID"
				rowErrors = append(rowErrors, *err)
				continue
			}
			contactID = parsed
		}

		title := valueFor(row, headerIndex, "Title")
		if title == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Title", Message: "is required"})
			continue
		}

		status := models.IssueStatusNew
		if value := valueFor(row, headerIndex, "Status"); value != "" {
			if parsed, ok := issueStatusByName[strings.ToLower(value)]; ok {
				status = parsed
			} else {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Status", Message: "must be one of New, InProgress, Pending, Resolved, Closed"})
				continue
			}
		}

		priority := models.IssuePriorityMedium
		if value := valueFor(row, headerIndex, "Priority"); value != "" {
			if parsed, ok := issuePriorityByName[strings.ToLower(value)]; ok {
				priority = parsed
			} else {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Priority", Message: "must be one of Low, Medium, High, Critical"})
				continue
			}
		}

		var employeeID *uint
		if value := valueFor(row, headerIndex, "EmployeeID"); value != "" {
			parsed, err := parseOptionalUint(value)
			if err != nil {
				err.Row = currentRow
				err.Field = "EmployeeID"
				rowErrors = append(rowErrors, *err)
				continue
			}
			employeeID = parsed
		}

		dueDate, dueErr := parseOptionalTime(valueFor(row, headerIndex, "DueDate"), "DueDate")
		if dueErr != nil {
			dueErr.Row = currentRow
			rowErrors = append(rowErrors, *dueErr)
			continue
		}

		resolvedAt, resolvedErr := parseOptionalTime(valueFor(row, headerIndex, "ResolvedAt"), "ResolvedAt")
		if resolvedErr != nil {
			resolvedErr.Row = currentRow
			rowErrors = append(rowErrors, *resolvedErr)
			continue
		}

		issue := models.Issue{
			AccountID:   accountID,
			ContactID:   contactID,
			Title:       title,
			Description: valueFor(row, headerIndex, "Description"),
			Status:      status,
			Priority:    priority,
			AssignedTo:  valueFor(row, headerIndex, "AssignedTo"),
			Resolution:  valueFor(row, headerIndex, "Resolution"),
			EmployeeID:  employeeID,
			DueDate:     dueDate,
			ResolvedAt:  resolvedAt,
		}

		issues = append(issues, issue)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return issues, rowNumbers, rowErrors, nil
}

func IssuesToCSV(issues []models.Issue) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(issueHeaders); err != nil {
		return nil, err
	}

	for _, issue := range issues {
		record := []string{
			strconv.FormatUint(uint64(issue.AccountID), 10),
			uintPointerToString(issue.ContactID),
			issue.Title,
			issue.Description,
			issue.Status.String(),
			issue.Priority.String(),
			issue.AssignedTo,
			issue.Resolution,
			uintPointerToString(issue.EmployeeID),
			timePointerToString(issue.DueDate),
			timePointerToString(issue.ResolvedAt),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseTasksCSV(reader io.Reader) ([]models.Task, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"Title", "Owner", "DueDate"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		tasks      []models.Task
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		var accountID *uint
		if value := valueFor(row, headerIndex, "AccountID"); value != "" {
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "AccountID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			accountID = parsed
		}

		var leadID *uint
		if value := valueFor(row, headerIndex, "LeadID"); value != "" {
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "LeadID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			leadID = parsed
		}

		if accountID == nil && leadID == nil {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "AccountID", Message: "either AccountID or LeadID is required"})
			continue
		}

		var contactID *uint
		if value := valueFor(row, headerIndex, "ContactID"); value != "" {
			if accountID == nil {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "ContactID", Message: "ContactID can only be set when AccountID is provided"})
				continue
			}
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "ContactID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			contactID = parsed
		}

		var employeeID *uint
		if value := valueFor(row, headerIndex, "EmployeeID"); value != "" {
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "EmployeeID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			employeeID = parsed
		}

		var opportunityID *uint
		if value := valueFor(row, headerIndex, "OpportunityID"); value != "" {
			if accountID == nil {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "OpportunityID", Message: "OpportunityID can only be set when AccountID is provided"})
				continue
			}
			parsed, parseErr := parseOptionalUint(value)
			if parseErr != nil {
				parseErr.Row = currentRow
				parseErr.Field = "OpportunityID"
				rowErrors = append(rowErrors, *parseErr)
				continue
			}
			opportunityID = parsed
		}

		title := valueFor(row, headerIndex, "Title")
		if title == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Title", Message: "is required"})
			continue
		}

		owner := valueFor(row, headerIndex, "Owner")
		if owner == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Owner", Message: "is required"})
			continue
		}

		status := models.TaskStatusNotStarted
		if value := valueFor(row, headerIndex, "Status"); value != "" {
			if parsed, ok := taskStatusByName[strings.ToLower(value)]; ok {
				status = parsed
			} else {
				rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Status", Message: "must be one of NotStarted, InProgress, Completed, Deferred, Cancelled"})
				continue
			}
		}

		dueDate, dueErr := parseRequiredTime(valueFor(row, headerIndex, "DueDate"), "DueDate")
		if dueErr != nil {
			dueErr.Row = currentRow
			rowErrors = append(rowErrors, *dueErr)
			continue
		}

		completedAt, completedErr := parseOptionalTime(valueFor(row, headerIndex, "CompletedAt"), "CompletedAt")
		if completedErr != nil {
			completedErr.Row = currentRow
			rowErrors = append(rowErrors, *completedErr)
			continue
		}

		task := models.Task{
			AccountID:     accountID,
			LeadID:        leadID,
			ContactID:     contactID,
			EmployeeID:    employeeID,
			OpportunityID: opportunityID,
			Title:         title,
			Description:   valueFor(row, headerIndex, "Description"),
			Owner:         owner,
			Status:        status,
			DueDate:       dueDate,
			CompletedAt:   completedAt,
		}

		tasks = append(tasks, task)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return tasks, rowNumbers, rowErrors, nil
}

func TasksToCSV(tasks []models.Task) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(taskHeaders); err != nil {
		return nil, err
	}

	for _, task := range tasks {
		record := []string{
			uintPointerToString(task.AccountID),
			uintPointerToString(task.LeadID),
			uintPointerToString(task.ContactID),
			uintPointerToString(task.EmployeeID),
			uintPointerToString(task.OpportunityID),
			task.Title,
			task.Description,
			task.Owner,
			task.Status.String(),
			task.DueDate.UTC().Format(time.RFC3339),
			timePointerToString(task.CompletedAt),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseOpportunitiesCSV(reader io.Reader) ([]models.Opportunity, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"AccountID", "Name", "Amount", "Probability", "Stage"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		opportunities []models.Opportunity
		rowErrors     []RowError
		rowNumbers    []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		accountIDValue := valueFor(row, headerIndex, "AccountID")
		accountID, parseErr := parseRequiredUint(accountIDValue, "AccountID")
		if parseErr != nil {
			parseErr.Row = currentRow
			rowErrors = append(rowErrors, *parseErr)
			continue
		}

		var contactID *uint
		if value := valueFor(row, headerIndex, "ContactID"); value != "" {
			parsed, err := parseOptionalUint(value)
			if err != nil {
				err.Row = currentRow
				err.Field = "ContactID"
				rowErrors = append(rowErrors, *err)
				continue
			}
			contactID = parsed
		}

		var ownerEmployeeID *uint
		if value := valueFor(row, headerIndex, "OwnerEmployeeID"); value != "" {
			parsed, err := parseOptionalUint(value)
			if err != nil {
				err.Row = currentRow
				err.Field = "OwnerEmployeeID"
				rowErrors = append(rowErrors, *err)
				continue
			}
			ownerEmployeeID = parsed
		}

		name := valueFor(row, headerIndex, "Name")
		if name == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Name", Message: "is required"})
			continue
		}

		amount, amountErr := parseRequiredFloat(valueFor(row, headerIndex, "Amount"), "Amount")
		if amountErr != nil {
			amountErr.Row = currentRow
			rowErrors = append(rowErrors, *amountErr)
			continue
		}

		probability, probErr := parseRequiredInt(valueFor(row, headerIndex, "Probability"), "Probability")
		if probErr != nil {
			probErr.Row = currentRow
			rowErrors = append(rowErrors, *probErr)
			continue
		}
		if probability < 0 || probability > 100 {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Probability", Message: "must be between 0 and 100"})
			continue
		}

		stageValue := valueFor(row, headerIndex, "Stage")
		stage, ok := opportunityStageByName[strings.ToLower(stageValue)]
		if !ok {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Stage", Message: "must be a valid opportunity stage"})
			continue
		}

		expectedCloseDate, expectedErr := parseOptionalTime(valueFor(row, headerIndex, "ExpectedCloseDate"), "ExpectedCloseDate")
		if expectedErr != nil {
			expectedErr.Row = currentRow
			rowErrors = append(rowErrors, *expectedErr)
			continue
		}

		closedAt, closedAtErr := parseOptionalTime(valueFor(row, headerIndex, "ClosedAt"), "ClosedAt")
		if closedAtErr != nil {
			closedAtErr.Row = currentRow
			rowErrors = append(rowErrors, *closedAtErr)
			continue
		}

		var closedByEmployeeID *uint
		if value := valueFor(row, headerIndex, "ClosedByEmployeeID"); value != "" {
			parsed, err := parseOptionalUint(value)
			if err != nil {
				err.Row = currentRow
				err.Field = "ClosedByEmployeeID"
				rowErrors = append(rowErrors, *err)
				continue
			}
			closedByEmployeeID = parsed
		}

		opportunity := models.Opportunity{
			AccountID:          accountID,
			ContactID:          contactID,
			OwnerEmployeeID:    ownerEmployeeID,
			Name:               name,
			Amount:             amount,
			Probability:        probability,
			ExpectedCloseDate:  expectedCloseDate,
			Stage:              stage,
			Description:        valueFor(row, headerIndex, "Description"),
			ClosedAt:           closedAt,
			CloseReason:        valueFor(row, headerIndex, "CloseReason"),
			ClosedByEmployeeID: closedByEmployeeID,
		}

		opportunities = append(opportunities, opportunity)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return opportunities, rowNumbers, rowErrors, nil
}

func OpportunitiesToCSV(opportunities []models.Opportunity) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(opportunityHeaders); err != nil {
		return nil, err
	}

	for _, opportunity := range opportunities {
		record := []string{
			strconv.FormatUint(uint64(opportunity.AccountID), 10),
			uintPointerToString(opportunity.ContactID),
			uintPointerToString(opportunity.OwnerEmployeeID),
			opportunity.Name,
			formatFloat(opportunity.Amount),
			strconv.Itoa(opportunity.Probability),
			timePointerToString(opportunity.ExpectedCloseDate),
			opportunity.Stage.String(),
			opportunity.Description,
			timePointerToString(opportunity.ClosedAt),
			opportunity.CloseReason,
			uintPointerToString(opportunity.ClosedByEmployeeID),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseOpportunityLineItemsCSV(reader io.Reader) ([]models.OpportunityLineItem, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"OpportunityID", "ProductID", "Quantity", "UnitPrice"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		items      []models.OpportunityLineItem
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		opportunityIDValue := valueFor(row, headerIndex, "OpportunityID")
		opportunityID, parseErr := parseRequiredUint(opportunityIDValue, "OpportunityID")
		if parseErr != nil {
			parseErr.Row = currentRow
			rowErrors = append(rowErrors, *parseErr)
			continue
		}

		productIDValue := valueFor(row, headerIndex, "ProductID")
		productID, parseErr := parseRequiredUint(productIDValue, "ProductID")
		if parseErr != nil {
			parseErr.Row = currentRow
			rowErrors = append(rowErrors, *parseErr)
			continue
		}

		quantity, quantityErr := parseRequiredInt(valueFor(row, headerIndex, "Quantity"), "Quantity")
		if quantityErr != nil {
			quantityErr.Row = currentRow
			rowErrors = append(rowErrors, *quantityErr)
			continue
		}
		if quantity <= 0 {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Quantity", Message: "must be greater than zero"})
			continue
		}

		unitPrice, priceErr := parseRequiredFloat(valueFor(row, headerIndex, "UnitPrice"), "UnitPrice")
		if priceErr != nil {
			priceErr.Row = currentRow
			rowErrors = append(rowErrors, *priceErr)
			continue
		}

		discountAmount, discountAmountErr := parseOptionalFloat(valueFor(row, headerIndex, "DiscountAmount"), "DiscountAmount")
		if discountAmountErr != nil {
			discountAmountErr.Row = currentRow
			rowErrors = append(rowErrors, *discountAmountErr)
			continue
		}

		discountPercent, discountPercentErr := parseOptionalFloat(valueFor(row, headerIndex, "DiscountPercent"), "DiscountPercent")
		if discountPercentErr != nil {
			discountPercentErr.Row = currentRow
			rowErrors = append(rowErrors, *discountPercentErr)
			continue
		}

		item := models.OpportunityLineItem{
			OpportunityID:   opportunityID,
			ProductID:       productID,
			Quantity:        quantity,
			UnitPrice:       unitPrice,
			DiscountAmount:  discountAmount,
			DiscountPercent: discountPercent,
		}

		items = append(items, item)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return items, rowNumbers, rowErrors, nil
}

func OpportunityLineItemsToCSV(items []models.OpportunityLineItem) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(opportunityLineItemHeaders); err != nil {
		return nil, err
	}

	for _, item := range items {
		record := []string{
			strconv.FormatUint(uint64(item.OpportunityID), 10),
			strconv.FormatUint(uint64(item.ProductID), 10),
			strconv.Itoa(item.Quantity),
			formatFloat(item.UnitPrice),
			formatFloat(item.DiscountAmount),
			formatFloat(item.DiscountPercent),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseEmployeesCSV(reader io.Reader) ([]models.Employee, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"FirstName", "LastName"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		employees  []models.Employee
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		firstName := valueFor(row, headerIndex, "FirstName")
		if firstName == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "FirstName", Message: "is required"})
			continue
		}

		lastName := valueFor(row, headerIndex, "LastName")
		if lastName == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "LastName", Message: "is required"})
			continue
		}

		hireDate, hireDateErr := parseOptionalTime(valueFor(row, headerIndex, "HireDate"), "HireDate")
		if hireDateErr != nil {
			hireDateErr.Row = currentRow
			rowErrors = append(rowErrors, *hireDateErr)
			continue
		}

		employee := models.Employee{
			FirstName:  firstName,
			LastName:   lastName,
			Email:      valueFor(row, headerIndex, "Email"),
			Phone:      valueFor(row, headerIndex, "Phone"),
			Department: valueFor(row, headerIndex, "Department"),
			Position:   valueFor(row, headerIndex, "Position"),
			HireDate:   hireDate,
			Notes:      valueFor(row, headerIndex, "Notes"),
		}

		employees = append(employees, employee)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return employees, rowNumbers, rowErrors, nil
}

func EmployeesToCSV(employees []models.Employee) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(employeeHeaders); err != nil {
		return nil, err
	}

	for _, employee := range employees {
		record := []string{
			employee.FirstName,
			employee.LastName,
			employee.Email,
			employee.Phone,
			employee.Department,
			employee.Position,
			timePointerToString(employee.HireDate),
			employee.Notes,
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func ParseProductsCSV(reader io.Reader) ([]models.Product, []int, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	if _, ok := headerIndex["Name"]; !ok {
		return nil, nil, nil, fmt.Errorf("CSV is missing required header: Name")
	}

	var (
		products   []models.Product
		rowErrors  []RowError
		rowNumbers []int
	)

	for rowIndex, row := range rows {
		currentRow := rowIndex + 2

		name := valueFor(row, headerIndex, "Name")
		if name == "" {
			rowErrors = append(rowErrors, RowError{Row: currentRow, Field: "Name", Message: "is required"})
			continue
		}

		price, priceErr := parseOptionalFloat(valueFor(row, headerIndex, "Price"), "Price")
		if priceErr != nil {
			priceErr.Row = currentRow
			rowErrors = append(rowErrors, *priceErr)
			continue
		}

		cost, costErr := parseOptionalFloat(valueFor(row, headerIndex, "Cost"), "Cost")
		if costErr != nil {
			costErr.Row = currentRow
			rowErrors = append(rowErrors, *costErr)
			continue
		}

		stock, stockErr := parseOptionalInt(valueFor(row, headerIndex, "Stock"), "Stock")
		if stockErr != nil {
			stockErr.Row = currentRow
			rowErrors = append(rowErrors, *stockErr)
			continue
		}

		isActive := true
		if value := valueFor(row, headerIndex, "IsActive"); value != "" {
			parsed, boolErr := parseOptionalBool(value, "IsActive")
			if boolErr != nil {
				boolErr.Row = currentRow
				rowErrors = append(rowErrors, *boolErr)
				continue
			}
			if parsed != nil {
				isActive = *parsed
			}
		}

		product := models.Product{
			Name:        name,
			SKU:         valueFor(row, headerIndex, "SKU"),
			Category:    valueFor(row, headerIndex, "Category"),
			Description: valueFor(row, headerIndex, "Description"),
			Price:       price,
			Cost:        cost,
			Stock:       stock,
			IsActive:    isActive,
		}

		products = append(products, product)
		rowNumbers = append(rowNumbers, currentRow)
	}

	return products, rowNumbers, rowErrors, nil
}

func ProductsToCSV(products []models.Product) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	if err := writer.Write(productHeaders); err != nil {
		return nil, err
	}

	for _, product := range products {
		record := []string{
			product.Name,
			product.SKU,
			product.Category,
			product.Description,
			formatFloat(product.Price),
			formatFloat(product.Cost),
			strconv.Itoa(product.Stock),
			strconv.FormatBool(product.IsActive),
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func uintPointerToString(value *uint) string {
	if value == nil {
		return ""
	}
	return strconv.FormatUint(uint64(*value), 10)
}

func timePointerToString(value *time.Time) string {
	if value == nil {
		return ""
	}
	return value.UTC().Format(time.RFC3339)
}

func formatFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', 2, 64)
}
