import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  AutoFixHigh,
  SwapHoriz,
  Download
} from '@mui/icons-material';

interface ColumnMapping {
  csvColumn: string;
  mappedTo: string | null;
  confidence: number;
  samples: any[];
  status: 'mapped' | 'unmapped' | 'ambiguous';
}

interface CSVMappingDialogProps {
  open: boolean;
  onClose: () => void;
  csvData: any[];
  csvHeaders: string[];
  onMappingConfirm: (mapping: Record<string, string>) => void;
}

// Required fields for the system
const REQUIRED_FIELDS = [
  { key: 'name', label: 'Planet Name', description: 'Identifier for the planet' },
  { key: 'distance', label: 'Distance (pc)', description: 'Distance in parsecs' },
  { key: 'star_type', label: 'Star Type', description: 'Stellar classification (e.g., G2V, M3V)' },
  { key: 'planet_radius', label: 'Planet Radius', description: 'Radius in Earth or Jupiter radii' },
  { key: 'orbital_period', label: 'Orbital Period', description: 'Period in days' },
  { key: 'stellar_mass', label: 'Stellar Mass', description: 'Host star mass in solar masses' }
];

const OPTIONAL_FIELDS = [
  { key: 'planet_mass', label: 'Planet Mass', description: 'Mass in Earth masses' },
  { key: 'temperature', label: 'Temperature', description: 'Equilibrium temperature in Kelvin' },
  { key: 'discovery_year', label: 'Discovery Year', description: 'Year of discovery' },
  { key: 'detection_method', label: 'Detection Method', description: 'How the planet was detected' },
  { key: 'semi_major_axis', label: 'Semi-major Axis', description: 'Orbital distance in AU' },
  { key: 'eccentricity', label: 'Eccentricity', description: 'Orbital eccentricity (0-1)' },
  { key: 'inclination', label: 'Inclination', description: 'Orbital inclination in degrees' }
];

// Common synonyms for auto-detection
const COLUMN_SYNONYMS: Record<string, string[]> = {
  name: ['pl_name', 'planet_name', 'name', 'target_name', 'identifier', 'planet', 'object_name'],
  distance: ['sy_dist', 'distance_pc', 'distance', 'dist_pc', 'dist', 'parsecs', 'star_distance'],
  star_type: ['st_spectype', 'stellar_type', 'star_type', 'spectral_type', 'spec_type', 'star_class'],
  planet_radius: ['pl_rade', 'pl_radj', 'planet_radius', 'radius', 'pl_radius', 'radius_earth', 'planet_radius_earth'],
  orbital_period: ['pl_orbper', 'period', 'orbital_period', 'period_days', 'orbit_period'],
  stellar_mass: ['st_mass', 'stellar_mass', 'star_mass', 'host_mass', 'star_mass_solar'],
  planet_mass: ['pl_masse', 'pl_massj', 'planet_mass', 'mass', 'pl_mass', 'planet_mass_earth'],
  temperature: ['pl_eqt', 'temperature', 'temp', 'equilibrium_temperature', 'eq_temp'],
  discovery_year: ['disc_year', 'discovery_year', 'year', 'found_year'],
  detection_method: ['discoverymethod', 'detection_method', 'method', 'discovery_method'],
  semi_major_axis: ['pl_orbsmax', 'semi_major_axis', 'orbit_distance', 'sma', 'a'],
  eccentricity: ['pl_orbeccen', 'eccentricity', 'ecc', 'e'],
  inclination: ['pl_orbincl', 'inclination', 'inc', 'i']
};

// Fuzzy matching helper
const fuzzyMatch = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().replace(/[_\s-]/g, '');
  const s2 = str2.toLowerCase().replace(/[_\s-]/g, '');
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
};

// Auto-detect column mappings
const autoDetectMappings = (csvHeaders: string[], csvData: any[]): ColumnMapping[] => {
  const mappings: ColumnMapping[] = csvHeaders.map(header => {
    let bestMatchField: string | null = null;
    let bestMatchScore: number = 0;
    
    // Check against all field synonyms
    Object.entries(COLUMN_SYNONYMS).forEach(([field, synonyms]) => {
      synonyms.forEach(synonym => {
        const score = fuzzyMatch(header, synonym);
        if (score > 0.6 && score > bestMatchScore) {
          bestMatchField = field;
          bestMatchScore = score;
        }
      });
    });
    
    // Get sample values
    const samples = csvData.slice(0, 3).map(row => row[header]);
    
    return {
      csvColumn: header,
      mappedTo: bestMatchScore > 0.7 ? bestMatchField : null,
      confidence: bestMatchScore,
      samples,
      status: (bestMatchScore > 0.7 ? 'mapped' : 'unmapped') as 'mapped' | 'unmapped' | 'ambiguous'
    };
  });
  
  return mappings;
};

