package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                    uuid.UUID  `json:"id" db:"id"`
	Email                 string     `json:"email" db:"email"`
	PasswordHash          string     `json:"-" db:"password_hash"`
	Name                  string     `json:"name" db:"name"`
	Role                  string     `json:"role" db:"role"`
	SubscriptionTier      string     `json:"subscription_tier" db:"subscription_tier"`
	SubscriptionExpiresAt *time.Time `json:"subscription_expires_at,omitempty" db:"subscription_expires_at"`
	EmailVerified         bool       `json:"email_verified" db:"email_verified"`
	MFAEnabled            bool       `json:"mfa_enabled" db:"mfa_enabled"`
	MFASecret             string     `json:"-" db:"mfa_secret"`
	OAuthProvider         string     `json:"oauth_provider,omitempty" db:"oauth_provider"`
	OAuthID               string     `json:"oauth_id,omitempty" db:"oauth_id"`
	AvatarURL             string     `json:"avatar_url,omitempty" db:"avatar_url"`
	LastLoginAt           *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
	MFACode  string `json:"mfa_code,omitempty"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         *User  `json:"user"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type ForgotPasswordRequest struct{
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

type UpdateProfileRequest struct {
	Name      string `json:"name,omitempty"`
	AvatarURL string `json:"avatar_url,omitempty"`
}
