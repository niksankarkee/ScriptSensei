package services_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/scriptsensei/content-service/internal/repository"
	"github.com/scriptsensei/content-service/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockTemplateRepository is a mock implementation of template repository
type MockTemplateRepository struct {
	mock.Mock
}

func (m *MockTemplateRepository) Create(ctx context.Context, template *repository.Template) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockTemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*repository.Template, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.Template), args.Error(1)
}

func (m *MockTemplateRepository) List(ctx context.Context, category string, platform string, isPremium *bool) ([]*repository.Template, error) {
	args := m.Called(ctx, category, platform, isPremium)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.Template), args.Error(1)
}

func (m *MockTemplateRepository) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTemplateRepository) Update(ctx context.Context, template *repository.Template) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockTemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTemplateRepository) GetPopular(ctx context.Context, limit int) ([]*repository.Template, error) {
	args := m.Called(ctx, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.Template), args.Error(1)
}

func TestTemplateService_ApplyTemplate_Success(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	templateID := uuid.New()
	template := &repository.Template{
		ID:      templateID,
		Content: "Hello {{name}}, welcome to {{platform}}!",
	}

	variables := map[string]string{
		"name":     "John",
		"platform": "YouTube",
	}

	mockRepo.On("GetByID", ctx, templateID).Return(template, nil)
	mockRepo.On("IncrementUsage", ctx, templateID).Return(nil)

	result, err := service.ApplyTemplate(ctx, templateID, variables)

	assert.NoError(t, err)
	assert.Equal(t, "Hello John, welcome to YouTube!", result)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ApplyTemplate_MultipleVariables(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	templateID := uuid.New()
	template := &repository.Template{
		ID:      templateID,
		Content: "Generate a {{duration}} second video about {{topic}} for {{platform}} with a {{tone}} tone.",
	}

	variables := map[string]string{
		"duration": "60",
		"topic":    "AI in Healthcare",
		"platform": "TikTok",
		"tone":     "professional",
	}

	mockRepo.On("GetByID", ctx, templateID).Return(template, nil)
	mockRepo.On("IncrementUsage", ctx, templateID).Return(nil)

	result, err := service.ApplyTemplate(ctx, templateID, variables)

	assert.NoError(t, err)
	assert.Equal(t, "Generate a 60 second video about AI in Healthcare for TikTok with a professional tone.", result)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ApplyTemplate_PartialVariables(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	templateID := uuid.New()
	template := &repository.Template{
		ID:      templateID,
		Content: "Topic: {{topic}}, Duration: {{duration}}",
	}

	// Only provide one variable
	variables := map[string]string{
		"topic": "AI",
	}

	mockRepo.On("GetByID", ctx, templateID).Return(template, nil)
	mockRepo.On("IncrementUsage", ctx, templateID).Return(nil)

	result, err := service.ApplyTemplate(ctx, templateID, variables)

	assert.NoError(t, err)
	// Unreplaced variables should remain as-is
	assert.Contains(t, result, "AI")
	assert.Contains(t, result, "{{duration}}")
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ApplyTemplate_TemplateNotFound(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	templateID := uuid.New()
	variables := map[string]string{"name": "John"}

	mockRepo.On("GetByID", ctx, templateID).Return(nil, assert.AnError)

	result, err := service.ApplyTemplate(ctx, templateID, variables)

	assert.Error(t, err)
	assert.Empty(t, result)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ApplyTemplate_EmptyVariables(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	templateID := uuid.New()
	template := &repository.Template{
		ID:      templateID,
		Content: "Static template with no variables",
	}

	variables := map[string]string{}

	mockRepo.On("GetByID", ctx, templateID).Return(template, nil)
	mockRepo.On("IncrementUsage", ctx, templateID).Return(nil)

	result, err := service.ApplyTemplate(ctx, templateID, variables)

	assert.NoError(t, err)
	assert.Equal(t, "Static template with no variables", result)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ListTemplates_AllFilters(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	category := "social_media"
	platform := "TikTok"
	isPremium := false

	expectedTemplates := []*repository.Template{
		{
			ID:          uuid.New(),
			Name:        "TikTok Viral Hook",
			Category:    "social_media",
			Platform:    "TikTok",
			IsPremium:   false,
			UsageCount:  100,
		},
	}

	mockRepo.On("List", ctx, category, platform, &isPremium).Return(expectedTemplates, nil)

	result, err := service.ListTemplates(ctx, category, platform, &isPremium)

	assert.NoError(t, err)
	assert.Equal(t, len(expectedTemplates), len(result))
	assert.Equal(t, expectedTemplates[0].Name, result[0].Name)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ListTemplates_NoFilters(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	expectedTemplates := []*repository.Template{
		{
			ID:   uuid.New(),
			Name: "Template 1",
		},
		{
			ID:   uuid.New(),
			Name: "Template 2",
		},
	}

	mockRepo.On("List", ctx, "", "", (*bool)(nil)).Return(expectedTemplates, nil)

	result, err := service.ListTemplates(ctx, "", "", nil)

	assert.NoError(t, err)
	assert.Equal(t, 2, len(result))
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ListTemplates_CategoryOnly(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	category := "education"

	expectedTemplates := []*repository.Template{
		{
			ID:       uuid.New(),
			Name:     "Educational Template",
			Category: "education",
		},
	}

	mockRepo.On("List", ctx, category, "", (*bool)(nil)).Return(expectedTemplates, nil)

	result, err := service.ListTemplates(ctx, category, "", nil)

	assert.NoError(t, err)
	assert.Equal(t, 1, len(result))
	assert.Equal(t, "education", result[0].Category)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_ListTemplates_PlatformOnly(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	platform := "YouTube"

	expectedTemplates := []*repository.Template{
		{
			ID:       uuid.New(),
			Name:     "YouTube Template",
			Platform: "YouTube",
		},
	}

	mockRepo.On("List", ctx, "", platform, (*bool)(nil)).Return(expectedTemplates, nil)

	result, err := service.ListTemplates(ctx, "", platform, nil)

	assert.NoError(t, err)
	assert.Equal(t, 1, len(result))
	assert.Equal(t, "YouTube", result[0].Platform)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_GetPopularTemplates(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	limit := 10

	expectedTemplates := []*repository.Template{
		{
			ID:         uuid.New(),
			Name:       "Most Popular",
			UsageCount: 1000,
		},
		{
			ID:         uuid.New(),
			Name:       "Second Popular",
			UsageCount: 500,
		},
	}

	mockRepo.On("GetPopular", ctx, limit).Return(expectedTemplates, nil)

	result, err := service.GetPopularTemplates(ctx, limit)

	assert.NoError(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, "Most Popular", result[0].Name)
	assert.GreaterOrEqual(t, result[0].UsageCount, result[1].UsageCount)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_GetTemplateByID(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	templateID := uuid.New()
	expectedTemplate := &repository.Template{
		ID:   templateID,
		Name: "Test Template",
	}

	mockRepo.On("GetByID", ctx, templateID).Return(expectedTemplate, nil)

	result, err := service.GetTemplateByID(ctx, templateID)

	assert.NoError(t, err)
	assert.Equal(t, expectedTemplate.Name, result.Name)
	mockRepo.AssertExpectations(t)
}

func TestTemplateService_GetTemplateByID_NotFound(t *testing.T) {
	mockRepo := new(MockTemplateRepository)
	service := services.NewTemplateService(mockRepo)
	ctx := context.Background()

	templateID := uuid.New()

	mockRepo.On("GetByID", ctx, templateID).Return(nil, assert.AnError)

	result, err := service.GetTemplateByID(ctx, templateID)

	assert.Error(t, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}
