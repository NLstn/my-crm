package server

import (
	"context"
	"log"
	"net/http"
	"time"

	"golang.org/x/time/rate"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/my-crm/backend/internal/domain"
	api "github.com/my-crm/backend/internal/http"
	custommiddleware "github.com/my-crm/backend/internal/middleware"
	"github.com/my-crm/backend/internal/repository"
)

// Server wraps the HTTP server configuration.
type Server struct {
	repo   repository.Repository
	server *http.Server
}

// Options configure the server instance.
type Options struct {
	Address string
	Repo    repository.Repository
}

// New constructs a new server.
func New(opts Options) *Server {
	repo := opts.Repo

	mux := http.NewServeMux()

	apiHandlers := api.NewAPI(repo)
	apiHandlers.RegisterRoutes(mux)

	// Chain middleware: recoverer -> rate limit -> logging -> CORS -> handler
	var handler http.Handler = mux
	handler = custommiddleware.CorsMiddleware(handler)
	handler = custommiddleware.LoggingMiddleware(handler)

	// Create rate limiter: 10 requests per second with burst of 20
	rateLimiter := custommiddleware.NewIPRateLimiter(rate.Limit(10), 20)
	handler = custommiddleware.RateLimitMiddleware(rateLimiter)(handler)
	handler = custommiddleware.RecovererMiddleware(handler)

	return &Server{
		repo: repo,
		server: &http.Server{
			Addr:         opts.Address,
			Handler:      handler,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
	}
}

// ListenAndServe starts the underlying HTTP server.
func (s *Server) ListenAndServe() error {
	log.Printf("server listening on %s", s.server.Addr)
	return s.server.ListenAndServe()
}

// Shutdown gracefully stops the server.
func (s *Server) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}

// NewPostgresConnection initialises a PostgreSQL connection using GORM with automigration.
func NewPostgresConnection(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return nil, err
	}

	// Get underlying SQL DB to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, err
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(
		&domain.Account{},
		&domain.Contact{},
		&domain.Ticket{},
		&domain.Employee{},
	); err != nil {
		return nil, err
	}

	log.Println("database migrations completed successfully")

	return db, nil
}
