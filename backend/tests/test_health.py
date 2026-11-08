from fastapi.testclient import TestClient

from app.main import app


def test_health_does_not_expose_configuration() -> None:
    response = TestClient(app).get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "application": "SoapyFUN API",
        "version": "0.1.0",
    }


def test_short_health_route_exists_for_local_tools() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_development_frontend_origin_can_check_api_health() -> None:
    response = TestClient(app).get("/api/health", headers={"Origin": "http://localhost:4200"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:4200"


def test_database_readiness_responds() -> None:
    response = TestClient(app).get("/api/health/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "available"}
