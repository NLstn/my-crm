package server

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	api "github.com/my-crm/backend/internal/http"
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

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	apiHandlers := api.NewAPI(repo)
	apiHandlers.RegisterRoutes(r)

	return &Server{
		repo: repo,
		server: &http.Server{
			Addr:         opts.Address,
			Handler:      r,
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

// NewPostgresConnection initialises a PostgreSQL connection with sane defaults.
func NewPostgresConnection(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, err
	}

	return db, nil
}
