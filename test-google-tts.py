#!/usr/bin/env python3
"""
Test Google Cloud Text-to-Speech with service account credentials
"""

import json
import base64
import requests
import sys
from datetime import datetime, timedelta
import jwt

# Load service account credentials
CREDENTIALS_FILE = "/Users/niksankarkee/Dev/ScriptSensei/keys/google-tts-key.json"

print("Testing Google Cloud Text-to-Speech...")
print(f"Credentials file: {CREDENTIALS_FILE}\n")

try:
    # Read service account JSON
    with open(CREDENTIALS_FILE, 'r') as f:
        credentials = json.load(f)

    print(f"✓ Service account loaded: {credentials['client_email']}")
    print(f"✓ Project ID: {credentials['project_id']}\n")

    # Create JWT token for authentication
    now = datetime.utcnow()
    expiry = now + timedelta(hours=1)

    payload = {
        'iss': credentials['client_email'],
        'scope': 'https://www.googleapis.com/auth/cloud-platform',
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': int(now.timestamp()),
        'exp': int(expiry.timestamp())
    }

    # Sign the JWT with the private key
    print("Creating JWT token...")
    token = jwt.encode(payload, credentials['private_key'], algorithm='RS256')

    # Exchange JWT for access token
    print("Exchanging JWT for access token...")
    token_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion': token
        },
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )

    if token_response.status_code != 200:
        print(f"❌ Failed to get access token:")
        print(f"Status: {token_response.status_code}")
        print(f"Response: {token_response.text}")
        sys.exit(1)

    access_token = token_response.json()['access_token']
    print("✓ Access token obtained\n")

    # Test Text-to-Speech API
    print("Calling Text-to-Speech API...")
    tts_response = requests.post(
        'https://texttospeech.googleapis.com/v1/text:synthesize',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        json={
            'input': {
                'text': 'Hello from ScriptSensei! Your Google Cloud Text-to-Speech is working correctly.'
            },
            'voice': {
                'languageCode': 'en-US',
                'name': 'en-US-Neural2-C'
            },
            'audioConfig': {
                'audioEncoding': 'MP3'
            }
        }
    )

    if tts_response.status_code != 200:
        print(f"❌ Failed to generate speech:")
        print(f"Status: {tts_response.status_code}")
        print(f"Response: {tts_response.text}")
        sys.exit(1)

    # Decode and save audio
    response_data = tts_response.json()
    audio_content = base64.b64decode(response_data['audioContent'])

    output_file = "/Users/niksankarkee/Dev/ScriptSensei/google-test.mp3"
    with open(output_file, 'wb') as f:
        f.write(audio_content)

    print("✅ SUCCESS! Google Cloud TTS is working!")
    print(f"Audio file saved to: {output_file}")
    print(f"File size: {len(audio_content)} bytes ({len(audio_content)/1024:.1f} KB)")
    print("\nYou can play the file to verify:")
    print(f"  afplay {output_file}")

except FileNotFoundError:
    print(f"❌ ERROR: Credentials file not found at {CREDENTIALS_FILE}")
    sys.exit(1)
except json.JSONDecodeError:
    print(f"❌ ERROR: Invalid JSON in credentials file")
    sys.exit(1)
except ImportError as e:
    print(f"❌ ERROR: Missing required library: {e}")
    print("\nPlease install required packages:")
    print("  pip3 install pyjwt cryptography requests")
    sys.exit(1)
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
