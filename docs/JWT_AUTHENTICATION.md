# JWT Authentication in ScriptSensei

## Overview

ScriptSensei uses **Clerk-issued JWT tokens** for authentication. This provides enterprise-grade security while maintaining flexibility for microservices.

## Important: JWT is NOT Removed!

**Clerk provides JWT authentication** - we're using Clerk's JWT tokens instead of custom JWT implementation.

### What Changed:
- ❌ Removed: Custom JWT generation/verification code
- ❌ Removed: Manual OAuth 2.0 integration
- ✅ Added: Clerk JWT tokens (automatic)
- ✅ Added: Kong Gateway JWT verification
- ✅ Added: Backend JWT verification middleware

## Authentication Flow

```
┌──────────┐
│  User    │ 1. Signs in via Clerk
└────┬─────┘
     │
     ▼
┌──────────────────┐
│  Clerk Service   │ 2. Issues JWT Token
└────┬─────────────┘
     │ JWT: eyJhbGc...
     ▼
┌──────────────────┐
│  Frontend App    │ 3. Stores token, makes API calls
└────┬─────────────┘
     │ Authorization: Bearer eyJhbGc...
     ▼
┌──────────────────┐
│  Kong Gateway    │ 4. Verifies JWT with Clerk JWKS
└────┬─────────────┘
     │ Valid? Yes → Forward request
     │ Valid? No → Return 401
     ▼
┌──────────────────┐
│  Backend Service │ 5. Processes authenticated request
└──────────────────┘
```

## JWT Token Structure

### Example Clerk JWT Token

```
eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yYWJjMTIzIiwidHlwIjoiSldUIn0.
eyJhenAiOiJodHRwczovL3lvdXItYXBwLmNvbSIsImV4cCI6MTczNTY4OTYwMCwiaWF0IjoxNzM1Njg2MDAwLCJpc3MiOiJodHRwczovL2ludGVudC1ndXBweS0xNS5jbGVyay5hY2NvdW50cy5kZXYiLCJuYmYiOjE3MzU2ODYwMDAsInNpZCI6InNlc3NfMnh5ejQ1NiIsInN1YiI6InVzZXJfMmFiYzc4OSIsIm1ldGFkYXRhIjp7ImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwic3Vic2NyaXB0aW9uVGllciI6InBybyJ9fQ.
signature...
```

### Decoded Header
```json
{
  "alg": "RS256",
  "kid": "ins_2abc123",
  "typ": "JWT"
}
```

### Decoded Payload
```json
{
  "azp": "https://your-app.com",
  "exp": 1735689600,
  "iat": 1735686000,
  "iss": "https://intent-guppy-15.clerk.accounts.dev",
  "nbf": 1735686000,
  "sid": "sess_2xyz456",
  "sub": "user_2abc789",
  "metadata": {
    "email": "user@example.com",
    "role": "user",
    "subscriptionTier": "pro",
    "creditsRemaining": 100
  }
}
```

### Key Claims:
- **sub**: User ID - use this as primary identifier
- **iss**: Issuer - must be your Clerk instance URL
- **exp**: Expiration - token lifetime (default: 1 hour)
- **sid**: Session ID - unique per login session
- **azp**: Authorized party - your application URL
- **metadata**: Custom user data (role, subscription, etc.)

## Implementation per Service

### 1. Content Service (Go)

```go
// main.go
package main

import (
    "os"
    "github.com/scriptsensei/content-service/internal/middleware"
)

func main() {
    app := fiber.New()

    // Option A: Trust Kong (Recommended)
    app.Use("/api", middleware.TrustKongHeaders())

    // Option B: Verify JWT in service
    app.Use("/api", middleware.ClerkJWTMiddleware(
        os.Getenv("CLERK_JWKS_URL"),
    ))

    // Protected routes
    app.Get("/api/v1/scripts", getScripts)
}
```

**Trust Kong Middleware** (Recommended):
```go
// internal/middleware/auth.go
func TrustKongHeaders() fiber.Handler {
    return func(c *fiber.Ctx) error {
        userId := c.Get("X-User-Id")
        if userId == "" {
            return c.Status(401).JSON(fiber.Map{
                "error": "Unauthorized",
            })
        }
        c.Locals("userId", userId)
        return c.Next()
    }
}
```

