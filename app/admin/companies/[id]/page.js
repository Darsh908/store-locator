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
    const parseCoordinate = (value) => {
      if (!value) return null;
      const num = typeof value === "string" ? parseFloat(value.trim()) : value;
      return isNaN(num) ? null : num;
    };

    const standardFields = {
      name: row.name || row.Name || row.NAME || null,
      address:
        row.address ||
        row.Address ||
        row.ADDRESS ||
        `${row.street || ""} ${row.city || ""} ${row.state || ""} ${row.zip || ""}`.trim() ||
        null,
      latitude:
        parseCoordinate(
          row.latitude || row.Latitude || row.LATITUDE || row.lat || row.Lat || row.LAT
        ) || null,
      longitude:
        parseCoordinate(
          row.longitude || row.Longitude || row.LONGITUDE || row.lng || row.Lng || row.LNG || row.lon || row.Lon || row.LON
        ) || null,
      phone: row.phone || row.Phone || row.PHONE || null,
      email: row.email || row.Email || row.EMAIL || null,
      website: row.website || row.Website || row.WEBSITE || null,
      description: row.description || row.Description || row.DESCRIPTION || null,
    };

    const standardFieldKeys = [
      "name", "Name", "NAME", "address", "Address", "ADDRESS", "street", "city", "state", "zip",
      "latitude", "Latitude", "LATITUDE", "lat", "Lat", "LAT",
      "longitude", "Longitude", "LONGITUDE", "lng", "Lng", "LNG", "lon", "Lon", "LON",
      "phone", "Phone", "PHONE", "email", "Email", "EMAIL",
      "website", "Website", "WEBSITE", "description", "Description", "DESCRIPTION",
    ];

    const customData = {};
    Object.keys(row).forEach((key) => {
      if (row[key] !== null && row[key] !== undefined && row[key] !== "" && !standardFieldKeys.includes(key)) {
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
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
            processParsedData(parsedData);
          } catch (error) {
            console.error("Excel parsing error:", error);
            alert("Error parsing Excel file");
            setUploading(false);
          }
        };
        reader.onerror = () => {
          alert("Error reading Excel file");
          setUploading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert("Unsupported file format. Please upload CSV or Excel file.");
        setUploading(false);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
      setUploading(false);
    }
  };

  const processParsedData = async (parsedData) => {
    try {
      const parsedStores = parsedData
        .filter((row) => {
          const parsed = parseRowData(row);
          return parsed.name && parsed.address;
        })
        .map((row) => parseRowData(row));

      if (parsedStores.length === 0) {
        alert('No valid stores found. Ensure file has "name" and "address" columns.');
        setUploading(false);
        return;
      }

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
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="loader-ring mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading company details...</p>
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

  return (
    <div className="min-h-screen bg-mesh">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-violet w-80 h-80 -top-40 right-1/4 animate-float"></div>
        <div className="orb orb-cyan w-64 h-64 bottom-0 -left-32 animate-float-slow"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-slate-400 hover:text-white font-medium mb-6 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{company.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-sm">Slug:</span>
                <code className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs">
                  {company.slug}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stores Section */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Stores ({stores.length})
              </h2>
              <p className="text-slate-400 text-sm">Manage and import your store locations</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/admin/companies/${params.id}/filters`}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Configure Filters
              </Link>
              <button
                onClick={() => setShowImportForm(!showImportForm)}
                className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {showImportForm ? "Cancel" : "Import Stores"}
              </button>
            </div>
          </div>

          {showImportForm && (
            <div className="mb-8 p-6 glass rounded-xl border border-green-500/20 animate-slide-down">
              <h3 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import Stores from File
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-400 mb-5">
                <div className="flex items-center gap-2">
                  <span className="badge badge-primary">Formats</span>
                  <span>CSV, Excel (.xlsx, .xls)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-success">Required</span>
                  <code className="text-green-300">name</code>, <code className="text-green-300">address</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-cyan">Optional</span>
                  <span>phone, email, lat/lng</span>
                </div>
              </div>
              <label className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-green-500/30 rounded-xl cursor-pointer hover:bg-green-500/5 transition-colors group">
                <div className="text-center">
                  <svg className="w-10 h-10 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-semibold text-white">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-1">CSV or Excel files</p>
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
                <div className="mt-4 flex items-center gap-3 text-green-400">
                  <div className="loader-ring w-5 h-5 border-2 border-green-400/30 border-t-green-400"></div>
                  <span className="font-medium">Uploading and geocoding addresses...</span>
                </div>
              )}
            </div>
          )}

          {stores.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mx-auto mb-6 animate-float-slow">
                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Stores Yet</h3>
              <p className="text-slate-400 mb-6">Import stores to get started</p>
              {!showImportForm && (
                <button
                  onClick={() => setShowImportForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Stores
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-white">{store.name}</div>
                        {store.phone && (
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {store.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300 max-w-xs truncate">{store.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {store.latitude && store.longitude ? (
                          <code className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs">
                            {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                          </code>
                        ) : (
                          <span className="text-amber-400 text-sm font-medium">Not geocoded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {store.geocoded ? (
                          <span className="badge badge-success">✓ Geocoded</span>
                        ) : (
                          <span className="badge badge-warning">⏳ Pending</span>
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
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Embed Code
          </h2>
          <p className="text-slate-400 mb-6">Use this iframe code to embed the store locator on your website</p>
          <div className="bg-slate-900/80 rounded-xl p-6 font-mono text-sm overflow-x-auto border border-white/10 mb-4">
            <pre className="text-green-400">{`<iframe 
  src="${typeof window !== "undefined" ? window.location.origin : ""}/locator/${company.slug}"
  width="100%" 
  height="600"
  frameborder="0"
  style="border: 0;">
</iframe>`}</pre>
          </div>
          <button
            onClick={() => {
              const code = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/locator/${company.slug}" width="100%" height="600" frameborder="0" style="border: 0;"></iframe>`;
              navigator.clipboard.writeText(code);
              alert("Embed code copied to clipboard!");
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/30 font-medium transition-all text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy Code
          </button>
          <p className="text-xs text-slate-500 mt-4">
            ✓ Make sure your domain is whitelisted in the company settings
          </p>
        </div>
      </div>
    </div>
  );
}
