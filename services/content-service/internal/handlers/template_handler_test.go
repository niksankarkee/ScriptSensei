package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/scriptsensei/content-service/internal/handlers"
	"github.com/scriptsensei/content-service/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockTemplateService is a mock implementation of template service
type MockTemplateService struct {
	mock.Mock
}

func (m *MockTemplateService) ApplyTemplate(ctx context.Context, templateID uuid.UUID, variables map[string]string) (string, error) {
	args := m.Called(ctx, templateID, variables)
	return args.String(0), args.Error(1)
}

func (m *MockTemplateService) ListTemplates(ctx context.Context, category string, platform string, isPremium *bool) ([]*repository.Template, error) {
	args := m.Called(ctx, category, platform, isPremium)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.Template), args.Error(1)
}

func (m *MockTemplateService) GetPopularTemplates(ctx context.Context, limit int) ([]*repository.Template, error) {
	args := m.Called(ctx, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.Template), args.Error(1)
}

func (m *MockTemplateService) GetTemplateByID(ctx context.Context, templateID uuid.UUID) (*repository.Template, error) {
	args := m.Called(ctx, templateID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.Template), args.Error(1)
}

func setupTestApp() *fiber.App {
	app := fiber.New()
	return app
}

func TestTemplateHandler_ListTemplates_Success(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	// Register route
	app.Get("/api/v1/templates", handler.ListTemplates)

	expectedTemplates := []*repository.Template{
		{
			ID:          uuid.New(),
			Name:        "TikTok Viral Hook",
			Description: "Attention-grabbing opening",
			Category:    "social_media",
			Platform:    "TikTok",
			IsPremium:   false,
			UsageCount:  100,
		},
		{
			ID:          uuid.New(),
			Name:        "YouTube Tutorial",
			Description: "Step-by-step format",
			Category:    "education",
			Platform:    "YouTube",
			IsPremium:   false,
			UsageCount:  50,
		},
	}

	mockService.On("ListTemplates", mock.Anything, "", "", (*bool)(nil)).Return(expectedTemplates, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	assert.True(t, result["success"].(bool))
	data := result["data"].(map[string]interface{})
	templates := data["templates"].([]interface{})
	assert.Equal(t, 2, len(templates))
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_ListTemplates_WithFilters(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	app.Get("/api/v1/templates", handler.ListTemplates)

	expectedTemplates := []*repository.Template{
		{
			ID:       uuid.New(),
			Name:     "TikTok Template",
			Category: "social_media",
			Platform: "TikTok",
		},
	}

	isPremium := false
	mockService.On("ListTemplates", mock.Anything, "social_media", "TikTok", &isPremium).Return(expectedTemplates, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates?category=social_media&platform=TikTok&is_premium=false", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_GetTemplateByID_Success(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	templateID := uuid.New()
	app.Get("/api/v1/templates/:id", handler.GetTemplateByID)

	expectedTemplate := &repository.Template{
		ID:          templateID,
		Name:        "Test Template",
		Description: "Test description",
		Content:     "Template content with {{variable}}",
		Variables:   []string{"variable"},
	}

	mockService.On("GetTemplateByID", mock.Anything, templateID).Return(expectedTemplate, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates/"+templateID.String(), nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	assert.True(t, result["success"].(bool))
	data := result["data"].(map[string]interface{})
	assert.Equal(t, "Test Template", data["name"])
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_GetTemplateByID_InvalidID(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	app.Get("/api/v1/templates/:id", handler.GetTemplateByID)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates/invalid-uuid", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestTemplateHandler_GetTemplateByID_NotFound(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	templateID := uuid.New()
	app.Get("/api/v1/templates/:id", handler.GetTemplateByID)

	mockService.On("GetTemplateByID", mock.Anything, templateID).Return(nil, assert.AnError)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates/"+templateID.String(), nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_ApplyTemplate_Success(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	templateID := uuid.New()
	app.Post("/api/v1/templates/:id/apply", handler.ApplyTemplate)

	requestBody := map[string]interface{}{
		"variables": map[string]string{
			"name":     "John",
			"platform": "YouTube",
		},
	}

	expectedResult := "Hello John, welcome to YouTube!"

	mockService.On("ApplyTemplate", mock.Anything, templateID, mock.AnythingOfType("map[string]string")).Return(expectedResult, nil)

	bodyBytes, _ := json.Marshal(requestBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/templates/"+templateID.String()+"/apply", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	assert.True(t, result["success"].(bool))
	data := result["data"].(map[string]interface{})
	assert.Equal(t, expectedResult, data["content"])
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_ApplyTemplate_InvalidID(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	app.Post("/api/v1/templates/:id/apply", handler.ApplyTemplate)

	requestBody := map[string]interface{}{
		"variables": map[string]string{"name": "John"},
	}

	bodyBytes, _ := json.Marshal(requestBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/templates/invalid-uuid/apply", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestTemplateHandler_ApplyTemplate_InvalidRequestBody(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	templateID := uuid.New()
	app.Post("/api/v1/templates/:id/apply", handler.ApplyTemplate)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/templates/"+templateID.String()+"/apply", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestTemplateHandler_ApplyTemplate_ServiceError(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	templateID := uuid.New()
	app.Post("/api/v1/templates/:id/apply", handler.ApplyTemplate)

	requestBody := map[string]interface{}{
		"variables": map[string]string{"name": "John"},
	}

	mockService.On("ApplyTemplate", mock.Anything, templateID, mock.AnythingOfType("map[string]string")).Return("", assert.AnError)

	bodyBytes, _ := json.Marshal(requestBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/templates/"+templateID.String()+"/apply", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusInternalServerError, resp.StatusCode)
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_GetPopularTemplates_Success(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	app.Get("/api/v1/templates/popular", handler.GetPopularTemplates)

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

	mockService.On("GetPopularTemplates", mock.Anything, 10).Return(expectedTemplates, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates/popular", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	assert.True(t, result["success"].(bool))
	data := result["data"].(map[string]interface{})
	templates := data["templates"].([]interface{})
	assert.Equal(t, 2, len(templates))
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_GetPopularTemplates_WithLimit(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	app.Get("/api/v1/templates/popular", handler.GetPopularTemplates)

	expectedTemplates := []*repository.Template{
		{ID: uuid.New(), Name: "Popular 1", UsageCount: 1000},
		{ID: uuid.New(), Name: "Popular 2", UsageCount: 900},
		{ID: uuid.New(), Name: "Popular 3", UsageCount: 800},
		{ID: uuid.New(), Name: "Popular 4", UsageCount: 700},
		{ID: uuid.New(), Name: "Popular 5", UsageCount: 600},
	}

	mockService.On("GetPopularTemplates", mock.Anything, 5).Return(expectedTemplates, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates/popular?limit=5", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	data := result["data"].(map[string]interface{})
	templates := data["templates"].([]interface{})
	assert.Equal(t, 5, len(templates))
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_GetPopularTemplates_InvalidLimit(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	app.Get("/api/v1/templates/popular", handler.GetPopularTemplates)

	// Should default to 10 when invalid limit provided
	mockService.On("GetPopularTemplates", mock.Anything, 10).Return([]*repository.Template{}, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates/popular?limit=invalid", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	mockService.AssertExpectations(t)
}

func TestTemplateHandler_GenerateFromTemplate_Success(t *testing.T) {
	app := setupTestApp()
	mockService := new(MockTemplateService)
	handler := handlers.NewTemplateHandler(mockService)

	templateID := uuid.New()
	app.Post("/api/v1/templates/:id/generate", handler.GenerateFromTemplate)

	requestBody := map[string]interface{}{
		"variables": map[string]string{
			"topic":    "AI in Healthcare",
			"duration": "60",
			"platform": "YouTube",
		},
	}

	appliedContent := "Generate a 60 second video about AI in Healthcare for YouTube"

	mockService.On("ApplyTemplate", mock.Anything, templateID, mock.AnythingOfType("map[string]string")).Return(appliedContent, nil)

	bodyBytes, _ := json.Marshal(requestBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/templates/"+templateID.String()+"/generate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	assert.True(t, result["success"].(bool))
	data := result["data"].(map[string]interface{})
	assert.Equal(t, appliedContent, data["prompt"])
	mockService.AssertExpectations(t)
}
