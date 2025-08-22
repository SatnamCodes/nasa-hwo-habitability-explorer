import React, { useState } from 'react';
import { 
    Button, 
    Box, 
    LinearProgress, 
    Typography, 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    FormControl,
    InputLabel,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    Chip,
    SelectChangeEvent
} from '@mui/material';
import { apiService } from '../../services/api';
import { hwoApiService } from '../../services/hwoApiService';

interface ColumnMapping {
    [csvColumn: string]: string;
}

interface PreviewData {
    headers: string[];
    sample: any[];
}

const REQUIRED_COLUMNS = {
    'pl_name': 'Planet Name',
    'pl_orbsmax': 'Semi-major Axis (AU) [or pl_orbper for orbital period]',
    'sy_dist': 'System Distance (parsecs)',
    'pl_rade': 'Planet Radius (Earth radii)',
};

const OPTIONAL_COLUMNS = {
    'pl_orbper': 'Orbital Period (days)',
    'pl_masse': 'Planet Mass (Earth masses)',
    'st_teff': 'Stellar Temperature (K)',
    'st_rad': 'Stellar Radius (Solar radii)',
    'st_mass': 'Stellar Mass (Solar masses)',
};

const CSVUpload: React.FC<{ onResult?: (res: any) => void }> = ({ onResult }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [showMappingDialog, setShowMappingDialog] = useState(false);
    const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
    const [mappingError, setMappingError] = useState<string>('');

    const parseCSVPreview = async (file: File): Promise<PreviewData> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());
                    if (lines.length < 2) {
                        throw new Error('CSV must have at least a header row and one data row');
                    }
                    
                    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
                    const sample = lines.slice(1, 6).map(line => {
                        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
                        const row: any = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index] || '';
                        });
                        return row;
                    });
                    
                    resolve({ headers, sample });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        
        if (selectedFile) {
            try {
                setLoading(true);
                const preview = await parseCSVPreview(selectedFile);
                setPreviewData(preview);
                
                // Auto-detect column mappings
                const autoMapping: ColumnMapping = {};
                Object.keys(REQUIRED_COLUMNS).forEach(reqCol => {
                    const match = preview.headers.find(h => 
                        h.toLowerCase().includes(reqCol.toLowerCase()) ||
                        reqCol.toLowerCase().includes(h.toLowerCase())
                    );
                    if (match) autoMapping[match] = reqCol;
                });
                
                // Also check for common variations
                const variations: { [key: string]: string[] } = {
                    'pl_name': ['name', 'planet_name', 'planet', 'pl_name'],
                    'pl_orbsmax': ['sma', 'semi_major_axis', 'pl_orbsmax', 'orbit_sma'],
                    'sy_dist': ['distance', 'dist', 'sy_dist', 'star_distance', 'stellar_distance'],
                    'pl_rade': ['radius', 'pl_rade', 'planet_radius', 'r_earth'],
                    'pl_orbper': ['period', 'orbital_period', 'pl_orbper', 'orbit_period'],
                };
                
                Object.entries(variations).forEach(([targetCol, variants]) => {
                    if (!Object.values(autoMapping).includes(targetCol)) {
                        const match = preview.headers.find(h => 
                            variants.some(v => h.toLowerCase().includes(v.toLowerCase()))
                        );
                        if (match) autoMapping[match] = targetCol;
                    }
                });
                
                setColumnMapping(autoMapping);
                setShowMappingDialog(true);
            } catch (error) {
                console.error('Failed to parse CSV preview:', error);
                alert('Failed to parse CSV file. Please check the format.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleMappingChange = (csvColumn: string) => (event: SelectChangeEvent<string>) => {
        const targetColumn = event.target.value;
        setColumnMapping(prev => {
            const newMapping = { ...prev };
            
            // Remove this target column from any other mappings
            Object.keys(newMapping).forEach(key => {
                if (newMapping[key] === targetColumn && key !== csvColumn) {
                    delete newMapping[key];
                }
            });
            
            if (targetColumn === '') {
                delete newMapping[csvColumn];
            } else {
                newMapping[csvColumn] = targetColumn;
            }
            
            return newMapping;
        });
        setMappingError('');
    };

    const validateMapping = (): boolean => {
        const mappedTargets = Object.values(columnMapping);
        const requiredFields = Object.keys(REQUIRED_COLUMNS);
        
        // Check if we have planet name
        if (!mappedTargets.includes('pl_name')) {
            setMappingError('Planet name is required');
            return false;
        }
        
        // Check if we have either semi-major axis OR orbital period
        const hasSMA = mappedTargets.includes('pl_orbsmax');
        const hasPeriod = mappedTargets.includes('pl_orbper');
        if (!hasSMA && !hasPeriod) {
            setMappingError('Either Semi-major axis (pl_orbsmax) or Orbital period (pl_orbper) is required');
            return false;
        }
        
        // Check for distance and radius
        if (!mappedTargets.includes('sy_dist')) {
            setMappingError('System distance is required');
            return false;
        }
        
        if (!mappedTargets.includes('pl_rade')) {
            setMappingError('Planet radius is required');
            return false;
        }
        
        return true;
    };

    const createMappedCSV = (): File => {
        if (!file || !previewData) throw new Error('No file or preview data');
        
        return new Promise<File>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());
                    const originalHeaders = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
                    
                    // Create new headers based on mapping
                    const newHeaders = Object.keys({ ...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS });
                    
                    // Create mapped data
                    const mappedLines = [newHeaders.join(',')];
                    
                    lines.slice(1).forEach(line => {
                        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
                        const originalRow: any = {};
                        originalHeaders.forEach((header, index) => {
                            originalRow[header] = values[index] || '';
                        });
                        
                        const mappedRow: any = {};
                        newHeaders.forEach(newHeader => {
                            mappedRow[newHeader] = '';
                        });
                        
                        // Apply column mapping
                        Object.entries(columnMapping).forEach(([csvCol, targetCol]) => {
                            if (originalRow[csvCol] !== undefined) {
                                mappedRow[targetCol] = originalRow[csvCol];
                            }
                        });
                        
                        const mappedLine = newHeaders.map(h => mappedRow[h] || '').join(',');
                        mappedLines.push(mappedLine);
                    });
                    
                    const mappedText = mappedLines.join('\n');
                    const blob = new Blob([mappedText], { type: 'text/csv' });
                    const mappedFile = new File([blob], file.name, { type: 'text/csv' });
                    resolve(mappedFile);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        }) as any;
    };

    const handleSubmit = async () => {
        if (!validateMapping()) return;
        
        try {
            setLoading(true);
            
            // Use the original file directly with HWO API service for intelligent column detection
            if (!file) throw new Error('No file selected');
            
            const res = await hwoApiService.uploadCsvTargets(file);
            
            // Transform the results to match what the dashboard expects
            const transformedResults = res.results.map((result, index) => {
                // Use original data if available, otherwise use estimates
                const originalData = result.original_data || {};
                
                return {
                    id: result.target_name.replace(/\s+/g, '-').toLowerCase() + '-' + index,
                    name: result.target_name,
                    // Use original data when available
                    distance: parseFloat(originalData.distance || originalData.sy_dist || originalData.dist) || 
                             Math.max(5, 50 - (result.detailed_scores.distance_factor * 45 / 100)),
                    starType: originalData.star_type || originalData.st_spectype || 
                             (result.detailed_scores.star_type_factor > 80 ? 'G' : 
                              result.detailed_scores.star_type_factor > 60 ? 'K' : 'M'),
                    planetRadius: parseFloat(originalData.planet_radius || originalData.pl_rade) || 
                                 Math.max(0.5, result.detailed_scores.planet_size_factor * 3 / 100),
                    orbitalPeriod: parseFloat(originalData.orbital_period || originalData.pl_orbper) || 
                                  Math.max(10, 365 * (2 - result.detailed_scores.distance_factor / 100)),
                    stellarMass: parseFloat(originalData.stellar_mass || originalData.st_mass) || 1.0,
                    planetMass: parseFloat(originalData.planet_mass || originalData.pl_masse) || 
                               Math.max(0.1, result.detailed_scores.planet_size_factor * 10 / 100),
                    temperature: parseFloat(originalData.temperature || originalData.pl_eqt) || 
                                Math.max(200, 400 - (result.detailed_scores.distance_factor * 200 / 100)),
                    characterizationScore: result.characterization_score,
                    habitabilityScore: result.habitability_score,
                    aiConfidence: result.ai_confidence,
                    observationPriority: result.observation_priority,
                    dataQuality: originalData.data_quality || 
                                (result.detailed_scores.data_quality_factor > 70 ? 'High' : 
                                 result.detailed_scores.data_quality_factor > 50 ? 'Medium' : 'Low'),
                    discoveryYear: parseInt(originalData.discovery_year || originalData.disc_year) || 2023,
                    detectionMethod: originalData.detection_method || originalData.discoverymethod || 'Transit',
                    mlPredictions: result.ml_predictions
                };
            });
            
            onResult && onResult(transformedResults);
            setShowMappingDialog(false);
            
        } catch (e) {
            console.error('Upload failed:', e);
            alert('Upload failed: ' + (e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const getMappedColumns = () => Object.values(columnMapping);
    const getUnmappedRequired = () => {
        const mapped = getMappedColumns();
        return Object.keys(REQUIRED_COLUMNS).filter(col => 
            !mapped.includes(col) && !(col === 'pl_orbsmax' && mapped.includes('pl_orbper'))
        );
    };

    return (
        <>
            <Box sx={{ mt: 2 }}>
                <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="csv-upload-input"
                />
                <label htmlFor="csv-upload-input">
                    <Button variant="outlined" component="span" disabled={loading}>
                        Select CSV File
                    </Button>
                </label>
                {file && (
                    <Chip 
                        label={file.name} 
                        onDelete={() => {
                            setFile(null);
                            setPreviewData(null);
                            setColumnMapping({});
                        }}
                        sx={{ ml: 2 }}
                    />
                )}
                {loading && <LinearProgress sx={{ mt: 2 }} />}
                {!loading && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Upload a CSV of exoplanet targets for batch observability scoring. 
                        After selecting a file, you'll be able to map your CSV columns to the required format.
                    </Typography>
                )}
            </Box>

            <Dialog 
                open={showMappingDialog} 
                onClose={() => setShowMappingDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Map CSV Columns</DialogTitle>
                <DialogContent>
                    {mappingError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{mappingError}</Alert>
                    )}
                    
                    <Typography variant="h6" sx={{ mb: 2 }}>Column Mapping</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Map your CSV columns to the expected format. Required fields are marked with *.
                    </Typography>

                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Your CSV Column</TableCell>
                                    <TableCell>Sample Data</TableCell>
                                    <TableCell>Map To</TableCell>
                                    <TableCell>Description</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {previewData?.headers.map(csvColumn => (
                                    <TableRow key={csvColumn}>
                                        <TableCell>
                                            <strong>{csvColumn}</strong>
                                        </TableCell>
                                        <TableCell>
                                            {previewData.sample[0]?.[csvColumn] || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                                <Select
                                                    value={columnMapping[csvColumn] || ''}
                                                    onChange={handleMappingChange(csvColumn)}
                                                >
                                                    <MenuItem value="">
                                                        <em>Don't use this column</em>
                                                    </MenuItem>
                                                    {Object.entries(REQUIRED_COLUMNS).map(([key, description]) => (
                                                        <MenuItem key={key} value={key}>
                                                            {key} *
                                                        </MenuItem>
                                                    ))}
                                                    {Object.entries(OPTIONAL_COLUMNS).map(([key, description]) => (
                                                        <MenuItem key={key} value={key}>
                                                            {key}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            {columnMapping[csvColumn] && (
                                                <>
                                                    {REQUIRED_COLUMNS[columnMapping[csvColumn] as keyof typeof REQUIRED_COLUMNS] ||
                                                     OPTIONAL_COLUMNS[columnMapping[csvColumn] as keyof typeof OPTIONAL_COLUMNS]}
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Mapping Status:</Typography>
                        <Box sx={{ mt: 1 }}>
                            {Object.entries(REQUIRED_COLUMNS).map(([key, desc]) => {
                                const isMapped = getMappedColumns().includes(key);
                                const isOptional = key === 'pl_orbsmax' && getMappedColumns().includes('pl_orbper');
                                return (
                                    <Chip
                                        key={key}
                                        label={`${key} *`}
                                        color={isMapped || isOptional ? 'success' : 'error'}
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>

                    {previewData && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6">Data Preview</Typography>
                            <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 200 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            {previewData.headers.slice(0, 5).map(header => (
                                                <TableCell key={header}>{header}</TableCell>
                                            ))}
                                            {previewData.headers.length > 5 && <TableCell>...</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previewData.sample.map((row, index) => (
                                            <TableRow key={index}>
                                                {previewData.headers.slice(0, 5).map(header => (
                                                    <TableCell key={`${index}-${header}`}>
                                                        {row[header]}
                                                    </TableCell>
                                                ))}
                                                {previewData.headers.length > 5 && <TableCell>...</TableCell>}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowMappingDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={loading || getUnmappedRequired().length > 0}
                    >
                        {loading ? 'Uploading...' : 'Upload & Score'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CSVUpload;
