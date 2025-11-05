package repository

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JSONB is a custom type for handling PostgreSQL JSONB fields
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface
func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = make(map[string]interface{})
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// Script represents a generated script in the database
type Script struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:varchar(255);not null;index"`
	Topic        string    `json:"topic" gorm:"type:varchar(500);not null"`
	Platform     string    `json:"platform" gorm:"type:varchar(50);not null"`
	Tone         string    `json:"tone" gorm:"type:varchar(50)"`
	Duration     int       `json:"duration"`
	Language     string    `json:"language" gorm:"type:varchar(10);default:'en'"`
	Content      string    `json:"content" gorm:"type:text;not null"`
	ProviderUsed string    `json:"provider_used" gorm:"type:varchar(50)"`
	TokensUsed   int       `json:"tokens_used"`
	CostUSD      float64   `json:"cost_usd"`
	Metadata     JSONB     `json:"metadata" gorm:"type:jsonb"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for Script
func (Script) TableName() string {
	return "scripts"
}

// ScriptRepository handles script database operations
type ScriptRepository struct {
	db *gorm.DB
}

// NewScriptRepository creates a new ScriptRepository
func NewScriptRepository(db *gorm.DB) *ScriptRepository {
	return &ScriptRepository{db: db}
}

// Create saves a new script to the database
func (r *ScriptRepository) Create(ctx context.Context, script *Script) error {
	return r.db.WithContext(ctx).Create(script).Error
}

// GetByID retrieves a script by its ID
func (r *ScriptRepository) GetByID(ctx context.Context, id uuid.UUID) (*Script, error) {
	var script Script
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&script).Error
	if err != nil {
		return nil, err
	}
	return &script, nil
}

// GetByUserID retrieves all scripts for a specific user
func (r *ScriptRepository) GetByUserID(ctx context.Context, userID string, limit, offset int) ([]*Script, error) {
	var scripts []*Script
	query := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&scripts).Error
	return scripts, err
}

// Update updates an existing script
func (r *ScriptRepository) Update(ctx context.Context, script *Script) error {
	return r.db.WithContext(ctx).Save(script).Error
}

// Delete deletes a script by its ID
func (r *ScriptRepository) Delete(ctx context.Context, id uuid.UUID, userID string) error {
	return r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&Script{}).Error
}

// CountByUserID counts the total number of scripts for a user
func (r *ScriptRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&Script{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}
