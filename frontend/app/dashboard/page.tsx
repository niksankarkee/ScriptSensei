import { currentUser } from '@clerk/nextjs'
import Link from 'next/link'
import { FileText, Video, TrendingUp, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'Creator'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Create engaging content for any platform with AI-powered scripts
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard
          title="Idea to Video"
          description="Create video from your idea"
          icon={<Video className="h-8 w-8 text-indigo-600" />}
          href="/dashboard/create"
          color="indigo"
          featured={true}
        />
        <QuickActionCard
          title="Generate Script"
          description="Create AI-powered scripts"
          icon={<FileText className="h-8 w-8 text-purple-600" />}
          href="/dashboard/scripts/new"
          color="purple"
        />
        <QuickActionCard
          title="Trending Topics"
          description="Discover viral content"
          icon={<TrendingUp className="h-8 w-8 text-green-600" />}
          href="/dashboard/trends"
          color="green"
        />
        <QuickActionCard
          title="Templates"
          description="Use proven templates"
          icon={<Zap className="h-8 w-8 text-yellow-600" />}
          href="/dashboard/templates"
          color="yellow"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Scripts Created"
          value="0"
          change="+0%"
          trend="up"
        />
        <StatCard
          label="Videos Generated"
          value="0"
          change="+0%"
          trend="up"
        />
        <StatCard
          label="Total Views"
          value="0"
          change="+0%"
          trend="neutral"
        />
      </div>

      {/* Recent Scripts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Scripts</h2>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No scripts yet</p>
          <Link
            href="/dashboard/scripts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Your First Script
          </Link>
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  color,
  featured = false
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  featured?: boolean
}) {
  const colorClasses = {
    indigo: featured ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'bg-indigo-50 hover:bg-indigo-100',
    purple: 'bg-purple-50 hover:bg-purple-100',
    green: 'bg-green-50 hover:bg-green-100',
    yellow: 'bg-yellow-50 hover:bg-yellow-100',
  }

  return (
    <Link
      href={href}
      className={`${colorClasses[color as keyof typeof colorClasses]} p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all ${featured ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className={`text-lg font-semibold mb-1 ${featured ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`text-sm ${featured ? 'text-indigo-100' : 'text-gray-600'}`}>{description}</p>
    </Link>
  )
}

function StatCard({
  label,
  value,
  change,
  trend
}: {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className={`text-sm ${trendColors[trend]}`}>{change} from last month</p>
    </div>
  )
}
