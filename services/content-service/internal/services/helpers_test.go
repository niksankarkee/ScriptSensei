package services_test

import (
	"os"
	"testing"
)

// getEnvOrSkip returns the environment variable value or skips the test if not set
func getEnvOrSkip(t *testing.T, key string) string {
	value := os.Getenv(key)
	if value == "" {
		t.Skipf("Skipping test: %s environment variable not set", key)
	}
	return value
}
