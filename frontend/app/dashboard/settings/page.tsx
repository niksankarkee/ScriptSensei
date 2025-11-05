'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { Save, Bell, Globe, Key, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    defaultPlatform: 'tiktok',
    defaultLanguage: 'en',
    defaultTone: 'professional',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: Save settings to backend
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and application preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Key className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Account</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Profile</p>
                <p className="text-sm text-gray-600">Manage your account details</p>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">Subscription</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Plan: <span className="font-medium text-gray-900">Free Tier</span></p>
                  <p className="text-xs text-gray-500 mt-1">5 videos/month • 720p resolution</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates about your content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-600">Receive tips, updates and offers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.marketingEmails}
                  onChange={(e) => setSettings({ ...settings, marketingEmails: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Default Platform
              </label>
              <select
                value={settings.defaultPlatform}
                onChange={(e) => setSettings({ ...settings, defaultPlatform: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="instagram_reels">Instagram Reels</option>
                <option value="instagram_stories">Instagram Stories</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Default Language
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="en">English</option>
                <option value="ja">Japanese</option>
                <option value="ne">Nepali</option>
                <option value="hi">Hindi</option>
                <option value="id">Indonesian</option>
                <option value="th">Thai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Default Tone
              </label>
              <select
                value={settings.defaultTone}
                onChange={(e) => setSettings({ ...settings, defaultTone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="inspirational">Inspirational</option>
                <option value="humorous">Humorous</option>
                <option value="educational">Educational</option>
                <option value="entertaining">Entertaining</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">API Access</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                API access is available for Pro and Business plans
              </p>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm" disabled>
                Generate API Key (Premium)
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end space-x-4">
          {saved && (
            <p className="text-sm text-green-600">Settings saved successfully!</p>
          )}
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  )
}
