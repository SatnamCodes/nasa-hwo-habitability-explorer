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
  CircularProgress,
  Button,
  useTheme
} from '@mui/material';
import {
  Explore,
  Science,
  TrendingUp
} from '@mui/icons-material';
import { getPlanetData, Planet } from '../services/localData';

const PlanetExplorer: React.FC = () => {
  const theme = useTheme();
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [filteredPlanets, setFilteredPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);

  useEffect(() => {
    setLoading(true);
    getPlanetData()
      .then((data: Planet[]) => {
        setPlanets(data);
        setFilteredPlanets(data);
        setLoading(false);
      })
      .catch((err: Error) => {
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
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <Explore color="primary" />
          Planet Explorer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Explore confirmed exoplanets from the NASA Exoplanet Archive. Browse through planets discovered beyond our solar system.
        </Typography>
      </Paper>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button variant="outlined" onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const mapped = await getPlanetData();
                setPlanets(mapped);
                setFilteredPlanets(mapped);
              } catch (e) {
                setError('Failed to reload planet data');
              } finally {
                setLoading(false);
              }
            }}>Reload Planets</Button>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                {filteredPlanets.length}
              </Typography>
              <Typography variant="body1">Total Planets</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                {new Set(filteredPlanets.map(p => p.hostname)).size}
              </Typography>
              <Typography variant="body1">Host Stars</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                {filteredPlanets.filter(p => p.st_dist && p.st_dist < 100).length}
              </Typography>
              <Typography variant="body1">Nearby (&lt;100 pc)</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Featured Exoplanets */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science color="primary" />
            Featured Exoplanets
          </Typography>
          <Grid container spacing={3}>
            {filteredPlanets.slice(0, 6).map((planet: Planet, index: number) => (
              <Grid item xs={12} md={4} key={`${planet.pl_name}-${index}`}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                  onClick={() => setSelectedPlanet(planet)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {planet.pl_name}
                      </Typography>
                      <Chip
                        label="Confirmed"
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Host Star: {planet.hostname}
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Radius
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {planet.pl_radj ? `${planet.pl_radj.toFixed(2)} RJ` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Mass
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {planet.pl_bmassj ? `${planet.pl_bmassj.toFixed(2)} MJ` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Orbital Period
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {planet.pl_orbper ? `${planet.pl_orbper.toFixed(1)} days` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Distance
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {planet.st_dist ? `${planet.st_dist.toFixed(1)} pc` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Stellar Temperature:
                      </Typography>
                      <Chip
                        label={planet.st_teff ? `${planet.st_teff} K` : 'N/A'}
                        color="info"
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Paper>

      {selectedPlanet && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Selected Planet: {selectedPlanet.pl_name}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Host Star:</strong> {selectedPlanet.hostname}</Typography>
              <Typography variant="body1"><strong>Orbital Period:</strong> {selectedPlanet.pl_orbper ? `${selectedPlanet.pl_orbper.toFixed(2)} days` : 'N/A'}</Typography>
              <Typography variant="body1"><strong>Semi-major Axis:</strong> {selectedPlanet.pl_orbsmax ? `${selectedPlanet.pl_orbsmax.toFixed(3)} AU` : 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Radius:</strong> {selectedPlanet.pl_radj ? `${selectedPlanet.pl_radj.toFixed(2)} Jupiter radii` : 'N/A'}</Typography>
              <Typography variant="body1"><strong>Mass:</strong> {selectedPlanet.pl_bmassj ? `${selectedPlanet.pl_bmassj.toFixed(2)} Jupiter masses` : 'N/A'}</Typography>
              <Typography variant="body1"><strong>Distance:</strong> {selectedPlanet.st_dist ? `${selectedPlanet.st_dist.toFixed(1)} parsecs` : 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default PlanetExplorer;