const CSVMappingDialog: React.FC<CSVMappingDialogProps> = ({
  open,
  onClose,
  csvData,
  csvHeaders,
  onMappingConfirm
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>(() => 
    autoDetectMappings(csvHeaders, csvData)
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate mappings
  const validateMappings = useCallback(() => {
    const errors: string[] = [];
    const currentMapping: Record<string, string> = {};
    
    mappings.forEach(m => {
      if (m.mappedTo) {
        currentMapping[m.mappedTo] = m.csvColumn;
      }
    });
    
    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!currentMapping[field.key]) {
        errors.push(`Required field "${field.label}" is not mapped`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [mappings]);

  React.useEffect(() => {
    validateMappings();
  }, [mappings, validateMappings]);

  const handleMappingChange = (csvColumn: string, newMapping: string | null) => {
    setMappings(prev => prev.map(m => 
      m.csvColumn === csvColumn 
        ? { ...m, mappedTo: newMapping, status: newMapping ? 'mapped' : 'unmapped' }
        : m
    ));
  };

  const handleAutoMap = () => {
    setMappings(autoDetectMappings(csvHeaders, csvData));
  };

  const handleConfirm = () => {
    if (!validateMappings()) {
      return;
    }
    
    const finalMapping: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.mappedTo) {
        finalMapping[m.mappedTo] = m.csvColumn;
      }
    });
    
    onMappingConfirm(finalMapping);
    onClose();
  };

  const mappedCount = mappings.filter(m => m.mappedTo).length;
  const requiredMappedCount = REQUIRED_FIELDS.filter(f => 
    mappings.some(m => m.mappedTo === f.key)
  ).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">CSV Column Mapping</Typography>
          <Chip 
            label={`${mappedCount}/${csvHeaders.length} columns mapped`}
            color={mappedCount === csvHeaders.length ? 'success' : 'warning'}
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color="success" />
                  <div>
                    <Typography variant="h6">{requiredMappedCount}/{REQUIRED_FIELDS.length}</Typography>
                    <Typography variant="caption">Required Fields</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Info color="info" />
                  <div>
                    <Typography variant="h6">{mappedCount - requiredMappedCount}</Typography>
                    <Typography variant="caption">Optional Fields</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Warning color="warning" />
                  <div>
                    <Typography variant="h6">{csvHeaders.length - mappedCount}</Typography>
                    <Typography variant="caption">Unmapped Columns</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Mapping Incomplete</AlertTitle>
            {validationErrors.map((error, i) => (
              <Typography key={i} variant="body2">• {error}</Typography>
            ))}
          </Alert>
        )}

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Mapping Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(requiredMappedCount / REQUIRED_FIELDS.length) * 100}
            color={requiredMappedCount === REQUIRED_FIELDS.length ? 'success' : 'primary'}
          />
        </Box>

        {/* Auto-map Button */}
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="outlined"
            startIcon={<AutoFixHigh />}
            onClick={handleAutoMap}
          >
            Auto-Detect Mappings
          </Button>
        </Box>

        {/* Mapping Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>CSV Column</TableCell>
                <TableCell>Sample Data</TableCell>
                <TableCell>Maps To</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {mapping.csvColumn}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      {mapping.samples.map((sample, i) => (
                        <Typography key={i} variant="caption" display="block">
                          {String(sample).substring(0, 30)}
                          {String(sample).length > 30 ? '...' : ''}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={mapping.mappedTo || ''}
                        onChange={(e) => handleMappingChange(
                          mapping.csvColumn, 
                          e.target.value || null
                        )}
                      >
                        <MenuItem value="">
                          <em>Not mapped</em>
                        </MenuItem>
                        
                        <MenuItem disabled>
                          <Typography variant="caption" color="textSecondary">
                            Required Fields
                          </Typography>
                        </MenuItem>
                        {REQUIRED_FIELDS.map(field => (
                          <MenuItem key={field.key} value={field.key}>
                            <Tooltip title={field.description} placement="left">
                              <span>{field.label}</span>
                            </Tooltip>
                          </MenuItem>
                        ))}
                        
                        <MenuItem disabled>
                          <Typography variant="caption" color="textSecondary">
                            Optional Fields
                          </Typography>
                        </MenuItem>
                        {OPTIONAL_FIELDS.map(field => (
                          <MenuItem key={field.key} value={field.key}>
                            <Tooltip title={field.description} placement="left">
                              <span>{field.label}</span>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  
                  <TableCell>
                    {mapping.confidence > 0 && (
                      <Chip
                        size="small"
                        label={`${Math.round(mapping.confidence * 100)}%`}
                        color={
                          mapping.confidence > 0.8 ? 'success' : 
                          mapping.confidence > 0.6 ? 'warning' : 'default'
                        }
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {mapping.status === 'mapped' ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : mapping.status === 'ambiguous' ? (
                      <Warning color="warning" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
          disabled={validationErrors.length > 0}
        >
          Confirm Mapping & Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CSVMappingDialog;
