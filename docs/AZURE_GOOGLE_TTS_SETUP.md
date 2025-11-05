# Azure Cognitive Services & Google Cloud TTS Setup Guide

This guide provides detailed step-by-step instructions for setting up Azure Cognitive Services (Speech) and Google Cloud Text-to-Speech. These are the two services that commonly cause setup difficulties.

---

## 🎤 Azure Cognitive Services (Speech)

Azure Speech Services provides high-quality text-to-speech with 400+ voices in 140+ languages.

### Prerequisites
- Microsoft account (create at https://account.microsoft.com if needed)
- Credit card (required even for free tier - you won't be charged during free period)
- Free tier includes: 0.5 million characters/month for neural voices

### Step-by-Step Setup

#### 1. Create Azure Account

1. Go to https://azure.microsoft.com/free/
2. Click **"Try Azure for free"** button (blue button on the left)
3. Sign in with your Microsoft account or create one
4. Fill in your information:
   - Country/Region
   - First and last name
   - Email address
   - Phone number (for verification)
5. **Credit card verification** (Required - but you won't be charged):
   - Enter card details
   - You'll see a $1 temporary authorization (refunded immediately)
   - This is only for identity verification
6. Complete identity verification via phone
7. Accept agreement and click **"Sign up"**

**Note**: You get $200 free credits for 30 days + free services for 12 months

#### 2. Navigate to Azure Portal

1. Once account is created, go to https://portal.azure.com
2. Sign in with your Microsoft account
3. You'll see the Azure Portal dashboard

#### 3. Create Speech Service Resource

1. In Azure Portal, click **"Create a resource"** (top left, or center of screen)
2. In the search box, type **"Speech"**
3. Select **"Speech"** (by Microsoft) from results
4. Click **"Create"** button

#### 4. Configure Speech Resource

Fill in the required information:

**Basics Tab**:
- **Subscription**: Select "Azure subscription 1" (or your free trial subscription)
- **Resource Group**:
  - Click "Create new"
  - Name it: `scriptsensei-resources`
  - Click "OK"
- **Region**: Choose a region close to you:
  - US users: `East US` or `West US 2`
  - Europe users: `West Europe` or `North Europe`
  - Asia users: `Southeast Asia` or `East Asia`
  - **IMPORTANT**: Remember this region - you'll need it for your .env file
- **Name**: `scriptsensei-speech` (must be globally unique)
  - If taken, try: `scriptsensei-speech-YOURNAME` or `scriptsensei-speech-2025`
- **Pricing tier**:
  - Select **"Free F0"** (0.5M characters/month free)
  - If Free F0 is not available in your region, select **"Standard S0"** (you'll still have free quota)

**Network Tab** (optional):
- Leave default settings (All networks can access)

**Tags Tab** (optional):
- Skip or add:
  - Name: `project`, Value: `ScriptSensei`
  - Name: `environment`, Value: `development`

**Review + Create**:
1. Review your settings
2. Click **"Create"**
3. Wait 1-2 minutes for deployment (you'll see "Deployment in progress")

#### 5. Get Your API Keys

After deployment completes:

1. Click **"Go to resource"** button
2. In the left sidebar, click **"Keys and Endpoint"** (under "Resource Management")
3. You'll see:
   - **KEY 1**: `abc123def456...` (32 characters)
   - **KEY 2**: `xyz789ghi012...` (another key for rotation)
   - **Location/Region**: `eastus` (or your selected region)
   - **Endpoint**: `https://eastus.api.cognitive.microsoft.com/`

4. **Copy KEY 1** (click the copy icon)
5. **Copy the Region** (just the region name like `eastus`, not the full URL)

#### 6. Add to .env File

```bash
# Azure Cognitive Services (Primary TTS)
AZURE_SPEECH_KEY=abc123def456...  # Replace with your KEY 1
AZURE_SPEECH_REGION=eastus        # Replace with your region (lowercase, no spaces)
```

**Region Examples**:
- East US → `eastus`
- West US 2 → `westus2`
- Southeast Asia → `southeastasia`
- West Europe → `westeurope`

#### 7. Test Your Azure Speech Key

```bash
# Test with curl (replace with your key and region)
curl -X POST "https://YOUR_REGION.tts.speech.microsoft.com/cognitiveservices/v1" \
  -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
  -H "Content-Type: application/ssml+xml" \
  -H "X-Microsoft-OutputFormat: audio-16khz-128kbitrate-mono-mp3" \
  -d "<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='en-US-JennyNeural'>Hello from Azure Speech!</voice></speak>" \
  --output test.mp3

# If successful, you'll have a test.mp3 file with the speech
```

### Common Azure Issues and Solutions

**Issue 1: "Free tier not available in selected region"**
- Solution: Choose a different region (East US and West Europe usually have Free tier)
- Or: Select Standard S0 tier (you still get 0.5M characters free per month)

**Issue 2: "Subscription not found" or "No subscriptions"**
- Solution: Complete the Azure account setup fully, including credit card verification
- Sometimes takes 5-10 minutes for subscription to activate

**Issue 3: "Deployment failed"**
- Solution: Try a different region or resource name
- Check if you've reached resource limits (unlikely with new account)

**Issue 4: "Can't find Keys and Endpoint section"**
- Solution: Make sure deployment completed (check Notifications bell icon)
- Click "Refresh" in your browser
- Navigate to Home → All resources → Click your speech resource

**Issue 5: "Authentication failed" when testing**
- Solution: Double-check you copied KEY 1, not the endpoint URL
- Make sure region is lowercase with no spaces (`eastus` not `East US`)
- Wait 2-3 minutes after creation for keys to activate

---

## 🔊 Google Cloud Text-to-Speech

Google Cloud TTS provides natural-sounding voices with WaveNet and Neural2 models.

### Prerequisites
- Google account (Gmail)
- Credit card (required even for free tier - you get $300 free credits)
- Free tier: 0-4 million characters/month free (Standard voices)

### Step-by-Step Setup

#### 1. Create Google Cloud Account

1. Go to https://cloud.google.com/
2. Click **"Get started for free"** (top right)
3. Sign in with your Google account
4. **Country selection** and accept terms
5. **Account type**: Select "Individual" (unless you're a business)
6. **Payment information**:
   - Enter credit card details
   - You'll see a $1-2 temporary authorization (refunded)
   - You won't be charged during free trial ($300 credits)
7. Click **"Start my free trial"**

#### 2. Navigate to Google Cloud Console

1. After signup, go to https://console.cloud.google.com
2. You'll see the Google Cloud Console dashboard

#### 3. Create a New Project

1. At the top bar, click the **project dropdown** (next to "Google Cloud")
   - It might say "My First Project" or "Select a project"
2. Click **"NEW PROJECT"** (top right of popup)
3. Fill in:
   - **Project name**: `ScriptSensei` or `scriptsensei-dev`
   - **Location**: Leave as "No organization"
4. Click **"CREATE"**
5. Wait 10-20 seconds for project creation
6. Make sure your new project is selected in the top bar

#### 4. Enable Text-to-Speech API

1. In the left sidebar, click **"☰ Menu"** (hamburger icon)
2. Navigate to: **APIs & Services** → **Library**
3. In the search box, type: **"Text-to-Speech"**
4. Click **"Cloud Text-to-Speech API"**
5. Click **"ENABLE"** button (blue button)
6. Wait 30 seconds for API to enable

#### 5. Create Service Account

**Why Service Account?**: It's a special account for your application to authenticate with Google Cloud.

1. In left sidebar: **"☰ Menu"** → **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** (top of page)
3. Select **"Service account"**

#### 6. Configure Service Account

**Step 1: Service account details**
- **Service account name**: `scriptsensei-tts`
  - Service account ID will auto-fill as `scriptsensei-tts@your-project.iam.gserviceaccount.com`
- **Description**: "Service account for ScriptSensei Text-to-Speech"
- Click **"CREATE AND CONTINUE"**

**Step 2: Grant access**
- **Role**: Click "Select a role" dropdown
- Type: `Text-to-Speech`
- Select one of these roles (in order of preference):
  1. **"Cloud Text-to-Speech Service Agent"** - Recommended (gives service account access)
  2. **"Cloud Speech Administrator"** - More permissive but works
  3. **"Editor"** - Most permissive (if the above are not available)
- Click **"CONTINUE"**

**Step 3: Grant users access** (optional)
- Leave empty (skip this step)
- Click **"DONE"**

#### 7. Create and Download Service Account Key

1. You'll be back at the Credentials page
2. Under **"Service Accounts"** section, find your `scriptsensei-tts` account
3. Click on the **email address** of the service account
4. Go to the **"KEYS"** tab (top of page)
5. Click **"ADD KEY"** dropdown → **"Create new key"**
6. Select **"JSON"** format (should be selected by default)
7. Click **"CREATE"**

**IMPORTANT**:
- A JSON file will download automatically (e.g., `scriptsensei-dev-abc123.json`)
- **This file contains your secret credentials** - keep it safe!
- Move this file to a secure location in your project

#### 8. Set Up Service Account Key

**Option A: Recommended - Project Directory**

1. In your ScriptSensei project, create a `keys` directory:
```bash
mkdir -p /Users/niksankarkee/Dev/ScriptSensei/keys
```

2. Move the downloaded JSON file:
```bash
mv ~/Downloads/scriptsensei-dev-*.json /Users/niksankarkee/Dev/ScriptSensei/keys/google-tts-key.json
```

3. **IMPORTANT**: Add to `.gitignore` to prevent committing secrets:
```bash
echo "keys/" >> .gitignore
```

**Option B: System-wide Location**

1. Create a credentials directory:
```bash
mkdir -p ~/.config/gcloud/
mv ~/Downloads/scriptsensei-dev-*.json ~/.config/gcloud/scriptsensei-tts.json
```

#### 9. Add to .env File

```bash
# Google Cloud Text-to-Speech (Fallback)
# Path to the JSON key file you downloaded
GOOGLE_TTS_CREDENTIALS_PATH=/Users/niksankarkee/Dev/ScriptSensei/keys/google-tts-key.json

# Or if using system-wide location:
# GOOGLE_TTS_CREDENTIALS_PATH=/Users/niksankarkee/.config/gcloud/scriptsensei-tts.json
```

**For Translation Service** (if using Google Translate):
```bash
# Google Translate (uses same credentials)
GOOGLE_TRANSLATE_CREDENTIALS_PATH=/Users/niksankarkee/Dev/ScriptSensei/keys/google-tts-key.json
```

**Note**: You can use the same service account key for both TTS and Translate, or create separate ones for better security.

#### 10. Test Your Google Cloud TTS Setup

**Method 1: Using curl with API Key** (simpler but less secure)

First, create an API key:
1. Go to: APIs & Services → Credentials
2. Click "+ CREATE CREDENTIALS" → "API Key"
3. Copy the key

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "input": {"text": "Hello from Google Cloud!"},
    "voice": {"languageCode": "en-US", "name": "en-US-Neural2-C"},
    "audioConfig": {"audioEncoding": "MP3"}
  }' \
  "https://texttospeech.googleapis.com/v1/text:synthesize?key=YOUR_API_KEY" > response.json

# Extract and decode audio
cat response.json | jq -r '.audioContent' | base64 --decode > test.mp3
```

**Method 2: Using service account JSON** (recommended)

```bash
# Install Google Cloud SDK first (if not already installed)
# macOS:
brew install --cask google-cloud-sdk

# Authenticate with service account
gcloud auth activate-service-account --key-file=/path/to/your/google-tts-key.json

# Test the API
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {"text": "Testing Google TTS!"},
    "voice": {"languageCode": "en-US", "name": "en-US-Neural2-C"},
    "audioConfig": {"audioEncoding": "MP3"}
  }' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" > response.json
```

### Common Google Cloud Issues and Solutions

**Issue 1: "API Key not found" or "Permission denied"**
- Solution: Make sure you enabled the Cloud Text-to-Speech API (Step 4)
- Wait 2-3 minutes after enabling for changes to propagate
- Check that your service account has the correct role

**Issue 2: "Service account JSON file not found"**
- Solution: Verify the path in .env is correct and absolute (not relative)
- Check file permissions: `ls -la /path/to/google-tts-key.json`
- Make sure file wasn't moved or deleted

**Issue 3: "Billing not enabled" error**
- Solution:
  1. Go to Google Cloud Console
  2. Hamburger menu → Billing
  3. Link a billing account (even for free tier)
  4. You won't be charged during free trial

**Issue 4: "Can't find service account in credentials"**
- Solution: Make sure you created the service account in the correct project
- Check the project dropdown at top of console
- Refresh the Credentials page

**Issue 5: "JSON key file has wrong format"**
- Solution: Make sure you selected JSON format when creating key, not P12
- Re-download the key if needed (delete old key first in Keys tab)
- Don't manually edit the JSON file

**Issue 6: "Cannot find Cloud Text-to-Speech API User role"**
- Solution: Use "Editor" role instead (more permissive but works)
- Or use "Cloud Text-to-Speech Admin" if available
- Or manually search for "Text-to-Speech" in the role dropdown

**Issue 7: Project billing shows "free trial not available"**
- Solution: This happens if you've used Google Cloud before
- You can still use the service - just monitor usage to stay in free tier
- Set up budget alerts: Billing → Budgets & alerts → Create budget

---

## 🔐 Security Best Practices

### For Azure Keys
- **Never commit** Azure keys to git
- **Rotate keys** every 90 days (Azure allows 2 keys for zero-downtime rotation)
- **Use Key Vault** in production: https://azure.microsoft.com/products/key-vault
- **Monitor usage**: Azure Portal → Your Speech Resource → Monitoring

### For Google Cloud Keys
- **Never commit** JSON key files to git (add `keys/` to `.gitignore`)
- **Limit permissions**: Use least-privilege principle for service accounts
- **Rotate keys**: Delete and recreate keys every 90 days
- **Use Secret Manager** in production: https://cloud.google.com/secret-manager
- **Monitor usage**: Google Cloud Console → APIs & Services → Dashboard

### Environment Variables
```bash
# ❌ DON'T DO THIS (committed to git)
.env

# ✅ DO THIS (local only)
.env.local
.env.development.local

# Add to .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "keys/" >> .gitignore
```

---

## 💰 Cost Estimates (As of 2025)

### Azure Cognitive Services Speech

**Free Tier (F0)**:
- 0.5 million characters/month free (neural voices)
- ~250 minutes of audio/month
- Perfect for development and testing

**Standard Tier (S0)** - if using paid:
- Neural voices: $16 per 1M characters
- Standard voices: $4 per 1M characters
- After free quota used

**Example Cost**:
- 10,000 videos/month × 200 characters each = 2M characters
- Cost: (2M - 0.5M free) × $16 = $24/month

### Google Cloud Text-to-Speech

**Free Tier**:
- Standard voices: 0-4M characters/month FREE
- WaveNet/Neural2: 0-1M characters/month FREE
- Perfect for most development needs

**Paid Tier** - after free quota:
- Standard voices: $4 per 1M characters
- WaveNet voices: $16 per 1M characters
- Neural2 voices: $16 per 1M characters

**Example Cost**:
- 10,000 videos/month × 200 characters each = 2M characters
- Cost (if using Neural2): (2M - 1M free) × $16 = $16/month

### Cost Optimization Tips

1. **Use standard voices for development/testing**
2. **Cache frequently used audio** (store MP3 files)
3. **Batch similar requests** to reduce API calls
4. **Monitor usage** with dashboards
5. **Set billing alerts** at $10, $50, $100 thresholds
6. **Use free tier services** first, then upgrade as needed

---

## 🎯 Quick Reference

### Azure Speech Service
- **Portal**: https://portal.azure.com
- **Pricing**: https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/
- **Docs**: https://learn.microsoft.com/azure/cognitive-services/speech-service/
- **Voice Gallery**: https://speech.microsoft.com/portal/voicegallery

### Google Cloud TTS
- **Console**: https://console.cloud.google.com
- **Pricing**: https://cloud.google.com/text-to-speech/pricing
- **Docs**: https://cloud.google.com/text-to-speech/docs
- **Voice List**: https://cloud.google.com/text-to-speech/docs/voices

---

## ✅ Verification Checklist

### Azure Speech Services
- [ ] Azure account created with free trial activated
- [ ] Speech resource created in Azure Portal
- [ ] KEY 1 copied from "Keys and Endpoint" section
- [ ] Region copied (e.g., `eastus`)
- [ ] Keys added to .env file
- [ ] Test API call successful (received MP3 file)
- [ ] Keys not committed to git (.gitignore configured)

### Google Cloud TTS
- [ ] Google Cloud account created with free credits
- [ ] New project created (e.g., "ScriptSensei")
- [ ] Cloud Text-to-Speech API enabled
- [ ] Service account created with correct role
- [ ] JSON key file downloaded
- [ ] JSON file moved to secure location
- [ ] Path added to .env file
- [ ] keys/ directory added to .gitignore
- [ ] Test API call successful
- [ ] Billing account linked (even for free tier)

---

## 🆘 Still Having Issues?

If you're still encountering problems after following this guide:

1. **Check the exact error message** - paste it when asking for help
2. **Verify account status**:
   - Azure: Check if free trial is active (Portal → Cost Management)
   - Google: Check if free credits available (Console → Billing)
3. **Wait and retry** - Sometimes changes take 5-10 minutes to propagate
4. **Contact support**:
   - Azure: https://azure.microsoft.com/support/
   - Google Cloud: https://cloud.google.com/support

**Common error message meanings**:
- `401 Unauthorized` → Wrong API key or not activated yet
- `403 Forbidden` → Insufficient permissions or API not enabled
- `404 Not Found` → Wrong endpoint URL or region
- `429 Too Many Requests` → Rate limit exceeded (wait 1 minute)
- `500 Internal Server Error` → Service issue (try different region)

---

**Need help?** Create an issue with:
- Service name (Azure or Google Cloud)
- Exact error message
- Steps you've already tried
- Region you selected
