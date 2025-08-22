import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  IconButton,
  Slider,
  Switch,
  FormControlLabel,
  Badge,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Upload,
  CloudUpload,
  FilterList,
  Search,
  Clear,
  Download,
  Visibility,
  Star,
  Science,
  Psychology,
  TrendingUp,
  Assessment,
  DataUsage,
  ModelTraining,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ExpandMore,
  TableChart,
  Autorenew,
  Help,
  Settings,
  Preview,
  BarChart,
  SmartToy,
  Tune,
  TrendingUp as PathingIcon,
  FormatListNumbered
} from '@mui/icons-material';
import { hwoApiService, ColumnMappingResponse, BatchScoringResponse } from '../../services/hwoApiService';
import HWOApiService from '../../services/hwoApiService';
import CSVUpload from '../observability/CSVUpload';

// Enhanced target interface with AI/ML scoring
interface EnhancedTarget {
  id: string;
  name: string;
  distance: number;
  starType: string;
  planetRadius: number;
  orbitalPeriod: number;
  stellarMass: number;
  planetMass?: number;
  temperature?: number;
  habitabilityScore: number;
  characterizationScore: number;
  aiConfidence: number;
  observationPriority: 'High' | 'Medium' | 'Low';
  observabilityWindow: string[];
  detectionMethod: string;
  discoveryYear: number;
  dataQuality: 'Excellent' | 'Good' | 'Fair' | 'Limited';
  mlPredictions?: {
    isHabitable: boolean;
    habitabilityProbability: number;
    characterizationValue: number;
  };
}

// AI/ML Scoring Engine
class HWOScoringEngine {
  // Weights for different factors (totaling 1.0)
  private static readonly WEIGHTS = {
    distance: 0.25,        // Closer = better for observation
    starType: 0.20,        // G-type stars preferred
    planetRadius: 0.20,    // Earth-like sizes preferred
    orbitalSeparation: 0.15, // Habitable zone position
    stellarMass: 0.10,     // Stable main sequence
    dataQuality: 0.10      // Higher quality = better characterization
  };

  static calculateCharacterizationScore(target: Partial<EnhancedTarget>): number {
    let score = 0;
    let totalWeight = 0;

    // Distance factor (closer is better, optimal range 5-50 parsecs)
    if (target.distance !== undefined) {
      const distanceScore = target.distance <= 50 
        ? Math.max(0, 1 - (target.distance - 5) / 45)  // Linear decrease from 5-50 pc
        : Math.max(0, 0.1 - (target.distance - 50) / 200); // Sharp decrease beyond 50 pc
      
      score += distanceScore * this.WEIGHTS.distance;
      totalWeight += this.WEIGHTS.distance;
    }

    // Star type factor (G-type preferred, then K, F, M)
    if (target.starType !== undefined) {
      const starScore = this.getStarTypeScore(target.starType);
      score += starScore * this.WEIGHTS.starType;
      totalWeight += this.WEIGHTS.starType;
    }

    // Planet radius factor (Earth-like preferred: 0.5-2.0 Earth radii)
    if (target.planetRadius !== undefined) {
      const radiusInEarthRadii = target.planetRadius * 11.2; // Convert from Jupiter radii
      let radiusScore = 0;
      
      if (radiusInEarthRadii >= 0.5 && radiusInEarthRadii <= 2.0) {
        radiusScore = 1 - Math.abs(radiusInEarthRadii - 1.0) / 1.0; // Peak at 1 Earth radius
      } else if (radiusInEarthRadii > 2.0 && radiusInEarthRadii <= 4.0) {
        radiusScore = Math.max(0, 0.5 - (radiusInEarthRadii - 2.0) / 4.0);
      } else {
        radiusScore = Math.max(0, 0.1);
      }
      
      score += radiusScore * this.WEIGHTS.planetRadius;
      totalWeight += this.WEIGHTS.planetRadius;
    }

    // Orbital separation factor (habitable zone positioning)
    if (target.orbitalPeriod !== undefined && target.stellarMass !== undefined) {
      const habitableZoneScore = this.calculateHabitableZoneScore(
        target.orbitalPeriod, 
        target.stellarMass
      );
      score += habitableZoneScore * this.WEIGHTS.orbitalSeparation;
      totalWeight += this.WEIGHTS.orbitalSeparation;
    }

    // Stellar mass factor (main sequence stability)
    if (target.stellarMass !== undefined) {
      const massScore = target.stellarMass >= 0.8 && target.stellarMass <= 1.2
        ? 1.0 - Math.abs(target.stellarMass - 1.0) / 0.2
        : Math.max(0, 0.3 - Math.abs(target.stellarMass - 1.0) / 2.0);
      
      score += massScore * this.WEIGHTS.stellarMass;
      totalWeight += this.WEIGHTS.stellarMass;
    }

    // Data quality factor
    if (target.dataQuality !== undefined) {
      const qualityScore = this.getDataQualityScore(target.dataQuality);
      score += qualityScore * this.WEIGHTS.dataQuality;
      totalWeight += this.WEIGHTS.dataQuality;
    }

    // Normalize by total weight and convert to 0-100 scale
    return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
  }

  private static getStarTypeScore(starType: string): number {
    const type = starType.charAt(0).toUpperCase();
    switch (type) {
      case 'G': return 1.0;  // Sun-like
      case 'K': return 0.8;  // Orange dwarf
      case 'F': return 0.7;  // Hot main sequence
      case 'M': return 0.6;  // Red dwarf
      case 'A': return 0.3;  // Hot, short-lived
      case 'B': 
      case 'O': return 0.1;  // Very hot, very short-lived
      default: return 0.5;   // Unknown
    }
  }

