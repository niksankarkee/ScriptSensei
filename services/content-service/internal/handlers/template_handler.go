package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/scriptsensei/content-service/internal/services"
)

// TemplateHandler handles template-related HTTP requests
type TemplateHandler struct {
	templateService services.TemplateServiceInterface
}

// NewTemplateHandler creates a new TemplateHandler
func NewTemplateHandler(service services.TemplateServiceInterface) *TemplateHandler {
	return &TemplateHandler{
		templateService: service,
	}
}

// ListTemplates handles GET /api/v1/templates
func (h *TemplateHandler) ListTemplates(c *fiber.Ctx) error {
	// Get query parameters for filtering
	category := c.Query("category", "")
	platform := c.Query("platform", "")
	isPremiumStr := c.Query("is_premium", "")

	var isPremium *bool
	if isPremiumStr != "" {
		premium := isPremiumStr == "true"
		isPremium = &premium
	}

	// Get templates from service
	templates, err := h.templateService.ListTemplates(c.Context(), category, platform, isPremium)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve templates: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"templates": templates,
			"count":     len(templates),
		},
	})
}

// GetTemplateByID handles GET /api/v1/templates/:id
func (h *TemplateHandler) GetTemplateByID(c *fiber.Ctx) error {
	// Parse template ID from URL parameter
	idStr := c.Params("id")
	templateID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID format",
		})
	}

	// Get template from service
	template, err := h.templateService.GetTemplateByID(c.Context(), templateID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Template not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    template,
	})
}

// ApplyTemplateRequest represents the request body for applying a template
type ApplyTemplateRequest struct {
	Variables map[string]string `json:"variables"`
}

// ApplyTemplate handles POST /api/v1/templates/:id/apply
func (h *TemplateHandler) ApplyTemplate(c *fiber.Ctx) error {
	// Parse template ID from URL parameter
	idStr := c.Params("id")
	templateID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID format",
		})
	}

	// Parse request body
	var req ApplyTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	// Apply template with variables
	content, err := h.templateService.ApplyTemplate(c.Context(), templateID, req.Variables)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to apply template: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"content": content,
		},
	})
}

// GetPopularTemplates handles GET /api/v1/templates/popular
func (h *TemplateHandler) GetPopularTemplates(c *fiber.Ctx) error {
	// Get limit from query parameter (default: 10)
	limitStr := c.Query("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10 // Default to 10 if invalid
	}

	// Get popular templates from service
	templates, err := h.templateService.GetPopularTemplates(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve popular templates: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"templates": templates,
			"count":     len(templates),
		},
	})
}

// GenerateFromTemplate handles POST /api/v1/templates/:id/generate
// This applies a template and returns it as a prompt for script generation
func (h *TemplateHandler) GenerateFromTemplate(c *fiber.Ctx) error {
	// Parse template ID from URL parameter
	idStr := c.Params("id")
	templateID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID format",
		})
	}

	// Parse request body
	var req ApplyTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	// Apply template with variables
	content, err := h.templateService.ApplyTemplate(c.Context(), templateID, req.Variables)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate from template: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"prompt":      content,
			"template_id": templateID,
		},
		"message": "Template applied successfully. Use this prompt for script generation.",
	})
}
