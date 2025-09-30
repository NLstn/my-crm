package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

const (
	defaultPort = 8080
)

// Config holds runtime configuration for the API server.
type Config struct {
	Port        int
	DatabaseURL string
	DataBackend string
}

// Load reads configuration from environment variables.
func Load() Config {
	_ = godotenv.Load()

	port := defaultPort
	if rawPort := os.Getenv("PORT"); rawPort != "" {
		if parsed, err := strconv.Atoi(rawPort); err == nil {
			port = parsed
		} else {
			log.Printf("invalid PORT %q, falling back to %d", rawPort, defaultPort)
		}
	}

	dbURL := os.Getenv("DATABASE_URL")
	repo := os.Getenv("DATA_BACKEND")
	if repo == "" {
		repo = "memory"
	}

	return Config{
		Port:        port,
		DatabaseURL: dbURL,
		DataBackend: repo,
	}
}
