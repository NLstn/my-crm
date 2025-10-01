package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/my-crm/backend/internal/config"
	"github.com/my-crm/backend/internal/repository"
	"github.com/my-crm/backend/internal/server"
)

func main() {
	cfg := config.Load()

	var repo repository.Repository
	var cleanup func()

	if cfg.DatabaseURL != "" {
		db, err := server.NewPostgresConnection(cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("failed to connect to postgres: %v", err)
		}

		repo = repository.NewPostgresRepository(db)
		cleanup = func() {
			sqlDB, err := db.DB()
			if err != nil {
				log.Printf("error getting underlying sql.DB: %v", err)
				return
			}
			_ = sqlDB.Close()
		}
	} else {
		repo = repository.NewMemoryRepository()
		cleanup = func() {}
	}

	srv := server.New(server.Options{
		Address: formatAddress(cfg.Port),
		Repo:    repo,
	})

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	defer cleanup()

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != context.Canceled {
			log.Printf("server stopped: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down server")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}

func formatAddress(port int) string {
	return ":" + strconv.Itoa(port)
}
