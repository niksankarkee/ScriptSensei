package handlers

import (
	"database/sql"

	"github.com/go-redis/redis/v8"
	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	db    *sql.DB
	redis *redis.Client
}

func NewHealthHandler(db *sql.DB, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redis,
	}
}

func (h *HealthHandler) HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "auth-service",
		"version": "1.0.0",
	})
}

func (h *HealthHandler) ReadyCheck(c *fiber.Ctx) error {
	// Check database connection
	if err := h.db.Ping(); err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "unavailable",
			"reason": "database connection failed",
		})
	}

	// Check Redis connection
	if err := h.redis.Ping(c.Context()).Err(); err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "unavailable",
			"reason": "redis connection failed",
		})
	}

	return c.JSON(fiber.Map{
		"status":   "ready",
		"database": "connected",
		"redis":    "connected",
	})
}
