import pytest
import redis
import logging
import os
from typing import Generator
from urllib.parse import urlparse
from pathlib import Path

logger = logging.getLogger(__name__)

env_path = Path(__file__).parent.parent / ".env.local"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

class TestRedisConnection:
    """Test suite for Redis connection and basic operations."""

    @pytest.fixture
    def redis_client(self) -> Generator[redis.Redis, None, None]:
        """Create Redis client instance from REDIS_URL environment variable."""
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        parsed = urlparse(redis_url)

        db = 0
        if parsed.path and parsed.path != "/":
            try:
                db = int(parsed.path.lstrip("/"))
            except ValueError:
                db = 0

        client = redis.Redis(
            host=parsed.hostname or "localhost",
            port=parsed.port or 6379,
            db=db,
            username=parsed.username,
            password=parsed.password,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5
        )
        logger.info("Redis client created successfully")
        try:
            yield client
        except redis.RedisError as e:
            logger.error(f"Redis connection failed: {e}")
            pytest.fail(f"Redis connection failed: {e}")
        finally:
            client.close()
            logger.info("Redis client closed")

    def test_redis_connection(self, redis_client):
        """Test basic Redis connection using ping."""
        try:
            response = redis_client.ping()
            assert response is True
            logger.info(f"Redis ping successful: {response}")
        except redis.RedisError as e:
            logger.error(f"Redis ping failed: {e}")
            raise

    def test_redis_set_and_get(self, redis_client):
        """Test SET and GET operations."""
        test_key = "test:kilometer:connection"
        test_value = "ok"

        try:
            # Set value
            set_result = redis_client.set(test_key, test_value)
            assert set_result is True
            logger.info(f"SET {test_key}={test_value}: success")

            # Get value
            retrieved = redis_client.get(test_key)
            assert retrieved == test_value
            logger.info(f"GET {test_key}: {retrieved}")

            # Cleanup
            redis_client.delete(test_key)
            logger.info(f"Cleaned up test key: {test_key}")

        except redis.RedisError as e:
            logger.error(f"Redis operation failed: {e}")
            # Ensure cleanup on failure
            try:
                redis_client.delete(test_key)
            except:
                pass
            raise

    def test_redis_info(self, redis_client):
        """Test Redis INFO command."""
        try:
            info = redis_client.info()
            assert isinstance(info, dict)
            logger.info(f"Redis info retrieved - {len(info)} sections")

            if 'redis_version' in info:
                logger.info(f"Redis version: {info['redis_version']}")
            if 'connected_clients' in info:
                logger.info(f"Connected clients: {info['connected_clients']}")

        except redis.RedisError as e:
            logger.error(f"Redis info failed: {e}")
            raise
