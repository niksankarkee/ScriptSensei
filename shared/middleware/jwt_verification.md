# JWT Verification Middleware

This document explains how JWT authentication works in ScriptSensei with Clerk.

## Architecture Overview

```
Frontend (Clerk SDK) → Issues JWT → Kong Gateway → Verifies JWT → Backend Services
                                          ↓
                                    Uses Clerk JWKS
```

## How It Works

### 1. Frontend (Next.js with Clerk)

```typescript
import { useAuth } from '@clerk/nextjs'

function MyComponent() {
  const { getToken } = useAuth()

  async function makeAPICall() {
    // Get JWT token from Clerk
    const token = await getToken()

    // Make API call with token
    const response = await fetch('http://localhost:8000/api/v1/scripts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }
}
```

### 2. Kong API Gateway

Kong verifies the JWT using Clerk's public keys:

```bash
# JWT plugin configuration
curl -X POST http://localhost:8001/services/content-service/plugins \
  --data "name=jwt" \
  --data "config.uri_param_names=jwt" \
  --data "config.key_claim_name=kid" \
  --data "config.secret_is_base64=false"
```

### 3. Backend Services (Go Example)

Option A: **Trust Kong** (Recommended)
```go
// Kong already verified JWT, just trust the headers
func AuthMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        // Kong adds these headers after JWT verification
        userId := c.Get("X-User-Id")
        userEmail := c.Get("X-User-Email")

        if userId == "" {
            return c.Status(401).JSON(fiber.Map{
                "error": "Unauthorized",
            })
        }

        c.Locals("userId", userId)
        c.Locals("userEmail", userEmail)
        return c.Next()
    }
}
```

Option B: **Verify JWT in Service** (Double verification)
```go
// Use the ClerkJWTMiddleware from clerk_jwt.go
app.Use(middleware.ClerkJWTMiddleware(
    "https://intent-guppy-15.clerk.accounts.dev/.well-known/jwks.json"
))
```

## Clerk JWT Structure

### JWT Header
```json
{
  "alg": "RS256",
  "kid": "ins_2abc123...",
  "typ": "JWT"
}
```

### JWT Payload (Claims)
```json
{
  "azp": "https://your-app.com",
  "exp": 1735689600,
  "iat": 1735686000,
  "iss": "https://intent-guppy-15.clerk.accounts.dev",
  "nbf": 1735686000,
  "sid": "sess_2xyz456...",
  "sub": "user_2abc789...",
  "metadata": {
    "email": "user@example.com",
    "role": "user",
    "subscriptionTier": "pro"
  }
}
```

### Important Claims:
- **sub**: User ID (use this to identify the user)
- **iss**: Issuer (Clerk instance URL)
- **exp**: Expiration timestamp
- **sid**: Session ID
- **metadata**: Custom user data

## Environment Variables

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER=https://intent-guppy-15.clerk.accounts.dev
CLERK_JWT_AUDIENCE=your-audience-claim

# JWKS URL (for fetching public keys)
CLERK_JWKS_URL=https://intent-guppy-15.clerk.accounts.dev/.well-known/jwks.json
```

## Implementation per Language

### Go (Fiber)
```go
import "github.com/scriptsensei/auth-service/internal/middleware"

app.Use("/api", middleware.ClerkJWTMiddleware(os.Getenv("CLERK_JWKS_URL")))
```

### Python (FastAPI)
```python
from clerk_backend_api import Clerk
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()
clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

async def verify_jwt(credentials = Security(security)):
    try:
        token = credentials.credentials
        # Verify with Clerk
        session = clerk.sessions.verify_token(token)
        return session["sub"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Node.js (Express)
```javascript
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  try {
    const session = await clerkClient.sessions.verifyToken(token);
    req.userId = session.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

## Kong JWT Configuration

Kong can verify Clerk JWTs automatically:

```bash
# Add JWT consumer
curl -X POST http://localhost:8001/consumers \
  --data "username=clerk"

# Add JWT credential
curl -X POST http://localhost:8001/consumers/clerk/jwt \
  --data "key=clerk-instance" \
  --data "rsa_public_key=@clerk_public_key.pem"

# Enable JWT plugin on service
curl -X POST http://localhost:8001/services/content-service/plugins \
  --data "name=jwt"
```

## Testing JWT Authentication

### 1. Get Token from Frontend
```javascript
// In browser console
const token = await window.Clerk.session.getToken()
console.log(token)
```

### 2. Test with cURL
```bash
# Replace TOKEN with actual JWT
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/scripts
```

### 3. Decode JWT (for debugging)
Visit https://jwt.io/ and paste the token to inspect claims.

## Security Best Practices

1. **Always verify JWT signature** using Clerk's public keys
2. **Check expiration** (exp claim)
3. **Validate issuer** (iss claim matches your Clerk instance)
4. **Use HTTPS** in production
5. **Short token lifetime** (Clerk defaults to 1 hour)
6. **Rotate keys** regularly (Clerk handles this)
7. **Never log tokens** in production
8. **Rate limit** authentication endpoints

## Troubleshooting

### Token Expired
```
Solution: Clerk SDK automatically refreshes tokens.
Check if frontend is using latest @clerk/nextjs version.
```

### Invalid Signature
```
Solution: Ensure JWKS URL is correct and accessible.
Verify kid in JWT header matches a key in JWKS.
```

### Missing Claims
```
Solution: Check Clerk dashboard session settings.
Ensure required claims are enabled.
```

### CORS Issues
```
Solution: Configure Kong CORS plugin or backend CORS.
Ensure Authorization header is allowed.
```

## Resources

- [Clerk JWT Documentation](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [JWT.io Debugger](https://jwt.io/)
- [Kong JWT Plugin](https://docs.konghq.com/hub/kong-inc/jwt/)
- [RS256 Algorithm](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/)
