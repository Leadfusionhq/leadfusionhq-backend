const commonDataTableStyles = {
  table: {
    style: {
      border: "1px solid #ddd",
      borderRadius: "4px",
      overflow: "hidden",
    },
  },
  headCells: {
    style: {
      fontWeight: "bold",
      backgroundColor: "#000000",
      color: "#FFFFFF",
      padding: "24px",
      fontSize: "16px",
      zIndex: 1,
    },
  },
  cells: {
    style: {
      padding: "24px",
      fontSize: "16px",
      borderBottom: "1px solid rgba(1, 1, 1, 0.09)",
    },
  },
  rows: {
    style: {
      '&:hover': {
        backgroundColor: "#F9F9F9",
      },
    },
  },
};

export default commonDataTableStyles;
