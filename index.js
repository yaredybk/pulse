require('dotenv').config();
const path = require('path');
const express = require('express');
const { auth } = require('express-openid-connect');
const helmet = require('helmet');
const { newWebSocket } = require('./utils/webSocket');
const { _session } = require('./utils/session');
const { _rdAuth } = require('./utils/redis.js');

const app = express();
app.set('env', process.env.NODE_ENV || 'production');

// helmet.contentSecurityPolicy({
//   useDefaults: true,
//   directives: {
//     'img-src': [
//       "'self'",
//       'https://s.gravatar.com',
//       'https://i1.wp.com/cdn.auth0.com',
//       'https://lh3.googleusercontent.com',
//     ],
//   },
// });
app.use(helmet());
// helmet.contentSecurityPolicy
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'img-src': [
        "'self'",
        'https://lh3.googleusercontent.com',
        'https://s.gravatar.com',
        'https://i1.wp.com/cdn.auth0.com',
      ],
    },
  })
);
// AUTH0
app.use(
  auth({
    session: {
      store: _rdAuth,
      // rollingDuration: 3 * 24 * 3600,
    },
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_AUDIENCE,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    routes: {
      login: false,
      callback: false,
    },
  })
);
app.get('/api/login', (req, res) =>
  res.oidc.login({
    returnTo: process.env.AUTH0_AUDIENCE + '/a/profile/me?callback=login',
    authorizationParams: {
      redirect_uri: process.env.AUTH0_AUDIENCE + '/api/profile/callback',
    },
  })
);
app.get('/api/profile/callback', async (req, res) =>
  res.oidc.callback({
    redirectUri: process.env.AUTH0_AUDIENCE + '/api/profile/callback',
  })
);
app.post(
  '/api/profile/callback',
  express.urlencoded({ extended: false }),
  async (req, res) =>
    res.oidc.callback({
      redirectUri: process.env.AUTH0_AUDIENCE + '/api/profile/callback',
    })
);
// STATIC ASSETS OTHER THAN /a
app.use(express.static('pages'));
app.use(_session);
app.get('/api/protected', (rq, rs) => {
  rs.send({ status: 'you are authenticated!', user: rq.oidc.user });
});
// STATIC ASSETS OF THE APP
app.use('/a', express.static('a', { fallthrough: true }));
app.get('/a/*', (_, res) => {
  res.sendFile(path.join(__dirname, './a/index.html'));
});
app.use(express.json());
app.use('/api', require('./src/routes/api_routes.js'));

// START LISTENNING
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`-http- listening @:${process.env.PORT || 5000}`);
});
// START WS
newWebSocket(server);
