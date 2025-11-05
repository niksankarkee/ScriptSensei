'use client'

/**
 * Styles Step Component
 *
 * Language, dialect, tone, purpose, audience, and script style selection
 * Similar to Fliki's styles configuration
 * Now with correct flag emojis and functional tab switching
 */

import { useState } from 'react'

interface StylesStepProps {
  language: string
  dialect: string
  tone: string
  purpose: string
  audience: string
  scriptStyle: string
  onChange: (data: Partial<{
    language: string
    dialect: string
    tone: string
    purpose: string
    audience: string
    scriptStyle: string
  }>) => void
  onNext: () => void
  onBack: () => void
  isGenerating?: boolean
}

const languages = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'as', name: 'Assamese' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bho', name: 'Bhojpuri' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'my', name: 'Burmese' },
  { code: 'yue', name: 'Cantonese' },
  { code: 'ca', name: 'Catalan' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'fil', name: 'Filipino (Tagalog)' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ha', name: 'Hausa' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mai', name: 'Maithili' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mr', name: 'Marathi' },
  { code: 'nan', name: 'Min Nan' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Odia' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian (Farsi)' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'bo', name: 'Tibetan' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'wuu', name: 'Wu Chinese' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
]

const dialects: Record<string, string[]> = {
  en: ['United States', 'United Kingdom', 'Australia', 'Canada', 'India', 'South Africa'],
  es: ['Spain', 'Mexico', 'Argentina', 'Colombia', 'Chile'],
  fr: ['France', 'Canada', 'Belgium', 'Switzerland'],
  de: ['Germany', 'Austria', 'Switzerland'],
  ja: ['Japan'],
  zh: ['China', 'Taiwan', 'Singapore'],
  hi: ['India'],
  ar: ['Saudi Arabia', 'Egypt', 'UAE', 'Morocco'],
  pt: ['Brazil', 'Portugal'],
  ru: ['Russia', 'Ukraine', 'Kazakhstan'],
  ne: ['Nepal', 'India'],
  id: ['Indonesia'],
  ms: ['Malaysia', 'Singapore', 'Brunei'],
  fil: ['Philippines'],
  th: ['Thailand'],
  vi: ['Vietnam'],
  ko: ['South Korea', 'North Korea'],
  it: ['Italy', 'Switzerland'],
  tr: ['Turkey', 'Cyprus'],
  pl: ['Poland'],
  nl: ['Netherlands', 'Belgium'],
  sv: ['Sweden'],
  no: ['Norway'],
  da: ['Denmark'],
  fi: ['Finland'],
  el: ['Greece', 'Cyprus'],
  he: ['Israel'],
  fa: ['Iran', 'Afghanistan'],
  ur: ['Pakistan', 'India'],
  bn: ['Bangladesh', 'India'],
  ta: ['India', 'Sri Lanka', 'Singapore'],
  te: ['India'],
  mr: ['India'],
  gu: ['India'],
  kn: ['India'],
  ml: ['India'],
  pa: ['India', 'Pakistan'],
  sw: ['Kenya', 'Tanzania', 'Uganda'],
  af: ['South Africa', 'Namibia']
}

// Country to flag emoji mapping
const countryFlags: Record<string, string> = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Australia': '🇦🇺', 'Canada': '🇨🇦', 'India': '🇮🇳', 'South Africa': '🇿🇦',
  'Spain': '🇪🇸', 'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Chile': '🇨🇱',
  'France': '🇫🇷', 'Belgium': '🇧🇪', 'Switzerland': '🇨🇭',
  'Germany': '🇩🇪', 'Austria': '🇦🇹',
  'Japan': '🇯🇵',
  'China': '🇨🇳', 'Taiwan': '🇹🇼', 'Singapore': '🇸🇬',
  'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'UAE': '🇦🇪', 'Morocco': '🇲🇦',
  'Brazil': '🇧🇷', 'Portugal': '🇵🇹',
  'Russia': '🇷🇺', 'Ukraine': '🇺🇦', 'Kazakhstan': '🇰🇿',
  'Nepal': '🇳🇵',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾', 'Brunei': '🇧🇳',
  'Philippines': '🇵🇭',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'South Korea': '🇰🇷', 'North Korea': '🇰🇵',
  'Italy': '🇮🇹',
  'Turkey': '🇹🇷', 'Cyprus': '🇨🇾',
  'Poland': '🇵🇱',
  'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Greece': '🇬🇷',
  'Israel': '🇮🇱',
  'Iran': '🇮🇷', 'Afghanistan': '🇦🇫',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Sri Lanka': '🇱🇰',
  'Kenya': '🇰🇪', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬',
  'Namibia': '🇳🇦'
}

const tones = ['exciting', 'informative', 'relaxing', 'adventurous', 'humorous', 'other']
const purposes = ['promotion', 'education', 'vlog', 'review', 'tutorial', 'other']
const audiences = ['young adults', 'families', 'backpackers', 'luxury', 'retirees', 'other']

