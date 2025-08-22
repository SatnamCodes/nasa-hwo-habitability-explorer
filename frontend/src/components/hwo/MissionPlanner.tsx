import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import { Settings, Schedule, Map, Timeline } from '@mui/icons-material';

const MissionPlanner: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <Settings color="primary" />
          Mission Planner
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Plan observation strategies and optimize target selection for the Habitable Worlds Observatory
        </Typography>
      </Box>

      {/* Mission Overview */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline color="primary" />
          Mission Overview
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Current Mission Phase</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              The Habitable Worlds Observatory (HWO) is currently in the planning and development phase. 
              Our mission planner helps optimize target selection and observation strategies for maximum 
              scientific return.
            </Typography>
            <Button variant="contained" size="large" startIcon={<Schedule />}>
              Create Mission Plan
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Key Objectives</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Chip label="Identify 200+ high-priority targets" color="primary" sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Chip label="Optimize observation scheduling" color="primary" sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Chip label="Maximize habitability detection probability" color="primary" sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Chip label="Minimize mission costs and time" color="primary" />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Planning Tools */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Map color="primary" />
              Target Selection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Advanced algorithms help identify the most promising exoplanets based on habitability scores, 
              observability conditions, and scientific priorities.
            </Typography>
            <Button variant="outlined" fullWidth>
              Launch Target Selector
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              Schedule Optimization
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Intelligent scheduling algorithms optimize observation sequences considering weather, 
              target visibility windows, and mission constraints.
            </Typography>
            <Button variant="outlined" fullWidth>
              Launch Scheduler
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Coming Soon Features */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Advanced Mission Planning Features
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're developing comprehensive mission planning tools that will revolutionize how we approach 
          exoplanet observation missions.
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6">Smart Scheduling</Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered scheduling optimization
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Map sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
              <Typography variant="h6">Target Mapping</Typography>
              <Typography variant="body2" color="text.secondary">
                3D visualization of target positions
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h6">Mission Timeline</Typography>
              <Typography variant="body2" color="text.secondary">
                Interactive mission planning timeline
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Settings sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h6">Resource Planning</Typography>
              <Typography variant="body2" color="text.secondary">
                Budget and resource optimization
              </Typography>
            </Card>
          </Grid>
        </Grid>
        
        <Typography variant="body2" color="text.secondary">
          These tools will be available in future updates as we continue to develop the HWO mission planning platform.
        </Typography>
      </Paper>
    </Container>
  );
};

export default MissionPlanner;
