"""
Voice Synthesizer Service

Handles text-to-speech conversion using multiple providers
"""

import os
import uuid
from typing import Optional
from pathlib import Path

try:
    import azure.cognitiveservices.speech as speechsdk
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False

try:
    from google.cloud import texttospeech
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False


class VoiceSynthesizer:
    """
    Voice synthesis service supporting multiple TTS providers
    """

    def __init__(self):
        """Initialize voice synthesizer with available providers"""
        self.output_dir = Path("/tmp/audio")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Azure TTS configuration
        self.azure_key = os.getenv("AZURE_SPEECH_KEY")
        self.azure_region = os.getenv("AZURE_SPEECH_REGION", "eastus")

        # Google TTS configuration
        self.google_credentials = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    def synthesize(
        self,
        text: str,
        provider: str = "azure",
        language: str = "en-US",
        voice_name: Optional[str] = None,
        output_format: str = "mp3"
    ) -> str:
        """
        Synthesize speech from text

        Args:
            text: Text to convert to speech
            provider: TTS provider ("azure" or "google")
            language: Language code (e.g., "en-US", "ja-JP", "ne-NP")
            voice_name: Specific voice name (optional)
            output_format: Output format ("mp3" or "wav")

        Returns:
            Path to generated audio file

        Raises:
            ValueError: If provider is not available or invalid
            RuntimeError: If synthesis fails
        """
        if provider == "azure":
            return self._synthesize_azure(text, language, voice_name, output_format)
        elif provider == "google":
            return self._synthesize_google(text, language, voice_name, output_format)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def _synthesize_azure(
        self,
        text: str,
        language: str,
        voice_name: Optional[str],
        output_format: str
    ) -> str:
        """Synthesize using Azure Cognitive Services"""
        if not AZURE_AVAILABLE:
            raise RuntimeError("Azure Speech SDK not installed")

        if not self.azure_key:
            raise RuntimeError("AZURE_SPEECH_KEY not configured")

        # Configure speech synthesis
        speech_config = speechsdk.SpeechConfig(
            subscription=self.azure_key,
            region=self.azure_region
        )

        # Set output format
        if output_format == "mp3":
            speech_config.set_speech_synthesis_output_format(
                speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
            )
        else:
            speech_config.set_speech_synthesis_output_format(
                speechsdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm
            )

        # Set voice
        if voice_name:
            speech_config.speech_synthesis_voice_name = voice_name
        else:
            # Use default voices for each language
            speech_config.speech_synthesis_voice_name = self._get_default_azure_voice(language)

        # Generate output filename
        audio_filename = f"{uuid.uuid4().hex}.{output_format}"
        audio_path = str(self.output_dir / audio_filename)

        # Configure audio output
        audio_config = speechsdk.audio.AudioOutputConfig(filename=audio_path)

        # Create synthesizer
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=audio_config
        )

        # Synthesize speech
        result = synthesizer.speak_text_async(text).get()

        # Check result
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return audio_path
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            raise RuntimeError(f"Speech synthesis canceled: {cancellation.reason}")
        else:
            raise RuntimeError(f"Speech synthesis failed: {result.reason}")

    def _synthesize_google(
        self,
        text: str,
        language: str,
        voice_name: Optional[str],
        output_format: str
    ) -> str:
        """Synthesize using Google Cloud Text-to-Speech"""
        if not GOOGLE_AVAILABLE:
            raise RuntimeError("Google Cloud TTS library not installed")

        if not self.google_credentials:
            raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS not configured")

        # Create client
        client = texttospeech.TextToSpeechClient()

        # Set input text
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Build voice selection parameters
        voice = texttospeech.VoiceSelectionParams(
            language_code=language,
            name=voice_name if voice_name else None
        )

        # Select audio config
        if output_format == "mp3":
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            ext = "mp3"
        else:
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.LINEAR16
            )
            ext = "wav"

        # Perform text-to-speech
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        # Save audio file
        audio_filename = f"{uuid.uuid4().hex}.{ext}"
        audio_path = str(self.output_dir / audio_filename)

        with open(audio_path, "wb") as out:
            out.write(response.audio_content)

        return audio_path

    def _get_default_azure_voice(self, language: str) -> str:
        """
        Get default Azure voice for a language

        Args:
            language: Language code (2-letter ISO 639-1 code like 'en', 'ne', 'ja')
                     or full locale code (like 'en-US', 'ne-NP', 'ja-JP')

        Returns:
            Azure Neural voice name
        """
        # If language is already a full locale code (e.g., "en-US"), use it directly
        # Otherwise, map 2-letter codes to full locales
        if '-' not in language:
            # Map 2-letter language codes to default locales
            language = self._language_code_to_locale(language)

        # Comprehensive mapping of locales to Azure Neural voices
        # Based on Azure Cognitive Services supported voices
        voice_map = {
            # English variants
            "en-US": "en-US-JennyNeural",
            "en-GB": "en-GB-SoniaNeural",
            "en-AU": "en-AU-NatashaNeural",
            "en-CA": "en-CA-ClaraNeural",
            "en-IN": "en-IN-NeerjaNeural",
            "en-IE": "en-IE-EmilyNeural",
            "en-NZ": "en-NZ-MollyNeural",
            "en-SG": "en-SG-LunaNeural",
            "en-ZA": "en-ZA-LeahNeural",

            # Asian languages
            "ja-JP": "ja-JP-NanamiNeural",
            "ko-KR": "ko-KR-SunHiNeural",
            "zh-CN": "zh-CN-XiaoxiaoNeural",
            "zh-HK": "zh-HK-HiuGaaiNeural",
            "zh-TW": "zh-TW-HsiaoChenNeural",
            "th-TH": "th-TH-PremwadeeNeural",
            "vi-VN": "vi-VN-HoaiMyNeural",
            "id-ID": "id-ID-ArdiNeural",
            "ms-MY": "ms-MY-YasminNeural",
            "fil-PH": "fil-PH-BlessicaNeural",

            # South Asian languages
            "hi-IN": "hi-IN-SwaraNeural",
            "ne-NP": "ne-NP-HemkalaNeural",
            "bn-IN": "bn-IN-TanishaaNeural",
            "ta-IN": "ta-IN-PallaviNeural",
            "te-IN": "te-IN-ShrutiNeural",
            "mr-IN": "mr-IN-AarohiNeural",
            "gu-IN": "gu-IN-DhwaniNeural",
            "ur-PK": "ur-PK-UzmaNeural",
            "si-LK": "si-LK-ThiliniNeural",

            # European languages
            "es-ES": "es-ES-ElviraNeural",
            "es-MX": "es-MX-DaliaNeural",
            "es-AR": "es-AR-ElenaNeural",
            "es-CO": "es-CO-SalomeNeural",
            "fr-FR": "fr-FR-DeniseNeural",
            "fr-CA": "fr-CA-SylvieNeural",
            "fr-BE": "fr-BE-CharlineNeural",
            "de-DE": "de-DE-KatjaNeural",
            "de-AT": "de-AT-IngridNeural",
            "de-CH": "de-CH-LeniNeural",
            "it-IT": "it-IT-ElsaNeural",
            "pt-BR": "pt-BR-FranciscaNeural",
            "pt-PT": "pt-PT-RaquelNeural",
            "ru-RU": "ru-RU-SvetlanaNeural",
            "pl-PL": "pl-PL-ZofiaNeural",
            "nl-NL": "nl-NL-ColetteNeural",
            "nl-BE": "nl-BE-DenaNeural",
            "tr-TR": "tr-TR-EmelNeural",
            "sv-SE": "sv-SE-SofieNeural",
            "no-NO": "no-NO-PernilleNeural",
            "da-DK": "da-DK-ChristelNeural",
            "fi-FI": "fi-FI-SelmaNeural",
            "el-GR": "el-GR-AthinaNeural",
            "cs-CZ": "cs-CZ-VlastaNeural",
            "sk-SK": "sk-SK-ViktoriaNeural",
            "hu-HU": "hu-HU-NoemiNeural",
            "ro-RO": "ro-RO-AlinaNeural",
            "bg-BG": "bg-BG-KalinaNeural",
            "hr-HR": "hr-HR-GabrijelaNeural",
            "sr-RS": "sr-RS-SophieNeural",
            "sl-SI": "sl-SI-PetraNeural",
            "uk-UA": "uk-UA-PolinaNeural",
            "et-EE": "et-EE-AnuNeural",
            "lv-LV": "lv-LV-EveritaNeural",
            "lt-LT": "lt-LT-OnaNeural",
            "is-IS": "is-IS-GudrunNeural",
            "ga-IE": "ga-IE-OrlaNeural",
            "cy-GB": "cy-GB-NiaNeural",
            "mt-MT": "mt-MT-GraceNeural",

            # Middle Eastern languages
            "ar-SA": "ar-SA-ZariyahNeural",
            "ar-EG": "ar-EG-SalmaNeural",
            "ar-AE": "ar-AE-FatimaNeural",
            "he-IL": "he-IL-HilaNeural",
            "fa-IR": "fa-IR-DilaraNeural",

            # African languages
            "af-ZA": "af-ZA-AdriNeural",
            "sw-KE": "sw-KE-ZuriNeural",
            "am-ET": "am-ET-MekdesNeural",
            "so-SO": "so-SO-UbaxNeural",

            # Other languages
            "ca-ES": "ca-ES-JoanaNeural",
            "eu-ES": "eu-ES-AinhoaNeural",
            "gl-ES": "gl-ES-SabelaNeural",
            "sq-AL": "sq-AL-AnilaNeural",
            "mk-MK": "mk-MK-MarijaNeural",
            "bs-BA": "bs-BA-VesnaNeural",
            "kk-KZ": "kk-KZ-AigulNeural",
            "uz-UZ": "uz-UZ-MadinaNeural",
            "mn-MN": "mn-MN-YesuiNeural",
            "km-KH": "km-KH-SreymomNeural",
            "lo-LA": "lo-LA-KeomanyNeural",
            "my-MM": "my-MM-NilarNeural",
            "jv-ID": "jv-ID-SitiNeural",
            "su-ID": "su-ID-TutiNeural",
        }

        # Get voice, fallback to English if not found
        voice = voice_map.get(language)
        if not voice:
            print(f"Warning: No Azure voice found for language '{language}', using English fallback")
            return "en-US-JennyNeural"

        return voice

    def _language_code_to_locale(self, lang_code: str) -> str:
        """
        Convert 2-letter language code to full locale code

        Args:
            lang_code: 2-letter ISO 639-1 language code (e.g., 'en', 'ne', 'ja')

        Returns:
            Full locale code (e.g., 'en-US', 'ne-NP', 'ja-JP')
        """
        # Map 2-letter codes to default locales
        locale_map = {
            'af': 'af-ZA',    # Afrikaans -> South Africa
            'am': 'am-ET',    # Amharic -> Ethiopia
            'ar': 'ar-SA',    # Arabic -> Saudi Arabia
            'bg': 'bg-BG',    # Bulgarian -> Bulgaria
            'bn': 'bn-IN',    # Bengali -> India
            'bs': 'bs-BA',    # Bosnian -> Bosnia
            'ca': 'ca-ES',    # Catalan -> Spain
            'cs': 'cs-CZ',    # Czech -> Czech Republic
            'cy': 'cy-GB',    # Welsh -> Great Britain
            'da': 'da-DK',    # Danish -> Denmark
            'de': 'de-DE',    # German -> Germany
            'el': 'el-GR',    # Greek -> Greece
            'en': 'en-US',    # English -> United States
            'es': 'es-ES',    # Spanish -> Spain
            'et': 'et-EE',    # Estonian -> Estonia
            'eu': 'eu-ES',    # Basque -> Spain
            'fa': 'fa-IR',    # Persian -> Iran
            'fi': 'fi-FI',    # Finnish -> Finland
            'fil': 'fil-PH',  # Filipino -> Philippines
            'fr': 'fr-FR',    # French -> France
            'ga': 'ga-IE',    # Irish -> Ireland
            'gl': 'gl-ES',    # Galician -> Spain
            'gu': 'gu-IN',    # Gujarati -> India
            'he': 'he-IL',    # Hebrew -> Israel
            'hi': 'hi-IN',    # Hindi -> India
            'hr': 'hr-HR',    # Croatian -> Croatia
            'hu': 'hu-HU',    # Hungarian -> Hungary
            'id': 'id-ID',    # Indonesian -> Indonesia
            'is': 'is-IS',    # Icelandic -> Iceland
            'it': 'it-IT',    # Italian -> Italy
            'ja': 'ja-JP',    # Japanese -> Japan
            'jv': 'jv-ID',    # Javanese -> Indonesia
            'kk': 'kk-KZ',    # Kazakh -> Kazakhstan
            'km': 'km-KH',    # Khmer -> Cambodia
            'ko': 'ko-KR',    # Korean -> South Korea
            'lo': 'lo-LA',    # Lao -> Laos
            'lt': 'lt-LT',    # Lithuanian -> Lithuania
            'lv': 'lv-LV',    # Latvian -> Latvia
            'mk': 'mk-MK',    # Macedonian -> North Macedonia
            'mn': 'mn-MN',    # Mongolian -> Mongolia
            'mr': 'mr-IN',    # Marathi -> India
            'ms': 'ms-MY',    # Malay -> Malaysia
            'mt': 'mt-MT',    # Maltese -> Malta
            'my': 'my-MM',    # Burmese -> Myanmar
            'ne': 'ne-NP',    # Nepali -> Nepal
            'nl': 'nl-NL',    # Dutch -> Netherlands
            'no': 'no-NO',    # Norwegian -> Norway
            'pl': 'pl-PL',    # Polish -> Poland
            'pt': 'pt-BR',    # Portuguese -> Brazil (more speakers than Portugal)
            'ro': 'ro-RO',    # Romanian -> Romania
            'ru': 'ru-RU',    # Russian -> Russia
            'si': 'si-LK',    # Sinhala -> Sri Lanka
            'sk': 'sk-SK',    # Slovak -> Slovakia
            'sl': 'sl-SI',    # Slovenian -> Slovenia
            'so': 'so-SO',    # Somali -> Somalia
            'sq': 'sq-AL',    # Albanian -> Albania
            'sr': 'sr-RS',    # Serbian -> Serbia
            'su': 'su-ID',    # Sundanese -> Indonesia
            'sv': 'sv-SE',    # Swedish -> Sweden
            'sw': 'sw-KE',    # Swahili -> Kenya
            'ta': 'ta-IN',    # Tamil -> India
            'te': 'te-IN',    # Telugu -> India
            'th': 'th-TH',    # Thai -> Thailand
            'tr': 'tr-TR',    # Turkish -> Turkey
            'uk': 'uk-UA',    # Ukrainian -> Ukraine
            'ur': 'ur-PK',    # Urdu -> Pakistan
            'uz': 'uz-UZ',    # Uzbek -> Uzbekistan
            'vi': 'vi-VN',    # Vietnamese -> Vietnam
            'zh': 'zh-CN',    # Chinese -> China (Simplified)
        }

        return locale_map.get(lang_code, 'en-US')

    def get_available_voices(self, provider: str = "azure", language: Optional[str] = None):
        """
        Get list of available voices for a provider

        Args:
            provider: TTS provider
            language: Filter by language code (optional)

        Returns:
            List of available voices
        """
        if provider == "azure":
            return self._get_azure_voices(language)
        elif provider == "google":
            return self._get_google_voices(language)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def _get_azure_voices(self, language: Optional[str] = None):
        """Get available Azure voices"""
        # This is a subset - Azure has 400+ voices
        voices = [
            {"name": "en-US-JennyNeural", "language": "en-US", "gender": "Female"},
            {"name": "en-US-GuyNeural", "language": "en-US", "gender": "Male"},
            {"name": "ja-JP-NanamiNeural", "language": "ja-JP", "gender": "Female"},
            {"name": "ne-NP-HemkalaNeural", "language": "ne-NP", "gender": "Female"},
            {"name": "hi-IN-SwaraNeural", "language": "hi-IN", "gender": "Female"},
            {"name": "id-ID-ArdiNeural", "language": "id-ID", "gender": "Male"},
            {"name": "th-TH-PremwadeeNeural", "language": "th-TH", "gender": "Female"},
        ]

        if language:
            voices = [v for v in voices if v["language"] == language]

        return voices

    def _get_google_voices(self, language: Optional[str] = None):
        """Get available Google Cloud voices"""
        if not GOOGLE_AVAILABLE or not self.google_credentials:
            return []

        try:
            client = texttospeech.TextToSpeechClient()
            voices = client.list_voices(language_code=language if language else None)

            return [
                {
                    "name": voice.name,
                    "language": voice.language_codes[0] if voice.language_codes else "unknown",
                    "gender": voice.ssml_gender.name
                }
                for voice in voices.voices
            ]
        except Exception:
            return []
