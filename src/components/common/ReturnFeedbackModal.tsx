// components/ReturnFeedbackModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
} from "@mui/material";

interface ReturnFeedbackModalProps {
  open: boolean;
  leadId: string;
  leadName: string;
  onConfirm: (leadId: string, reason: string, comments: string) => void;
  onCancel: () => void;
}

const RETURN_REASONS = [
  { value: 'invalid_contact', label: 'Invalid Contact Information' },
  { value: 'duplicate', label: 'Duplicate Lead' },
  { value: 'not_interested', label: 'Lead Not Interested' },
  { value: 'wrong_location', label: 'Wrong Location/State' },
  { value: 'poor_quality', label: 'Poor Quality Lead' },
  { value: 'other', label: 'Other' },
];

const ReturnFeedbackModal: React.FC<ReturnFeedbackModalProps> = ({
  open,
  leadId,
  leadName,
  onConfirm,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [errors, setErrors] = useState<{ reason?: string; comments?: string }>({});

  const handleConfirm = () => {
    const newErrors: { reason?: string; comments?: string } = {};

    // Always require a reason to be selected
    if (!selectedReason) {
      newErrors.reason = 'Please select a reason';
    }

    // ✅ Make comments required if "Other" is selected OR if any reason is selected
    if (selectedReason && !comments.trim()) {
      if (selectedReason === 'other') {
        newErrors.comments = 'Please provide details for "Other" reason';
      } else {
        newErrors.comments = 'Please provide additional information about the return';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(leadId, selectedReason, comments);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason('');
    setComments('');
    setErrors({});
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
      <DialogTitle
        sx={{
          fontSize: '20px',
          fontWeight: '400',
          padding: '28px 28px 16px',
          color: '#374151',
          textAlign: 'center',
          background: 'transparent'
        }}
      >
        Return Lead
      </DialogTitle>

      <DialogContent sx={{ padding: '16px 28px 24px' }}>
        <Box sx={{ mb: 2 }}>
          <div className="text-sm text-gray-600 text-center mb-4">
            Lead: <span className="font-medium text-gray-900">{leadName}</span>
          </div>
        </Box>

        <FormControl component="fieldset" fullWidth error={!!errors.reason}>
          <FormLabel
            component="legend"
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              mb: 1.5,
              '&.Mui-focused': { color: '#374151' }
            }}
          >
            Reason for Return *
          </FormLabel>
          <RadioGroup
            value={selectedReason}
            onChange={(e) => {
              setSelectedReason(e.target.value);
              setErrors(prev => ({ ...prev, reason: undefined }));
            }}
          >
            {RETURN_REASONS.map((reason) => (
              <FormControlLabel
                key={reason.value}
                value={reason.value}
                control={
                  <Radio
                    sx={{
                      color: '#9CA3AF',
                      '&.Mui-checked': { color: '#6B7280' }
                    }}
                  />
                }
                label={reason.label}
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '14px',
                    color: '#6B7280',
                  }
                }}
              />
            ))}
          </RadioGroup>
          {errors.reason && (
            <div className="text-red-500 text-xs mt-1">{errors.reason}</div>
          )}
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label={selectedReason ? "Additional Comments *" : "Additional Comments"}
          placeholder="Provide additional details about the return..."
          value={comments}
          onChange={(e) => {
            setComments(e.target.value);
            setErrors(prev => ({ ...prev, comments: undefined }));
          }}
          error={!!errors.comments}
          helperText={errors.comments}
          required={!!selectedReason} // ✅ Show required indicator when reason is selected
          sx={{
            mt: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '& fieldset': { borderColor: '#E5E7EB' },
              '&:hover fieldset': { borderColor: '#D1D5DB' },
              '&.Mui-focused fieldset': { borderColor: '#9CA3AF' },
            },
            '& .MuiInputLabel-root': {
              color: '#6B7280',
              fontSize: '14px',
              '&.Mui-focused': { color: '#6B7280' },
            },
            '& .MuiInputBase-input': {
              fontSize: '14px',
              color: '#374151',
            }
          }}
        />
      </DialogContent>

      <DialogActions
        sx={{
          padding: '20px 28px 28px',
          gap: '16px',
          justifyContent: 'center'
        }}
      >
        <Button
          onClick={handleClose}
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
          onClick={handleConfirm}
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
          Submit Return
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReturnFeedbackModal;