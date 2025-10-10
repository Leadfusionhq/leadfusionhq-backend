"use client";

import { useState, useEffect } from "react";
import { SEARCH_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useLoader } from "@/context/LoaderContext";
import Select from "react-select";

const NEXT_PUBLIC_CSV_API_TOKEN = process.env.NEXT_PUBLIC_CSV_API_TOKEN;

interface FilterResponse {
  zips?: string[];
  counties?: string[];
  states?: string[];
}

interface SearchResponse {
  count: number;
  campaignCount: number;
  adjustedCount: number;
  boberdooCount: number;
}

export default function Filters() {
  const [states, setStates] = useState<string[]>([]);
  const [zips, setZips] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);
  const [loadingZip, setLoadingZip] = useState<boolean>(true);
  const [loadingCounties, setLoadingCounties] = useState<boolean>(true);

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);

  const [results, setResults] = useState<number | null>(null);
  const [campaignCount, setCampaignCount] = useState<number | null>(null);
  const [available, setAvailableCount] = useState<number | null>(null);
  const [boberdooCount, setBoberdooCount] = useState<number | null>(null);

  const { showLoader, hideLoader } = useLoader();

  // Step 1: Fetch all states on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingState(true);
        const res = (await axiosWrapper(
          "get",
          SEARCH_API.FILTER_STATES,
          undefined,
          NEXT_PUBLIC_CSV_API_TOKEN
        )) as FilterResponse;
        setStates(res.states || []);
      } catch (err) {
        console.error("Error fetching states:", err);
      } finally {
        setLoadingState(false);
      }
    };
    fetchStates();
  }, []);

  // Step 2: Fetch zips when a state is selected
  useEffect(() => {
    if (!selectedState) {
      setZips([]);
      setSelectedZips([]);
      setCounties([]);
      setSelectedCounties([]);
      return;
    }

    const fetchZips = async () => {
      try {
        setLoadingZip(true);
        const res = (await axiosWrapper(
          "get",
          `${SEARCH_API.FILTER_ZIPS}?state=${selectedState}`,
          undefined,
          NEXT_PUBLIC_CSV_API_TOKEN
        )) as FilterResponse;

        setZips(res.zips || []);
        setSelectedZips([]);
        setCounties([]);
        setSelectedCounties([]);
      } catch (err) {
        console.error("Error fetching zips:", err);
      } finally {
        setLoadingZip(false);
      }
    };

    fetchZips();
  }, [selectedState]);

  // Step 3: Fetch counties when zips are selected
  useEffect(() => {
    if (selectedZips.length === 0 || !selectedState) {
      setCounties([]);
      setSelectedCounties([]);
      return;
    }

    const fetchCounties = async () => {
      setLoadingCounties(true);
      try {
        const res = (await axiosWrapper(
          "post",
          SEARCH_API.FILTER_COUNTIES,
          {
            state: selectedState,
            zips: selectedZips,
          },
          NEXT_PUBLIC_CSV_API_TOKEN
        )) as { counties: string[] };

        setCounties(res.counties || []);
        setSelectedCounties([]);
      } catch (err) {
        console.error("Error fetching counties:", err);
      } finally {
        setLoadingCounties(false);
      }
    };

    fetchCounties();
  }, [selectedState, selectedZips]);

  // Search handler
  const handleSearch = async () => {
    if (
      !selectedState ||
      selectedZips.length === 0 ||
      selectedCounties.length === 0
    ) {
      alert("Please select state, zip(s), and county(s) first");
      return;
    }

    try {
      showLoader();
      const payload = {
        state: selectedState,
        zips: selectedZips,
        counties: selectedCounties,
      };

      const res = (await axiosWrapper(
        "post",
        SEARCH_API.SEARCH_QUERIES,
        payload,
        NEXT_PUBLIC_CSV_API_TOKEN
      )) as SearchResponse;

      setResults(res.count);
      setCampaignCount(res.campaignCount);
      setAvailableCount(res.adjustedCount);
      setBoberdooCount(res.boberdooCount || 0);
      hideLoader();
    } catch (err) {
      console.error("Search failed:", err);
      hideLoader();
    }
  };

  // Multi-select handlers for zips and counties
  const handleZipSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedZips.includes(value)) {
      setSelectedZips((prev) => [...prev, value]);
    }
  };

  const handleZipRemove = (zip: string) => {
    setSelectedZips(selectedZips.filter((z) => z !== zip));
  };

  const handleCountySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedCounties.includes(value)) {
      setSelectedCounties((prev) => [...prev, value]);
    }
  };

  const handleCountyRemove = (county: string) => {
    setSelectedCounties(selectedCounties.filter((c) => c !== county));
  };

  return (
    <div className="layout_admin flex flex-col gap-6 p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800">Data Query</h2>

      <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col gap-4">
        {/* State Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>

          <Select
            isDisabled={loadingState}
            isLoading={loadingState}
            options={states.map((s) => ({ value: s, label: s }))}
            value={
              selectedState
                ? { value: selectedState, label: selectedState }
                : null
            }
            onChange={(option) => setSelectedState(option ? option.value : "")}
            placeholder={loadingState ? "Loading States..." : "Select State"}
            isClearable
            isSearchable
          />
        </div>

        {/* Zip Dropdown */}
        {selectedState && (
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zip
          </label>
        
          <Select
            isDisabled={loadingZip}
            isLoading={loadingZip}
            isMulti
            options={zips.map((z) => ({ value: z, label: z }))}
            value={selectedZips.map((z) => ({ value: z, label: z }))} 
            onChange={(selectedOptions) =>
              setSelectedZips(selectedOptions ? selectedOptions.map((o) => o.value) : [])
            }
            placeholder={loadingZip ? "Loading Zips..." : "Select Zip(s)"}
            isClearable
            isSearchable
            onInputChange={(inputValue, actionMeta) => {
              if (actionMeta.action === "input-change") {
                // Only allow numbers
                const numericInput = inputValue.replace(/[^0-9]/g, "");
                return numericInput;
              }
            }}
          />
        </div>
        
        )}

        {/* County Dropdown */}
        {selectedZips.length > 0 && (
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            County
          </label>
        
          <Select
            isDisabled={loadingCounties}
            isLoading={loadingCounties}
            isMulti
            options={counties.map((c) => ({ value: c, label: c }))}
            value={selectedCounties.map((c) => ({ value: c, label: c }))}
            onChange={(selectedOptions) =>
              setSelectedCounties(
                selectedOptions ? selectedOptions.map((o) => o.value) : []
              )
            }
            placeholder={loadingCounties ? "Loading Counties..." : "Select Counties"}
            isClearable
            isSearchable
          />
        </div>
        )}

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
            <li>{boberdooCount?.toLocaleString()} boberdoo records</li>
          </ul>
        </div>
      )}
    </div>
  );
}