**Direct JWT Verification**:
```go
// Use the ClerkJWTMiddleware from:
// services/auth-service/internal/middleware/clerk_jwt.go
```

### 2. Video Processing Service (Python/FastAPI)

```python
# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
from clerk_backend_api import Clerk
import os

app = FastAPI()
security = HTTPBearer()
clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

# Option A: Trust Kong
async def get_current_user_from_headers(request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_id

# Option B: Verify JWT
async def verify_jwt_token(credentials = Depends(security)):
    try:
        token = credentials.credentials
        session = clerk.sessions.verify_token(token)
        return session["sub"]
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/v1/videos")
async def get_videos(user_id: str = Depends(verify_jwt_token)):
    return {"videos": [], "user_id": user_id}
```

### 3. Translation Service (Node.js/Express)

```javascript
// middleware/auth.js
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Option A: Trust Kong
function trustKongHeaders(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = userId;
  next();
}

// Option B: Verify JWT
async function verifyJWT(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const session = await clerkClient.sessions.verifyToken(token);
    req.userId = session.userId;
    req.sessionId = session.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { trustKongHeaders, verifyJWT };
```

## Kong Gateway JWT Configuration

Kong handles JWT verification for all services:

### 1. Configure JWT Plugin

```bash
# Enable JWT plugin on a service
curl -X POST http://localhost:8001/services/content-service/plugins \
  --data "name=jwt" \
  --data "config.uri_param_names=jwt" \
  --data "config.claims_to_verify=exp" \
  --data "config.key_claim_name=kid" \
  --data "config.secret_is_base64=false"
```

### 2. Add Clerk Public Keys

Kong needs Clerk's public keys to verify JWT signatures:

```bash
# Create a consumer for Clerk
curl -X POST http://localhost:8001/consumers \
  --data "username=clerk"

# Add JWT credential with Clerk's public key
curl -X POST http://localhost:8001/consumers/clerk/jwt \
  --data "key=clerk-jwt" \
  --data "algorithm=RS256" \
  --data "rsa_public_key=@clerk_public.pem"
```

### 3. Get Clerk Public Key

Visit: `https://intent-guppy-15.clerk.accounts.dev/.well-known/jwks.json`

Convert JWKS to PEM format for Kong.

## Environment Variables

```bash
# .env file

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aW50ZW50LWd1cHB5LTE1LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_weJA64im6lehcSdRWLrn3Nt1iSYo4LJd4b9bCBBjA0

# JWT Verification
CLERK_JWT_ISSUER=https://intent-guppy-15.clerk.accounts.dev
CLERK_JWKS_URL=https://intent-guppy-15.clerk.accounts.dev/.well-known/jwks.json
JWT_ALGORITHM=RS256

# Service-to-Service (Optional)
INTERNAL_JWT_SECRET=your-internal-jwt-secret-for-service-communication
INTERNAL_JWT_EXPIRY=1h
```

## Frontend Usage

### Getting JWT Token

```typescript
import { useAuth } from '@clerk/nextjs'

function MyComponent() {
  const { getToken, userId } = useAuth()

  async function makeAPICall() {
    // Get JWT token
    const token = await getToken()

    // Make authenticated request
    const response = await fetch('http://localhost:8000/api/v1/scripts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    return data
  }
}
```

### Server-Side API Calls

```typescript
// app/api/scripts/route.ts
import { auth } from '@clerk/nextjs'

export async function GET() {
  const { getToken, userId } = auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const token = await getToken()

  // Call backend service
  const response = await fetch('http://localhost:8000/api/v1/scripts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  return response
}
```

## Testing JWT Authentication

### 1. Get Token from Browser

```javascript
// Open browser console on your app
const token = await window.Clerk.session.getToken()
console.log(token)
// Copy the token
```

### 2. Test with cURL

```bash
# Replace YOUR_JWT_TOKEN with actual token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/scripts
```

### 3. Test with Postman

1. Create new request
2. Set Authorization type to "Bearer Token"
3. Paste Clerk JWT token
4. Send request

