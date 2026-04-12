"""Test file for discovery service"""

import pytest
from typing import List
from znews_discovery.models import Article, Embedding
from znews_discovery.services.embedding_service import EmbeddingService


@pytest.fixture
def embedding_service():
    return EmbeddingService()


@pytest.fixture
def sample_articles():
    return [
        Article(
            title="AI research breakthrough",
            content="Scientists have made a breakthrough in artificial intelligence research...",
            category="technology",
            tags=["AI", "research", "breakthrough"]
        ),
        Article(
            title="Machine learning applications",
            content="Machine learning is being applied across various industries...",
            category="technology",
            tags=["ML", "applications", "AI"]
        ),
        Article(
            title="Sports championship finals",
            content="The championship finals were an exciting match...",
            category="sports",
            tags=["sports", "championship", "finals"]
        )
    ]


class TestEmbeddingService:
    def test_compute_embeddings(self, embedding_service: EmbeddingService, sample_articles: List[Article]):
        """Test that embeddings are computed correctly"""
        embeddings = embedding_service.compute_embeddings(sample_articles)
        
        assert len(embeddings) == len(sample_articles)
        assert all(isinstance(e, Embedding) for e in embeddings)
        assert all(len(e.vector) > 0 for e in embeddings)
        
    def test_similarity_scoring(self, embedding_service: EmbeddingService):
        """Test similarity scoring between articles"""
        article1 = Article(
            title="AI research breakthrough",
            content="Scientists have made a breakthrough in artificial intelligence research...",
            category="technology"
        )
        
        article2 = Article(
            title="Machine learning applications", 
            content="Machine learning is being applied across various industries...",
            category="technology"
        )
        
        article3 = Article(
            title="Sports championship finals",
            content="The championship finals were an exciting match...",
            category="sports"
        )
        
        embeddings = embedding_service.compute_embeddings([article1, article2, article3])
        
        # Similar articles should have higher similarity scores
        tech_similarity = embedding_service.calculate_similarity(embeddings[0], embeddings[1])
        cross_category_similarity = embedding_service.calculate_similarity(embeddings[0], embeddings[2])
        
        assert tech_similarity > cross_category_similarity
        assert 0 <= tech_similarity <= 1
        assert 0 <= cross_category_similarity <= 1
        
    def test_source_similarity_matching(self, embedding_service: EmbeddingService):
        """Test source similarity matching functionality"""
        sources = [
            {"name": "Tech News", "description": "Latest technology news and updates"},
            {"name": "AI Journal", "description": "Research papers and articles about artificial intelligence"},
            {"name": "Sports Daily", "description": "Daily sports news and analysis"}
        ]
        
        similarities = embedding_service.match_source_similarity(sources)
        
        assert len(similarities) == len(sources)
        assert all(0 <= similarity <= 1 for similarity in similarities.values())
        
        # AI Journal should be most similar to Tech News
        assert similarities["AI Journal"] > similarities["Sports Daily"]