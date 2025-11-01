package main

import (
	"fmt"
	"strings"

	"github.com/nlstn/my-crm/backend/database"
	"github.com/nlstn/my-crm/backend/migration"
	"github.com/nlstn/my-crm/backend/models"
	"gorm.io/gorm"
)

func importAccounts(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	accounts, _, validationErrors, err := database.ParseAccountsCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	if len(validationErrors) > 0 {
		return migration.ImportResult{
			ValidationErrors: validationErrors,
			ErrorMessage:     "One or more account rows could not be imported",
		}, nil
	}
	if len(accounts) == 0 {
		return migration.ImportResult{ErrorMessage: "No account rows were found in the CSV file"}, nil
	}
	if err := db.Create(&accounts).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(accounts), "account", "accounts")
	return migration.ImportResult{
		Imported:       len(accounts),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(accounts), noun),
	}, nil
}

func exportAccounts(db *gorm.DB) (migration.ExportResult, error) {
	var accounts []models.Account
	if err := db.Order("id ASC").Find(&accounts).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.AccountsToCSV(accounts)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(accounts), "account", "accounts")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(accounts),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(accounts), noun),
	}, nil
}

func importContacts(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	contacts, rowNumbers, validationErrors, err := database.ParseContactsCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	dependencyErrors, depErr := validateContactDependencies(db, contacts, rowNumbers)
	if depErr != nil {
		return migration.ImportResult{}, depErr
	}
	if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
		combined := append(validationErrors, dependencyErrors...)
		return migration.ImportResult{
			ValidationErrors: combined,
			ErrorMessage:     "One or more contact rows could not be imported",
		}, nil
	}
	if len(contacts) == 0 {
		return migration.ImportResult{ErrorMessage: "No contact rows were found in the CSV file"}, nil
	}
	if err := db.Create(&contacts).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(contacts), "contact", "contacts")
	return migration.ImportResult{
		Imported:       len(contacts),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(contacts), noun),
	}, nil
}

func exportContacts(db *gorm.DB) (migration.ExportResult, error) {
	var contacts []models.Contact
	if err := db.Order("id ASC").Find(&contacts).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.ContactsToCSV(contacts)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(contacts), "contact", "contacts")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(contacts),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(contacts), noun),
	}, nil
}

func importLeads(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	leads, _, validationErrors, err := database.ParseLeadsCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	if len(validationErrors) > 0 {
		return migration.ImportResult{
			ValidationErrors: validationErrors,
			ErrorMessage:     "One or more lead rows could not be imported",
		}, nil
	}
	if len(leads) == 0 {
		return migration.ImportResult{ErrorMessage: "No lead rows were found in the CSV file"}, nil
	}
	if err := db.Create(&leads).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(leads), "lead", "leads")
	return migration.ImportResult{
		Imported:       len(leads),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(leads), noun),
	}, nil
}

func exportLeads(db *gorm.DB) (migration.ExportResult, error) {
	var leads []models.Lead
	if err := db.Order("id ASC").Find(&leads).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.LeadsToCSV(leads)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(leads), "lead", "leads")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(leads),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(leads), noun),
	}, nil
}

func importActivities(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	activities, rowNumbers, validationErrors, err := database.ParseActivitiesCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	dependencyErrors, depErr := validateActivityDependencies(db, activities, rowNumbers)
	if depErr != nil {
		return migration.ImportResult{}, depErr
	}
	if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
		combined := append(validationErrors, dependencyErrors...)
		return migration.ImportResult{
			ValidationErrors: combined,
			ErrorMessage:     "One or more activity rows could not be imported",
		}, nil
	}
	if len(activities) == 0 {
		return migration.ImportResult{ErrorMessage: "No activity rows were found in the CSV file"}, nil
	}
	if err := db.Create(&activities).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(activities), "activity", "activities")
	return migration.ImportResult{
		Imported:       len(activities),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(activities), noun),
	}, nil
}

func exportActivities(db *gorm.DB) (migration.ExportResult, error) {
	var activities []models.Activity
	if err := db.Order("id ASC").Find(&activities).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.ActivitiesToCSV(activities)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(activities), "activity", "activities")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(activities),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(activities), noun),
	}, nil
}

func importIssues(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	issues, rowNumbers, validationErrors, err := database.ParseIssuesCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	dependencyErrors, depErr := validateIssueDependencies(db, issues, rowNumbers)
	if depErr != nil {
		return migration.ImportResult{}, depErr
	}
	if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
		combined := append(validationErrors, dependencyErrors...)
		return migration.ImportResult{
			ValidationErrors: combined,
			ErrorMessage:     "One or more issue rows could not be imported",
		}, nil
	}
	if len(issues) == 0 {
		return migration.ImportResult{ErrorMessage: "No issue rows were found in the CSV file"}, nil
	}
	if err := db.Create(&issues).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(issues), "issue", "issues")
	return migration.ImportResult{
		Imported:       len(issues),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(issues), noun),
	}, nil
}

func exportIssues(db *gorm.DB) (migration.ExportResult, error) {
	var issues []models.Issue
	if err := db.Order("id ASC").Find(&issues).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.IssuesToCSV(issues)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(issues), "issue", "issues")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(issues),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(issues), noun),
	}, nil
}

func importTasks(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	tasks, rowNumbers, validationErrors, err := database.ParseTasksCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	dependencyErrors, depErr := validateTaskDependencies(db, tasks, rowNumbers)
	if depErr != nil {
		return migration.ImportResult{}, depErr
	}
	if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
		combined := append(validationErrors, dependencyErrors...)
		return migration.ImportResult{
			ValidationErrors: combined,
			ErrorMessage:     "One or more task rows could not be imported",
		}, nil
	}
	if len(tasks) == 0 {
		return migration.ImportResult{ErrorMessage: "No task rows were found in the CSV file"}, nil
	}
	if err := db.Create(&tasks).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(tasks), "task", "tasks")
	return migration.ImportResult{
		Imported:       len(tasks),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(tasks), noun),
	}, nil
}

