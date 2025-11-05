# Clerk Authentication Integration

ScriptSensei Global uses [Clerk](https://clerk.com/) for authentication and user management.

## Why Clerk?

- **Ease of Integration**: Drop-in components for Next.js
- **Pre-built UI**: Beautiful, customizable sign-in/sign-up flows
- **Security**: Enterprise-grade security with MFA, SSO support
- **User Management**: Built-in user dashboard and admin features
- **JWT Tokens**: Seamless integration with backend microservices
- **Multi-provider OAuth**: Google, GitHub, Facebook, etc.

## Configuration

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aW50ZW50LWd1cHB5LTE1LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_weJA64im6lehcSdRWLrn3Nt1iSYo4LJd4b9bCBBjA0

# Backend Services
CLERK_SECRET_KEY=sk_test_weJA64im6lehcSdRWLrn3Nt1iSYo4LJd4b9bCBBjA0
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_JWT_KEY=clerk-jwt-public-key
```

## Frontend Integration

### 1. ClerkProvider Setup

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 2. Middleware for Route Protection

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)"],
  ignoredRoutes: ["/api/webhook"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 3. Using Clerk Components

```typescript
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal" />
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  )
}
```

### 4. Accessing User Data

```typescript
import { currentUser } from '@clerk/nextjs'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
    </div>
  )
}
```

## Backend Integration

### JWT Verification in Go Services

```go
package middleware

import (
    "context"
    "fmt"
    "net/http"
    "strings"

    "github.com/clerk/clerk-sdk-go/clerk"
    "github.com/gofiber/fiber/v2"
)

func ClerkAuthMiddleware(clerkClient clerk.Client) fiber.Handler {
    return func(c *fiber.Ctx) error {
        // Get token from Authorization header
        authHeader := c.Get("Authorization")
        if authHeader == "" {
            return c.Status(401).JSON(fiber.Map{
                "error": "Missing authorization header",
            })
        }

        // Extract token
        token := strings.TrimPrefix(authHeader, "Bearer ")

        // Verify token with Clerk
        claims, err := clerkClient.VerifyToken(token)
        if err != nil {
            return c.Status(401).JSON(fiber.Map{
                "error": "Invalid token",
            })
        }

        // Store user ID in context
        c.Locals("userId", claims.Subject)
        return c.Next()
    }
}
```

### JWT Verification in Python Services

```python
from clerk_backend_api import Clerk
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    try:
        # Verify JWT token
        token = credentials.credentials
        claims = clerk.jwt_templates.verify(token)
        return claims["sub"]  # Return user ID
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")
```

### JWT Verification in Node.js Services

```javascript
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function verifyClerkToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const session = await clerkClient.sessions.verifySession(token);
    req.userId = session.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { verifyClerkToken };
```

## Kong API Gateway Integration

Kong handles JWT verification for all backend services:

```bash
# Add JWT plugin to Kong service
curl -X POST http://localhost:8001/services/content-service/plugins \
  --data "name=jwt" \
  --data "config.claims_to_verify=exp" \
  --data "config.key_claim_name=kid" \
  --data "config.secret_is_base64=false"
```

## Webhooks

Clerk sends webhooks for user events (creation, updates, deletions):

### 1. Setup Webhook Endpoint

```typescript
// app/api/webhook/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id!,
      "svix-timestamp": svix_timestamp!,
      "svix-signature": svix_signature!,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Error verifying webhook', { status: 400 })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    // Sync user to your database
    await syncUserToDatabase({
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name,
      lastName: last_name,
    })
  }

  return new Response('', { status: 200 })
}
```

### 2. Configure Webhook in Clerk Dashboard

1. Go to https://dashboard.clerk.com/
2. Navigate to **Webhooks** section
3. Add endpoint: `https://your-domain.com/api/webhook/clerk`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
5. Copy the webhook secret to your `.env.local`

## User Metadata

### Storing Custom Data

```typescript
import { clerkClient } from '@clerk/nextjs'

// Update user metadata
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    subscriptionTier: 'pro',
    creditsRemaining: 100,
  },
  privateMetadata: {
    stripeCustomerId: 'cus_xxx',
  }
})
```

### Accessing Metadata

```typescript
import { currentUser } from '@clerk/nextjs'

const user = await currentUser()
const subscriptionTier = user?.publicMetadata?.subscriptionTier
const creditsRemaining = user?.publicMetadata?.creditsRemaining
```

## API Routes with Authentication

```typescript
// app/api/scripts/route.ts
import { auth } from '@clerk/nextjs'

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Fetch user's scripts
  const scripts = await getScriptsByUserId(userId)
  return Response.json(scripts)
}
```

## Subscription Management

### Syncing with Database

When a user signs up or updates:

```sql
-- Users table with Clerk integration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
```

## Testing

### Local Testing

1. Start frontend: `cd frontend && npm run dev`
2. Visit: http://localhost:3000
3. Click "Sign In" to test Clerk authentication
4. Create test user or use existing

### Backend Token Testing

```bash
# Get JWT token from browser (in Network tab after login)
TOKEN="eyJhbGc..."

# Test backend endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/scripts
```

## Migration from Custom Auth

If migrating from custom JWT authentication:

1. **Remove custom auth code** from services
2. **Install Clerk SDKs** for each service
3. **Update middleware** to use Clerk verification
4. **Migrate user data** to Clerk via API
5. **Update frontend** to use Clerk components

## Security Best Practices

1. **Never expose CLERK_SECRET_KEY** in frontend
2. **Use HTTPS** in production
3. **Validate webhook signatures** properly
4. **Store sensitive data** in privateMetadata
5. **Implement rate limiting** on webhooks
6. **Set up MFA** for admin accounts
7. **Regular security audits** via Clerk dashboard

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk SDK for Go](https://github.com/clerk/clerk-sdk-go)
- [Clerk SDK for Python](https://github.com/clerk/clerk-sdk-python)
- [Clerk SDK for Node.js](https://www.npmjs.com/package/@clerk/clerk-sdk-node)

## Support

For Clerk-specific issues:
- Documentation: https://clerk.com/docs
- Community: https://clerk.com/discord
- Support: support@clerk.com

For ScriptSensei integration issues:
- Check this documentation
- Review example code in `/frontend` directory
- Open GitHub issue
