import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  useTheme
} from '@mui/material';
import { GitHub, Science, School } from '@mui/icons-material';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' },
            gap: 2,
          }}
        >
          {/* Left side - Project info */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              variant="h6"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
                justifyContent: { xs: 'center', md: 'flex-start' }
              }}
            >
              <Science color="primary" />
              HWO Habitability Explorer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Comprehensive exoplanet habitability assessment platform for NASA's Habitable Worlds Observatory
            </Typography>
            <Typography variant="caption" color="text.secondary">
              © {currentYear} HWO Explorer Team. All rights reserved.
            </Typography>
          </Box>

          {/* Right side - Links */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3,
              alignItems: { xs: 'center', md: 'flex-end' }
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link
                  href="https://github.com/SatnamCodes/nasa-hwo-habitability-explorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <GitHub fontSize="small" />
                  GitHub Repository
                </Link>
                <Link
                  href="https://www.nasa.gov/hwo"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <Science fontSize="small" />
                  NASA HWO Mission
                </Link>
                <Link
                  href="/docs"
                  color="inherit"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <School fontSize="small" />
                  Documentation
                </Link>
              </Box>
            </Box>

            <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Support
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link
                  href="/contact"
                  color="inherit"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Contact Us
                </Link>
                <Link
                  href="/faq"
                  color="inherit"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  FAQ
                </Link>
                <Link
                  href="/privacy"
                  color="inherit"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Privacy Policy
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        {/* Bottom section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Built with FastAPI, React, and Material-UI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Version 1.0.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