func exportTasks(db *gorm.DB) (migration.ExportResult, error) {
	var tasks []models.Task
	if err := db.Order("id ASC").Find(&tasks).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.TasksToCSV(tasks)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(tasks), "task", "tasks")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(tasks),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(tasks), noun),
	}, nil
}

func importOpportunities(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	opportunities, rowNumbers, validationErrors, err := database.ParseOpportunitiesCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	dependencyErrors, depErr := validateOpportunityDependencies(db, opportunities, rowNumbers)
	if depErr != nil {
		return migration.ImportResult{}, depErr
	}
	if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
		combined := append(validationErrors, dependencyErrors...)
		return migration.ImportResult{
			ValidationErrors: combined,
			ErrorMessage:     "One or more opportunity rows could not be imported",
		}, nil
	}
	if len(opportunities) == 0 {
		return migration.ImportResult{ErrorMessage: "No opportunity rows were found in the CSV file"}, nil
	}
	if err := db.Create(&opportunities).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(opportunities), "opportunity", "opportunities")
	return migration.ImportResult{
		Imported:       len(opportunities),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(opportunities), noun),
	}, nil
}

func exportOpportunities(db *gorm.DB) (migration.ExportResult, error) {
	var opportunities []models.Opportunity
	if err := db.Order("id ASC").Find(&opportunities).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.OpportunitiesToCSV(opportunities)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(opportunities), "opportunity", "opportunities")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(opportunities),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(opportunities), noun),
	}, nil
}

func importOpportunityLineItems(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	lineItems, rowNumbers, validationErrors, err := database.ParseOpportunityLineItemsCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	dependencyErrors, depErr := validateOpportunityLineItemDependencies(db, lineItems, rowNumbers)
	if depErr != nil {
		return migration.ImportResult{}, depErr
	}
	if len(validationErrors) > 0 || len(dependencyErrors) > 0 {
		combined := append(validationErrors, dependencyErrors...)
		return migration.ImportResult{
			ValidationErrors: combined,
			ErrorMessage:     "One or more opportunity line item rows could not be imported",
		}, nil
	}
	if len(lineItems) == 0 {
		return migration.ImportResult{ErrorMessage: "No opportunity line item rows were found in the CSV file"}, nil
	}
	if err := db.Create(&lineItems).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(lineItems), "line item", "line items")
	return migration.ImportResult{
		Imported:       len(lineItems),
		SuccessMessage: fmt.Sprintf("Imported %d opportunity %s successfully.", len(lineItems), noun),
	}, nil
}

func exportOpportunityLineItems(db *gorm.DB) (migration.ExportResult, error) {
	var lineItems []models.OpportunityLineItem
	if err := db.Order("id ASC").Find(&lineItems).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.OpportunityLineItemsToCSV(lineItems)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(lineItems), "line item", "line items")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(lineItems),
		SuccessMessage: fmt.Sprintf("Exported %d opportunity %s successfully.", len(lineItems), noun),
	}, nil
}

func importEmployees(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	employees, _, validationErrors, err := database.ParseEmployeesCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	if len(validationErrors) > 0 {
		return migration.ImportResult{
			ValidationErrors: validationErrors,
			ErrorMessage:     "One or more employee rows could not be imported",
		}, nil
	}
	if len(employees) == 0 {
		return migration.ImportResult{ErrorMessage: "No employee rows were found in the CSV file"}, nil
	}
	if err := db.Create(&employees).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(employees), "employee", "employees")
	return migration.ImportResult{
		Imported:       len(employees),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(employees), noun),
	}, nil
}

func exportEmployees(db *gorm.DB) (migration.ExportResult, error) {
	var employees []models.Employee
	if err := db.Order("id ASC").Find(&employees).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.EmployeesToCSV(employees)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(employees), "employee", "employees")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(employees),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(employees), noun),
	}, nil
}

func importProducts(db *gorm.DB, csvPayload string) (migration.ImportResult, error) {
	products, _, validationErrors, err := database.ParseProductsCSV(strings.NewReader(csvPayload))
	if err != nil {
		return migration.ImportResult{}, err
	}
	if len(validationErrors) > 0 {
		return migration.ImportResult{
			ValidationErrors: validationErrors,
			ErrorMessage:     "One or more product rows could not be imported",
		}, nil
	}
	if len(products) == 0 {
		return migration.ImportResult{ErrorMessage: "No product rows were found in the CSV file"}, nil
	}
	if err := db.Create(&products).Error; err != nil {
		return migration.ImportResult{}, err
	}
	noun := pluralize(len(products), "product", "products")
	return migration.ImportResult{
		Imported:       len(products),
		SuccessMessage: fmt.Sprintf("Imported %d %s successfully.", len(products), noun),
	}, nil
}

func exportProducts(db *gorm.DB) (migration.ExportResult, error) {
	var products []models.Product
	if err := db.Order("id ASC").Find(&products).Error; err != nil {
		return migration.ExportResult{}, err
	}
	csvData, err := database.ProductsToCSV(products)
	if err != nil {
		return migration.ExportResult{}, err
	}
	noun := pluralize(len(products), "product", "products")
	return migration.ExportResult{
		CSV:            csvData,
		Count:          len(products),
		SuccessMessage: fmt.Sprintf("Exported %d %s successfully.", len(products), noun),
	}, nil
}

func pluralize(count int, singular, plural string) string {
	if count == 1 {
		return singular
	}
	return plural
}
