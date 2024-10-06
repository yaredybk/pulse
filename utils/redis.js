require('dotenv').config();
const { createClient } = require('redis');

// class for redis commands
class RedisClient {
  constructor() {
    this.isAlive = false;
    this.cl = createClient({ url: process.env.REDIS_URL });
    this.cl.connect().catch((error) => {
      console.log(`Redis client not connected to server: ${error}`);
    });
    this.cl.on('connect', (err) => {
      this.isAlive = true;
    });
    this.cl.on('error', (err) => {
      this.isAlive = false;
      console.warn('Redis Client Error', err);
    });
  }

  // get value for given key
  async get(key) {
    const value = await this.cl.get(key);
    return value;
  }

  // set key value pair
  async set(key, value, time) {
    await this.cl.set(key, value, { EX: time });
  }

  // del key vale pair
  async del(key) {
    await this.cl.del(key);
  }
}

const cli = new RedisClient();

module.exports = { _rd: cli };
