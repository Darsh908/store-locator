import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Store Locator MVP
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Manage your store locations and embed them on your website
        </p>
        <div className="space-y-4">
          <Link
            href="/admin"
            className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Go to Admin Panel
          </Link>
          <p className="text-sm text-gray-500">
            Create companies, import stores, and get embeddable store locators
          </p>
        </div>
      </div>
    </div>
  )
}
