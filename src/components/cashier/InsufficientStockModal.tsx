import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

interface InsufficientStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  availableQuantity: number;
  requiredQuantity: number;
}

const InsufficientStockModal: React.FC<InsufficientStockModalProps> = ({
  isOpen,
  onClose,
  productName,
  availableQuantity,
  requiredQuantity,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        style: {
          borderRadius: '8px',
          maxWidth: '500px',
          width: '100%',
          margin: '20px',
        },
      }}
    >
      <DialogTitle
        style={{
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          padding: '24px',
          color: '#dc3545',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        Недостаточно товара
      </DialogTitle>
      <DialogContent style={{ padding: '24px' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {productName}
          </Typography>
          <Typography variant="body1" color="error">
            В наличии: {availableQuantity} шт.
          </Typography>
          <Typography variant="body1">
            Требуется: {requiredQuantity} шт.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions
        style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
          sx={{
            height: '48px',
            fontSize: '16px',
            backgroundColor: '#dc3545',
            '&:hover': {
              backgroundColor: '#c82333',
            },
          }}
        >
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InsufficientStockModal;
