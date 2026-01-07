"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const libraries = ["places"];

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
    {
      featureType: "administrative.country",
      elementType: "geometry.stroke",
      stylers: [{ color: "#4b6878" }],
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels.text.fill",
      stylers: [{ color: "#64779e" }],
    },
    {
      featureType: "administrative.province",
      elementType: "geometry.stroke",
      stylers: [{ color: "#4b6878" }],
    },
    {
      featureType: "landscape.man_made",
      elementType: "geometry.stroke",
      stylers: [{ color: "#334e87" }],
    },
    {
      featureType: "landscape.natural",
      elementType: "geometry",
      stylers: [{ color: "#023e58" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#283d6a" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6f9ba5" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#1d2c4d" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry.fill",
      stylers: [{ color: "#023e58" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#3C7680" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#304a7d" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#98a5be" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#1d2c4d" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#2c6675" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#255763" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#b0d5ce" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#023e58" }],
    },
    {
      featureType: "transit",
      elementType: "labels.text.fill",
      stylers: [{ color: "#98a5be" }],
    },
    {
      featureType: "transit",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#1d2c4d" }],
    },
    {
      featureType: "transit.line",
      elementType: "geometry.fill",
      stylers: [{ color: "#283d6a" }],
    },
    {
      featureType: "transit.station",
      elementType: "geometry",
      stylers: [{ color: "#3a4762" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0e1626" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4e6d70" }],
    },
  ],
};

// Filter Dropdown Component with smart positioning
function FilterDropdown({
  filter,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  isLast,
}) {
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState("left");

  const hasValue =
    value &&
    (Array.isArray(value) ? value.length > 0 : value !== "" && value !== false);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = 280;

      // If dropdown would overflow right side, align to right
      if (rect.left + dropdownWidth > windowWidth - 20) {
        setPosition("right");
      } else {
        setPosition("left");
      }
    }
  }, [isOpen]);

  const clearFilter = () => {
    if (filter.filterType === "multiselect") {
      onChange([]);
    } else if (filter.filterType === "checkbox") {
      onChange(false);
    } else {
      onChange("");
    }
  };

  // Get display value for trigger button
  const getDisplayValue = () => {
    if (!hasValue) return null;
    if (filter.filterType === "multiselect" && Array.isArray(value)) {
      return value.length;
    }
    if (filter.filterType === "checkbox") {
      return value ? "Yes" : null;
    }
    if (filter.filterType === "select") {
      return value;
    }
    return "Active";
  };

  const displayValue = getDisplayValue();

  return (
    <div className="relative filter-dropdown" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
          hasValue
            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
            : "bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600"
        }`}
      >
        {/* Filter type icon */}
        {filter.filterType === "select" && (
          <svg
            className="w-4 h-4 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        )}
        {filter.filterType === "multiselect" && (
          <svg
            className="w-4 h-4 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        )}
        {filter.filterType === "text" && (
          <svg
            className="w-4 h-4 opacity-60"
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
        )}
        {filter.filterType === "checkbox" && (
          <svg
            className="w-4 h-4 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}

        <span>{filter.displayName}</span>

        {displayValue && (
          <span
            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
              filter.filterType === "multiselect"
                ? "bg-indigo-500 text-white"
                : "bg-indigo-500/30 text-indigo-200"
            }`}
          >
            {displayValue}
          </span>
        )}

        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel - Solid background for visibility */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 animate-fade-in ${
            position === "right" ? "right-0" : "left-0"
          }`}
          style={{ minWidth: filter.filterType === "text" ? "300px" : "260px" }}
        >
          {/* Solid dark panel with subtle gradient */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-850 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {filter.displayName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    filter.filterType === "select"
                      ? "bg-blue-500/20 text-blue-400"
                      : filter.filterType === "multiselect"
                      ? "bg-purple-500/20 text-purple-400"
                      : filter.filterType === "text"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {filter.filterType === "select"
                    ? "Single"
                    : filter.filterType === "multiselect"
                    ? "Multi"
                    : filter.filterType === "text"
                    ? "Search"
                    : "Toggle"}
                </span>
              </div>
              {hasValue && (
                <button
                  onClick={clearFilter}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
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
                  Clear
                </button>
              )}
            </div>

            {/* Content - Different for each filter type */}
            <div className="p-3">
              {/* SELECT - Radio-style list */}
              {filter.filterType === "select" && (
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => {
                      onChange("");
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 ${
                      !value
                        ? "bg-indigo-500/20 text-white border border-indigo-500/30"
                        : "text-slate-300 hover:bg-slate-700/50"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        !value
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-slate-500"
                      }`}
                    >
                      {!value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      )}
                    </span>
                    All Options
                  </button>
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onChange(option);
                        onClose();
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 ${
                        value === option
                          ? "bg-indigo-500/20 text-white border border-indigo-500/30"
                          : "text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          value === option
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-slate-500"
                        }`}
                      >
                        {value === option && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        )}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* MULTISELECT - Checkbox grid/list with count */}
              {filter.filterType === "multiselect" && (
                <div>
                  {Array.isArray(value) && value.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {value.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs border border-indigo-500/30"
                        >
                          {v}
                          <button
                            onClick={() =>
                              onChange(value.filter((x) => x !== v))
                            }
                            className="hover:text-white"
                          >
                            <svg
                              className="w-3 h-3"
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
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                    {options.map((option) => {
                      const isChecked = value?.includes(option);
                      return (
                        <div
                          key={option}
                          onClick={() => {
                            const current = value || [];
                            const newValue = isChecked
                              ? current.filter((v) => v !== option)
                              : [...current, option];
                            onChange(newValue);
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${
                            isChecked
                              ? "bg-purple-500/15"
                              : "hover:bg-slate-700/50"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? "bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-500"
                                : "border-slate-500 bg-slate-700/50"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </span>
                          <span
                            className={
                              isChecked
                                ? "text-white font-medium"
                                : "text-slate-300"
                            }
                          >
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TEXT - Search input with icon */}
              {filter.filterType === "text" && (
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={value || ""}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={`Search by ${filter.displayName.toLowerCase()}...`}
                      autoFocus
                      className="w-full px-4 py-3 pl-11 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
                  {value && (
                    <p className="mt-2 text-xs text-slate-400">
                      Press Enter or click outside to apply
                    </p>
                  )}
                </div>
              )}

              {/* CHECKBOX - Toggle switch */}
              {filter.filterType === "checkbox" && (
                <div className="py-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-300">
                      Show only {filter.displayName.toLowerCase()}
                    </span>
                    <button
                      onClick={() => onChange(!value)}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                        value
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                          value ? "left-7" : "left-1"
                        }`}
                      ></span>
                    </button>
                  </label>
                  <p className="mt-3 text-xs text-slate-500">
                    {value
                      ? "Filter is active"
                      : "Toggle to enable this filter"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Geospatial states
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [radius, setRadius] = useState(50);
  const [address, setAddress] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  useEffect(() => {
    if (params.slug) {
      fetchStoreLocator();
    }
  }, [params.slug, latitude, longitude, radius]);

  // Handle Autocomplete initialization
  useEffect(() => {
    const initAutocomplete = () => {
      if (
        typeof window !== "undefined" &&
        window.google?.maps?.places &&
        !autocompleteService.current
      ) {
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
      }
    };

    initAutocomplete();

    // Also try to initialize when loading changes, just in case
    const timer = setTimeout(initAutocomplete, 1000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleAddressChange = (val) => {
    setAddress(val);
    if (!val) {
      setPredictions([]);
      setLatitude(null);
      setLongitude(null);
      return;
    }

    if (autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        { input: val },
        (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPredictions(results);
            setShowPredictions(true);
          }
        }
      );
    }
  };

  const selectPrediction = (prediction) => {
    setAddress(prediction.description);
    setPredictions([]);
    setShowPredictions(false);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        const newLat = lat();
        const newLng = lng();
        setLatitude(newLat);
        setLongitude(newLng);
        setMapCenter({ lat: newLat, lng: newLng });

        if (map) {
          map.panTo({ lat: newLat, lng: newLng });
          map.setZoom(12);
        }
      }
    });
  };

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".filter-dropdown")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchStoreLocator = async () => {
    try {
      let url = `/api/locator/${params.slug}`;
      if (latitude && longitude) {
        url += `?lat=${latitude}&lng=${longitude}&radius=${radius}`;
      }

      const res = await fetch(url);
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
        } else if (filter.filterType === "checkbox") {
          initialFilterValues[filter.fieldName] = false;
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

    // Text search filter removed because we now use geospatial search in the main bar

    filters.forEach((filter) => {
      if (!filter.isActive) return;
      const filterValue = filterValues[filter.fieldName];
      if (filterValue === undefined || filterValue === null) return;
      if (filterValue === "" || filterValue === false) return;
      if (Array.isArray(filterValue) && filterValue.length === 0) return;

      filtered = filtered.filter((store) => {
        let fieldValue =
          store[filter.fieldName] ||
          (store.customData &&
            typeof store.customData === "object" &&
            store.customData[filter.fieldName]);
        if (fieldValue === null || fieldValue === undefined) return false;
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
            return filterValue === true;
          default:
            return true;
        }
      });
    });

    setStores(filtered);
  }, [allStores, searchQuery, filterValues, filters]);

  const validStores = stores.filter(
    (store) => store.latitude && store.longitude
  );

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

  const getActiveFilterCount = () => {
    let count = 0;
    Object.keys(filterValues).forEach((key) => {
      const value = filterValues[key];
      if (
        value &&
        (Array.isArray(value)
          ? value.length > 0
          : value !== "" && value !== false)
      ) {
        count++;
      }
    });
    return count;
  };

  const clearAllFilters = () => {
    const clearedValues = {};
    filters.forEach((filter) => {
      if (filter.filterType === "multiselect") {
        clearedValues[filter.fieldName] = [];
      } else if (filter.filterType === "checkbox") {
        clearedValues[filter.fieldName] = false;
      } else {
        clearedValues[filter.fieldName] = "";
      }
    });
    setFilterValues(clearedValues);
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
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
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
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Configuration Error
          </h1>
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
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
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

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="w-full h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 z-30 relative">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">
                  {company?.name || "Store Locator"}
                </h1>
                <p className="text-sm text-slate-400 hidden sm:block">
                  <span className="text-indigo-400 font-semibold">
                    {stores.length}
                  </span>{" "}
                  {stores.length === 1 ? "location" : "locations"}
                </p>
              </div>
            </div>

            {/* Desktop Filter Dropdowns */}
            {filters.length > 0 && (
              <div className="hidden md:flex items-center gap-2 flex-wrap">
                {filters.map((filter, index) => {
                  const options = getFilterOptions(filter);
                  const isLast = index >= filters.length - 2; // Last two filters align right

                  return (
                    <FilterDropdown
                      key={filter.id}
                      filter={filter}
                      options={options}
                      value={filterValues[filter.fieldName]}
                      onChange={(newValue) =>
                        setFilterValues({
                          ...filterValues,
                          [filter.fieldName]: newValue,
                        })
                      }
                      isOpen={openDropdown === filter.id}
                      onToggle={() =>
                        setOpenDropdown(
                          openDropdown === filter.id ? null : filter.id
                        )
                      }
                      onClose={() => setOpenDropdown(null)}
                      isLast={isLast}
                    />
                  );
                })}

                {/* Radius Filter - Only show when location is selected */}
                {latitude && longitude && (
                  <div className="relative filter-dropdown">
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === "radius" ? null : "radius"
                        )
                      }
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                        latitude && longitude
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                          : "bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>{radius} km Radius</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          openDropdown === "radius" ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {openDropdown === "radius" && (
                      <div className="absolute top-full left-0 mt-2 z-50 animate-fade-in w-64">
                        <div className="bg-gradient-to-b from-slate-800 to-slate-850 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                            <span className="text-sm font-semibold text-white">
                              Search Radius
                            </span>
                          </div>
                          <div className="p-4">
                            <input
                              type="range"
                              min="5"
                              max="500"
                              step="5"
                              value={radius}
                              onChange={(e) =>
                                setRadius(parseInt(e.target.value))
                              }
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between mt-2 text-xs text-slate-400">
                              <span>5 km</span>
                              <span className="text-indigo-400 font-bold">
                                {radius} km
                              </span>
                              <span>500 km</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Clear All Filters */}
                {(activeFilterCount > 0 || latitude) && (
                  <button
                    onClick={() => {
                      clearAllFilters();
                      setLatitude(null);
                      setLongitude(null);
                      setAddress("");
                    }}
                    className="ml-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 hover:bg-slate-800 rounded-lg"
                  >
                    <svg
                      className="w-4 h-4"
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
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden absolute top-4 left-4 z-20 bg-slate-800 border border-slate-700 p-3 rounded-xl hover:bg-slate-700 transition-all shadow-lg"
          aria-label="Toggle sidebar"
        >
          <svg
            className="h-5 w-5 text-white"
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
            className="md:hidden fixed inset-0 bg-black/60 z-10 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 absolute md:relative w-full md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col z-20 md:z-auto transition-transform duration-300 ease-in-out h-full`}
        >
          {/* Search Bar */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="font-bold text-white">Locations</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <svg
                  className="h-5 w-5 text-slate-400"
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
                placeholder="Search for a location..."
                value={address}
                onChange={(e) => {
                  handleAddressChange(e.target.value);
                }}
                onFocus={() => address && setShowPredictions(true)}
                className="w-full px-4 py-3 pl-11 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500"
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
              {address && (
                <button
                  onClick={() => {
                    setAddress("");
                    setLatitude(null);
                    setLongitude(null);
                    setPredictions([]);
                    setShowPredictions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <svg
                    className="w-4 h-4"
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
              )}

              {/* Autocomplete Predictions */}
              {showPredictions && predictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  {predictions.map((p) => (
                    <button
                      key={p.place_id}
                      onClick={() => selectPrediction(p)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors flex items-start gap-3 border-b border-slate-700/50 last:border-0"
                    >
                      <svg
                        className="w-5 h-5 text-slate-500 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {p.structured_formatting.main_text}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.structured_formatting.secondary_text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {address && (
              <p className="text-xs text-slate-500 mt-3">
                Searching near{" "}
                <span className="text-indigo-400 font-bold">{address}</span>
              </p>
            )}
          </div>

          {/* Mobile Filters (shown only on mobile) */}
          {filters.length > 0 && (
            <div className="p-5 border-b border-slate-800 max-h-64 overflow-y-auto md:hidden">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Filters
              </h3>
              <div className="space-y-4">
                {/* Search Radius (Mobile) - Only show when location is selected */}
                {latitude && longitude && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Search Radius
                    </label>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                      <input
                        type="range"
                        min="5"
                        max="500"
                        step="5"
                        value={radius}
                        onChange={(e) => setRadius(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>5 km</span>
                        <span className="text-indigo-400 font-bold">
                          {radius} km
                        </span>
                        <span>500 km</span>
                      </div>
                    </div>
                  </div>
                )}

                {filters.map((filter) => {
                  const options = getFilterOptions(filter);
                  return (
                    <div key={filter.id}>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">
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
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
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
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {options.map((option) => (
                            <label
                              key={option}
                              className="flex items-center text-sm cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors"
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
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                              />
                              <span className="ml-2 text-slate-300">
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
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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
                  <svg
                    className="w-8 h-8 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                </div>
                <p className="font-medium text-slate-400">
                  {searchQuery
                    ? "No locations found"
                    : "No locations available"}
                </p>
                {searchQuery && (
                  <p className="text-sm mt-1">Try adjusting your search</p>
                )}
              </div>
            ) : (
              <div>
                {validStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreClick(store)}
                    className={`w-full text-left p-5 hover:bg-slate-800/50 transition-all duration-200 border-l-4 ${
                      selectedStore?.id === store.id
                        ? "bg-indigo-500/10 border-l-indigo-500"
                        : "border-l-transparent"
                    }`}
                  >
                    <h3 className="font-semibold text-white mb-1">
                      {store.name}
                    </h3>
                    {store.address && (
                      <p className="text-sm text-slate-400 mb-2 line-clamp-1">
                        {store.address}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {store.distance !== undefined &&
                        store.distance !== null && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
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
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            {parseFloat(store.distance).toFixed(1)} km
                          </span>
                        )}
                      {store.phone && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-slate-400">
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
            libraries={libraries}
            onError={handleMapError}
            onLoad={() => {
              setMapError(null);
              if (window.google?.maps?.places && !autocompleteService.current) {
                autocompleteService.current =
                  new window.google.maps.places.AutocompleteService();
              }
            }}
          >
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

              {/* Search Location Marker and Radius Circle */}
              {latitude && longitude && (
                <>
                  <Marker
                    position={{ lat: latitude, lng: longitude }}
                    icon={{
                      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                      fillColor: "#6366f1",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 2,
                      anchor: new window.google.maps.Point(12, 22),
                    }}
                    zIndex={999}
                  />
                </>
              )}

              {selectedStore && (
                <InfoWindow
                  position={{
                    lat: selectedStore.latitude,
                    lng: selectedStore.longitude,
                  }}
                  onCloseClick={() => setSelectedStore(null)}
                >
                  <div className="p-4 max-w-xs">
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
                          className="text-indigo-600 hover:underline"
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
                          className="text-indigo-600 hover:underline"
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
                          className="text-indigo-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </p>
                    )}
                    {selectedStore.description && (
                      <p className="text-sm text-slate-600 mb-4 border-t border-slate-200 pt-3">
                        {selectedStore.description}
                      </p>
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
