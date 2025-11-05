"""
Image Provider Service

Provides images for video scenes from various sources:
- Unsplash API (free stock photos)
- Pexels API (free stock photos)
- Fallback to placeholder images

Features:
- Multi-provider support with fallback
- Image caching to reduce API calls
- Keyword extraction from scene text
- Rate limit handling
"""

import os
import requests
import hashlib
from typing import Optional, List
from pathlib import Path
import re
from deep_translator import GoogleTranslator


class ImageProviderError(Exception):
    """Exception raised when image provider fails"""
    pass


class UnsplashProvider:
    """
    Unsplash API integration

    Free tier: 50 requests/hour
    https://unsplash.com/developers
    """

    API_URL = "https://api.unsplash.com/search/photos"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Unsplash provider

        Args:
            api_key: Unsplash Access Key (or from UNSPLASH_ACCESS_KEY env var)
        """
        self.api_key = api_key or os.getenv("UNSPLASH_ACCESS_KEY")
        if not self.api_key:
            raise ImageProviderError("Unsplash API key not provided")

    def search_image(self, query: str, orientation: str = "landscape") -> str:
        """
        Search for image on Unsplash

        Args:
            query: Search query
            orientation: Image orientation (landscape, portrait, squarish)

        Returns:
            Path to downloaded image

        Raises:
            ImageProviderError: If search or download fails
        """
        try:
            # Make API request
            headers = {"Authorization": f"Client-ID {self.api_key}"}
            params = {
                "query": query,
                "per_page": 1,
                "orientation": orientation
            }

            response = requests.get(self.API_URL, headers=headers, params=params, timeout=10)

            if response.status_code == 429:
                raise ImageProviderError("Rate limit exceeded for Unsplash API")
            elif response.status_code != 200:
                raise ImageProviderError(f"Unsplash API error: {response.status_code} - {response.text}")

            data = response.json()

            if not data.get("results"):
                raise ImageProviderError(f"No images found for query: {query}")

            # Get first result
            photo = data["results"][0]
            image_url = photo["urls"]["regular"]
            photo_id = photo["id"]

            # Download image
            download_dir = Path("/tmp/scriptsensei/images")
            download_dir.mkdir(parents=True, exist_ok=True)

            image_path = self._download_image(image_url, str(download_dir), f"unsplash_{photo_id}")

            return image_path

        except requests.RequestException as e:
            raise ImageProviderError(f"Unsplash request failed: {str(e)}") from e

    def _download_image(self, url: str, download_dir: str, filename: str) -> str:
        """
        Download image from URL

        Args:
            url: Image URL
            download_dir: Directory to save image
            filename: Filename (without extension)

        Returns:
            Path to downloaded image
        """
        try:
            response = requests.get(url, timeout=30)

            if response.status_code != 200:
                raise ImageProviderError(f"Failed to download image: {response.status_code}")

            # Save image
            image_path = Path(download_dir) / f"{filename}.jpg"
            image_path.write_bytes(response.content)

            return str(image_path)

        except requests.RequestException as e:
            raise ImageProviderError(f"Image download failed: {str(e)}") from e


class PexelsProvider:
    """
    Pexels API integration

    Free tier: 200 requests/hour
    https://www.pexels.com/api/
    """

    API_URL = "https://api.pexels.com/v1/search"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Pexels provider

        Args:
            api_key: Pexels API key (or from PEXELS_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("PEXELS_API_KEY")
        if not self.api_key:
            raise ImageProviderError("Pexels API key not provided")

    def search_image(self, query: str, orientation: str = "landscape") -> str:
        """
        Search for image on Pexels

        Args:
            query: Search query
            orientation: Image orientation (landscape, portrait, square)

        Returns:
            Path to downloaded image

        Raises:
            ImageProviderError: If search or download fails
        """
        try:
            # Make API request
            headers = {"Authorization": self.api_key}
            params = {
                "query": query,
                "per_page": 1,
                "orientation": orientation
            }

            response = requests.get(self.API_URL, headers=headers, params=params, timeout=10)

            if response.status_code == 429:
                raise ImageProviderError("Rate limit exceeded for Pexels API")
            elif response.status_code != 200:
                raise ImageProviderError(f"Pexels API error: {response.status_code} - {response.text}")

            data = response.json()

            if not data.get("photos"):
                raise ImageProviderError(f"No images found for query: {query}")

            # Get first result
            photo = data["photos"][0]
            image_url = photo["src"]["large"]
            photo_id = photo["id"]

            # Download image
            download_dir = Path("/tmp/scriptsensei/images")
            download_dir.mkdir(parents=True, exist_ok=True)

            image_path = self._download_image(image_url, str(download_dir), f"pexels_{photo_id}")

            return image_path

        except requests.RequestException as e:
            raise ImageProviderError(f"Pexels request failed: {str(e)}") from e

    def _download_image(self, url: str, download_dir: str, filename: str) -> str:
        """
        Download image from URL

        Args:
            url: Image URL
            download_dir: Directory to save image
            filename: Filename (without extension)

        Returns:
            Path to downloaded image
        """
        try:
            response = requests.get(url, timeout=30)

            if response.status_code != 200:
                raise ImageProviderError(f"Failed to download image: {response.status_code}")

            # Save image
            image_path = Path(download_dir) / f"{filename}.jpg"
            image_path.write_bytes(response.content)

            return str(image_path)

        except requests.RequestException as e:
            raise ImageProviderError(f"Image download failed: {str(e)}") from e


class ImageProvider:
    """
    Image Provider Service

    Orchestrates multiple image providers with caching and fallback logic.
    """

    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize image provider

        Args:
            cache_dir: Directory for caching images (default: /tmp/scriptsensei/image_cache)
        """
        self.cache_dir = Path(cache_dir or "/tmp/scriptsensei/image_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Initialize providers (gracefully handle missing API keys)
        self.unsplash = None
        self.pexels = None

        try:
            self.unsplash = UnsplashProvider()
        except ImageProviderError:
            print("Warning: Unsplash API key not configured")

        try:
            self.pexels = PexelsProvider()
        except ImageProviderError:
            print("Warning: Pexels API key not configured")

        # Provider rotation index for load balancing
        self.current_provider_index = 0

    def get_image(
        self,
        text: str,
        style: str = "modern",
        provider: Optional[str] = None
    ) -> str:
        """
        Get an image based on text description

        Args:
            text: Text description for the image
            style: Image style (not used yet, reserved for future)
            provider: Specific provider to use ("unsplash", "pexels", or None for auto)

        Returns:
            Path to the image file

        Raises:
            ImageProviderError: If query is empty
        """
        if not text or not text.strip():
            raise ImageProviderError("Query cannot be empty")

        print(f"\n[ImageProvider] ===== GET IMAGE REQUEST =====")
        print(f"[ImageProvider] Input text: {text[:100]}...")
        print(f"[ImageProvider] Text length: {len(text)} characters")
        print(f"[ImageProvider] Provider requested: {provider}")

        # Detect language/character type
        has_non_latin = bool(re.search(r'[^\x00-\x7F]', text))
        print(f"[ImageProvider] Contains non-Latin characters: {has_non_latin}")
        if has_non_latin:
            # Sample first 50 chars to show what we're working with
            print(f"[ImageProvider] Sample non-Latin text: {text[:50]}")

        # Extract keywords from text
        keywords = self._extract_keywords(text)
        query = " ".join(keywords[:3])  # Use top 3 keywords

        print(f"[ImageProvider] Extracted keywords: {keywords}")
        print(f"[ImageProvider] Keyword count: {len(keywords)}")
        print(f"[ImageProvider] Final search query: '{query}'")

        # Check cache first
        if provider:
            cache_key = self._get_cache_key(query, provider)
            cached_path = self.cache_dir / f"{cache_key}.jpg"

            if cached_path.exists():
                return str(cached_path)

        # Try to fetch from specified or available providers
        providers_to_try = []

        if provider == "unsplash" and self.unsplash:
            providers_to_try = [("unsplash", self.unsplash)]
        elif provider == "pexels" and self.pexels:
            providers_to_try = [("pexels", self.pexels)]
        else:
            # Auto mode: try all available providers
            if self.unsplash:
                providers_to_try.append(("unsplash", self.unsplash))
            if self.pexels:
                providers_to_try.append(("pexels", self.pexels))

        # Validate query before making API calls
        if not query or not query.strip():
            print(f"[ImageProvider] ⚠️ WARNING: Empty query after keyword extraction!")
            print(f"[ImageProvider] Falling back to placeholder image")
            return self._create_placeholder("empty query")

        # Try each provider with fallback
        print(f"\n[ImageProvider] ===== TRYING IMAGE PROVIDERS =====")
        print(f"[ImageProvider] Available providers: {[p[0] for p in providers_to_try]}")

        for provider_name, provider_obj in providers_to_try:
            try:
                print(f"[ImageProvider] Attempting {provider_name} with query: '{query}'")
                image_path = provider_obj.search_image(query)
                print(f"[ImageProvider] ✅ {provider_name} SUCCESS! Image path: {image_path}")

                # Cache the image
                cache_key = self._get_cache_key(query, provider_name)
                cached_path = self.cache_dir / f"{cache_key}.jpg"

                # Copy to cache
                import shutil
                shutil.copy(image_path, cached_path)
                print(f"[ImageProvider] Image cached at: {cached_path}")

                return image_path

            except ImageProviderError as e:
                print(f"[ImageProvider] ❌ {provider_name} FAILED: {str(e)}")
                continue  # Try next provider

        # All providers failed, return placeholder
        print(f"[ImageProvider] ⚠️ All providers failed! Creating placeholder")
        return self._create_placeholder(query)

    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text for image search
        Translates non-English text to English before extraction

        Args:
            text: Input text (any language)

        Returns:
            List of English keywords
        """
        print(f"\n[ImageProvider] ===== KEYWORD EXTRACTION =====")
        print(f"[ImageProvider] Original text: {text[:100]}")

        # Detect if text contains non-Latin characters
        has_non_latin = bool(re.search(r'[^\x00-\x7F]', text))
        print(f"[ImageProvider] Has non-Latin characters: {has_non_latin}")

        if has_non_latin:
            try:
                # Translate to English for image search using deep-translator
                print(f"[ImageProvider] Attempting translation to English...")
                print(f"[ImageProvider] Input for translation: {text[:50]}...")

                # GoogleTranslator from deep-translator (auto-detect source language)
                translator = GoogleTranslator(source='auto', target='en')
                translated_text = translator.translate(text)

                print(f"[ImageProvider] Translation successful!")
                print(f"[ImageProvider] Translated text: {translated_text[:100]}")

                text = translated_text

            except Exception as e:
                print(f"[ImageProvider] ❌ Translation FAILED: {type(e).__name__}: {str(e)}")
                print(f"[ImageProvider] Fallback: Will try to extract any Latin words from original text")
                # Fallback: try to extract any Latin words that exist
                pass

        # Remove common stop words
        stop_words = {
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "about", "as", "is", "was", "are", "were",
            "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "this", "that", "these", "those", "it", "its", "you", "your", "he",
            "she", "his", "her", "they", "them", "their", "we", "us", "our"
        }

        # Extract words (alphanumeric only)
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        print(f"[ImageProvider] Extracted words: {words[:10]} (showing first 10)")

        # Filter stop words and short words
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        print(f"[ImageProvider] Keywords after filtering: {keywords[:10]}")
        print(f"[ImageProvider] Total keywords found: {len(keywords)}")

        # Fallback: If no keywords extracted, use generic terms
        if not keywords:
            print(f"[ImageProvider] ⚠️ WARNING: No keywords extracted!")
            print(f"[ImageProvider] Using fallback generic keywords")
            fallback_keywords = ["nature", "landscape", "background"]
            return fallback_keywords

        result_keywords = keywords[:5]  # Return top 5 keywords
        print(f"[ImageProvider] Final keywords to return: {result_keywords}")

        return result_keywords

    def _get_cache_key(self, query: str, provider: str) -> str:
        """
        Generate cache key for query and provider

        Args:
            query: Search query
            provider: Provider name

        Returns:
            Cache key (hash)
        """
        cache_string = f"{provider}:{query}".lower()
        return hashlib.md5(cache_string.encode()).hexdigest()

    def _create_placeholder(self, query: str) -> str:
        """
        Create placeholder image when all providers fail
        Creates a solid color image without text to avoid "Placeholder" appearing in videos

        Args:
            query: Original query (for debug/logging)

        Returns:
            Path to placeholder image
        """
        from PIL import Image

        print(f"[ImageProvider] WARNING: Creating placeholder for query: {query}")

        placeholder_path = self.cache_dir / "placeholder.jpg"

        # Create a solid color gradient background (no text)
        # Using a neutral, professional color scheme
        img = Image.new('RGB', (1920, 1080), color=(60, 80, 100))  # Blue-gray

        img.save(placeholder_path, 'JPEG', quality=95)

        return str(placeholder_path)
