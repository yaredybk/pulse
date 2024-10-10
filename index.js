require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { auth, requiresAuth } = require('express-openid-connect');
const helmet = require('helmet');
const WebSocket = require('ws');
// const { _rd } = require('./utils/redis');/
const { newWebSocket } = require('./utils/webSocket');
const { _db } = require('./utils/db');
const { _session } = require('./utils/session');
// const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
// const checkJwt = auth({
//   audience: process.env.AUTH0_AUDIENCE,
//   issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
//   secret: process.env.AUTH0_SECRET,
//   tokenSigningAlg: 'HS256',
// });

const app = express();
app.set('env', process.env.NODE_ENV || 'production');
app.use(helmet());
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_AUDIENCE,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};
app.use(async (rq, rs, nx) => {
  console.warn('->', rq.url);
  // console.warn(rq.oidc.user);
  nx();
});

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(
  auth({
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
app.use(express.static('pages'));
app.use(_session);
app.get('/api/protected', (rq, rs) => {
  rs.send({ status: 'you are authenticated!', user: rq.oidc.user });
});
app.use('/a', express.static('a', { fallthrough: true }));
app.get('/a/*', (_, res) => {
  res.sendFile(path.join(__dirname, './a/index.html'));
});
app.use(express.json());
app.use('/api', require('./src/routes/api_routes.js'));
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`-http- listening @:${process.env.PORT || 5000}`);
});

newWebSocket(server, () => newWebSocket(server));

// _db.query("create database main;").then(console.log).catch(console.warn);