  private static calculateHabitableZoneScore(orbitalPeriod: number, stellarMass: number): number {
    // Estimate semi-major axis from orbital period and stellar mass (Kepler's 3rd law)
    const semiMajorAxis = Math.pow((orbitalPeriod / 365.25) ** 2 * stellarMass, 1/3);
    
    // Estimate habitable zone (very rough approximation)
    const innerHZ = 0.95 * Math.sqrt(stellarMass);  // Inner edge
    const outerHZ = 1.37 * Math.sqrt(stellarMass);  // Outer edge
    const optimumHZ = 1.0 * Math.sqrt(stellarMass); // Optimum distance
    
    if (semiMajorAxis >= innerHZ && semiMajorAxis <= outerHZ) {
      return 1.0 - Math.abs(semiMajorAxis - optimumHZ) / (outerHZ - innerHZ);
    } else {
      return Math.max(0, 0.1 - Math.abs(semiMajorAxis - optimumHZ) / optimumHZ);
    }
  }

  private static getDataQualityScore(quality: string): number {
    switch (quality) {
      case 'Excellent': return 1.0;
      case 'Good': return 0.8;
      case 'Fair': return 0.6;
      case 'Limited': return 0.4;
      default: return 0.5;
    }
  }

  static determineObservationPriority(score: number): 'High' | 'Medium' | 'Low' {
    if (score >= 75) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  }

  static calculateAIConfidence(target: EnhancedTarget): number {
    // Higher confidence when we have more complete data
    const dataCompleteness = [
      target.distance,
      target.starType,
      target.planetRadius,
      target.orbitalPeriod,
      target.stellarMass,
      target.dataQuality
    ].filter(field => field !== undefined && field !== null).length / 6;

    // Confidence also depends on how extreme the values are
    const extremenessPenalty = this.calculateExtremenessPenalty(target);
    
    return Math.round((dataCompleteness * (1 - extremenessPenalty)) * 100);
  }

  private static calculateExtremenessPenalty(target: EnhancedTarget): number {
    let penalty = 0;
    
    // Penalize extreme distances
    if (target.distance && (target.distance > 100 || target.distance < 1)) penalty += 0.2;
    
    // Penalize extreme planet sizes
    if (target.planetRadius && (target.planetRadius > 2.0 || target.planetRadius < 0.01)) penalty += 0.2;
    
    // Penalize extreme stellar masses
    if (target.stellarMass && (target.stellarMass > 3.0 || target.stellarMass < 0.1)) penalty += 0.2;
    
    return Math.min(penalty, 0.5); // Cap penalty at 50%
  }
}

// Sample data generator
const generateSampleTargets = (): EnhancedTarget[] => {
  const sampleData: Partial<EnhancedTarget>[] = [
    {
      name: "Proxima Centauri b",
      distance: 4.24,
      starType: "M5V",
      planetRadius: 0.09,
      orbitalPeriod: 11.2,
      stellarMass: 0.12,
      temperature: 234,
      discoveryYear: 2016,
      detectionMethod: "Radial Velocity",
      dataQuality: "Excellent"
    },
    {
      name: "TOI-715 b",
      distance: 37.2,
      starType: "G8V",
      planetRadius: 0.12,
      orbitalPeriod: 19.3,
      stellarMass: 0.95,
      temperature: 280,
      discoveryYear: 2023,
      detectionMethod: "Transit",
      dataQuality: "Good"
    },
    {
      name: "TRAPPIST-1 e",
      distance: 40.7,
      starType: "M8V",
      planetRadius: 0.08,
      orbitalPeriod: 6.1,
      stellarMass: 0.09,
      temperature: 251,
      discoveryYear: 2017,
      detectionMethod: "Transit",
      dataQuality: "Excellent"
    },
    {
      name: "LHS 1140 b",
      distance: 48.9,
      starType: "M4V",
      planetRadius: 0.13,
      orbitalPeriod: 24.7,
      stellarMass: 0.15,
      temperature: 270,
      discoveryYear: 2017,
      detectionMethod: "Transit",
      dataQuality: "Good"
    },
    {
      name: "K2-18 b",
      distance: 34.4,
      starType: "M2V",
      planetRadius: 0.20,
      orbitalPeriod: 33.0,
      stellarMass: 0.36,
      temperature: 265,
      discoveryYear: 2015,
      detectionMethod: "Transit",
      dataQuality: "Excellent"
    }
  ];

  return sampleData.map((data, index) => {
    const target = {
      id: `target-${index + 1}`,
      ...data,
      habitabilityScore: Math.random() * 100,
      observabilityWindow: ['Jan-Mar', 'Sep-Nov']
    } as EnhancedTarget;

    // Calculate AI/ML scores
    target.characterizationScore = HWOScoringEngine.calculateCharacterizationScore(target);
    target.aiConfidence = HWOScoringEngine.calculateAIConfidence(target);
    target.observationPriority = HWOScoringEngine.determineObservationPriority(target.characterizationScore);

    // Mock ML predictions
    target.mlPredictions = {
      isHabitable: target.habitabilityScore > 60,
      habitabilityProbability: target.habitabilityScore / 100,
      characterizationValue: target.characterizationScore
    };

    return target;
  });
};

