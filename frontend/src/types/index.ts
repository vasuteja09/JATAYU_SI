export interface Component {
  component_id: string;
  component_type: 'ENGINE' | 'HYDRAULIC' | 'AVIONICS' | 'FUEL' | 'ELECTRICAL' | string;
  component_name: string;
  health_score: number;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  current_status: string;
  total_operating_hours: number;
  previous_failures: number;
  compatible_part_id?: string;
}

export interface Aircraft {
  aircraft_id: string;
  aircraft_type: string;
  base_location: string;
  age_years: number;
  total_flight_hours: number;
  total_cycles: number;
  current_status: 'AVAILABLE' | 'MONITORING' | 'MAINTENANCE_DUE' | 'UNDER_MAINTENANCE' | 'AWAITING_PART' | 'HIGH_RISK';
  health_score: number;
  last_major_maintenance: string;
  next_scheduled_maintenance: string;
  latest_risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latest_rul_hours?: number;
  latest_predicted_component?: string;
  spare_status?: string;
  components?: Component[];
}

export interface FleetSummary {
  total_aircraft: number;
  available_aircraft: number;
  availability_percentage: number;
  high_risk_aircraft: number;
  critical_alerts: number;
  predicted_maintenance_count: number;
  spare_shortages_count: number;
  status_breakdown: Record<string, number>;
  health_distribution: Record<string, number>;
}

export interface SensorReading {
  id: number;
  timestamp: string;
  temperature: number;
  vibration: number;
  pressure: number;
  hydraulic_pressure: number;
  rpm: number;
  oil_pressure: number;
  fuel_flow: number;
  electrical_voltage: number;
  operating_hours: number;
  flight_cycles: number;
}

export interface ContributingFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface Prediction {
  prediction_id: string;
  aircraft_id: string;
  component_type: string;
  timestamp: string;
  anomaly_score: number;
  anomaly_detected: boolean;
  anomaly_severity: 'NORMAL' | 'MEDIUM' | 'HIGH';
  maintenance_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predicted_rul_hours: number;
  rul_lower_bound: number;
  rul_upper_bound: number;
  confidence: number;
  top_contributing_factors: ContributingFactor[];
  recommended_action: string;
  model_mode: 'ML_INFERENCE' | 'DEMO_FALLBACK';
}

export interface MaintenanceTask {
  task_id: string;
  aircraft_id: string;
  component_id: string;
  task_name: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority_score: number;
  duration_hours: number;
  required_skill: string;
  required_part_id?: string;
  start_time_slot: number;
  end_time_slot: number;
  technician_id?: string;
  workshop_id?: string;
  rul_deadline_hours: number;
  is_optimized: boolean;
  status: string;
  spare_available?: boolean;
}

export interface MaintenanceRecommendation {
  aircraft_id: string;
  component_type: string;
  component_id: string;
  priority: string;
  priority_score: number;
  reason: string;
  suggested_timeframe: string;
  required_spare: string;
  required_skill: string;
  estimated_duration_hours: number;
  spare_available_locally: boolean;
  disclaimer: string;
}

export interface ScheduleOptimizationResult {
  status: string;
  conflicts_resolved: number;
  baseline_downtime_hours: number;
  optimized_downtime_hours: number;
  downtime_reduction_hours: number;
  baseline_fleet_availability: number;
  projected_fleet_availability: number;
  availability_improvement_percent: number;
  schedule: MaintenanceTask[];
  optimization_message: string;
}

export interface SparePart {
  part_id: string;
  part_name: string;
  compatible_component_type: string;
  quantity: number;
  reserved_quantity: number;
  storage_location: string;
  minimum_stock: number;
  lead_time_days: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'CRITICAL_SHORTAGE';
}

export interface SpareShortageAlert {
  part_id: string;
  part_name: string;
  compatible_component_type: string;
  affected_aircraft_id?: string;
  local_stock: number;
  depot_stock: number;
  alternative_location?: string;
  lead_time_days: number;
  shortage_level: 'WARNING' | 'CRITICAL';
  recommendation: string;
}

export interface Alert {
  alert_id: string;
  aircraft_id: string;
  component_type?: string;
  severity: 'CRITICAL' | 'WARNING' | 'LOGISTICS' | 'SCHEDULING';
  title: string;
  reason: string;
  recommended_action: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SimulationStepResult {
  step: number;
  scenario: string;
  target_aircraft_id: string;
  sensor_updates: {
    temperature: number;
    vibration: number;
    pressure: number;
    hydraulic_pressure: number;
  };
  anomaly_status: string;
  anomaly_score: number;
  maintenance_probability: number;
  risk_level: string;
  estimated_rul: number;
  health_score: number;
  timeline_stage: 'HEALTHY' | 'MONITORING' | 'WARNING' | 'HIGH_RISK';
  alert_generated?: string;
  spare_requirement?: string;
}
