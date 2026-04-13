package crawler

import (
	"context"
	"errors"
	"fmt"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"golang.org/x/net/html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

var (
	ErrInvalidURL      = errors.New("invalid URL")
	ErrRequestFailed   = errors.New("request failed")
	ErrHTMLParseFailed = errors.New("HTML parsing failed")
)

type Article struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	URL         string    `json:"url"`
	PublishedAt time.Time `json:"publishedAt"`
	Author      string    `json:"author,omitempty"`
	Source      string    `json:"source"`
	SourceURL   string    `json:"sourceUrl"`
	Tags        []string  `json:"tags"`
	Language    string    `json:"language"`
	WordCount   int       `json:"wordCount"`
	ImageURL    string    `json:"imageUrl,omitempty"`
	Category    string    `json:"category"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Config struct {
	MaxConcurrentCrawls int           `json:"maxConcurrentCrawls"`
	RequestTimeout      time.Duration `json:"requestTimeout"`
	RetryAttempts       int           `json:"retryAttempts"`
	UserAgent           string        `json:"userAgent"`
	FollowRedirects     bool          `json:"followRedirects"`
	MaxRedirects        int           `json:"maxRedirects"`
}

type StaticCrawler struct {
	config   *Config
	client   *http.Client
	seenUrls map[string]bool
	urlLock  sync.RWMutex
}

func NewStaticCrawler(config *Config) *StaticCrawler {
	if err := config.validate(); err != nil {
		panic(err)
	}

	client := &http.Client{
		Timeout: config.RequestTimeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if !config.FollowRedirects {
				return http.ErrUseLastResponse
			}
			if len(via) >= config.MaxRedirects {
				return fmt.Errorf("stopped after %d redirects", config.MaxRedirects)
			}
			return nil
		},
	}

	return &StaticCrawler{
		config:   config,
		client:   client,
		seenUrls: make(map[string]bool),
	}
}

func (c *StaticCrawler) Crawl(ctx context.Context, urls []string) ([]Article, error) {
	var wg sync.WaitGroup
	results := make(chan []Article, len(urls))
	errors := make(chan error, len(urls))

	for _, urlStr := range urls {
		wg.Add(1)
		go func(u string) {
			defer wg.Done()

			articles, err := c.crawlSingle(ctx, u)
			if err != nil {
				errors <- fmt.Errorf("failed to crawl %s: %w", u, err)
				return
			}

			results <- articles
		}(urlStr)
	}

	go func() {
		wg.Wait()
		close(results)
		close(errors)
	}()

	var allArticles []Article
	errChan := make(chan error, 1)

	go func() {
		for articles := range results {
			allArticles = append(allArticles, articles...)
		}
		errChan <- nil
	}()

	select {
	case err := <-errors:
		if err != nil {
			return nil, fmt.Errorf("crawling failed: %w", err)
		}
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-errChan:
	}

	return allArticles, nil
}

func (c *StaticCrawler) crawlSingle(ctx context.Context, urlStr string) ([]Article, error) {
	// Check if we've already crawled this URL
	c.urlLock.RLock()
	if c.seenUrls[urlStr] {
		c.urlLock.RUnlock()
		return nil, nil
	}
	c.urlLock.RUnlock()

	// Validate URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		return nil, fmt.Errorf("%w: %s", ErrInvalidURL, urlStr)
	}

	// Mark URL as seen
	c.urlLock.Lock()
	c.seenUrls[urlStr] = true
	c.urlLock.Unlock()

	// Make HTTP request
	req, err := http.NewRequestWithContext(ctx, "GET", urlStr, nil)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrRequestFailed, err)
	}

	req.Header.Set("User-Agent", c.config.UserAgent)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrRequestFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: HTTP %d", ErrRequestFailed, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrRequestFailed, err)
	}

	// Parse HTML and extract article
	article, err := extractArticleFromHTML(string(body), urlStr)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrHTMLParseFailed, err)
	}

	// Set article metadata
	article.ID = generateID(urlStr)
	article.Source = parsedURL.Host
	article.SourceURL = urlStr
	article.Language = detectLanguage(body)
	article.Category = "article"
	article.CreatedAt = time.Now()
	article.UpdatedAt = time.Now()

	return []Article{*article}, nil
}

func extractArticleFromHTML(htmlContent, baseURL string) (*Article, error) {
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return nil, err
	}

	article := &Article{}
	article.SourceURL = baseURL // Set the source URL here

	// Extract title
	title := extractTitle(doc)
	if title == "" {
		title = extractMetaTag(doc, "og:title")
	}
	article.Title = title

	// Extract content
	content := extractContent(doc)
	article.Content = content
	article.WordCount = len(strings.Fields(content))

	// Extract author
	article.Author = extractMetaTag(doc, "author")
	if article.Author == "" {
		article.Author = extractMetaTag(doc, "article:author")
	}

	// Extract publish date
	publishDateStr := extractMetaTag(doc, "publish_date")
	if publishDateStr == "" {
		publishDateStr = extractMetaTag(doc, "article:published_time")
	}
	if publishDateStr != "" {
		// Try different date formats
		formats := []string{
			time.RFC3339,
			time.RFC1123,
			time.RFC1123Z,
			"2006-01-02T15:04:05Z",
			"2006-01-02T15:04:05",
		}

		for _, format := range formats {
			if publishDate, err := time.Parse(format, publishDateStr); err == nil {
				article.PublishedAt = publishDate
				break
			}
		}
	}

	// Extract image URL
	article.ImageURL = extractMetaTag(doc, "og:image")

	// Extract tags
	tagsStr := extractMetaTag(doc, "keywords")
	if tagsStr == "" {
		tagsStr = extractMetaTag(doc, "article:tag")
	}
	if tagsStr != "" {
		article.Tags = strings.Split(tagsStr, ",")
		for i, tag := range article.Tags {
			article.Tags[i] = strings.TrimSpace(tag)
		}
	}

	if article.Title == "" {
		return nil, ErrHTMLParseFailed
	}

	return article, nil
}

func extractTitle(doc *html.Node) string {
	var title string
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "title" {
			title = n.FirstChild.Data
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)
	return title
}

func extractContent(doc *html.Node) string {
	var content strings.Builder

	// First try to find article content
	var articleContent *html.Node
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "article" {
			articleContent = n
			return
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	if articleContent != nil {
		extractTextFromNode(articleContent, &content)
	} else {
		// Fallback: extract text from body
		var body *html.Node
		f = func(n *html.Node) {
			if n.Type == html.ElementNode && n.Data == "body" {
				body = n
				return
			}
			for c := n.FirstChild; c != nil; c = c.NextSibling {
				f(c)
			}
		}
		f(doc)

		if body != nil {
			// Extract from paragraph elements in body
			var p func(*html.Node)
			p = func(n *html.Node) {
				if n.Type == html.ElementNode && n.Data == "p" {
					extractTextFromNode(n, &content)
					content.WriteString("\n")
				}
				for c := n.FirstChild; c != nil; c = c.NextSibling {
					p(c)
				}
			}
			p(body)
		}
	}

	return strings.TrimSpace(content.String())
}

func extractTextFromNode(n *html.Node, builder *strings.Builder) {
	if n.Type == html.TextNode {
		text := strings.TrimSpace(n.Data)
		if text != "" {
			if builder.Len() > 0 {
				builder.WriteString(" ")
			}
			builder.WriteString(text)
		}
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		extractTextFromNode(c, builder)
	}
}

func extractMetaTag(doc *html.Node, name string) string {
	var content string
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "meta" {
			var metaName, metaContent string
			for _, attr := range n.Attr {
				if attr.Key == "name" || attr.Key == "property" {
					metaName = attr.Val
				}
				if attr.Key == "content" {
					metaContent = attr.Val
				}
			}
			if (metaName == name || metaName == "og:"+name) && metaContent != "" {
				content = metaContent
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)
	return content
}

func matchesSelector(n *html.Node, selector string) bool {
	// Simple selector matching (can be enhanced with proper CSS selector library)
	if strings.HasPrefix(selector, ".") {
		// Class selector
		class := selector[1:]
		for _, attr := range n.Attr {
			if attr.Key == "class" {
				classes := strings.Fields(attr.Val)
				for _, c := range classes {
					if c == class {
						return true
					}
				}
			}
		}
	}
	return false
}

func detectLanguage(body []byte) string {
	// Simple language detection - look for lang attribute
	doc, _ := html.Parse(strings.NewReader(string(body)))

	var lang string
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "html" {
			for _, attr := range n.Attr {
				if attr.Key == "lang" {
					lang = attr.Val
					return
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	if lang == "" {
		lang = "en" // Default to English
	}
	return lang
}

func generateID(urlStr string) string {
	// Simple ID generation from URL
	re := regexp.MustCompile(`[^a-zA-Z0-9]`)
	return re.ReplaceAllString(urlStr, "-")
}

func (c *Config) validate() error {
	if c.MaxConcurrentCrawls <= 0 {
		return errors.New("maxConcurrentCrawls must be greater than 0")
	}
	if c.RequestTimeout <= 0 {
		return errors.New("requestTimeout must be greater than 0")
	}
	if c.RetryAttempts < 0 {
		return errors.New("retryAttempts must be non-negative")
	}
	if c.UserAgent == "" {
		return errors.New("userAgent cannot be empty")
	}
	return nil
}

func findDuplicates(articles []Article) []Article {
	urlMap := make(map[string]bool)
	var duplicates []Article

	for _, article := range articles {
		if urlMap[article.SourceURL] {
			duplicates = append(duplicates, article)
		} else {
			urlMap[article.SourceURL] = true
		}
	}

	return duplicates
}

// JSCrawlerConfig defines configuration for JavaScript-enabled crawler
type JSCrawlerConfig struct {
	MaxConcurrentBrowsers int           `json:"maxConcurrentBrowsers"`
	BrowserTimeout        time.Duration `json:"browserTimeout"`
	PageLoadTimeout       time.Duration `json:"pageLoadTimeout"`
	Headless              bool          `json:"headless"`
	UserAgent             string        `json:"userAgent"`
	WaitForSelector       string        `json:"waitForSelector,omitempty"`
	WaitTimeout           time.Duration `json:"waitTimeout,omitempty"`
}

// BrowserPool manages a pool of browser instances for concurrent crawling
type BrowserPool struct {
	config   *JSCrawlerConfig
	browsers chan *rod.Browser
	created  int
	mu       sync.Mutex
	cleanup  sync.Once
	closed   bool
}

// JSCrawler handles crawling JavaScript-rendered content
type JSCrawler struct {
	config *JSCrawlerConfig
	pool   *BrowserPool
}

// NewJSCrawler creates a new JavaScript-enabled crawler
func NewJSCrawler(config *JSCrawlerConfig) *JSCrawler {
	if err := config.validate(); err != nil {
		panic(err)
	}

	return &JSCrawler{
		config: config,
		pool:   NewBrowserPool(config),
	}
}

// NewBrowserPool creates a new browser pool
func NewBrowserPool(config *JSCrawlerConfig) *BrowserPool {
	if err := config.validate(); err != nil {
		panic(err)
	}

	pool := &BrowserPool{
		config:   config,
		browsers: make(chan *rod.Browser, config.MaxConcurrentBrowsers),
	}

	// Pre-create browsers if needed
	for i := 0; i < config.MaxConcurrentBrowsers; i++ {
		browser, err := pool.createBrowser()
		if err != nil {
			panic(fmt.Sprintf("failed to create browser: %v", err))
		}
		pool.browsers <- browser
	}

	return pool
}

// Acquire gets a browser from the pool
func (p *BrowserPool) Acquire() (*rod.Browser, error) {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return nil, errors.New("browser pool is closed")
	}
	p.mu.Unlock()

	select {
	case browser := <-p.browsers:
		return browser, nil
	case <-time.After(p.config.BrowserTimeout):
		return nil, errors.New("timeout waiting for browser from pool")
	}
}

// Release returns a browser to the pool
func (p *BrowserPool) Release(browser *rod.Browser) {
	if browser == nil {
		return
	}

	// Check if browser is still usable and pool is not closed
	select {
	case p.browsers <- browser:
		// Successfully returned to pool
	default:
		// Pool is full, close the browser
		go func() {
			if err := browser.Close(); err != nil {
				// Log error if needed
			}
		}()
	}
}

// Cleanup closes all browsers in the pool
func (p *BrowserPool) Cleanup() {
	p.cleanup.Do(func() {
		p.mu.Lock()
		p.closed = true
		p.mu.Unlock()

		close(p.browsers)
		for browser := range p.browsers {
			if browser != nil {
				go func(b *rod.Browser) {
					if err := b.Close(); err != nil {
						// Log error if needed
					}
				}(browser)
			}
		}
	})
}

func (p *BrowserPool) createBrowser() (*rod.Browser, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.created >= p.config.MaxConcurrentBrowsers {
		return nil, errors.New("maximum number of browsers reached")
	}

	// Configure launcher
	launcherURL := launcher.New().
		Headless(p.config.Headless).
		NoSandbox(true).
		Set("disable-gpu").
		MustLaunch()

	// Create browser with timeout
	browser := rod.New().
		ControlURL(launcherURL).
		Timeout(p.config.BrowserTimeout).
		MustConnect()

	// Set user agent will be handled during page navigation

	p.created++
	return browser, nil
}

// Crawl crawls JavaScript-rendered content from the given URLs
func (c *JSCrawler) Crawl(ctx context.Context, urls []string) ([]Article, error) {
	var wg sync.WaitGroup
	results := make(chan []Article, len(urls))
	errors := make(chan error, len(urls))

	// Semaphore to limit concurrent browsers
	sem := make(chan struct{}, c.config.MaxConcurrentBrowsers)

	for _, urlStr := range urls {
		wg.Add(1)
		go func(u string) {
			defer wg.Done()

			// Acquire semaphore
			select {
			case sem <- struct{}{}:
				defer func() { <-sem }()
			case <-ctx.Done():
				errors <- ctx.Err()
				return
			}

			articles, err := c.crawlSingle(ctx, u)
			if err != nil {
				errors <- fmt.Errorf("failed to crawl %s: %w", u, err)
				return
			}

			results <- articles
		}(urlStr)
	}

	go func() {
		wg.Wait()
		close(results)
		close(errors)
	}()

	var allArticles []Article
	errChan := make(chan error, 1)

	go func() {
		for articles := range results {
			allArticles = append(allArticles, articles...)
		}
		errChan <- nil
	}()

	select {
	case err := <-errors:
		if err != nil {
			return nil, fmt.Errorf("crawling failed: %w", err)
		}
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-errChan:
	}

	return allArticles, nil
}

func (c *JSCrawler) crawlSingle(ctx context.Context, urlStr string) ([]Article, error) {
	// Validate URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		return nil, fmt.Errorf("%w: %s", ErrInvalidURL, urlStr)
	}

	// Acquire browser from pool
	browser, err := c.pool.Acquire()
	if err != nil {
		return nil, fmt.Errorf("failed to acquire browser: %w", err)
	}
	defer c.pool.Release(browser)

	// Create page context with timeout
	pageCtx, cancel := context.WithTimeout(ctx, c.config.PageLoadTimeout)
	defer cancel()

	// Create new page
	page := browser.MustPage(urlStr).Context(pageCtx)

	// Wait for page load
	if c.config.WaitForSelector != "" {
		waitCtx, cancelWait := context.WithTimeout(pageCtx, c.config.WaitTimeout)
		defer cancelWait()
		page.Timeout(c.config.WaitTimeout).MustWaitLoad().MustElement(c.config.WaitForSelector)
		_ = waitCtx
	} else {
		page.MustWaitLoad()
	}

	// Get page HTML
	htmlContent, err := page.HTML()
	if err != nil {
		return nil, fmt.Errorf("failed to get page HTML: %w", err)
	}

	// Extract article using existing HTML parsing logic
	article, err := extractArticleFromHTML(htmlContent, urlStr)
	if err != nil {
		return nil, fmt.Errorf("failed to extract article: %w", err)
	}

	// Set article metadata
	article.ID = generateID(urlStr)
	article.Source = parsedURL.Host
	article.SourceURL = urlStr
	article.Language = detectLanguage([]byte(htmlContent))
	article.Category = "article"
	article.CreatedAt = time.Now()
	article.UpdatedAt = time.Now()

	// Add "js-rendered" tag to indicate this came from JS crawler
	article.Tags = append(article.Tags, "js-rendered")

	return []Article{*article}, nil
}

// validate checks if the JS crawler configuration is valid
func (c *JSCrawlerConfig) validate() error {
	if c.MaxConcurrentBrowsers <= 0 {
		return errors.New("maxConcurrentBrowsers must be greater than 0")
	}
	if c.BrowserTimeout <= 0 {
		return errors.New("browserTimeout must be greater than 0")
	}
	if c.PageLoadTimeout <= 0 {
		return errors.New("pageLoadTimeout must be greater than 0")
	}
	if c.UserAgent == "" {
		return errors.New("userAgent cannot be empty")
	}
	return nil
}
