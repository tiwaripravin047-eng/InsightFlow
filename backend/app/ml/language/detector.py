"""Language detection module."""
from typing import Optional


class LanguageDetector:
    """Detects text language to route non-English feedback to multilingual pipelines."""

    def detect(self, text: str) -> str:
        """Detect language code (e.g. 'en', 'hi', 'ta', 'te', 'es', etc.)."""
        if not text or len(text.strip()) < 3:
            return "en"

        # Check for Devanagari script (Hindi / Marathi)
        for ch in text:
            code = ord(ch)
            if 0x0900 <= code <= 0x097F:
                return "hi"
            # Tamil
            if 0x0B80 <= code <= 0x0BFF:
                return "ta"
            # Telugu
            if 0x0C00 <= code <= 0x0C7F:
                return "te"

        return "en"
