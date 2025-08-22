import axios from 'axios';

export interface MLPrediction {
  habitability_score: number;
  confidence: number;
  feature_importance: Record<string, number>;
  risk_factors: string[];
  atmospheric_features: string[];
  observability_score: number;
}

export interface SatelliteData {
  id: string;
  timestamp: string;
  coordinates: {
    ra: number;
    dec: number;
    distance: number;
  };
  measurements: {
    flux_ratio?: number;
    signal_to_noise?: number;
    spectral_features?: Record<string, number>;
    atmospheric_signals?: Record<string, number>;
  };
  quality_metrics: {
    data_completeness: number;
    noise_level: number;
    calibration_accuracy: number;
  };
}

export interface EncryptedCSVData {
  encrypted_content: string;
  metadata: {
    rows: number;
    columns: string[];
    timestamp: string;
    source: string;
  };
}

class MLService {
  private api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  /**
   * Process and predict habitability from satellite CSV data
   */
  async processSatelliteData(encryptedData: EncryptedCSVData): Promise<MLPrediction[]> {
    try {
      const response = await this.api.post('/api/v1/ml/process-satellite-data', {
        encrypted_data: encryptedData.encrypted_content,
        metadata: encryptedData.metadata
      });
      return response.data.predictions;
    } catch (error) {
      console.error('Error processing satellite data:', error);
      throw new Error('Failed to process satellite data');
    }
  }

  /**
   * Predict habitability for a single planet
   */
  async predictHabitability(planetData: any): Promise<MLPrediction> {
    try {
      const response = await this.api.post('/api/v1/ml/predict-habitability', {
        planet_data: planetData
      });
      return response.data;
    } catch (error) {
      console.error('Error predicting habitability:', error);
      throw new Error('Failed to predict habitability');
    }
  }

  /**
   * Batch predict habitability for multiple planets
   */
  async batchPredict(planetsData: any[]): Promise<MLPrediction[]> {
    try {
      const response = await this.api.post('/api/v1/ml/batch-predict', {
        planets_data: planetsData
      });
      return response.data.predictions;
    } catch (error) {
      console.error('Error in batch prediction:', error);
      throw new Error('Failed to perform batch prediction');
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    last_trained: string;
    training_data_size: number;
  }> {
    try {
      const response = await this.api.get('/api/v1/ml/model-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching model metrics:', error);
      throw new Error('Failed to fetch model metrics');
    }
  }

  /**
   * Retrain model with new data
   */
  async retrainModel(newData: SatelliteData[]): Promise<{
    success: boolean;
    metrics: any;
    model_id: string;
  }> {
    try {
      const response = await this.api.post('/api/v1/ml/retrain-model', {
        training_data: newData
      });
      return response.data;
    } catch (error) {
      console.error('Error retraining model:', error);
      throw new Error('Failed to retrain model');
    }
  }
}

export const mlService = new MLService();
