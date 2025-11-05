package middleware

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gofiber/fiber/v2"
)

// ClerkJWKS represents Clerk's JSON Web Key Set
type ClerkJWKS struct {
	Keys []ClerkJWK `json:"keys"`
}

// ClerkJWK represents a single JSON Web Key
type ClerkJWK struct {
	Kid string   `json:"kid"`
	Kty string   `json:"kty"`
	Use string   `json:"use"`
	N   string   `json:"n"`
	E   string   `json:"e"`
	Alg string   `json:"alg"`
	X5c []string `json:"x5c"`
}

// ClerkClaims represents the JWT claims from Clerk
type ClerkClaims struct {
	jwt.RegisteredClaims
	Azp      string                 `json:"azp"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// ClerkJWTMiddleware verifies Clerk JWT tokens
func ClerkJWTMiddleware(clerkJWKSURL string) fiber.Handler {
	// Cache the public keys
	publicKeys := make(map[string]*rsa.PublicKey)

	return func(c *fiber.Ctx) error {
		// Get Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization format. Expected: Bearer <token>",
			})
		}

		// Parse token without verification first to get the kid
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &ClerkClaims{})
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token format",
			})
		}

		// Get kid from header
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token missing kid claim",
			})
		}

		// Get or fetch public key
		publicKey, exists := publicKeys[kid]
		if !exists {
			// Fetch JWKS from Clerk
			jwks, err := fetchClerkJWKS(clerkJWKSURL)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to fetch public keys",
				})
			}

			// Find the key with matching kid
			for _, key := range jwks.Keys {
				if key.Kid == kid {
					pubKey, err := jwkToRSAPublicKey(key)
					if err != nil {
						return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
							"error": "Failed to parse public key",
						})
					}
					publicKeys[kid] = pubKey
					publicKey = pubKey
					break
				}
			}

			if publicKey == nil {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Public key not found for token",
				})
			}
		}

		// Verify token with public key
		claims := &ClerkClaims{}
		parsedToken, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Verify signing method
			if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return publicKey, nil
		})

		if err != nil || !parsedToken.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Check token expiration
		if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token expired",
			})
		}

		// Store user info in context
		c.Locals("userId", claims.Subject)
		c.Locals("userEmail", claims.Metadata["email"])
		c.Locals("claims", claims)

		return c.Next()
	}
}

// fetchClerkJWKS fetches the JSON Web Key Set from Clerk
func fetchClerkJWKS(jwksURL string) (*ClerkJWKS, error) {
	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var jwks ClerkJWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, err
	}

	return &jwks, nil
}

// jwkToRSAPublicKey converts a JWK to an RSA public key
func jwkToRSAPublicKey(jwk ClerkJWK) (*rsa.PublicKey, error) {
	// Decode the modulus
	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, err
	}

	// Decode the exponent
	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, err
	}

	// Convert exponent bytes to int
	var e int
	for _, b := range eBytes {
		e = e<<8 + int(b)
	}

	// Create the public key
	pubKey := &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: e,
	}

	return pubKey, nil
}

// AdminMiddleware checks if user has admin role
func AdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims, ok := c.Locals("claims").(*ClerkClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized",
			})
		}

		// Check if user has admin role in metadata
		role, exists := claims.Metadata["role"]
		if !exists || role != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Insufficient permissions",
			})
		}

		return c.Next()
	}
}

// AuthMiddleware is a convenience wrapper around ClerkJWTMiddleware
// It reads the JWKS URL from environment variables
func AuthMiddleware() fiber.Handler {
	jwksURL := "https://intent-guppy-15.clerk.accounts.dev/.well-known/jwks.json"
	// You can also read from env: os.Getenv("CLERK_JWKS_URL")
	return ClerkJWTMiddleware(jwksURL)
}
