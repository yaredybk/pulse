const session = require('express-session');
require('dotenv').config();
const { _rdCli } = require('./redis');
const RedisStore = require('connect-redis').default;

// Initialize store.
let rdSess = new RedisStore({
  client: _rdCli,
  prefix: 'myapp:',
});
// rdSess.ids((e, d) => {
//   console.log(d);
// });
const ses = session({
  store: rdSess,
  resave: true, // required: force lightweight session keep alive (touch)
  saveUninitialized: true, // Create session for new users
  secret: process.env.SESSION_KEY,
  cookie: {
    httpOnly: true,
    path: '/',
    // secure: process.env.NODE_ENV == 'production',
    secure: false,
    // sameSite: process.env.NODE_ENV == 'production',
    sameSite: false,
    maxAge: 1000 * 60 * 10, // 10 minutes session timeout in milliseconds
    rolling: true, // Reset cookie expiry on every request
  },
  name: 'anon',
});
module.exports = { _rdSess: rdSess, _session: ses };
