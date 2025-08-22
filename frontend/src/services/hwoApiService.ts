/**
 * API Service for HWO Target AI/ML Scoring
 * Handles communication with the backend ML scoring endpoints
 */

export interface ColumnMappingRequest {
  headers: string[];
  sample_data?: Record<string, any[]>;
}

export interface ColumnMappingResponse {
  detected_mapping: Record<string, string>;
  confidence_scores: Record<string, number>;
  missing_required: string[];
  missing_optional: string[];
  unmapped_headers: string[];
  mapping_quality: number;
  suggestions: Record<string, string[]>;
  validation_status: string;
  can_proceed: boolean;
}

export interface ColumnExamplesResponse {
  supported_formats: Record<string, {
    description: string;
    examples: any[];
    units?: string;
    possible_columns: string[];
  }>;
  optional_fields: Record<string, {
    possible_columns: string[];
  }>;
  sample_csv_headers: string[];
}

export interface ExoplanetTarget {
  name: string;
  distance: number;
  star_type: string;
  planet_radius: number;
  orbital_period: number;
  stellar_mass: number;
  planet_mass?: number;
  temperature?: number;
  discovery_year?: number;
  detection_method?: string;
  data_quality?: 'Excellent' | 'Good' | 'Fair' | 'Limited';
}

export interface ScoringResult {
  target_name: string;
  characterization_score: number;
  habitability_score: number;
  habitability_class: string;
  ai_confidence: number;
  observation_priority: 'High' | 'Medium' | 'Low';
  detailed_scores: {
    distance_factor: number;
    star_type_factor: number;
    planet_size_factor: number;
    data_quality_factor: number;
  };
  ml_predictions: {
    habitability_regression?: number;
    habitability_classification?: number;
    habitability_probability?: number;
  };
  original_data?: Record<string, any>;
}

export interface BatchScoringResponse {
  results: ScoringResult[];
  processing_summary: {
    total_targets: number;
    successful_scores: number;
    failed_scores: number;
    errors: Array<{ target: string; error: string }>;
    detected_mapping?: Record<string, string>;
    confidence_scores?: Record<string, number>;
    conversion_errors?: string[];
    rows_processed?: number;
    valid_targets?: number;
  };
}

export interface HealthCheckResponse {
  status: string;
  models_loaded: boolean;
  model_info: Record<string, any>;
}

export interface ModelInfo {
  models_loaded: boolean;
  metadata: Record<string, any>;
  feature_names: string[];
  available_endpoints: string[];
}

class HWOApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Check if the API and ML models are healthy
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hwo/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Score a single exoplanet target
   */
  async scoreSingleTarget(target: ExoplanetTarget): Promise<ScoringResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hwo/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(target),
      });

      if (!response.ok) {
        throw new Error(`Scoring failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Single target scoring error:', error);
      throw error;
    }
  }

  /**
   * Score multiple exoplanet targets in batch
   */
  async scoreMultipleTargets(targets: ExoplanetTarget[]): Promise<BatchScoringResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hwo/score/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targets }),
      });

      if (!response.ok) {
        throw new Error(`Batch scoring failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Batch scoring error:', error);
      throw error;
    }
  }

  /**
   * Validate CSV column structure and get mapping suggestions
   */
  async validateCsvColumns(headers: string[], sampleData?: Record<string, any[]>): Promise<ColumnMappingResponse> {
    try {
      const requestBody: ColumnMappingRequest = {
        headers,
        sample_data: sampleData
      };

      const response = await fetch(`${this.baseUrl}/api/v1/hwo/validate-columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Column validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Column validation error:', error);
      throw error;
    }
  }

  /**
   * Get examples of supported column formats
   */
  async getColumnExamples(): Promise<ColumnExamplesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hwo/column-examples`);
      if (!response.ok) {
        throw new Error(`Failed to get column examples: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Column examples error:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file and extract headers
   */
  static async parseCsvHeaders(file: File): Promise<{ headers: string[]; sampleData: Record<string, any[]> }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            throw new Error('CSV file is empty');
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const sampleData: Record<string, any[]> = {};

          // Parse first few rows as sample data
          const sampleRows = lines.slice(1, Math.min(6, lines.length));
          headers.forEach((header, index) => {
            sampleData[header] = sampleRows.map(row => {
              const values = row.split(',');
              return values[index]?.trim().replace(/"/g, '') || '';
            });
          });

          resolve({ headers, sampleData });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  }

  /**
   * Upload a CSV file with intelligent column detection
   */
  async uploadCsvTargets(file: File): Promise<BatchScoringResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/v1/hwo/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle detailed error with suggestions
        if (errorData.detail && typeof errorData.detail === 'object') {
          const detailedError = new Error('Column mapping failed');
          (detailedError as any).details = errorData.detail;
          throw detailedError;
        }
        
        throw new Error(errorData.detail || `CSV upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CSV upload error:', error);
      throw error;
    }
  }

  /**
   * Upload a CSV file with intelligent column detection
   */
  async uploadCsvTargetsOld(file: File): Promise<BatchScoringResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/v1/hwo/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `CSV upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CSV upload error:', error);
      throw error;
    }
  }

  /**
   * Get information about the loaded ML models
   */
  async getModelInfo(): Promise<ModelInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hwo/models/info`);
      if (!response.ok) {
        throw new Error(`Model info request failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Model info error:', error);
      throw error;
    }
  }

  /**
   * Convert CSV row to ExoplanetTarget format
   */
  static csvRowToTarget(row: Record<string, any>): ExoplanetTarget {
    return {
      name: row.name || row.pl_name || `Target-${Date.now()}`,
      distance: parseFloat(row.distance || row.sy_dist || 0),
      star_type: row.star_type || row.st_spectype || 'Unknown',
      planet_radius: parseFloat(row.planet_radius || row.pl_rade || 0),
      orbital_period: parseFloat(row.orbital_period || row.pl_orbper || 0),
      stellar_mass: parseFloat(row.stellar_mass || row.st_mass || 1),
      planet_mass: row.planet_mass || row.pl_bmasse ? parseFloat(row.planet_mass || row.pl_bmasse) : undefined,
      temperature: row.temperature || row.pl_eqt ? parseFloat(row.temperature || row.pl_eqt) : undefined,
      discovery_year: row.discovery_year || row.disc_year ? parseInt(row.discovery_year || row.disc_year) : undefined,
      detection_method: row.detection_method || row.discoverymethod || undefined,
      data_quality: row.data_quality || 'Good',
    };
  }

  /**
   * Enhanced CSV validation with intelligent column detection
   */
  static validateCsvStructureEnhanced(headers: string[]): { 
    isValid: boolean; 
    detectedFields: Record<string, string[]>;
    suggestions: string[];
    confidence: number;
  } {
    const fieldMappings: Record<string, string[]> = {
      name: ['pl_name', 'planet_name', 'target_name', 'object_name', 'identifier'],
      distance: ['sy_dist', 'dist', 'distance_pc', 'dist_pc', 'stellar_distance', 'parsecs'],
      star_type: ['st_spectype', 'spectral_type', 'stellar_type', 'star_class', 'host_type'],
      planet_radius: ['pl_rade', 'radius', 'pl_radius', 'radius_earth', 'planet_size'],
      orbital_period: ['pl_orbper', 'period', 'period_days', 'orbital_period_days', 'orbit_period'],
      stellar_mass: ['st_mass', 'star_mass', 'host_mass', 'host_star_mass', 'm_star']
    };

    const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    const detectedFields: Record<string, string[]> = {};
    let totalMatches = 0;

    for (const [field, alternatives] of Object.entries(fieldMappings)) {
      const matches: string[] = [];
      
      // Direct matches
      for (let i = 0; i < headers.length; i++) {
        const headerLower = lowerHeaders[i];
        if (headerLower === field || alternatives.includes(headerLower)) {
          matches.push(headers[i]);
        }
      }

      // Fuzzy matches
      if (matches.length === 0) {
        for (let i = 0; i < headers.length; i++) {
          const headerLower = lowerHeaders[i];
          for (const alt of [field, ...alternatives]) {
            if (headerLower.includes(alt) || alt.includes(headerLower)) {
              matches.push(headers[i]);
              break;
            }
          }
        }
      }

      if (matches.length > 0) {
        detectedFields[field] = matches;
        totalMatches++;
      }
    }

    const requiredFields = Object.keys(fieldMappings);
    const confidence = totalMatches / requiredFields.length;
    const isValid = confidence >= 0.8;

    const suggestions = [
      `Detected ${totalMatches}/${requiredFields.length} required fields`,
      `Column detection confidence: ${(confidence * 100).toFixed(1)}%`,
      ...Object.entries(detectedFields).map(([field, cols]) => 
        `${field}: ${cols.join(', ')}`
      )
    ];

    return { isValid, detectedFields, suggestions, confidence };
  }

  /**
   * Convert CSV row to ExoplanetTarget format with intelligent mapping
   */
  static csvRowToTargetEnhanced(row: Record<string, any>, mapping: Record<string, string>): ExoplanetTarget {
    const getValue = (field: string, defaultValue?: any) => {
      const csvColumn = mapping[field];
      return csvColumn && row[csvColumn] !== undefined ? row[csvColumn] : defaultValue;
    };

    return {
      name: getValue('name') || `Target-${Date.now()}`,
      distance: parseFloat(getValue('distance', 0)),
      star_type: getValue('star_type') || 'Unknown',
      planet_radius: parseFloat(getValue('planet_radius', 0)),
      orbital_period: parseFloat(getValue('orbital_period', 0)),
      stellar_mass: parseFloat(getValue('stellar_mass', 1)),
      planet_mass: getValue('planet_mass') ? parseFloat(getValue('planet_mass')) : undefined,
      temperature: getValue('temperature') ? parseFloat(getValue('temperature')) : undefined,
      discovery_year: getValue('discovery_year') ? parseInt(getValue('discovery_year')) : undefined,
      detection_method: getValue('detection_method') || undefined,
      data_quality: getValue('data_quality') || 'Good',
    };
  }

  /**
   * Validate CSV file structure (legacy method)
   */
  static validateCsvStructure(headers: string[]): { isValid: boolean; missingFields: string[]; suggestions: string[] } {
    const requiredFields = ['name', 'distance', 'star_type', 'planet_radius', 'orbital_period', 'stellar_mass'];
    const optionalFields = ['planet_mass', 'temperature', 'discovery_year', 'detection_method', 'data_quality'];
    
    // Alternative field names that we can map to required fields
    const fieldMappings: Record<string, string[]> = {
      name: ['pl_name', 'planet_name', 'target_name'],
      distance: ['sy_dist', 'dist', 'distance_pc'],
      star_type: ['st_spectype', 'spectral_type', 'stellar_type'],
      planet_radius: ['pl_rade', 'radius', 'pl_radius'],
      orbital_period: ['pl_orbper', 'period', 'orbital_period_days'],
      stellar_mass: ['st_mass', 'star_mass', 'host_mass']
    };

    const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    for (const field of requiredFields) {
      let found = false;
      
      // Check direct match
      if (lowerHeaders.includes(field)) {
        found = true;
      } else {
        // Check alternative field names
        const alternatives = fieldMappings[field] || [];
        for (const alt of alternatives) {
          if (lowerHeaders.includes(alt)) {
            found = true;
            break;
          }
        }
      }

      if (!found) {
        missingFields.push(field);
        const alternatives = fieldMappings[field] || [];
        if (alternatives.length > 0) {
          suggestions.push(`For '${field}', you can use: ${alternatives.join(', ')}`);
        }
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      suggestions
    };
  }

  /**
   * Generate sample CSV template
   */
  static generateSampleCsv(): string {
    const headers = [
      'name', 'distance', 'star_type', 'planet_radius', 'orbital_period', 
      'stellar_mass', 'planet_mass', 'temperature', 'discovery_year', 
      'detection_method', 'data_quality'
    ];
    
    const sampleRows = [
      [
        'Proxima Centauri b', '4.24', 'M5V', '0.09', '11.2', 
        '0.12', '1.3', '234', '2016', 'Radial Velocity', 'Excellent'
      ],
      [
        'TRAPPIST-1 e', '40.7', 'M8V', '0.08', '6.1', 
        '0.09', '0.69', '251', '2017', 'Transit', 'Excellent'
      ],
      [
        'K2-18 b', '34.4', 'M2V', '0.20', '33.0', 
        '0.36', '8.92', '265', '2015', 'Transit', 'Good'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download sample CSV file
   */
  static downloadSampleCsv(): void {
    const csvContent = this.generateSampleCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'hwo_targets_sample.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Export results to CSV
   */
  static exportResultsToCsv(results: ScoringResult[], filename: string = 'hwo_scoring_results.csv'): void {
    const headers = [
      'Target Name', 'Characterization Score', 'Habitability Score', 'Habitability Class',
      'AI Confidence', 'Observation Priority', 'Distance Factor', 'Star Type Factor',
      'Planet Size Factor', 'Data Quality Factor', 'ML Habitability Probability'
    ];

    const csvRows = [
      headers.join(','),
      ...results.map(result => [
        `"${result.target_name}"`,
        result.characterization_score,
        result.habitability_score,
        `"${result.habitability_class}"`,
        result.ai_confidence,
        `"${result.observation_priority}"`,
        result.detailed_scores.distance_factor,
        result.detailed_scores.star_type_factor,
        result.detailed_scores.planet_size_factor,
        result.detailed_scores.data_quality_factor,
        result.ml_predictions.habitability_probability || 0
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
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
  }

  /**
   * Format error message for user display
   */
  static formatError(error: any): string {
    if (error.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }

  /**
   * Check if the service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const hwoApiService = new HWOApiService();
export default HWOApiService;
