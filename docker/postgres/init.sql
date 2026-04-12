-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS znews_test;

-- Connect to the test database
\c znews_test;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create basic tables for testing (this will be expanded by actual migrations)
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(512) NOT NULL UNIQUE,
    feed_url VARCHAR(512),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sources(id),
    title VARCHAR(500) NOT NULL,
    url VARCHAR(512) NOT NULL UNIQUE,
    content TEXT,
    summary TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some test data
INSERT INTO sources (name, url, feed_url, category) VALUES 
    ('Test News Source', 'https://example.com', 'https://example.com/feed', 'general'),
    ('Tech News', 'https://tech.example.com', 'https://tech.example.com/feed', 'technology')
ON CONFLICT (url) DO NOTHING;

INSERT INTO articles (source_id, title, url, content, published_at) VALUES
    ((SELECT id FROM sources WHERE url = 'https://example.com'), 'Test Article 1', 'https://example.com/article1', 'This is a test article content.', NOW() - INTERVAL '1 hour'),
    ((SELECT id FROM sources WHERE url = 'https://tech.example.com'), 'Test Tech Article', 'https://tech.example.com/article-tech', 'This is a test tech article.', NOW() - INTERVAL '30 minutes')
ON CONFLICT (url) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO znews;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO znews;