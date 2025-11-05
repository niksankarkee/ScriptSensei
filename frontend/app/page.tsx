import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Sparkles, Video, Wand2, Globe, TrendingUp, Zap, CheckCircle2 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ScriptSensei
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-6 py-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/50">
                    Get Started Free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/50"
                >
                  Go to Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-8">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">AI-Powered Content Creation</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Create Viral Videos with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Magic
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Transform your ideas into stunning scripts and videos for TikTok, YouTube, Instagram, and more.
            No video editing skills required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/50 hover:scale-105 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Start Creating Free</span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard/scripts/new"
                className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/50 hover:scale-105 flex items-center space-x-2"
              >
                <Sparkles className="h-5 w-5" />
                <span>Create Your First Script</span>
              </Link>
            </SignedIn>
            <button className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all border-2 border-gray-200 flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2">100+</div>
              <div className="text-gray-600">Languages Supported</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2">6</div>
              <div className="text-gray-600">Social Platforms</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2">2000+</div>
              <div className="text-gray-600">AI Voices</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Create Viral Content
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful AI tools designed for content creators, marketers, and businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Wand2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Script Generator</h3>
              <p className="text-gray-600 mb-6">
                Generate engaging scripts optimized for any platform in seconds. Perfect hooks, compelling stories, and strong CTAs.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Platform-specific optimization
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Multiple tones & styles
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Quality score metrics
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Video className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Text-to-Video Magic</h3>
              <p className="text-gray-600 mb-6">
                Transform scripts into professional videos with AI-generated visuals, voiceovers, and music in minutes.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  720p, 1080p, 4K output
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  All aspect ratios
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Stock footage library
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Reach</h3>
              <p className="text-gray-600 mb-6">
                Create content in 100+ languages with native cultural localization and dialect support.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  100+ languages
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Cultural localization
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Regional dialects
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Trend Analysis</h3>
              <p className="text-gray-600 mb-6">
                Stay ahead with real-time trending topics, hashtags, and viral content insights across all platforms.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Real-time trends
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Platform analytics
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Viral predictions
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Voice Cloning</h3>
              <p className="text-gray-600 mb-6">
                Clone your voice or choose from 2000+ AI voices. Create natural-sounding narration in any language.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Custom voice profiles
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  2000+ premium voices
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Multi-language support
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Bulk Creation</h3>
              <p className="text-gray-600 mb-6">
                Generate hundreds of videos at once from CSV files. Perfect for product showcases and content scaling.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  CSV batch processing
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Template system
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Parallel generation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Optimized for Every Platform
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Create content perfectly tailored for your favorite social media platforms
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'TikTok', color: 'from-pink-500 to-purple-500' },
              { name: 'YouTube', color: 'from-red-500 to-red-600' },
              { name: 'Instagram', color: 'from-purple-500 to-pink-500' },
              { name: 'Facebook', color: 'from-blue-500 to-blue-600' },
              { name: 'Twitter', color: 'from-blue-400 to-blue-500' },
              { name: 'LinkedIn', color: 'from-blue-600 to-blue-700' },
            ].map((platform) => (
              <div
                key={platform.name}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
              >
                <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br ${platform.color} rounded-lg`} />
                <div className="font-semibold text-gray-900">{platform.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Create Viral Content?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of creators using ScriptSensei to grow their audience
          </p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 flex items-center space-x-2 mx-auto">
                <Sparkles className="h-5 w-5" />
                <span>Get Started for Free</span>
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
            >
              <Sparkles className="h-5 w-5" />
              <span>Go to Dashboard</span>
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">ScriptSensei</span>
          </div>
          <p className="text-sm">
            © 2025 ScriptSensei Global. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
