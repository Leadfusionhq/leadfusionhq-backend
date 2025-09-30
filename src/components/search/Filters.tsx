"use client";

import { useState, useEffect } from "react";
import { SEARCH_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useLoader } from "@/context/LoaderContext";
interface SearchResponse {
  count: number;
  campaignCount: number;
  adjustedCount: number;
}

export default function Filters() {
  const [counties, setCounties] = useState<string[]>([]);
  const [zips, setZips] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedZip, setSelectedZip] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const [results, setResults] = useState<number | null>(null);
  const [campaignCount, setCampaignCount] = useState<number | null>(null);
  const [available, setAvailableCount] = useState<number | null>(null);
  const { showLoader, hideLoader } = useLoader(); 

  // Fetch filter data on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = (await axiosWrapper(
          "get",
          SEARCH_API.FILTER_QUERIES
        )) as { data: { Zip?: string; counties?: string | null; city?: string }[] };
        if (!Array.isArray(res?.data)) {
          throw new Error("Invalid response format: expected an array");
        }
        const uniqueCounties = Array.from(
          new Set(res?.data.map((d) => d.counties).filter(Boolean))
        ) as string[];

        const uniqueZips = Array.from(
          new Set(res?.data.map((d) => d.Zip).filter(Boolean))
        ) as string[];

        const uniqueCities = Array.from(
          new Set(res?.data.map((d) => d.city).filter(Boolean) as string[])
        ).sort((a, b) => a.localeCompare(b)) as string[];

        setCounties(uniqueCounties);
        setZips(uniqueZips);
        setCities(uniqueCities);
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };
    fetchFilters();
  }, []);

  const handleSearch = async () => {
    try {
      showLoader()
      const payload = {
        county: selectedCounty || undefined,
        zip: selectedZip || undefined,
        city: selectedCity || undefined,
      };

      const res = await axiosWrapper(
        "post",
        SEARCH_API.SEARCH_QUERIES,
        payload,
        undefined
      ) as SearchResponse;
      if (res) {
        setResults(res?.count ?? 0);
        setCampaignCount(res?.campaignCount ?? 0);
        setAvailableCount(res?.adjustedCount ?? 0);
        hideLoader();
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  return (
    <div className="layout_admin flex flex-col gap-6 p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800">Data Query</h2>
      <p className="text-gray-500 text-sm">
        Select county, zip code, or city to check available data counts.
      </p>

      <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            County
          </label>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select County</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zip
          </label>
          <select
            value={selectedZip}
            onChange={(e) => setSelectedZip(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select Zip</option>
            {zips.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="bg-black hover:bg-gray-700 text-white font-medium rounded-lg px-6 py-2 transition"
        >
          Search
        </button>
      </div>

      {results !== null && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Results</h3>
          <ul className="text-gray-700 space-y-1">
            <li>{results.toLocaleString()} total records found</li>
            <li>{available?.toLocaleString()} available records</li>
            <li>{campaignCount?.toLocaleString()} campaign records</li>
          </ul>
        </div>
      )}
    </div>
  );
}
