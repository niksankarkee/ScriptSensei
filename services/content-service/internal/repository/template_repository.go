package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// Template represents a script template in the database
type Template struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string         `json:"name" gorm:"type:varchar(255);not null"`
	Description string         `json:"description" gorm:"type:text"`
	Category    string         `json:"category" gorm:"type:varchar(100);not null;index"`
	Platform    string         `json:"platform" gorm:"type:varchar(50);not null;index"`
	Content     string         `json:"content" gorm:"type:text;not null"`
	Variables   pq.StringArray `json:"variables" gorm:"type:text[]"`
	IsPremium   bool           `json:"is_premium" gorm:"default:false;index"`
	UsageCount  int            `json:"usage_count" gorm:"default:0"`
	CreatedAt   time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for Template
func (Template) TableName() string {
	return "templates"
}

// TemplateRepository handles template database operations
type TemplateRepository struct {
	db *gorm.DB
}

// NewTemplateRepository creates a new TemplateRepository
func NewTemplateRepository(db *gorm.DB) *TemplateRepository {
	return &TemplateRepository{db: db}
}

// Create saves a new template to the database
func (r *TemplateRepository) Create(ctx context.Context, template *Template) error {
	return r.db.WithContext(ctx).Create(template).Error
}

// GetByID retrieves a template by its ID
func (r *TemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*Template, error) {
	var template Template
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

// List retrieves templates filtered by category, platform, and premium status
func (r *TemplateRepository) List(ctx context.Context, category string, platform string, isPremium *bool) ([]*Template, error) {
	var templates []*Template

	query := r.db.WithContext(ctx)

	// Apply filters if provided
	if category != "" {
		query = query.Where("category = ?", category)
	}

	if platform != "" {
		query = query.Where("platform = ?", platform)
	}

	if isPremium != nil {
		query = query.Where("is_premium = ?", *isPremium)
	}

	// Order by usage count (most popular first) then by name
	query = query.Order("usage_count DESC, name ASC")

	err := query.Find(&templates).Error
	return templates, err
}

// IncrementUsage increments the usage count for a template
func (r *TemplateRepository) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&Template{}).
		Where("id = ?", id).
		UpdateColumn("usage_count", gorm.Expr("usage_count + ?", 1)).Error
}

// Update updates an existing template
func (r *TemplateRepository) Update(ctx context.Context, template *Template) error {
	return r.db.WithContext(ctx).Save(template).Error
}

// Delete deletes a template by its ID
func (r *TemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(&Template{}).Error
}

// GetPopular retrieves the most popular templates by usage count
func (r *TemplateRepository) GetPopular(ctx context.Context, limit int) ([]*Template, error) {
	var templates []*Template

	if limit <= 0 {
		limit = 10 // Default limit
	}

	err := r.db.WithContext(ctx).
		Order("usage_count DESC, created_at DESC").
		Limit(limit).
		Find(&templates).Error

	return templates, err
}
