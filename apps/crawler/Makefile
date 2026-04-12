.PHONY: build test clean fmt vet lint deps

# Build the application
build:
	go build -o bin/crawler ./cmd/crawler

# Run tests
test:
	go test -v -race -coverprofile=coverage.out ./...

# Run tests with coverage
test-cov:
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	rm -rf bin/ coverage.out coverage.html

# Format code
fmt:
	go fmt ./...

# Run vet
vet:
	go vet ./...

# Run linter
lint:
	golangci-lint run

# Install dependencies
deps:
	go mod download
	go mod tidy

# Run all checks
check: fmt vet lint test