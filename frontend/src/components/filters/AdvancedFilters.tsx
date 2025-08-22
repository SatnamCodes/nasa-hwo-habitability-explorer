import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
} from '@mui/material';
import { FilterList, RestartAlt } from '@mui/icons-material';

interface FilterValues {
  temperatureRange: [number, number];
  radiusRange: [number, number];
  habitabilityThreshold: number;
  observabilityThreshold: number;
  discoveryMethod: string;
  dataQuality: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ onFilterChange, onReset }) => {
  const [filters, setFilters] = React.useState<FilterValues>({
    temperatureRange: [150, 350],
    radiusRange: [0.5, 2.5],
    habitabilityThreshold: 0.7,
    observabilityThreshold: 0.6,
    discoveryMethod: 'all',
    dataQuality: 'all',
  });

  const handleFilterChange = (newFilters: Partial<FilterValues>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          Advanced Filters
        </Typography>
        <Button
          startIcon={<RestartAlt />}
          onClick={onReset}
          size="small"
        >
          Reset
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Temperature Range (K)</Typography>
          <Slider
            value={filters.temperatureRange}
            onChange={(_, value) => handleFilterChange({ temperatureRange: value as [number, number] })}
            valueLabelDisplay="auto"
            min={100}
            max={500}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Planet Radius (Earth Radii)</Typography>
          <Slider
            value={filters.radiusRange}
            onChange={(_, value) => handleFilterChange({ radiusRange: value as [number, number] })}
            valueLabelDisplay="auto"
            min={0}
            max={5}
            step={0.1}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Minimum Habitability Score</Typography>
          <Slider
            value={filters.habitabilityThreshold}
            onChange={(_, value) => handleFilterChange({ habitabilityThreshold: value as number })}
            valueLabelDisplay="auto"
            min={0}
            max={1}
            step={0.1}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Minimum Observability Score</Typography>
          <Slider
            value={filters.observabilityThreshold}
            onChange={(_, value) => handleFilterChange({ observabilityThreshold: value as number })}
            valueLabelDisplay="auto"
            min={0}
            max={1}
            step={0.1}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Discovery Method</InputLabel>
            <Select
              value={filters.discoveryMethod}
              label="Discovery Method"
              onChange={(e) => handleFilterChange({ discoveryMethod: e.target.value })}
            >
              <MenuItem value="all">All Methods</MenuItem>
              <MenuItem value="transit">Transit</MenuItem>
              <MenuItem value="radial-velocity">Radial Velocity</MenuItem>
              <MenuItem value="imaging">Direct Imaging</MenuItem>
              <MenuItem value="astrometry">Astrometry</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Data Quality</InputLabel>
            <Select
              value={filters.dataQuality}
              label="Data Quality"
              onChange={(e) => handleFilterChange({ dataQuality: e.target.value })}
            >
              <MenuItem value="all">All Data</MenuItem>
              <MenuItem value="high">High Quality</MenuItem>
              <MenuItem value="medium">Medium Quality</MenuItem>
              <MenuItem value="low">Low Quality</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AdvancedFilters;
