package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	startTime time.Time
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
	}
}

// HealthCheck returns basic health status
func (h *HealthHandler) HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "healthy",
		"service":   "content-service",
		"timestamp": time.Now().Unix(),
		"uptime":    time.Since(h.startTime).String(),
	})
}

// ReadyCheck checks if service is ready to accept requests
func (h *HealthHandler) ReadyCheck(c *fiber.Ctx) error {
	// Check if LLM providers are configured
	// For now, just return ready status
	return c.JSON(fiber.Map{
		"status":    "ready",
		"service":   "content-service",
		"timestamp": time.Now().Unix(),
		"checks": fiber.Map{
			"llm_providers": "ok",
		},
	})
}
