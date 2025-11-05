"""
Video Stock Provider Service

Provides actual video clips (not just images) for scenes from various sources:
- Pexels Videos API (free stock videos)
- Pixabay Videos API (free stock videos)
- Fallback to image provider if videos not available

This replaces static images with real moving video footage.
"""

import os
import requests
import hashlib
from typing import Optional, List, Dict, Any
from pathlib import Path
import re
from deep_translator import GoogleTranslator


class VideoStockError(Exception):
    """Exception raised when video stock provider fails"""
    pass


class PexelsVideoProvider:
    """
    Pexels Videos API integration

    Free tier: 200 requests/hour
    https://www.pexels.com/api/documentation/#videos
    """

    API_URL = "https://api.pexels.com/videos/search"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Pexels video provider

        Args:
            api_key: Pexels API key (or from PEXELS_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("PEXELS_API_KEY")
        if not self.api_key:
            raise VideoStockError("Pexels API key not provided")

    def search_video(
        self,
        query: str,
        orientation: str = "landscape",
        size: str = "medium"
    ) -> str:
        """
        Search for video on Pexels

        Args:
            query: Search query
            orientation: Video orientation (landscape, portrait, square)
            size: Video size (small, medium, large)

        Returns:
            Path to downloaded video file

        Raises:
            VideoStockError: If search or download fails
        """
        try:
            print(f"\n[PexelsVideo] Searching for: '{query}'")

            # Make API request - fetch top 5 results for quality selection
            headers = {"Authorization": self.api_key}
            params = {
                "query": query,
                "per_page": 5,  # Fetch 5 videos to pick the best one
                "orientation": orientation
            }

            response = requests.get(
                self.API_URL,
                headers=headers,
                params=params,
                timeout=10
            )

            if response.status_code == 429:
                raise VideoStockError("Rate limit exceeded for Pexels Videos API")
            elif response.status_code != 200:
                raise VideoStockError(
                    f"Pexels Videos API error: {response.status_code} - {response.text}"
                )

            data = response.json()

            if not data.get("videos"):
                raise VideoStockError(f"No videos found for query: {query}")

            # Score and pick the best video
            videos = data["videos"]
            best_video = self._select_best_video(videos)
            video_id = best_video["id"]
            video = best_video

            # Get the appropriate video file (HD or SD)
            video_files = video.get("video_files", [])
            if not video_files:
                raise VideoStockError("No video files available")

            # Try to get HD version (1920x1080 or similar)
            video_url = None
            for file in video_files:
                if file.get("quality") == "hd":
                    video_url = file["link"]
                    break

            # Fallback to any available quality
            if not video_url and video_files:
                video_url = video_files[0]["link"]

            if not video_url:
                raise VideoStockError("Could not find video download URL")

            print(f"[PexelsVideo] Found video ID: {video_id}")
            print(f"[PexelsVideo] Duration: {video.get('duration', 'unknown')}s")

            # Download video
            download_dir = Path("/tmp/scriptsensei/videos_stock")
            download_dir.mkdir(parents=True, exist_ok=True)

            video_path = self._download_video(
                video_url,
                str(download_dir),
                f"pexels_video_{video_id}"
            )

            print(f"[PexelsVideo] ✅ Downloaded to: {video_path}")
            return video_path

        except requests.RequestException as e:
            raise VideoStockError(f"Pexels request failed: {str(e)}") from e

    def _select_best_video(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Select the best quality video from a list based on multiple criteria

        Scoring criteria (like Fliki):
        1. Video quality (HD > SD)
        2. Duration (prefer 10-30 seconds)
        3. Has multiple quality options (professional content)
        4. Width/height (prefer high resolution)

        Args:
            videos: List of video objects from Pexels API

        Returns:
            Best video object
        """
        if not videos:
            raise VideoStockError("No videos to select from")

        if len(videos) == 1:
            return videos[0]

        print(f"[PexelsVideo] Evaluating {len(videos)} videos for quality...")

        best_video = None
        best_score = -1

        for video in videos:
            score = 0
            video_id = video.get("id", "unknown")
            duration = video.get("duration", 0)
            video_files = video.get("video_files", [])

            # Criterion 1: Has HD quality (+50 points)
            has_hd = any(f.get("quality") == "hd" for f in video_files)
            if has_hd:
                score += 50

            # Criterion 2: Duration preference (+30 points for 10-30s)
            if 10 <= duration <= 30:
                score += 30
            elif 5 <= duration <= 45:
                score += 20  # Acceptable range
            else:
                score += 5   # Too short or too long

            # Criterion 3: Multiple quality options (+20 points)
            # More options = professional content
            if len(video_files) >= 3:
                score += 20
            elif len(video_files) >= 2:
                score += 10

            # Criterion 4: Resolution preference (+30 points for high-res)
            max_width = max((f.get("width", 0) for f in video_files), default=0)
            if max_width >= 1920:
                score += 30  # Full HD or higher
            elif max_width >= 1280:
                score += 20  # HD
            elif max_width >= 720:
                score += 10  # SD

            # Criterion 5: File size indicates quality (+10 points)
            # Larger file = better bitrate usually
            max_size_mb = max((f.get("file_size", 0) / (1024 * 1024) for f in video_files), default=0)
            if max_size_mb >= 5:
                score += 10
            elif max_size_mb >= 2:
                score += 5

            print(f"[PexelsVideo] Video {video_id}: Score={score}, Duration={duration}s, HD={has_hd}, Width={max_width}")

            if score > best_score:
                best_score = score
                best_video = video

        print(f"[PexelsVideo] ✅ Selected video {best_video['id']} with score {best_score}")
        return best_video

    def _download_video(self, url: str, download_dir: str, filename: str) -> str:
        """
        Download video from URL

        Args:
            url: Video URL
            download_dir: Directory to save video
            filename: Filename (without extension)

        Returns:
            Path to downloaded video
        """
        try:
            print(f"[PexelsVideo] Downloading from: {url[:100]}...")

            response = requests.get(url, timeout=60, stream=True)

            if response.status_code != 200:
                raise VideoStockError(
                    f"Failed to download video: {response.status_code}"
                )

            # Save video
            video_path = Path(download_dir) / f"{filename}.mp4"

            with open(video_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            file_size_mb = video_path.stat().st_size / (1024 * 1024)
            print(f"[PexelsVideo] Downloaded {file_size_mb:.2f} MB")

            return str(video_path)

        except requests.RequestException as e:
            raise VideoStockError(f"Video download failed: {str(e)}") from e


class PixabayVideoProvider:
    """
    Pixabay Videos API integration

    Free tier: Generous limits
    https://pixabay.com/api/docs/#api_search_videos
    """

    API_URL = "https://pixabay.com/api/videos/"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Pixabay video provider

        Args:
            api_key: Pixabay API key (or from PIXABAY_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("PIXABAY_API_KEY")
        if not self.api_key:
            raise VideoStockError("Pixabay API key not provided")

    def search_video(self, query: str) -> str:
        """
        Search for video on Pixabay

        Args:
            query: Search query

        Returns:
            Path to downloaded video file

        Raises:
            VideoStockError: If search or download fails
        """
        try:
            print(f"\n[PixabayVideo] Searching for: '{query}'")

            # Make API request
            params = {
                "key": self.api_key,
                "q": query,
                "per_page": 3,
                "video_type": "all"
            }

            response = requests.get(self.API_URL, params=params, timeout=10)

            if response.status_code != 200:
                raise VideoStockError(
                    f"Pixabay API error: {response.status_code} - {response.text}"
                )

            data = response.json()

            if not data.get("hits"):
                raise VideoStockError(f"No videos found for query: {query}")

            # Get first result
            video = data["hits"][0]
            video_id = video["id"]

            # Get medium or large video
            videos = video.get("videos", {})
            video_url = None

            for size in ["large", "medium", "small"]:
                if size in videos:
                    video_url = videos[size]["url"]
                    break

            if not video_url:
                raise VideoStockError("Could not find video download URL")

            print(f"[PixabayVideo] Found video ID: {video_id}")
            print(f"[PixabayVideo] Duration: {video.get('duration', 'unknown')}s")

            # Download video
            download_dir = Path("/tmp/scriptsensei/videos_stock")
            download_dir.mkdir(parents=True, exist_ok=True)

            video_path = self._download_video(
                video_url,
                str(download_dir),
                f"pixabay_video_{video_id}"
            )

            print(f"[PixabayVideo] ✅ Downloaded to: {video_path}")
            return video_path

        except requests.RequestException as e:
            raise VideoStockError(f"Pixabay request failed: {str(e)}") from e

    def _download_video(self, url: str, download_dir: str, filename: str) -> str:
        """
        Download video from URL

        Args:
            url: Video URL
            download_dir: Directory to save video
            filename: Filename (without extension)

        Returns:
            Path to downloaded video
        """
        try:
            print(f"[PixabayVideo] Downloading from: {url[:100]}...")

            response = requests.get(url, timeout=60, stream=True)

            if response.status_code != 200:
                raise VideoStockError(
                    f"Failed to download video: {response.status_code}"
                )

            # Save video
            video_path = Path(download_dir) / f"{filename}.mp4"

            with open(video_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            file_size_mb = video_path.stat().st_size / (1024 * 1024)
            print(f"[PixabayVideo] Downloaded {file_size_mb:.2f} MB")

            return str(video_path)

        except requests.RequestException as e:
            raise VideoStockError(f"Video download failed: {str(e)}") from e


class VideoStockProvider:
    """
    Video Stock Provider Service

    Orchestrates multiple video providers with caching and fallback logic.
    Provides REAL VIDEO CLIPS instead of static images.
    """

    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize video stock provider

        Args:
            cache_dir: Directory for caching videos
        """
        self.cache_dir = Path(cache_dir or "/tmp/scriptsensei/video_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Initialize providers (gracefully handle missing API keys)
        self.pexels = None
        self.pixabay = None

        try:
            self.pexels = PexelsVideoProvider()
            print("[VideoStockProvider] ✅ Pexels Videos API configured")
        except VideoStockError:
            print("[VideoStockProvider] ⚠️ Pexels Videos API key not configured")

        try:
            self.pixabay = PixabayVideoProvider()
            print("[VideoStockProvider] ✅ Pixabay Videos API configured")
        except VideoStockError:
            print("[VideoStockProvider] ⚠️ Pixabay Videos API key not configured")

    def get_video(
        self,
        text: str,
        provider: Optional[str] = None,
        use_video_stock: bool = True
    ) -> str:
        """
        Get a video clip based on text description

        Args:
            text: Text description for the video
            provider: Specific provider to use ("pexels", "pixabay", or None for auto)
            use_video_stock: If True, fetch real videos; if False, fall back to images

        Returns:
            Path to the video file

        Raises:
            VideoStockError: If query is empty
        """
        if not text or not text.strip():
            raise VideoStockError("Query cannot be empty")

        if not use_video_stock:
            # Fall back to image provider
            print("[VideoStockProvider] Video stock disabled, using images")
            from app.services.image_provider import ImageProvider
            return ImageProvider().get_image(text)

        print(f"\n[VideoStockProvider] ===== GET VIDEO REQUEST =====")
        print(f"[VideoStockProvider] Input text: {text[:100]}...")

        # Extract keywords and translate if needed
        keywords = self._extract_keywords(text)

        print(f"[VideoStockProvider] Keywords: {keywords}")

        # Progressive search strategy: Try specific first, then broader
        search_queries = [
            " ".join(keywords[:3]),  # Most specific: top 3 keywords
            " ".join(keywords[:2]),  # Broader: top 2 keywords
            keywords[0] if keywords else "nature"  # Broadest: single keyword
        ]

        # Try to fetch from providers with progressive search
        providers_to_try = []

        if provider == "pexels" and self.pexels:
            providers_to_try = [("pexels", self.pexels)]
        elif provider == "pixabay" and self.pixabay:
            providers_to_try = [("pixabay", self.pixabay)]
        else:
            # Auto mode: try all available providers
            if self.pexels:
                providers_to_try.append(("pexels", self.pexels))
            if self.pixabay:
                providers_to_try.append(("pixabay", self.pixabay))

        # Try each search query progressively
        for query in search_queries:
            print(f"[VideoStockProvider] Search query: '{query}'")

            # Check cache first
            cache_key = self._get_cache_key(query, provider or "auto")
            cached_path = self.cache_dir / f"{cache_key}.mp4"

            if cached_path.exists():
                print(f"[VideoStockProvider] ✅ Using cached video: {cached_path}")
                return str(cached_path)

            # Try each provider for this query
            for provider_name, provider_obj in providers_to_try:
                try:
                    print(f"[VideoStockProvider] Trying {provider_name} with '{query}'...")
                    video_path = provider_obj.search_video(query)

                    # Cache the video
                    import shutil
                    shutil.copy(video_path, cached_path)

                    print(f"[VideoStockProvider] ✅ Found video with query: '{query}'")
                    return video_path

                except VideoStockError as e:
                    print(f"[VideoStockProvider] {provider_name} failed for '{query}': {e}")
                    continue

            # If we get here, all providers failed for this query, try next broader query
            print(f"[VideoStockProvider] No videos found for '{query}', trying broader search...")

        # All video providers and queries failed, fall back to images with Ken Burns
        print("[VideoStockProvider] ⚠️ All video search attempts failed, falling back to images")
        from app.services.image_provider import ImageProvider
        return ImageProvider().get_image(text)

    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text for video search using AI

        Uses Claude Haiku for intelligent keyword extraction with fallback to basic method.
        Cost: ~$0.0001 per scene extraction (very cheap!)
        """
        # Try AI extraction first (best quality)
        try:
            keywords = self._extract_keywords_with_ai(text)
            if keywords:
                return keywords
        except Exception as e:
            print(f"[VideoStockProvider] AI extraction failed: {e}, falling back to basic method")

        # Fallback to basic method
        return self._extract_keywords_basic(text)

    def _extract_keywords_with_ai(self, text: str) -> List[str]:
        """
        Use AI (Claude Haiku) to extract visually relevant keywords

        Args:
            text: Scene text/description

        Returns:
            List of keywords optimized for finding relevant stock videos
        """
        import anthropic

        # Get API key from environment
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")

        client = anthropic.Anthropic(api_key=api_key)

        # Detect and translate non-English text first
        has_non_latin = bool(re.search(r'[^\x00-\x7F]', text))
        if has_non_latin:
            try:
                translator = GoogleTranslator(source='auto', target='en')
                translated_text = translator.translate(text)
                print(f"[VideoStockProvider] Translated for AI: {text[:50]}... → {translated_text[:50]}...")
                text = translated_text
            except Exception as e:
                print(f"[VideoStockProvider] Translation failed: {e}, using original text")

        prompt = f"""Given this video scene text, extract 3-5 visual keywords that would help find relevant stock video footage on Pexels.

Scene text: "{text}"

IMPORTANT: Use broad, common keywords that are likely to have stock video footage available.

Focus on:
1. Main subjects (people, objects, animals, places)
2. General actions or activities (not overly specific)
3. Settings, locations, or environments
4. Common visual elements

Rules:
- Use BROAD terms that are commonly filmed (e.g., "cooking" not "baking sourdough bread")
- Prefer general categories over specific items (e.g., "kitchen" not "stainless steel mixer")
- Avoid overly specific phrases that might not have videos available
- Use 1-2 word keywords when possible (easier to find videos)
- Prioritize the MAIN subject first (most important keyword)

Return ONLY comma-separated keywords, most important first.
Example outputs:
- "cooking, kitchen, food preparation"
- "business, office, meeting"
- "hiking, mountains, nature"
- "city, traffic, urban"
- "ocean, waves, beach"

Keywords:"""

        try:
            response = client.messages.create(
                model="claude-3-haiku-20240307",  # Fast & cheap ($0.25/$1.25 per M tokens)
                max_tokens=100,
                temperature=0.3,  # Lower temperature for more consistent results
                messages=[{"role": "user", "content": prompt}]
            )

            keywords_text = response.content[0].text.strip()

            # Clean up response - sometimes AI adds explanatory text
            # Look for the actual keywords after any colons or newlines
            if '\n' in keywords_text:
                # Take the last line which usually contains the keywords
                lines = [line.strip() for line in keywords_text.split('\n') if line.strip()]
                keywords_text = lines[-1]

            # Remove any text before a colon (e.g., "Keywords: ...")
            if ':' in keywords_text:
                keywords_text = keywords_text.split(':', 1)[-1].strip()

            # Parse comma-separated keywords
            keywords = [k.strip() for k in keywords_text.split(',') if k.strip()]

            # Filter out any keywords that are too long (likely explanatory text)
            keywords = [k for k in keywords if len(k) < 30]

            print(f"[VideoStockProvider] 🤖 AI extracted keywords: {keywords}")

            if not keywords:
                raise ValueError("AI returned empty keywords")

            return keywords[:5]  # Return top 5 keywords

        except Exception as e:
            print(f"[VideoStockProvider] AI API call failed: {e}")
            raise

    def _extract_keywords_basic(self, text: str) -> List[str]:
        """
        Basic keyword extraction (fallback method)

        Uses simple stop-word removal and word filtering.
        """
        # Detect non-Latin characters
        has_non_latin = bool(re.search(r'[^\x00-\x7F]', text))

        if has_non_latin:
            try:
                # Translate to English
                translator = GoogleTranslator(source='auto', target='en')
                text = translator.translate(text)
                print(f"[VideoStockProvider] Translated: {text[:100]}")
            except Exception as e:
                print(f"[VideoStockProvider] Translation failed: {e}")

        # Remove stop words
        stop_words = {
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "about", "as", "is", "was", "are", "were",
            "this", "that", "these", "those", "will", "would", "should", "could"
        }

        # Extract words
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 3]

        if not keywords:
            keywords = ["nature", "landscape", "abstract"]

        print(f"[VideoStockProvider] 📝 Basic extracted keywords: {keywords[:5]}")
        return keywords[:5]

    def _get_cache_key(self, query: str, provider: str) -> str:
        """Generate cache key"""
        cache_string = f"{provider}:{query}".lower()
        return hashlib.md5(cache_string.encode()).hexdigest()
