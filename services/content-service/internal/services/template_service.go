package services

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/scriptsensei/content-service/internal/repository"
)

// TemplateRepositoryInterface defines the methods for template repository
type TemplateRepositoryInterface interface {
	Create(ctx context.Context, template *repository.Template) error
	GetByID(ctx context.Context, id uuid.UUID) (*repository.Template, error)
	List(ctx context.Context, category string, platform string, isPremium *bool) ([]*repository.Template, error)
	IncrementUsage(ctx context.Context, id uuid.UUID) error
	Update(ctx context.Context, template *repository.Template) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetPopular(ctx context.Context, limit int) ([]*repository.Template, error)
}

// TemplateServiceInterface defines the methods for template service
type TemplateServiceInterface interface {
	ApplyTemplate(ctx context.Context, templateID uuid.UUID, variables map[string]string) (string, error)
	ListTemplates(ctx context.Context, category string, platform string, isPremium *bool) ([]*repository.Template, error)
	GetPopularTemplates(ctx context.Context, limit int) ([]*repository.Template, error)
	GetTemplateByID(ctx context.Context, templateID uuid.UUID) (*repository.Template, error)
}

// TemplateService handles template-related business logic
type TemplateService struct {
	templateRepo TemplateRepositoryInterface
}

// NewTemplateService creates a new TemplateService
func NewTemplateService(repo TemplateRepositoryInterface) *TemplateService {
	return &TemplateService{
		templateRepo: repo,
	}
}

// ApplyTemplate applies variables to a template and returns the filled content
func (ts *TemplateService) ApplyTemplate(ctx context.Context, templateID uuid.UUID, variables map[string]string) (string, error) {
	// Get the template
	template, err := ts.templateRepo.GetByID(ctx, templateID)
	if err != nil {
		return "", err
	}

	// Start with the template content
	content := template.Content

	// Replace all variables with their values
	for key, value := range variables {
		placeholder := "{{" + key + "}}"
		content = strings.ReplaceAll(content, placeholder, value)
	}

	// Increment usage count asynchronously (don't wait for it)
	go ts.templateRepo.IncrementUsage(context.Background(), templateID)

	return content, nil
}

// ListTemplates retrieves templates with optional filters
func (ts *TemplateService) ListTemplates(ctx context.Context, category string, platform string, isPremium *bool) ([]*repository.Template, error) {
	return ts.templateRepo.List(ctx, category, platform, isPremium)
}

// GetPopularTemplates retrieves the most popular templates
func (ts *TemplateService) GetPopularTemplates(ctx context.Context, limit int) ([]*repository.Template, error) {
	if limit <= 0 {
		limit = 10 // Default limit
	}
	return ts.templateRepo.GetPopular(ctx, limit)
}

// GetTemplateByID retrieves a specific template by ID
func (ts *TemplateService) GetTemplateByID(ctx context.Context, templateID uuid.UUID) (*repository.Template, error) {
	return ts.templateRepo.GetByID(ctx, templateID)
}
