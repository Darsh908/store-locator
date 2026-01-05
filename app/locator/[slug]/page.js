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
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
    { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
    { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
    { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#023e58" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
    { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
    { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
  ],
};

export default function StoreLocatorPage() {
  const params = useParams();
  const [stores, setStores] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [company, setCompany] = useState(null);
  const [filters, setFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({});
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

  useEffect(() => {
    const handleScriptError = (event) => {
      if (
        event.message?.includes("Google Maps") ||
        event.message?.includes("ApiTargetBlockedMapError") ||
        event.filename?.includes("maps.googleapis.com")
      ) {
        setMapError("Google Maps API error detected.");
      }
    };

    window.gm_authFailure = () => {
      setMapError("Google Maps API authentication failed.");
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

      const initialFilterValues = {};
      (data.filters || []).forEach((filter) => {
        if (filter.filterType === "multiselect") {
          initialFilterValues[filter.fieldName] = [];
        } else {
          initialFilterValues[filter.fieldName] = "";
        }
      });
      setFilterValues(initialFilterValues);

      if (data.stores && data.stores.length > 0) {
        const firstStore = data.stores[0];
        if (firstStore.latitude && firstStore.longitude) {
          setMapCenter({ lat: firstStore.latitude, lng: firstStore.longitude });
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
    setMapError(null);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapError = useCallback(() => {
    setMapError("Google Maps failed to load.");
  }, []);

  const handleMarkerClick = (store) => {
    setSelectedStore(store);
    if (map && store.latitude && store.longitude) {
      map.panTo({ lat: store.latitude, lng: store.longitude });
      map.setZoom(15);
    }
  };

  const handleStoreClick = (store) => {
    setSelectedStore(store);
    if (map && store.latitude && store.longitude) {
      map.panTo({ lat: store.latitude, lng: store.longitude });
      map.setZoom(15);
    }
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

  useEffect(() => {
    let filtered = [...allStores];

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

    filters.forEach((filter) => {
      if (!filter.isActive) return;
      const filterValue = filterValues[filter.fieldName];
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return;

      filtered = filtered.filter((store) => {
        let fieldValue = store[filter.fieldName] || (store.customData && typeof store.customData === "object" && store.customData[filter.fieldName]);
        if (fieldValue === null || fieldValue === undefined) return false;
        const valueStr = String(fieldValue).toLowerCase();

        switch (filter.filterType) {
          case "select": return valueStr === String(filterValue).toLowerCase();
          case "multiselect": return Array.isArray(filterValue) && filterValue.includes(fieldValue);
          case "text": return valueStr.includes(String(filterValue).toLowerCase());
          case "checkbox": return filterValue === true || filterValue === "true";
          default: return true;
        }
      });
    });

    setStores(filtered);
  }, [allStores, searchQuery, filterValues, filters]);

  const validStores = stores.filter((store) => store.latitude && store.longitude);

  const getFilterOptions = (filter) => {
    const values = new Set();
    allStores.forEach((store) => {
      const fieldValue = store[filter.fieldName] || (store.customData && typeof store.customData === "object" && store.customData[filter.fieldName]);
      if (fieldValue !== null && fieldValue !== undefined) {
        values.add(String(fieldValue));
      }
    });
    return Array.from(values).sort();
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-mesh">
        <div className="text-center">
          <div className="loader-ring mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading store locator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-mesh p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Unable to Load</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-mesh p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Configuration Error</h1>
          <p className="text-slate-400">Google Maps API key not configured</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-mesh p-4">
        <div className="text-center max-w-2xl">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Maps Error</h1>
          <p className="text-slate-400 mb-6">{mapError}</p>
          <div className="glass-card rounded-xl p-6 text-left">
            <p className="font-semibold text-white mb-3">Common causes:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400 mb-4">
              <li>API key has HTTP referrer restrictions</li>
              <li>Maps JavaScript API is not enabled</li>
              <li>Billing is not enabled on your Google Cloud project</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="glass-dark border-b border-white/5 z-30 relative">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{company?.name || "Store Locator"}</h1>
                {stores.length > 0 && (
                  <p className="text-sm text-slate-400">
                    <span className="text-indigo-400 font-semibold">{stores.length}</span> {stores.length === 1 ? "location" : "locations"} found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden absolute top-4 left-4 z-20 glass-dark p-3 rounded-xl hover:bg-white/10 transition-all"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Backdrop (Mobile) */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-10 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 absolute md:relative w-full md:w-96 glass-dark border-r border-white/5 flex flex-col z-20 md:z-auto transition-transform duration-300 ease-in-out h-full`}
        >
          {/* Search Bar */}
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="font-bold text-white">Locations</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-10!"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <p className="text-xs text-slate-500 mt-3">
                <span className="text-indigo-400 font-bold">{validStores.length}</span> {validStores.length === 1 ? "result" : "results"} found
              </p>
            )}
          </div>

          {/* Filters */}
          {filters.length > 0 && (
            <div className="p-5 border-b border-white/5 max-h-64 overflow-y-auto">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters
              </h3>
              <div className="space-y-4">
                {filters.map((filter) => {
                  const options = getFilterOptions(filter);
                  return (
                    <div key={filter.id}>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">{filter.displayName}</label>
                      {filter.filterType === "select" && (
                        <select
                          value={filterValues[filter.fieldName] || ""}
                          onChange={(e) => setFilterValues({ ...filterValues, [filter.fieldName]: e.target.value })}
                          className="input-modern text-sm py-2"
                        >
                          <option value="">All</option>
                          {options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      {filter.filterType === "multiselect" && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {options.map((option) => (
                            <label key={option} className="flex items-center text-sm cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={filterValues[filter.fieldName]?.includes(option) || false}
                                onChange={(e) => {
                                  const current = filterValues[filter.fieldName] || [];
                                  const newValue = e.target.checked ? [...current, option] : current.filter((v) => v !== option);
                                  setFilterValues({ ...filterValues, [filter.fieldName]: newValue });
                                }}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                              />
                              <span className="ml-2 text-slate-300">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {filter.filterType === "text" && (
                        <input
                          type="text"
                          value={filterValues[filter.fieldName] || ""}
                          onChange={(e) => setFilterValues({ ...filterValues, [filter.fieldName]: e.target.value })}
                          placeholder={`Filter by ${filter.displayName}`}
                          className="input-modern text-sm py-2"
                        />
                      )}
                      {filter.filterType === "checkbox" && (
                        <label className="flex items-center text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterValues[filter.fieldName] || false}
                            onChange={(e) => setFilterValues({ ...filterValues, [filter.fieldName]: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-slate-300">Yes</span>
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
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <p className="font-medium text-slate-400">{searchQuery ? "No locations found" : "No locations available"}</p>
                {searchQuery && <p className="text-sm mt-1">Try adjusting your search</p>}
              </div>
            ) : (
              <div>
                {validStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreClick(store)}
                    className={`w-full text-left p-5 hover:bg-white/5 transition-all duration-200 border-l-4 ${
                      selectedStore?.id === store.id
                        ? "bg-indigo-500/10 border-l-indigo-500"
                        : "border-l-transparent"
                    }`}
                  >
                    <h3 className="font-semibold text-white mb-1">{store.name}</h3>
                    {store.address && (
                      <p className="text-sm text-slate-400 mb-2 line-clamp-1">{store.address}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {store.phone && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-slate-400">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {store.phone}
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
          <LoadScript googleMapsApiKey={apiKey} onError={handleMapError} onLoad={() => setMapError(null)}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={stores.length === 1 ? 15 : 10}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              options={mapOptions}
            >
              {validStores.map((store) => (
                <Marker
                  key={store.id}
                  position={{ lat: store.latitude, lng: store.longitude }}
                  onClick={() => handleMarkerClick(store)}
                  title={store.name}
                />
              ))}

              {selectedStore && (
                <InfoWindow
                  position={{ lat: selectedStore.latitude, lng: selectedStore.longitude }}
                  onCloseClick={() => setSelectedStore(null)}
                >
                  <div className="p-4 max-w-xs">
                    <h3 className="font-bold text-lg text-slate-900 mb-3">{selectedStore.name}</h3>
                    {selectedStore.address && (
                      <p className="text-sm text-slate-600 mb-3 flex items-start gap-2">
                        <span className="mt-0.5">📍</span>
                        {selectedStore.address}
                      </p>
                    )}
                    {selectedStore.phone && (
                      <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <span>📞</span>
                        <a href={`tel:${selectedStore.phone}`} className="text-indigo-600 hover:underline">{selectedStore.phone}</a>
                      </p>
                    )}
                    {selectedStore.email && (
                      <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <span>✉️</span>
                        <a href={`mailto:${selectedStore.email}`} className="text-indigo-600 hover:underline">{selectedStore.email}</a>
                      </p>
                    )}
                    {selectedStore.website && (
                      <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                        <span>🌐</span>
                        <a href={selectedStore.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Visit Website</a>
                      </p>
                    )}
                    {selectedStore.description && (
                      <p className="text-sm text-slate-600 mb-4 border-t border-slate-200 pt-3">{selectedStore.description}</p>
                    )}
                    <button
                      onClick={() => handleGetDirections(selectedStore)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
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
