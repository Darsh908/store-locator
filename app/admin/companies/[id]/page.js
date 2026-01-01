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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin")}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to Companies
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Slug:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              {company.slug}
            </code>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Stores ({stores.length})
            </h2>
            <div className="flex gap-2">
              <Link
                href={`/admin/companies/${params.id}/filters`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Configure Filters
              </Link>
              <button
                onClick={() => setShowImportForm(!showImportForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {showImportForm ? "Cancel" : "+ Import Stores"}
              </button>
            </div>
          </div>

          {showImportForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-800">
                Import Stores from File
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Required columns: <strong>name</strong>,{" "}
                <strong>address</strong>
                <br />
                Optional columns: phone, email, website, description
                <br />
                <span className="text-blue-600">
                  Optional coordinates: latitude/lat, longitude/lng/lon (if
                  provided, geocoding will be skipped)
                </span>
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading && (
                <p className="mt-2 text-sm text-gray-600">
                  Uploading and geocoding addresses...
                </p>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No stores yet. Import stores to get started.
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {store.name}
                        </div>
                        {store.phone && (
                          <div className="text-sm text-gray-500">
                            {store.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {store.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {store.latitude && store.longitude ? (
                          <>
                            {store.latitude.toFixed(4)},{" "}
                            {store.longitude.toFixed(4)}
                          </>
                        ) : (
                          <span className="text-orange-600">Not geocoded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {store.geocoded ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Geocoded
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Embed Code
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Use this iframe code to embed the store locator on your website:
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`<iframe 
  src="${typeof window !== "undefined" ? window.location.origin : ""}/locator/${
              company.slug
            }"
  width="100%" 
  height="600"
  frameborder="0"
  style="border: 0;">
</iframe>`}</pre>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Make sure your domain is whitelisted in the company settings for the
            iframe to work.
          </p>
        </div>
      </div>
    </div>
  );
}
