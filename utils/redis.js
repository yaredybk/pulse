require('dotenv').config();
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

const cli = createClient({ url: process.env.REDIS_URL });
cli.connect().catch((error) => {
  console.warn(`Redis client not connected to server: \n${error}`);
});

cli.on('error', (err) => {
  console.warn('Redis Client Error', err);
});

// Initialize client.
// let redisAuth0Client = createClient({ url: process.env.REDIS_URL });
// redisAuth0Client.connect().catch(console.error);
const rdAuth = new RedisStore({
  client: cli,
  prefix: 'auth0:',
});
module.exports = { _rdAuth: rdAuth };
