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
        {
          method: "DELETE",
        }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading filter configuration...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-slate-900 font-semibold">Company not found</p>
        </div>
      </div>
    );
  }

  const allFields = [
    ...availableFields.standardFields,
    ...availableFields.customFields,
  ];
  const usedFieldNames = new Set(filters.map((f) => f.fieldName));
  const availableFieldsList = allFields.filter(
    (f) => !usedFieldNames.has(f.name) || editingFilter?.fieldName === f.name
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push(`/admin/companies/${params.id}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Company
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2 mb-1">
              <span>⚙️</span> Filter Configuration
            </h1>
            <p className="text-slate-600">{company.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-md border border-neutral-200/50 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Filters ({filters.length})
              </h2>
              <p className="text-slate-600 text-sm">
                Configure searchable filters for your store locator
              </p>
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <span>+</span> {showAddForm ? "Cancel" : "Add Filter"}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50 animate-slide-down"
            >
              <h3 className="font-bold text-slate-900 mb-6 text-lg">
                {editingFilter ? "✏️ Edit Filter" : "➕ Add New Filter"}
              </h3>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Field <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.fieldName}
                      onChange={(e) => {
                        const field = allFields.find(
                          (f) => f.name === e.target.value
                        );
                        handleFieldSelect(e.target.value, field?.isCustom);
                      }}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all"
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all"
                      placeholder="How to display in locator"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Filter Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.filterType}
                      onChange={(e) =>
                        setFormData({ ...formData, filterType: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all"
                    >
                      <option value="select">Select (Dropdown)</option>
                      <option value="multiselect">Multi-Select</option>
                      <option value="text">Text Search</option>
                      <option value="range">Range (Number)</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-neutral-300">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Active (show in locator)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-200">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
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
                      className="px-6 py-3 border border-neutral-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {filters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Filters Configured
              </h3>
              <p className="text-slate-600 mb-6">
                Add filters to help customers search your stores
              </p>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all inline-flex items-center gap-2"
                >
                  <span>+</span> Add Filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter) => (
                <div
                  key={filter.id}
                  className="p-6 border border-neutral-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {filter.displayName}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {filter.filterType === "select" && "📋"}
                          {filter.filterType === "multiselect" && "☑️"}
                          {filter.filterType === "text" && "🔤"}
                          {filter.filterType === "range" && "📊"}
                          {filter.filterType === "checkbox" && "✓"}
                          {" " + filter.filterType}
                        </span>
                        {filter.isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold">
                            ○ Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        Field:{" "}
                        <code className="bg-slate-100 px-2 py-1 rounded font-mono text-blue-600">
                          {filter.fieldName}
                        </code>{" "}
                        | Order:{" "}
                        <span className="font-semibold">{filter.order}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(filter)}
                        className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(filter.id)}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold transition-colors"
                      >
                        🗑️ Delete
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
