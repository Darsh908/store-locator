"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function FiltersPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [filters, setFilters] = useState([]);
  const [availableFields, setAvailableFields] = useState({
    standardFields: [],
    customFields: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [formData, setFormData] = useState({
    fieldName: "",
    displayName: "",
    filterType: "select",
    options: null,
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (params.id) {
      fetchCompany();
      fetchFilters();
      fetchAvailableFields();
    }
  }, [params.id]);

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}`);
      const data = await res.json();
      setCompany(data);
    } catch (error) {
      console.error("Error fetching company:", error);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}/filters`);
      const data = await res.json();
      setFilters(data);
    } catch (error) {
      console.error("Error fetching filters:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFields = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}/fields`);
      const data = await res.json();
      setAvailableFields(data);
    } catch (error) {
      console.error("Error fetching fields:", error);
    }
  };

  const handleFieldSelect = (fieldName, isCustom = false) => {
    const field = isCustom
      ? availableFields.customFields.find((f) => f.name === fieldName)
      : availableFields.standardFields.find((f) => f.name === fieldName);

    if (field) {
      setFormData({
        ...formData,
        fieldName: field.name,
        displayName: field.displayName,
        filterType:
          field.type === "number"
            ? "range"
            : field.type === "boolean"
            ? "select"
            : field.sampleValues && field.sampleValues.length > 0
            ? "select"
            : "text",
        options:
          field.sampleValues && field.sampleValues.length > 0
            ? { values: field.sampleValues }
            : null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingFilter
        ? `/api/companies/${params.id}/filters/${editingFilter.id}`
        : `/api/companies/${params.id}/filters`;
      const method = editingFilter ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddForm(false);
        setEditingFilter(null);
        setFormData({
          fieldName: "",
          displayName: "",
          filterType: "select",
          options: null,
          order: 0,
          isActive: true,
        });
        fetchFilters();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving filter:", error);
      alert("Error saving filter");
    }
  };

  const handleDelete = async (filterId) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;

    try {
      const res = await fetch(
        `/api/companies/${params.id}/filters/${filterId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        fetchFilters();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting filter:", error);
      alert("Error deleting filter");
    }
  };

  const handleEdit = (filter) => {
    setEditingFilter(filter);
    setFormData({
      fieldName: filter.fieldName,
      displayName: filter.displayName,
      filterType: filter.filterType,
      options: filter.options,
      order: filter.order,
      isActive: filter.isActive,
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="loader-ring mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading filter configuration...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-white text-xl font-semibold">Company not found</p>
        </div>
      </div>
    );
  }

  const allFields = [...availableFields.standardFields, ...availableFields.customFields];
  const usedFieldNames = new Set(filters.map((f) => f.fieldName));
  const availableFieldsList = allFields.filter(
    (f) => !usedFieldNames.has(f.name) || editingFilter?.fieldName === f.name
  );

  const getFilterIcon = (type) => {
    switch (type) {
      case "select": return "📋";
      case "multiselect": return "☑️";
      case "text": return "🔤";
      case "range": return "📊";
      case "checkbox": return "✓";
      default: return "📋";
    }
  };

  const getFilterBadgeClass = (type) => {
    switch (type) {
      case "select": return "badge-primary";
      case "multiselect": return "badge-violet";
      case "text": return "badge-cyan";
      case "range": return "badge-warning";
      case "checkbox": return "badge-success";
      default: return "badge-primary";
    }
  };

  return (
    <div className="min-h-screen bg-mesh">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-violet w-80 h-80 -top-40 -left-40 animate-float"></div>
        <div className="orb orb-cyan w-64 h-64 bottom-0 right-0 animate-float-slow"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push(`/admin/companies/${params.id}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white font-medium mb-6 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Company
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Filter Configuration</h1>
              <p className="text-slate-400 mt-1">{company.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Filters ({filters.length})</h2>
              <p className="text-slate-400 text-sm">Configure searchable filters for your store locator</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingFilter(null);
                setFormData({
                  fieldName: "",
                  displayName: "",
                  filterType: "select",
                  options: null,
                  order: 0,
                  isActive: true,
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showAddForm ? "Cancel" : "Add Filter"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 glass rounded-xl border border-indigo-500/20 animate-slide-down">
              <h3 className="font-bold text-white mb-6 text-lg flex items-center gap-2">
                {editingFilter ? (
                  <>
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Filter
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Filter
                  </>
                )}
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Field <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.fieldName}
                    onChange={(e) => {
                      const field = allFields.find((f) => f.name === e.target.value);
                      handleFieldSelect(e.target.value, field?.isCustom);
                    }}
                    className="input-modern"
                  >
                    <option value="">Select a field...</option>
                    {availableFields.standardFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.displayName} (Standard)
                      </option>
                    ))}
                    {availableFields.customFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.displayName} (Custom)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="input-modern"
                    placeholder="How to display in locator"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Filter Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.filterType}
                    onChange={(e) => setFormData({ ...formData, filterType: e.target.value })}
                    className="input-modern"
                  >
                    <option value="select">Select (Dropdown)</option>
                    <option value="multiselect">Multi-Select</option>
                    <option value="text">Text Search</option>
                    <option value="range">Range (Number)</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="input-modern"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 glass rounded-lg mb-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Active (show in locator)
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {editingFilter ? "Update Filter" : "Create Filter"}
                </button>
                {editingFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingFilter(null);
                      setFormData({
                        fieldName: "",
                        displayName: "",
                        filterType: "select",
                        options: null,
                        order: 0,
                        isActive: true,
                      });
                    }}
                    className="px-6 py-3 glass text-slate-300 rounded-xl font-semibold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {filters.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mx-auto mb-6 animate-float-slow">
                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Filters Configured</h3>
              <p className="text-slate-400 mb-6">Add filters to help customers search your stores</p>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((filter, index) => (
                <div
                  key={filter.id}
                  className="p-6 glass rounded-xl hover:bg-white/[0.08] transition-all group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{filter.displayName}</h3>
                        <span className={`badge ${getFilterBadgeClass(filter.filterType)}`}>
                          {getFilterIcon(filter.filterType)} {filter.filterType}
                        </span>
                        {filter.isActive ? (
                          <span className="badge badge-success">✓ Active</span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)' }}>○ Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>
                          Field: <code className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs">{filter.fieldName}</code>
                        </span>
                        <span>
                          Order: <span className="font-semibold text-slate-300">{filter.order}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(filter)}
                        className="px-4 py-2 text-sm bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 font-semibold transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(filter.id)}
                        className="px-4 py-2 text-sm bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 font-semibold transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
