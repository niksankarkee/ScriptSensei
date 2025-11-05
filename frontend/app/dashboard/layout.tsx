import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Video,
  Mic,
  Image,
  Settings,
  Sparkles,
  PlusCircle
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">ScriptSensei</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto">
          <nav className="p-4 space-y-1">
            {/* Primary CTA */}
            <Link
              href="/dashboard/create"
              className="flex items-center justify-center space-x-2 px-4 py-3 mb-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Create Video</span>
            </Link>

            <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />}>
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/scripts" icon={<FileText className="h-5 w-5" />}>
              Scripts
            </NavLink>
            <NavLink href="/dashboard/videos" icon={<Video className="h-5 w-5" />}>
              Videos
            </NavLink>
            <NavLink href="/dashboard/voices" icon={<Mic className="h-5 w-5" />}>
              Voices
            </NavLink>
            <NavLink href="/dashboard/images" icon={<Image className="h-5 w-5" />}>
              Images
            </NavLink>
            <NavLink href="/dashboard/settings" icon={<Settings className="h-5 w-5" />}>
              Settings
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
