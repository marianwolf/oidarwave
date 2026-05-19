const { createClient } = require('redis');

let client = null;

async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error('Missing REDIS_URL env var');
  }

  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Redis Client Error', err));
  }

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

module.exports = { getRedisClient };
