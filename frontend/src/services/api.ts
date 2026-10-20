import axios, { AxiosInstance } from 'axios';
import {
  Aircraft, FleetSummary, SensorReading, Prediction,
  MaintenanceTask, MaintenanceRecommendation, ScheduleOptimizationResult,
  SparePart, SpareShortageAlert, Alert, SimulationStepResult
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api`;

// --- Token management ---
// Token is stored in module memory only — NOT in localStorage/sessionStorage.
// This prevents XSS-based token theft. Token is lost on page refresh (by design
// for this demo prototype — users simply log in again).
let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

// --- Axios client ---
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  if (_authToken) {
    config.headers['Authorization'] = `Bearer ${_authToken}`;
  }
  return config;
});

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token — App.tsx will detect null token and show login
      _authToken = null;
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Authentication
  login: async (username: string, password: string): Promise<{ access_token: string; username: string; expires_in_hours: number; role: string }> => {
    const res = await axios.post(`${API_URL}/auth/login`, { username, password }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return res.data;
  },

  // Dashboard & Fleet
  getDashboardSummary: async () => {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  },
  getFleet: async (params?: { aircraft_type?: string; status?: string; search?: string }) => {
    const res = await apiClient.get<{ summary: FleetSummary; total: number; aircraft: Aircraft[] }>('/fleet', { params });
    return res.data;
  },
  getFleetSummary: async () => {
    const res = await apiClient.get<FleetSummary>('/fleet/summary');
    return res.data;
  },
  getAvailabilityTrend: async () => {
    const res = await apiClient.get('/fleet/availability-trend');
    return res.data;
  },

  // Aircraft & Digital Twin
  getAircraftDetail: async (aircraftId: string) => {
    const res = await apiClient.get<Aircraft>(`/aircraft/${aircraftId}`);
    return res.data;
  },
  getAircraftSensors: async (aircraftId: string, limit = 30) => {
    const res = await apiClient.get<SensorReading[]>(`/aircraft/${aircraftId}/sensors`, { params: { limit } });
    return res.data;
  },
  getAircraftMaintenance: async (aircraftId: string) => {
    const res = await apiClient.get(`/aircraft/${aircraftId}/maintenance`);
    return res.data;
  },
  getAircraftComponents: async (aircraftId: string) => {
    const res = await apiClient.get(`/aircraft/${aircraftId}/components`);
    return res.data;
  },

  // Predictions & ML
  getPredictions: async (risk_level?: string) => {
    const res = await apiClient.get<{ total: number; predictions: Prediction[] }>('/predictions', { params: { risk_level } });
    return res.data;
  },
  runPrediction: async (aircraftId: string, component_type = 'HYDRAULIC') => {
    const res = await apiClient.post<{ success: boolean; prediction: Prediction }>(`/predict/${aircraftId}`, null, {
      params: { component_type }
    });
    return res.data;
  },

  // Maintenance & Optimization
  getMaintenanceQueue: async () => {
    const res = await apiClient.get<{ total_queued: number; tasks: MaintenanceTask[] }>('/maintenance/queue');
    return res.data;
  },
  getMaintenanceRecommendations: async () => {
    const res = await apiClient.get<{ total: number; recommendations: MaintenanceRecommendation[] }>('/maintenance/recommendations');
    return res.data;
  },
  optimizeMaintenanceSchedule: async () => {
    const res = await apiClient.post<ScheduleOptimizationResult>('/maintenance/optimize');
    return res.data;
  },
  updateTaskStatus: async (taskId: string, newStatus: string, notes = '') => {
    const res = await apiClient.patch(`/maintenance/tasks/${taskId}/status`, { new_status: newStatus, notes });
    return res.data;
  },
  requestInspection: async (aircraft_id: string, component_id: string, task_name = '', reason = '') => {
    const res = await apiClient.post('/maintenance/request', { aircraft_id, component_id, task_name, reason });
    return res.data;
  },

  // Logistics & Spares
  getSpares: async (status?: string) => {
    const res = await apiClient.get<{ total: number; inventory: SparePart[] }>('/spares', { params: { status } });
    return res.data;
  },
  getSpareShortages: async () => {
    const res = await apiClient.get<{ total_shortages: number; alerts: SpareShortageAlert[] }>('/spares/shortages');
    return res.data;
  },
  reserveSpare: async (part_id: string, aircraft_id: string, quantity = 1) => {
    const res = await apiClient.post('/spares/reserve', { part_id, aircraft_id, quantity });
    return res.data;
  },
  updateSpareStock: async (partId: string, adjustment: number, reason = 'Manual stock adjustment') => {
    const res = await apiClient.patch(`/spares/${partId}/stock`, { adjustment, reason });
    return res.data;
  },

  // Simulation Lab
  getSimulationState: async () => {
    const res = await apiClient.get('/simulation/state');
    return res.data;
  },
  startSimulation: async (scenario = 'SENSOR_DEGRADATION', target_aircraft_id = 'A101') => {
    const res = await apiClient.post('/simulation/start', { scenario, target_aircraft_id });
    return res.data;
  },
  stepSimulation: async (target_aircraft_id = 'A101') => {
    const res = await apiClient.post<SimulationStepResult>('/simulation/step', { target_aircraft_id });
    return res.data;
  },
  pauseSimulation: async () => {
    const res = await apiClient.post('/simulation/pause');
    return res.data;
  },
  resetSimulation: async (target_aircraft_id = 'A101') => {
    const res = await apiClient.post('/simulation/reset', { target_aircraft_id });
    return res.data;
  },

  // Alerts
  getAlerts: async (severity?: string, unread_only = false) => {
    const res = await apiClient.get<{ total: number; alerts: Alert[] }>('/alerts', { params: { severity, unread_only } });
    return res.data;
  },
  acknowledgeAlert: async (alert_id: string) => {
    const res = await apiClient.patch(`/alerts/${alert_id}/acknowledge`);
    return res.data;
  },

  // Model Metrics
  getModelMetrics: async () => {
    const res = await apiClient.get('/models/metrics');
    return res.data;
  },

  // Maintenance Copilot
  queryCopilot: async (query: string, aircraftId?: string) => {
    const res = await apiClient.post<{
      query: string;
      answer: string;
      grounded_sources: string[];
      suggested_followups: string[];
      data_timestamp: string;
    }>('/copilot/query', { query, aircraft_id: aircraftId });
    return res.data;
  },
};