export function StylesStep({
  language,
  dialect,
  tone,
  purpose,
  audience,
  scriptStyle,
  onChange,
  onNext,
  onBack,
  isGenerating = false
}: StylesStepProps) {
  // State for tab switching between Sample script and Writing style
  const [activeTab, setActiveTab] = useState<'sample' | 'writing'>('writing')

  // Helper function to get flag emoji for a country
  const getFlag = (country: string) => countryFlags[country] || '🌍'

  return (
    <div className="space-y-6">
      {/* Language and Dialect */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => onChange({ language: e.target.value, dialect: dialects[e.target.value][0] })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-600 focus:border-transparent"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dialect
          </label>
          <select
            value={dialect}
            onChange={(e) => onChange({ dialect: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-600 focus:border-transparent"
          >
            {dialects[language]?.map((d) => (
              <option key={d} value={d}>
                {getFlag(d)} {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tone
        </label>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ tone: t })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                tone === t
                  ? 'border-pink-600 bg-pink-50 text-pink-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Purpose
        </label>
        <div className="flex flex-wrap gap-2">
          {purposes.map((p) => (
            <button
              key={p}
              onClick={() => onChange({ purpose: p })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                purpose === p
                  ? 'border-pink-600 bg-pink-50 text-pink-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audience
        </label>
        <div className="flex flex-wrap gap-2">
          {audiences.map((a) => (
            <button
              key={a}
              onClick={() => onChange({ audience: a })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                audience === a
                  ? 'border-pink-600 bg-pink-50 text-pink-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Script Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Script style
        </label>
        <div className="flex gap-4 mb-3">
          <button
            onClick={() => setActiveTab('sample')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'sample'
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sample script
          </button>
          <button
            onClick={() => setActiveTab('writing')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'writing'
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Writing style
          </button>
        </div>

        {activeTab === 'writing' ? (
          <textarea
            value={scriptStyle}
            onChange={(e) => onChange({ scriptStyle: e.target.value })}
            placeholder="e.g., Enthusiastic and engaging like a travel blogger"
            className="w-full h-24 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-600 focus:border-transparent resize-none"
          />
        ) : (
          <div className="w-full h-24 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto text-sm text-gray-700">
            {/* Education samples */}
            {purpose === 'education' && (
              <>
                {tone === 'informative' && (
                  <p>Welcome to today's lesson. We'll explore [topic] in detail, breaking down complex concepts into easy-to-understand steps. By the end, you'll have a clear understanding of how to apply this knowledge.</p>
                )}
                {tone === 'exciting' && (
                  <p>Get ready to learn something amazing! Today we're diving into [topic] and I guarantee it's going to blow your mind. This is the kind of knowledge that changes everything!</p>
                )}
                {tone === 'relaxing' && (
                  <p>Let's take our time today as we explore [topic] together. There's no rush - we'll go through each concept at a comfortable pace so you can fully absorb the information.</p>
                )}
                {tone !== 'informative' && tone !== 'exciting' && tone !== 'relaxing' && (
                  <p>Welcome to today's educational content about [topic]. We'll cover the key concepts you need to know and explore practical applications.</p>
                )}
              </>
            )}

            {/* Promotion samples */}
            {purpose === 'promotion' && (
              <>
                {tone === 'exciting' && (
                  <p>Hey everyone! I'm so excited to share something incredible with you today! This [product/service] has completely transformed the way I [benefit]. Let me show you why you need this in your life!</p>
                )}
                {tone === 'informative' && (
                  <p>Today I want to introduce you to [product/service]. Here are the key features, benefits, and everything you need to know to make an informed decision about whether this is right for you.</p>
                )}
                {tone === 'humorous' && (
                  <p>Okay, so you know that problem we all have with [issue]? Yeah, that one. Well, I found something that actually fixes it, and no, it's not magic... but it's pretty close!</p>
                )}
                {tone !== 'exciting' && tone !== 'informative' && tone !== 'humorous' && (
                  <p>I'd like to share [product/service] with you today. It's been a great addition to my [routine/workflow] and I think you'll find it valuable too.</p>
                )}
              </>
            )}

            {/* Vlog samples */}
            {purpose === 'vlog' && (
              <>
                {tone === 'relaxing' && (
                  <p>Hey friends, welcome back to my channel. Today I'm taking you along on a peaceful journey through [location/activity]. Grab your favorite drink, sit back, and let's enjoy this together.</p>
                )}
                {tone === 'exciting' && (
                  <p>What's up everyone! You won't believe what we're doing today! Get ready for an epic adventure as we [activity]. This is going to be insane!</p>
                )}
                {tone === 'adventurous' && (
                  <p>Welcome back adventurers! Today we're pushing boundaries as we explore [location/activity]. Pack your virtual bags because we're going off the beaten path!</p>
                )}
                {tone !== 'relaxing' && tone !== 'exciting' && tone !== 'adventurous' && (
                  <p>Hey everyone, welcome back! Today I'm taking you along as I [activity]. Let's see what happens!</p>
                )}
              </>
            )}

            {/* Review samples */}
            {purpose === 'review' && (
              <p>In today's video, I'll be giving you my honest review of [product/service]. I've been using this for [time period], and here's everything you need to know before making your decision.</p>
            )}

            {/* Tutorial samples */}
            {purpose === 'tutorial' && (
              <p>In this step-by-step tutorial, I'll show you exactly how to [task]. Don't worry if you're a beginner - I'll walk you through each step clearly. Let's get started!</p>
            )}

            {/* Default for "other" or no selection */}
            {(!purpose || purpose === 'other') && (
              <p>Sample script will appear here based on your selected tone and purpose. Try selecting different combinations above to see relevant examples for education, promotion, vlog, review, or tutorial content!</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Script...
            </>
          ) : (
            'Generate Script'
          )}
        </button>
      </div>
    </div>
  )
}
