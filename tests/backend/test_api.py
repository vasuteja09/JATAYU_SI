import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

# pyrefly: ignore [missing-import]
from app.main import app
# pyrefly: ignore [missing-import]
from app.config import settings

client = TestClient(app)

auth_headers = {}

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Jatayu" in data["service"]

def test_auth_required():
    """Unauthenticated requests to protected endpoints must return 401."""
    res = client.get("/api/fleet")
    assert res.status_code == 401
    assert "detail" in res.json()

def test_invalid_login():
    """Invalid credentials must return 401."""
    res = client.post("/api/auth/login", json={"username": "wrong_user", "password": "wrong_password"})
    assert res.status_code == 401

def test_valid_login():
    """Valid demo credentials return signed JWT access token."""
    global auth_headers
    res = client.post("/api/auth/login", json={
        "username": settings.DEMO_USERNAME,
        "password": settings.DEMO_PASSWORD
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    auth_headers = {"Authorization": f"Bearer {data['access_token']}"}

def test_security_headers():
    """Verify security headers injected on HTTP responses."""
    res = client.get("/api/health")
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

def test_invalid_aircraft_id():
    """Invalid characters in aircraft_id must be rejected with 400 Bad Request."""
    res = client.get("/api/aircraft/../../etc/passwd", headers=auth_headers)
    assert res.status_code in [400, 404]

def test_sensor_limit_bounds():
    """Sensor limit exceeding max allowed (200) must return validation error (422)."""
    res = client.get("/api/aircraft/A101/sensors?limit=9999", headers=auth_headers)
    assert res.status_code == 422

def test_status_filter_validation():
    """Invalid fleet status query must return 400 Bad Request."""
    res = client.get("/api/fleet?status=INVALID_STATUS_ATTEMPT", headers=auth_headers)
    assert res.status_code == 400

def test_dashboard_summary():
    res = client.get("/api/dashboard/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert data["kpis"]["total_aircraft"] == 15
    assert "availability_trend" in data
    assert "health_distribution" in data

def test_fleet_endpoints():
    res = client.get("/api/fleet", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["aircraft"]) == 15

    res_sum = client.get("/api/fleet/summary", headers=auth_headers)
    assert res_sum.status_code == 200
    assert res_sum.json()["total_aircraft"] == 15

def test_aircraft_detail_and_sensors():
    res = client.get("/api/aircraft/A101", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["aircraft_id"] == "A101"
    assert len(data["components"]) == 5

    res_sensors = client.get("/api/aircraft/A101/sensors", headers=auth_headers)
    assert res_sensors.status_code == 200
    assert len(res_sensors.json()) > 0

def test_prediction_endpoint():
    res = client.post("/api/predict/A101?component_type=HYDRAULIC", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    pred = data["prediction"]
    assert "anomaly_score" in pred
    assert "maintenance_probability" in pred
    assert "predicted_rul_hours" in pred
    assert "top_contributing_factors" in pred

def test_spares_and_shortages():
    res = client.get("/api/spares", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0

    res_short = client.get("/api/spares/shortages", headers=auth_headers)
    assert res_short.status_code == 200
    assert "alerts" in res_short.json()

def test_maintenance_optimizer():
    res = client.post("/api/maintenance/optimize", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["OPTIMAL", "FEASIBLE", "GREEDY_FALLBACK"]
    assert data["conflicts_resolved"] >= 0
    assert data["projected_fleet_availability"] >= data["baseline_fleet_availability"]
    assert len(data["schedule"]) > 0

def test_simulation_cycle():
    # Step simulation
    res_step = client.post("/api/simulation/step", json={"target_aircraft_id": "A101"}, headers=auth_headers)
    assert res_step.status_code == 200
    step_data = res_step.json()
    assert step_data["step"] >= 1
    assert "sensor_updates" in step_data

    # Reset simulation
    res_reset = client.post("/api/simulation/reset", json={"target_aircraft_id": "A101"}, headers=auth_headers)
    assert res_reset.status_code == 200
    assert res_reset.json()["status"] == "RESET_SUCCESSFUL"

def test_alerts():
    res = client.get("/api/alerts", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0

def test_model_metrics():
    res = client.get("/api/models/metrics", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "methodology" in data

if __name__ == "__main__":
    tests = [
        test_health,
        test_auth_required,
        test_invalid_login,
        test_valid_login,
        test_security_headers,
        test_invalid_aircraft_id,
        test_sensor_limit_bounds,
        test_status_filter_validation,
        test_dashboard_summary,
        test_fleet_endpoints,
        test_aircraft_detail_and_sensors,
        test_prediction_endpoint,
        test_spares_and_shortages,
        test_maintenance_optimizer,
        test_simulation_cycle,
        test_alerts,
        test_model_metrics
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"PASS: {t.__name__}")
            passed += 1
        except Exception as e:
            print(f"FAIL: {t.__name__} - {e}")
    print(f"\nResult: {passed}/{len(tests)} tests passed.")
