package repository_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/scriptsensei/content-service/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// setupTestDB creates a test database connection
func setupTemplateTestDB(t *testing.T) *gorm.DB {
	dsn := "host=localhost user=scriptsensei password=dev_password dbname=scriptsensei port=5433 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	require.NoError(t, err, "Failed to connect to test database")

	// Auto-migrate the template table
	err = db.AutoMigrate(&repository.Template{})
	require.NoError(t, err, "Failed to migrate template table")

	return db
}

// cleanupTemplates deletes all test templates
func cleanupTemplates(t *testing.T, db *gorm.DB) {
	db.Exec("DELETE FROM templates WHERE category = 'test'")
}

func TestTemplateRepository_Create(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	template := &repository.Template{
		Name:        "Test Template",
		Description: "A test template",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "This is a {{variable}} test template",
		Variables:   []string{"variable"},
		IsPremium:   false,
	}

	err := repo.Create(ctx, template)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, template.ID)
}

func TestTemplateRepository_GetByID_Success(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create a template first
	template := &repository.Template{
		Name:        "Test Template",
		Description: "A test template",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "Test content with {{variable}}",
		Variables:   []string{"variable"},
		IsPremium:   false,
	}

	err := repo.Create(ctx, template)
	require.NoError(t, err)

	// Retrieve it by ID
	retrieved, err := repo.GetByID(ctx, template.ID)
	assert.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, template.Name, retrieved.Name)
	assert.Equal(t, template.Content, retrieved.Content)
	assert.Equal(t, template.Variables, retrieved.Variables)
}

func TestTemplateRepository_GetByID_NotFound(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Try to get non-existent template
	nonExistentID := uuid.New()
	retrieved, err := repo.GetByID(ctx, nonExistentID)

	assert.Error(t, err)
	assert.Nil(t, retrieved)
}

func TestTemplateRepository_List_AllTemplates(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create multiple test templates
	templates := []*repository.Template{
		{
			Name:        "Template 1",
			Description: "First test template",
			Category:    "test",
			Platform:    "YouTube",
			Content:     "Content 1",
			Variables:   []string{"var1"},
			IsPremium:   false,
		},
		{
			Name:        "Template 2",
			Description: "Second test template",
			Category:    "test",
			Platform:    "TikTok",
			Content:     "Content 2",
			Variables:   []string{"var2"},
			IsPremium:   true,
		},
	}

	for _, tmpl := range templates {
		err := repo.Create(ctx, tmpl)
		require.NoError(t, err)
	}

	// List all test templates
	retrieved, err := repo.List(ctx, "", "", nil)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(retrieved), 2)
}

func TestTemplateRepository_List_FilterByCategory(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create templates with different categories
	socialTemplate := &repository.Template{
		Name:        "Social Media Template",
		Description: "For social media",
		Category:    "test",
		Platform:    "TikTok",
		Content:     "Social content",
		Variables:   []string{"topic"},
		IsPremium:   false,
	}

	err := repo.Create(ctx, socialTemplate)
	require.NoError(t, err)

	// Filter by category
	retrieved, err := repo.List(ctx, "test", "", nil)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(retrieved), 1)

	// Verify all results match category
	for _, tmpl := range retrieved {
		assert.Equal(t, "test", tmpl.Category)
	}
}

func TestTemplateRepository_List_FilterByPlatform(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create templates for different platforms
	youtubeTemplate := &repository.Template{
		Name:        "YouTube Template",
		Description: "For YouTube",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "YouTube content",
		Variables:   []string{"topic"},
		IsPremium:   false,
	}

	err := repo.Create(ctx, youtubeTemplate)
	require.NoError(t, err)

	// Filter by platform
	retrieved, err := repo.List(ctx, "", "YouTube", nil)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(retrieved), 1)

	// Verify all results match platform
	for _, tmpl := range retrieved {
		assert.Equal(t, "YouTube", tmpl.Platform)
	}
}

