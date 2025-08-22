import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Box,
  Container,
  CircularProgress
} from '@mui/material';
import { getPlanetData, Planet } from '../services/localData';

const PlanetExplorer: React.FC = () => {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPlanetData()
      .then((data) => {
        setPlanets(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load planet data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading planet data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Planet Explorer
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {planets.length}
            </Typography>
            <Typography variant="body1">Total Planets</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {planets.filter(p => p.st_dist && p.st_dist < 100).length}
            </Typography>
            <Typography variant="body1">Within 100 pc</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
              {planets.filter(p => p.pl_radj && p.pl_radj < 2).length}
            </Typography>
            <Typography variant="body1">Earth-sized</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Planet Catalog
      </Typography>

      <Grid container spacing={3}>
        {planets.slice(0, 50).map((planet, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {planet.pl_name || 'Unknown Planet'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Host: {planet.hostname || 'Unknown'}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Distance
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {planet.st_dist ? `${planet.st_dist.toFixed(1)} pc` : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Radius
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {planet.pl_radj ? `${planet.pl_radj.toFixed(2)} R♃` : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Orbital Period
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {planet.pl_orbper ? `${planet.pl_orbper.toFixed(1)} days` : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Stellar Temp
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {planet.st_teff ? `${planet.st_teff} K` : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip 
                    label="Confirmed"
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PlanetExplorer;
