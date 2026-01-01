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
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Company not found</div>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/companies/${params.id}`)}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to Company
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Filter Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-2">{company.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Filters ({filters.length})
            </h2>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showAddForm ? "Cancel" : "+ Add Filter"}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 bg-gray-50 rounded-lg"
            >
              <h3 className="font-semibold mb-4 text-gray-900">
                {editingFilter ? "Edit Filter" : "Add New Filter"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field *
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter Type *
                  </label>
                  <select
                    required
                    value={formData.filterType}
                    onChange={(e) =>
                      setFormData({ ...formData, filterType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  >
                    <option value="select">Select (Dropdown)</option>
                    <option value="multiselect">Multi-Select</option>
                    <option value="text">Text Search</option>
                    <option value="range">Range (Number)</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Active (show in locator)
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingFilter ? "Update Filter" : "Create Filter"}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {filters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No filters configured. Add a filter to get started.
              </p>
            ) : (
              filters.map((filter) => (
                <div
                  key={filter.id}
                  className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {filter.displayName}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                        {filter.filterType}
                      </span>
                      {filter.isActive ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Field:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {filter.fieldName}
                      </code>{" "}
                      | Order: {filter.order}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(filter)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(filter.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

