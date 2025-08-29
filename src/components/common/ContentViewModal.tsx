// components/common/ContentViewModal.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ContentViewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  createdAt?: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function ContentViewModal({
  open,
  onClose,
  title,
  content,
  createdAt,
  user,
}: ContentViewModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: "300px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h6" component="span">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: "text.primary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: "24px", paddingTop: "20px !important" }}>
        {/* User info if provided */}
        {user && (
          <Box sx={{ marginBottom: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Submitted by: {user.name} ({user.email})
            </Typography>
          </Box>
        )}

        {/* Date if provided */}
        {createdAt && (
          <Box sx={{ marginBottom: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Submitted on: {new Date(createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        )}

        {/* Content */}
        <Box
          sx={{
            backgroundColor: "grey.50",
            padding: 2,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "grey.200",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}
          >
            {content}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ padding: "16px 24px", borderTop: "1px solid #e0e0e0" }}>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
}