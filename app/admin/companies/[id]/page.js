"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCompany();
      fetchStores();
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

  const fetchStores = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}/stores`);
      const data = await res.json();
      setStores(data);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseRowData = (row) => {
    // Helper function to parse latitude/longitude
    const parseCoordinate = (value) => {
      if (!value) return null;
      const num = typeof value === "string" ? parseFloat(value.trim()) : value;
      return isNaN(num) ? null : num;
    };

    // Standard fields that go to database columns
    const standardFields = {
      name: row.name || row.Name || row.NAME || null,
      address:
        row.address ||
        row.Address ||
        row.ADDRESS ||
        `${row.street || ""} ${row.city || ""} ${row.state || ""} ${
          row.zip || ""
        }`.trim() ||
        null,
      latitude:
        parseCoordinate(
          row.latitude ||
            row.Latitude ||
            row.LATITUDE ||
            row.lat ||
            row.Lat ||
            row.LAT
        ) || null,
      longitude:
        parseCoordinate(
          row.longitude ||
            row.Longitude ||
            row.LONGITUDE ||
            row.lng ||
            row.Lng ||
            row.LNG ||
            row.lon ||
            row.Lon ||
            row.LON
        ) || null,
      phone: row.phone || row.Phone || row.PHONE || null,
      email: row.email || row.Email || row.EMAIL || null,
      website: row.website || row.Website || row.WEBSITE || null,
      description:
        row.description || row.Description || row.DESCRIPTION || null,
    };

    // Collect all other fields into customData
    const standardFieldKeys = [
      "name",
      "Name",
      "NAME",
      "address",
      "Address",
      "ADDRESS",
      "street",
      "city",
      "state",
      "zip",
      "latitude",
      "Latitude",
      "LATITUDE",
      "lat",
      "Lat",
      "LAT",
      "longitude",
      "Longitude",
      "LONGITUDE",
      "lng",
      "Lng",
      "LNG",
      "lon",
      "Lon",
      "LON",
      "phone",
      "Phone",
      "PHONE",
      "email",
      "Email",
      "EMAIL",
      "website",
      "Website",
      "WEBSITE",
      "description",
      "Description",
      "DESCRIPTION",
    ];

    const customData = {};
    Object.keys(row).forEach((key) => {
      // Skip empty values and standard fields
      if (
        row[key] !== null &&
        row[key] !== undefined &&
        row[key] !== "" &&
        !standardFieldKeys.includes(key)
      ) {
        customData[key] = row[key];
      }
    });

    return {
      ...standardFields,
      customData: Object.keys(customData).length > 0 ? customData : null,
    };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      let parsedData = [];

      if (fileExtension === "csv") {
        // Parse CSV using PapaParse
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            parsedData = results.data;
            processParsedData(parsedData);
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            alert("Error parsing CSV file");
            setUploading(false);
          },
        });
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        // Parse Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            // Get the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON with header row
            parsedData = XLSX.utils.sheet_to_json(worksheet, {
              defval: "", // Default value for empty cells
              raw: false, // Convert all values to strings
            });

            processParsedData(parsedData);
          } catch (error) {
            console.error("Excel parsing error:", error);
            alert("Error parsing Excel file. Please ensure the file is valid.");
            setUploading(false);
          }
        };
        reader.onerror = () => {
          alert("Error reading Excel file");
          setUploading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert(
          "Unsupported file format. Please upload a CSV or Excel file (.xlsx, .xls)"
        );
        setUploading(false);
        return;
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
      setUploading(false);
    }
  };

  const processParsedData = async (parsedData) => {
    try {
      // Filter and map the data
      const parsedStores = parsedData
        .filter((row) => {
          const parsed = parseRowData(row);
          return parsed.name && parsed.address; // Filter empty rows
        })
        .map((row) => parseRowData(row));

      if (parsedStores.length === 0) {
        alert(
          'No valid stores found in the file. Please ensure the file has "name" and "address" columns.'
        );
        setUploading(false);
        return;
      }

      // Send to API for geocoding and creation
      const res = await fetch(`/api/companies/${params.id}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: parsedStores }),
      });

      if (res.ok) {
        setShowImportForm(false);
        fetchStores();
        alert(`Successfully imported ${parsedStores.length} store(s)!`);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error processing data:", error);
      alert("Error processing file data");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading company details...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/admin")}
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
            Back to Companies
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {company.name}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Slug:{" "}
                <code className="bg-slate-100 px-3 py-1 rounded-md font-mono text-blue-600">
                  {company.slug}
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stores Section */}
        <div className="bg-white rounded-2xl shadow-md border border-neutral-200/50 p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <span>📍</span> Stores ({stores.length})
              </h2>
              <p className="text-sm text-slate-600">
                Manage and import your store locations
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/admin/companies/${params.id}/filters`}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <span>⚙️</span> Configure Filters
              </Link>
              <button
                onClick={() => setShowImportForm(!showImportForm)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <span>📤</span> {showImportForm ? "Cancel" : "Import Stores"}
              </button>
            </div>
          </div>

          {showImportForm && (
            <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50 animate-slide-down">
              <h3 className="font-bold text-slate-900 mb-3 text-lg">
                📥 Import Stores from File
              </h3>
              <div className="space-y-3 text-sm text-slate-700 mb-5">
                <p>
                  <span className="font-semibold">Supported formats:</span> CSV,
                  Excel (.xlsx, .xls)
                </p>
                <p>
                  <span className="font-semibold">Required columns:</span>{" "}
                  <code className="bg-white px-2 py-1 rounded font-mono">
                    name
                  </code>
                  ,{" "}
                  <code className="bg-white px-2 py-1 rounded font-mono">
                    address
                  </code>
                </p>
                <p>
                  <span className="font-semibold">Optional columns:</span>{" "}
                  phone, email, website, description
                </p>
                <p className="text-blue-600">
                  <span className="font-semibold">Optional coordinates:</span>{" "}
                  latitude/lat, longitude/lng/lon (if provided, geocoding will
                  be skipped)
                </p>
              </div>
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-white/50 transition-colors">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-slate-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-600">CSV or Excel files</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {uploading && (
                <p className="mt-3 text-sm text-green-700 font-medium animate-pulse">
                  ⏳ Uploading and geocoding addresses...
                </p>
              )}
            </div>
          )}

          {stores.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Stores Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Import stores to get started
              </p>
              {!showImportForm && (
                <button
                  onClick={() => setShowImportForm(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all inline-flex items-center gap-2"
                >
                  <span>📤</span> Import Stores
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {stores.map((store) => (
                    <tr
                      key={store.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {store.name}
                        </div>
                        {store.phone && (
                          <div className="text-xs text-slate-600 mt-1">
                            📞 {store.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">
                          {store.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {store.latitude && store.longitude ? (
                          <code className="bg-blue-50 px-3 py-1 rounded font-mono text-blue-700">
                            {store.latitude.toFixed(4)},{" "}
                            {store.longitude.toFixed(4)}
                          </code>
                        ) : (
                          <span className="text-orange-600 font-medium">
                            Not geocoded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {store.geocoded ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            <span>✓</span> Geocoded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                            <span>⏳</span> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Embed Code Section */}
        <div className="bg-white rounded-2xl shadow-md border border-neutral-200/50 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span>💻</span> Embed Code
          </h2>
          <p className="text-slate-600 mb-6">
            Use this iframe code to embed the store locator on your website:
          </p>
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-sm overflow-x-auto border border-slate-700 mb-4">
            <pre className="text-green-400">{`<iframe 
  src="${typeof window !== "undefined" ? window.location.origin : ""}/locator/${
              company.slug
            }"
  width="100%" 
  height="600"
  frameborder="0"
  style="border: 0;">
</iframe>`}</pre>
          </div>
          <button
            onClick={() => {
              const code = `<iframe src="${
                typeof window !== "undefined" ? window.location.origin : ""
              }/locator/${
                company.slug
              }" width="100%" height="600" frameborder="0" style="border: 0;"></iframe>`;
              navigator.clipboard.writeText(code);
              alert("Embed code copied to clipboard!");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all text-sm"
          >
            📋 Copy Code
          </button>
          <p className="text-xs text-slate-600 mt-4">
            ✓ Make sure your domain is whitelisted in the company settings for
            the iframe to work properly.
          </p>
        </div>
      </div>
    </div>
  );
}
