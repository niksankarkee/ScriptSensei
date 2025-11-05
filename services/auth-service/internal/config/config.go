package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	// Server
	Port string

	// Database
	DatabaseURL string
	RedisURL    string

	// JWT
	JWTSecret          string
	JWTExpiry          string
	RefreshTokenExpiry string

	// CORS
	AllowedOrigins string

	// OAuth
	GoogleClientID     string
	GoogleClientSecret string
	FacebookAppID      string
	FacebookAppSecret  string

	// Email
	SendGridAPIKey string
	FromEmail      string
	FromName       string

	// MFA
	TOTPIssuer string

	// Environment
	Environment string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("AUTH_SERVICE_PORT", "8001"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://scriptsensei:dev_password@localhost:5432/scriptsensei_dev"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:          getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production-min-32-chars"),
		JWTExpiry:          getEnv("JWT_EXPIRY", "24h"),
		RefreshTokenExpiry: getEnv("REFRESH_TOKEN_EXPIRY", "168h"),
		AllowedOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		FacebookAppID:      getEnv("FACEBOOK_APP_ID", ""),
		FacebookAppSecret:  getEnv("FACEBOOK_APP_SECRET", ""),
		SendGridAPIKey:     getEnv("SENDGRID_API_KEY", ""),
		FromEmail:          getEnv("FROM_EMAIL", "noreply@scriptsensei.com"),
		FromName:           getEnv("FROM_NAME", "ScriptSensei"),
		TOTPIssuer:         getEnv("TOTP_ISSUER", "ScriptSensei"),
		Environment:        getEnv("NODE_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return fallback
}

func getEnvAsBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return fallback
}

func getEnvAsSlice(key string, fallback []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return fallback
}
