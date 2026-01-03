"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#616161" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#e9e9e9" }],
    },
  ],
};

export default function StoreLocatorPage() {
  const params = useParams();
  const [stores, setStores] = useState([]);
  const [allStores, setAllStores] = useState([]); // All stores before filtering
  const [company, setCompany] = useState(null);
  const [filters, setFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({}); // Current filter values
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (params.slug) {
      fetchStoreLocator();
    }
  }, [params.slug]);

  // Listen for Google Maps API errors
  useEffect(() => {
    const handleScriptError = (event) => {
      // Check if it's a Google Maps related error
      if (
        event.message?.includes("Google Maps") ||
        event.message?.includes("ApiTargetBlockedMapError") ||
        event.filename?.includes("maps.googleapis.com")
      ) {
        setMapError(
          "Google Maps API error detected. Please check your API key configuration."
        );
      }
    };

    // Google Maps authentication failure callback
    window.gm_authFailure = () => {
      setMapError(
        "Google Maps API authentication failed. Please check your API key configuration."
      );
    };

    window.addEventListener("error", handleScriptError);
    return () => {
      window.removeEventListener("error", handleScriptError);
      delete window.gm_authFailure;
    };
  }, []);

  const fetchStoreLocator = async () => {
    try {
      const res = await fetch(`/api/locator/${params.slug}`);
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to load store locator");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCompany(data.company);
      setAllStores(data.stores || []);
      setFilters(data.filters || []);
      setStores(data.stores || []);

      // Initialize filter values
      const initialFilterValues = {};
      (data.filters || []).forEach((filter) => {
        if (filter.filterType === "multiselect") {
          initialFilterValues[filter.fieldName] = [];
        } else {
          initialFilterValues[filter.fieldName] = "";
        }
      });
      setFilterValues(initialFilterValues);

      // Set map center to first store or default
      if (data.stores && data.stores.length > 0) {
        const firstStore = data.stores[0];
        if (firstStore.latitude && firstStore.longitude) {
          setMapCenter({
            lat: firstStore.latitude,
            lng: firstStore.longitude,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching store locator:", error);
      setError("Failed to load store locator");
    } finally {
      setLoading(false);
    }
  };

  const onMapLoad = useCallback((map) => {
    setMap(map);
    setMapError(null); // Clear any previous errors
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapError = useCallback(() => {
    setMapError(
      "Google Maps failed to load. Please check your API key configuration."
    );
  }, []);

  const handleMarkerClick = (store) => {
    setSelectedStore(store);
    // Center map on selected store
    if (map && store.latitude && store.longitude) {
      map.panTo({
        lat: store.latitude,
        lng: store.longitude,
      });
      map.setZoom(15);
    }
  };

  const handleStoreClick = (store) => {
    setSelectedStore(store);
    // Center map on selected store
    if (map && store.latitude && store.longitude) {
      map.panTo({
        lat: store.latitude,
        lng: store.longitude,
      });
      map.setZoom(15);
    }
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleGetDirections = (store) => {
    if (store.latitude && store.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
      window.open(url, "_blank");
    }
  };

  // Apply filters to stores
  useEffect(() => {
    let filtered = [...allStores];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (store) =>
          store.name?.toLowerCase().includes(query) ||
          store.address?.toLowerCase().includes(query) ||
          store.phone?.toLowerCase().includes(query) ||
          store.description?.toLowerCase().includes(query)
      );
    }

    // Apply dynamic filters
    filters.forEach((filter) => {
      if (!filter.isActive) return;

      const filterValue = filterValues[filter.fieldName];
      if (
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0)
      ) {
        return; // Skip empty filters
      }

      filtered = filtered.filter((store) => {
        // Get field value (from standard field or customData)
        let fieldValue =
          store[filter.fieldName] ||
          (store.customData &&
            typeof store.customData === "object" &&
            store.customData[filter.fieldName]);

        if (fieldValue === null || fieldValue === undefined) {
          return false;
        }

        // Convert to string for comparison
        const valueStr = String(fieldValue).toLowerCase();

        switch (filter.filterType) {
          case "select":
            return valueStr === String(filterValue).toLowerCase();
          case "multiselect":
            return (
              Array.isArray(filterValue) && filterValue.includes(fieldValue)
            );
          case "text":
            return valueStr.includes(String(filterValue).toLowerCase());
          case "checkbox":
            return filterValue === true || filterValue === "true";
          default:
            return true;
        }
      });
    });

    setStores(filtered);
  }, [allStores, searchQuery, filterValues, filters]);

  // Get stores with valid coordinates for display
  const validStores = stores.filter(
    (store) => store.latitude && store.longitude
  );

  // Get unique values for filter options
  const getFilterOptions = (filter) => {
    const values = new Set();
    allStores.forEach((store) => {
      const fieldValue =
        store[filter.fieldName] ||
        (store.customData &&
          typeof store.customData === "object" &&
          store.customData[filter.fieldName]);
      if (fieldValue !== null && fieldValue !== undefined) {
        values.add(String(fieldValue));
      }
    });
    return Array.from(values).sort();
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading store locator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Unable to Load
          </h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Configuration Error
          </h1>
          <p className="text-slate-600">Google Maps API key not configured</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="text-center max-w-2xl">
          <div className="text-5xl mb-4">🗺️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Maps Error</h1>
          <p className="text-slate-600 mb-6">{mapError}</p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-left">
            <p className="font-semibold text-slate-900 mb-3">Common causes:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 mb-4">
              <li>
                API key has HTTP referrer restrictions that don't match this
                domain
              </li>
              <li>Maps JavaScript API is not enabled for this API key</li>
              <li>API key has IP address restrictions</li>
              <li>Billing is not enabled on your Google Cloud project</li>
            </ul>
            <p className="font-semibold text-slate-900 mb-3">How to fix:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Console → Credentials
                </a>
              </li>
              <li>Click on your API key</li>
              <li>Under "Application restrictions", add your domain</li>
              <li>Under "API restrictions", enable "Maps JavaScript API"</li>
              <li>Save and wait a few minutes</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200/50 shadow-sm backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                📍
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {company?.name || "Store Locator"}
              </h1>
            </div>
          </div>
          {stores.length > 0 && (
            <p className="text-sm text-slate-500 ml-11">
              <span className="font-semibold text-slate-600">
                {stores.length}
              </span>{" "}
              {stores.length === 1 ? "location" : "locations"} found
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden absolute top-4 left-4 z-20 bg-white p-3 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-all"
          aria-label="Toggle sidebar"
        >
          <svg
            className="h-5 w-5 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Backdrop (Mobile) */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-10 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 absolute md:relative w-full md:w-96 bg-white border-r border-neutral-200/50 flex flex-col z-20 md:z-auto transition-transform duration-300 ease-in-out h-full shadow-lg md:shadow-none`}
        >
          {/* Search Bar */}
          <div className="p-5 border-b border-neutral-200/50 bg-gradient-to-b from-blue-50/50 to-transparent">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="font-bold text-slate-900">Locations</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <svg
                  className="h-5 w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-slate-900 placeholder-slate-500"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <p className="text-xs text-slate-600 mt-3 font-medium">
                <span className="text-blue-600 font-bold">
                  {validStores.length}
                </span>{" "}
                {validStores.length === 1 ? "result" : "results"} found
              </p>
            )}
          </div>

          {/* Filters */}
          {filters.length > 0 && (
            <div className="p-5 border-b border-neutral-200/50 bg-gradient-to-b from-slate-50/50 to-transparent max-h-64 overflow-y-auto">
              <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <span>⚙️</span> Filters
              </h3>
              <div className="space-y-4">
                {filters.map((filter) => {
                  const options = getFilterOptions(filter);
                  return (
                    <div key={filter.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        {filter.displayName}
                      </label>
                      {filter.filterType === "select" && (
                        <select
                          value={filterValues[filter.fieldName] || ""}
                          onChange={(e) =>
                            setFilterValues({
                              ...filterValues,
                              [filter.fieldName]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all"
                        >
                          <option value="">All</option>
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      {filter.filterType === "multiselect" && (
                        <div className="space-y-2 max-h-32 overflow-y-auto text-slate-700">
                          {options.map((option) => (
                            <label
                              key={option}
                              className="flex items-center text-sm cursor-pointer hover:bg-blue-50/50 p-2 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  filterValues[filter.fieldName]?.includes(
                                    option
                                  ) || false
                                }
                                onChange={(e) => {
                                  const current =
                                    filterValues[filter.fieldName] || [];
                                  const newValue = e.target.checked
                                    ? [...current, option]
                                    : current.filter((v) => v !== option);
                                  setFilterValues({
                                    ...filterValues,
                                    [filter.fieldName]: newValue,
                                  });
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-slate-700">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      {filter.filterType === "text" && (
                        <input
                          type="text"
                          value={filterValues[filter.fieldName] || ""}
                          onChange={(e) =>
                            setFilterValues({
                              ...filterValues,
                              [filter.fieldName]: e.target.value,
                            })
                          }
                          placeholder={`Filter by ${filter.displayName}`}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all"
                        />
                      )}
                      {filter.filterType === "checkbox" && (
                        <label className="flex items-center text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterValues[filter.fieldName] || false}
                            onChange={(e) =>
                              setFilterValues({
                                ...filterValues,
                                [filter.fieldName]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-slate-700">Yes</span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Store List */}
          <div className="flex-1 overflow-y-auto">
            {validStores.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <div className="text-4xl mb-3">📍</div>
                <p className="font-medium">
                  {searchQuery
                    ? "No locations found"
                    : "No locations available"}
                </p>
                {searchQuery && (
                  <p className="text-sm mt-1">Try adjusting your search</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-neutral-200/50">
                {validStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreClick(store)}
                    className={`w-full text-left p-4 hover:bg-blue-50/50 transition-all duration-200 border-l-4 ${
                      selectedStore?.id === store.id
                        ? "bg-blue-50/80 border-l-blue-600"
                        : "border-l-transparent"
                    }`}
                  >
                    <h3 className="font-semibold text-slate-900 mb-1.5">
                      {store.name}
                    </h3>
                    {store.address && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-1">
                        {store.address}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {store.phone && (
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {store.phone}
                        </span>
                      )}
                      {store.distance && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {store.distance}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <LoadScript
            googleMapsApiKey={apiKey}
            onError={handleMapError}
            onLoad={() => setMapError(null)}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={stores.length === 1 ? 15 : 10}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              options={mapOptions}
            >
              {validStores.map((store) => {
                return (
                  <Marker
                    key={store.id}
                    position={{
                      lat: store.latitude,
                      lng: store.longitude,
                    }}
                    onClick={() => handleMarkerClick(store)}
                    title={store.name}
                  />
                );
              })}

              {selectedStore && (
                <InfoWindow
                  position={{
                    lat: selectedStore.latitude,
                    lng: selectedStore.longitude,
                  }}
                  onCloseClick={() => setSelectedStore(null)}
                >
                  <div className="p-4 max-w-xs rounded-lg">
                    <h3 className="font-bold text-lg text-slate-900 mb-3">
                      {selectedStore.name}
                    </h3>
                    {selectedStore.address && (
                      <p className="text-sm text-slate-600 mb-3 flex items-start gap-2">
                        <span className="mt-0.5">📍</span>
                        {selectedStore.address}
                      </p>
                    )}
                    {selectedStore.phone && (
                      <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <span>📞</span>
                        <a
                          href={`tel:${selectedStore.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedStore.phone}
                        </a>
                      </p>
                    )}
                    {selectedStore.email && (
                      <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <span>✉️</span>
                        <a
                          href={`mailto:${selectedStore.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedStore.email}
                        </a>
                      </p>
                    )}
                    {selectedStore.website && (
                      <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                        <span>🌐</span>
                        <a
                          href={selectedStore.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          Visit
                        </a>
                      </p>
                    )}
                    {selectedStore.description && (
                      <p className="text-sm text-slate-600 mb-4 border-t border-neutral-200 pt-3">
                        {selectedStore.description}
                      </p>
                    )}
                    <button
                      onClick={() => handleGetDirections(selectedStore)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
                    >
                      Get Directions
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </div>
  );
}
