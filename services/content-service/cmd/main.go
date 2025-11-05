package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/scriptsensei/content-service/internal/handlers"
	"github.com/scriptsensei/content-service/internal/repository"
	"github.com/scriptsensei/content-service/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Initialize LLM providers
	// Get API keys from environment
	geminiAPIKey := os.Getenv("GOOGLE_AI_API_KEY")
	openaiAPIKey := os.Getenv("OPENAI_API_KEY")
	claudeAPIKey := os.Getenv("ANTHROPIC_API_KEY")
	deepseekAPIKey := os.Getenv("DEEPSEEK_API_KEY")

	// Create LLM providers (all are optional for fallback)
	var providers []services.LLMProvider

	// Provider order for cost optimization (cheapest to most expensive):
	// 1. Gemini 2.0 Flash: $0.10/$0.40 per M tokens (cheapest)
	// 2. OpenAI GPT-4o-mini: $0.15/$0.60 per M tokens
	// 3. Claude 3 Haiku: $0.25/$1.25 per M tokens
	// 4. DeepSeek V3: $0.27/$1.35 per M tokens

	if geminiAPIKey != "" {
		geminiProvider := services.NewGeminiProvider(geminiAPIKey, "https://generativelanguage.googleapis.com/v1beta")
		providers = append(providers, geminiProvider)
		log.Println("✅ Gemini provider initialized (primary - lowest cost)")
	}

	if openaiAPIKey != "" {
		openaiProvider := services.NewOpenAIProvider(openaiAPIKey, "")
		providers = append(providers, openaiProvider)
		log.Println("✅ OpenAI provider initialized (fallback #1)")
	}

	if claudeAPIKey != "" {
		claudeProvider := services.NewClaudeProvider(claudeAPIKey, "")
		providers = append(providers, claudeProvider)
		log.Println("✅ Claude provider initialized (fallback #2)")
	}

	if deepseekAPIKey != "" {
		deepseekProvider := services.NewDeepSeekProvider(deepseekAPIKey, "https://api.deepseek.com/v1")
		providers = append(providers, deepseekProvider)
		log.Println("✅ DeepSeek provider initialized (fallback #3)")
	}

	// Ensure at least one provider is available
	if len(providers) == 0 {
		log.Fatal("❌ At least one LLM provider API key is required (GOOGLE_AI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY)")
	}

	log.Printf("📊 Total providers initialized: %d (with automatic fallback)", len(providers))

	// Create orchestrator with all available providers
	orchestrator := services.NewLLMOrchestrator(providers)

	// Initialize database connection
	var scriptRepo *repository.ScriptRepository
	var templateRepo *repository.TemplateRepository
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
		if err != nil {
			log.Printf("Failed to connect to database: %v. Continuing without database...", err)
		} else {
			log.Println("Successfully connected to database")
			// Auto-migrate the schemas
			if err := db.AutoMigrate(&repository.Script{}, &repository.Template{}); err != nil {
				log.Printf("Failed to migrate database: %v", err)
			}
			scriptRepo = repository.NewScriptRepository(db)
			templateRepo = repository.NewTemplateRepository(db)
			log.Println("✅ Repository initialized")
		}
	} else {
		log.Println("DATABASE_URL not set, running without database")
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
		AppName:      "ScriptSensei Content Service",
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))
	// CORS configuration
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "*" // Allow all origins in development
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Initialize handlers
	scriptHandler := handlers.NewScriptHandler(orchestrator, scriptRepo)
	healthHandler := handlers.NewHealthHandler()

	// Initialize template service and handler
	var templateHandler *handlers.TemplateHandler
	if templateRepo != nil {
		templateService := services.NewTemplateService(templateRepo)
		templateHandler = handlers.NewTemplateHandler(templateService)
		log.Println("✅ Template handler initialized")
	}

	// Health check routes
	app.Get("/health", healthHandler.HealthCheck)
	app.Get("/health/ready", healthHandler.ReadyCheck)

	// API v1 routes
	v1 := app.Group("/api/v1")

	// Script routes
	scripts := v1.Group("/scripts")
	scripts.Post("/generate", scriptHandler.GenerateScript)
	scripts.Get("/:id", scriptHandler.GetScript)
	scripts.Get("/", scriptHandler.ListScripts)
	scripts.Put("/:id", scriptHandler.UpdateScript)
	scripts.Delete("/:id", scriptHandler.DeleteScript)

	// Template routes
	if templateHandler != nil {
		templates := v1.Group("/templates")
		templates.Get("/popular", templateHandler.GetPopularTemplates) // Must be before /:id
		templates.Get("/", templateHandler.ListTemplates)
		templates.Get("/:id", templateHandler.GetTemplateByID)
		templates.Post("/:id/apply", templateHandler.ApplyTemplate)
		templates.Post("/:id/generate", templateHandler.GenerateFromTemplate)
		log.Println("✅ Template routes registered")
	}

	// Platform routes
	platforms := v1.Group("/platforms")
	platforms.Get("/", scriptHandler.ListPlatforms)

	// Start server
	port := os.Getenv("CONTENT_SERVICE_PORT")
	if port == "" {
		port = "8011"
	}

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Gracefully shutting down...")
		_ = app.ShutdownWithTimeout(10 * time.Second)
	}()

	log.Printf("Content Service starting on http://localhost:%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal(err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": message,
		"code":  code,
	})
}
