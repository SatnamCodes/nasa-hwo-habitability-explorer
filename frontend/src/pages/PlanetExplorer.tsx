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
  useTheme,
  TextField,
  Slider
} from '@mui/material';
import {
  Explore,
  Science,
  TrendingUp,
  FilterList,
  Public
} from '@mui/icons-material';
import { getPlanetData, Planet } from '../services/localData';
import Planet3DModal from '../components/Planet3DModal';

const PlanetExplorer: React.FC = () => {
  const theme = useTheme();
  const [allPlanets, setAllPlanets] = useState<Planet[]>([]);
  const [filteredPlanets, setFilteredPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [radiusRange, setRadiusRange] = useState<number[]>([0, 10]);
  const [massRange, setMassRange] = useState<number[]>([0, 20]);
  const [distanceRange, setDistanceRange] = useState<number[]>([0, 1000]);
  const [tempRange, setTempRange] = useState<number[]>([0, 8000]);
  const [hostStarFilter, setHostStarFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    getPlanetData()
      .then((data: Planet[]) => {
        setAllPlanets(data);
        setFilteredPlanets(data);
        
        // Set initial filter ranges based on data
        const radii = data.map(p => p.pl_radj).filter(r => r != null);
        const masses = data.map(p => p.pl_bmassj).filter(m => m != null);
        const distances = data.map(p => p.st_dist).filter(d => d != null);
        const temps = data.map(p => p.st_teff).filter(t => t != null);
        
        if (radii.length > 0) setRadiusRange([Math.min(...radii), Math.max(...radii)]);
        if (masses.length > 0) setMassRange([Math.min(...masses), Math.max(...masses)]);
        if (distances.length > 0) setDistanceRange([Math.min(...distances), Math.max(...distances)]);
        if (temps.length > 0) setTempRange([Math.min(...temps), Math.max(...temps)]);
        
        setLoading(false);
      })
      .catch((err: Error) => {
        setError('Failed to load planet data');
        setLoading(false);
      });
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = allPlanets;

    if (nameFilter) {
      filtered = filtered.filter(planet => 
        planet.pl_name.toLowerCase().includes(nameFilter.toLowerCase()) ||
        planet.hostname.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (hostStarFilter) {
      filtered = filtered.filter(planet => 
        planet.hostname.toLowerCase().includes(hostStarFilter.toLowerCase())
      );
    }

    filtered = filtered.filter(planet => {
      const radiusOk = !planet.pl_radj || (planet.pl_radj >= radiusRange[0] && planet.pl_radj <= radiusRange[1]);
      const massOk = !planet.pl_bmassj || (planet.pl_bmassj >= massRange[0] && planet.pl_bmassj <= massRange[1]);
      const distanceOk = !planet.st_dist || (planet.st_dist >= distanceRange[0] && planet.st_dist <= distanceRange[1]);
      const tempOk = !planet.st_teff || (planet.st_teff >= tempRange[0] && planet.st_teff <= tempRange[1]);
      
      return radiusOk && massOk && distanceOk && tempOk;
    });

    setFilteredPlanets(filtered);
  }, [allPlanets, nameFilter, hostStarFilter, radiusRange, massRange, distanceRange, tempRange]);

  const handlePlanetClick = (planet: Planet) => {
    setSelectedPlanet(planet);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setNameFilter('');
    setHostStarFilter('');
    const radii = allPlanets.map(p => p.pl_radj).filter(r => r != null);
    const masses = allPlanets.map(p => p.pl_bmassj).filter(m => m != null);
    const distances = allPlanets.map(p => p.st_dist).filter(d => d != null);
    const temps = allPlanets.map(p => p.st_teff).filter(t => t != null);
    
    if (radii.length > 0) setRadiusRange([Math.min(...radii), Math.max(...radii)]);
    if (masses.length > 0) setMassRange([Math.min(...masses), Math.max(...masses)]);
    if (distances.length > 0) setDistanceRange([Math.min(...distances), Math.max(...distances)]);
    if (temps.length > 0) setTempRange([Math.min(...temps), Math.max(...temps)]);
  };

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
      {/* 3D Planet Modal */}
      <Planet3DModal
        planet={selectedPlanet}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

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
          Explore confirmed exoplanets from the NASA Exoplanet Archive. Click on any planet to see a detailed 3D visualization.
        </Typography>
      </Paper>

      {/* Controls and Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList color="primary" />
            Filters & Controls
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 2 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button variant="outlined" onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const mapped = await getPlanetData();
                setAllPlanets(mapped);
                setFilteredPlanets(mapped);
              } catch (e) {
                setError('Failed to reload planet data');
              } finally {
                setLoading(false);
              }
            }}>Reload Planets</Button>
          </Box>
        </Box>

        {/* Filters Section */}
        {showFilters && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search Planet or Star Name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Host Star Filter"
                  value={hostStarFilter}
                  onChange={(e) => setHostStarFilter(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Radius Range (Jupiter Radii)</Typography>
                <Slider
                  value={radiusRange}
                  onChange={(_, newValue) => setRadiusRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={10}
                  step={0.1}
                />
                <Typography variant="caption" color="text.secondary">
                  {radiusRange[0].toFixed(1)} - {radiusRange[1].toFixed(1)} RJ
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Mass Range (Jupiter Masses)</Typography>
                <Slider
                  value={massRange}
                  onChange={(_, newValue) => setMassRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={20}
                  step={0.1}
                />
                <Typography variant="caption" color="text.secondary">
                  {massRange[0].toFixed(1)} - {massRange[1].toFixed(1)} MJ
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Distance Range (parsecs)</Typography>
                <Slider
                  value={distanceRange}
                  onChange={(_, newValue) => setDistanceRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                  step={10}
                />
                <Typography variant="caption" color="text.secondary">
                  {distanceRange[0]} - {distanceRange[1]} pc
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Stellar Temperature Range (K)</Typography>
                <Slider
                  value={tempRange}
                  onChange={(_, newValue) => setTempRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={8000}
                  step={100}
                />
                <Typography variant="caption" color="text.secondary">
                  {tempRange[0]} - {tempRange[1]} K
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Button variant="outlined" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                {filteredPlanets.length}
              </Typography>
              <Typography variant="body1">Filtered Planets</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                {new Set(filteredPlanets.map(p => p.hostname)).size}
              </Typography>
              <Typography variant="body1">Host Stars</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                {filteredPlanets.filter(p => p.st_dist && p.st_dist < 100).length}
              </Typography>
              <Typography variant="body1">Nearby (&lt;100 pc)</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {filteredPlanets.filter(p => p.pl_radj && p.pl_radj < 2).length}
              </Typography>
              <Typography variant="body1">Small Planets</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Featured Exoplanets */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science color="primary" />
            Exoplanets ({filteredPlanets.length} found)
          </Typography>
          <Grid container spacing={3}>
            {filteredPlanets.slice(0, 12).map((planet: Planet, index: number) => (
              <Grid item xs={12} md={4} key={`${planet.pl_name}-${index}`}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: theme.shadows[16],
                      bgcolor: 'primary.dark',
                      color: 'white'
                    }
                  }}
                  onClick={() => handlePlanetClick(planet)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {planet.pl_name}
                      </Typography>
                      <Chip
                        label="View 3D"
                        color="primary"
                        size="small"
                        variant="outlined"
                        icon={<Public />}
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
          
          {filteredPlanets.length > 12 && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing 12 of {filteredPlanets.length} planets. Use filters to refine your search.
              </Typography>
            </Box>
          )}
        </Paper>
      </Paper>
    </Container>
  );
};

export default PlanetExplorer;
