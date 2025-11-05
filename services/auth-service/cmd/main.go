package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"github.com/scriptsensei/auth-service/internal/config"
	"github.com/scriptsensei/auth-service/internal/database"
	"github.com/scriptsensei/auth-service/internal/handlers"
	"github.com/scriptsensei/auth-service/internal/middleware"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.NewPostgresConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize Redis
	redisClient := database.NewRedisConnection(cfg.RedisURL)
	defer redisClient.Close()

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db, redisClient)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "ScriptSensei Auth Service v1.0",
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check routes
	app.Get("/health", healthHandler.HealthCheck)
	app.Get("/health/ready", healthHandler.ReadyCheck)

	// Protected endpoint example (uses Clerk JWT middleware)
	app.Get("/api/v1/me", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		userId := c.Locals("userId")
		return c.JSON(fiber.Map{
			"userId":  userId,
			"message": "This is a protected endpoint",
		})
	})

	// Start server
	port := os.Getenv("AUTH_SERVICE_PORT")
	if port == "" {
		port = "8001"
	}

	log.Printf("🚀 Auth Service starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal(err)
	}
}
