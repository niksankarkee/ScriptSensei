#!/usr/bin/env python3
"""
Test script for audio generation with Azure TTS
"""
import os
import sys
from pathlib import Path

# Add the service directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "services" / "video-processing-service"))

from app.services.voice_synthesizer import VoiceSynthesizer

def test_azure_tts():
    """Test Azure Text-to-Speech"""
    print("🎤 Testing Azure Text-to-Speech...")

    # Initialize synthesizer
    synthesizer = VoiceSynthesizer()

    # Test text
    test_text = "Hello! This is a test of ScriptSensei's audio generation system."

    try:
        # Generate audio
        print(f"📝 Text: {test_text}")
        print("⏳ Generating audio...")

        audio_path = synthesizer.synthesize(
            text=test_text,
            provider="azure",
            language="en-US",
            output_format="mp3"
        )

        print(f"✅ Success! Audio generated at: {audio_path}")

        # Check file exists and get size
        if os.path.exists(audio_path):
            file_size = os.path.getsize(audio_path)
            print(f"📦 File size: {file_size:,} bytes ({file_size/1024:.2f} KB)")
            return True
        else:
            print("❌ Audio file not found")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_multilingual():
    """Test multiple languages"""
    print("\n🌍 Testing Multiple Languages...")

    synthesizer = VoiceSynthesizer()

    tests = [
        ("Hello world", "en-US", "English"),
        ("こんにちは世界", "ja-JP", "Japanese"),
        ("नमस्ते संसार", "ne-NP", "Nepali"),
    ]

    results = []
    for text, lang, name in tests:
        try:
            print(f"\n🔤 Testing {name} ({lang})")
            print(f"📝 Text: {text}")

            audio_path = synthesizer.synthesize(
                text=text,
                provider="azure",
                language=lang,
                output_format="mp3"
            )

            if os.path.exists(audio_path):
                file_size = os.path.getsize(audio_path)
                print(f"✅ {name}: Success ({file_size/1024:.2f} KB)")
                results.append((name, True))
            else:
                print(f"❌ {name}: File not created")
                results.append((name, False))

        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            results.append((name, False))

    return results

if __name__ == "__main__":
    print("=" * 60)
    print("ScriptSensei Audio Generation Test")
    print("=" * 60)

    # Test basic Azure TTS
    success = test_azure_tts()

    if success:
        # Test multiple languages
        results = test_multilingual()

        print("\n" + "=" * 60)
        print("📊 Test Summary")
        print("=" * 60)
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{name}: {status}")
    else:
        print("\n❌ Basic test failed. Please check your Azure credentials.")

    print("\n" + "=" * 60)
