#!/usr/bin/env python3
"""Test script to generate audio and verify UI playback"""

import requests
import json
import time

BASE_URL = "http://localhost:8012/api/v1/videos"

# Generate a test video
print("=" * 60)
print("Testing Audio Generation for UI Playback")
print("=" * 60)

request_data = {
    "user_id": "test_ui_user",
    "script_id": "test_ui_script",
    "script_content": "Welcome to ScriptSensei. This audio player test demonstrates our new audio playback feature in the browser.",
    "platform": "youtube",
    "language": "en"
}

print("\n📝 Generating audio...")
response = requests.post(f"{BASE_URL}/generate", json=request_data)

if response.status_code == 200:
    data = response.json()
    video_id = data['data']['id']
    print(f"✅ Audio generation started")
    print(f"📍 Video ID: {video_id}")

    # Wait a moment for processing
    print("\n⏳ Waiting for processing...")
    time.sleep(3)

    # Get video details
    detail_response = requests.get(f"{BASE_URL}/{video_id}")
    if detail_response.status_code == 200:
        video = detail_response.json()['data']
        print(f"\n✅ Status: {video['status']}")
        print(f"📁 Audio URL: {video.get('video_url', 'N/A')}")
        print(f"⏱️  Duration: {video.get('duration', 'N/A')}s")
        print(f"📦 File Size: {video.get('file_size', 'N/A')} bytes")

        # Test download endpoint
        print(f"\n🔗 Testing download endpoint...")
        download_url = f"{BASE_URL}/{video_id}/download"
        print(f"   URL: {download_url}")

        download_response = requests.get(download_url, stream=True)
        if download_response.status_code == 200:
            content_type = download_response.headers.get('content-type', 'unknown')
            content_length = download_response.headers.get('content-length', 'unknown')
            print(f"   ✅ Download endpoint working")
            print(f"   📄 Content-Type: {content_type}")
            print(f"   📦 Content-Length: {content_length} bytes")
        else:
            print(f"   ❌ Download failed: {download_response.status_code}")

        # Print UI testing instructions
        print("\n" + "=" * 60)
        print("🎉 Audio Ready for Testing!")
        print("=" * 60)
        print(f"\n📱 Test in Browser:")
        print(f"   1. Open: http://localhost:4000/dashboard/videos/{video_id}")
        print(f"   2. You should see an audio player with controls")
        print(f"   3. Click play to test audio playback")
        print(f"   4. Click 'Download Audio' to test download")
        print("\n" + "=" * 60)
    else:
        print(f"❌ Failed to get video details: {detail_response.status_code}")
else:
    print(f"❌ Audio generation failed: {response.status_code}")
    print(response.text)
