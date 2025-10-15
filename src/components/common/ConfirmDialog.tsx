// components/ConfirmDialog.tsx
import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?:string;
  cancelText:string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  onConfirm,
  confirmText,
  cancelText,
  onCancel,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Even lighter semi-transparent backdrop
        }
      }}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: '20px', 
        fontWeight: '400', 
        padding: '28px 28px 16px',
        color: '#374151',
        textAlign: 'center',
        background: 'transparent'
      }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ 
        padding: '16px 28px 24px',
        color: '#6B7280',
        fontSize: '15px',
        textAlign: 'center',
        lineHeight: '1.6',
        fontWeight: '300'
      }}>
        {message}
      </DialogContent>
      <DialogActions sx={{ 
        padding: '20px 28px 28px',
        gap: '16px',
        justifyContent: 'center'
      }}>
        <Button 
          onClick={onCancel} 
          sx={{
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '12px 28px',
            textTransform: 'none',
            fontWeight: '400',
            color: '#6B7280',
            fontSize: '14px',
            background: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(249, 250, 251, 0.9)',
              borderColor: '#D1D5DB',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          sx={{ 
            backgroundColor: '#9CA3AF', 
            color: 'white',
            borderRadius: '10px',
            padding: '12px 28px',
            textTransform: 'none',
            fontWeight: '400',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(156, 163, 175, 0.2)',
            '&:hover': {
              backgroundColor: '#6B7280',
              boxShadow: '0 4px 12px rgba(156, 163, 175, 0.3)',
            }
          }} 
          variant="contained"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;