### 4. Decode JWT (Debugging)

Visit https://jwt.io/ and paste your token to inspect:
- Header (algorithm, key ID)
- Payload (user ID, claims, expiration)
- Signature verification

## Security Best Practices

### ✅ Do's

1. **Always verify JWT signature** using Clerk's public keys
2. **Check expiration** (exp claim) - tokens expire after 1 hour
3. **Validate issuer** (iss claim) matches your Clerk instance
4. **Use HTTPS** in production (prevents token interception)
5. **Store tokens securely** (Clerk SDK handles this)
6. **Rotate keys regularly** (Clerk handles this automatically)
7. **Implement rate limiting** on authentication endpoints
8. **Log authentication failures** for security monitoring
9. **Use short token lifetime** (Clerk default: 1 hour)
10. **Verify audience** (azp claim) if using multiple apps

### ❌ Don'ts

1. **Never store tokens in localStorage** in production (XSS risk)
2. **Never log JWT tokens** (contains sensitive data)
3. **Never commit Clerk secret key** to version control
4. **Never skip signature verification** (trust but verify)
5. **Never accept expired tokens** (check exp claim)
6. **Never use HTTP** in production (use HTTPS only)
7. **Never share tokens** between users
8. **Never store tokens in URL parameters** (logged in access logs)

## Troubleshooting

### Issue: "Invalid token" error

**Causes**:
- Token expired (check exp claim)
- Invalid signature (wrong public key)
- Token format incorrect

**Solutions**:
```bash
# 1. Check token expiration
jwt_payload=$(echo $TOKEN | cut -d '.' -f 2)
echo $jwt_payload | base64 -d | jq .exp

# 2. Verify JWKS URL is accessible
curl https://intent-guppy-15.clerk.accounts.dev/.well-known/jwks.json

# 3. Check Clerk dashboard for issues
```

### Issue: "Missing authorization header"

**Causes**:
- Frontend not sending token
- CORS blocking headers
- Token not attached to request

**Solutions**:
```typescript
// Ensure token is attached
const token = await getToken()
console.log('Token:', token) // Check if token exists

// Check headers in request
headers: {
  'Authorization': `Bearer ${token}`,  // Ensure 'Bearer ' prefix
}
```

### Issue: Kong returns 401

**Causes**:
- JWT plugin not configured
- Public key not added to Kong
- kid mismatch

**Solutions**:
```bash
# Check JWT plugin status
curl http://localhost:8001/services/content-service/plugins

# Re-configure Kong
./scripts/configure-kong.sh

# Check Kong logs
docker logs scriptsensei-kong
```

## Service-to-Service Authentication

For internal service communication (optional):

### Generate Internal JWT

```go
// internal/utils/jwt.go
func GenerateInternalJWT(serviceId string) (string, error) {
    claims := jwt.MapClaims{
        "sub": serviceId,
        "exp": time.Now().Add(time.Hour).Unix(),
        "iat": time.Now().Unix(),
        "iss": "scriptsensei-internal",
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(os.Getenv("INTERNAL_JWT_SECRET")))
}
```

### Verify Internal JWT

```go
func VerifyInternalJWT(tokenString string) (string, error) {
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("INTERNAL_JWT_SECRET")), nil
    })

    if err != nil || !token.Valid {
        return "", errors.New("invalid token")
    }

    claims := token.Claims.(jwt.MapClaims)
    return claims["sub"].(string), nil
}
```

## Resources

- [Clerk JWT Documentation](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [JWT.io Debugger](https://jwt.io/)
- [Kong JWT Plugin Docs](https://docs.konghq.com/hub/kong-inc/jwt/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [RS256 vs HS256](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/)

## Summary

**Yes, JWT authentication is still used!** We're using Clerk's JWT tokens which are:
- ✅ Industry-standard (RS256 algorithm)
- ✅ Secure (signed with Clerk's private key)
- ✅ Verifiable (using Clerk's public JWKS)
- ✅ Automatic (Clerk SDK handles everything)
- ✅ Flexible (works with Kong + backend services)

The difference is that **Clerk manages the JWT lifecycle** (generation, signing, refresh) instead of custom code, which is more secure and maintainable.
