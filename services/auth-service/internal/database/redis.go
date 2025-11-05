package database

import (
	"context"
	"log"

	"github.com/go-redis/redis/v8"
)

var ctx = context.Background()

// NewRedisConnection creates a new Redis connection
func NewRedisConnection(connStr string) *redis.Client {
	opt, err := redis.ParseURL(connStr)
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}

	client := redis.NewClient(opt)

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	log.Println("✅ Redis connection established")
	return client
}
