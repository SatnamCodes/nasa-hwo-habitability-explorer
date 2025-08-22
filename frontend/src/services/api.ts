import axios from 'axios';

export interface Planet {
    id: string;
    pl_name: string;
    pl_rade: number;
    pl_masse?: number;
    pl_eqt: number;
    st_teff: number;
    pl_orbper: number;
    sy_dist: number;
    sephi_score: number;
    status?: string;
    discovery_year?: number;
}

export interface PredictionResponse {
    planet_name: string;
    sephi_score: number;
    rf_prediction: number;
    xgb_prediction: number;
    confidence: number;
    timestamp: string;
}

class HWOApiService {
    private api = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    async predictHabitability(planet: Planet): Promise<PredictionResponse> {
        try {
            const response = await this.api.post('/api/v1/predictions', planet);
            return response.data;
        } catch (error) {
            console.error('Error predicting habitability:', error);
            throw error;
        }
    }

    async predictBatch(planets: Planet[]): Promise<PredictionResponse[]> {
        try {
            const response = await this.api.post('/api/v1/predictions/batch', { planets });
            return response.data;
        } catch (error) {
            console.error('Error predicting batch habitability:', error);
            throw error;
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.api.get('/health');
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    async getPlanets(): Promise<Planet[]> {
        try {
            const response = await this.api.get('/api/v1/planets');
            // backend returns planets with fields: name, radius, temperature, habitability_score, orbital_period, distance
            // backend sometimes returns wrapped objects like { value: [...], Count: n }
            const raw = response.data;
            const data = Array.isArray(raw) ? raw : (raw.value ?? raw.items ?? raw.data ?? raw.results ?? []);
            const arr = data as any[];
            const mapped: Planet[] = arr.map((p: any) => ({
                id: p.id ?? p.pl_name ?? p.name,
                pl_name: p.pl_name ?? p.name,
                pl_rade: p.pl_rade ?? p.radius ?? 0,
                pl_masse: p.pl_masse ?? p.mass ?? undefined,
                pl_eqt: p.pl_eqt ?? p.temperature ?? 0,
                st_teff: p.st_teff ?? p.st_teff ?? 0,
                pl_orbper: p.pl_orbper ?? p.orbital_period ?? p.pl_orbper ?? 0,
                sy_dist: p.sy_dist ?? p.distance ?? 0,
                sephi_score: p.sephi_score ?? p.habitability_score ?? 0,
                status: p.status ?? undefined,
                discovery_year: p.discovery_year ?? undefined,
            }));
            return mapped;
        } catch (error) {
            const respData = (error as any)?.response?.data;
            console.error('Error fetching planets (primary):', (error as any)?.message, respData ?? 'no response body');
            // Try a safe fallback: fetch raw and attempt to map it ourselves so the UI can still render
            try {
                const raw = await this.fetchRawPlanets();
                const data = Array.isArray(raw) ? raw : (raw.value ?? raw.items ?? raw.data ?? raw.results ?? []);
                const arr = data as any[];
                const mapped: Planet[] = arr.map((p: any) => ({
                    id: p.id ?? p.pl_name ?? p.name,
                    pl_name: p.pl_name ?? p.name,
                    pl_rade: p.pl_rade ?? p.radius ?? 0,
                    pl_masse: p.pl_masse ?? p.mass ?? undefined,
                    pl_eqt: p.pl_eqt ?? p.temperature ?? 0,
                    st_teff: p.st_teff ?? p.st_teff ?? 0,
                    pl_orbper: p.pl_orbper ?? p.orbital_period ?? p.pl_orbper ?? 0,
                    sy_dist: p.sy_dist ?? p.distance ?? 0,
                    sephi_score: p.sephi_score ?? p.habitability_score ?? 0,
                    status: p.status ?? undefined,
                    discovery_year: p.discovery_year ?? undefined,
                }));
                return mapped;
            } catch (fallbackErr) {
                console.error('Fallback fetchRawPlanets failed:', (fallbackErr as any)?.message, (fallbackErr as any)?.response?.data ?? 'no response');
                const err: any = new Error('Error fetching planets');
                err.cause = { message: (error as any)?.message, data: respData };
                throw err;
            }
        }
    }

    // Expose raw response (unmapped) to help debug client/server mismatches in the UI
    async fetchRawPlanets(): Promise<any> {
        try {
            const response = await this.api.get('/api/v1/planets');
            return response.data;
        } catch (error) {
            const respData = (error as any)?.response?.data;
            console.error('Error fetchRawPlanets:', (error as any)?.message, respData ?? 'no response body');
            throw error;
        }
    }

    async scoreObservability(planet: any, params: { telescope_diameter_m?: number; wavelength_band?: string; inner_working_angle_mas?: number; contrast_sensitivity?: number }) {
        try {
            const response = await this.api.post('/api/v1/observability/score', planet, { params });
            return response.data;
        } catch (error) {
            console.error('Error scoring observability:', error);
            throw error;
        }
    }

    async getObservableCount(params: { telescope_diameter_m?: number; wavelength_band?: string; inner_working_angle_mas?: number; contrast_sensitivity?: number; threshold?: number }) {
        try {
            const response = await this.api.get('/api/v1/observability/count', { params });
            return response.data;
        } catch (error) {
            console.error('Error getting observable count:', error);
            throw error;
        }
    }

    async publishParams(params: object) {
        try {
            const response = await this.api.post('/api/v1/observability/publish-params', params);
            return response.data;
        } catch (error) {
            console.error('Error publishing params:', error);
            throw error;
        }
    }

    async getPlanetHwoDetails(planetId: string, params?: { telescope_diameter_m?: number; wavelength_band?: string; inner_working_angle_mas?: number; contrast_sensitivity?: number }) {
        try {
            const response = await this.api.get(`/api/v1/planets/${planetId}/hwo-details`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching planet HWO details:', error);
            throw error;
        }
    }

    async uploadCSV(file: File) {
        try {
            const form = new FormData();
            form.append('file', file);
            const response = await this.api.post('/api/v1/observability/score-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            return response.data;
        } catch (error) {
            console.error('CSV upload failed:', error);
            throw error;
        }
    }

    async createMissionPlan(plan: any) {
        try {
            const response = await this.api.post('/api/v1/hwo-targets/prioritize', plan);
            return response.data;
        } catch (error) {
            console.error('Mission plan create failed:', error);
            throw error;
        }
    }

    async startPredictionJob() {
        try {
            const response = await this.api.post('/api/v1/predictions/predict-full');
            return response.data;
        } catch (error) {
            console.error('Start prediction job failed:', error);
            throw error;
        }
    }

    async getJobStatus(jobId: string) {
        try {
            const response = await this.api.get(`/api/v1/predictions/job-status/${jobId}`);
            return response.data;
        } catch (error) {
            console.error('Get job status failed:', error);
            throw error;
        }
    }

    async downloadJobOutput(jobId: string) {
        try {
            const response = await this.api.get(`/api/v1/predictions/download/${jobId}`, { responseType: 'blob' });
            return response.data;
        } catch (error) {
            console.error('Download job output failed:', error);
            throw error;
        }
    }
}

export const apiService = new HWOApiService();

export const getPlanets = (): Promise<Planet[]> => {
    return apiService.getPlanets();
};
