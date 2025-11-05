// +build e2e

package e2e

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

// AuthFlowTestSuite defines the E2E test suite for authentication flows
type AuthFlowTestSuite struct {
	suite.Suite
	apiURL      string
	httpClient  *http.Client
	testUserID  string
	testToken   string
}

// SetupSuite runs once before all tests in the suite
func (suite *AuthFlowTestSuite) SetupSuite() {
	// Get API URL from environment or use default
	suite.apiURL = os.Getenv("API_URL")
	if suite.apiURL == "" {
		suite.apiURL = "http://localhost:8000" // Kong Gateway
	}

	suite.httpClient = &http.Client{
		Timeout: 10 * time.Second,
	}

	suite.T().Logf("E2E tests will run against: %s", suite.apiURL)
}

// TearDownSuite runs once after all tests in the suite
func (suite *AuthFlowTestSuite) TearDownSuite() {
	// Cleanup test data if needed
	suite.T().Log("E2E test suite completed")
}

// SetupTest runs before each test
func (suite *AuthFlowTestSuite) SetupTest() {
	// Reset state before each test if needed
}

// TestE2E_HealthCheck tests that the health endpoint is accessible
func (suite *AuthFlowTestSuite) TestE2E_HealthCheck() {
	// Arrange
	url := suite.apiURL + "/health"

	// Act
	resp, err := suite.httpClient.Get(url)

	// Assert
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	defer resp.Body.Close()

	var body map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&body)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), "healthy", body["status"])
}

// TestE2E_UnauthorizedAccessWithoutToken tests accessing protected endpoint without token
func (suite *AuthFlowTestSuite) TestE2E_UnauthorizedAccessWithoutToken() {
	// Arrange
	url := suite.apiURL + "/api/v1/scripts"

	// Act
	resp, err := suite.httpClient.Get(url)

	// Assert
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusUnauthorized, resp.StatusCode)
	defer resp.Body.Close()
}

// TestE2E_UnauthorizedAccessWithInvalidToken tests accessing protected endpoint with invalid token
func (suite *AuthFlowTestSuite) TestE2E_UnauthorizedAccessWithInvalidToken() {
	// Arrange
	url := suite.apiURL + "/api/v1/scripts"
	req, err := http.NewRequest("GET", url, nil)
	require.NoError(suite.T(), err)
	req.Header.Set("Authorization", "Bearer invalid.token.here")

	// Act
	resp, err := suite.httpClient.Do(req)

	// Assert
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusUnauthorized, resp.StatusCode)
	defer resp.Body.Close()
}

// TestE2E_AuthenticatedFlow tests complete authentication flow
// Note: This requires a valid Clerk test token or mock setup
func (suite *AuthFlowTestSuite) TestE2E_AuthenticatedFlow() {
	suite.T().Skip("Requires valid Clerk test token - implement with test fixtures")

	// This test would:
	// 1. Get a valid test token from Clerk test environment
	// 2. Make authenticated request to create a script
	// 3. Verify script was created
	// 4. Make authenticated request to get user's scripts
	// 5. Verify created script is in the list
	// 6. Clean up test data

	// Example implementation (when test infrastructure is ready):
	/*
		// Arrange
		token := suite.getTestToken() // Helper to get valid test token
		scriptData := map[string]interface{}{
			"title":       "Test Script",
			"description": "E2E test script",
			"content":     "Test content",
		}
		body, _ := json.Marshal(scriptData)

		// Act - Create script
		req, _ := http.NewRequest("POST", suite.apiURL+"/api/v1/scripts", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		resp, err := suite.httpClient.Do(req)

		// Assert
		require.NoError(suite.T(), err)
		assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)
		defer resp.Body.Close()

		var createdScript map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&createdScript)
		assert.NotEmpty(suite.T(), createdScript["id"])
		assert.Equal(suite.T(), "Test Script", createdScript["title"])
	*/
}

// TestE2E_RateLimiting tests that rate limiting is enforced by Kong
func (suite *AuthFlowTestSuite) TestE2E_RateLimiting() {
	// Arrange
	url := suite.apiURL + "/health"
	rateLimitCount := 0
	maxRequests := 110 // Kong limit is 100/minute, so 110 should trigger rate limit

	// Act - Make many requests quickly
	for i := 0; i < maxRequests; i++ {
		resp, err := suite.httpClient.Get(url)
		if err != nil {
			continue
		}
		resp.Body.Close()

		if resp.StatusCode == http.StatusTooManyRequests {
			rateLimitCount++
			break
		}
	}

	// Assert
	assert.Greater(suite.T(), rateLimitCount, 0, "Rate limiting should be enforced")
}

// TestE2E_CORSHeaders tests that CORS headers are properly set by Kong
func (suite *AuthFlowTestSuite) TestE2E_CORSHeaders() {
	// Arrange
	url := suite.apiURL + "/health"
	req, err := http.NewRequest("OPTIONS", url, nil)
	require.NoError(suite.T(), err)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")

	// Act
	resp, err := suite.httpClient.Do(req)

	// Assert
	require.NoError(suite.T(), err)
	defer resp.Body.Close()

	// Kong should add CORS headers
	assert.Contains(suite.T(), resp.Header.Get("Access-Control-Allow-Origin"), "localhost:3000")
	assert.NotEmpty(suite.T(), resp.Header.Get("Access-Control-Allow-Methods"))
}

// TestE2E_ServiceDiscoveryViaKong tests that all services are accessible via Kong
func (suite *AuthFlowTestSuite) TestE2E_ServiceDiscoveryViaKong() {
	testCases := []struct {
		name           string
		endpoint       string
		expectedStatus int
	}{
		{"Content Service", "/api/v1/scripts", http.StatusUnauthorized}, // Requires auth
		{"Video Service", "/api/v1/videos", http.StatusUnauthorized},    // Requires auth
		{"Voice Service", "/api/v1/voices", http.StatusUnauthorized},    // Requires auth
		{"Translation Service", "/api/v1/translations", http.StatusUnauthorized}, // Requires auth
		{"Analytics Service", "/api/v1/analytics", http.StatusUnauthorized},      // Requires auth
		{"Trend Service", "/api/v1/trends", http.StatusUnauthorized},             // Requires auth
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Arrange
			url := suite.apiURL + tc.endpoint

			// Act
			resp, err := suite.httpClient.Get(url)

			// Assert
			require.NoError(suite.T(), err)
			defer resp.Body.Close()
			// All should return 401 (not 404), proving they're routed correctly by Kong
			assert.Equal(suite.T(), tc.expectedStatus, resp.StatusCode,
				"Service %s should be accessible via Kong", tc.name)
		})
	}
}

// Helper function to get test token (to be implemented with test fixtures)
func (suite *AuthFlowTestSuite) getTestToken() string {
	// TODO: Implement token generation for tests
	// Options:
	// 1. Use Clerk test environment token
	// 2. Mock JWT token for testing
	// 3. Use test fixtures
	return os.Getenv("TEST_CLERK_TOKEN")
}

// TestAuthFlowTestSuite runs the E2E test suite
func TestAuthFlowTestSuite(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E tests in short mode")
	}

	suite.Run(t, new(AuthFlowTestSuite))
}
