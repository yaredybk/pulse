require('dotenv').config();
const { createClient } = require('redis');

// Initialize client.
let redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);
redisClient.on('error', (err) => {
  console.warn('Redis session Client Error', err);
});
module.exports = { _rdCli: redisClient };