func TestTemplateRepository_List_FilterByPremium(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create free and premium templates
	freeTemplate := &repository.Template{
		Name:        "Free Template",
		Description: "Free for all",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "Free content",
		Variables:   []string{"topic"},
		IsPremium:   false,
	}

	premiumTemplate := &repository.Template{
		Name:        "Premium Template",
		Description: "Premium only",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "Premium content",
		Variables:   []string{"topic"},
		IsPremium:   true,
	}

	err := repo.Create(ctx, freeTemplate)
	require.NoError(t, err)

	err = repo.Create(ctx, premiumTemplate)
	require.NoError(t, err)

	// Filter by free templates
	isPremium := false
	retrieved, err := repo.List(ctx, "", "", &isPremium)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(retrieved), 1)

	// Verify all results are free
	for _, tmpl := range retrieved {
		assert.False(t, tmpl.IsPremium)
	}
}

func TestTemplateRepository_IncrementUsage(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create a template
	template := &repository.Template{
		Name:        "Usage Test Template",
		Description: "For testing usage increment",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "Test content",
		Variables:   []string{"topic"},
		IsPremium:   false,
		UsageCount:  0,
	}

	err := repo.Create(ctx, template)
	require.NoError(t, err)

	initialUsage := template.UsageCount

	// Increment usage
	err = repo.IncrementUsage(ctx, template.ID)
	assert.NoError(t, err)

	// Verify usage increased
	retrieved, err := repo.GetByID(ctx, template.ID)
	assert.NoError(t, err)
	assert.Equal(t, initialUsage+1, retrieved.UsageCount)

	// Increment again
	err = repo.IncrementUsage(ctx, template.ID)
	assert.NoError(t, err)

	retrieved, err = repo.GetByID(ctx, template.ID)
	assert.NoError(t, err)
	assert.Equal(t, initialUsage+2, retrieved.UsageCount)
}

func TestTemplateRepository_Update(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create a template
	template := &repository.Template{
		Name:        "Original Name",
		Description: "Original description",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "Original content",
		Variables:   []string{"topic"},
		IsPremium:   false,
	}

	err := repo.Create(ctx, template)
	require.NoError(t, err)

	// Update the template
	template.Name = "Updated Name"
	template.Description = "Updated description"
	template.Content = "Updated content with {{new_variable}}"
	template.Variables = []string{"new_variable"}

	err = repo.Update(ctx, template)
	assert.NoError(t, err)

	// Verify updates
	retrieved, err := repo.GetByID(ctx, template.ID)
	assert.NoError(t, err)
	assert.Equal(t, "Updated Name", retrieved.Name)
	assert.Equal(t, "Updated description", retrieved.Description)
	assert.Equal(t, "Updated content with {{new_variable}}", retrieved.Content)
	assert.Equal(t, []string{"new_variable"}, retrieved.Variables)
}

func TestTemplateRepository_Delete(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create a template
	template := &repository.Template{
		Name:        "Template to Delete",
		Description: "Will be deleted",
		Category:    "test",
		Platform:    "YouTube",
		Content:     "Content to delete",
		Variables:   []string{"topic"},
		IsPremium:   false,
	}

	err := repo.Create(ctx, template)
	require.NoError(t, err)

	// Delete the template
	err = repo.Delete(ctx, template.ID)
	assert.NoError(t, err)

	// Verify deletion
	retrieved, err := repo.GetByID(ctx, template.ID)
	assert.Error(t, err)
	assert.Nil(t, retrieved)
}

func TestTemplateRepository_GetPopular(t *testing.T) {
	db := setupTemplateTestDB(t)
	defer cleanupTemplates(t, db)

	repo := repository.NewTemplateRepository(db)
	ctx := context.Background()

	// Create templates with different usage counts
	templates := []*repository.Template{
		{
			Name:        "Popular Template",
			Description: "Most used",
			Category:    "test",
			Platform:    "YouTube",
			Content:     "Popular content",
			Variables:   []string{"topic"},
			IsPremium:   false,
			UsageCount:  100,
		},
		{
			Name:        "Less Popular Template",
			Description: "Less used",
			Category:    "test",
			Platform:    "YouTube",
			Content:     "Less popular content",
			Variables:   []string{"topic"},
			IsPremium:   false,
			UsageCount:  10,
		},
	}

	for _, tmpl := range templates {
		err := repo.Create(ctx, tmpl)
		require.NoError(t, err)
	}

	// Get popular templates
	popular, err := repo.GetPopular(ctx, 5)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(popular), 2)

	// Verify they are ordered by usage count (descending)
	if len(popular) >= 2 {
		assert.GreaterOrEqual(t, popular[0].UsageCount, popular[1].UsageCount)
	}
}
