package database

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"

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

func parseBool(value string) (bool, *RowError) {
	if value == "" {
		return false, nil
	}
	lower := strings.ToLower(value)
	switch lower {
	case "true", "1", "yes", "y":
		return true, nil
	case "false", "0", "no", "n":
		return false, nil
	default:
		return false, &RowError{Field: "IsPrimary", Message: "must be true or false"}
	}
}

func ParseAccountsCSV(reader io.Reader) ([]models.Account, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	if _, ok := headerIndex["Name"]; !ok {
		return nil, nil, fmt.Errorf("CSV is missing required header: Name")
	}

	var (
		accounts  []models.Account
		rowErrors []RowError
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
	}

	return accounts, rowErrors, nil
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

func ParseContactsCSV(reader io.Reader) ([]models.Contact, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	requiredHeaders := []string{"AccountID", "FirstName", "LastName"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			return nil, nil, fmt.Errorf("CSV is missing required header: %s", header)
		}
	}

	var (
		contacts  []models.Contact
		rowErrors []RowError
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

		isPrimaryValue := valueFor(row, headerIndex, "IsPrimary")
		isPrimary, boolErr := parseBool(isPrimaryValue)
		if boolErr != nil {
			boolErr.Row = currentRow
			rowErrors = append(rowErrors, *boolErr)
			continue
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
	}

	return contacts, rowErrors, nil
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

func ParseLeadsCSV(reader io.Reader) ([]models.Lead, []RowError, error) {
	headers, rows, err := readCSV(reader)
	if err != nil {
		return nil, nil, err
	}

	headerIndex := indexHeaders(headers)
	if _, ok := headerIndex["Name"]; !ok {
		return nil, nil, fmt.Errorf("CSV is missing required header: Name")
	}

	validStatuses := map[string]models.LeadStatus{
		"New":          models.LeadStatusNew,
		"Contacted":    models.LeadStatusContacted,
		"Qualified":    models.LeadStatusQualified,
		"Converted":    models.LeadStatusConverted,
		"Disqualified": models.LeadStatusDisqualified,
	}

	var (
		leads     []models.Lead
		rowErrors []RowError
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
	}

	return leads, rowErrors, nil
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

func uintPointerToString(value *uint) string {
	if value == nil {
		return ""
	}
	return strconv.FormatUint(uint64(*value), 10)
}
