"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    domainWhitelist: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const domains = newCompany.domainWhitelist
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompany.name,
          domainWhitelist: domains,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setNewCompany({ name: "", domainWhitelist: "" });
        fetchCompanies();
      }
    } catch (error) {
      console.error("Error creating company:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-bold">📍</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-slate-600">
                Manage your companies and store locations
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <span className="text-xl">+</span> Create Company
            </button>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-down">
          <form
            onSubmit={handleCreateCompany}
            className="bg-white rounded-2xl shadow-lg border border-neutral-200/50 p-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Create New Company
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
                  placeholder="e.g., example.com, www.example.com"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Domains where the store locator can be embedded (leave empty
                  for no restrictions)
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Create Company
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-neutral-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {companies.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Companies Yet
            </h3>
            <p className="text-slate-600 mb-6">
              Create your first company to get started
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <span>+</span> Create Company
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-2xl shadow-md border border-neutral-200/50 hover:shadow-xl hover:border-blue-200/80 transition-all duration-300 overflow-hidden group"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          {company.name}
                        </h2>
                      </div>
                      <p className="text-sm text-slate-500 ml-11">
                        Slug:{" "}
                        <code className="bg-slate-100 px-3 py-1 rounded-md font-mono text-blue-600">
                          {company.slug}
                        </code>
                      </p>
                      {company.domainWhitelist &&
                        company.domainWhitelist.length > 0 && (
                          <p className="text-sm text-slate-600 mt-2 ml-11">
                            <span className="font-semibold">
                              Allowed domains:
                            </span>{" "}
                            {company.domainWhitelist.join(", ")}
                          </p>
                        )}
                    </div>
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hover:shadow-lg"
                    >
                      Manage
                    </Link>
                  </div>

                  <div className="border-t border-neutral-200 pt-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                        <div className="text-2xl">📍</div>
                        <div>
                          <p className="text-sm text-slate-600">Total Stores</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {company.stores.length}
                          </p>
                        </div>
                      </div>
                      {company.stores.filter((s) => s.geocoded).length !==
                        company.stores.length && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                          <div className="text-2xl">⚠️</div>
                          <div>
                            <p className="text-sm text-slate-600">
                              Need Geocoding
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {company.stores.length -
                                company.stores.filter((s) => s.geocoded).length}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-slate-600 font-semibold mb-2">
                        Public URL:
                      </p>
                      <a
                        href={`/locator/${company.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group/link"
                      >
                        <span>/locator/{company.slug}</span>
                        <svg
                          className="w-4 h-4 group-hover/link:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
