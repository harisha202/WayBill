
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.services.database_service import get_user_by_email, create_user
from app.core.security import hash_password

import os
os.environ.setdefault('MOCK_EMAIL_DELIVERY', 'true')
from run import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        yield client

@pytest.fixture(autouse=True)
def setup_teardown():
    try:
        user = get_user_by_email('test_login@waybill.com')
        if not user:
            create_user(
                username='testuser',
                password_hash=hash_password('password123'),
                name='Test User',
                email='test_login@waybill.com',
                role='manufacturer',
                company_name='Test Company',
                phone='1234567890'
            )
    except:
        pass
    yield

@pytest.mark.asyncio
async def test_valid_four_field_login(async_client):
    response = await async_client.post('/api/auth/login', json={
        'username': 'testuser',
        'email': 'test_login@waybill.com',
        'company_name': 'Test Company',
        'password': 'password123'
    })
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_wrong_username(async_client):
    response = await async_client.post('/api/auth/login', json={
        'username': 'wronguser',
        'email': 'test_login@waybill.com',
        'company_name': 'Test Company',
        'password': 'password123'
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_wrong_company(async_client):
    response = await async_client.post('/api/auth/login', json={
        'username': 'testuser',
        'email': 'test_login@waybill.com',
        'company_name': 'Wrong Company',
        'password': 'password123'
    })
    assert response.status_code == 401

