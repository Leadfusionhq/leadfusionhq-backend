"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axiosWrapper from "@/utils/api";
import { Supabase_CAMPAIGNS_API } from "@/utils/apiUrl";
import { useLoader } from "@/context/LoaderContext";
import { CampaignResponse } from "../../../types/campaign";
const NEXT_PUBLIC_CSV_API_TOKEN = process.env.NEXT_PUBLIC_CSV_API_TOKEN;

export default function SupabaseCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [startDate, setStartDate] = useState("");
  const { showLoader, hideLoader } = useLoader();
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCampaignOptions = useCallback(
    async (search: string) => {
      try {
        showLoader()
        const data = {
          page,
          page_size:pageSize || 10,
          search: search || null,
          state_filter: selectedState || null,
          date: startDate ||  null
        };

        const res = (await axiosWrapper(
          "post",
          `${Supabase_CAMPAIGNS_API.GET_ALL_CAMPAIGNS}/`,
          data,
          NEXT_PUBLIC_CSV_API_TOKEN
        )) as { campaigns: CampaignResponse };

        if (res?.campaigns) {
          setCampaigns(res.campaigns.data ?? []);
          setPagination(res.campaigns.pagination ?? null);
        }
      } catch (e) {
        console.error("Failed to fetch campaign options", e);
      } finally {
        hideLoader();
      }
    },
    [page,pageSize, selectedState, startDate]
  );

  useEffect(() => {
    fetchCampaignOptions(search);
  }, [fetchCampaignOptions]);

  useEffect(() => {
   
    const handler = setTimeout(() => {
      fetchCampaignOptions(search);
    }, 1000);
  
    return () => clearTimeout(handler);
  }, [search]);
  
  const stateOptions = useMemo(() => {
    const uniqueStates = Array.from(
      new Set(campaigns.map((c) => c.campaign_state).filter(Boolean))
    );
    return uniqueStates.sort();
  }, [campaigns]);

  const handleReset = () => {
    setSearch("");
    setSelectedState("");
    setStartDate("");
  };

  const handleNextPage = useCallback(() => {
    if (pagination?.hasNextPage) {
      setPage((prev) => {
        const newPage = Number(prev) + 1;
        return newPage;
      });
    }
  }, [pagination]);
  
  const handlePrevPage = useCallback(() => {
    if (pagination?.hasPrevPage) {
      setPage((prev) => {
        const newPage = Math.max(Number(prev) - 1, 1);
        return newPage;
      });
    }
  }, [pagination]);
  

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
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-1/5">
          <div className="flex flex-col w-full">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              <th className="px-6 py-3 text-left">State</th>
              <th className="px-6 py-3 text-left">Contacts</th>
              <th className="px-6 py-3 text-left">Confirmed Addresses</th>
              <th className="px-6 py-3 text-left">Replied</th>
              <th className="px-6 py-3 text-left">Failed Messages</th>
              <th className="px-6 py-3 text-left">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-gray-400 italic"
                >
                  No campaigns found.
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr
                  key={campaign.campaign_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">{campaign.campaign_id || "—"}</td>
                  <td className="px-6 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {campaign.campaign_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="font-medium">
                      {campaign.campaign_name}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {campaign.campaign_state || "—"}
                  </td>
                  <td className="px-6 py-3">{campaign.total_contacts}</td>
                  <td className="px-6 py-3">{campaign.confirmed_addresses}</td>
                  <td className="px-6 py-3">{campaign.replied}</td>
                  <td className="px-6 py-3">{campaign.failed_messages}</td>
                  <td className="px-6 py-3">{campaign.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between mt-6 gap-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevPage}
            disabled={!pagination.hasPrevPage}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              pagination.hasPrevPage
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
          >
            ← Previous
          </button>

          {/* Page Info */}
          <span className="text-sm text-gray-600">
            Page <strong>{pagination.currentPage}</strong> of{" "}
            <strong>{pagination.totalPages}</strong> ({pagination.totalCount}{" "}
            total)
          </span>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Page size:</span>
            {[5, 10, 20, 50].map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={`px-2 py-1 rounded-lg text-sm font-medium ${
                  pageSize === size
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextPage}
            disabled={!pagination.hasNextPage}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              pagination.hasNextPage
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
