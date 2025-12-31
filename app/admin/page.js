'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: '', domainWhitelist: '' })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    try {
      const domains = newCompany.domainWhitelist
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d)

      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompany.name,
          domainWhitelist: domains,
        }),
      })

      if (res.ok) {
        setShowCreateForm(false)
        setNewCompany({ name: '', domainWhitelist: '' })
        fetchCompanies()
      }
    } catch (error) {
      console.error('Error creating company:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Store Locator Admin</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : '+ Create Company'}
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateCompany}
            className="mb-8 p-6 bg-white rounded-lg shadow"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Company</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allowed Domains (comma-separated)
                </label>
                <input
                  type="text"
                  value={newCompany.domainWhitelist}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      domainWhitelist: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., example.com, www.example.com"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Domains where the store locator can be embedded (leave empty for no restrictions)
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Company
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-6">
          {companies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No companies yet. Create your first company!</p>
            </div>
          ) : (
            companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {company.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Slug: <code className="bg-gray-100 px-2 py-1 rounded">{company.slug}</code>
                    </p>
                    {company.domainWhitelist && company.domainWhitelist.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Allowed domains: {company.domainWhitelist.join(', ')}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Manage
                  </Link>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{company.stores.length}</span> stores
                    {company.stores.filter((s) => s.geocoded).length !==
                      company.stores.length && (
                      <span className="text-orange-600 ml-2">
                        ({company.stores.length -
                          company.stores.filter((s) => s.geocoded).length}{' '}
                        need geocoding)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Public URL:{' '}
                    <a
                      href={`/locator/${company.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      /locator/{company.slug}
                    </a>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

