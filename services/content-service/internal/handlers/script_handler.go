package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/scriptsensei/content-service/internal/models"
	"github.com/scriptsensei/content-service/internal/repository"
	"github.com/scriptsensei/content-service/internal/services"
)

type ScriptHandler struct {
	orchestrator *services.LLMOrchestrator
	scriptRepo   *repository.ScriptRepository
}

func NewScriptHandler(orchestrator *services.LLMOrchestrator, scriptRepo *repository.ScriptRepository) *ScriptHandler {
	return &ScriptHandler{
		orchestrator: orchestrator,
		scriptRepo:   scriptRepo,
	}
}

// GenerateScriptRequest represents the request body for script generation
type GenerateScriptRequest struct {
	Topic      string `json:"topic" validate:"required"`
	Platform   string `json:"platform" validate:"required"`
	Tone       string `json:"tone"`
	Duration   int    `json:"duration"`
	Language   string `json:"language"`
	Additional string `json:"additional"`
}

// GenerateScript handles POST /api/v1/scripts/generate
func (h *ScriptHandler) GenerateScript(c *fiber.Ctx) error {
	var req GenerateScriptRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Topic == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Topic is required",
		})
	}
	if req.Platform == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Platform is required",
		})
	}

	if req.Language == "" {
		req.Language = "en"
	}
	if req.Tone == "" {
		req.Tone = "professional"
	}
	if req.Duration == 0 {
		req.Duration = 60
	}

	scriptReq := &models.ScriptRequest{
		Topic:    req.Topic,
		Platform: req.Platform,
		Tone:     req.Tone,
		Duration: req.Duration,
		Language: req.Language,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	script, err := h.orchestrator.GenerateScript(ctx, scriptReq)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate script: " + err.Error(),
		})
	}

	// Analyze script quality
	scorer := services.NewQualityScorer()
	qualityScores := scorer.AnalyzeScript(script.Content, scriptReq.Platform)

	userID := c.Locals("userId")
	if userID == nil {
		userID = "guest"
	}

	scriptRecord := &repository.Script{
		ID:           uuid.New(),
		UserID:       userID.(string),
		Topic:        scriptReq.Topic,
		Platform:     scriptReq.Platform,
		Tone:         scriptReq.Tone,
		Duration:     scriptReq.Duration,
		Language:     scriptReq.Language,
		Content:      script.Content,
		ProviderUsed: script.Provider(),
		Metadata: map[string]interface{}{
			"quality_score":      qualityScores.OverallScore,
			"hook_score":         qualityScores.HookScore,
			"engagement_score":   qualityScores.EngagementScore,
			"seo_score":          qualityScores.SEOScore,
			"readability_score":  qualityScores.ReadabilityScore,
			"suggestions":        qualityScores.Suggestions,
			"word_count":         script.WordCount(),
			"estimated_duration": script.EstimatedDuration(),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if h.scriptRepo != nil {
		if err := h.scriptRepo.Create(ctx, scriptRecord); err != nil {
			// Log error but don't fail the request - script was already generated
			println("Warning: Failed to save script to database:", err.Error())
		} else {
			println("Successfully saved script to database with ID:", scriptRecord.ID.String())
		}
	} else {
		println("Warning: scriptRepo is nil, script not saved to database")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":          scriptRecord.ID.String(),
			"content":     script.Content,
			"platform":    scriptReq.Platform,
			"language":    scriptReq.Language,
			"tone":        scriptReq.Tone,
			"quality": fiber.Map{
				"overall_score":     qualityScores.OverallScore,
				"hook_score":        qualityScores.HookScore,
				"engagement_score":  qualityScores.EngagementScore,
				"seo_score":         qualityScores.SEOScore,
				"readability_score": qualityScores.ReadabilityScore,
				"suggestions":       qualityScores.Suggestions,
			},
			"metadata":   scriptRecord.Metadata,
			"created_at": scriptRecord.CreatedAt,
		},
	})
}

// GetScript handles GET /api/v1/scripts/:id
func (h *ScriptHandler) GetScript(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid script ID",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if h.scriptRepo == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Database not available",
		})
	}

	script, err := h.scriptRepo.GetByID(ctx, id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Script not found",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    script,
	})
}

// ListScripts handles GET /api/v1/scripts
func (h *ScriptHandler) ListScripts(c *fiber.Ctx) error {
	userID := c.Locals("userId")
	if userID == nil {
		userID = "guest"
	}

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if h.scriptRepo == nil {
		return c.JSON(fiber.Map{
			"success": true,
			"data": []interface{}{},
			"pagination": fiber.Map{
				"page":  page,
				"limit": limit,
				"total": 0,
			},
		})
	}

	scripts, err := h.scriptRepo.GetByUserID(ctx, userID.(string), limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch scripts",
		})
	}

	total, err := h.scriptRepo.CountByUserID(ctx, userID.(string))
	if err != nil {
		total = 0
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    scripts,
		"pagination": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// UpdateScript handles PUT /api/v1/scripts/:id
func (h *ScriptHandler) UpdateScript(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		Content string `json:"content"`
		Title   string `json:"title"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":         id,
			"content":    req.Content,
			"title":      req.Title,
			"updated_at": time.Now(),
		},
	})
}

// DeleteScript handles DELETE /api/v1/scripts/:id
func (h *ScriptHandler) DeleteScript(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid script ID",
		})
	}

	userID := c.Locals("userId")
	if userID == nil {
		userID = "guest"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if h.scriptRepo == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Database not available",
		})
	}

	err = h.scriptRepo.Delete(ctx, id, userID.(string))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Script not found or could not be deleted",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Script deleted successfully",
		"id":      idStr,
	})
}

// ListTemplates handles GET /api/v1/templates
func (h *ScriptHandler) ListTemplates(c *fiber.Ctx) error {
	templates := []fiber.Map{
		{
			"id":          "1",
			"name":        "TikTok Viral Hook",
			"category":    "tiktok",
			"description": "Attention-grabbing hook for TikTok videos",
			"is_premium":  false,
		},
		{
			"id":          "2",
			"name":        "YouTube Tutorial",
			"category":    "youtube",
			"description": "Educational tutorial format",
			"is_premium":  false,
		},
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    templates,
	})
}

// GetTemplate handles GET /api/v1/templates/:id
func (h *ScriptHandler) GetTemplate(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":          id,
			"name":        "Sample Template",
			"category":    "general",
			"description": "Sample template description",
			"config":      fiber.Map{},
		},
	})
}

// ListPlatforms handles GET /api/v1/platforms
func (h *ScriptHandler) ListPlatforms(c *fiber.Ctx) error {
	platforms := []fiber.Map{
		{
			"id":          "tiktok",
			"name":        "TikTok",
			"description": "Short-form viral videos",
			"max_duration": 180,
			"aspect_ratio": "9:16",
			"features": []string{"trending_sounds", "duets", "stitches"},
		},
		{
			"id":          "youtube",
			"name":        "YouTube",
			"description": "Long-form and Shorts content",
			"max_duration": 0,
			"aspect_ratio": "16:9",
			"features": []string{"chapters", "end_screens", "cards"},
		},
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    platforms,
	})
}
