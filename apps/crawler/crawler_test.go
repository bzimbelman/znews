package crawler

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestCrawlerConfig(t *testing.T) {
	t.Run("Default configuration", func(t *testing.T) {
		config := &Config{
			MaxConcurrentCrawls: 5,
			RequestTimeout:      30 * time.Second,
			RetryAttempts:       3,
			UserAgent:           "znews-crawler/1.0",
		}

		assert.Equal(t, 5, config.MaxConcurrentCrawls)
		assert.Equal(t, 30*time.Second, config.RequestTimeout)
		assert.Equal(t, 3, config.RetryAttempts)
		assert.Equal(t, "znews-crawler/1.0", config.UserAgent)
	})
}

func TestArticleExtraction(t *testing.T) {
	t.Run("Extract article from HTML", func(t *testing.T) {
		html := `
		<html>
			<head><title>Test Article</title></head>
			<body>
				<div class="content">
					<p>This is the article content with multiple paragraphs.</p>
					<p>Second paragraph here.</p>
				</div>
			</body>
		</html>
		`

		article, err := extractArticleFromHTML(html, "https://example.com/article")

		assert.NoError(t, err)
		assert.Equal(t, "Test Article", article.Title)
		assert.Contains(t, article.Content, "This is the article content")
		assert.Equal(t, "https://example.com/article", article.URL)
	})
}

func TestDeduplication(t *testing.T) {
	t.Run("Duplicate article detection", func(t *testing.T) {
		article1 := Article{
			URL:   "https://example.com/article",
			Title: "Test Article",
		}

		article2 := Article{
			URL:   "https://example.com/article",
			Title: "Different Title",
		}

		article3 := Article{
			URL:   "https://example.com/different",
			Title: "Different Article",
		}

		duplicates := findDuplicates([]Article{article1, article2, article3})

		assert.Len(t, duplicates, 1)
		assert.Equal(t, "https://example.com/article", duplicates[0].URL)
	})
}