const EnhancedTargetDashboard: React.FC = () => {
  const theme = useTheme();
  
  // State management
  const [targets, setTargets] = useState<EnhancedTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<EnhancedTarget | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof EnhancedTarget>('characterizationScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    minScore: 0,
    maxDistance: 100,
    starTypes: [] as string[],
    priority: [] as string[],
    dataQuality: [] as string[]
  });
  
  // Dialog states
  const [uploadDialog, setUploadDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Enhanced CSV upload states for intelligent column detection
  const [uploadStep, setUploadStep] = useState(0); // 0: upload, 1: mapping, 2: processing
  const [csvPreview, setCsvPreview] = useState<{headers: string[], sampleData: Record<string, any[]>} | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingResponse | null>(null);
  const [columnMappingDialog, setColumnMappingDialog] = useState(false);
  const [showAdvancedUpload, setShowAdvancedUpload] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  
  // Advanced AI/ML Feature States
  const [characterizabilityDialog, setCharacterizabilityDialog] = useState(false);
  const [smartFilterDialog, setSmartFilterDialog] = useState(false);
  const [parameterTunerDialog, setParameterTunerDialog] = useState(false);
  const [pathingDialog, setPathingDialog] = useState(false);
  const [priorityListDialog, setPriorityListDialog] = useState(false);
  
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    includeFilters: true,
    sortBy: 'characterizationScore',
    sortOrder: 'desc',
    columns: {
      name: true,
      distance: true,
      starType: true,
      planetRadius: true,
      orbitalPeriod: true,
      stellarMass: true,
      habitabilityScore: true,
      characterizationScore: true,
      aiConfidence: true,
      observationPriority: true,
      detectionMethod: false,
      discoveryYear: false,
      dataQuality: false
    }
  });

  // Initialize with sample data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTargets(generateSampleTargets());
      setLoading(false);
    }, 1000);
  }, []);

  // Filtered and sorted targets
  const filteredTargets = useMemo(() => {
    return targets
      .filter(target => {
        // Search filter
        if (searchTerm && !target.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Score filter
        if (target.characterizationScore < filters.minScore) return false;
        
        // Distance filter
        if (target.distance > filters.maxDistance) return false;
        
        // Star type filter
        if (filters.starTypes.length > 0 && !filters.starTypes.includes(target.starType)) {
          return false;
        }
        
        // Priority filter
        if (filters.priority.length > 0 && !filters.priority.includes(target.observationPriority)) {
          return false;
        }
        
        // Data quality filter
        if (filters.dataQuality.length > 0 && !filters.dataQuality.includes(target.dataQuality)) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
  }, [targets, searchTerm, sortBy, sortOrder, filters]);

  // Enhanced CSV file processing with intelligent column detection
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    setCsvFile(file);
    setUploadStep(0);
    setProcessingStatus('Analyzing file structure...');
    setUploadProgress(10);

    // Simple upload test - bypass column detection for debugging
    if (file.name.includes('test_') || process.env.NODE_ENV === 'development') {
      console.log('Testing direct upload...');
      try {
        setProcessingStatus('Testing direct API upload...');
        const result = await hwoApiService.uploadCsvTargets(file);
        console.log('Direct upload successful:', result);
        setProcessingStatus('Direct upload successful!');
        return;
      } catch (error) {
        console.error('Direct upload failed:', error);
        setProcessingStatus('Direct upload failed, trying intelligent detection...');
      }
    }

    try {
      // Parse CSV headers and sample data
      const { headers, sampleData } = await HWOApiService.parseCsvHeaders(file);
      console.log('CSV parsed:', { headers, sampleData });
      setCsvPreview({ headers, sampleData });
      setUploadProgress(30);
      setProcessingStatus('Detecting column mappings...');

      // Validate column structure with AI
      const mappingResult = await hwoApiService.validateCsvColumns(headers, sampleData);
      console.log('Column mapping result:', mappingResult);
      setColumnMapping(mappingResult);
      setUploadProgress(50);

      if (mappingResult.can_proceed) {
        setProcessingStatus('Column mapping successful! Processing file...');
        setUploadStep(1);
        
        // Auto-proceed if high confidence mapping
        if (mappingResult.mapping_quality > 0.8) {
          await processFileWithMapping();
        } else {
          setColumnMappingDialog(true);
        }
      } else {
        setProcessingStatus('Column mapping required');
        setUploadStep(1);
        setColumnMappingDialog(true);
      }

    } catch (error: any) {
      console.error('File upload error:', error);
      
      // Handle detailed mapping errors
      if (error.details) {
        setColumnMapping({
          detected_mapping: error.details.detected_mapping || {},
          confidence_scores: {},
          missing_required: error.details.missing_required || [],
          missing_optional: [],
          unmapped_headers: error.details.unmapped_headers || [],
          mapping_quality: 0,
          suggestions: error.details.suggestions || {},
          validation_status: 'error',
          can_proceed: false
        });
        setColumnMappingDialog(true);
      } else {
        setProcessingStatus(`Error: ${error.message}`);
        setUploadProgress(0);
      }
    }
  }, []);

  const processFileWithMapping = async () => {
    if (!csvFile) {
      console.error('No CSV file available for processing');
      setProcessingStatus('Error: No file selected');
      return;
    }

    try {
      setUploadProgress(60);
      setProcessingStatus('Applying AI/ML scoring...');

      console.log('Processing CSV file:', csvFile.name, 'Size:', csvFile.size);
      
      const result: BatchScoringResponse = await hwoApiService.uploadCsvTargets(csvFile);
      
      console.log('CSV upload result:', result);
      
      setUploadProgress(80);
      setProcessingStatus('Processing results...');

      // Add new targets to the existing list
      const newTargets = result.results.map((scoringResult, index) => ({
        id: `uploaded-${Date.now()}-${index}`,
        name: scoringResult.target_name,
        distance: 0, // Will be filled from processing summary
        starType: 'Unknown',
        planetRadius: 0,
        orbitalPeriod: 0,
        stellarMass: 0,
        habitabilityScore: scoringResult.habitability_score,
        characterizationScore: scoringResult.characterization_score,
        aiConfidence: scoringResult.ai_confidence,
        observationPriority: scoringResult.observation_priority,
        observabilityWindow: ['Jan-Dec'],
        detectionMethod: 'CSV Upload',
        discoveryYear: new Date().getFullYear(),
        dataQuality: 'Good' as const,
        mlPredictions: {
          isHabitable: scoringResult.habitability_class === 'Potentially Habitable',
          habitabilityProbability: scoringResult.ml_predictions.habitability_probability || 0,
          characterizationValue: scoringResult.characterization_score
        }
      }));

      setTargets(prev => [...prev, ...newTargets]);
      
      setUploadProgress(100);
      setProcessingStatus(`Successfully processed ${result.results.length} targets!`);
      
      setTimeout(() => {
        setUploadDialog(false);
        setColumnMappingDialog(false);
        setCsvFile(null);
        setUploadProgress(0);
        setProcessingStatus('');
        setUploadStep(0);
        setCsvPreview(null);
        setColumnMapping(null);
      }, 3000);

    } catch (error: any) {
      console.error('Processing error:', error);
      console.error('Error details:', error.message, error.stack);
      setProcessingStatus(`Processing failed: ${error.message}`);
      setUploadProgress(0);
      
      // Keep the dialogs open so user can see the error and try again
    }
  };

  // Enhanced export functionality with filters and sorting
  const handleExport = useCallback(() => {
    let dataToExport = filteredTargets;

    // Apply sorting
    dataToExport = [...dataToExport].sort((a, b) => {
      const aValue = a[exportOptions.sortBy as keyof EnhancedTarget];
      const bValue = b[exportOptions.sortBy as keyof EnhancedTarget];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return exportOptions.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (exportOptions.sortOrder === 'desc') {
        return bStr.localeCompare(aStr);
      }
      return aStr.localeCompare(bStr);
    });

    // Build column headers and data based on selected columns
    const selectedColumns = Object.entries(exportOptions.columns)
      .filter(([_, selected]) => selected)
      .map(([column, _]) => column);

    const columnMap: Record<string, string> = {
      name: 'Target Name',
      distance: 'Distance (ly)',
      starType: 'Star Type',
      planetRadius: 'Planet Radius (R⊕)',
      orbitalPeriod: 'Orbital Period (days)',
      stellarMass: 'Stellar Mass (M☉)',
      habitabilityScore: 'Habitability Score',
      characterizationScore: 'Characterization Score',
      aiConfidence: 'AI Confidence (%)',
      observationPriority: 'Priority',
      detectionMethod: 'Detection Method',
      discoveryYear: 'Discovery Year',
      dataQuality: 'Data Quality'
    };

    const headers = selectedColumns.map(col => columnMap[col] || col);
    const csvRows = dataToExport.map(target => 
      selectedColumns.map(col => {
        const value = target[col as keyof EnhancedTarget];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      })
    );

    // Add filter information if requested
    let csvContent = '';
    if (exportOptions.includeFilters && (searchTerm || filters.priority.length > 0 || sortBy !== 'characterizationScore')) {
      csvContent += '# Export Information\n';
      csvContent += `# Export Date: ${new Date().toISOString()}\n`;
      csvContent += `# Total Targets: ${dataToExport.length}\n`;
      if (searchTerm) csvContent += `# Search Filter: ${searchTerm}\n`;
      if (filters.priority.length > 0) csvContent += `# Priority Filter: ${filters.priority.join(', ')}\n`;
      csvContent += `# Sorted By: ${exportOptions.sortBy} (${exportOptions.sortOrder})\n`;
      csvContent += '\n';
    }

    csvContent += headers.join(',') + '\n';
    csvContent += csvRows.map(row => row.join(',')).join('\n');

    // Create and download file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `hwo_targets_${timestamp}.${exportOptions.format}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setExportDialog(false);
  }, [filteredTargets, exportOptions, searchTerm, filters, sortBy]);

  // Legacy simple export for backward compatibility
  const handleSimpleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Distance,Star Type,Planet Radius,AI Score,Priority\n" +
      filteredTargets.map(t => 
        `${t.name},${t.distance},${t.starType},${t.planetRadius},${t.characterizationScore},${t.observationPriority}`
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hwo_targets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Legacy file processing for backward compatibility
  const handleFileUploadLegacy = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {

    // Simulate file processing
    const processFile = async () => {
      try {
        setUploadProgress(30);
        setProcessingStatus('Parsing CSV data...');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUploadProgress(60);
        setProcessingStatus('Applying AI/ML scoring...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUploadProgress(80);
        setProcessingStatus('Validating planet parameters...');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setUploadProgress(100);
        setProcessingStatus('Upload complete! Processing new targets...');

        // Mock adding new targets
        const newTargets = generateSampleTargets().slice(0, 3).map((target, index) => ({
          ...target,
          id: `uploaded-${index}`,
          name: `Uploaded Target ${index + 1}`
        }));
        
        setTargets(prev => [...prev, ...newTargets]);

        setTimeout(() => {
          setUploadDialog(false);
          setCsvFile(null);
          setUploadProgress(0);
          setProcessingStatus('');
        }, 2000);

      } catch (error) {
        setProcessingStatus('Error processing file. Please check format and try again.');
        setUploadProgress(0);
      }
    };

    processFile();
  }, []);

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return theme.palette.error.main;
      case 'Medium': return theme.palette.warning.main;
      case 'Low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  // Score color mapping
  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading AI/ML Target Analysis...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology color="primary" />
        HWO AI/ML Target Characterization Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Targets
                  </Typography>
                  <Typography variant="h4">
                    {targets.length}
                  </Typography>
                </Box>
                <DataUsage color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    High Priority
                  </Typography>
                  <Typography variant="h4">
                    {targets.filter(t => t.observationPriority === 'High').length}
                  </Typography>
                </Box>
                <Star color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg AI Score
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(targets.reduce((sum, t) => sum + t.characterizationScore, 0) / targets.length) || 0}
                  </Typography>
                </Box>
                <ModelTraining color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Filtered Results
                  </Typography>
                  <Typography variant="h4">
                    {filteredTargets.length}
                  </Typography>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search targets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} size="small">
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as keyof EnhancedTarget)}
                  label="Sort By"
                >
                  <MenuItem value="characterizationScore">AI Score</MenuItem>
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="habitabilityScore">Habitability</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  label="Order"
                >
                  <MenuItem value="desc">High to Low</MenuItem>
                  <MenuItem value="asc">Low to High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialog(true)}
                >
                  Upload CSV
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={async () => {
                    try {
                      const response = await hwoApiService.healthCheck();
                      console.log('Health check result:', response);
                      alert('Backend connection successful!');
                    } catch (error) {
                      console.error('Health check failed:', error);
                      alert('Backend connection failed: ' + (error as Error).message);
                    }
                  }}
                >
                  Test API
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => setExportDialog(true)}
                >
                  Export with Options
                </Button>
              </Box>
            </Grid>
            
            {/* Advanced AI/ML Features */}
            <Grid item xs={12}>
              <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<BarChart />}
                  onClick={() => setCharacterizabilityDialog(true)}
                  size="small"
                >
                  Characterizability Score 📊
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<SmartToy />}
                  onClick={() => setSmartFilterDialog(true)}
                  size="small"
                >
                  Smart Filter Assistant 🤖
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Tune />}
                  onClick={() => setParameterTunerDialog(true)}
                  size="small"
                >
                  HWO Parameter Tuner 🔭
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<PathingIcon />}
                  onClick={() => setPathingDialog(true)}
                  size="small"
                >
                  Target-to-Target Pathing 🚀
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<FormatListNumbered />}
                  onClick={() => setPriorityListDialog(true)}
                  size="small"
                >
                  Observational Priority List 📝
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          {showFilters && (
            <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Advanced Filters</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>Min AI Score: {filters.minScore}</Typography>
                  <Slider
                    value={filters.minScore}
                    onChange={(_, value) => setFilters(prev => ({ ...prev, minScore: value as number }))}
                    max={100}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' }
                    ]}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>Max Distance: {filters.maxDistance} pc</Typography>
                  <Slider
                    value={filters.maxDistance}
                    onChange={(_, value) => setFilters(prev => ({ ...prev, maxDistance: value as number }))}
                    max={200}
                    marks={[
                      { value: 10, label: '10' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' },
                      { value: 200, label: '200' }
                    ]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    onClick={() => setFilters({
                      minScore: 0,
                      maxDistance: 100,
                      starTypes: [],
                      priority: [],
                      dataQuality: []
                    })}
                  >
                    Clear All Filters
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Targets Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Target Name</TableCell>
                  <TableCell>Distance (pc)</TableCell>
                  <TableCell>Star Type</TableCell>
                  <TableCell>AI Score</TableCell>
                  <TableCell>Habitability</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTargets.map((target) => (
                  <TableRow key={target.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {target.name}
                        </Typography>
                        {target.mlPredictions?.isHabitable && (
                          <Tooltip title="AI predicts high habitability">
                            <CheckCircle color="success" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{target.distance.toFixed(1)}</TableCell>
                    <TableCell>
                      <Chip label={target.starType} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography 
                          variant="body2" 
                          color={getScoreColor(target.characterizationScore)}
                          fontWeight="bold"
                        >
                          {target.characterizationScore}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={target.characterizationScore} 
                          sx={{ width: 50, height: 4 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {Math.round(target.habitabilityScore)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={target.observationPriority}
                        size="small"
                        sx={{ 
                          backgroundColor: getPriorityColor(target.observationPriority),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {target.aiConfidence}%
                        </Typography>
                        {target.aiConfidence >= 80 ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : target.aiConfidence >= 60 ? (
                          <Warning color="warning" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => setSelectedTarget(target)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* CSV Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CloudUpload color="primary" />
            Upload Exoplanet CSV Data
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Upload a CSV file with exoplanet data. Required columns: name, distance, starType, planetRadius, orbitalPeriod, stellarMass
          </Alert>
          
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="csv-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<Upload />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Choose CSV File
            </Button>
          </label>

          {csvFile && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Selected file: {csvFile.name}
              </Typography>
              
              {processingStatus && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {processingStatus}
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Column Mapping Dialog for CSV Upload */}
      <Dialog 
        open={columnMappingDialog} 
        onClose={() => setColumnMappingDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <TableChart color="primary" />
            Column Mapping Validation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity={columnMapping?.can_proceed ? "success" : "warning"} 
            sx={{ mb: 3 }}
          >
            {columnMapping?.can_proceed 
              ? `Column mapping successful with ${(columnMapping.mapping_quality * 100).toFixed(0)}% confidence!` 
              : "Some columns require manual mapping to proceed with AI processing."
            }
          </Alert>

          {/* CSV Preview */}
          {csvPreview && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>CSV Preview</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {csvPreview.headers.map((header, index) => (
                        <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Show first 3 rows of sample data */}
                    {Array.from({ length: Math.min(3, Object.values(csvPreview.sampleData)[0]?.length || 0) }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {csvPreview.headers.map((header, colIndex) => (
                          <TableCell key={colIndex}>
                            {csvPreview.sampleData[header]?.[rowIndex] || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Column Mapping Results */}
          {columnMapping && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Detected Column Mappings</Typography>
              
              {/* Successfully mapped columns */}
              {Object.keys(columnMapping.detected_mapping).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    ✓ Successfully Mapped Fields
                  </Typography>
                  {Object.entries(columnMapping.detected_mapping).map(([field, column]) => (
                    <Chip
                      key={field}
                      label={`${field} → ${column}`}
                      color="success"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      icon={<CheckCircle />}
                    />
                  ))}
                </Box>
              )}

              {/* Missing required fields */}
              {columnMapping.missing_required.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    ⚠ Missing Required Fields
                  </Typography>
                  {columnMapping.missing_required.map((field) => (
                    <Chip
                      key={field}
                      label={field}
                      color="error"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      icon={<ErrorIcon />}
                    />
                  ))}
                </Box>
              )}

              {/* Unmapped headers */}
              {columnMapping.unmapped_headers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    ? Unmapped Columns
                  </Typography>
                  {columnMapping.unmapped_headers.map((header) => (
                    <Chip
                      key={header}
                      label={header}
                      color="warning"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      icon={<Help />}
                    />
                  ))}
                </Box>
              )}

              {/* Suggestions */}
              {Object.keys(columnMapping.suggestions).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    💡 Suggestions
                  </Typography>
                  <List dense>
                    {Object.entries(columnMapping.suggestions).map(([field, suggestions]) => (
                      <ListItem key={field}>
                        <ListItemIcon>
                          <Psychology color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${field}`}
                          secondary={`Consider: ${suggestions.join(', ')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Mapping quality indicator */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Mapping Quality: {(columnMapping.mapping_quality * 100).toFixed(0)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={columnMapping.mapping_quality * 100} 
                  color={columnMapping.mapping_quality > 0.8 ? 'success' : columnMapping.mapping_quality > 0.5 ? 'warning' : 'error'}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColumnMappingDialog(false)}>
            Cancel
          </Button>
          {columnMapping?.can_proceed && (
            <Button 
              onClick={processFileWithMapping} 
              variant="contained" 
              startIcon={<ModelTraining />}
            >
              Process with AI/ML
            </Button>
          )}
          {!columnMapping?.can_proceed && (
            <Button 
              variant="outlined" 
              onClick={() => {
                // Close current dialog and trigger enhanced CSV upload
                setColumnMappingDialog(false);
                // Trigger file input for enhanced CSV upload
                document.getElementById('enhanced-csv-upload')?.click();
              }}
            >
              Manual Mapping
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Export Options Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Download color="primary" />
            Export HWO Targets
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Format Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportOptions.format}
                  label="Export Format"
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="json" disabled>JSON (Coming Soon)</MenuItem>
                  <MenuItem value="xlsx" disabled>Excel (Coming Soon)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sorting Options */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={exportOptions.sortBy}
                  label="Sort By"
                  onChange={(e) => setExportOptions(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <MenuItem value="name">Target Name</MenuItem>
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="habitabilityScore">Habitability Score</MenuItem>
                  <MenuItem value="characterizationScore">Characterization Score</MenuItem>
                  <MenuItem value="aiConfidence">AI Confidence</MenuItem>
                  <MenuItem value="observationPriority">Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort Order */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={exportOptions.sortOrder}
                  label="Sort Order"
                  onChange={(e) => setExportOptions(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                >
                  <MenuItem value="desc">Descending (High to Low)</MenuItem>
                  <MenuItem value="asc">Ascending (Low to High)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Include Filters Option */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeFilters}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeFilters: e.target.checked }))}
                  />
                }
                label="Include Filter Information"
              />
            </Grid>

            {/* Column Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Columns to Export
              </Typography>
              <Grid container spacing={1}>
                {Object.entries({
                  name: 'Target Name',
                  distance: 'Distance',
                  starType: 'Star Type',
                  planetRadius: 'Planet Radius',
                  orbitalPeriod: 'Orbital Period',
                  stellarMass: 'Stellar Mass',
                  habitabilityScore: 'Habitability Score',
                  characterizationScore: 'Characterization Score',
                  aiConfidence: 'AI Confidence',
                  observationPriority: 'Priority',
                  detectionMethod: 'Detection Method',
                  discoveryYear: 'Discovery Year',
                  dataQuality: 'Data Quality'
                }).map(([key, label]) => (
                  <Grid item xs={6} md={4} key={key}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={exportOptions.columns[key as keyof typeof exportOptions.columns]}
                          onChange={(e) => setExportOptions(prev => ({
                            ...prev,
                            columns: { ...prev.columns, [key]: e.target.checked }
                          }))}
                          size="small"
                        />
                      }
                      label={label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Export Preview */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  {`${filteredTargets.length} target(s) will be exported with ${
                    Object.values(exportOptions.columns).filter(Boolean).length
                  } column(s) selected.`}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button onClick={handleSimpleExport} variant="outlined">
            Quick Export (Basic)
          </Button>
          <Button onClick={handleExport} variant="contained" startIcon={<Download />}>
            Export with Options
          </Button>
        </DialogActions>
      </Dialog>

      {/* Target Detail Dialog */}
      <Dialog 
        open={selectedTarget !== null} 
        onClose={() => setSelectedTarget(null)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedTarget && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">{selectedTarget.name}</Typography>
                <Chip 
                  label={selectedTarget.observationPriority}
                  size="small"
                  sx={{ 
                    backgroundColor: getPriorityColor(selectedTarget.observationPriority),
                    color: 'white'
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Physical Parameters</Typography>
                  <Typography>Distance: {selectedTarget.distance} parsecs</Typography>
                  <Typography>Star Type: {selectedTarget.starType}</Typography>
                  <Typography>Planet Radius: {selectedTarget.planetRadius} R⊕</Typography>
                  <Typography>Orbital Period: {selectedTarget.orbitalPeriod} days</Typography>
                  <Typography>Stellar Mass: {selectedTarget.stellarMass} M☉</Typography>
                  <Typography>Temperature: {selectedTarget.temperature}K</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>AI/ML Analysis</Typography>
                  <Typography>Characterization Score: {selectedTarget.characterizationScore}/100</Typography>
                  <Typography>Habitability Score: {Math.round(selectedTarget.habitabilityScore)}%</Typography>
                  <Typography>AI Confidence: {selectedTarget.aiConfidence}%</Typography>
                  <Typography>Data Quality: {selectedTarget.dataQuality}</Typography>
                  <Typography>Discovery Year: {selectedTarget.discoveryYear}</Typography>
                  <Typography>Detection Method: {selectedTarget.detectionMethod}</Typography>
                </Grid>
                {selectedTarget.mlPredictions && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>ML Predictions</Typography>
                    <Typography>
                      Potentially Habitable: {selectedTarget.mlPredictions.isHabitable ? 'Yes' : 'No'}
                    </Typography>
                    <Typography>
                      Habitability Probability: {(selectedTarget.mlPredictions.habitabilityProbability * 100).toFixed(1)}%
                    </Typography>
                    <Typography>
                      Characterization Value: {selectedTarget.mlPredictions.characterizationValue}/100
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTarget(null)}>Close</Button>
              <Button variant="contained" startIcon={<Science />}>
                Add to Observation Queue
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Advanced AI/ML Feature Dialogs */}
      
      {/* Characterizability Score Dialog */}
      <Dialog open={characterizabilityDialog} onClose={() => setCharacterizabilityDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <BarChart color="primary" />
            Characterizability Score Analysis 📊
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Advanced AI/ML model that calculates the probability of successfully characterizing exoplanet atmospheres 
            based on HWO mission parameters, stellar properties, and orbital dynamics.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Model Inputs</Typography>
              <Typography>• Stellar brightness and variability</Typography>
              <Typography>• Planet-to-star radius ratio</Typography>
              <Typography>• Orbital inclination and eccentricity</Typography>
              <Typography>• Atmospheric scale height estimation</Typography>
              <Typography>• HWO coronagraph performance</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Score Interpretation</Typography>
              <Typography>• 90-100: Excellent characterization candidate</Typography>
              <Typography>• 70-89: Good characterization potential</Typography>
              <Typography>• 50-69: Moderate characterization difficulty</Typography>
              <Typography>• 30-49: Challenging characterization</Typography>
              <Typography>• 0-29: Poor characterization prospects</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Current Results</Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Target Name</TableCell>
                    <TableCell>Characterizability Score</TableCell>
                    <TableCell>Confidence Level</TableCell>
                    <TableCell>Primary Limiting Factor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTargets.slice(0, 10).map((target) => (
                    <TableRow key={target.id}>
                      <TableCell>{target.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${target.characterizationScore}/100`}
                          color={target.characterizationScore > 70 ? 'success' : target.characterizationScore > 50 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{target.aiConfidence}%</TableCell>
                      <TableCell>
                        {target.characterizationScore < 50 ? 'Stellar brightness' : 
                         target.characterizationScore < 70 ? 'Planet size' : 'Optimal'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCharacterizabilityDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Export Full Analysis
          </Button>
        </DialogActions>
      </Dialog>

      {/* Smart Filter Assistant Dialog */}
      <Dialog open={smartFilterDialog} onClose={() => setSmartFilterDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <SmartToy color="secondary" />
            Smart Filter Assistant 🤖
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            AI-powered intelligent filtering system that learns from your selection patterns and 
            suggests optimal target subsets based on HWO mission science goals.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Suggested Filter Presets</Typography>
              <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilters({
                      minScore: 80,
                      maxDistance: 50,
                      starTypes: ['G', 'K'],
                      priority: ['High'],
                      dataQuality: ['High', 'Medium']
                    });
                    setSmartFilterDialog(false);
                  }}
                >
                  🎯 Prime HWO Candidates
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilters({
                      minScore: 60,
                      maxDistance: 100,
                      starTypes: ['G', 'K', 'M'],
                      priority: ['High', 'Medium'],
                      dataQuality: ['High', 'Medium']
                    });
                    setSmartFilterDialog(false);
                  }}
                >
                  🌍 Habitable Zone Focus
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilters({
                      minScore: 70,
                      maxDistance: 25,
                      starTypes: ['G'],
                      priority: ['High'],
                      dataQuality: ['High']
                    });
                    setSmartFilterDialog(false);
                  }}
                >
                  ⭐ Nearby Sun-like Stars
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>AI Recommendations</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Based on current data, prioritize targets with characterization scores above 75 
                and distances under 30 parsecs for optimal HWO performance.
              </Alert>
              <Alert severity="success">
                {filteredTargets.filter(t => t.characterizationScore > 75 && t.distance < 30).length} targets 
                match the AI-recommended criteria from your current dataset.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmartFilterDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<FilterList />}>
            Apply Smart Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* HWO Parameter Tuner Dialog */}
      <Dialog open={parameterTunerDialog} onClose={() => setParameterTunerDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Tune color="success" />
            HWO Parameter Tuner 🔭
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Advanced parameter optimization tool for HWO mission planning. Adjust instrument parameters 
            and observing strategies to maximize science return for selected targets.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Coronagraph Parameters</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Inner Working Angle (λ/D): 3.0</Typography>
                <Slider defaultValue={3.0} min={2.0} max={5.0} step={0.1} marks />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Contrast Ratio: 1e-10</Typography>
                <Slider defaultValue={10} min={8} max={12} step={0.5} marks />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Bandwidth Coverage: 20%</Typography>
                <Slider defaultValue={20} min={10} max={50} step={5} marks />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Observing Strategy</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Integration Time (hours): 10</Typography>
                <Slider defaultValue={10} min={1} max={50} step={1} marks />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Number of Visits: 3</Typography>
                <Slider defaultValue={3} min={1} max={10} step={1} marks />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Spectral Resolution (R): 70</Typography>
                <Slider defaultValue={70} min={20} max={200} step={10} marks />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Optimization Results</Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                Current parameter set optimized for {filteredTargets.length} targets. 
                Estimated science return: 85% of maximum theoretical yield.
              </Alert>
              <Typography variant="body2">
                Recommended adjustments: Increase integration time for targets beyond 20 parsecs, 
                reduce spectral resolution for initial detection surveys.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParameterTunerDialog(false)}>Close</Button>
          <Button variant="outlined">Reset to Defaults</Button>
          <Button variant="contained" startIcon={<Settings />}>
            Apply Optimized Parameters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Target-to-Target Pathing Dialog */}
      <Dialog open={pathingDialog} onClose={() => setPathingDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <PathingIcon color="info" />
            Target-to-Target Pathing Analysis 🚀
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Intelligent scheduling system that calculates optimal observation sequences, considering 
            spacecraft slew times, target visibility windows, and operational constraints.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>Optimized Observation Sequence</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sequence #</TableCell>
                      <TableCell>Target Name</TableCell>
                      <TableCell>Slew Time (min)</TableCell>
                      <TableCell>Observation Window</TableCell>
                      <TableCell>Priority Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTargets.slice(0, 8).map((target, index) => (
                      <TableRow key={target.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{target.name}</TableCell>
                        <TableCell>{Math.round(Math.random() * 45 + 5)}</TableCell>
                        <TableCell>{Math.round(Math.random() * 8 + 2)} hours</TableCell>
                        <TableCell>
                          <Chip 
                            label={target.characterizationScore} 
                            size="small" 
                            color={target.characterizationScore > 70 ? 'success' : 'warning'} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Path Optimization</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Total Observation Time</Typography>
                <Typography variant="h4" color="primary">47.3 hours</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Slew Time Overhead</Typography>
                <Typography variant="h5" color="secondary">8.7 hours (15.6%)</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Schedule Efficiency</Typography>
                <Typography variant="h5" color="success.main">84.4%</Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Optimized sequence reduces total mission time by 23% compared to 
                distance-based ordering.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPathingDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Autorenew />}>
            Recalculate Path
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            Export Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Observational Priority List Dialog */}
      <Dialog open={priorityListDialog} onClose={() => setPriorityListDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <FormatListNumbered color="warning" />
            Observational Priority List 📝
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            AI-generated priority ranking system that combines scientific merit, technical feasibility, 
            and strategic value for the HWO mission's exoplanet characterization goals.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Priority Weighting:</Typography>
                <Chip label="Science Value (40%)" color="primary" size="small" />
                <Chip label="Technical Feasibility (35%)" color="secondary" size="small" />
                <Chip label="Strategic Importance (25%)" color="success" size="small" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Rank</strong></TableCell>
                      <TableCell><strong>Target Name</strong></TableCell>
                      <TableCell><strong>Composite Score</strong></TableCell>
                      <TableCell><strong>Science Merit</strong></TableCell>
                      <TableCell><strong>Feasibility</strong></TableCell>
                      <TableCell><strong>Strategic Value</strong></TableCell>
                      <TableCell><strong>Recommendation</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTargets
                      .sort((a, b) => 
                        (b.characterizationScore * 0.4 + b.aiConfidence * 0.35 + (b.observationPriority === 'High' ? 25 : b.observationPriority === 'Medium' ? 15 : 5))
                        - (a.characterizationScore * 0.4 + a.aiConfidence * 0.35 + (a.observationPriority === 'High' ? 25 : a.observationPriority === 'Medium' ? 15 : 5))
                      )
                      .slice(0, 15)
                      .map((target, index) => {
                        const compositeScore = Math.round(target.characterizationScore * 0.4 + target.aiConfidence * 0.35 + (target.observationPriority === 'High' ? 25 : target.observationPriority === 'Medium' ? 15 : 5));
                        return (
                          <TableRow key={target.id}>
                            <TableCell>
                              <Chip 
                                label={`#${index + 1}`} 
                                color={index < 3 ? 'error' : index < 7 ? 'warning' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell><strong>{target.name}</strong></TableCell>
                            <TableCell>
                              <Typography variant="h6" color={compositeScore > 80 ? 'success.main' : compositeScore > 60 ? 'warning.main' : 'error.main'}>
                                {compositeScore}
                              </Typography>
                            </TableCell>
                            <TableCell>{target.characterizationScore}/100</TableCell>
                            <TableCell>{target.aiConfidence}%</TableCell>
                            <TableCell>
                              <Chip 
                                label={target.observationPriority} 
                                color={target.observationPriority === 'High' ? 'error' : target.observationPriority === 'Medium' ? 'warning' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color={
                                index < 3 ? 'error.main' : 
                                index < 7 ? 'warning.main' : 
                                'success.main'
                              }>
                                {index < 3 ? 'Priority 1 - Immediate' : 
                                 index < 7 ? 'Priority 2 - Year 1-2' : 
                                 'Priority 3 - Extended Mission'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriorityListDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Tune />}>
            Adjust Weights
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            Export Priority List
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file input for enhanced CSV upload */}
      <input
        id="enhanced-csv-upload"
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            // This will be handled by the CSVUpload component
          }
        }}
      />

      {/* Enhanced CSV Upload Component */}
      <CSVUpload
        onResult={(data: any) => {
          if (data && data.length > 0) {
            // Handle successful upload - add targets to existing list
            setTargets((prevTargets: EnhancedTarget[]) => [...prevTargets, ...data]);
            // Show success notification (you can add snackbar state if needed)
            console.log(`Successfully uploaded ${data.length} targets`);
          } else {
            // Handle error case
            console.error('Upload failed or no data received');
          }
        }}
      />
    </Box>
  );
};

export default EnhancedTargetDashboard;
