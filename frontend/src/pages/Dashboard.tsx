import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Slide
} from '@mui/material';
import {
  Science,
  Explore,
  Timeline,
  Settings,
  TrendingUp,
  Public,
  Star,
  Speed
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const stats = [
    {
      title: 'Total Planets',
      value: '4,500+',
      icon: <Public sx={{ fontSize: 48, color: theme.palette.secondary.main }} />,
      description: 'Confirmed exoplanets in database'
    },
    {
      title: 'Habitability Score',
      value: '0.85',
      icon: <TrendingUp sx={{ fontSize: 48, color: '#34C759' }} />,
      description: 'Average CDHS score'
    },
    {
      title: 'HWO Targets',
      value: '150',
      icon: <Star sx={{ fontSize: 48, color: '#FF9500' }} />,
      description: 'Priority candidates identified'
    },
    {
      title: 'Processing Speed',
      value: '2.3s',
      icon: <Speed sx={{ fontSize: 48, color: '#007AFF' }} />,
      description: 'Average analysis time'
    }
  ];

  const features = [
    {
      title: 'Planet Explorer',
      description: 'Browse and analyze exoplanet data with advanced filtering and visualization tools',
      icon: <Explore sx={{ fontSize: 48 }} />,
      path: '/planets',
      color: theme.palette.secondary.main
    },
    {
      title: 'HWO Target Dashboard',
      description: 'View prioritized targets for NASA\'s Habitable Worlds Observatory mission',
      icon: <Timeline sx={{ fontSize: 48 }} />,
      path: '/hwo-targets',
      color: '#34C759'
    },
    {
      title: 'Mission Planner',
      description: 'Plan observation strategies and optimize target selection for HWO',
      icon: <Settings sx={{ fontSize: 48 }} />,
      path: '/mission-planner',
      color: '#FF9500'
    },
    {
      title: 'Observation Simulator',
      description: 'Simulate HWO observations and analyze expected data quality',
      icon: <Science sx={{ fontSize: 48 }} />,
      path: '/observation-simulator',
      color: '#007AFF'
    }
  ];

    return (
    <Box sx={{ pt: 10, pb: 8 }}>
        <Container maxWidth="xl">
        {/* Hero Section */}
        <Box sx={{ mb: 12, textAlign: 'center' }}>
          <Fade in={true} timeout={1000}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 4,
                background: 'linear-gradient(135deg, #000000 0%, #007AFF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
              }}
            >
              HWO Habitability Explorer
            </Typography>
          </Fade>
          
          <Slide direction="up" in={true} timeout={1200}>
            <Typography
              variant="h4"
              color="text.secondary"
              sx={{ 
                mb: 4, 
                maxWidth: 900, 
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
              }}
            >
              Comprehensive exoplanet habitability assessment platform for NASA's Habitable Worlds Observatory
            </Typography>
          </Slide>
          
          <Fade in={true} timeout={1400}>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ 
                mb: 6, 
                maxWidth: 700, 
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Discover, analyze, and prioritize the most promising exoplanets for life detection missions
              using advanced algorithms and machine learning techniques.
                        </Typography>
          </Fade>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={4} sx={{ mb: 12 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Grow in={true} timeout={800 + index * 200}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 20,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #f0f0f0',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ 
                    textAlign: 'center', 
                    flexGrow: 1, 
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Box sx={{ mb: 3 }}>
                      {stat.icon}
                    </Box>
                    <Typography 
                      variant="h2" 
                      component="div" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        mb: 2,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {stat.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ lineHeight: 1.5 }}
                    >
                      {stat.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
                    </Grid>
          ))}
                    </Grid>

        {/* Features Grid */}
        <Box sx={{ mb: 8 }}>
          <Fade in={true} timeout={1600}>
            <Typography 
              variant="h3" 
              component="h2" 
              sx={{ 
                mb: 8, 
                textAlign: 'center',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Explore Our Tools
            </Typography>
          </Fade>
          
          <Grid container spacing={6}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Grow in={true} timeout={1000 + index * 200}>
                  <Paper
                    sx={{
                      p: 6,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 24,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                      }
                    }}
                    component={RouterLink}
                    to={feature.path}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 4,
                        gap: 3
                      }}
                    >
                      <Box sx={{ color: feature.color }}>
                        {feature.icon}
                      </Box>
                      <Typography 
                        variant="h4" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 4, 
                        flexGrow: 1,
                        lineHeight: 1.6,
                        fontSize: '1.1rem',
                      }}
                    >
                      {feature.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{
                        alignSelf: 'flex-start',
                        borderColor: feature.color,
                        color: feature.color,
                        borderRadius: 25,
                        px: 4,
                        py: 1.5,
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: feature.color,
                          backgroundColor: feature.color,
                          color: '#ffffff',
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${feature.color}40`,
                        }
                      }}
                    >
                      Explore
                    </Button>
                        </Paper>
                </Grow>
                    </Grid>
            ))}
                </Grid>
            </Box>

        {/* Quick Actions */}
        <Box sx={{ textAlign: 'center' }}>
          <Fade in={true} timeout={1800}>
            <Typography 
              variant="h4" 
              component="h3" 
              sx={{ 
                mb: 6,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Get Started
            </Typography>
          </Fade>
          
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Grow in={true} timeout={2000}>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/planets"
                startIcon={<Explore />}
                sx={{ 
                  px: 6, 
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 30,
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.3)',
                  }
                }}
              >
                Browse Planets
              </Button>
            </Grow>
            
            <Grow in={true} timeout={2200}>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/hwo-targets"
                startIcon={<Star />}
                sx={{ 
                  px: 6, 
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 30,
                  borderWidth: 2,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                View HWO Targets
              </Button>
            </Grow>
          </Box>
        </Box>
        </Container>
    </Box>
    );
};

export default Dashboard;
