const fileUpload = require('express-fileupload');
require('dotenv').config();
const path = require('path');
const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');
const helmet = require('helmet');
const { _rdAuth } = require('./utils/auth0.js');
const jwt = require('jsonwebtoken');
const { _upsertUser } = require('./utils/db.js');
const { _session, _upgradeSession } = require('./utils/session.js');
const { newWebSocket } = require('./utils/webSocket.js');

const app = express();
app.set('env', process.env.NODE_ENV || 'production');

// Use Helmet for security headers
app.use(helmet());
// Configure Helmet's contentSecurityPolicy
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'img-src': [
        "'self'",
        'https://lh3.googleusercontent.com',
        'https://s.gravatar.com',
        'https://i.ibb.co',
        'https://i1.wp.com/cdn.auth0.com',
      ],
    },
  }),
);
// STATIC ASSETS OTHER THAN /a
app.use(
  express.static('pages', {
    maxAge: '1d', // caching for one week
  }),
);
// STATIC ASSETS OF THE APP
app.use('/a', express.static('a', { fallthrough: true, redirect: true }));
app.get('/a/*', (req, res) => {
  if (path.extname(req.path)) res.sendStatus(404);
  else if (req.accepts('html'))
    res.sendFile(path.join(__dirname, './a/index.html'));
  else res.sendStatus(404);
});

app.use(_session);

/** SIMPLE LOGING */
// const logredis = require('connect-redis').default;
// const _rdLog = new logredis({ client: _rdCli, prefix: 'log' });
// app.use((r, rs, n) => {
//   console.warn(r.url);
// //   _rdLog.all((e, d) => {
// //     console.log(e);
// //     console.log(d);
// //   });
// //   _rdLog.clear();
// //   _rdLog.set(new Date().toLocaleTimeString(), r.url, (e, d) => {
// //     if (e) console.warn(e);
// //   });
//   n();
// });

/** AUTH0 */
app.use(
  auth({
    session: {
      store: _rdAuth,
      // rollingDuration: 3 * 24 * 3600,
    },
    clientAssertionSigningAlg: 'RS256',
    afterCallback: async (req, _, session) => {
      try {
        const decoded = jwt.decode(session.id_token, process.env.AUTH0_SECRET, {
          algorithms: ['HS256'],
        });
        const { name, picture: profile, email, updated_at, ...info } = decoded;
        const { err } = await _upgradeSession(req, {
          name,
          email,
          profile,
          updated_at,
          info,
        });
        if (err) console.warn(err);
      } catch (error) {
        console.warn(error);
      } finally {
        return session;
      }
      // console.log(session);
      // console.log(session.id_token);
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
      logout: false,
    },
  }),
);
app.get('/api/login', (req, res) => {
  // const origin =
  //   process.env.NODE_ENV == 'development'
  //     ? new URL(req.headers.referer || req.headers.host).origin
  //     : process.env.AUTH0_AUDIENCE;
  return res.oidc.login({
    returnTo: process.env.AUTH0_AUDIENCE + '/a/me?callback=login',
    authorizationParams: {
      redirect_uri: process.env.AUTH0_AUDIENCE + '/api/profile/callback',
    },
  });
});
app.get('/api/logout', (req, res) => {
  // const origin =
  //   process.env.NODE_ENV == 'development'
  //     ? new URL(req.headers.referer || req.headers.host).origin
  //     : process.env.AUTH0_AUDIENCE;
  req.session.destroy(function (err) {
    console.warn(err);
  });
  return res.oidc.logout({
    returnTo: process.env.AUTH0_AUDIENCE,
    authorizationParams: {
      redirect_uri: process.env.AUTH0_AUDIENCE + '/a/me?callback=logout',
    },
  });
});
app.get('/api/profile/callback', async (req, res) => {
  // const origin =
  //   process.env.NODE_ENV == 'development'
  //     ? new URL(req.headers.referer || req.headers.host).origin
  //     : process.env.AUTH0_AUDIENCE;
  return res.oidc.callback({
    redirectUri: process.env.AUTH0_AUDIENCE + '/api/profile/callback',
  });
});
app.post(
  '/api/profile/callback',
  express.urlencoded({ extended: false }),
  async (req, res) => {
    // console.log(req.headers.referer, req.headers.host);
    return res.oidc.callback({
      redirectUri: process.env.AUTH0_AUDIENCE + '/api/profile/callback',
    });
  },
);

app.get('/api/protected', (rq, rs) => {
  rs.send({ status: 'you are authenticated!', user: rq.oidc.user });
});
app.get('/api/info/me', requiresAuth(), require('./src/controllers/info').me);
app.use(express.json());
app.use((req, res, next) => {
  if (req.session.iduser && req.oidc.user) return next();
  {
    // console.log(req.session.iduser, req.oidc.user);
    return res.sendStatus(401);
  }
});
app.use('/api/list', requiresAuth(), require('./src/routes/list_routs.js'));
app.use(
  '/api/audio/',
  express.static('audio', {
    maxAge: '7d', // caching for one week
  }),
);
app.use('/api', requiresAuth(), require('./src/routes/api_routes.js'));

// START
setTimeout(() => {
  // START HTTP SERVER
  const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`-http- listening @:${process.env.PORT || 5000}`);
  });
  // START WS SERVER
  newWebSocket(server);
}, 0);
