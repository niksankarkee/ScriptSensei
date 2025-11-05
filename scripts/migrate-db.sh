#!/bin/bash

# Database Migration Script
# Runs all database migrations for ScriptSensei

set -e

echo "🗄️  Running database migrations..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run PostgreSQL migrations
echo "📊 PostgreSQL migrations..."

# Detect PostgreSQL container name
# First try to find ScriptSensei PostgreSQL container (for application data)
PG_CONTAINER=$(docker ps --format "{{.Names}}\t{{.Image}}" | grep -E "postgres|postgis" | grep "scriptsensei-postgres" | awk '{print $1}' | head -1)

# If not found, do NOT use generic search as we need the specific ScriptSensei database
if [ -z "$PG_CONTAINER" ]; then
    echo "❌ ScriptSensei PostgreSQL container (scriptsensei-postgres) not found"
    echo "   Make sure you have started the infrastructure with: make dev"
    echo ""
    echo "   Available PostgreSQL containers:"
    docker ps --format "   - {{.Names}} ({{.Image}})" | grep postgres
    exit 1
fi

if [ -z "$PG_CONTAINER" ]; then
    echo "❌ No PostgreSQL container found"
    echo "   Make sure PostgreSQL or PostGIS container is running"
    echo "   Available containers:"
    docker ps --format "   - {{.Names}} ({{.Image}})"
    exit 1
fi

echo "  Using PostgreSQL container: $PG_CONTAINER"

# Create migrations table if it doesn't exist
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
    );
EOSQL

# Auth Service migrations
echo "  - Auth Service tables..."
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        subscription_tier VARCHAR(50) DEFAULT 'free',
        subscription_expires_at TIMESTAMP,
        email_verified BOOLEAN DEFAULT FALSE,
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret VARCHAR(255),
        oauth_provider VARCHAR(50),
        oauth_id VARCHAR(255),
        avatar_url VARCHAR(500),
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_expires_at);
    CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
EOSQL

# Content Service migrations
echo "  - Content Service tables..."
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    -- Scripts table
    CREATE TABLE IF NOT EXISTS scripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500),
        content TEXT NOT NULL,
        language VARCHAR(10) NOT NULL,
        platform VARCHAR(50),
        tone VARCHAR(50),
        duration_seconds INT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_scripts_user ON scripts(user_id);
    CREATE INDEX IF NOT EXISTS idx_scripts_platform ON scripts(platform);
    CREATE INDEX IF NOT EXISTS idx_scripts_created ON scripts(created_at DESC);

    -- Templates table
    CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        preview_url VARCHAR(1000),
        config JSONB NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        usage_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
EOSQL

# Video Processing Service migrations
echo "  - Video Processing Service tables..."
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    -- Videos table
    CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
        title VARCHAR(500),
        status VARCHAR(50) DEFAULT 'queued',
        url VARCHAR(1000),
        thumbnail_url VARCHAR(1000),
        duration_seconds INT,
        resolution VARCHAR(20),
        aspect_ratio VARCHAR(10),
        file_size_mb DECIMAL(10,2),
        platform VARCHAR(50),
        metadata JSONB,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
    CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
    CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);
EOSQL

# Voice Service migrations
echo "  - Voice Service tables..."
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    -- Voice Profiles table
    CREATE TABLE IF NOT EXISTS voice_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        provider_voice_id VARCHAR(255),
        language VARCHAR(10),
        settings JSONB,
        sample_url VARCHAR(1000),
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_voice_profiles_user ON voice_profiles(user_id);
EOSQL

# Analytics Service migrations
echo "  - Analytics Service tables..."
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    -- Usage Statistics table
    CREATE TABLE IF NOT EXISTS usage_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        resource_id UUID,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_stats(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_action ON usage_stats(action_type);
    CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_stats(created_at DESC);
EOSQL

# Subscription Service migrations
echo "  - Subscription Service tables..."
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
EOSQL

# Insert migration record
docker exec -i $PG_CONTAINER psql -U scriptsensei -d scriptsensei_dev <<-EOSQL
    INSERT INTO schema_migrations (version) VALUES ('001_initial_schema')
    ON CONFLICT (version) DO NOTHING;
EOSQL

echo "✅ Database migrations completed successfully!"
echo ""
echo "📊 Created tables:"
echo "   - users"
echo "   - scripts"
echo "   - videos"
echo "   - templates"
echo "   - voice_profiles"
echo "   - usage_stats"
echo "   - subscriptions"
echo ""
