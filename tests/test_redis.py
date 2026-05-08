import pytest
import redis
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class TestRedisConnection:
    """Test suite for Redis connection and basic operations."""

    @pytest.fixture
    def redis_client(self) -> Optional[redis.Redis]:
        """Create Redis client instance."""
        client = None
        try:
            client = redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            logger.info("Redis client created successfully")
            yield client
        except redis.RedisError as e:
            logger.error(f"Failed to create Redis client: {e}")
            pytest.fail(f"Redis connection failed: {e}")
        finally:
            if client:
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
