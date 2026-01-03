import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full backdrop-blur-md bg-white/80 border-b border-neutral-200/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">📍</span>
            </div>
            <span className="text-xl font-bold text-slate-900">StoreHub</span>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/60 border border-blue-200/80 text-blue-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Modern Store Management Platform
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Powerful Store Locator
            <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              for Your Business
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Create beautiful, interactive store locators, manage locations
            effortlessly, and embed them anywhere. No coding required.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur border border-neutral-200/50 hover:border-blue-200/80 hover:shadow-lg transition-all">
              <div className="text-3xl mb-3">🗺️</div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Interactive Maps
              </h3>
              <p className="text-sm text-slate-600">
                Google Maps integration with real-time location markers
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur border border-neutral-200/50 hover:border-blue-200/80 hover:shadow-lg transition-all">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Custom Filters
              </h3>
              <p className="text-sm text-slate-600">
                Add custom filters to help customers find the right store
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur border border-neutral-200/50 hover:border-blue-200/80 hover:shadow-lg transition-all">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Easy Management
              </h3>
              <p className="text-sm text-slate-600">
                Intuitive dashboard to manage all your store locations
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Link>
            <button className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/50 backdrop-blur border-t border-b border-neutral-200/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">1000+</p>
              <p className="text-slate-600">Active Stores</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-cyan-600 mb-2">50+</p>
              <p className="text-slate-600">Companies</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">99.9%</p>
              <p className="text-slate-600">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2025 StoreHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
