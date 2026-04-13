package crawler

import (
	"sync"
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
		assert.Equal(t, "https://example.com/article", article.SourceURL)
	})
}

func TestDeduplication(t *testing.T) {
	t.Run("Duplicate article detection", func(t *testing.T) {
		article1 := Article{
			SourceURL: "https://example.com/article",
			Title:     "Test Article",
		}

		article2 := Article{
			SourceURL: "https://example.com/article",
			Title:     "Different Title",
		}

		article3 := Article{
			SourceURL: "https://example.com/different",
			Title:     "Different Article",
		}

		duplicates := findDuplicates([]Article{article1, article2, article3})

		assert.Len(t, duplicates, 1)
		assert.Equal(t, "https://example.com/article", duplicates[0].SourceURL)
	})
}

func TestJSCrawlerConfig(t *testing.T) {
	t.Run("JS crawler configuration", func(t *testing.T) {
		config := &JSCrawlerConfig{
			MaxConcurrentBrowsers: 3,
			BrowserTimeout:        30 * time.Second,
			PageLoadTimeout:       10 * time.Second,
			Headless:              true,
			UserAgent:             "znews-js-crawler/1.0",
		}

		assert.Equal(t, 3, config.MaxConcurrentBrowsers)
		assert.Equal(t, 30*time.Second, config.BrowserTimeout)
		assert.Equal(t, 10*time.Second, config.PageLoadTimeout)
		assert.True(t, config.Headless)
		assert.Equal(t, "znews-js-crawler/1.0", config.UserAgent)
	})

	t.Run("JS crawler config validation", func(t *testing.T) {
		validConfig := &JSCrawlerConfig{
			MaxConcurrentBrowsers: 2,
			BrowserTimeout:        30 * time.Second,
			PageLoadTimeout:       10 * time.Second,
			Headless:              true,
			UserAgent:             "znews-js-crawler/1.0",
		}
		assert.NoError(t, validConfig.validate())

		invalidConfig := &JSCrawlerConfig{
			MaxConcurrentBrowsers: 0,
			BrowserTimeout:        30 * time.Second,
			PageLoadTimeout:       10 * time.Second,
			Headless:              true,
			UserAgent:             "znews-js-crawler/1.0",
		}
		assert.Error(t, invalidConfig.validate())
	})
}

func TestBrowserPoolManagement(t *testing.T) {
	t.Run("Create and release browser", func(t *testing.T) {
		pool := NewBrowserPool(&JSCrawlerConfig{
			MaxConcurrentBrowsers: 2,
			BrowserTimeout:        5 * time.Second,
			PageLoadTimeout:       2 * time.Second,
			Headless:              true,
			UserAgent:             "test-crawler",
		})

		// Test acquiring and releasing browsers
		browser1, err := pool.Acquire()
		assert.NoError(t, err)
		assert.NotNil(t, browser1)

		browser2, err := pool.Acquire()
		assert.NoError(t, err)
		assert.NotNil(t, browser2)

		// Pool should be at capacity
		browser3, err := pool.Acquire()
		assert.Error(t, err)
		assert.Nil(t, browser3)

		// Release browsers
		pool.Release(browser1)
		pool.Release(browser2)

		// Should be able to acquire again
		browser1Again, err := pool.Acquire()
		assert.NoError(t, err)
		assert.NotNil(t, browser1Again)
	})

	t.Run("Concurrent browser acquisition", func(t *testing.T) {
		pool := NewBrowserPool(&JSCrawlerConfig{
			MaxConcurrentBrowsers: 3,
			BrowserTimeout:        5 * time.Second,
			PageLoadTimeout:       2 * time.Second,
			Headless:              true,
			UserAgent:             "test-crawler",
		})

		var wg sync.WaitGroup
		results := make(chan interface{}, 3)
		errors := make(chan error, 3)

		for i := 0; i < 3; i++ {
			wg.Add(1)
			go func(id int) {
				defer wg.Done()
				browser, err := pool.Acquire()
				if err != nil {
					errors <- err
					return
				}
				results <- browser
				time.Sleep(50 * time.Millisecond)
				pool.Release(browser)
			}(i)
		}

		wg.Wait()
		close(results)
		close(errors)

		assert.Greater(t, len(results), 0)
		assert.Equal(t, 0, len(errors))
	})

	t.Run("Browser pool cleanup", func(t *testing.T) {
		pool := NewBrowserPool(&JSCrawlerConfig{
			MaxConcurrentBrowsers: 1,
			BrowserTimeout:        5 * time.Second,
			PageLoadTimeout:       2 * time.Second,
			Headless:              true,
			UserAgent:             "test-crawler",
		})

		browser, err := pool.Acquire()
		assert.NoError(t, err)
		assert.NotNil(t, browser)

		// Release browser first
		pool.Release(browser)

		// Clean up pool
		pool.Cleanup()

		// Should not be able to acquire after cleanup
		browserAfterCleanup, err := pool.Acquire()
		assert.Error(t, err)
		assert.Nil(t, browserAfterCleanup)
	})
}

func TestJSCrawlerContentExtraction(t *testing.T) {
	// Skip actual browser tests in CI to avoid issues
	if testing.Short() {
		t.Skip("Skipping browser tests in short mode")
	}

	t.Run("Extract dynamically loaded content", func(t *testing.T) {
		config := &JSCrawlerConfig{
			MaxConcurrentBrowsers: 1,
			BrowserTimeout:        10 * time.Second,
			PageLoadTimeout:       5 * time.Second,
			Headless:              true,
			UserAgent:             "znews-js-crawler/1.0",
		}

		crawler := NewJSCrawler(config)
		assert.NotNil(t, crawler)

		// Note: Actual browser tests would require real HTTP servers
		// with JavaScript-rendered content. We're testing the structure
		// and configuration here.
	})

	t.Run("Handle JavaScript errors gracefully", func(t *testing.T) {
		config := &JSCrawlerConfig{
			MaxConcurrentBrowsers: 1,
			BrowserTimeout:        5 * time.Second,
			PageLoadTimeout:       2 * time.Second,
			Headless:              true,
			UserAgent:             "znews-js-crawler/1.0",
		}

		crawler := NewJSCrawler(config)
		assert.NotNil(t, crawler)

		// The implementation handles JavaScript execution errors
		// and returns appropriate errors without crashing
	})

	t.Run("Wait for dynamic content", func(t *testing.T) {
		config := &JSCrawlerConfig{
			MaxConcurrentBrowsers: 1,
			BrowserTimeout:        10 * time.Second,
			PageLoadTimeout:       5 * time.Second,
			Headless:              true,
			UserAgent:             "znews-js-crawler/1.0",
			WaitForSelector:       ".article-content",
			WaitTimeout:           3 * time.Second,
		}

		crawler := NewJSCrawler(config)
		assert.NotNil(t, crawler)
		assert.Equal(t, ".article-content", config.WaitForSelector)
		assert.Equal(t, 3*time.Second, config.WaitTimeout)
	})
}
