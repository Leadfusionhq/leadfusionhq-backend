"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axiosWrapper from "@/utils/api";
import { Supabase_CAMPAIGNS_API } from "@/utils/apiUrl";
import { useLoader } from "@/context/LoaderContext";

export default function CampaignsTable({ token }: { token?: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { showLoader, hideLoader } = useLoader();

  const fetchCampaignOptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = (await axiosWrapper(
        "get",
        `${Supabase_CAMPAIGNS_API.GET_ALL_CAMPAIGNS}`,
        {},
        token ?? undefined
      )) as { campaigns: any[] };
      if (res) {
        setCampaigns(res.campaigns ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch campaign options", e);
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [token]);

  useEffect(() => {
    fetchCampaignOptions();
  }, [fetchCampaignOptions]);

  const stateOptions = useMemo(() => {
    const uniqueStates = Array.from(
      new Set(campaigns.map((c) => c.state).filter(Boolean))
    );
    return uniqueStates.sort();
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.state?.toLowerCase().includes(search.toLowerCase());

      const matchesState = !selectedState || c.state === selectedState;

      const campaignDate = c.created_at ? new Date(c.created_at) : null;
      const matchesStart =
        !startDate || (campaignDate && campaignDate >= new Date(startDate));
      const matchesEnd =
        !endDate || (campaignDate && campaignDate <= new Date(endDate));

      return matchesSearch && matchesState && matchesStart && matchesEnd;
    });
  }, [campaigns, search, selectedState, startDate, endDate]);

  const handleReset = () => {
    setSearch("");
    setSelectedState("");
    setStartDate("");
    setEndDate("");
  };

  if (loading)
    return (
      showLoader()
    );

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm w-full">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Campaigns List</h1>
        <p className="text-sm text-gray-500 mt-2 sm:mt-0">
          Manage and view all campaign details below
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        {/* Search */}
        <div className="flex flex-col w-full lg:w-1/4">
          <label className="text-sm font-medium text-gray-600 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* State Filter */}
        <div className="flex flex-col w-full lg:w-1/5">
          <label className="text-sm font-medium text-gray-600 mb-1">
            State
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All States</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col md:flex-row gap-2 w-full lg:w-2/5">
          <div className="flex flex-col w-full">
            <label className="text-sm font-medium text-gray-600 mb-1">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col w-full">
            <label className="text-sm font-medium text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="h-10 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium mt-4 lg:mt-0"
        >
          Reset Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl w-full">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-black text-white uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-left">State</th>
              <th className="px-6 py-3 text-left">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-gray-400 italic"
                >
                  No campaigns found.
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">{campaign.id || "—"}</td>
                  <td className="px-6 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {campaign.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="font-medium">{campaign.name}</span>
                  </td>
                  <td className="px-6 py-3">{campaign.description || "—"}</td>
                  <td className="px-6 py-3">{campaign.state || "—"}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {campaign.created_at
                      ? new Date(campaign.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
