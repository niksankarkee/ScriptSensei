package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestClerkJWTMiddleware_MissingAuthHeader tests when Authorization header is missing
func TestClerkJWTMiddleware_MissingAuthHeader(t *testing.T) {
	// Arrange
	app := fiber.New()
	app.Use(ClerkJWTMiddleware("http://mock-jwks-url"))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendString("success")
	})

	// Act
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

	var body map[string]string
	json.NewDecoder(resp.Body).Decode(&body)
	assert.Equal(t, "Missing authorization header", body["error"])
}

// TestClerkJWTMiddleware_InvalidAuthFormat tests when Authorization format is incorrect
func TestClerkJWTMiddleware_InvalidAuthFormat(t *testing.T) {
	// Arrange
	app := fiber.New()
	app.Use(ClerkJWTMiddleware("http://mock-jwks-url"))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendString("success")
	})

	// Act
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "InvalidToken")
	resp, err := app.Test(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

	var body map[string]string
	json.NewDecoder(resp.Body).Decode(&body)
	assert.Equal(t, "Invalid authorization format. Expected: Bearer <token>", body["error"])
}

// TestClerkJWTMiddleware_InvalidTokenFormat tests when JWT token format is invalid
func TestClerkJWTMiddleware_InvalidTokenFormat(t *testing.T) {
	// Arrange
	app := fiber.New()
	app.Use(ClerkJWTMiddleware("http://mock-jwks-url"))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendString("success")
	})

	// Act
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.format")
	resp, err := app.Test(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

	var body map[string]string
	json.NewDecoder(resp.Body).Decode(&body)
	assert.Contains(t, body["error"], "Invalid token format")
}

// TestClerkJWTMiddleware_MissingKidClaim tests when kid claim is missing in JWT header
func TestClerkJWTMiddleware_MissingKidClaim(t *testing.T) {
	// Arrange
	app := fiber.New()
	app.Use(ClerkJWTMiddleware("http://mock-jwks-url"))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendString("success")
	})

	// Create a token without kid in header
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "user_123",
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("secret"))

	// Act
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)
	resp, err := app.Test(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

	var body map[string]string
	json.NewDecoder(resp.Body).Decode(&body)
	assert.Equal(t, "Token missing kid claim", body["error"])
}

// TestAdminMiddleware_UnauthorizedWhenNoClaimsInContext tests AdminMiddleware without claims
func TestAdminMiddleware_UnauthorizedWhenNoClaimsInContext(t *testing.T) {
	// Arrange
	app := fiber.New()
	app.Use(AdminMiddleware())
	app.Get("/admin", func(c *fiber.Ctx) error {
		return c.SendString("admin panel")
	})

	// Act
	req := httptest.NewRequest("GET", "/admin", nil)
	resp, err := app.Test(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

	var body map[string]string
	json.NewDecoder(resp.Body).Decode(&body)
	assert.Equal(t, "Unauthorized", body["error"])
}

// TestAdminMiddleware_ForbiddenWhenNotAdmin tests AdminMiddleware with non-admin user
func TestAdminMiddleware_ForbiddenWhenNotAdmin(t *testing.T) {
	// Arrange
	app := fiber.New()

	// Simulate JWT middleware setting claims with non-admin role
	app.Use(func(c *fiber.Ctx) error {
		claims := &ClerkClaims{
			Metadata: map[string]interface{}{
				"role": "user",
			},
		}
		c.Locals("claims", claims)
		return c.Next()
	})

	app.Use(AdminMiddleware())
	app.Get("/admin", func(c *fiber.Ctx) error {
		return c.SendString("admin panel")
	})

	// Act
	req := httptest.NewRequest("GET", "/admin", nil)
	resp, err := app.Test(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusForbidden, resp.StatusCode)

	var body map[string]string
	json.NewDecoder(resp.Body).Decode(&body)
	assert.Equal(t, "Insufficient permissions", body["error"])
}

// TestAdminMiddleware_SuccessWhenAdmin tests AdminMiddleware with admin user
func TestAdminMiddleware_SuccessWhenAdmin(t *testing.T) {
	// Arrange
	app := fiber.New()

	// Simulate JWT middleware setting claims with admin role
	app.Use(func(c *fiber.Ctx) error {
		claims := &ClerkClaims{
			Metadata: map[string]interface{}{
				"role": "admin",
			},
		}
		c.Locals("claims", claims)
		return c.Next()
	})

	app.Use(AdminMiddleware())
	app.Get("/admin", func(c *fiber.Ctx) error {
		return c.SendString("admin panel")
	})

	// Act
	req := httptest.NewRequest("GET", "/admin", nil)
	resp, err := app.Test(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
}

// TestJwkToRSAPublicKey_ValidJWK tests conversion of valid JWK to RSA public key
func TestJwkToRSAPublicKey_ValidJWK(t *testing.T) {
	// Arrange
	jwk := ClerkJWK{
		Kid: "test_kid",
		Kty: "RSA",
		Use: "sig",
		N:   "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
		E:   "AQAB",
		Alg: "RS256",
	}

	// Act
	publicKey, err := jwkToRSAPublicKey(jwk)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, publicKey)
	assert.NotNil(t, publicKey.N)
	assert.Equal(t, 65537, publicKey.E) // AQAB in base64 = 65537
}

// TestJwkToRSAPublicKey_InvalidModulus tests conversion with invalid modulus
func TestJwkToRSAPublicKey_InvalidModulus(t *testing.T) {
	// Arrange
	jwk := ClerkJWK{
		Kid: "test_kid",
		Kty: "RSA",
		N:   "invalid!!!base64",
		E:   "AQAB",
	}

	// Act
	publicKey, err := jwkToRSAPublicKey(jwk)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, publicKey)
}

// TestJwkToRSAPublicKey_InvalidExponent tests conversion with invalid exponent
func TestJwkToRSAPublicKey_InvalidExponent(t *testing.T) {
	// Arrange
	jwk := ClerkJWK{
		Kid: "test_kid",
		Kty: "RSA",
		N:   "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
		E:   "invalid!!!",
	}

	// Act
	publicKey, err := jwkToRSAPublicKey(jwk)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, publicKey)
}

// Integration test would require mocking HTTP server for JWKS endpoint
// This would be part of E2E tests
