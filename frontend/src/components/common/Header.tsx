import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Fade,
  Slide
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Science, Explore, Timeline, Settings } from '@mui/icons-material';

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <Science /> },
    { label: 'Planet Explorer', path: '/planets', icon: <Explore /> },
    { label: '3D Galaxy Map', path: '/galaxy-map', icon: <Timeline /> },
    { label: 'HWO Targets', path: '/hwo-targets', icon: <Timeline /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Slide direction="down" in={true} mountOnEnter unmountOnExit>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: scrolled 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled 
            ? '1px solid #e5e5e7' 
            : '1px solid transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 80 }}>
            {/* Logo/Brand */}
            <Fade in={true} timeout={800}>
              <Typography
                variant="h6"
                component={RouterLink}
                to="/"
                sx={{
                  mr: 6,
                  fontWeight: 700,
                  color: '#000000',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  fontSize: '1.5rem',
                  letterSpacing: '-0.02em',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <Science sx={{ 
                  fontSize: 32, 
                  color: theme.palette.secondary.main,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(15deg)',
                  }
                }} />
                HWO Explorer
              </Typography>
            </Fade>

            {/* Navigation Items */}
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              {navItems.map((item, index) => (
                <Fade in={true} timeout={800 + index * 100} key={item.path}>
                  <Button
                    component={RouterLink}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: isActive(item.path) ? '#000000' : '#666666',
                      textTransform: 'none',
                      fontWeight: isActive(item.path) ? 600 : 500,
                      backgroundColor: isActive(item.path) 
                        ? 'rgba(0, 0, 0, 0.05)' 
                        : 'transparent',
                      borderRadius: 25,
                      px: 3,
                      py: 1.5,
                      minWidth: isMobile ? 'auto' : 140,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                      '& .MuiButton-startIcon': {
                        transition: 'all 0.3s ease',
                      },
                      '&:hover .MuiButton-startIcon': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    {!isMobile && item.label}
                  </Button>
                </Fade>
              ))}
            </Box>

            {/* Right side actions */}
            <Fade in={true} timeout={1000}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="medium"
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    borderRadius: 25,
                    px: 3,
                    py: 1.5,
                    fontWeight: 500,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    }
                  }}
                >
                  {isMobile ? 'Help' : 'Documentation'}
                </Button>
              </Box>
            </Fade>
          </Toolbar>
        </Container>
      </AppBar>
    </Slide>
  );
};

export default Header;
