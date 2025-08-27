"use client";

import React, { useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Button } from "@mui/material";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface FAQListProps {
  faqs: FAQ[];
  loading?: boolean; // ✅ optional loading state
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => void;
}

const FAQList = ({ faqs, loading = false, onEdit, onDelete }: FAQListProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // ✅ Skeleton rows like UserTable
  const loadingSkeletonRows: FAQ[] = Array.from({ length: 6 }).map((_, i) => ({
    id: `skeleton-${i}`,
    question: "",
    answer: "",
  }));

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const handleDeleteClick = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setShowDeleteConfirm(null);
  };

  const columns: TableColumn<FAQ>[] = [
    {
      name: "Position",
      cell: (row, index) =>
        row.id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={40} />
        ) : (
          `#${index + 1}`
        ),
      width: "100px",
    },
    {
      name: "Question",
      selector: (row) => row.question,
      cell: (row) =>
        row.id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={200} />
        ) : (
          <div title={row.question}>{truncateText(row.question, 60)}</div>
        ),
      sortable: true,
    },
    {
      name: "Answer",
      selector: (row) => row.answer,
      cell: (row) =>
        row.id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={250} />
        ) : (
          <div title={row.answer}>{truncateText(row.answer, 100)}</div>
        ),
      sortable: true,
    },
    {
      name: "Action",
      button: true,
      cell: (row) =>
        row.id.startsWith("skeleton") ? (
          <Skeleton variant="rectangular" width={80} height={30} />
        ) : (
          <div style={{ display: "flex", gap: "6px" }}>
            <Button
              className="!bg-[#838383] !text-white hover:!bg-[#6b6b6b]"
              size="small"
              sx={{
                fontSize: "11px",
                minWidth: "50px",
                height: "26px",
                padding: "0px 6px",
                textTransform: "capitalize",
                fontWeight: 500,
              }}
              onClick={() => onEdit(row)}
            >
              Edit
            </Button>

            <Button
              className="!bg-white !text-[#838383] hover:!bg-[#f5f5f5] border border-[#838383]"
              size="small"
              sx={{
                fontSize: "11px",
                minWidth: "50px",
                height: "26px",
                padding: "0px 6px",
                textTransform: "capitalize",
                fontWeight: 500,
              }}
              onClick={() => handleDeleteClick(row.id)}
            >
              Delete
            </Button>
          </div>
        ),
      minWidth: "160px",
      maxWidth: "180px",
    },
  ];

  const customStyles = {
    table: {
      style: {
        border: "1px solid #ddd",
      },
    },
    headCells: {
      style: {
        fontWeight: "bold",
        backgroundColor: "#000000",
        color: "#FFFFFF",
        padding: "16px",
        fontSize: "14px",
      },
    },
    cells: {
      style: {
        padding: "16px",
        fontSize: "14px",
        border: "1px #01010117",
      },
    },
  };

  return (
    <div className="">
      <div className="flex justify-between items-center pb-[30px]">
        <h3 className="text-[24px] text-[#1C1C1C]">Business FAQs</h3>
      </div>

      <DataTable
        columns={columns}
        data={loading ? loadingSkeletonRows : faqs}
        customStyles={customStyles}
        highlightOnHover
        striped
        dense
        noDataComponent="No FAQs found. Add your first FAQ to get started."
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this FAQ? This action cannot be
              undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQList;
