import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { Science } from '@mui/icons-material';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const theme = useTheme();
  
  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 64;
      default: return 48;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 2
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress 
          size={getSize()} 
          thickness={4}
          sx={{ color: theme.palette.primary.main }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Science 
            sx={{ 
              fontSize: getSize() * 0.4,
              color: theme.palette.primary.main,
              opacity: 0.7
            }} 
          />
        </Box>
      </Box>
      
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ textAlign: 'center' }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
