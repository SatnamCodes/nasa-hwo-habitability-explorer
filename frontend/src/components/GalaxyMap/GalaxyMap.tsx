import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Search, 
  FilterList, 
  ExpandMore, 
  Clear,
  Visibility,
  VisibilityOff 
} from '@mui/icons-material';
import './GalaxyMap.css';
import useGalaxyMap from '../../hooks/useGalaxyMap';
import { Planet } from '../../services/localData';
import Planet3DModal from '../Planet3DModal';

interface GalaxyMapFilters {
  searchQuery: string;
  starTypes: string[];
  distanceRange: [number, number];
  radiusRange: [number, number];
  habitabilityMin: number;
  showOrbits: boolean;
  discoveryYearRange: [number, number];
}

const GalaxyMap: React.FC = () => {
  const { mapContainerRef, planetCount, loading, selectedPlanet, onPlanetModalClose, planets } = useGalaxyMap();
  
  // Filter states
  const [filters, setFilters] = useState<GalaxyMapFilters>({
    searchQuery: '',
    starTypes: [],
    distanceRange: [0, 1000],
    radiusRange: [0, 10],
    habitabilityMin: 0,
    showOrbits: false,
    discoveryYearRange: [1995, 2024]
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [filteredPlanetCount, setFilteredPlanetCount] = useState(0);

  // Apply filters to planets
  const applyFilters = useCallback(() => {
    if (!planets) return;
    
    let filtered = planets.filter((planet: any) => {
      // Search query filter
      if (filters.searchQuery && !planet.pl_name?.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      // Star type filter
      if (filters.starTypes.length > 0 && !filters.starTypes.includes(planet.st_spectype || 'Unknown')) {
        return false;
      }
      
      // Distance filter
      const distance = planet.sy_dist || 0;
      if (distance < filters.distanceRange[0] || distance > filters.distanceRange[1]) {
        return false;
      }
      
      // Radius filter
      const radius = planet.pl_rade || 0;
      if (radius < filters.radiusRange[0] || radius > filters.radiusRange[1]) {
        return false;
      }
      
      // Discovery year filter
      const year = planet.disc_year || 2000;
      if (year < filters.discoveryYearRange[0] || year > filters.discoveryYearRange[1]) {
        return false;
      }
      
      return true;
    });
    
    setFilteredPlanetCount(filtered.length);
    // Here you would update the 3D scene to show only filtered planets
    // This would require updating the useGalaxyMap hook to accept filtered data
  }, [planets, filters]);

  React.useEffect(() => {
    applyFilters();
  }, [filters, planets, applyFilters]);

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      starTypes: [],
      distanceRange: [0, 1000],
      radiusRange: [0, 10],
      habitabilityMin: 0,
      showOrbits: false,
      discoveryYearRange: [1995, 2024]
    });
  };

  const uniqueStarTypes = React.useMemo(() => {
    if (!planets) return [];
    const types = planets.map((p: any) => p.st_spectype).filter(Boolean);
    return Array.from(new Set(types)).sort() as string[];
  }, [planets]);

  return (
    <Box className="galaxy-map-container" position="relative">
      {/* 3D Planet Modal */}
      <Planet3DModal
        planet={selectedPlanet}
        open={!!selectedPlanet}
        onClose={onPlanetModalClose}
      />
      
      <div ref={mapContainerRef} className="galaxy-map-canvas" />
      
      {/* Search and Filter Controls */}
      <Paper 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          p: 2, 
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          minWidth: 320,
          maxWidth: 400
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            3D Galaxy Explorer
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setShowFilters(!showFilters)}
            sx={{ color: 'white' }}
          >
            <FilterList />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search planets..."
          value={filters.searchQuery}
          onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
          InputProps={{
            startAdornment: <Search sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />,
            endAdornment: filters.searchQuery && (
              <IconButton 
                size="small" 
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                sx={{ color: 'white' }}
              >
                <Clear />
              </IconButton>
            ),
            sx: { 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: 'white',
              '& input': { color: 'white' }
            }
          }}
          sx={{ mb: 2 }}
        />

        {/* Planet Count Display */}
        {loading ? (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading planets...</Typography>
          </Box>
        ) : (
          <Box mb={2}>
            <Typography variant="body2">
              Showing {filteredPlanetCount} of {planetCount} exoplanets
            </Typography>
            {filters.searchQuery && (
              <Chip 
                label={`Search: "${filters.searchQuery}"`}
                size="small"
                onDelete={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                sx={{ mt: 1, mr: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
            )}
          </Box>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <Accordion 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: 'white',
              mb: 2
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="subtitle2">Advanced Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {/* Star Types Filter */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: 'white' }}>Star Types</InputLabel>
                  <Select
                    multiple
                    value={filters.starTypes}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      starTypes: Array.isArray(e.target.value) ? e.target.value : [] 
                    }))}
                    renderValue={(selected) => (
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                    sx={{ 
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    {uniqueStarTypes.map((type: string) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Distance Range */}
                <Typography variant="body2" gutterBottom>
                  Distance Range (ly): {filters.distanceRange[0]} - {filters.distanceRange[1]}
                </Typography>
                <Slider
                  value={filters.distanceRange}
                  onChange={(_, value) => setFilters(prev => ({ 
                    ...prev, 
                    distanceRange: value as [number, number] 
                  }))}
                  min={0}
                  max={1000}
                  valueLabelDisplay="auto"
                  sx={{ mb: 2, color: 'white' }}
                />

                {/* Planet Radius Range */}
                <Typography variant="body2" gutterBottom>
                  Planet Radius (Earth radii): {filters.radiusRange[0]} - {filters.radiusRange[1]}
                </Typography>
                <Slider
                  value={filters.radiusRange}
                  onChange={(_, value) => setFilters(prev => ({ 
                    ...prev, 
                    radiusRange: value as [number, number] 
                  }))}
                  min={0}
                  max={10}
                  step={0.1}
                  valueLabelDisplay="auto"
                  sx={{ mb: 2, color: 'white' }}
                />

                {/* Discovery Year Range */}
                <Typography variant="body2" gutterBottom>
                  Discovery Year: {filters.discoveryYearRange[0]} - {filters.discoveryYearRange[1]}
                </Typography>
                <Slider
                  value={filters.discoveryYearRange}
                  onChange={(_, value) => setFilters(prev => ({ 
                    ...prev, 
                    discoveryYearRange: value as [number, number] 
                  }))}
                  min={1995}
                  max={2024}
                  valueLabelDisplay="auto"
                  sx={{ mb: 2, color: 'white' }}
                />

                {/* Show Orbits Toggle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showOrbits}
                      onChange={(e) => setFilters(prev => ({ ...prev, showOrbits: e.target.checked }))}
                      sx={{ 
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { 
                          backgroundColor: 'rgba(255,255,255,0.5)' 
                        }
                      }}
                    />
                  }
                  label="Show Orbital Paths"
                  sx={{ color: 'white', mb: 2 }}
                />

                {/* Clear Filters Button */}
                <Box textAlign="center">
                  <IconButton onClick={clearFilters} sx={{ color: 'white' }}>
                    <Clear />
                  </IconButton>
                  <Typography variant="caption" display="block">
                    Clear All Filters
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        <Typography variant="body2" sx={{ mt: 1 }}>
          🖱️ Click planets for detailed 3D view with orbital data
        </Typography>
      </Paper>

      {/* Enhanced Controls Info */}
      <Paper 
        sx={{ 
          position: 'absolute', 
          bottom: 16, 
          right: 16, 
          p: 2, 
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          maxWidth: 320
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Navigation Controls:
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>Mouse Drag:</strong> Rotate galaxy view<br />
          • <strong>Mouse Wheel:</strong> Zoom in/out<br />
          • <strong>Click Planet:</strong> View 3D details & orbital data<br />
          • <strong>Double Click:</strong> Focus on planet<br />
          • <strong>Right Click:</strong> Reset view
        </Typography>
        
        {filters.showOrbits && (
          <Box mt={1} p={1} sx={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
            <Typography variant="caption" color="lightgreen">
              ✨ Orbital paths enabled - see planet trajectories around their stars
            </Typography>
          </Box>
        )}

        <Box mt={2} display="flex" alignItems="center" gap={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#4CAF50' 
              }} 
            />
            <Typography variant="caption">Habitable Zone</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#FF9800' 
              }} 
            />
            <Typography variant="caption">Hot Planet</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#2196F3' 
              }} 
            />
            <Typography variant="caption">Cold Planet</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default GalaxyMap;
