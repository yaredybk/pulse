const RedisStore = require('connect-redis').default;
const session = require('express-session');
require('dotenv').config();
const { createClient } = require('redis');

// Initialize client.
let redisClient = createClient(process.env.REDIS_URL);
redisClient.connect().catch(console.error);

// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: 'myapp:',
});

// Initialize session storage.
const ss = session({
  store: redisStore,
  resave: false, // required: force lightweight session keep alive (touch)
  saveUninitialized: true, // Create session for new users
  secret: process.env.SESSION_KEY,
  cookie: {
    httpOnly: process.env.NODE_ENV == 'production',
    path: '/',
    secure: process.env.NODE_ENV == 'production',
    sameSite: true,
    maxAge: 1000 * 60 * 10, // 10 minutes session timeout in milliseconds
    rolling: true, // Reset cookie expiry on every request
  },
  name: 'anon',
});


module.exports._session = ss;
