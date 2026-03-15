import pytest
from httpx import AsyncClient
from app.main import app
import uuid

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

@pytest.mark.asyncio
async def test_auth_ping():
    # Ping auth endpoints to ensure they are mounted
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={"username": "test", "password": "test"})
    # Should return 401 or 404 but NOT 404 from main router
    assert response.status_code in [401, 400, 422]
